/**
 * kokoro — WebRTC Voice Channel
 * P2P音声チャットエンジン
 * 
 * 設計:
 *   - Socket.IOをシグナリングに使用（SDP offer/answer, ICE candidate交換）
 *   - メッシュ型P2P（各ピアが全員と直接接続）— 8人まではメッシュで十分
 *   - VoiceAnalyzerのMediaStreamを共有（マイクは1回だけ取得）
 *   - リモート音声ストリームはAudioElementで再生
 */

import type { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

interface PeerConnection {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  audioElement: HTMLAudioElement;
  participantId: string;
}

export interface VoiceChannelCallbacks {
  onPeerSpeaking?: (participantId: string, volume: number) => void;
  onPeerConnected?: (participantId: string) => void;
  onPeerDisconnected?: (participantId: string) => void;
}

/**
 * WebRTC P2Pメッシュ音声チャット
 */
export class VoiceChannel {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerConnection>();
  private callbacks: VoiceChannelCallbacks;
  private localParticipantId: string | null = null;
  private analyserNodes = new Map<string, { analyser: AnalyserNode; audioCtx: AudioContext }>();
  private volumeRafId: number = 0;

  constructor(callbacks: VoiceChannelCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Socket.IOインスタンスを設定（StateSyncEngineと共有）
   */
  setSocket(socket: Socket): void {
    this.socket = socket;
    this.setupSignaling();
  }

  /**
   * ローカルParticipantIDを設定
   */
  setLocalParticipantId(id: string): void {
    this.localParticipantId = id;
  }

  /**
   * ローカルマイクストリームを設定（VoiceAnalyzerと共有）
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    // 既存のピア接続にトラックを追加
    this.peers.forEach((peer) => {
      stream.getAudioTracks().forEach((track) => {
        peer.pc.addTrack(track, stream);
      });
    });
  }

  /**
   * 新しいピアに接続開始（offerを送る側）
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) return;
    const peer = this.createPeerConnection(peerId);
    
    // Offer作成
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    
    this.socket?.emit('webrtc:offer', {
      targetId: peerId,
      sdp: peer.pc.localDescription,
    });
  }

  /**
   * ピアから切断
   */
  disconnectFromPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    peer.pc.close();
    peer.audioElement.pause();
    peer.audioElement.srcObject = null;
    
    // Analyser cleanup
    const analyserInfo = this.analyserNodes.get(peerId);
    if (analyserInfo) {
      analyserInfo.audioCtx.close().catch(() => {});
      this.analyserNodes.delete(peerId);
    }
    
    this.peers.delete(peerId);
    this.callbacks.onPeerDisconnected?.(peerId);
  }

  /**
   * マイクのミュート切替
   */
  setMuted(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  /**
   * シグナリングイベント設定
   */
  private setupSignaling(): void {
    if (!this.socket) return;

    // Offer受信 → Answer返送
    this.socket.on('webrtc:offer', async (data: { fromId: string; sdp: RTCSessionDescriptionInit }) => {
      const peer = this.peers.get(data.fromId) ?? this.createPeerConnection(data.fromId);
      
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      
      this.socket?.emit('webrtc:answer', {
        targetId: data.fromId,
        sdp: peer.pc.localDescription,
      });
    });

    // Answer受信
    this.socket.on('webrtc:answer', async (data: { fromId: string; sdp: RTCSessionDescriptionInit }) => {
      const peer = this.peers.get(data.fromId);
      if (!peer) return;
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    // ICE候補受信
    this.socket.on('webrtc:ice-candidate', async (data: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const peer = this.peers.get(data.fromId);
      if (!peer) return;
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.warn('[VoiceChannel] Failed to add ICE candidate:', e);
      }
    });
  }

  /**
   * PeerConnection作成
   */
  private createPeerConnection(peerId: string): PeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const remoteStream = new MediaStream();
    const audioElement = new Audio();
    audioElement.autoplay = true;
    audioElement.srcObject = remoteStream;
    // モバイルSafari対策: 無音再生してからremoteStreamをセット
    audioElement.play().catch(() => {});

    const peer: PeerConnection = { pc, remoteStream, audioElement, participantId: peerId };
    this.peers.set(peerId, peer);

    // ローカルストリームのトラックを追加
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // リモートトラック受信
    pc.ontrack = (event) => {
      event.streams[0]?.getAudioTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      audioElement.srcObject = remoteStream;
      audioElement.play().catch(() => {});
      
      // リモート音声を解析（話者検出用）
      this.setupRemoteAnalyser(peerId, remoteStream);
    };

    // ICE候補送信
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('webrtc:ice-candidate', {
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // 接続状態変化
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.callbacks.onPeerConnected?.(peerId);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.disconnectFromPeer(peerId);
      }
    };

    return peer;
  }

  /**
   * リモート音声のAnalyserNodeを設定（話者音量検出用）
   */
  private setupRemoteAnalyser(peerId: string, stream: MediaStream): void {
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyserNodes.set(peerId, { analyser, audioCtx });
      
      // 音量監視ループ開始（まだ動いていなければ）
      if (!this.volumeRafId) {
        this.startVolumeMonitor();
      }
    } catch (e) {
      console.warn('[VoiceChannel] Failed to setup remote analyser:', e);
    }
  }

  /**
   * 全リモートピアの音量を監視
   */
  private startVolumeMonitor(): void {
    const monitor = () => {
      this.analyserNodes.forEach(({ analyser }, peerId) => {
        const data = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);
        const volume = Math.min(1, rms * 5);
        this.callbacks.onPeerSpeaking?.(peerId, volume);
      });
      this.volumeRafId = requestAnimationFrame(monitor);
    };
    this.volumeRafId = requestAnimationFrame(monitor);
  }

  /**
   * 全接続を閉じる
   */
  dispose(): void {
    if (this.volumeRafId) {
      cancelAnimationFrame(this.volumeRafId);
      this.volumeRafId = 0;
    }
    this.peers.forEach((_, peerId) => this.disconnectFromPeer(peerId));
    this.peers.clear();
    this.analyserNodes.forEach(({ audioCtx }) => audioCtx.close().catch(() => {}));
    this.analyserNodes.clear();
  }

  /**
   * 接続中のピア数
   */
  get connectedPeerCount(): number {
    return this.peers.size;
  }
}
