/**
 * kokoro — Sync Protocol Schema
 * クライアント-サーバー間の通信プロトコル定義
 * WebSocket / DataChannel 共通スキーマ
 */

// ============================================================
// Server → Client Events
// ============================================================

export interface ServerToClientEvents {
  /** ルーム参加成功 */
  'room:joined': (data: RoomJoinedPayload) => void;
  /** 他の参加者が参加 */
  'participant:joined': (data: ParticipantJoinedPayload) => void;
  /** 他の参加者が退出 */
  'participant:left': (data: ParticipantLeftPayload) => void;
  /** アバター状態の差分更新（30fps broadcast） */
  'avatar:state': (data: AvatarStateBroadcast) => void;
  /** フェーズ変更 */
  'phase:change': (data: PhaseChangePayload) => void;
  /** リアクション配信 */
  'reaction:broadcast': (data: ReactionBroadcastPayload) => void;
  /** ルーム密度更新 */
  'density:update': (data: DensityUpdatePayload) => void;
  /** エラー通知 */
  'error': (data: ErrorPayload) => void;
  /** ルーム一覧（自動ルーティング用） */
  'rooms:list': (data: RoomListPayload) => void;
  /** WebRTC: Offer受信 */
  'webrtc:offer': (data: { fromId: string; sdp: RTCSessionDescriptionInit }) => void;
  /** WebRTC: Answer受信 */
  'webrtc:answer': (data: { fromId: string; sdp: RTCSessionDescriptionInit }) => void;
  /** WebRTC: ICE候補受信 */
  'webrtc:ice-candidate': (data: { fromId: string; candidate: RTCIceCandidateInit }) => void;
}

// ============================================================
// Client → Server Events
// ============================================================

