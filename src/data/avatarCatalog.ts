/**
 * cocoro — Avatar Catalog
 * VRoid公式サンプルモデルで統一 — ブランドの一貫性
 *
 * 全モデルが同じ系統(VRoid Studio生成)なので:
 * - blendshape(リップシンク/表情/瞬き)が完備
 * - テイストが揃い、世界観に統一感がある
 * - CC0/MITライセンスで安心
 */

export interface AvatarDefinition {
  id: string;
  name: string;
  description: string;
  vrmUrl: string;
  accentColor: string;
  gradient: [string, string];
  tags: string[];
  bgColor: string;
  personality: string;
}

/**
 * VRoid公式サンプル統一カタログ
 * 全てpixiv/three-vrmリポジトリの公式サンプル
 * 同じトーン・同じクオリティでブランド統一
 */
export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'avatar-b',
    name: 'ソラ',
    description: 'やさしくて頼れる',
    vrmUrl:
      'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/AvatarSample_B.vrm',
    accentColor: '#7c5cfc',
    gradient: ['#7c5cfc', '#a78bfa'],
    tags: ['やさしい', 'リーダー'],
    bgColor: '#eef2ff',
    personality: '🌤️ やさしい',
  },
  {
    id: 'avatar-a',
    name: 'ヒナ',
    description: '元気でポジティブ',
    vrmUrl:
      'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/AvatarSample_A.vrm',
    accentColor: '#ec4899',
    gradient: ['#ec4899', '#f472b6'],
    tags: ['元気', 'ポジティブ'],
    bgColor: '#fdf2f8',
    personality: '🌸 元気',
  },
];

/** デフォルトアバター */
export const DEFAULT_AVATAR_ID = 'avatar-b';

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
