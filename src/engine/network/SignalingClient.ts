/**
 * kokoro — Signaling Client
 * Socket.IO ベースのシグナリング（ルーム管理・状態同期）
 * 
 * 本番環境ではSocket.IOサーバーと通信するが、
 * デモ/ローカル開発時はローカルのモック同期を使用
 */

import type {
  AvatarStateDelta,
  Participant,
  ReactionEvent,
  SyncMessage,
  SyncMessageType,
} from '@/types/kokoro';
import { SpacePhase } from '@/types/kokoro';

type MessageHandler = (message: SyncMessage) => void;

/**
 * シグナリングクライアント
 * ローカルデモモードでは実際の通信なしにイベントをシミュレート
 */
export class SignalingClient {
  private handlers: Map<SyncMessageType | string, MessageHandler[]> = new Map();
  private localParticipantId: string;
  private isConnected = false;

  constructor(participantId: string) {
    this.localParticipantId = participantId;
  }

  /**
   * シグナリングサーバーに接続（デモモードではローカルシミュレーション）
   */
  async connect(_serverUrl?: string): Promise<void> {
    // Demo mode: simulated connection
    this.isConnected = true;
    console.log('[SignalingClient] Connected (demo mode)');
  }

  /**
   * ルームに参加
   */
  joinRoom(roomId: string, participant: Participant): void {
    if (!this.isConnected) return;
    
    this.emit({
      type: 'join' as SyncMessageType,
      senderId: this.localParticipantId,
      timestamp: Date.now(),
      payload: { roomId, participant },
    });
  }

  /**
   * アバター状態の差分を送信（30fps）
   */
  sendAvatarState(delta: AvatarStateDelta): void {
    if (!this.isConnected) return;

    this.emit({
      type: 'avatar_state' as SyncMessageType,
      senderId: this.localParticipantId,
      timestamp: Date.now(),
      payload: delta,
    });
  }

  /**
   * リアクション送信
   */
  sendReaction(event: ReactionEvent): void {
    if (!this.isConnected) return;

    this.emit({
      type: 'reaction' as SyncMessageType,
      senderId: this.localParticipantId,
      timestamp: Date.now(),
      payload: event,
    });
  }

  /**
   * フェーズ変更を通知
   */
  sendPhaseChange(phase: SpacePhase, activeSpeakers: string[]): void {
    if (!this.isConnected) return;

    this.emit({
      type: 'phase_change' as SyncMessageType,
      senderId: this.localParticipantId,
      timestamp: Date.now(),
      payload: { phase, activeSpeakers },
    });
  }

  /**
   * メッセージハンドラーの登録
   */
  on(type: SyncMessageType | string, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);

    return () => {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  }

  /**
   * メッセージ送信
   */
  private emit(message: SyncMessage): void {
    const handlers = this.handlers.get(message.type) ?? [];
    handlers.forEach((fn) => fn(message));
  }

  /**
   * 接続状態
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 切断
   */
  disconnect(): void {
    this.isConnected = false;
    this.handlers.clear();
    console.log('[SignalingClient] Disconnected');
  }
}