export interface ClientToServerEvents {
  /** ルーム参加リクエスト */
  'room:join': (data: RoomJoinRequest, ack: (response: RoomJoinResponse) => void) => void;
  /** ルーム退出 */
  'room:leave': () => void;
  /** アバター状態の差分送信（30fps） */
  'avatar:state': (data: AvatarStateUpdate) => void;
  /** リアクション送信 */
  'reaction:send': (data: ReactionSendPayload) => void;
  /** フェーズ更新（ホスト権限） */
  'phase:update': (data: PhaseUpdatePayload) => void;
  /** 最適なルームを問い合わせ */
  'rooms:find-best': (ack: (response: FindBestRoomResponse) => void) => void;
  /** ルーム作成 */
  'room:create': (data: RoomCreateRequest, ack: (response: RoomCreateResponse) => void) => void;
  /** WebRTC: Offer送信 */
  'webrtc:offer': (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => void;
  /** WebRTC: Answer送信 */
  'webrtc:answer': (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => void;
  /** WebRTC: ICE候補送信 */
  'webrtc:ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;
}

// ============================================================
// Payloads / DTOs
// ============================================================

/** 参加者のシリアライズ形式（ネットワーク転送用） */
export interface ParticipantDTO {
  id: string;
  displayName: string;
  vrmUrl: string | null;
  isGuest: boolean;
  transform: TransformDTO;
  speakingState: SpeakingStateDTO;
  emotion: EmotionDTO;
}

export interface TransformDTO {
  px: number; py: number; pz: number; // position
  rx: number; ry: number; rz: number; // rotation
  lx: number | null; ly: number | null; lz: number | null; // lookAt target
}

export interface SpeakingStateDTO {
  s: boolean;   // isSpeaking
  v: number;    // volume (0-255 quantized)
  p: number;    // pitch (Hz, uint16)
  vi: number;   // viseme index (0-5: sil,aa,ih,ou,ee,oh)
  vw: number;   // viseme weight (0-255 quantized)
}

export interface EmotionDTO {
  j: number;  // joy (0-255)
  a: number;  // anger (0-255)
  s: number;  // sorrow (0-255)
  su: number; // surprise (0-255)
  n: number;  // neutral (0-255)
}

// --- Room Join ---

export interface RoomJoinRequest {
  roomId: string | null;  // null = auto-route to best room
  displayName: string;
  vrmUrl: string | null;
  isGuest: boolean;
}

export interface RoomJoinResponse {
  success: boolean;
  roomId: string;
  participantId: string;
  participants: ParticipantDTO[];
  error?: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  participantId: string;
  participants: ParticipantDTO[];
}

// --- Participant Events ---

export interface ParticipantJoinedPayload {
  participant: ParticipantDTO;
}

export interface ParticipantLeftPayload {
  participantId: string;
}

// --- Avatar State ---

/** 差分のみ送信（帯域最適化）— クライアント→サーバー */
export interface AvatarStateUpdate {
  /** タイムスタンプ (ms since epoch, uint32 wrapping) */
  t: number;
  /** トランスフォーム差分 — 全て quantized int16 (-32768~32767) */
  tr?: TransformDTO;
  /** 発話状態 */
  sp?: SpeakingStateDTO;
  /** 感情 */
  em?: EmotionDTO;
}

/** サーバーがbroadcastする集約済み状態 */
export interface AvatarStateBroadcast {
  /** 送信者ID */
  pid: string;
  /** タイムスタンプ */
  t: number;
  /** トランスフォーム */
  tr?: TransformDTO;
  /** 発話状態 */
  sp?: SpeakingStateDTO;
  /** 感情 */
  em?: EmotionDTO;
}

// --- Phase ---

export interface PhaseChangePayload {
  phase: 'SILENCE' | 'TRIGGER' | 'GRAVITY';
  activeSpeakers: string[];
  density: number;
}

export interface PhaseUpdatePayload {
  phase: 'SILENCE' | 'TRIGGER' | 'GRAVITY';
  activeSpeakers: string[];
}

// --- Reaction ---

export interface ReactionSendPayload {
  type: string;  // ReactionType enum value
}

export interface ReactionBroadcastPayload {
  participantId: string;
  type: string;
  timestamp: number;
}

// --- Density ---

export interface DensityUpdatePayload {
  density: number;
}

// --- Room Management ---

export interface RoomCreateRequest {
  name: string;
  maxParticipants?: number;
}

export interface RoomCreateResponse {
  success: boolean;
  roomId: string;
  error?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  participantCount: number;
  maxParticipants: number;
  phase: string;
  density: number;
}

export interface RoomListPayload {
  rooms: RoomInfo[];
}

export interface FindBestRoomResponse {
  roomId: string | null;
  shouldCreate: boolean;
}

// --- Error ---

export interface ErrorPayload {
  code: string;
  message: string;
}

// ============================================================
// State Sync Rate / Quantization Config
// ============================================================

export const SYNC_CONFIG = {
  /** 状態送信レート (fps) */
  STATE_SEND_RATE: 30,
  /** 状態送信間隔 (ms) */
  STATE_SEND_INTERVAL: 1000 / 30,
  /** 座標の量子化スケール (1unit = 1000) */
  POSITION_SCALE: 1000,
  /** 回転の量子化スケール (1rad = 10000) */
  ROTATION_SCALE: 10000,
  /** 感情/音量の量子化スケール (0-1 → 0-255) */
  BYTE_SCALE: 255,
  /** アバター最大同時描画数 */
  MAX_AVATARS: 12,
  /** ルーム最大収容人数 */
  MAX_ROOM_PARTICIPANTS: 20,
  /** 最適ルーム人数（これを超えると新ルーム作成推奨） */
  OPTIMAL_ROOM_SIZE: 8,
} as const;

// ============================================================
// Viseme Index Map
// ============================================================

export const VISEME_INDEX_MAP = ['sil', 'aa', 'ih', 'ou', 'ee', 'oh'] as const;

export function visemeToIndex(viseme: string): number {
  const idx = VISEME_INDEX_MAP.indexOf(viseme as typeof VISEME_INDEX_MAP[number]);
  return idx >= 0 ? idx : 0;
}

export function indexToViseme(index: number): string {
  return VISEME_INDEX_MAP[index] ?? 'sil';
}
