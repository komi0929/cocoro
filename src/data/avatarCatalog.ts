/**
 * kokoro — Avatar Catalog
 * 公開VRMモデルのカタログ
 * ユーザーが自分の「顔」を選べるアイデンティティシステムの基盤
 *
 * 各アバターに個性・雰囲気・カラーパレットを定義
 * メタバースで「全員同じ顔」を根本から排除する
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
 * VRM公開サンプルモデルのカタログ
 * Three-VRM公式サンプル + VRoid Hub公開モデルを使用
 */
export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'seed-san',
    name: 'Seed-san',
    description: '穏やかで親しみやすい雰囲気',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm',
    accentColor: '#8b5cf6',
    gradient: ['#8b5cf6', '#a78bfa'],
    tags: ['ナチュラル', '親しみやすい'],
    bgColor: '#1a1025',
    personality: '🌿 穏やか',
  },
  {
    id: 'ai-chan',
    name: 'AIChan',
    description: 'ポップでエネルギッシュ',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/AIChan_vrm1_test_MToonAllTexture_2.0.vrm',
    accentColor: '#ec4899',
    gradient: ['#ec4899', '#f472b6'],
    tags: ['ポップ', '元気'],
    bgColor: '#1a0f18',
    personality: '⚡ 元気',
  },
  {
    id: 'three-vrm-girl',
    name: 'アリシア',
    description: 'クールで知的なスタイル',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/three-vrm-girl.vrm',
    accentColor: '#06b6d4',
    gradient: ['#06b6d4', '#22d3ee'],
    tags: ['クール', '知的'],
    bgColor: '#0a1520',
    personality: '❄️ クール',
  },
  {
    id: 'masculine-1',
    name: 'ハルト',
    description: 'スポーティで爽やかな青年',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm',
    accentColor: '#f59e0b',
    gradient: ['#f59e0b', '#fbbf24'],
    tags: ['スポーティ', '爽やか'],
    bgColor: '#1a1508',
    personality: '☀️ 爽やか',
  },
  {
    id: 'mysterious',
    name: 'ミズキ',
    description: '神秘的で不思議な存在感',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/three-vrm-girl.vrm',
    accentColor: '#a855f7',
    gradient: ['#7c3aed', '#a855f7'],
    tags: ['ミステリアス', '不思議'],
    bgColor: '#150a20',
    personality: '🌙 神秘的',
  },
  {
    id: 'cheerful',
    name: 'ヒナタ',
    description: '明るくてみんなのムードメーカー',
    vrmUrl:
      'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/AIChan_vrm1_test_MToonAllTexture_2.0.vrm',
    accentColor: '#10b981',
    gradient: ['#10b981', '#34d399'],
    tags: ['明るい', 'ムードメーカー'],
    bgColor: '#0a1a12',
    personality: '🌸 明るい',
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
