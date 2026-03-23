/**
 * VoxelCatalog — プリセットモデルカタログ（高品質版）
 *
 * 全アセットがqualityGate品質チェックを通過するレベルで定義。
 * 高品質プリミティブ (rounded_box, gradient_ellipsoid, noisy_sphere,
 * noisy_fill, kawaii_face, shade_gradient) を必須使用。
 *
 * 推奨: 新規追加時は qualityGate(config) で score >= 70 を確認。
 */

import { type ModelConfig, voxelRegistry } from './VoxelEngine';

// ============================================================
// 共通パレット（温かみ系・豊富な色段階）
// ============================================================
const PALETTE_TRUNK = { name: 'trunk', colors: ['#4A3308', '#5C4010', '#6B4E14', '#7A5C18', '#8B6B1E', '#9B7A28', '#AB8A32', '#BB9A3C'] };
const PALETTE_LEAVES = { name: 'leaves', colors: ['#1A5C1A', '#207020', '#268526', '#2E9A2E', '#38AF38', '#45C045', '#55D055', '#68DD68'] };
const PALETTE_ROCK = { name: 'rock', colors: ['#6B6358', '#7A7268', '#8B8278', '#9C9488', '#ADA598'] };
const PALETTE_CRYSTAL = { name: 'crystal', colors: ['#9C27B0', '#BA68C8', '#7B1FA2', '#CE93D8', '#E040FB'] };
const PALETTE_CRYSTAL_HL = { name: 'crystal_hl', colors: ['#F3E5F5', '#E1BEE7', '#D1C4E9', '#FFFFFF'] };
const PALETTE_CORAL = { name: 'coral', colors: ['#FF6B6B', '#FF8E8E', '#E74C3C', '#FF4757', '#FF6348'] };
const PALETTE_CORAL_HL = { name: 'coral_hl', colors: ['#FFE0E0', '#FFCDD2', '#FFFFFF'] };
const PALETTE_METAL = { name: 'metal', colors: ['#9E9E9E', '#BDBDBD', '#B0BEC5', '#78909C'] };
const PALETTE_GRASS = { name: 'grass', colors: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'] };
const PALETTE_WOOD = { name: 'wood', colors: ['#5C3317', '#6B3E1E', '#7A4925', '#8B552C', '#9C6133', '#AD6D3A'] };
const PALETTE_FABRIC = { name: 'fabric', colors: ['#E8D5C4', '#F0E0D0', '#F5EBE0', '#FFF3E0'] };
const PALETTE_CAT_BODY = { name: 'body', colors: ['#FF8C00', '#FFA500', '#FF7F24', '#E07800'] };
const PALETTE_CAT_DETAIL = { name: 'detail', colors: ['#FFE4C4', '#FFF8DC', '#111111', '#FFB6C1'] };

// ============================================================
// カタログ定義（高品質プリミティブ使用）
// ============================================================

const CATALOG: ModelConfig[] = [
  // --- 装飾: ビーチ — ヤシの木 ---
  {
    id: 'palm-tree',
    name: 'ヤシの木',
    category: 'decoration',
    themes: ['beach'],
    gridSize: [20, 30, 20],
    renderDefaults: { voxelSize: 0.06, scale: 1, enableAO: true, aoIntensity: 0.4 },
    palettes: [PALETTE_TRUNK, PALETTE_LEAVES],
    operations: [
      // 根元（有機的根）
      { type: 'organic_roots', center: [10, 2, 10], count: 5, length: 4, palette: PALETTE_TRUNK.colors },
      // 幹（ノイズ付きテーパー → shade_gradient で上が明るく）
      { type: 'taper', base: [10, 0, 10], baseRadius: 3, topRadius: 1.5, height: 22, color: { palette: 'trunk' } },
      { type: 'shade_gradient', from: [7, 0, 7], to: [13, 22, 13], baseColor: '#6B4E14', direction: 'y', factor: 0.3 },
      // バークリング
      { type: 'ring', center: [10, 5, 10], radius: 3.5, height: 1, color: { palette: 'trunk', index: 4 } },
      { type: 'ring', center: [10, 10, 10], radius: 3, height: 1, color: { palette: 'trunk', index: 5 } },
      { type: 'ring', center: [10, 15, 10], radius: 2.5, height: 1, color: { palette: 'trunk', index: 6 } },
      // 葉キャノピー（グラデーション楕円体）
      { type: 'gradient_ellipsoid', center: [10, 25, 10], radii: [5, 3, 5], bottomColor: '#1A5C1A', topColor: '#55D055' },
      { type: 'noisy_sphere', center: [10, 27, 10], radius: 3, palette: PALETTE_LEAVES.colors, noiseAmount: 0.2 },
      // ハイライト
      { type: 'highlight', positions: [[10, 28, 10], [9, 27, 11], [11, 27, 9]], color: '#FFFFFF' },
    ],
    randomOperations: [
      { type: 'scatter_random', area: { from: [5, 24, 5], to: [15, 28, 15] }, density: 0.25, colors: ['#228B22', '#32CD32', '#3CB371', '#55D055'] },
    ],
    quality: { estimatedVoxels: 2000, rank: 'A', notes: '高品質版: organic_roots + gradient_ellipsoid + noisy_sphere' },
  },

  // --- 装飾: 地下室 — クリスタル群 ---
  {
    id: 'crystal-cluster',
    name: 'クリスタル群',
    category: 'decoration',
    themes: ['underground'],
    gridSize: [16, 20, 16],
    renderDefaults: { voxelSize: 0.05, enableAO: true, aoIntensity: 0.3 },
    palettes: [PALETTE_CRYSTAL, PALETTE_CRYSTAL_HL],
    operations: [
      // ベース岩（ノイズ球体で不規則な地形）
      { type: 'noisy_sphere', center: [8, 2, 8], radius: 5, palette: PALETTE_ROCK.colors, noiseAmount: 0.2 },
      // メインクリスタル（シェードグラデーション）
      { type: 'taper', base: [8, 1, 8], baseRadius: 3, topRadius: 0.5, height: 18, color: { palette: 'crystal' } },
      { type: 'shade_gradient', from: [5, 1, 5], to: [11, 19, 11], baseColor: '#9C27B0', direction: 'y', factor: 0.4 },
      // サブクリスタル
      { type: 'taper', base: [4, 1, 5], baseRadius: 1.5, topRadius: 0.5, height: 11, color: { palette: 'crystal', index: 1 } },
      { type: 'taper', base: [12, 1, 7], baseRadius: 1.5, topRadius: 0.5, height: 9, color: { palette: 'crystal', index: 3 } },
      { type: 'taper', base: [6, 1, 12], baseRadius: 1, topRadius: 0.5, height: 8, color: { palette: 'crystal', index: 2 } },
      // ハイライト（白い輝き）
      { type: 'highlight', positions: [[8, 18, 8], [4, 11, 5], [12, 9, 7], [6, 8, 12]], color: '#FFFFFF' },
    ],
    quality: { estimatedVoxels: 1200, rank: 'A', notes: '高品質版: noisy_sphere + shade_gradient + highlight' },
  },

  // --- 装飾: 水族館 — サンゴ ---
  {
    id: 'coral-branch',
    name: 'サンゴ',
    category: 'decoration',
    themes: ['aquarium'],
    gridSize: [18, 18, 18],
    renderDefaults: { voxelSize: 0.06, enableAO: true, aoIntensity: 0.35 },
    palettes: [PALETTE_CORAL, PALETTE_CORAL_HL],
    operations: [
      // ベース（ノイズ球体）
      { type: 'noisy_sphere', center: [9, 2, 9], radius: 4, palette: ['#5D4037', '#6D4C41', '#795548'] },
      // メイン枝（グラデーション）
      { type: 'taper', base: [7, 3, 7], baseRadius: 2, topRadius: 0.5, height: 12, color: { palette: 'coral' } },
      { type: 'shade_gradient', from: [5, 3, 5], to: [9, 15, 9], baseColor: '#FF6B6B', direction: 'y', factor: 0.35 },
      // サブ枝
      { type: 'taper', base: [12, 3, 9], baseRadius: 1.5, topRadius: 0.5, height: 9, color: { palette: 'coral', index: 1 } },
      { type: 'taper', base: [9, 3, 13], baseRadius: 1.5, topRadius: 0.5, height: 10, color: { palette: 'coral', index: 2 } },
      // 先端の球（ノイズ）
      { type: 'noisy_sphere', center: [7, 14, 7], radius: 2, palette: PALETTE_CORAL.colors, noiseAmount: 0.18 },
      { type: 'noisy_sphere', center: [12, 11, 9], radius: 1.5, palette: PALETTE_CORAL.colors, noiseAmount: 0.15 },
      // ハイライト
      { type: 'highlight', positions: [[7, 15, 7], [12, 12, 9], [9, 12, 13]], color: '#FFE0E0' },
    ],
    quality: { estimatedVoxels: 900, rank: 'A', notes: '高品質版: noisy_sphere + shade_gradient + highlight' },
  },

  // --- 装飾: 屋上 — 背景ビル ---
  {
    id: 'rooftop-building',
    name: '背景ビル',
    category: 'decoration',
    themes: ['rooftop'],
    gridSize: [14, 34, 10],
    renderDefaults: { voxelSize: 0.07, enableAO: true, aoIntensity: 0.3 },
    palettes: [
      { name: 'building', colors: ['#1A1A2E', '#16213E', '#0F3460', '#1A1A3A'] },
      { name: 'window', colors: ['#FFD700', '#FFECB3', '#FFF176', '#FF8C00'] },
    ],
    operations: [
      // 本体（ノイズ塗りで壁面テクスチャ）
      { type: 'noisy_fill', from: [1, 0, 1], to: [12, 31, 8], palette: ['#1A1A2E', '#16213E', '#0F3460', '#1A1A3A'], variance: 0.08 },
      // 屋上
      { type: 'rounded_box', from: [0, 31, 0], to: [13, 32, 9], color: '#2C2C3A', cornerCut: 1 },
      // 窓（繰り返し）
      { type: 'repeat', count: 9, offset: [0, 3, 0], op: {
        type: 'repeat', count: 3, offset: [4, 0, 0],
        op: { type: 'box', from: [2, 2, 1], to: [3, 3, 1], color: { palette: 'window' } },
      }},
      // 屋上アンテナ
      { type: 'line', from: [7, 32, 5], to: [7, 33, 5], color: '#888', thickness: 1 },
      // 壁面グラデーション（下が暗く上が少し明るく）
      { type: 'shade_gradient', from: [1, 0, 1], to: [12, 31, 1], baseColor: '#16213E', direction: 'y', factor: 0.25 },
    ],
    quality: { estimatedVoxels: 3000, rank: 'A', notes: '高品質版: noisy_fill + rounded_box + shade_gradient' },
  },

  // --- 家具テンプレート: ベンチ ---
  {
    id: 'wooden-bench',
    name: '木のベンチ',
    category: 'furniture',
    gridSize: [14, 8, 8],
    renderDefaults: { voxelSize: 0.06, enableAO: true, aoIntensity: 0.4 },
    palettes: [PALETTE_WOOD, PALETTE_FABRIC],
    operations: [
      // 座面（角丸ボックス）
      { type: 'rounded_box', from: [0, 5, 0], to: [13, 5, 7], color: { palette: 'wood' }, cornerCut: 1 },
      // 座面テクスチャ（ノイズ塗り）
      { type: 'noisy_fill', from: [1, 5, 1], to: [12, 5, 6], palette: PALETTE_WOOD.colors, variance: 0.12 },
      // 脚（角丸）
      { type: 'rounded_box', from: [1, 0, 1], to: [2, 4, 2], color: { palette: 'wood', index: 3 }, cornerCut: 1 },
      { type: 'rounded_box', from: [11, 0, 1], to: [12, 4, 2], color: { palette: 'wood', index: 3 }, cornerCut: 1 },
      { type: 'rounded_box', from: [1, 0, 5], to: [2, 4, 6], color: { palette: 'wood', index: 3 }, cornerCut: 1 },
      { type: 'rounded_box', from: [11, 0, 5], to: [12, 4, 6], color: { palette: 'wood', index: 3 }, cornerCut: 1 },
      // 背もたれ
      { type: 'rounded_box', from: [0, 6, 0], to: [13, 7, 0], color: { palette: 'wood', index: 1 }, cornerCut: 1 },
      // 背もたれハイライト
      { type: 'highlight', positions: [[1, 7, 0], [6, 7, 0], [12, 7, 0]], color: '#D4A574' },
    ],
    quality: { estimatedVoxels: 400, rank: 'A', notes: '高品質版: rounded_box + noisy_fill + highlight' },
  },

  // --- アバターテンプレート: ネコ ---
  {
    id: 'avatar-cat',
    name: 'ネコ（ボクセル）',
    category: 'avatar',
    gridSize: [12, 16, 10],
    renderDefaults: { voxelSize: 0.08, enableAO: true, aoIntensity: 0.45 },
    palettes: [PALETTE_CAT_BODY, PALETTE_CAT_DETAIL],
    operations: [
      // 胴体（角丸）
      { type: 'rounded_box', from: [3, 5, 3], to: [8, 9, 6], color: { palette: 'body' }, cornerCut: 1 },
      // 胴体テクスチャ
      { type: 'noisy_fill', from: [4, 5, 3], to: [7, 9, 6], palette: PALETTE_CAT_BODY.colors, variance: 0.08 },
      // 頭（角丸）
      { type: 'rounded_box', from: [2, 10, 2], to: [9, 14, 7], color: { palette: 'body', index: 1 }, cornerCut: 1 },
      // 耳
      { type: 'box', from: [2, 14, 3], to: [3, 15, 4], color: { palette: 'body' } },
      { type: 'box', from: [8, 14, 3], to: [9, 15, 4], color: { palette: 'body' } },
      // 耳の中（ピンク）
      { type: 'highlight', positions: [[3, 14, 3], [8, 14, 3]], color: '#FFB6C1' },
      // kawaii顔
      { type: 'kawaii_face', center: [5, 11], faceZ: 2, eyeColor: '#111111', noseColor: '#FF69B4', blushColor: '#FFB6C1', eyeSize: 'medium' },
      // 足
      { type: 'rounded_box', from: [3, 0, 3], to: [4, 4, 4], color: { palette: 'body', index: 2 }, cornerCut: 1 },
      { type: 'rounded_box', from: [7, 0, 3], to: [8, 4, 4], color: { palette: 'body', index: 2 }, cornerCut: 1 },
      { type: 'rounded_box', from: [3, 0, 5], to: [4, 4, 6], color: { palette: 'body', index: 2 }, cornerCut: 1 },
      { type: 'rounded_box', from: [7, 0, 5], to: [8, 4, 6], color: { palette: 'body', index: 2 }, cornerCut: 1 },
      // しっぽ
      { type: 'line', from: [6, 6, 7], to: [6, 9, 9], color: { palette: 'body' }, thickness: 1 },
    ],
    quality: { estimatedVoxels: 500, rank: 'A', notes: '高品質版: rounded_box + noisy_fill + kawaii_face + highlight' },
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
