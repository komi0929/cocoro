/**
 * VoxelFurniture v2 — キューブベース家具・アイテム量産
 *
 * 参考画像の家具スタイル:
 * - 木のテーブル: フラットな天板 + 角の太い脚
 * - 棚: 直方体フレーム + カラフルな本/アイテム
 * - 樽: 縦方向の板 + 帯金属
 * - PC/デスク: 直方体の組み合わせ
 *
 * ルール: フラットカラー、直方体ベース、ノイズなし
 */

import { VoxelData, createGrid, setVoxel } from './VoxelGrid';

// フラットカラー塗りつぶし（ノイズなし）
function fillFlat(
  grid: VoxelData, x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number, color: string,
): void {
  for (let y = y1; y <= y2; y++)
    for (let z = z1; z <= z2; z++)
      for (let x = x1; x <= x2; x++)
        setVoxel(grid, x, y, z, color);
}

// ============================================================
// ハチミツ壺（kawaii顔付き）
// ============================================================
export function generateHoneyJar(_seed: number = 42): VoxelData {
  const grid = createGrid(12, 14, 12);
  const cx = 6, cz = 6;
  const HONEY = '#FFD54F';
  const HONEY_DARK = '#E4B027';
  const WOOD = '#8B5A36';

  // 本体（樽型: 2段の直方体）
  fillFlat(grid, cx - 3, 0, cz - 3, cx + 3, 0, cz + 3, HONEY_DARK); // 底
  fillFlat(grid, cx - 3, 1, cz - 3, cx + 3, 7, cz + 3, HONEY); // 本体
  fillFlat(grid, cx - 4, 2, cz - 4, cx + 4, 6, cz + 4, HONEY); // 膨らみ
  fillFlat(grid, cx - 3, 8, cz - 3, cx + 3, 8, cz + 3, HONEY_DARK); // 首

  // 蓋
  fillFlat(grid, cx - 3, 9, cz - 3, cx + 3, 9, cz + 3, WOOD);
  fillFlat(grid, cx - 2, 10, cz - 2, cx + 2, 10, cz + 2, WOOD);
  setVoxel(grid, cx, 11, cz, '#6B3E1E'); // 取っ手

  // ラベル（前面）
  fillFlat(grid, cx - 2, 3, cz - 4, cx + 2, 6, cz - 4, '#FFF8E1');

  // kawaii顔
  const fz = cz - 5;
  // 目
  setVoxel(grid, cx - 1, 5, fz + 1, '#1A1A1A');
  setVoxel(grid, cx - 1, 6, fz + 1, '#1A1A1A');
  setVoxel(grid, cx + 2, 5, fz + 1, '#1A1A1A');
  setVoxel(grid, cx + 2, 6, fz + 1, '#1A1A1A');
  // ハイライト
  setVoxel(grid, cx - 1, 6, fz + 1, '#FFFFFF');
  setVoxel(grid, cx + 2, 6, fz + 1, '#FFFFFF');
  // 口
  setVoxel(grid, cx, 4, fz + 1, '#8B6914');
  setVoxel(grid, cx + 1, 4, fz + 1, '#8B6914');
  // ほっぺ
  setVoxel(grid, cx - 2, 4, fz + 1, '#FFB6C1');
  setVoxel(grid, cx + 3, 4, fz + 1, '#FFB6C1');

  // ハチミツ垂れ
  setVoxel(grid, cx + 3, 7, cz - 3, '#DAA520');
  setVoxel(grid, cx + 3, 6, cz - 3, '#DAA520');

  return grid;
}

// ============================================================
// テーブル（木の天板 + 太い角脚）
// ============================================================
export function generateTable(_seed: number = 100): VoxelData {
  const grid = createGrid(14, 10, 10);
  const WOOD = '#A0724E';
  const WOOD_TOP = '#B8845E';

  // 天板
  fillFlat(grid, 0, 7, 0, 13, 8, 9, WOOD_TOP);
  fillFlat(grid, 0, 7, 0, 13, 7, 9, WOOD);

  // 4本脚（太め: 2x2）
  fillFlat(grid, 0, 0, 0, 1, 6, 1, WOOD);
  fillFlat(grid, 12, 0, 0, 13, 6, 1, WOOD);
  fillFlat(grid, 0, 0, 8, 1, 6, 9, WOOD);
  fillFlat(grid, 12, 0, 8, 13, 6, 9, WOOD);

  return grid;
}

