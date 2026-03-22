/**
 * VoxelCatalog — プリセットモデルカタログ
 *
 * 設定駆動エンジン（VoxelEngine）で定義された
 * 全モデルテンプレートの一覧。新規モデルはここに追加するだけ。
 */

import { type ModelConfig, voxelRegistry } from './VoxelEngine';

// ============================================================
// 共通パレット
// ============================================================
const PALETTE_TRUNK = { name: 'trunk', colors: ['#8B6914', '#9B7424', '#7A5D0E', '#A67C30', '#6B4E08', '#856514'] };
const PALETTE_LEAVES = { name: 'leaves', colors: ['#228B22', '#2E8B57', '#32CD32', '#1B7A1B', '#3CB371', '#006400'] };
const PALETTE_ROCK = { name: 'rock', colors: ['#696969', '#808080', '#778899', '#5F5F5F', '#8B8B83'] };
const PALETTE_CRYSTAL = { name: 'crystal', colors: ['#9C27B0', '#BA68C8', '#7B1FA2', '#CE93D8', '#E040FB'] };
const PALETTE_CORAL = { name: 'coral', colors: ['#FF6B6B', '#FF8E8E', '#E74C3C', '#FF4757', '#FF6348'] };
const PALETTE_METAL = { name: 'metal', colors: ['#9E9E9E', '#BDBDBD', '#B0BEC5', '#78909C'] };
const PALETTE_GRASS = { name: 'grass', colors: ['#4CAF50', '#388E3C', '#2E7D32', '#43A047', '#66BB6A'] };

// ============================================================
// カタログ定義
// ============================================================

