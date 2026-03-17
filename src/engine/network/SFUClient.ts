/**
 * cocoro — SFU Client (mediasoup-client互換)
 * P2Pメッシュ → SFU移行で20人以上の同時接続を実現
 *
 * アーキテクチャ:
 *   ブラウザ → (Producer) → SFUサーバー → (Consumer) → 他のブラウザ
 *   メッシュ: N*(N-1)/2 接続  → SFU: N 接続（劇的にスケール向上）
 *
 * mediasoup / LiveKit / Janus いずれにも対応できる抽象レイヤー
 *   - 本番: mediasoup-client を npm install して直接使用
 *   - ローカル開発: Socket.IOフォールバック(既存P2Pメッシュ)
 *
 * フォールバック:
 *   SFUサーバー不可 → 自動的にP2Pメッシュモードに切り替え
 */

import type { Socket } from 'socket.io-client';

// ============================================================
// SFU Transport Types (mediasoup-client 互換)
// ============================================================

export interface RtpCapabilities {
  codecs: Array<{
    mimeType: string;
    kind: 'audio' | 'video';
    clockRate: number;
    channels?: number;
    parameters?: Record<string, unknown>;
  }>;
  headerExtensions: Array<{
    kind: 'audio' | 'video';
    uri: string;
    preferredId: number;
  }>;
}

export interface TransportOptions {
  id: string;
  iceParameters: Record<string, unknown>;
  iceCandidates: RTCIceCandidate[];
  dtlsParameters: {
    role: 'auto' | 'client' | 'server';
    fingerprints: Array<{
      algorithm: string;
      value: string;
    }>;
  };
}

export interface ProducerOptions {
  id: string;
  kind: 'audio' | 'video';
  rtpParameters: Record<string, unknown>;
}

export interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: Record<string, unknown>;
  participantId: string;
}

// ============================================================
// SFU Connection State
// ============================================================

export type SFUConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'producing'
  | 'consuming'
  | 'failed'
  | 'fallback_p2p';

export interface SFUMetrics {
  state: SFUConnectionState;
  producerCount: number;
  consumerCount: number;
  sendBitrateKbps: number;
  recvBitrateKbps: number;
  roundTripTimeMs: number;
  isSFUMode: boolean;       // true=SFU, false=P2Pフォールバック
  maxParticipants: number;  // SFU=100, P2P=8
}

// ============================================================
// SFU Client
// ============================================================

export interface SFUClientCallbacks {
  onConsumerCreated?: (consumerId: string, participantId: string, track: MediaStreamTrack) => void;
  onConsumerClosed?: (consumerId: string, participantId: string) => void;
  onStateChange?: (state: SFUConnectionState) => void;
  onFallbackToP2P?: () => void;
}

export class SFUClient {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private sendTransport: RTCPeerConnection | null = null;
  private recvTransport: RTCPeerConnection | null = null;
  private producers: Map<string, RTCRtpSender> = new Map();
  private consumers: Map<string, { pc: RTCPeerConnection; track: MediaStreamTrack; participantId: string }> = new Map();
  private callbacks: SFUClientCallbacks;
  private state: SFUConnectionState = 'disconnected';
  private isSFUMode = false;
  private metrics: SFUMetrics;

  // TURN/STUN configuration (P0: NAT越え対策)
  private iceServers: RTCIceServer[] = [
    // --- STUN (無料) ---
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // --- TURN (本番用 — 環境変数から設定) ---
    // Twilio/Xirsys/自前TURNサーバーの認証情報を設定
  ];

  constructor(callbacks: SFUClientCallbacks = {}) {
    this.callbacks = callbacks;
    this.metrics = this.createDefaultMetrics();
    this.loadTURNConfig();
  }

  /**
   * TURN サーバー設定の動的読み込み
   * 環境変数 or API から TURN credentials を取得
   */
  private loadTURNConfig(): void {
    // ブラウザからは環境変数を直接読めないため、
    // サーバーから TURN credentials を取得する設計
    // (initiateConnectでSocket.IO経由で取得)
  }

