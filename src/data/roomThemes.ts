/**
 * kokoro — Room Themes
 * ルームごとに異なる視覚体験を提供するテーマシステム
 * 
 * 思想: 「場所」に個性がある = SNSとして居場所の選択肢がある
 * 焚き火の暖かさ / 深海の静けさ / 星空の開放感
 */

export interface RoomTheme {
  id: string;
  name: string;
  emoji: string;
  /** 床シェーダーの色相(HSL H値) */
  floorHue: number;
  /** 床シェーダーの彩度(HSL S値) */
  floorSaturation: number;
  /** パーティクルのベースカラー [r, g, b] 0-1 */
  particleColor: [number, number, number];
  /** アンビエントライトの色 hex */
  ambientColor: string;
  /** ブルームの色倍率 */
  bloomTint: [number, number, number];
  /** 背景色 (CSS) */
  bgColor: string;
  /** 説明文 */
  description: string;
}

export const ROOM_THEMES: Record<string, RoomTheme> = {
  bonfire: {
    id: 'bonfire',
    name: '焚き火のそば',
    emoji: '🔥',
    floorHue: 20,
    floorSaturation: 0.8,
    particleColor: [1.0, 0.6, 0.2],
    ambientColor: '#ff8c42',
    bloomTint: [1.2, 0.8, 0.4],
    bgColor: '#1a0f08',
    description: '暖かい炎が照らす、居心地のよい空間',
  },
  ocean: {
    id: 'ocean',
    name: '深海のラウンジ',
    emoji: '🌊',
    floorHue: 200,
    floorSaturation: 0.7,
    particleColor: [0.2, 0.6, 1.0],
    ambientColor: '#4a9eff',
    bloomTint: [0.4, 0.8, 1.2],
    bgColor: '#08101a',
    description: '深い海の底で、静かに語り合う',
  },
  cosmos: {
    id: 'cosmos',
    name: '星降る丘',
    emoji: '✨',
    floorHue: 270,
    floorSaturation: 0.6,
    particleColor: [0.7, 0.4, 1.0],
    ambientColor: '#9f7aea',
    bloomTint: [0.8, 0.5, 1.2],
    bgColor: '#0f0a1a',
    description: '満天の星空の下、思いを語る',
  },
  sakura: {
    id: 'sakura',
    name: '桜の下で',
    emoji: '🌸',
    floorHue: 330,
    floorSaturation: 0.5,
    particleColor: [1.0, 0.6, 0.8],
    ambientColor: '#f9a8d4',
    bloomTint: [1.0, 0.6, 0.9],
    bgColor: '#1a0a14',
    description: '舞い散る花びらの中で、のんびりと',
  },
};

export const DEFAULT_THEME = ROOM_THEMES.cosmos;

/** ルームIDからテーマを推定 */
export function getThemeForRoom(roomId: string): RoomTheme {
  if (roomId.includes('demo-1')) return ROOM_THEMES.bonfire;
  if (roomId.includes('demo-2')) return ROOM_THEMES.ocean;
  if (roomId.includes('demo-3')) return ROOM_THEMES.cosmos;
  if (roomId.includes('demo-4')) return ROOM_THEMES.sakura;
  // Hash-based fallback
  let h = 0;
  for (let i = 0; i < roomId.length; i++) h = ((h << 5) - h + roomId.charCodeAt(i)) | 0;
  const themes = Object.values(ROOM_THEMES);
  return themes[Math.abs(h) % themes.length];
}
