/**
 * cocoro - VoiceService
 * WebRTC P2P voice calling via PeerJS
 * Handles: peer creation, room joining, audio streams, volume analysis
 */

import Peer from 'peerjs';
import type { MediaConnection, DataConnection } from 'peerjs';

export interface VoicePeer {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
  connection: MediaConnection | null;
  dataConnection: DataConnection | null;
  volume: number;
  isSpeaking: boolean;
}

type OnPeerJoined = (peer: VoicePeer) => void;
type OnPeerLeft = (peerId: string) => void;
type OnVolumeUpdate = (peerId: string, volume: number, isSpeaking: boolean) => void;

class VoiceService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private peers: Map<string, VoicePeer> = new Map();
  private roomId: string | null = null;
  private displayName: string = '';
  private isMuted: boolean = false;
  private volumeAnalyzers: Map<string, { ctx: AudioContext; analyzer: AnalyserNode; interval: number }> = new Map();
  private localAnalyzer: { ctx: AudioContext; analyzer: AnalyserNode; interval: number } | null = null;

  // Callbacks
  onPeerJoined: OnPeerJoined | null = null;
  onPeerLeft: OnPeerLeft | null = null;
  onVolumeUpdate: OnVolumeUpdate | null = null;
  onLocalVolumeUpdate: ((volume: number, isSpeaking: boolean) => void) | null = null;
  onConnectionStateChange: ((state: 'connecting' | 'connected' | 'disconnected') => void) | null = null;

  get peerId(): string | null {
    return this.peer?.id ?? null;
  }

  get connectedPeers(): VoicePeer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Initialize and join a voice room
   */
  async joinRoom(roomId: string, displayName: string): Promise<void> {
    this.roomId = roomId;
    this.displayName = displayName;
    this.onConnectionStateChange?.('connecting');

    // Get microphone
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw new Error('マイクのアクセスが拒否されました');
    }

    // Create PeerJS peer with room-prefixed ID
    const peerId = `cocoro-${roomId}-${crypto.randomUUID().substring(0, 8)}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            // Free TURN server for NAT traversal
            {
              urls: 'turn:a.relay.metered.ca:80',
              username: 'cocoro',
              credential: 'cocoro-turn-2026',
            },
            {
              urls: 'turn:a.relay.metered.ca:443',
              username: 'cocoro',
              credential: 'cocoro-turn-2026',
            },
          ],
        },
      });

      this.peer.on('open', (id) => {
        console.log('PeerJS connected, ID:', id);
        this.onConnectionStateChange?.('connected');
        this.startLocalVolumeAnalysis();
        resolve();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });

      // Handle incoming calls
      this.peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        call.answer(this.localStream!);
        this.handleMediaConnection(call);
      });

      // Handle incoming data connections (for name exchange)
      this.peer.on('connection', (conn) => {
        conn.on('data', (data: unknown) => {
          const msg = data as { type: string; displayName?: string };
          if (msg.type === 'hello' && msg.displayName) {
            const existing = this.peers.get(conn.peer);
            if (existing) {
              existing.displayName = msg.displayName;
              existing.dataConnection = conn;
            }
          }
        });
      });
    });
  }

  /**
   * Connect to another peer in the room
   */
  connectToPeer(remotePeerId: string): void {
    if (!this.peer || !this.localStream) return;
    if (remotePeerId === this.peer.id) return;
    if (this.peers.has(remotePeerId)) return;

    console.log('Calling peer:', remotePeerId);

    // Send audio
    const call = this.peer.call(remotePeerId, this.localStream);
    this.handleMediaConnection(call);

    // Send name via data channel
    const conn = this.peer.connect(remotePeerId);
    conn.on('open', () => {
      conn.send({ type: 'hello', displayName: this.displayName });
    });
  }

  /**
   * Discover and connect to other peers in the same room
   * Uses PeerJS list (limited) + manual peer ID exchange via localStorage for demo
   */
  async discoverPeers(): Promise<void> {
    if (!this.peer || !this.roomId) return;

    // For demo: store peer IDs in localStorage so other tabs can find them
    const key = `cocoro-room-peers-${this.roomId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];

    // Connect to all existing peers
    for (const pid of existing) {
      if (pid !== this.peer.id) {
        this.connectToPeer(pid);
      }
    }

    // Add ourselves
    if (!existing.includes(this.peer.id)) {
      existing.push(this.peer.id);
      localStorage.setItem(key, JSON.stringify(existing));
    }

    // Poll for new peers every 3 seconds
    this.discoveryInterval = window.setInterval(() => {
      const current = JSON.parse(localStorage.getItem(key) || '[]') as string[];
      for (const pid of current) {
        if (pid !== this.peer?.id && !this.peers.has(pid)) {
          this.connectToPeer(pid);
        }
      }
    }, 3000);
  }

  private discoveryInterval: number = 0;

  private handleMediaConnection(call: MediaConnection): void {
    const vp: VoicePeer = {
      peerId: call.peer,
      displayName: call.peer.substring(0, 8),
      stream: null,
      audioElement: null,
      connection: call,
      dataConnection: null,
      volume: 0,
      isSpeaking: false,
    };
    this.peers.set(call.peer, vp);

    call.on('stream', (remoteStream) => {
      console.log('Received stream from:', call.peer);
      vp.stream = remoteStream;

      // Play audio
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = 1.0;
      audio.play().catch(console.error);
      vp.audioElement = audio;

      // Start volume analysis
      this.startVolumeAnalysis(call.peer, remoteStream);

      this.onPeerJoined?.(vp);
    });

    call.on('close', () => {
      this.removePeer(call.peer);
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      this.removePeer(call.peer);
    });
  }

  private startVolumeAnalysis(peerId: string, stream: MediaStream): void {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.5;
      source.connect(analyzer);

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const interval = window.setInterval(() => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const volume = Math.min(1, avg / 80);
        const isSpeaking = volume > 0.05;

        const peer = this.peers.get(peerId);
        if (peer) {
          peer.volume = volume;
          peer.isSpeaking = isSpeaking;
        }

        this.onVolumeUpdate?.(peerId, volume, isSpeaking);
      }, 100);

      this.volumeAnalyzers.set(peerId, { ctx, analyzer, interval });
    } catch (err) {
      console.error('Volume analysis error:', err);
    }
  }

  private startLocalVolumeAnalysis(): void {
    if (!this.localStream) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(this.localStream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.5;
      source.connect(analyzer);

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const interval = window.setInterval(() => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const volume = Math.min(1, avg / 80);
        const isSpeaking = volume > 0.05;

        this.onLocalVolumeUpdate?.(volume, isSpeaking);
      }, 100);

      this.localAnalyzer = { ctx, analyzer, interval };
    } catch (err) {
      console.error('Local volume analysis error:', err);
    }
  }

  private removePeer(peerId: string): void {
    const vp = this.peers.get(peerId);
    if (vp) {
      vp.audioElement?.pause();
      vp.connection?.close();
      vp.dataConnection?.close();
    }

    const va = this.volumeAnalyzers.get(peerId);
    if (va) {
      clearInterval(va.interval);
      va.ctx.close().catch(() => {});
      this.volumeAnalyzers.delete(peerId);
    }

    this.peers.delete(peerId);
    this.onPeerLeft?.(peerId);
  }

  /**
   * Toggle mute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Leave room and cleanup
   */
  leaveRoom(): void {
    // Remove from discovery
    if (this.roomId && this.peer) {
      const key = `cocoro-room-peers-${this.roomId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
      const updated = existing.filter(pid => pid !== this.peer?.id);
      if (updated.length > 0) {
        localStorage.setItem(key, JSON.stringify(updated));
      } else {
        localStorage.removeItem(key);
      }
    }

    // Stop discovery
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = 0;
    }

    // Stop local volume analysis
    if (this.localAnalyzer) {
      clearInterval(this.localAnalyzer.interval);
      this.localAnalyzer.ctx.close().catch(() => {});
      this.localAnalyzer = null;
    }

    // Disconnect all peers
    for (const [peerId] of this.peers) {
      this.removePeer(peerId);
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Destroy peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.roomId = null;
    this.onConnectionStateChange?.('disconnected');
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    this.leaveRoom();
  }
}

// Singleton
export const voiceService = new VoiceService();
