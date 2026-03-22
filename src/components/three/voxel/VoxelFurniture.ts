/**
 * VoxelFurniture — Kawaii家具・アイテム生成エンジン
 *
 * 参考画像のハチミツ壺のような、温かみと可愛さを持つ
 * 家具・配置オブジェ・持ちアイテムをプロシージャルに生成する。
 *
 * カテゴリ:
 * - テーブル/椅子/ベッド等の家具
 * - 食べ物/植木鉢/ランプ等の小物
 * - kawaii顔付きオブジェ（壺、クッション等）
 */

import { VoxelData, createGrid, setVoxel, fillBox, fillSphere, fillCylinder } from './VoxelGrid';
import {
  seededRand, pick, lerp, noisyPick, blendColors,
  fillRoundedBox, fillGradientEllipsoid, fillNoisySphere, drawKawaiiFace,
  PAL_WOOD, PAL_FABRIC, PAL_HONEY, PAL_METAL_WARM, PAL_FLOWERS,
  adjustBrightness,
} from './VoxelDesign';

// ============================================================
// ハチミツ壺（参考画像の主役オブジェ再現）
// ============================================================
export function generateHoneyJar(seed: number = 42): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(16, 20, 16);
  const cx = 8, cz = 8;

  // 本体（丸くてぷっくり）
  for (let y = 0; y < 14; y++) {
    const t = y / 13;
    // 樽型（中央が太く、上下が細い）
    const r = y < 2 ? lerp(3, 4, t * 5)
      : y < 11 ? lerp(5, 5.5, Math.sin(t * Math.PI))
      : lerp(5, 3, (t - 0.8) * 5);
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          const color = noisyPick(PAL_HONEY, seed + y + dx + dz, 0.08);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // 蓋（木の蓋）
  for (let y = 14; y <= 16; y++) {
    const r = y === 14 ? 4 : y === 15 ? 3.5 : 2;
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          setVoxel(grid, cx + dx, y, cz + dz, noisyPick(PAL_WOOD, seed + y + dx));
        }
      }
    }
  }
  // 蓋の取っ手
  setVoxel(grid, cx, 17, cz, noisyPick(PAL_WOOD, seed + 1000));
  setVoxel(grid, cx, 18, cz, noisyPick(PAL_WOOD, seed + 1001));

  // ラベル（前面に白いエリア）
  for (let y = 5; y <= 10; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      setVoxel(grid, cx + dx, y, cz - 5, '#FFF8E1');
    }
  }

  // kawaii顔（前面）
  const faceZ = cz - 5;
  // 目（2x1）
  setVoxel(grid, cx - 2, 9, faceZ, '#1A1A1A');
  setVoxel(grid, cx - 2, 8, faceZ, '#1A1A1A');
  setVoxel(grid, cx + 2, 9, faceZ, '#1A1A1A');
  setVoxel(grid, cx + 2, 8, faceZ, '#1A1A1A');
  // ハイライト
  setVoxel(grid, cx - 2, 9, faceZ, '#FFFFFF');
  setVoxel(grid, cx + 2, 9, faceZ, '#FFFFFF');
  // ほっぺ
  setVoxel(grid, cx - 3, 7, faceZ, '#FFB6C1');
  setVoxel(grid, cx + 3, 7, faceZ, '#FFB6C1');
  // 口（にっこり）
  setVoxel(grid, cx - 1, 6, faceZ, '#8B6914');
  setVoxel(grid, cx, 6, faceZ, '#8B6914');
  setVoxel(grid, cx + 1, 6, faceZ, '#8B6914');

  // ハチミツの垂れ
  setVoxel(grid, cx + 3, 13, cz - 4, '#DAA520');
  setVoxel(grid, cx + 3, 12, cz - 4, '#E4B027');
  setVoxel(grid, cx - 2, 13, cz - 3, '#D4A017');
  setVoxel(grid, cx - 2, 12, cz - 3, '#DAA520');

  return grid;
}

