/**
 * cocoro — Core Type Definitions
 * スマホのメタバース 音声SNS
 */


// ============================================================

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
  vrm?: unknown;
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

export interface CocoroStore {
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

// ============================================================
// Furniture (Phase 4)
// ============================================================

export type FurnitureActionType =
  | 'sit' | 'sleep' | 'play' | 'strum' | 'gaze' | 'dance'
  | 'eat' | 'work' | 'read' | 'kick' | 'admire' | 'relax'
  | 'swing' | 'warm' | 'write' | 'lounge' | 'water' | 'dj' | 'browse';

export interface FurnitureColorVariant {
  id: string;
  label: string;
  hex: string;
}

export interface FurnitureDef {
  type: string;
  name: string;
  icon: string;
  cost: number;
  category: string;
  placement?: 'wall' | 'floor';
  nanoBananaPrompt?: string;
  colorVariants?: FurnitureColorVariant[];
  action?: FurnitureActionType;
}

export interface FurnitureItem {
  id: string;
  type: string;
  position: [number, number, number];
  rotationY: number;
  rotation?: number;
  state?: Record<string, unknown>;
  colorVariant?: string;
}

/** Alias for backward compatibility */
export type FurnitureType = string;

// ============================================================
// Avatar (Phase 5)
// ============================================================

export type AvatarSpecies = 'bear' | 'cat' | 'dog' | 'rabbit' | 'fox' | 'frog' | 'penguin' | 'panda';
export type AvatarItemType = 'none' | 'sword_shield' | 'skateboard' | 'controller' | 'pizza' | 'sunglasses'
  | 'ribbon' | 'magic_wand' | 'plushie' | 'tiara' | 'flower_bouquet';

export interface AvatarConfig {
  species: AvatarSpecies;
  color: string;
  item: AvatarItemType;
}

export const AVATAR_SPECIES_LIST: AvatarSpecies[] = [
  'bear', 'cat', 'dog', 'rabbit', 'fox', 'frog', 'penguin', 'panda',
];

export const AVATAR_SPECIES_LABELS: Record<AvatarSpecies, string> = {
  bear: '\u30AF\u30DE', cat: '\u30CD\u30B3', dog: '\u30A4\u30CC',
  rabbit: '\u30A6\u30B5\u30AE', fox: '\u30AD\u30C4\u30CD', frog: '\u30AB\u30A8\u30EB',
  penguin: '\u30DA\u30F3\u30AE\u30F3', panda: '\u30D1\u30F3\u30C0',
};

export const AVATAR_SPECIES_EMOJI: Record<AvatarSpecies, string> = {
  bear: '\u{1F43B}', cat: '\u{1F431}', dog: '\u{1F436}',
  rabbit: '\u{1F430}', fox: '\u{1F98A}', frog: '\u{1F438}',
  penguin: '\u{1F427}', panda: '\u{1F43C}',
};

export const AVATAR_ITEM_LIST: AvatarItemType[] = [
  'none', 'sword_shield', 'skateboard', 'controller', 'pizza', 'sunglasses',
  'ribbon', 'magic_wand', 'plushie', 'tiara', 'flower_bouquet',
];

export const AVATAR_ITEM_LABELS: Record<AvatarItemType, string> = {
  none: 'なし', sword_shield: '剣と盾',
  skateboard: 'スケボー', controller: 'コントローラー',
  pizza: 'ピザ', sunglasses: 'サングラス',
  ribbon: 'リボン', magic_wand: '魔法のステッキ',
  plushie: 'ぬいぐるみ', tiara: 'ティアラ',
  flower_bouquet: '花束',
};

export const AVATAR_ITEM_EMOJI: Record<AvatarItemType, string> = {
  none: '➖', sword_shield: '⚔️',
  skateboard: '🛹', controller: '🎮',
  pizza: '🍕', sunglasses: '🕶️',
  ribbon: '🎀', magic_wand: '🪄',
  plushie: '🧸', tiara: '👑',
  flower_bouquet: '💐',
};

export const AVATAR_COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#F5A0C0', label: '\u30D4\u30F3\u30AF' },
  { hex: '#A0D8F0', label: '\u30DF\u30F3\u30C8' },
  { hex: '#F0E68C', label: '\u30EC\u30E2\u30F3' },
  { hex: '#C8A8E0', label: '\u30E9\u30D9\u30F3\u30C0\u30FC' },
  { hex: '#90EE90', label: '\u30E9\u30A4\u30E0' },
  { hex: '#FFD4B0', label: '\u30D4\u30FC\u30C1' },
  { hex: '#E0E0E0', label: '\u30B7\u30EB\u30D0\u30FC' },
  { hex: '#F0F0F0', label: '\u30DB\u30EF\u30A4\u30C8' },
  { hex: '#333333', label: '\u30C1\u30E3\u30B3\u30FC\u30EB' },
  { hex: '#8B4513', label: '\u30D6\u30E9\u30A6\u30F3' },
  { hex: '#FF6347', label: '\u30C8\u30DE\u30C8' },
  { hex: '#4169E1', label: '\u30ED\u30A4\u30E4\u30EB' },
];

// ============================================================
// User Account (Phase 6)
// ============================================================

