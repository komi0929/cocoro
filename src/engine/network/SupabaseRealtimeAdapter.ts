/**
 * kokoro — Supabase Realtime Adapter
 * Socket.IOサーバー不要でWebRTC + 状態同期を実現
 *
 * Supabase Realtime Broadcastを使用:
 *   - webrtc:offer / webrtc:answer / webrtc:ice → P2P音声チャット
 *   - avatar:state → アバター状態30fps同期
 *   - participant:joined / participant:left → 入退室
 *   - phase:update → フェーズ変更
 *   - reaction:send → リアクション
 */

'use client';

import { getSupabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Participant, AvatarTransform, SpeakingState, EmotionState } from '@/types/kokoro';
import { SpacePhase } from '@/types/kokoro';

// ===== Interfaces =====

export interface RealtimeCallbacks {
  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participantId: string) => void;
  onAvatarStateUpdate: (participantId: string, partial: Partial<Participant>) => void;
  onPhaseChange: (phase: SpacePhase, activeSpeakers: string[], density: number) => void;
  onReaction: (participantId: string, type: string, timestamp: number) => void;
  onWebRTCOffer: (fromId: string, sdp: RTCSessionDescriptionInit) => void;
  onWebRTCAnswer: (fromId: string, sdp: RTCSessionDescriptionInit) => void;
  onWebRTCIceCandidate: (fromId: string, candidate: RTCIceCandidateInit) => void;
}

const DEFAULT_PARTICIPANT: Participant = {
  id: '',
  displayName: '',
  vrmUrl: null,
  avatarId: 'seed-san',
  isGuest: true,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAtTarget: null,
  },
  speakingState: {
    isSpeaking: false,
    volume: 0,
    pitch: 0,
    currentViseme: 'sil',
    visemeWeight: 0,
  },
  emotion: { joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1 },
};

/**
 * Supabase Realtime Channelを使った同期アダプタ
 * Socket.IOサーバー不要 — Supabase のインフラだけで動作
 */
export class SupabaseRealtimeAdapter {
  private channel: RealtimeChannel | null = null;
  private callbacks: RealtimeCallbacks;
  private localId: string;
  private roomId: string;
  private sendInterval: ReturnType<typeof setInterval> | null = null;

  // 送信バッファ
  private pendingTransform: AvatarTransform | null = null;
  private pendingSpeaking: SpeakingState | null = null;
  private pendingEmotion: EmotionState | null = null;

  constructor(
    roomId: string,
    localId: string,
    callbacks: RealtimeCallbacks
  ) {
    this.roomId = roomId;
    this.localId = localId;
    this.callbacks = callbacks;
  }