// ============================================================
// テーブル（丸脚、木目テクスチャ）
// ============================================================
export function generateTable(seed: number = 100): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(18, 12, 12);
  const cx = 9, cz = 6;

  // 天板（角丸）
  fillRoundedBox(grid, 1, 9, 1, 16, 10, 10, noisyPick(PAL_WOOD, seed), 1);
  // 天板上面のグラデーション
  for (let z = 1; z <= 10; z++) {
    for (let x = 1; x <= 16; x++) {
      const t = (x - 1) / 15;
      setVoxel(grid, x, 10, z, blendColors(
        noisyPick(PAL_WOOD, seed + x + z),
        adjustBrightness(pick(PAL_WOOD, seed), 1.15),
        t * 0.3 + (rand() - 0.5) * 0.1,
      ));
    }
  }

  // 4本脚（丸脚）
  const legPositions = [[3, 3], [14, 3], [3, 8], [14, 8]];
  for (const [lx, lz] of legPositions) {
    for (let y = 0; y < 9; y++) {
      const r = y < 1 ? 1.5 : y < 7 ? 1 : 1.2;
      for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dz * dz <= r * r) {
            setVoxel(grid, lx! + dx, y, lz! + dz, noisyPick(PAL_WOOD, seed + y + lx! + lz!));
          }
        }
      }
    }
  }

  return grid;
}

// ============================================================
// 椅子（クッション付き、kawaii）
// ============================================================
export function generateChair(seed: number = 200): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(10, 16, 10);
  const CUSHION_COLORS = ['#FF8A65', '#FF7043', '#FFB74D', '#FFA726', '#FFCC80'];

  // 4本脚
  const legs = [[1, 1], [8, 1], [1, 8], [8, 8]];
  for (const [lx, lz] of legs) {
    for (let y = 0; y < 6; y++) {
      setVoxel(grid, lx!, y, lz!, noisyPick(PAL_WOOD, seed + y + lx!));
    }
  }

  // 座面フレーム
  fillRoundedBox(grid, 0, 6, 0, 9, 7, 9, noisyPick(PAL_WOOD, seed + 100), 1);

  // クッション（ぷっくり丸み）
  for (let z = 1; z <= 8; z++) {
    for (let x = 1; x <= 8; x++) {
      const dx = x - 4.5, dz = z - 4.5;
      const puff = Math.max(0, 1 - (dx * dx + dz * dz) / 20) * 0.5;
      setVoxel(grid, x, 8, z, noisyPick(CUSHION_COLORS, seed + x + z));
      if (puff > 0.2) {
        setVoxel(grid, x, 9, z, noisyPick(CUSHION_COLORS, seed + x + z + 50));
      }
    }
  }

  // 背もたれ
  for (let y = 7; y <= 14; y++) {
    for (let x = 0; x <= 9; x++) {
      const atEdge = x === 0 || x === 9;
      setVoxel(grid, x, y, 9, noisyPick(PAL_WOOD, seed + y + x + 200));
      if (!atEdge && y > 8 && y < 14) {
        // 背もたれの隙間（デザイン）
        if (x > 2 && x < 7 && y > 10 && y < 13) continue;
        setVoxel(grid, x, y, 9, noisyPick(PAL_WOOD, seed + y + x + 200));
      }
    }
  }

  return grid;
}

// ============================================================
// ランプ（光るkawaii照明）
// ============================================================
export function generateLamp(seed: number = 300): VoxelData {
  const grid = createGrid(10, 18, 10);
  const cx = 5, cz = 5;
  const LAMP_WARM = ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F'];
  const SHADE_COLORS = ['#FFAB91', '#FF8A65', '#FF7043'];

  // ベース
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dz * dz <= 5) {
        setVoxel(grid, cx + dx, 0, cz + dz, noisyPick(PAL_METAL_WARM, seed + dx + dz));
      }
    }
  }

  // ポール
  for (let y = 1; y < 10; y++) {
    setVoxel(grid, cx, y, cz, noisyPick(PAL_METAL_WARM, seed + y));
  }

  // シェード（傘状）
  for (let y = 10; y <= 15; y++) {
    const t = (y - 10) / 5;
    const r = lerp(4, 1, t);
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          const color = t > 0.6 ? noisyPick(SHADE_COLORS, seed + dx + dz + y) : noisyPick(LAMP_WARM, seed + dx + dz + y);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  return grid;
}