const CATALOG: ModelConfig[] = [
  // --- 装飾: ビーチ ---
  {
    id: 'palm-tree',
    name: 'ヤシの木',
    category: 'decoration',
    themes: ['beach'],
    gridSize: [20, 30, 20],
    renderDefaults: { voxelSize: 0.06, scale: 1, enableAO: true },
    palettes: [PALETTE_TRUNK, PALETTE_LEAVES],
    operations: [
      // 根元
      { type: 'cylinder', center: [10, 10], y: [0, 2], radius: 4, color: { palette: 'trunk', index: 0 } },
      // 幹
      { type: 'taper', base: [10, 0, 10], baseRadius: 3, topRadius: 1.5, height: 22, color: { palette: 'trunk' } },
      // バークリング
      { type: 'ring', center: [10, 5, 10], radius: 3.5, height: 1, color: { palette: 'trunk', index: 4 } },
      { type: 'ring', center: [10, 10, 10], radius: 3, height: 1, color: { palette: 'trunk', index: 4 } },
      { type: 'ring', center: [10, 15, 10], radius: 2.5, height: 1, color: { palette: 'trunk', index: 4 } },
      // 葉キャノピー
      { type: 'sphere', center: [10, 25, 10], radius: 5, color: { palette: 'leaves' } },
      { type: 'sphere', center: [10, 27, 10], radius: 3, color: { palette: 'leaves', index: 2 } },
    ],
    randomOperations: [
      { type: 'scatter_random', area: { from: [5, 24, 5], to: [15, 28, 15] }, density: 0.3, colors: ['#228B22', '#32CD32', '#3CB371'] },
    ],
    quality: { estimatedVoxels: 1500, rank: 'B', notes: '設定駆動版 — プロシージャル版(VoxelModels)の方が高品質' },
  },

  // --- 装飾: 地下室 ---
  {
    id: 'crystal-cluster',
    name: 'クリスタル群',
    category: 'decoration',
    themes: ['underground'],
    gridSize: [14, 18, 14],
    renderDefaults: { voxelSize: 0.05, enableAO: true, aoIntensity: 0.25 },
    palettes: [PALETTE_CRYSTAL, { name: 'highlight', colors: ['#F3E5F5', '#E1BEE7', '#D1C4E9'] }],
    operations: [
      // メインクリスタル
      { type: 'taper', base: [7, 0, 7], baseRadius: 3, topRadius: 0.5, height: 18, color: { palette: 'crystal' } },
      // サブクリスタル
      { type: 'taper', base: [4, 0, 5], baseRadius: 1.5, topRadius: 0.5, height: 10, color: { palette: 'crystal', index: 1 } },
      { type: 'taper', base: [10, 0, 6], baseRadius: 1.5, topRadius: 0.5, height: 8, color: { palette: 'crystal', index: 3 } },
      { type: 'taper', base: [5, 0, 10], baseRadius: 1, topRadius: 0.5, height: 7, color: { palette: 'crystal', index: 2 } },
      // ベース岩
      { type: 'ellipsoid', center: [7, 1, 7], radii: [5, 2, 5], color: { palette: 'crystal', index: 0 } },
    ],
    quality: { estimatedVoxels: 800, rank: 'B' },
  },

  // --- 装飾: 水族館 ---
  {
    id: 'coral-branch',
    name: 'サンゴ',
    category: 'decoration',
    themes: ['aquarium'],
    gridSize: [18, 16, 18],
    renderDefaults: { voxelSize: 0.06 },
    palettes: [PALETTE_CORAL],
    operations: [
      { type: 'ellipsoid', center: [9, 1, 9], radii: [5, 2, 5], color: '#5D4037' },
      { type: 'taper', base: [7, 2, 7], baseRadius: 2, topRadius: 0.5, height: 10, color: { palette: 'coral' } },
      { type: 'taper', base: [11, 2, 8], baseRadius: 1.5, topRadius: 0.5, height: 8, color: { palette: 'coral', index: 1 } },
      { type: 'taper', base: [9, 2, 12], baseRadius: 1.5, topRadius: 0.5, height: 9, color: { palette: 'coral', index: 2 } },
      { type: 'sphere', center: [7, 12, 7], radius: 2, color: { palette: 'coral', index: 3 } },
      { type: 'sphere', center: [11, 10, 8], radius: 1.5, color: { palette: 'coral', index: 4 } },
    ],
    quality: { estimatedVoxels: 600, rank: 'B' },
  },

  // --- 装飾: 屋上 ---
  {
    id: 'rooftop-building',
    name: '背景ビル',
    category: 'decoration',
    themes: ['rooftop'],
    gridSize: [12, 32, 8],
    renderDefaults: { voxelSize: 0.07 },
    palettes: [
      { name: 'building', colors: ['#1A1A2E', '#16213E', '#0F3460'] },
      { name: 'window', colors: ['#FFD700', '#FFECB3', '#FFF176'] },
    ],
    operations: [
      { type: 'box', from: [1, 0, 1], to: [10, 29, 6], color: { palette: 'building' } },
      { type: 'box', from: [0, 30, 0], to: [11, 30, 7], color: '#2C2C3A' },
      // 窓（繰り返し）
      { type: 'repeat', count: 9, offset: [0, 3, 0], op: {
        type: 'repeat', count: 3, offset: [3, 0, 0],
        op: { type: 'box', from: [2, 2, 1], to: [3, 3, 1], color: { palette: 'window' } },
      }},
    ],
    quality: { estimatedVoxels: 2000, rank: 'B' },
  },

  // --- 家具テンプレート: ベンチ ---
  {
    id: 'wooden-bench',
    name: '木のベンチ',
    category: 'furniture',
    gridSize: [12, 6, 6],
    renderDefaults: { voxelSize: 0.06 },
    palettes: [{ name: 'wood', colors: ['#8B4513', '#A0522D', '#6B3410', '#654321'] }],
    operations: [
      // 座面
      { type: 'box', from: [0, 4, 0], to: [11, 4, 5], color: { palette: 'wood' } },
      // 脚
      { type: 'box', from: [1, 0, 1], to: [2, 3, 2], color: { palette: 'wood', index: 2 } },
      { type: 'box', from: [9, 0, 1], to: [10, 3, 2], color: { palette: 'wood', index: 2 } },
      { type: 'box', from: [1, 0, 3], to: [2, 3, 4], color: { palette: 'wood', index: 2 } },
      { type: 'box', from: [9, 0, 3], to: [10, 3, 4], color: { palette: 'wood', index: 2 } },
      // 背もたれ
      { type: 'box', from: [0, 5, 0], to: [11, 5, 0], color: { palette: 'wood', index: 1 } },
    ],
    quality: { estimatedVoxels: 200, rank: 'B' },
  },

  // --- アバターテンプレート: ネコ ---
  {
    id: 'avatar-cat',
    name: 'ネコ（ボクセル）',
    category: 'avatar',
    gridSize: [10, 14, 8],
    renderDefaults: { voxelSize: 0.08 },
    palettes: [
      { name: 'body', colors: ['#FF8C00', '#FFA500', '#FF7F24'] },
      { name: 'detail', colors: ['#FFE4C4', '#FFF8DC', '#000000'] },
    ],
    operations: [
      // 胴体
      { type: 'box', from: [3, 4, 2], to: [6, 8, 5], color: { palette: 'body' } },
      // 頭
      { type: 'box', from: [2, 9, 1], to: [7, 12, 6], color: { palette: 'body', index: 1 } },
      // 耳
      { type: 'box', from: [2, 12, 2], to: [3, 13, 3], color: { palette: 'body' } },
      { type: 'box', from: [6, 12, 2], to: [7, 13, 3], color: { palette: 'body' } },
      // 目
      { type: 'box', from: [3, 10, 1], to: [3, 10, 1], color: '#000000' },
      { type: 'box', from: [6, 10, 1], to: [6, 10, 1], color: '#000000' },
      // 鼻
      { type: 'box', from: [4, 9, 1], to: [5, 9, 1], color: '#FF69B4' },
      // 足
      { type: 'box', from: [3, 0, 2], to: [4, 3, 3], color: { palette: 'body', index: 2 } },
      { type: 'box', from: [5, 0, 2], to: [6, 3, 3], color: { palette: 'body', index: 2 } },
      { type: 'box', from: [3, 0, 4], to: [4, 3, 5], color: { palette: 'body', index: 2 } },
      { type: 'box', from: [5, 0, 4], to: [6, 3, 5], color: { palette: 'body', index: 2 } },
      // しっぽ
      { type: 'line', from: [5, 5, 6], to: [5, 8, 7], color: { palette: 'body' }, thickness: 1 },
    ],
    quality: { estimatedVoxels: 300, rank: 'C', notes: 'テンプレート — プロシージャル版を推奨' },
  },
];

// ============================================================
// 初期化 — カタログをレジストリに登録
// ============================================================
export function initializeCatalog(): void {
  voxelRegistry.registerAll(CATALOG);
}

/** カタログ定義のエクスポート（ユーザーが直接参照する場合） */
export { CATALOG };
