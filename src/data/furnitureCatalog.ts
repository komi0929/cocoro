/**
 * cocoro - Furniture Catalog v5
 * 50 voxel furniture definitions
 * Procedural generation with color noise + wall placement support
 * + Color variants & avatar actions
 */

import type { FurnitureDef, FurnitureActionType } from '@/types/cocoro';

// ============================================================
// Color Variant Presets (shared palettes)
// ============================================================

const SOFA_COLORS = [
  { id: 'purple', label: 'パープル', hex: '#7c3aed' },
  { id: 'red', label: 'レッド', hex: '#dc2626' },
  { id: 'green', label: 'グリーン', hex: '#4d7c0f' },
  { id: 'blue', label: 'ブルー', hex: '#2563eb' },
  { id: 'pink', label: 'ピンク', hex: '#ec4899' },
];

const BED_COLORS = [
  { id: 'purple', label: 'パープル', hex: '#6d28d9' },
  { id: 'blue', label: 'ブルー', hex: '#1d4ed8' },
  { id: 'pink', label: 'ピンク', hex: '#db2777' },
  { id: 'green', label: 'グリーン', hex: '#15803d' },
];

const RUG_COLORS = [
  { id: 'purple', label: 'パープル', hex: '#6d28d9' },
  { id: 'red', label: 'レッド', hex: '#b91c1c' },
  { id: 'blue', label: 'ブルー', hex: '#1e40af' },
  { id: 'green', label: 'グリーン', hex: '#166534' },
  { id: 'orange', label: 'オレンジ', hex: '#c2410c' },
];

const CHAIR_COLORS = [
  { id: 'red_black', label: 'レッド', hex: '#dc2626' },
  { id: 'blue_black', label: 'ブルー', hex: '#2563eb' },
  { id: 'green_black', label: 'グリーン', hex: '#16a34a' },
  { id: 'pink_black', label: 'ピンク', hex: '#ec4899' },
  { id: 'white', label: 'ホワイト', hex: '#e5e7eb' },
];

const CUSHION_COLORS = [
  { id: 'cyan', label: 'シアン', hex: '#06b6d4' },
  { id: 'pink', label: 'ピンク', hex: '#f472b6' },
  { id: 'yellow', label: 'イエロー', hex: '#facc15' },
  { id: 'lavender', label: 'ラベンダー', hex: '#a78bfa' },
];

const NEON_COLORS = [
  { id: 'cyan', label: 'シアン', hex: '#06b6d4' },
  { id: 'pink', label: 'ピンク', hex: '#ec4899' },
  { id: 'green', label: 'グリーン', hex: '#22c55e' },
  { id: 'yellow', label: 'イエロー', hex: '#eab308' },
  { id: 'purple', label: 'パープル', hex: '#a855f7' },
];

const LAMP_COLORS = [
  { id: 'warm', label: 'ウォーム', hex: '#fbbf24' },
  { id: 'cool', label: 'クール', hex: '#60a5fa' },
  { id: 'pink', label: 'ピンク', hex: '#f472b6' },
  { id: 'green', label: 'グリーン', hex: '#4ade80' },
];