// ============================================================
// クッション（丸くてkawaii、顔付き）
// ============================================================
export function generateCushion(seed: number = 400, color: string = '#FF8A65'): VoxelData {
  const grid = createGrid(12, 6, 12);
  const cx = 6, cz = 6;
  const pal = [color, adjustBrightness(color, 0.9), adjustBrightness(color, 1.1),
               adjustBrightness(color, 0.8), adjustBrightness(color, 1.2)];

  // ぷっくり形状
  for (let y = 0; y < 4; y++) {
    const t = y / 3;
    const r = y === 0 ? 4 : y === 1 ? 5 : y === 2 ? 5 : 4;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz <= r * r) {
          setVoxel(grid, cx + dx, y, cz + dz, noisyPick(pal, seed + y + dx + dz));
        }
      }
    }
  }

  // kawaii顔
  const faceZ = cz - 5;
  setVoxel(grid, cx - 2, 2, faceZ, '#1A1A1A'); // 左目
  setVoxel(grid, cx + 2, 2, faceZ, '#1A1A1A'); // 右目
  setVoxel(grid, cx - 2, 2, faceZ, '#FFFFFF'); // ハイライト
  setVoxel(grid, cx + 2, 2, faceZ, '#FFFFFF');
  setVoxel(grid, cx, 1, faceZ, '#FFB6C1'); // 口
  setVoxel(grid, cx - 3, 1, faceZ, '#FFB6C1'); // ほっぺ
  setVoxel(grid, cx + 3, 1, faceZ, '#FFB6C1');

  return grid;
}

// ============================================================
// 植木鉢（多肉植物入り）
// ============================================================
export function generatePottedPlant(seed: number = 500): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(10, 14, 10);
  const cx = 5, cz = 5;
  const POT_COLORS = ['#D2691E', '#CD853F', '#A0522D', '#B8742E'];
  const PLANT_GREENS = ['#2E7D32', '#388E3C', '#4CAF50', '#66BB6A', '#81C784'];

  // 鉢本体（テーパー）
  for (let y = 0; y < 6; y++) {
    const t = y / 5;
    const r = lerp(2.5, 3.5, t);
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          setVoxel(grid, cx + dx, y, cz + dz, noisyPick(POT_COLORS, seed + y + dx + dz));
        }
      }
    }
  }
  // 鉢の縁
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dz * dz <= 16 && dx * dx + dz * dz > 10) {
        setVoxel(grid, cx + dx, 6, cz + dz, noisyPick(POT_COLORS, seed + dx + dz + 100));
      }
    }
  }

  // 土
  for (let dz = -3; dz <= 3; dz++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dz * dz <= 10) {
        setVoxel(grid, cx + dx, 6, cz + dz, '#5D4037');
      }
    }
  }

  // 多肉植物（ロゼット状）
  for (let layer = 0; layer < 3; layer++) {
    const r = 3 - layer;
    const y = 7 + layer;
    for (let angle = 0; angle < 8; angle++) {
      const a = (angle / 8) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(a) * r);
      const pz = Math.round(cz + Math.sin(a) * r);
      setVoxel(grid, px, y, pz, noisyPick(PLANT_GREENS, seed + angle + layer * 10));
      if (layer < 2) {
        setVoxel(grid, px, y + 1, pz, noisyPick(PLANT_GREENS, seed + angle + layer * 10 + 50));
      }
    }
  }
  // 中心
  setVoxel(grid, cx, 10, cz, noisyPick(PLANT_GREENS, seed + 500));
  setVoxel(grid, cx, 11, cz, pick(PLANT_GREENS, seed + 501));

  return grid;
}

// ============================================================
// 本棚（温かみのある木材＋カラフルな本）
// ============================================================
export function generateBookshelf(seed: number = 600): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(16, 20, 6);
  const BOOK_COLORS = ['#8B0000', '#00008B', '#006400', '#8B4513', '#4B0082',
                        '#B8860B', '#2F4F4F', '#800020', '#FF6347', '#4169E1'];

  // フレーム
  // 側面
  for (let y = 0; y < 20; y++) {
    for (let z = 0; z < 6; z++) {
      setVoxel(grid, 0, y, z, noisyPick(PAL_WOOD, seed + y + z));
      setVoxel(grid, 15, y, z, noisyPick(PAL_WOOD, seed + y + z + 100));
    }
  }
  // 棚板（4段）
  for (const shelfY of [0, 5, 10, 15, 19]) {
    for (let z = 0; z < 6; z++) {
      for (let x = 0; x < 16; x++) {
        setVoxel(grid, x, shelfY, z, noisyPick(PAL_WOOD, seed + x + z + shelfY));
      }
    }
  }
  // 背板
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 16; x++) {
      setVoxel(grid, x, y, 5, noisyPick(PAL_WOOD, seed + x + y + 200));
    }
  }

  // 本（各段にランダム配置）
  for (const baseY of [1, 6, 11, 16]) {
    let x = 1;
    while (x < 15) {
      const bookW = 1;
      const bookH = 3 + Math.floor(rand() * 2);
      const bookColor = pick(BOOK_COLORS, seed + x + baseY);

      for (let y = baseY; y < baseY + bookH && y < baseY + 4; y++) {
        for (let z = 1; z < 5; z++) {
          setVoxel(grid, x, y, z, noisyPick([bookColor, adjustBrightness(bookColor, 0.9)], seed + y + z));
        }
      }
      x += bookW + (rand() > 0.7 ? 1 : 0); // たまに隙間
    }
  }

  return grid;
}