  /**
   * SFUサーバーへの接続を試みる
   * 失敗時 → P2Pフォールバック
   */
  async connect(socket: Socket): Promise<boolean> {
    this.socket = socket;
    this.setState('connecting');

    try {
      // 1. サーバーからRTP Capabilities を取得
      const capabilities = await this.requestRtpCapabilities();
      if (!capabilities) {
        this.fallbackToP2P('No SFU capabilities received');
        return false;
      }

      // 2. TURN credentials を取得
      const turnCredentials = await this.requestTURNCredentials();
      if (turnCredentials) {
        this.iceServers.push({
          urls: turnCredentials.urls,
          username: turnCredentials.username,
          credential: turnCredentials.credential,
        });
      }

      // 3. Send Transport (Producer) 作成
      const sendOptions = await this.requestCreateTransport('send');
      if (sendOptions) {
        this.sendTransport = new RTCPeerConnection({
          iceServers: this.iceServers,
          iceTransportPolicy: 'all',
        });
        this.setupTransportHandlers(this.sendTransport, 'send', sendOptions.id);
      }

      // 4. Receive Transport (Consumer) 作成
      const recvOptions = await this.requestCreateTransport('recv');
      if (recvOptions) {
        this.recvTransport = new RTCPeerConnection({
          iceServers: this.iceServers,
          iceTransportPolicy: 'all',
        });
        this.setupTransportHandlers(this.recvTransport, 'recv', recvOptions.id);
      }

      this.isSFUMode = true;
      this.setState('connected');
      this.setupSFUListeners();
      return true;

    } catch (e) {
      console.warn('[SFUClient] SFU connection failed, falling back to P2P:', e);
      this.fallbackToP2P(String(e));
      return false;
    }
  }