  /**
   * ルームチャンネルに参加
   */
  async join(displayName: string, avatarId: string): Promise<void> {
    const supabase = getSupabase();
    const channelName = `room:${this.roomId}`;

    this.channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    // ─── Broadcast listeners ───

    // 参加者入室
    this.channel.on('broadcast', { event: 'participant:joined' }, (payload) => {
      const data = payload.payload as { participant: Participant };
      this.callbacks.onParticipantJoined(data.participant);
    });

    // 参加者退室
    this.channel.on('broadcast', { event: 'participant:left' }, (payload) => {
      const data = payload.payload as { participantId: string };
      this.callbacks.onParticipantLeft(data.participantId);
    });

    // アバター状態
    this.channel.on('broadcast', { event: 'avatar:state' }, (payload) => {
      const data = payload.payload as {
        pid: string;
        transform?: AvatarTransform;
        speaking?: SpeakingState;
        emotion?: EmotionState;
      };
      if (data.pid === this.localId) return;

      const partial: Partial<Participant> = {};
      if (data.transform) partial.transform = data.transform;
      if (data.speaking) partial.speakingState = data.speaking;
      if (data.emotion) partial.emotion = data.emotion;

      this.callbacks.onAvatarStateUpdate(data.pid, partial);
    });

    // フェーズ変更
    this.channel.on('broadcast', { event: 'phase:update' }, (payload) => {
      const data = payload.payload as {
        phase: string;
        activeSpeakers: string[];
        density: number;
      };
      const phase = SpacePhase[data.phase as keyof typeof SpacePhase] ?? SpacePhase.SILENCE;
      this.callbacks.onPhaseChange(phase, data.activeSpeakers, data.density);
    });

    // リアクション
    this.channel.on('broadcast', { event: 'reaction:send' }, (payload) => {
      const data = payload.payload as {
        participantId: string;
        type: string;
        timestamp: number;
      };
      this.callbacks.onReaction(data.participantId, data.type, data.timestamp);
    });

    // ─── WebRTC Signaling ───

    this.channel.on('broadcast', { event: 'webrtc:offer' }, (payload) => {
      const data = payload.payload as {
        fromId: string;
        targetId: string;
        sdp: RTCSessionDescriptionInit;
      };
      if (data.targetId === this.localId) {
        this.callbacks.onWebRTCOffer(data.fromId, data.sdp);
      }
    });

    this.channel.on('broadcast', { event: 'webrtc:answer' }, (payload) => {
      const data = payload.payload as {
        fromId: string;
        targetId: string;
        sdp: RTCSessionDescriptionInit;
      };
      if (data.targetId === this.localId) {
        this.callbacks.onWebRTCAnswer(data.fromId, data.sdp);
      }
    });

    this.channel.on('broadcast', { event: 'webrtc:ice-candidate' }, (payload) => {
      const data = payload.payload as {
        fromId: string;
        targetId: string;
        candidate: RTCIceCandidateInit;
      };
      if (data.targetId === this.localId) {
        this.callbacks.onWebRTCIceCandidate(data.fromId, data.candidate);
      }
    });

    // Subscribe
    await this.channel.subscribe();

    // Announce self
    this.channel.send({
      type: 'broadcast',
      event: 'participant:joined',
      payload: {
        participant: {
          ...DEFAULT_PARTICIPANT,
          id: this.localId,
          displayName,
          avatarId,
        },
      },
    });

    // Start 30fps send loop
    this.startSendLoop();
  }

  // ─── Send Methods ───

  sendOffer(targetId: string, sdp: RTCSessionDescriptionInit): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'webrtc:offer',
      payload: { fromId: this.localId, targetId, sdp },
    });
  }

  sendAnswer(targetId: string, sdp: RTCSessionDescriptionInit): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'webrtc:answer',
      payload: { fromId: this.localId, targetId, sdp },
    });
  }

  sendIceCandidate(targetId: string, candidate: RTCIceCandidateInit): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'webrtc:ice-candidate',
      payload: { fromId: this.localId, targetId, candidate },
    });
  }

  sendReaction(type: string): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'reaction:send',
      payload: {
        participantId: this.localId,
        type,
        timestamp: Date.now(),
      },
    });
  }

  sendPhaseUpdate(phase: SpacePhase, activeSpeakers: string[]): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'phase:update',
      payload: {
        phase: SpacePhase[phase],
        activeSpeakers,
        density: activeSpeakers.length,
      },
    });
  }

  /**
   * ローカル状態をバッファ（次の送信サイクルで送信）
   */
  bufferLocalState(
    transform?: AvatarTransform,
    speaking?: SpeakingState,
    emotion?: EmotionState
  ): void {
    if (transform) this.pendingTransform = transform;
    if (speaking) this.pendingSpeaking = speaking;
    if (emotion) this.pendingEmotion = emotion;
  }

  // ─── 30fps Send Loop ───

  private startSendLoop(): void {
    this.sendInterval = setInterval(() => {
      if (!this.channel) return;

      const hasData = this.pendingTransform || this.pendingSpeaking || this.pendingEmotion;
      if (!hasData) return;

      this.channel.send({
        type: 'broadcast',
        event: 'avatar:state',
        payload: {
          pid: this.localId,
          transform: this.pendingTransform ?? undefined,
          speaking: this.pendingSpeaking ?? undefined,
          emotion: this.pendingEmotion ?? undefined,
        },
      });

      this.pendingTransform = null;
      this.pendingSpeaking = null;
      this.pendingEmotion = null;
    }, 33); // ~30fps
  }

  // ─── Lifecycle ───

  async leave(): Promise<void> {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }

    // Announce leave
    this.channel?.send({
      type: 'broadcast',
      event: 'participant:left',
      payload: { participantId: this.localId },
    });

    const supabase = getSupabase();
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  isConnected(): boolean {
    return this.channel !== null;
  }
}
