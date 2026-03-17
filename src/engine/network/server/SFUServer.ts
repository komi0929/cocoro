/**
 * cocoro — SFU Server Module
 * mediasoup互換のSFUサーバーサイドハンドラ
 *
 * アーキテクチャ:
 *   SignalingServer にアタッチして SFU イベントをハンドリング
 *   本番: mediasoup Worker/Router/Transport を管理
 *   フォールバック: SFU未設定時はP2Pメッシュにパススルー
 *
 * TURN サーバー:
 *   Twilio TURN / coturn / Xirsys から credentials を動的配信
 *   短命トークン(TTL 600s)でセキュリティ確保
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import { createHmac } from 'crypto';

// ============================================================
// TURN Credentials (短命トークン方式)
// ============================================================

export interface TURNConfig {
  /** TURN server URLs (e.g., 'turn:turn.example.com:3478') */
  urls: string[];
  /** 共有シークレット (coturn の static-auth-secret) */
  secret: string;
  /** トークン有効期限 (秒) */
  ttlSeconds: number;
}

/**
 * coturn互換の短命TURN認証情報を生成
 * username = "unix_timestamp:participantId"
 * credential = HMAC-SHA1(secret, username)
 */
export function generateTURNCredentials(
  participantId: string,
  config: TURNConfig
): { urls: string[]; username: string; credential: string } {
  const timestamp = Math.floor(Date.now() / 1000) + config.ttlSeconds;
  const username = `${timestamp}:${participantId}`;
  const credential = createHmac('sha1', config.secret)
    .update(username)
    .digest('base64');

  return {
    urls: config.urls,
    username,
    credential,
  };
}

// ============================================================
// SFU Server Handler
// ============================================================

export interface SFUServerConfig {
  /** SFU有効フラグ (false = P2Pパススルー) */
  enabled: boolean;
  /** mediasoup本体が設定された場合 true */
  hasMediasoup: boolean;
  /** TURN設定 */
  turn?: TURNConfig;
}

export class SFUServerHandler {
  private config: SFUServerConfig;
  private io: SocketIOServer;

  constructor(io: SocketIOServer, config?: Partial<SFUServerConfig>) {
    this.io = io;
    this.config = {
      enabled: config?.enabled ?? false,
      hasMediasoup: config?.hasMediasoup ?? false,
      turn: config?.turn ?? this.getDefaultTURNConfig(),
    };

    console.log(`[SFUServer] Mode: ${this.config.enabled ? 'SFU (mediasoup)' : 'P2P passthrough'}`);
    if (this.config.turn) {
      console.log(`[SFUServer] TURN: ${this.config.turn.urls.join(', ')}`);
    }
  }

  /**
   * Socket接続時のSFUイベントハンドラを設定
   */
  setupHandlers(socket: Socket, participantId: string): void {
    // --- RTP Capabilities ---
    socket.on('sfu:getCapabilities', (ack: (response: unknown) => void) => {
      if (!this.config.enabled) {
        ack(null); // SFU無効 → クライアントはP2Pにフォールバック
        return;
      }

      // mediasoupが設定されている場合は実際のcapabilitiesを返す
      // ここでは基本的なOpus/VP8のcapabilitiesを返す
      ack({
        capabilities: {
          codecs: [
            {
              mimeType: 'audio/opus',
              kind: 'audio',
              clockRate: 48000,
              channels: 2,
              parameters: {
                useinbandfec: 1,
                usedtx: 1,
                'sprop-stereo': 0,
              },
            },
          ],
          headerExtensions: [
            {
              kind: 'audio',
              uri: 'urn:ietf:params:rtp-hdrext:sdes:mid',
              preferredId: 1,
            },
            {
              kind: 'audio',
              uri: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level',
              preferredId: 10,
            },
          ],
        },
      });
    });

    // --- TURN Credentials ---
    socket.on('sfu:getTURN', (ack: (response: unknown) => void) => {
      if (!this.config.turn || this.config.turn.urls.length === 0) {
        ack(null);
        return;
      }

      const creds = generateTURNCredentials(participantId, this.config.turn);
      ack(creds);
    });

    // --- Create Transport ---
    socket.on('sfu:createTransport', (data: { direction: string }, ack: (response: unknown) => void) => {
      if (!this.config.enabled) {
        ack(null);
        return;
      }

      // mediasoup本体が設定されている場合はRouter.createWebRtcTransport()を呼ぶ
      // ここではプレースホルダーのtransport optionsを返す
      ack({
        id: `transport_${data.direction}_${Date.now()}`,
        iceParameters: {},
        iceCandidates: [],
        dtlsParameters: {
          role: 'auto',
          fingerprints: [],
        },
      });
    });

    // --- Produce ---
    socket.on('sfu:produce', (data: { kind: string; rtpParameters: unknown }) => {
      if (!this.config.enabled) return;

      console.log(`[SFUServer] ${participantId} producing ${data.kind}`);

      // mediasoupではtransport.produce()を呼ぶ
      // 新しいProducerを全参加者に通知
      socket.broadcast.emit('sfu:newConsumer', {
        id: `consumer_${Date.now()}`,
        producerId: `producer_${participantId}`,
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        participantId,
      });
    });

    // --- ICE Candidate ---
    socket.on('sfu:iceCandidate', (data: { transportId: string; candidate: RTCIceCandidateInit }) => {
      // mediasoupではtransport.addIceCandidateを呼ぶ
    });
  }

  /**
   * デフォルトのTURN設定（環境変数から読み込み）
   */
  private getDefaultTURNConfig(): TURNConfig | undefined {
    const turnUrls = process.env.TURN_URLS;
    const turnSecret = process.env.TURN_SECRET;

    if (!turnUrls || !turnSecret) return undefined;

    return {
      urls: turnUrls.split(',').map(u => u.trim()),
      secret: turnSecret,
      ttlSeconds: 600, // 10分
    };
  }
}