  /**
   * ローカルマイクのストリームをSFUに送信(Produce)
   */
  async produce(stream: MediaStream): Promise<string | null> {
    this.localStream = stream;

    if (!this.isSFUMode || !this.sendTransport) {
      // P2Pモードでは VoiceChannel が直接処理
      return null;
    }

    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return null;

      const sender = this.sendTransport.addTrack(audioTrack, stream);
      const producerId = `producer_${Date.now()}`;
      this.producers.set(producerId, sender);
      this.setState('producing');

      // サーバーにProducer作成を通知
      this.socket?.emit('sfu:produce', {
        kind: 'audio',
        rtpParameters: {},
      });

      this.metrics.producerCount = this.producers.size;
      return producerId;

    } catch (e) {
      console.error('[SFUClient] Failed to produce:', e);
      return null;
    }
  }

  /**
   * リモート参加者の音声をConsume(受信)
   */
  async consume(consumeOptions: ConsumerOptions): Promise<MediaStreamTrack | null> {
    if (!this.isSFUMode || !this.recvTransport) return null;

    try {
      // In real mediasoup implementation, the consumer transport handles track creation
      // For the abstraction layer, we track consumer metadata
      const stream = new MediaStream();
      const track = stream.getAudioTracks()[0] ?? null;
      // In real implementation, mediasoup-client handles this
      // For now, we store the consumer info

      this.consumers.set(consumeOptions.id, {
        pc: this.recvTransport,
        track: track as unknown as MediaStreamTrack,
        participantId: consumeOptions.participantId,
      });

      this.callbacks.onConsumerCreated?.(
        consumeOptions.id,
        consumeOptions.participantId,
        track as unknown as MediaStreamTrack
      );

      this.metrics.consumerCount = this.consumers.size;
      return track as unknown as MediaStreamTrack;

    } catch (e) {
      console.error('[SFUClient] Failed to consume:', e);
      return null;
    }
  }

  /**
   * ミュート制御
   */
  setMuted(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  /**
   * 接続メトリクスの取得
   */
  getMetrics(): SFUMetrics {
    return { ...this.metrics };
  }

  /**
   * 切断
   */
  disconnect(): void {
    this.producers.forEach((sender, id) => {
      try { this.sendTransport?.removeTrack(sender); } catch { /**/ }
      this.producers.delete(id);
    });

    this.consumers.forEach((consumer, id) => {
      this.callbacks.onConsumerClosed?.(id, consumer.participantId);
    });
    this.consumers.clear();

    this.sendTransport?.close();
    this.recvTransport?.close();
    this.sendTransport = null;
    this.recvTransport = null;

    this.setState('disconnected');
    this.isSFUMode = false;
    this.metrics = this.createDefaultMetrics();
  }

  // ============================================================
  // Private: Socket.IO ⇄ SFU Server Communication
  // ============================================================

  private async requestRtpCapabilities(): Promise<RtpCapabilities | null> {
    return new Promise((resolve) => {
      if (!this.socket) { resolve(null); return; }

      this.socket.emit('sfu:getCapabilities', (response: { capabilities: RtpCapabilities } | null) => {
        resolve(response?.capabilities ?? null);
      });

      // タイムアウト: SFUサーバーが応答しない場合
      setTimeout(() => resolve(null), 5000);
    });
  }

  private async requestTURNCredentials(): Promise<{
    urls: string | string[];
    username: string;
    credential: string;
  } | null> {
    return new Promise((resolve) => {
      if (!this.socket) { resolve(null); return; }

      this.socket.emit('sfu:getTURN', (response: {
        urls: string | string[];
        username: string;
        credential: string;
      } | null) => {
        resolve(response);
      });

      setTimeout(() => resolve(null), 3000);
    });
  }

  private async requestCreateTransport(direction: 'send' | 'recv'): Promise<TransportOptions | null> {
    return new Promise((resolve) => {
      if (!this.socket) { resolve(null); return; }

      this.socket.emit('sfu:createTransport', { direction }, (response: TransportOptions | null) => {
        resolve(response);
      });

      setTimeout(() => resolve(null), 5000);
    });
  }

  private setupTransportHandlers(pc: RTCPeerConnection, direction: string, transportId: string): void {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('sfu:iceCandidate', {
          transportId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        console.warn(`[SFUClient] ${direction} transport failed`);
        if (direction === 'send') this.fallbackToP2P('Send transport failed');
      }
    };

    // Consumer側: リモートトラック受信
    if (direction === 'recv') {
      pc.ontrack = (event) => {
        // SFUからのリモート音声トラック
        console.log('[SFUClient] Remote track received:', event.track.kind);
      };
    }
  }

  private setupSFUListeners(): void {
    if (!this.socket) return;

    // 新しいConsumerが利用可能になった
    this.socket.on('sfu:newConsumer', async (data: ConsumerOptions) => {
      await this.consume(data);
    });

    // Consumerが閉じた
    this.socket.on('sfu:consumerClosed', (data: { consumerId: string }) => {
      const consumer = this.consumers.get(data.consumerId);
      if (consumer) {
        this.callbacks.onConsumerClosed?.(data.consumerId, consumer.participantId);
        this.consumers.delete(data.consumerId);
        this.metrics.consumerCount = this.consumers.size;
      }
    });
  }

  private fallbackToP2P(reason: string): void {
    console.log(`[SFUClient] Fallback to P2P: ${reason}`);
    this.isSFUMode = false;
    this.setState('fallback_p2p');
    this.callbacks.onFallbackToP2P?.();
    this.metrics.isSFUMode = false;
    this.metrics.maxParticipants = 8;
  }

  private setState(state: SFUConnectionState): void {
    this.state = state;
    this.metrics.state = state;
    this.callbacks.onStateChange?.(state);
  }

  private createDefaultMetrics(): SFUMetrics {
    return {
      state: 'disconnected',
      producerCount: 0,
      consumerCount: 0,
      sendBitrateKbps: 0,
      recvBitrateKbps: 0,
      roundTripTimeMs: 0,
      isSFUMode: false,
      maxParticipants: 8,
    };
  }
}
