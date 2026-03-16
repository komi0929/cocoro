/**
 * kokoro — State Sync Engine (Client-side)
 * 30fps 固定レートでの差分状態送信 + リモート状態受信
 * 帯域最適化: 量子化 + 差分検出 + 不要データの間引き
 */

import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  AvatarStateUpdate,
  AvatarStateBroadcast,
  ParticipantDTO,
  TransformDTO,
  SpeakingStateDTO,
  EmotionDTO,
  RoomJoinRequest,
  RoomInfo,
  PhaseChangePayload,
  ReactionBroadcastPayload,
} from './SyncProtocol';
import { SYNC_CONFIG, visemeToIndex, indexToViseme } from './SyncProtocol';
import type { Participant, AvatarTransform, SpeakingState, EmotionState } from '@/types/kokoro';
import { SpacePhase } from '@/types/kokoro';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ============================================================
// Event Callbacks
// ============================================================

export interface StateSyncCallbacks {
  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participantId: string) => void;
  onAvatarStateUpdate: (participantId: string, participant: Partial<Participant>) => void;
  onPhaseChange: (phase: SpacePhase, activeSpeakers: string[], density: number) => void;
  onReaction: (participantId: string, type: string, timestamp: number) => void;
  onRoomsList: (rooms: RoomInfo[]) => void;
  onError: (code: string, message: string) => void;
}

// ============================================================
// State Sync Engine
// ============================================================

export class StateSyncEngine {
  private socket: TypedSocket | null = null;
  private callbacks: StateSyncCallbacks;
  private sendInterval: ReturnType<typeof setInterval> | null = null;
  private localParticipantId: string | null = null;
  private roomId: string | null = null;

  // 差分検出用: 前回送信した状態のキャッシュ
  private lastSentTransform: TransformDTO | null = null;
  private lastSentSpeaking: SpeakingStateDTO | null = null;
  private lastSentEmotion: EmotionDTO | null = null;

  // 送信バッファ: 最新の状態をバッファし、固定レートで送信
  private pendingTransform: AvatarTransform | null = null;
  private pendingSpeaking: SpeakingState | null = null;
  private pendingEmotion: EmotionState | null = null;