// ============================================================
// ベッド（kawaii＋ふわふわ布団）
// ============================================================
export function generateBed(seed: number = 700): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(16, 10, 24);
  const BLANKET_COLORS = ['#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6'];
  const PILLOW_COLORS = ['#FFF8E1', '#FFECB3', '#FFE082', '#FFF3E0'];

  // フレーム
  fillRoundedBox(grid, 0, 0, 0, 15, 4, 23, noisyPick(PAL_WOOD, seed), 1);

  // マットレス
  for (let z = 1; z <= 22; z++) {
    for (let x = 1; x <= 14; x++) {
      setVoxel(grid, x, 5, z, '#FFFFFF');
      setVoxel(grid, x, 6, z, noisyPick(PAL_FABRIC, seed + x + z));
    }
  }

  // 布団（ぷっくり波状）
  for (let z = 6; z <= 20; z++) {
    for (let x = 1; x <= 14; x++) {
      const puff = Math.sin(z * 0.4) * 0.5 + Math.sin(x * 0.3) * 0.3;
      const maxY = 7 + (puff > 0.3 ? 1 : 0);
      for (let y = 7; y <= maxY; y++) {
        setVoxel(grid, x, y, z, noisyPick(BLANKET_COLORS, seed + x + z + y));
      }
    }
  }

  // 枕（2個）
  for (const px of [4, 11]) {
    for (let z = 1; z <= 5; z++) {
      for (let dx = -2; dx <= 2; dx++) {
        const puffY = Math.abs(dx) <= 1 && z >= 2 && z <= 4 ? 8 : 7;
        for (let y = 7; y <= puffY; y++) {
          setVoxel(grid, px + dx, y, z, noisyPick(PILLOW_COLORS, seed + dx + z + y));
        }
      }
    }
  }

  // ヘッドボード
  for (let x = 0; x <= 15; x++) {
    for (let y = 5; y <= 9; y++) {
      setVoxel(grid, x, y, 0, noisyPick(PAL_WOOD, seed + x + y + 300));
    }
  }

  return grid;
}

// ============================================================
// 食べ物: ケーキ（kawaii）
// ============================================================
export function generateCake(seed: number = 800): VoxelData {
  const grid = createGrid(12, 10, 12);
  const cx = 6, cz = 6;
  const CREAM_COLORS = ['#FFF8E1', '#FFECB3', '#FFF3E0', '#FFEFD5'];
  const CAKE_COLORS = ['#D2691E', '#CD853F', '#A0522D'];
  const BERRY_COLORS = ['#FF0000', '#FF4444', '#CC0000', '#FF6666'];

  // ケーキ本体（2層）
  for (let y = 0; y < 7; y++) {
    const r = 4;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz <= r * r) {
          const isLayer = y === 3;
          const color = isLayer
            ? noisyPick(CREAM_COLORS, seed + dx + dz)
            : noisyPick(CAKE_COLORS, seed + y + dx + dz);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // クリームトップ
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dz * dz <= 16) {
        setVoxel(grid, cx + dx, 7, cz + dz, noisyPick(CREAM_COLORS, seed + dx + dz + 100));
      }
    }
  }

  // クリームの渦巻き
  for (let angle = 0; angle < 12; angle++) {
    const a = (angle / 12) * Math.PI * 2;
    const r = 3;
    setVoxel(grid, cx + Math.round(Math.cos(a) * r), 8, cz + Math.round(Math.sin(a) * r),
      noisyPick(CREAM_COLORS, seed + angle));
  }
  setVoxel(grid, cx, 8, cz, noisyPick(CREAM_COLORS, seed + 200));
  setVoxel(grid, cx, 9, cz, noisyPick(CREAM_COLORS, seed + 201));

  // イチゴ
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    setVoxel(grid, cx + Math.round(Math.cos(a) * 2.5), 8, cz + Math.round(Math.sin(a) * 2.5),
      pick(BERRY_COLORS, seed + i));
  }

  return grid;
}
