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
  email: string;
  avatarConfig: AvatarConfig;
  createdAt: number;
}

// ============================================================
// Room Theme & Access (Phase 6)
// ============================================================

export type RoomTheme = 'underground' | 'loft' | 'treehouse' | 'beach' | 'rooftop' | 'space' | 'aquarium' | 'volcano';
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
  'underground', 'loft', 'treehouse', 'beach', 'rooftop', 'space', 'aquarium', 'volcano',
];

/** テーマ固有パーティクル設定 */
export interface ThemeParticleConfig {
  /** パーティクル色 */
  color: string;
  /** パーティクル数 */
  count: number;
  /** パーティクルサイズ */
  size: number;
  /** 動き速度 */
  speed: number;
  /** 動きのパターン */
  pattern: 'float' | 'fall' | 'rise' | 'orbit' | 'drift' | 'flicker';
  /** 放射形状 */
  shape: 'box' | 'sphere';
}

/** テーマ固有ライティング設定 */
export interface ThemeSpecialLighting {
  /** スポットライト色 */
  spotColor: string;
  /** スポットライト強度 */
  spotIntensity: number;
  /** 点滅/揺らぎ */
  flicker: boolean;
  /** ゴッドレイ色 */
  godRayColor?: string;
}

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
  /** 環境マップ */
  environmentPreset: 'sunset' | 'night' | 'dawn' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby';
  /** テーマ固有パーティクル */
  particles?: ThemeParticleConfig;
  /** テーマ固有ライティング */
  specialLighting?: ThemeSpecialLighting;
  /** 床パターン */
  floorPattern: 'solid' | 'wood' | 'stone' | 'sand' | 'metal' | 'grass' | 'tile' | 'lava';
  /** 壁パターン */
  wallPattern: 'solid' | 'brick' | 'wood' | 'glass' | 'rock' | 'coral' | 'obsidian' | 'panel';
  /** 装飾種別リスト */
  decorations: string[];
  /** セカンダリアクセントカラー */
  secondaryAccent: string;
}

