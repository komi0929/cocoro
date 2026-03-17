/**
 * cocoro — Avatar Catalog
 * 公開VRMモデルのカタログ
 * ユーザーが自分の「顔」を選べるアイデンティティシステムの基盤
 *
 * 各アバターに個性・雰囲気・カラーパレットを定義
 * メタバースで「全員同じ顔」を根本から排除する
 *
 * モデルソース:
 * - pixiv/three-vrm 公式サンプル (VRM1.0)
 * - ToxSam/open-source-avatars CC0コレクション (Arweave永続URL)
 * - mrxz/vrm-sample-models (CC0, VRM1.0-beta)
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
 * 6体すべてユニークなVRMモデルを使用
 * 全モデルCC0またはパブリックドメイン
 */
export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'seed-san',
    name: 'Seed-san',
    description: '穏やかで親しみやすい雰囲気',
    // Source: pixiv/three-vrm official sample (VRM1.0)
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm',
    accentColor: '#8b5cf6',
    gradient: ['#8b5cf6', '#a78bfa'],
    tags: ['ナチュラル', '親しみやすい'],
    bgColor: '#1a1025',
    personality: '🌿 穏やか',
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
  {
    id: 'human-basic',
    name: 'ヒューマン',
    description: 'シンプルで万能なスタンダード',
    // Source: mrxz/vrm-sample-models CC0 (VRM1.0-beta)
    vrmUrl:
      'https://raw.githubusercontent.com/mrxz/vrm-sample-models/master/human_male/human_male.vrm',
    accentColor: '#10b981',
    gradient: ['#10b981', '#34d399'],
    tags: ['スタンダード', '万能'],
    bgColor: '#0a1a12',
    personality: '🌐 万能',
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
