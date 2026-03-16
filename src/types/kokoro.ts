/**
 * kokoro — Core Type Definitions
 * スマホのメタバース 音声SNS
 */

import type { VRM } from '@pixiv/three-vrm';
import type { Vector3 as ThreeVector3 } from 'three';

// ============================================================
// Space Phase State Machine
// ============================================================

/** 空間の3フェーズ */
export enum SpacePhase {
  /** 静寂 — 誰も喋っていない */
  SILENCE = 'SILENCE',
  /** 発話 — ひとりが声を出した */
  TRIGGER = 'TRIGGER',
  /** 引力と輪 — 会話ラリーが始まった */
  GRAVITY = 'GRAVITY',
}

// ============================================================
// Avatar / Participant
// ============================================================

/** 参加者の発話状態 */
export interface SpeakingState {
  isSpeaking: boolean;
  /** RMS 音量 (0-1) */
  volume: number;
  /** 推定ピッチ Hz */
  pitch: number;
  /** 現在のビゼーム名 (aa, ih, ou, ee, oh, sil) */
  currentViseme: string;
  /** ビゼームの強度 (0-1) */
  visemeWeight: number;
}

/** 感情パラメータ（VRMブレンドシェイプ制御用） */
export interface EmotionState {
  joy: number;      // 0-1
  anger: number;    // 0-1
  sorrow: number;   // 0-1
  surprise: number; // 0-1
  neutral: number;  // 0-1
}

/** アバターの空間座標 */
export interface AvatarTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  /** 視線のターゲット座標 */
  lookAtTarget: { x: number; y: number; z: number } | null;
}

/** 参加者データ */
export interface Participant {
  id: string;
  displayName: string;
  /** VRMモデルのURL（nullはデフォルトアバター） */
  vrmUrl: string | null;
  /** アバターカタログID */
  avatarId: string;
  /** ゲストかどうか */
  isGuest: boolean;
  transform: AvatarTransform;
  speakingState: SpeakingState;
  emotion: EmotionState;
  /** VRMインスタンス（クライアントローカル） */
  vrm?: VRM;
}

// ============================================================
// Room / Space
// ============================================================

export interface Room {
  id: string;
  name: string;
  /** 最大収容人数 */
  maxParticipants: number;
  /** 現在の参加者 */
  participants: Map<string, Participant>;
  /** 現在のフェーズ */
  phase: SpacePhase;
  /** 密度パラメータ (0-1): 会話の盛り上がり度 */
  density: number;
  /** アクティブスピーカーのID配列 */
  activeSpeakers: string[];
}

// ============================================================
// Reaction (ROM専向け非言語コミュニケーション)
// ============================================================

export enum ReactionType {
  NOD = 'nod',           // うなずき
  CLAP = 'clap',         // 拍手
  LAUGH = 'laugh',       // 笑い
  SURPRISE = 'surprise', // 驚き
  WAVE = 'wave',         // 手振り
  HEART = 'heart',       // ハートエフェクト
  FIRE = 'fire',         // 🔥 盛り上がり
  SPARKLE = 'sparkle',   // ✨ キラキラ
}

export interface ReactionEvent {
  participantId: string;
  type: ReactionType;
  timestamp: number;
}

// ============================================================
// Network Sync Protocol
// ============================================================

/** WebSocket/DataChannel で送受信するメッセージ型 */
export enum SyncMessageType {
  /** 参加 */
  JOIN = 'join',
  /** 退出 */
  LEAVE = 'leave',
  /** アバター状態の差分更新（30fps） */
  AVATAR_STATE = 'avatar_state',
  /** リアクション */
  REACTION = 'reaction',
  /** フェーズ変更通知 */
  PHASE_CHANGE = 'phase_change',
  /** 密度パラメータ更新 */
  DENSITY_UPDATE = 'density_update',
}

export interface SyncMessage {
  type: SyncMessageType;
  senderId: string;
  timestamp: number;
  payload: unknown;
}

/** アバター状態の差分 */
export interface AvatarStateDelta {
  participantId: string;
  transform?: Partial<AvatarTransform>;
  speakingState?: Partial<SpeakingState>;
  emotion?: Partial<EmotionState>;
}

// ============================================================
// Choreography (自動演出パラメータ)
// ============================================================

/** 引力計算パラメータ */
export interface GravityParams {
  /** アバター間の最小距離 */
  minDistance: number;
  /** アバター間の最大距離（静寂時） */
  maxDistance: number;
  /** 引力の強さ係数 */
  attractionStrength: number;
  /** 円形フォーメーションの半径 */
  circleRadius: number;
  /** 座標補間速度（LERP factor / frame） */
  lerpSpeed: number;
}

/** ライティング演出の状態 */
export interface LightingState {
  /** アンビエント光の強度 */
  ambientIntensity: number;
  /** スポットライトの強度（発話者追従） */
  spotlightIntensity: number;
  /** ブルームの強度 */
  bloomStrength: number;
  /** 色温度 (暖色=低 / 寒色=高) */
  colorTemperature: number;
}

// ============================================================
// Store (Zustand)
// ============================================================

export interface KokoroStore {
  // --- Room ---
  roomId: string | null;
  phase: SpacePhase;
  density: number;
  participants: Map<string, Participant>;
  localParticipantId: string | null;
  activeSpeakers: string[];
  
  // --- Lighting ---
  lighting: LightingState;
  
  // --- Actions ---
  setRoomId: (id: string | null) => void;
  setPhase: (phase: SpacePhase) => void;
  setDensity: (density: number) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, delta: Partial<Participant>) => void;
  setLocalParticipantId: (id: string) => void;
  setActiveSpeakers: (ids: string[]) => void;
  setLighting: (state: Partial<LightingState>) => void;
  addReaction: (event: ReactionEvent) => void;
  
  // --- Reactions Queue ---
  reactionQueue: ReactionEvent[];
  clearReactionQueue: () => void;
}