export const FURNITURE_CATALOG: FurnitureDef[] = [
  // ============================================================
  // Chill - 11 (merged sofa variants into one with colorVariants)
  // ============================================================
  {
    type: 'bed', name: '二段ベッド', icon: '🛏️', cost: 20, category: 'chill',
    nanoBananaPrompt: 'Pixel art bunk bed icon, cozy blankets, voxel style, dark bg',
    colorVariants: BED_COLORS,
    action: 'sleep',
  },
  {
    type: 'sofa', name: 'ソファ', icon: '🛋️', cost: 15, category: 'chill',
    nanoBananaPrompt: 'Pixel art chunky sofa icon, cushions, voxel style, dark bg',
    colorVariants: SOFA_COLORS,
    action: 'sit',
  },
  {
    type: 'l_sofa', name: 'L字ソファ', icon: '🔲', cost: 22, category: 'chill',
    nanoBananaPrompt: 'Pixel art L-shaped sectional sofa, neon accents, voxel style, dark bg',
    colorVariants: SOFA_COLORS,
    action: 'sit',
  },
  {
    type: 'beanbag', name: 'ビーズクッション', icon: '🟣', cost: 8, category: 'chill',
    nanoBananaPrompt: 'Pixel art beanbag chair icon, soft round shape, voxel style, dark bg',
    colorVariants: [
      { id: 'purple', label: 'パープル', hex: '#a78bfa' },
      { id: 'pink', label: 'ピンク', hex: '#f472b6' },
      { id: 'blue', label: 'ブルー', hex: '#60a5fa' },
      { id: 'orange', label: 'オレンジ', hex: '#fb923c' },
    ],
    action: 'sit',
  },
  {
    type: 'hammock', name: 'ハンモック', icon: '🏖️', cost: 12, category: 'chill',
    nanoBananaPrompt: 'Pixel art indoor hammock icon, colorful fabric, voxel style, dark bg',
    action: 'sleep',
  },
  {
    type: 'rug', name: 'ラグマット', icon: '🟪', cost: 6, category: 'chill',
    nanoBananaPrompt: 'Pixel art colorful floor rug, geometric pattern, voxel style, dark bg',
    colorVariants: RUG_COLORS,
    action: 'relax',
  },
  {
    type: 'rug_round', name: '丸ラグ', icon: '⭕', cost: 5, category: 'chill',
    nanoBananaPrompt: 'Pixel art round fluffy rug, pastel colors, voxel style, dark bg',
    colorVariants: RUG_COLORS,
    action: 'relax',
  },
  {
    type: 'rug_stripe', name: 'ストライプラグ', icon: '🟫', cost: 6, category: 'chill',
    nanoBananaPrompt: 'Pixel art striped floor rug, warm tones, voxel style, dark bg',
    action: 'relax',
  },
  {
    type: 'cushion', name: 'フロア クッション', icon: '💜', cost: 3, category: 'chill',
    nanoBananaPrompt: 'Pixel art floor cushion icon, stack of two, voxel style, dark bg',
    colorVariants: CUSHION_COLORS,
    action: 'relax',
  },
  {
    type: 'low_table', name: 'センターテーブル', icon: '🪵', cost: 10, category: 'chill',
    nanoBananaPrompt: 'Pixel art wooden low table, minimalist, voxel style, dark bg',
    action: 'lounge',
  },
  {
    type: 'cactus', name: 'サボテン', icon: '🌵', cost: 5, category: 'chill',
    nanoBananaPrompt: 'Pixel art potted cactus, desert green, voxel style, dark bg',
    action: 'water',
  },

  // ============================================================
  // Play - 11
  // ============================================================
  {
    type: 'arcade', name: 'アーケード筐体', icon: '🕹️', cost: 25, category: 'play',
    nanoBananaPrompt: 'Pixel art retro arcade cabinet icon, glowing screen, voxel style, dark bg',
    action: 'play',
  },
  {
    type: 'skateboard', name: 'スケボー', icon: '🛹', cost: 4, category: 'play',
    nanoBananaPrompt: 'Pixel art skateboard icon lying on floor, neon wheels, voxel style, dark bg',
    action: 'kick',
  },
  {
    type: 'dj_booth', name: 'DJブース', icon: '🎧', cost: 28, category: 'play',
    nanoBananaPrompt: 'Pixel art DJ turntable booth icon, LED lights, voxel style, dark bg',
    action: 'dj',
  },
  {
    type: 'pizza_box', name: 'ピザの箱', icon: '🍕', cost: 2, category: 'play',
    nanoBananaPrompt: 'Pixel art stacked pizza boxes icon, open one on top, voxel style, dark bg',
    action: 'eat',
  },
  {
    type: 'basketball', name: 'バスケットボール', icon: '🏀', cost: 3, category: 'play',
    nanoBananaPrompt: 'Pixel art basketball icon, orange with black lines, voxel style, dark bg',
    action: 'kick',
  },
  {
    type: 'guitar', name: 'ギター', icon: '🎸', cost: 10, category: 'play',
    nanoBananaPrompt: 'Pixel art electric guitar on stand icon, red body, voxel style, dark bg',
    action: 'strum',
  },
  {
    type: 'boombox', name: 'ブームボックス', icon: '📻', cost: 8, category: 'play',
    nanoBananaPrompt: 'Pixel art retro boombox icon, big speakers, voxel style, dark bg',
    action: 'dance',
  },
  {
    type: 'big_speaker', name: '巨大スピーカー', icon: '🔊', cost: 18, category: 'play',
    nanoBananaPrompt: 'Pixel art tall PA speaker tower, bass heavy, voxel style, dark bg',
    action: 'dance',
  },
  {
    type: 'pinball', name: 'ピンボール', icon: '🎰', cost: 22, category: 'play',
    nanoBananaPrompt: 'Pixel art pinball machine, flashy lights, voxel style, dark bg',
    action: 'play',
  },
  {
    type: 'vinyl_player', name: 'レコードプレイヤー', icon: '💿', cost: 12, category: 'play',
    nanoBananaPrompt: 'Pixel art vinyl record player, spinning disc, voxel style, dark bg',
    action: 'dance',
  },
  {
    type: 'foam_sword', name: 'スポンジ剣', icon: '⚔️', cost: 3, category: 'play',
    nanoBananaPrompt: 'Pixel art foam sword toy, bright blue, voxel style, dark bg',
    action: 'swing',
  },

  // ============================================================
  // Desk - 11
  // ============================================================
  {
    type: 'desk', name: 'ゲーミングデスク', icon: '🖥️', cost: 15, category: 'desk',
    nanoBananaPrompt: 'Pixel art gaming desk with LED strip, voxel style, dark bg',
    action: 'work',
  },
  {
    type: 'gaming_chair', name: 'ゲーミングチェア', icon: '💺', cost: 12, category: 'desk',
    nanoBananaPrompt: 'Pixel art racing gaming chair, red and black, voxel style, dark bg',
    colorVariants: CHAIR_COLORS,
    action: 'sit',
  },
  {
    type: 'monitor', name: 'モニター', icon: '🖥️', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art curved gaming monitor, glowing screen, voxel style, dark bg',
    action: 'work',
  },
  {
    type: 'monitor_dual', name: 'デュアルモニター', icon: '🖥️', cost: 18, category: 'desk',
    nanoBananaPrompt: 'Pixel art dual monitor setup, wide screens, voxel style, dark bg',
    action: 'work',
  },
  {
    type: 'gaming_pc', name: 'ゲーミングPC', icon: '💻', cost: 20, category: 'desk',
    nanoBananaPrompt: 'Pixel art gaming PC tower, RGB lights, tempered glass, voxel style, dark bg',
    action: 'play',
  },
  {
    type: 'steel_rack', name: 'スチールラック', icon: '🗄️', cost: 8, category: 'desk',
    nanoBananaPrompt: 'Pixel art industrial steel rack with items, voxel style, dark bg',
    action: 'browse',
  },
  {
    type: 'chair', name: 'イス', icon: '🪑', cost: 5, category: 'desk',
    nanoBananaPrompt: 'Pixel art wooden chair icon, simple design, voxel style, dark bg',
    action: 'sit',
  },
  {
    type: 'table', name: 'ローテーブル', icon: '🍵', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art low table with snacks and drinks, voxel style, dark bg',
    action: 'lounge',
  },
  {
    type: 'shelf', name: 'シェルフ', icon: '📚', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art bookshelf with manga and figures, voxel style, dark bg',
    action: 'read',
  },
  {
    type: 'filing_cabinet', name: 'ファイリングキャビネット', icon: '🗃️', cost: 7, category: 'desk',
    nanoBananaPrompt: 'Pixel art metal filing cabinet, industrial, voxel style, dark bg',
    action: 'browse',
  },
  {
    type: 'whiteboard', name: 'ホワイトボード', icon: '📋', cost: 8, category: 'desk', placement: 'wall',
    nanoBananaPrompt: 'Pixel art whiteboard on wheels, notes pinned, voxel style, dark bg',
    action: 'write',
  },

  // ============================================================
  // Light - 9
  // ============================================================
  {
    type: 'lamp', name: 'デスクランプ', icon: '💡', cost: 8, category: 'light',
    nanoBananaPrompt: 'Pixel art desk lamp glowing warm yellow, voxel style, dark bg',
    colorVariants: LAMP_COLORS,
    action: 'warm',
  },
  {
    type: 'floor_lamp', name: 'フロアランプ', icon: '🔦', cost: 12, category: 'light',
    nanoBananaPrompt: 'Pixel art tall floor lamp, warm amber glow, voxel style, dark bg',
    colorVariants: LAMP_COLORS,
    action: 'warm',
  },
  {
    type: 'neon_sign', name: 'ネオンサイン', icon: '✨', cost: 15, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon sign "CHILL" in cyan, voxel style, dark bg',
    colorVariants: NEON_COLORS,
    action: 'gaze',
  },
  {
    type: 'neon_heart', name: 'ネオンハート', icon: '💗', cost: 12, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon heart, glowing pink, voxel style, dark bg',
    colorVariants: NEON_COLORS,
    action: 'gaze',
  },
  {
    type: 'neon_star', name: 'ネオンスター', icon: '⭐', cost: 12, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon star, glowing yellow, voxel style, dark bg',
    colorVariants: NEON_COLORS,
    action: 'gaze',
  },
  {
    type: 'lava_lamp', name: 'ラバランプ', icon: '🫧', cost: 7, category: 'light',
    nanoBananaPrompt: 'Pixel art lava lamp, purple blob inside, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'string_lights', name: 'ストリングライト', icon: '🌟', cost: 6, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art fairy string lights, warm glow, voxel style, dark bg',
    colorVariants: NEON_COLORS,
    action: 'gaze',
  },
  {
    type: 'pendant_light', name: 'ペンダントライト', icon: '🪔', cost: 10, category: 'light',
    nanoBananaPrompt: 'Pixel art hanging pendant light, industrial, voxel style, dark bg',
    action: 'warm',
  },
  {
    type: 'candle_set', name: 'キャンドルセット', icon: '🕯️', cost: 5, category: 'light',
    nanoBananaPrompt: 'Pixel art set of candles, flickering flame, voxel style, dark bg',
    action: 'warm',
  },

  // ============================================================
  // Deco - 12
  // ============================================================
  {
    type: 'poster', name: 'ポスター', icon: '🖼️', cost: 5, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art poster frame on wall, anime style, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'poster_frame', name: 'アートフレーム', icon: '🎨', cost: 6, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art framed artwork, abstract art, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'wall_shelf', name: 'ウォールシェルフ', icon: '📕', cost: 8, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art wall-mounted shelf with items, voxel style, dark bg',
    action: 'browse',
  },
  {
    type: 'plant', name: '観葉植物', icon: '🌿', cost: 4, category: 'deco',
    nanoBananaPrompt: 'Pixel art potted plant, small monstera, voxel style, dark bg',
    action: 'water',
  },
  {
    type: 'plant_tall', name: '大きい観葉植物', icon: '🌴', cost: 7, category: 'deco',
    nanoBananaPrompt: 'Pixel art tall fiddle leaf fig tree in pot, voxel style, dark bg',
    action: 'admire',
  },
  {
    type: 'plant_hanging', name: '吊り下げ植物', icon: '🌱', cost: 5, category: 'deco',
    nanoBananaPrompt: 'Pixel art hanging plant in macrame holder, voxel style, dark bg',
    action: 'admire',
  },
  {
    type: 'terrarium', name: 'テラリウム', icon: '🏺', cost: 6, category: 'deco',
    nanoBananaPrompt: 'Pixel art glass terrarium with moss, voxel style, dark bg',
    action: 'admire',
  },
  {
    type: 'globe', name: '地球儀', icon: '🌍', cost: 6, category: 'deco',
    nanoBananaPrompt: 'Pixel art retro desk globe, spinning, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'trophy', name: 'トロフィー', icon: '🏆', cost: 5, category: 'deco',
    nanoBananaPrompt: 'Pixel art golden trophy cup, voxel style, dark bg',
    action: 'admire',
  },
  {
    type: 'clock', name: '掛け時計', icon: '🕐', cost: 4, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art round wall clock, neon frame, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'vinyl_record', name: 'レコード飾り', icon: '📀', cost: 3, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art vinyl record wall decor, retro, voxel style, dark bg',
    action: 'gaze',
  },
  {
    type: 'mini_fridge', name: 'ミニ冷蔵庫', icon: '🧊', cost: 10, category: 'deco',
    nanoBananaPrompt: 'Pixel art mini fridge with stickers, retro, voxel style, dark bg',
    action: 'eat',
  },
];

export const ROOM_CAPACITY_MAX = 200;

export function getFurnitureDef(type: string): FurnitureDef | undefined {
  return FURNITURE_CATALOG.find(f => f.type === type);
}

export function getCatalogByCategory() {
  const groups: Record<string, typeof FURNITURE_CATALOG> = {};
  for (const def of FURNITURE_CATALOG) {
    const cat = def.category ?? 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(def);
  }
  return groups;
}

export const CATEGORY_LABELS: Record<string, string> = {
  chill: '🛋️ チル',
  play: '🕹️ 遊び',
  desk: '🖥️ デスク',
  light: '💡 照明',
  deco: '🌿 デコ',
};

/** Get the action type for a given furniture type */
export function getFurnitureAction(type: string): FurnitureActionType | undefined {
  const def = getFurnitureDef(type);
  return def?.action;
}
