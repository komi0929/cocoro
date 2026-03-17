/**
 * cocoro — Avatar Catalog
 * 公開VRMモデルのカタログ
 * ユーザーが自分の「顔」を選べるアイデンティティシステムの基盤
 *
 * 各アバターに個性・雰囲気・カラーパレットを定義
 * メタバースで「全員同じ顔」を根本から排除する
 *
 * 本番用: VRoid公式サンプル(blendshape完備) + CC0モデル
 */

export interface AvatarDefinition {
  id: string;
  name: string;
  description: string;
  /** VRM model URL */
  vrmUrl: string;
  /** 代表色 (hex) */
  accentColor: string;
  /** グラデーション [from, to] */
  gradient: [string, string];
  /** カテゴリタグ */
  tags: string[];
  /** サムネイル用の背景色 */
  bgColor: string;
  /** アバターの「性格」（UI表示用） */
  personality: string;
}

/**
 * 本番品質VRMモデル — リップシンク/表情ブレンドシェイプ完備
 * VRoid公式サンプル: aa/ih/ou/ee/oh viseme + happy/angry/sad/surprised + blink 全対応
 */
export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'seed-san',
    name: 'Seed-san',
    description: '穏やかで親しみやすい雰囲気',
    // VRoid公式サンプルモデルB (VRM0.0 — full blendshapes)
    vrmUrl:
      'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/AvatarSample_B.vrm',
    accentColor: '#8b5cf6',
    gradient: ['#8b5cf6', '#a78bfa'],
    tags: ['ナチュラル', '親しみやすい'],
    bgColor: '#1a1025',
    personality: '🌿 穏やか',
  },
  {
    id: 'avatar-a',
    name: 'アリサ',
    description: 'キュートでポジティブ',
    // VRoid公式サンプルモデルA (VRM0.0 — full blendshapes)
    vrmUrl:
      'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/AvatarSample_A.vrm',
    accentColor: '#ec4899',
    gradient: ['#ec4899', '#f472b6'],
    tags: ['キュート', 'ポジティブ'],
    bgColor: '#1a0f18',
    personality: '🌸 キュート',
  },
  {
    id: 'devil',
    name: 'デビル',
    description: 'ダークでワイルドな存在感',
    // Source: 100avatars CC0 — Avatar 031: Devil (Arweave permanent)
    vrmUrl:
      'https://arweave.net/gfVzs1oH_aPaHVxpQK86HT_rqzyrFPOUKUrDJ30yprs',
    accentColor: '#ef4444',
    gradient: ['#dc2626', '#ef4444'],
    tags: ['ダーク', 'ワイルド'],
    bgColor: '#1a0a0a',
    personality: '🔥 情熱的',
  },
  {
    id: 'polydancer',
    name: 'ポリダンサー',
    description: 'リズミカルで自由なスタイル',
    // Source: 100avatars CC0 — Avatar 021: Polydancer (Arweave permanent)
    vrmUrl:
      'https://arweave.net/jPOg-G0MPH55ZQmamFhT9f8cHn-hjeAQ0mRO5gWeKMQ',
    accentColor: '#06b6d4',
    gradient: ['#06b6d4', '#22d3ee'],
    tags: ['ダンサー', 'フリースタイル'],
    bgColor: '#0a1520',
    personality: '💃 自由',
  },
  {
    id: 'rose',
    name: 'ローズ',
    description: 'エレガントで華やかな存在',
    // Source: 100avatars CC0 — Avatar 057: Rose (Arweave permanent)
    vrmUrl:
      'https://arweave.net/Ea1KXujzJatQgCFSMzGOzp_UtHqB1pyia--U3AtkMAY',
    accentColor: '#ec4899',
    gradient: ['#ec4899', '#f472b6'],
    tags: ['エレガント', '華やか'],
    bgColor: '#1a0f18',
    personality: '🌹 優雅',
  },
  {
    id: 'robert',
    name: 'ロバート',
    description: '堅実で頼れるリーダータイプ',
    // Source: 100avatars CC0 — Avatar 070: Robert (Arweave permanent)
    vrmUrl:
      'https://arweave.net/gwG7w4bY-A5c3R6A6GOz3xBCgbPvkFQmqPIDtvnNsYI',
    accentColor: '#f59e0b',
    gradient: ['#f59e0b', '#fbbf24'],
    tags: ['リーダー', '堅実'],
    bgColor: '#1a1508',
    personality: '☀️ 堅実',
  },
];

/** デフォルトアバター（未選択時） */
export const DEFAULT_AVATAR_ID = 'seed-san';

/** IDからアバター定義を取得 */
export function getAvatarById(id: string): AvatarDefinition | undefined {
  return AVATAR_CATALOG.find((a) => a.id === id);
}

/** ランダムなアバターIDを取得（NPC用） */
export function getRandomAvatarId(excludeIds: string[] = []): string {
  const available = AVATAR_CATALOG.filter((a) => !excludeIds.includes(a.id));
  if (available.length === 0) return DEFAULT_AVATAR_ID;
  return available[Math.floor(Math.random() * available.length)].id;
}