  constructor(callbacks: StateSyncCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Socket.IOサーバーに接続
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      }) as TypedSocket;

      this.socket.on('connect', () => {
        console.log('[StateSyncEngine] Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('[StateSyncEngine] Connection error:', err.message);
        reject(err);
      });

      this.setupEventListeners();
    });
  }

  /**
   * ルームに参加
   */
  async joinRoom(request: RoomJoinRequest): Promise<{
    roomId: string;
    participantId: string;
    participants: Participant[];
  }> {
    if (!this.socket) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      this.socket!.emit('room:join', request, (response) => {
        if (!response.success) {
          reject(new Error(response.error ?? 'Failed to join room'));
          return;
        }

        this.roomId = response.roomId;
        this.localParticipantId = response.participantId;

        // DTOから内部型に変換
        const participants = response.participants.map((dto) => this.dtoToParticipant(dto));

        // 30fpsの状態送信ループを開始
        this.startSendLoop();

        resolve({
          roomId: response.roomId,
          participantId: response.participantId,
          participants,
        });
      });
    });
  }

  /**
   * ルームから退出
   */
  leaveRoom(): void {
    this.stopSendLoop();
    this.socket?.emit('room:leave');
    this.roomId = null;
    this.localParticipantId = null;
    this.lastSentTransform = null;
    this.lastSentSpeaking = null;
    this.lastSentEmotion = null;
  }

  /**
   * ローカルアバターの状態をバッファ（次の送信サイクルで送信される）
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

  /**
   * リアクション送信
   */
  sendReaction(type: string): void {
    this.socket?.emit('reaction:send', { type });
  }

  /**
   * フェーズ更新送信（ホスト用）
   */
  sendPhaseUpdate(phase: SpacePhase, activeSpeakers: string[]): void {
    const phaseStr = phase as 'SILENCE' | 'TRIGGER' | 'GRAVITY';
    this.socket?.emit('phase:update', { phase: phaseStr, activeSpeakers });
  }

  // ============================================================
  // Event Listeners
  // ============================================================

  private setupEventListeners(): void {
    if (!this.socket) return;

    // 参加者の参加
    this.socket.on('participant:joined', (data) => {
      const participant = this.dtoToParticipant(data.participant);
      this.callbacks.onParticipantJoined(participant);
    });

    // 参加者の退出
    this.socket.on('participant:left', (data) => {
      this.callbacks.onParticipantLeft(data.participantId);
    });

    // アバター状態の受信
    this.socket.on('avatar:state', (data: AvatarStateBroadcast) => {
      // 自分自身のは無視
      if (data.pid === this.localParticipantId) return;

      const partial: Partial<Participant> = {};

      if (data.tr) {
        partial.transform = this.transformDTOToInternal(data.tr);
      }
      if (data.sp) {
        partial.speakingState = this.speakingDTOToInternal(data.sp);
      }
      if (data.em) {
        partial.emotion = this.emotionDTOToInternal(data.em);
      }

      this.callbacks.onAvatarStateUpdate(data.pid, partial);
    });

    // フェーズ変更
    this.socket.on('phase:change', (data: PhaseChangePayload) => {
      const phase = SpacePhase[data.phase as keyof typeof SpacePhase];
      this.callbacks.onPhaseChange(phase, data.activeSpeakers, data.density);
    });

    // リアクション
    this.socket.on('reaction:broadcast', (data: ReactionBroadcastPayload) => {
      this.callbacks.onReaction(data.participantId, data.type, data.timestamp);
    });

    // ルーム一覧
    this.socket.on('rooms:list', (data) => {
      this.callbacks.onRoomsList(data.rooms);
    });

    // エラー
    this.socket.on('error', (data) => {
      this.callbacks.onError(data.code, data.message);
    });
  }

  // ============================================================
  // 30fps Fixed-Rate Send Loop
  // ============================================================

  private startSendLoop(): void {
    this.stopSendLoop();

    this.sendInterval = setInterval(() => {
      this.sendBufferedState();
    }, SYNC_CONFIG.STATE_SEND_INTERVAL);
  }

  private stopSendLoop(): void {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }

  /**
   * バッファされた状態を差分として送信
   * 変更がない場合は何も送信しない（帯域節約）
   */
  private sendBufferedState(): void {
    if (!this.socket || !this.localParticipantId) return;

    const update: AvatarStateUpdate = {
      t: Date.now() & 0xFFFFFFFF, // uint32 wrap
    };

    let hasChanges = false;

    // Transform 差分チェック
    if (this.pendingTransform) {
      const dto = this.transformToDTO(this.pendingTransform);
      if (!this.isTransformEqual(dto, this.lastSentTransform)) {
        update.tr = dto;
        this.lastSentTransform = dto;
        hasChanges = true;
      }
      this.pendingTransform = null;
    }

    // Speaking 差分チェック
    if (this.pendingSpeaking) {
      const dto = this.speakingToDTO(this.pendingSpeaking);
      if (!this.isSpeakingEqual(dto, this.lastSentSpeaking)) {
        update.sp = dto;
        this.lastSentSpeaking = dto;
        hasChanges = true;
      }
      this.pendingSpeaking = null;
    }

    // Emotion 差分チェック
    if (this.pendingEmotion) {
      const dto = this.emotionToDTO(this.pendingEmotion);
      if (!this.isEmotionEqual(dto, this.lastSentEmotion)) {
        update.em = dto;
        this.lastSentEmotion = dto;
        hasChanges = true;
      }
      this.pendingEmotion = null;
    }

    if (hasChanges) {
      this.socket.emit('avatar:state', update);
    }
  }

  // ============================================================
  // DTO ⇄ Internal Type Converters (量子化/復元)
  // ============================================================

  private transformToDTO(t: AvatarTransform): TransformDTO {
    return {
      px: Math.round(t.position.x * SYNC_CONFIG.POSITION_SCALE),
      py: Math.round(t.position.y * SYNC_CONFIG.POSITION_SCALE),
      pz: Math.round(t.position.z * SYNC_CONFIG.POSITION_SCALE),
      rx: Math.round(t.rotation.x * SYNC_CONFIG.ROTATION_SCALE),
      ry: Math.round(t.rotation.y * SYNC_CONFIG.ROTATION_SCALE),
      rz: Math.round(t.rotation.z * SYNC_CONFIG.ROTATION_SCALE),
      lx: t.lookAtTarget ? Math.round(t.lookAtTarget.x * SYNC_CONFIG.POSITION_SCALE) : null,
      ly: t.lookAtTarget ? Math.round(t.lookAtTarget.y * SYNC_CONFIG.POSITION_SCALE) : null,
      lz: t.lookAtTarget ? Math.round(t.lookAtTarget.z * SYNC_CONFIG.POSITION_SCALE) : null,
    };
  }

  private transformDTOToInternal(dto: TransformDTO): AvatarTransform {
    return {
      position: {
        x: dto.px / SYNC_CONFIG.POSITION_SCALE,
        y: dto.py / SYNC_CONFIG.POSITION_SCALE,
        z: dto.pz / SYNC_CONFIG.POSITION_SCALE,
      },
      rotation: {
        x: dto.rx / SYNC_CONFIG.ROTATION_SCALE,
        y: dto.ry / SYNC_CONFIG.ROTATION_SCALE,
        z: dto.rz / SYNC_CONFIG.ROTATION_SCALE,
      },
      lookAtTarget: dto.lx !== null && dto.ly !== null && dto.lz !== null
        ? {
            x: dto.lx / SYNC_CONFIG.POSITION_SCALE,
            y: dto.ly / SYNC_CONFIG.POSITION_SCALE,
            z: dto.lz / SYNC_CONFIG.POSITION_SCALE,
          }
        : null,
    };
  }

  private speakingToDTO(s: SpeakingState): SpeakingStateDTO {
    return {
      s: s.isSpeaking,
      v: Math.round(s.volume * SYNC_CONFIG.BYTE_SCALE),
      p: Math.round(s.pitch),
      vi: visemeToIndex(s.currentViseme),
      vw: Math.round(s.visemeWeight * SYNC_CONFIG.BYTE_SCALE),
    };
  }

  private speakingDTOToInternal(dto: SpeakingStateDTO): SpeakingState {
    return {
      isSpeaking: dto.s,
      volume: dto.v / SYNC_CONFIG.BYTE_SCALE,
      pitch: dto.p,
      currentViseme: indexToViseme(dto.vi),
      visemeWeight: dto.vw / SYNC_CONFIG.BYTE_SCALE,
    };
  }

  private emotionToDTO(e: EmotionState): EmotionDTO {
    return {
      j: Math.round(e.joy * SYNC_CONFIG.BYTE_SCALE),
      a: Math.round(e.anger * SYNC_CONFIG.BYTE_SCALE),
      s: Math.round(e.sorrow * SYNC_CONFIG.BYTE_SCALE),
      su: Math.round(e.surprise * SYNC_CONFIG.BYTE_SCALE),
      n: Math.round(e.neutral * SYNC_CONFIG.BYTE_SCALE),
    };
  }

  private emotionDTOToInternal(dto: EmotionDTO): EmotionState {
    return {
      joy: dto.j / SYNC_CONFIG.BYTE_SCALE,
      anger: dto.a / SYNC_CONFIG.BYTE_SCALE,
      sorrow: dto.s / SYNC_CONFIG.BYTE_SCALE,
      surprise: dto.su / SYNC_CONFIG.BYTE_SCALE,
      neutral: dto.n / SYNC_CONFIG.BYTE_SCALE,
    };
  }

  private dtoToParticipant(dto: ParticipantDTO): Participant {
    return {
      id: dto.id,
      displayName: dto.displayName,
      vrmUrl: dto.vrmUrl,
      avatarId: 'avatarId' in dto ? String(dto.avatarId) : 'seed-san',
      isGuest: dto.isGuest,
      transform: this.transformDTOToInternal(dto.transform),
      speakingState: this.speakingDTOToInternal(dto.speakingState),
      emotion: this.emotionDTOToInternal(dto.emotion),
    };
  }

  // ============================================================
  // Diff Detection (帯域最適化)
  // ============================================================

  private isTransformEqual(a: TransformDTO, b: TransformDTO | null): boolean {
    if (!b) return false;
    return a.px === b.px && a.py === b.py && a.pz === b.pz &&
           a.rx === b.rx && a.ry === b.ry && a.rz === b.rz &&
           a.lx === b.lx && a.ly === b.ly && a.lz === b.lz;
  }

  private isSpeakingEqual(a: SpeakingStateDTO, b: SpeakingStateDTO | null): boolean {
    if (!b) return false;
    return a.s === b.s && a.v === b.v && a.vi === b.vi && a.vw === b.vw;
  }

  private isEmotionEqual(a: EmotionDTO, b: EmotionDTO | null): boolean {
    if (!b) return false;
    return a.j === b.j && a.a === b.a && a.s === b.s && a.su === b.su && a.n === b.n;
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getLocalParticipantId(): string | null {
    return this.localParticipantId;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  disconnect(): void {
    this.stopSendLoop();
    this.socket?.disconnect();
    this.socket = null;
    this.localParticipantId = null;
    this.roomId = null;
  }
}