export interface UserAccount {
  id: string;
  name: string;
  pinHash: string;
  browserToken: string;
  avatarConfig: AvatarConfig;
  createdAt: number;
}

// ============================================================
// Room Theme & Access (Phase 6)
// ============================================================

export type RoomTheme = 'underground' | 'loft' | 'treehouse' | 'beach' | 'rooftop' | 'space';
export type AccessMode = 'open' | 'permission' | 'key';

export interface RoomDef {
  id: string;
  ownerId: string;
  ownerName: string;
  theme: RoomTheme;
  accessMode: AccessMode;
  /** key mode: list of user IDs that have a key */
  allowedUsers: string[];
  inviteCode: string;
  furniture: FurnitureItem[];
  createdAt: number;
}

export const ROOM_THEME_LIST: RoomTheme[] = [
  'underground', 'loft', 'treehouse', 'beach', 'rooftop', 'space',
];

export interface RoomThemeDef {
  id: RoomTheme;
  name: string;
  emoji: string;
  description: string;
  floorColor: string;
  wallColor: string;
  ceilingColor: string;
  ambientColor: string;
  ambientIntensity: number;
  accentColor: string;
  neonColor: string;
  fogColor: string;
  fogDensity: number;
}

export const ROOM_THEMES: Record<RoomTheme, RoomThemeDef> = {
  underground: {
    id: 'underground',
    name: '\u5730\u4E0B\u5BA4',
    emoji: '\u{1F5FF}',
    description: '\u30C0\u30FC\u30AF\u00D7\u30CD\u30AA\u30F3\u306E\u79D8\u5BC6\u57FA\u5730',
    floorColor: '#1a1a2e', wallColor: '#2d2020', ceilingColor: '#111',
    ambientColor: '#c4b5fd', ambientIntensity: 0.3,
    accentColor: '#7c3aed', neonColor: '#06b6d4',
    fogColor: '#0a0a1a', fogDensity: 0.08,
  },
  loft: {
    id: 'loft',
    name: '\u30ED\u30D5\u30C8',
    emoji: '\u{1F3E0}',
    description: '\u6696\u304B\u3044\u6728\u76EE\u8ABF\u306E\u304A\u3057\u3083\u308C\u90E8\u5C4B',
    floorColor: '#8B6914', wallColor: '#F5F0E1', ceilingColor: '#E8E0D0',
    ambientColor: '#FFE4B5', ambientIntensity: 0.7,
    accentColor: '#D4A574', neonColor: '#FFD700',
    fogColor: '#FFF8E7', fogDensity: 0.02,
  },
  treehouse: {
    id: 'treehouse',
    name: '\u30C4\u30EA\u30FC\u30CF\u30A6\u30B9',
    emoji: '\u{1F333}',
    description: '\u68EE\u306E\u4E2D\u306E\u79D8\u5BC6\u306E\u5C0F\u5C4B',
    floorColor: '#6B4226', wallColor: '#5C3D1E', ceilingColor: '#3A5F3A',
    ambientColor: '#90EE90', ambientIntensity: 0.6,
    accentColor: '#228B22', neonColor: '#ADFF2F',
    fogColor: '#2E5D2E', fogDensity: 0.04,
  },
  beach: {
    id: 'beach',
    name: '\u30D3\u30FC\u30C1\u30CF\u30A6\u30B9',
    emoji: '\u{1F3D6}\uFE0F',
    description: '\u6D77\u8FBA\u306E\u958B\u653E\u7684\u306A\u30CF\u30A6\u30B9',
    floorColor: '#F5DEB3', wallColor: '#E0F7FA', ceilingColor: '#B3E5FC',
    ambientColor: '#87CEEB', ambientIntensity: 1.0,
    accentColor: '#00BCD4', neonColor: '#00E5FF',
    fogColor: '#E0F2FF', fogDensity: 0.01,
  },
  rooftop: {
    id: 'rooftop',
    name: '\u5C4B\u4E0A',
    emoji: '\u{1F307}',
    description: '\u5915\u713C\u3051\u306E\u898B\u3048\u308B\u5C4B\u4E0A',
    floorColor: '#696969', wallColor: '#808080', ceilingColor: '#FF7F50',
    ambientColor: '#FF8C00', ambientIntensity: 0.8,
    accentColor: '#FF4500', neonColor: '#FFD700',
    fogColor: '#FFA07A', fogDensity: 0.03,
  },
  space: {
    id: 'space',
    name: '\u5B87\u5B99\u30B9\u30C6\u30FC\u30B7\u30E7\u30F3',
    emoji: '\u{1F680}',
    description: '\u8FD1\u672A\u6765SF\u306E\u5B87\u5B99\u57FA\u5730',
    floorColor: '#2C2C3A', wallColor: '#1A1A2E', ceilingColor: '#0D0D1A',
    ambientColor: '#6366f1', ambientIntensity: 0.4,
    accentColor: '#818cf8', neonColor: '#22d3ee',
    fogColor: '#0a0a2e', fogDensity: 0.06,
  },
};

export const ACCESS_MODE_LABELS: Record<AccessMode, string> = {
  open: '\u{1F513} \u3044\u3064\u3067\u3082OK',
  permission: '\u{1F512} \u8A31\u53EF\u5236',
  key: '\u{1F511} \u5408\u9375\u30E2\u30FC\u30C9',
};