export const ROOM_THEMES: Record<RoomTheme, RoomThemeDef> = {
  underground: {
    id: 'underground',
    name: '地下室',
    emoji: '🗿',
    description: 'ダーク×ネオンの秘密基地',
    floorColor: '#1a1a2e', wallColor: '#2d2020', ceilingColor: '#111',
    ambientColor: '#c4b5fd', ambientIntensity: 0.3,
    accentColor: '#7c3aed', neonColor: '#06b6d4',
    fogColor: '#0a0a1a', fogDensity: 0.08,
    environmentPreset: 'night',
    floorPattern: 'stone', wallPattern: 'rock',
    secondaryAccent: '#a855f7',
    decorations: ['crystal', 'pipe', 'glow_moss', 'stalactite'],
    particles: { color: '#c4b5fd', count: 30, size: 0.04, speed: 0.3, pattern: 'float', shape: 'box' },
    specialLighting: { spotColor: '#7c3aed', spotIntensity: 2, flicker: true },
  },
  loft: {
    id: 'loft',
    name: 'ロフト',
    emoji: '🏠',
    description: '暖かい木目調のおしゃれ部屋',
    floorColor: '#8B6914', wallColor: '#F5F0E1', ceilingColor: '#E8E0D0',
    ambientColor: '#FFE4B5', ambientIntensity: 0.7,
    accentColor: '#D4A574', neonColor: '#FFD700',
    fogColor: '#FFF8E7', fogDensity: 0.02,
    environmentPreset: 'apartment',
    floorPattern: 'wood', wallPattern: 'brick',
    secondaryAccent: '#E8A87C',
    decorations: ['window_frame', 'bookshelf', 'fireplace', 'hanging_plant'],
    particles: { color: '#FFD700', count: 15, size: 0.02, speed: 0.1, pattern: 'drift', shape: 'box' },
    specialLighting: { spotColor: '#FFE4B5', spotIntensity: 1.5, flicker: true, godRayColor: '#FFF8DC' },
  },
  treehouse: {
    id: 'treehouse',
    name: 'ツリーハウス',
    emoji: '🌳',
    description: '森の中の秘密の小屋',
    floorColor: '#6B4226', wallColor: '#5C3D1E', ceilingColor: '#3A5F3A',
    ambientColor: '#90EE90', ambientIntensity: 0.6,
    accentColor: '#228B22', neonColor: '#ADFF2F',
    fogColor: '#2E5D2E', fogDensity: 0.04,
    environmentPreset: 'forest',
    floorPattern: 'wood', wallPattern: 'wood',
    secondaryAccent: '#32CD32',
    decorations: ['branch', 'leaf_cluster', 'bird_nest', 'vine', 'lantern'],
    particles: { color: '#90EE90', count: 40, size: 0.03, speed: 0.5, pattern: 'fall', shape: 'box' },
    specialLighting: { spotColor: '#ADFF2F', spotIntensity: 0.8, flicker: false, godRayColor: '#90EE9044' },
  },
  beach: {
    id: 'beach',
    name: 'ビーチハウス',
    emoji: '🏖️',
    description: '海辺の開放的なハウス',
    floorColor: '#F5DEB3', wallColor: '#E0F7FA', ceilingColor: '#B3E5FC',
    ambientColor: '#87CEEB', ambientIntensity: 1.0,
    accentColor: '#00BCD4', neonColor: '#00E5FF',
    fogColor: '#E0F2FF', fogDensity: 0.01,
    environmentPreset: 'sunset',
    floorPattern: 'sand', wallPattern: 'glass',
    secondaryAccent: '#FF7043',
    decorations: ['palm_shadow', 'shell', 'wave_edge', 'surfboard', 'starfish'],
    particles: { color: '#87CEEB', count: 20, size: 0.015, speed: 0.2, pattern: 'drift', shape: 'sphere' },
    specialLighting: { spotColor: '#FFA726', spotIntensity: 1.8, flicker: false, godRayColor: '#FFD54F' },
  },
  rooftop: {
    id: 'rooftop',
    name: '屋上',
    emoji: '🌇',
    description: '夕焼けの見える屋上',
    floorColor: '#696969', wallColor: '#808080', ceilingColor: '#FF7F50',
    ambientColor: '#FF8C00', ambientIntensity: 0.8,
    accentColor: '#FF4500', neonColor: '#FFD700',
    fogColor: '#FFA07A', fogDensity: 0.03,
    environmentPreset: 'sunset',
    floorPattern: 'metal', wallPattern: 'panel',
    secondaryAccent: '#FF6B35',
    decorations: ['fence', 'antenna', 'distant_buildings', 'water_tower', 'string_lights'],
    particles: { color: '#FFD700', count: 10, size: 0.01, speed: 0.15, pattern: 'drift', shape: 'box' },
    specialLighting: { spotColor: '#FF4500', spotIntensity: 1.2, flicker: false, godRayColor: '#FF7F5088' },
  },
  space: {
    id: 'space',
    name: '宇宙ステーション',
    emoji: '🚀',
    description: '近未来SFの宇宙基地',
    floorColor: '#2C2C3A', wallColor: '#1A1A2E', ceilingColor: '#0D0D1A',
    ambientColor: '#6366f1', ambientIntensity: 0.4,
    accentColor: '#818cf8', neonColor: '#22d3ee',
    fogColor: '#0a0a2e', fogDensity: 0.06,
    environmentPreset: 'night',
    floorPattern: 'metal', wallPattern: 'panel',
    secondaryAccent: '#a78bfa',
    decorations: ['star_field', 'space_window', 'hologram_planet', 'control_panel', 'antenna_dish'],
    particles: { color: '#ffffff', count: 80, size: 0.008, speed: 0.1, pattern: 'flicker', shape: 'sphere' },
    specialLighting: { spotColor: '#22d3ee', spotIntensity: 1.5, flicker: true },
  },
  aquarium: {
    id: 'aquarium',
    name: '深海アクアリウム',
    emoji: '🐠',
    description: '神秘的な深海の水族館',
    floorColor: '#0D3B66', wallColor: '#0A2E52', ceilingColor: '#061A33',
    ambientColor: '#00CED1', ambientIntensity: 0.45,
    accentColor: '#00BCD4', neonColor: '#40E0D0',
    fogColor: '#0A2E52', fogDensity: 0.07,
    environmentPreset: 'night',
    floorPattern: 'tile', wallPattern: 'coral',
    secondaryAccent: '#7B68EE',
    decorations: ['coral_reef', 'jellyfish', 'seaweed', 'treasure_chest', 'porthole'],
    particles: { color: '#E0FFFF', count: 60, size: 0.025, speed: 0.4, pattern: 'rise', shape: 'sphere' },
    specialLighting: { spotColor: '#00CED1', spotIntensity: 1.8, flicker: true, godRayColor: '#40E0D044' },
  },
  volcano: {
    id: 'volcano',
    name: '火山の洞窟',
    emoji: '🌋',
    description: '溶岩が流れる灼熱の隠れ家',
    floorColor: '#1A0A00', wallColor: '#2D1810', ceilingColor: '#0D0500',
    ambientColor: '#FF6B35', ambientIntensity: 0.35,
    accentColor: '#FF4500', neonColor: '#FF6347',
    fogColor: '#1A0500', fogDensity: 0.09,
    environmentPreset: 'night',
    floorPattern: 'lava', wallPattern: 'obsidian',
    secondaryAccent: '#FFD700',
    decorations: ['lava_stream', 'ember_vent', 'obsidian_pillar', 'magma_crack', 'heat_vent'],
    particles: { color: '#FF4500', count: 50, size: 0.03, speed: 0.6, pattern: 'rise', shape: 'box' },
    specialLighting: { spotColor: '#FF4500', spotIntensity: 2.5, flicker: true },
  },
};

export const ACCESS_MODE_LABELS: Record<AccessMode, string> = {
  open: '\u{1F513} \u3044\u3064\u3067\u3082OK',
  permission: '\u{1F512} \u8A31\u53EF\u5236',
  key: '\u{1F511} \u5408\u9375\u30E2\u30FC\u30C9',
};