// ============================================================
// 椅子（座面 + 背もたれ + 脚）
// ============================================================
export function generateChair(_seed: number = 200): VoxelData {
  const grid = createGrid(8, 14, 8);
  const WOOD = '#A0724E';
  const CUSHION = '#FF8A65';

  // 脚
  fillFlat(grid, 0, 0, 0, 0, 4, 0, WOOD);
  fillFlat(grid, 7, 0, 0, 7, 4, 0, WOOD);
  fillFlat(grid, 0, 0, 7, 0, 4, 7, WOOD);
  fillFlat(grid, 7, 0, 7, 7, 4, 7, WOOD);

  // 座面フレーム
  fillFlat(grid, 0, 5, 0, 7, 6, 7, WOOD);

  // クッション
  fillFlat(grid, 1, 7, 1, 6, 7, 6, CUSHION);

  // 背もたれ
  fillFlat(grid, 0, 7, 7, 7, 12, 7, WOOD);
  // 背もたれ装飾穴
  fillFlat(grid, 2, 9, 7, 5, 11, 7, '#00000000'); // 透明にはできないのでスキップ

  return grid;
}

// ============================================================
// ランプ（ベース + ポール + シェード）
// ============================================================
export function generateLamp(_seed: number = 300): VoxelData {
  const grid = createGrid(8, 14, 8);
  const METAL = '#D4A574';
  const SHADE = '#FFE4B5';
  const SHADE_TOP = '#FFCC80';

  // ベース
  fillFlat(grid, 2, 0, 2, 5, 0, 5, METAL);

  // ポール
  fillFlat(grid, 3, 1, 3, 4, 7, 4, METAL);

  // シェード（台形）
  fillFlat(grid, 1, 8, 1, 6, 8, 6, SHADE);
  fillFlat(grid, 0, 9, 0, 7, 9, 7, SHADE);
  fillFlat(grid, 0, 10, 0, 7, 11, 7, SHADE_TOP);

  // 光（頂上）
  setVoxel(grid, 3, 12, 3, '#FFFFFF');
  setVoxel(grid, 4, 12, 4, '#FFFFFF');

  return grid;
}

// ============================================================
// クッション（丸いkawaii顔付き）
// ============================================================
export function generateCushion(_seed: number = 400, color: string = '#FF8A65'): VoxelData {
  const grid = createGrid(10, 4, 10);
  const cx = 5, cz = 5;

  // ぷっくり形状（2段の直方体）
  fillFlat(grid, cx - 3, 0, cz - 3, cx + 3, 0, cz + 3, color);
  fillFlat(grid, cx - 4, 1, cz - 4, cx + 4, 2, cz + 4, color);
  fillFlat(grid, cx - 3, 3, cz - 3, cx + 3, 3, cz + 3, color);

  // kawaii顔（前面）
  setVoxel(grid, cx - 1, 2, cz - 4, '#1A1A1A');
  setVoxel(grid, cx + 2, 2, cz - 4, '#1A1A1A');
  setVoxel(grid, cx, 1, cz - 4, '#FFB6C1');

  return grid;
}

// ============================================================
// 植木鉢（多肉植物入り）
// ============================================================
export function generatePottedPlant(_seed: number = 500): VoxelData {
  const grid = createGrid(8, 12, 8);
  const POT = '#B8642E';
  const POT_RIM = '#CD853F';
  const SOIL = '#5D4037';
  const GREEN = '#4CAF50';
  const GREEN_DARK = '#2E7D32';

  // 鉢（テーパー: 下が細い）
  fillFlat(grid, 2, 0, 2, 5, 1, 5, POT);
  fillFlat(grid, 1, 2, 1, 6, 4, 6, POT);
  fillFlat(grid, 0, 5, 0, 7, 5, 7, POT_RIM);

  // 土
  fillFlat(grid, 1, 5, 1, 6, 5, 6, SOIL);

  // 植物（直方体の葉）
  fillFlat(grid, 3, 6, 3, 4, 8, 4, GREEN); // 茎
  fillFlat(grid, 1, 8, 2, 6, 9, 5, GREEN); // 葉1
  fillFlat(grid, 2, 9, 1, 5, 10, 6, GREEN_DARK); // 葉2
  fillFlat(grid, 2, 10, 2, 5, 11, 5, GREEN); // 葉先端

  return grid;
}

// ============================================================
// 本棚（カラフルな本入り）
// ============================================================
export function generateBookshelf(_seed: number = 600): VoxelData {
  const grid = createGrid(14, 16, 5);
  const WOOD = '#A0724E';
  const WOOD_DARK = '#8B5A36';

  // フレーム（側面）
  fillFlat(grid, 0, 0, 0, 0, 15, 4, WOOD_DARK);
  fillFlat(grid, 13, 0, 0, 13, 15, 4, WOOD_DARK);

  // 棚板
  for (const sy of [0, 4, 8, 12, 15]) {
    fillFlat(grid, 0, sy, 0, 13, sy, 4, WOOD);
  }

  // 背板
  fillFlat(grid, 0, 0, 4, 13, 15, 4, WOOD_DARK);

  // 本（各段にカラフルに配置）
  const BOOK_COLORS = ['#8B0000', '#00008B', '#006400', '#8B4513', '#4B0082',
                        '#B8860B', '#FF6347', '#4169E1', '#800080', '#2F4F4F'];
  let ci = 0;
  for (const baseY of [1, 5, 9, 13]) {
    let x = 1;
    while (x < 13) {
      const bookH = baseY === 13 ? 2 : 3;
      const color = BOOK_COLORS[ci % BOOK_COLORS.length]!;
      fillFlat(grid, x, baseY, 1, x, baseY + bookH - 1, 3, color);
      x += 1;
      ci++;
    }
  }

  return grid;
}

// ============================================================
// ベッド（フレーム + マットレス + 掛け布団 + 枕）
// ============================================================
export function generateBed(_seed: number = 700): VoxelData {
  const grid = createGrid(14, 8, 18);
  const WOOD = '#A0724E';
  const SHEET = '#B3E5FC';
  const PILLOW = '#FFF8E1';
  const BLANKET = '#81D4FA';

  // フレーム
  fillFlat(grid, 0, 0, 0, 13, 2, 17, WOOD);

  // マットレス
  fillFlat(grid, 1, 3, 1, 12, 4, 16, '#FFFFFF');

  // 掛け布団
  fillFlat(grid, 1, 5, 5, 12, 5, 16, BLANKET);
  fillFlat(grid, 1, 6, 6, 12, 6, 15, SHEET);

  // 枕
  fillFlat(grid, 2, 5, 1, 5, 6, 4, PILLOW);
  fillFlat(grid, 8, 5, 1, 11, 6, 4, PILLOW);

  // ヘッドボード
  fillFlat(grid, 0, 3, 0, 13, 7, 0, WOOD);

  return grid;
}

// ============================================================
// ケーキ（kawaii）
// ============================================================
export function generateCake(_seed: number = 800): VoxelData {
  const grid = createGrid(10, 8, 10);
  const cx = 5, cz = 5;
  const CAKE = '#CD853F';
  const CREAM = '#FFF8E1';
  const BERRY = '#FF4444';

  // ケーキ本体
  fillFlat(grid, cx - 3, 0, cz - 3, cx + 3, 4, cz + 3, CAKE);

  // クリーム層
  fillFlat(grid, cx - 3, 2, cz - 3, cx + 3, 2, cz + 3, CREAM);
  fillFlat(grid, cx - 3, 5, cz - 3, cx + 3, 5, cz + 3, CREAM);

  // イチゴ
  setVoxel(grid, cx - 2, 6, cz, BERRY);
  setVoxel(grid, cx + 2, 6, cz, BERRY);
  setVoxel(grid, cx, 6, cz - 2, BERRY);
  setVoxel(grid, cx, 6, cz + 2, BERRY);
  setVoxel(grid, cx, 6, cz, CREAM);
  setVoxel(grid, cx, 7, cz, CREAM); // 頂上

  return grid;
}
