/**
 * VoxelModels — 高密度プロシージャルボクセルモデル生成エンジン
 *
 * 参考画像（Honey Island Defense）レベルの密度を実現するため、
 * 大きなグリッド（32x50+）上に詳細なモデルを手続き的に生成する。
 *
 * 全モデルは VoxelData を返し、VoxelGrid コンポーネントでレンダリングされる。
 */

import { VoxelData, createGrid, setVoxel, fillBox, fillSphere, fillCylinder, fillEllipsoid, drawLine } from './VoxelGrid';

// ============================================================
// 共通ユーティリティ
// ============================================================

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================
// カラーパレット
// ============================================================

const PALM_TRUNK = ['#8B6914', '#9B7424', '#7A5D0E', '#A67C30', '#6B4E08', '#B8860B', '#CD9B1D', '#856514'];
const PALM_TRUNK_DARK = ['#5C450A', '#6B4E08', '#4A3605', '#3D2B04'];
const PALM_LEAVES = ['#228B22', '#2E8B57', '#32CD32', '#1B7A1B', '#3CB371', '#006400', '#2E7D32', '#1B5E20'];
const PALM_LEAVES_LIGHT = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7'];
const GRASS_COLORS = ['#4CAF50', '#388E3C', '#2E7D32', '#43A047', '#66BB6A', '#1B5E20', '#357A38'];
const GRASS_DARK = ['#2E5D2E', '#1A4A1A', '#0D3B0D'];
const FLOWER_COLORS = ['#FF69B4', '#FF1493', '#FFD700', '#FF6347', '#DA70D6', '#FF4081', '#FFB74D', '#CE93D8'];
const ROCK_GRAYS = ['#696969', '#808080', '#778899', '#5F5F5F', '#8B8B83', '#6E6E6E', '#A9A9A9', '#757575'];
const ROCK_BROWNS = ['#5D4037', '#4E342E', '#3E2723', '#6D4C41', '#795548'];
const CRYSTAL_PURPLES = ['#9C27B0', '#BA68C8', '#7B1FA2', '#CE93D8', '#E040FB', '#AB47BC', '#8E24AA'];
const CRYSTAL_HIGHLIGHTS = ['#F3E5F5', '#E1BEE7', '#D1C4E9'];
const CORAL_REDS = ['#FF6B6B', '#FF8E8E', '#E74C3C', '#FF4757', '#FF6348', '#EF5350', '#F44336'];
const CORAL_ORANGES = ['#FF7043', '#FF8A65', '#FFAB91'];
const LAVA_HOT = ['#FF4500', '#FF6347', '#FF0000', '#FFD700', '#FF8C00', '#FF5722'];
const LAVA_COOL = ['#B71C1C', '#D32F2F', '#E53935'];
const SEAWEED_GREENS = ['#006400', '#228B22', '#2E8B57', '#3CB371', '#1B5E20', '#00695C'];
const BUILDING_DARKS = ['#1A1A2E', '#16213E', '#0F3460', '#1B1B3A', '#232946'];
const BUILDING_LIGHTS = ['#2C2C3A', '#3D3D4A', '#4A4A5A'];
const WINDOW_YELLOWS = ['#FFD700', '#FFECB3', '#FFF176', '#FFEE58'];
const NEON_COLORS = ['#FF1493', '#00FF7F', '#00BFFF', '#FF4081', '#76FF03'];
const METAL_GRAYS = ['#9E9E9E', '#BDBDBD', '#B0BEC5', '#78909C', '#90A4AE'];
const WOOD_BROWNS = ['#8B4513', '#A0522D', '#6B3410', '#654321', '#5C3317'];

// ============================================================
// ヤシの木 — 超高密度版
// グリッド: 40x55x40, 幹: 太い柱+バークテクスチャ+リング
// 葉: 12本フロンド、各8セグメント+葉脈
// ============================================================
export function generatePalmTree(seed: number = 42): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(40, 55, 40);
  const cx = 20, cz = 20;

  // === 根元の広がり(根っこ) ===
  for (let r = 0; r < 4; r++) {
    const radius = 5 - r;
    const y = r;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz <= radius * radius) {
          setVoxel(grid, cx + dx, y, cz + dz, pick(PALM_TRUNK_DARK, seed + dx + dz));
        }
      }
    }
  }

  // === 幹（高さ30ブロック、5x5→3x3テーパー + バークリング） ===
  for (let y = 4; y < 34; y++) {
    const t = (y - 4) / 30;
    const lean = Math.floor(t * 4); // 少し傾く
    const width = Math.round(lerp(2.5, 1.5, t)); // 上に行くほど細く

    for (let dz = -width; dz <= width; dz++) {
      for (let dx = -width; dx <= width; dx++) {
        if (dx * dx + dz * dz <= width * width + 0.5) {
          const isEdge = Math.abs(dx) === width || Math.abs(dz) === width;
          const trunkColor = isEdge
            ? pick(PALM_TRUNK_DARK, seed + y + dx)
            : pick(PALM_TRUNK, seed + y + dx + dz);
          setVoxel(grid, cx + dx + lean, y, cz + dz, trunkColor);
        }
      }
    }

    // バークリング（3ブロックごとに横一列の凸）
    if (y % 3 === 0) {
      for (let dz = -(width + 1); dz <= width + 1; dz++) {
        for (let dx = -(width + 1); dx <= width + 1; dx++) {
          const d2 = dx * dx + dz * dz;
          if (d2 > width * width && d2 <= (width + 1) * (width + 1)) {
            setVoxel(grid, cx + dx + lean, y, cz + dz, pick(PALM_TRUNK_DARK, seed + y + 500));
          }
        }
      }
    }

    // ランダム凹凸
    if (rand() > 0.5) {
      const angle = rand() * Math.PI * 2;
      const bx = Math.round(Math.cos(angle) * (width + 1));
      const bz = Math.round(Math.sin(angle) * (width + 1));
      setVoxel(grid, cx + bx + lean, y, cz + bz, pick(PALM_TRUNK, seed + y + 100));
    }
  }

  // === 葉のキャノピー ===
  const topY = 34;
  const lean = Math.floor(4);
  const leafCx = cx + lean;

  // コアキャノピー球
  fillSphere(grid, leafCx, topY + 5, cz, 5, pick(PALM_LEAVES, seed));
  fillSphere(grid, leafCx, topY + 8, cz, 3, pick(PALM_LEAVES_LIGHT, seed + 1));

  // 12本フロンド
  for (let f = 0; f < 12; f++) {
    const angle = (f / 12) * Math.PI * 2 + (rand() - 0.5) * 0.2;
    const droopRate = 0.25 + rand() * 0.15;
    const frondLen = 12 + Math.floor(rand() * 4);

    for (let seg = 0; seg < frondLen; seg++) {
      const t = seg / frondLen;
      const fx = Math.round(leafCx + Math.cos(angle) * seg);
      const fy = Math.round(topY + 6 - seg * droopRate);
      const fz = Math.round(cz + Math.sin(angle) * seg);

      // メインライン（2ブロック厚）
      const leafColor = t < 0.5
        ? pick(PALM_LEAVES, seed + f + seg)
        : pick(PALM_LEAVES_LIGHT, seed + f + seg);

      setVoxel(grid, fx, fy, fz, leafColor);
      setVoxel(grid, fx, fy + 1, fz, pick(PALM_LEAVES, seed + f + seg + 50));

      // 幅（先端に向かって狭く）
      const halfW = Math.max(0, Math.round(lerp(3, 0, t)));
      const perpX = -Math.sin(angle);
      const perpZ = Math.cos(angle);

      for (let w = -halfW; w <= halfW; w++) {
        if (w === 0) continue;
        const wx = Math.round(fx + perpX * w);
        const wz = Math.round(fz + perpZ * w);
        const shade = Math.abs(w) === halfW
          ? pick(PALM_LEAVES_LIGHT, seed + f + seg + w)
          : pick(PALM_LEAVES, seed + f + seg + w);
        setVoxel(grid, wx, fy, wz, shade);
      }
    }
  }

  // === ココナッツ (6個) ===
  const coconutPositions = [
    [1, 1], [-1, 0], [0, -1], [1, -1], [-1, 1], [0, 1]
  ];
  for (const [dx, dz] of coconutPositions) {
    setVoxel(grid, leafCx + dx!, topY, cz + dz!, '#5C3D1E');
    setVoxel(grid, leafCx + dx!, topY + 1, cz + dz!, '#8B4513');
  }

  return grid;
}

// ============================================================
// 草地ブロック — 高密度版
// ============================================================
export function generateGrassField(width: number, depth: number, seed: number = 100): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(width, 6, depth);

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      // 地層: 3層
      setVoxel(grid, x, 0, z, pick(ROCK_BROWNS, seed + x + z));
      setVoxel(grid, x, 1, z, pick(GRASS_DARK, seed + x + z + 100));
      setVoxel(grid, x, 2, z, pick(GRASS_COLORS, seed + x * 7 + z * 13));

      // ランダム高草ブレード
      if (rand() > 0.6) {
        setVoxel(grid, x, 3, z, pick(GRASS_COLORS, seed + x + z + 1000));
      }
      if (rand() > 0.85) {
        setVoxel(grid, x, 4, z, pick(GRASS_COLORS, seed + x + z + 2000));
      }
      // 花
      if (rand() > 0.92) {
        const flowerH = 3 + (rand() > 0.5 ? 1 : 0);
        setVoxel(grid, x, flowerH, z, pick(FLOWER_COLORS, seed + x + z + 3000));
      }
    }
  }
  return grid;
}

// ============================================================
// 岩 — 層状テクスチャ＋苔＋クラック
// ============================================================
export function generateRock(size: number = 10, seed: number = 300): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(size, size, size);
  const c = size / 2;

  // 不規則球体（ノイズ付き）
  for (let y = 0; y < size; y++) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const dx = x - c, dy = y - c, dz = z - c;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const noise = (rand() - 0.5) * 1.5;
        const threshold = c * 0.75 + noise;

        if (dist < threshold) {
          // 層状テクスチャ: Y位置で色が変わる
          const layerT = y / size;
          let color: string;
          if (layerT < 0.3) {
            color = pick(ROCK_BROWNS, seed + x + y + z);
          } else if (layerT < 0.7) {
            color = pick(ROCK_GRAYS, seed + x + y + z);
          } else {
            color = lerpColor(
              pick(ROCK_GRAYS, seed + x),
              pick(ROCK_BROWNS, seed + z),
              rand()
            );
          }

          // 苔（上面付近にランダム）
          if (y > size * 0.6 && rand() > 0.7) {
            color = pick(GRASS_DARK, seed + x + z);
          }

          setVoxel(grid, x, y, z, color);
        }
      }
    }
  }

  // クラック（ランダムなライン）
  for (let i = 0; i < 3; i++) {
    const sx = Math.floor(rand() * size);
    const sy = Math.floor(rand() * size * 0.5) + Math.floor(size * 0.2);
    const sz = Math.floor(rand() * size);
    const ex = Math.floor(rand() * size);
    const ey = sy + Math.floor((rand() - 0.5) * 3);
    const ez = Math.floor(rand() * size);
    drawLine(grid, sx, sy, sz, ex, ey, ez, '#2D2D2D');
  }

  return grid;
}

// ============================================================
// クリスタル群 — 屈折・内部グロー・カット面
// ============================================================
export function generateCrystal(height: number = 18, seed: number = 400): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(14, height, 14);
  const cx = 7, cz = 7;

  // メインクリスタル（六角柱+テーパー）
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const radius = Math.max(1, Math.round(lerp(3, 0.5, t * t)));

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // 六角形近似
        if (Math.abs(dx) + Math.abs(dz) <= radius * 1.5 && Math.abs(dx) <= radius && Math.abs(dz) <= radius) {
          const isEdge = Math.abs(dx) + Math.abs(dz) > radius * 1.2;
          let color: string;
          if (isEdge) {
            // エッジ→ハイライト
            color = pick(CRYSTAL_HIGHLIGHTS, seed + y + dx);
          } else if (t > 0.3 && t < 0.7 && rand() > 0.6) {
            // 内部グロー (中間部)
            color = pick(CRYSTAL_HIGHLIGHTS, seed + y + 200);
          } else {
            color = pick(CRYSTAL_PURPLES, seed + y + dx + dz);
          }
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // サブクリスタル（4本の小さい結晶）
  const subCrystals = [
    { ox: -3, oz: -2, h: Math.floor(height * 0.5), tilt: 0.2 },
    { ox: 3, oz: -1, h: Math.floor(height * 0.4), tilt: -0.15 },
    { ox: -2, oz: 3, h: Math.floor(height * 0.45), tilt: 0.1 },
    { ox: 2, oz: 3, h: Math.floor(height * 0.35), tilt: -0.25 },
  ];

  for (const sub of subCrystals) {
    for (let y = 0; y < sub.h; y++) {
      const t = y / sub.h;
      const w = Math.max(1, Math.round(lerp(1.5, 0.5, t)));
      const xOff = Math.round(y * sub.tilt);

      for (let dz = -w; dz <= w; dz++) {
        for (let dx = -w; dx <= w; dx++) {
          if (Math.abs(dx) + Math.abs(dz) <= w * 1.5) {
            const color = pick(CRYSTAL_PURPLES, seed + y + sub.ox + sub.oz);
            setVoxel(grid, cx + sub.ox + dx + xOff, y, cz + sub.oz + dz, color);
          }
        }
      }
    }
  }

  // ベース岩
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (rand() > 0.3 && dx * dx + dz * dz < 18) {
        setVoxel(grid, cx + dx, 0, cz + dz, pick(ROCK_GRAYS, seed + dx + dz));
      }
    }
  }

  return grid;
}

// ============================================================
// サンゴ — ブランチング＋ポリプ＋グラデーション
// ============================================================
export function generateCoral(seed: number = 500): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(18, 16, 18);
  const cx = 9, cz = 9;

  // ベース岩盤
  fillEllipsoid(grid, cx, 1, cz, 5, 2, 5, pick(ROCK_BROWNS, seed));

  // メインブランチ（6本の枝）
  const branches = [
    { bx: cx - 2, bz: cz - 2 }, { bx: cx + 2, bz: cz - 1 },
    { bx: cx, bz: cz + 2 }, { bx: cx - 3, bz: cz + 1 },
    { bx: cx + 3, bz: cz }, { bx: cx + 1, bz: cz + 3 },
  ];

  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi]!;
    const h = 6 + Math.floor(rand() * 6);
    const mainColor = pick(CORAL_REDS, seed + bi);
    const tipColor = pick(CORAL_ORANGES, seed + bi + 50);

    for (let y = 2; y < h + 2; y++) {
      const t = (y - 2) / h;
      const sway = Math.round(Math.sin(y * 0.8 + bi) * 0.6);
      const color = t > 0.7 ? tipColor : mainColor;

      setVoxel(grid, b.bx + sway, y, b.bz, color);
      // 太さ（根元太、先端細）
      if (t < 0.6) {
        setVoxel(grid, b.bx + sway + 1, y, b.bz, color);
        setVoxel(grid, b.bx + sway, y, b.bz + 1, color);
      }

      // 枝分かれ
      if (y > 4 && rand() > 0.5) {
        const dx = rand() > 0.5 ? 1 : -1;
        const dz = rand() > 0.5 ? 1 : -1;
        for (let sy = 0; sy < 3; sy++) {
          setVoxel(grid, b.bx + sway + dx * (sy + 1), y + sy, b.bz + dz * Math.floor(sy / 2),
            pick(CORAL_REDS, seed + bi + y + sy));
        }
      }
    }

    // 先端ポリプ（球）
    fillSphere(grid, b.bx + Math.round(Math.sin(h * 0.8 + bi) * 0.6), h + 2, b.bz, 2, tipColor);
  }

  return grid;
}

// ============================================================
// キノコ — ギル(ひだ)＋ドット模様＋太い茎
// ============================================================
export function generateMushroom(seed: number = 600): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(14, 14, 14);
  const cx = 7, cz = 7;
  const CAP_COLORS = ['#FF0000', '#FF4444', '#CC0000', '#FF6666', '#E53935'];
  const STEM_COLORS = ['#F5F5DC', '#FFF8E1', '#EFEBE9', '#FFF3E0'];

  // 茎（中央3x3、高さ6、少しテーパー）
  for (let y = 0; y < 6; y++) {
    const w = y < 2 ? 2 : 1;
    for (let dz = -w; dz <= w; dz++) {
      for (let dx = -w; dx <= w; dx++) {
        if (dx * dx + dz * dz <= w * w + 0.5) {
          setVoxel(grid, cx + dx, y, cz + dz, pick(STEM_COLORS, seed + y + dx));
        }
      }
    }
  }

  // 傘（半球体、半径5）
  for (let y = 5; y <= 11; y++) {
    const localY = y - 5;
    const r = localY <= 1 ? 5 : localY <= 3 ? 4 : localY <= 5 ? 2.5 : 1;
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          // ドット模様
          const isSpot = ((Math.abs(dx) + Math.abs(dz)) % 4 === 0) && localY > 0 && localY < 5;
          const color = isSpot ? '#FFFFFF' : pick(CAP_COLORS, seed + dx + dz + y);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // ギル（傘の下面に放射状ライン）
  for (let angle = 0; angle < 8; angle++) {
    const a = (angle / 8) * Math.PI * 2;
    for (let r = 1; r <= 4; r++) {
      const gx = Math.round(cx + Math.cos(a) * r);
      const gz = Math.round(cz + Math.sin(a) * r);
      setVoxel(grid, gx, 5, gz, '#FFE0B2');
    }
  }

  return grid;
}

// ============================================================
// 溶岩流 — 高輝度グラデーション＋岩の熱変色
// ============================================================
export function generateLavaFlow(seed: number = 700): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(24, 8, 12);
  const HEAT_ROCKS = ['#2C2C2C', '#3D1A0A', '#4A1A0A', '#331111'];

  // 岩の基盤（3層、不規則な高さ）
  for (let z = 0; z < 12; z++) {
    for (let x = 0; x < 24; x++) {
      const baseH = 1 + Math.floor(rand() * 2);
      for (let y = 0; y < baseH; y++) {
        // 溶岩近くの岩は熱変色
        const distToCenter = Math.abs(z - 6);
        const color = distToCenter < 3
          ? pick(HEAT_ROCKS, seed + x + z)
          : pick(ROCK_BROWNS, seed + x + z);
        setVoxel(grid, x, y, z, color);
      }
    }
  }

  // 溶岩本体（中央に蛇行する流れ）
  for (let x = 0; x < 24; x++) {
    const centerZ = 6 + Math.round(Math.sin(x * 0.4 + seed * 0.01) * 2);
    const width = 2 + Math.floor(rand() * 2);

    for (let dz = -width; dz <= width; dz++) {
      const z = centerZ + dz;
      if (z < 0 || z >= 12) continue;
      const t = Math.abs(dz) / width; // 0=中心, 1=端

      // 中心ほど明るく
      let color: string;
      if (t < 0.3) {
        color = pick(['#FFD700', '#FFFF00', '#FFF176'], seed + x + dz);
      } else if (t < 0.6) {
        color = pick(LAVA_HOT, seed + x + dz);
      } else {
        color = pick(LAVA_COOL, seed + x + dz);
      }

      setVoxel(grid, x, 2, z, color);
      if (rand() > 0.3 && t < 0.5) {
        setVoxel(grid, x, 3, z, pick(LAVA_HOT, seed + x + dz + 50));
      }
    }
  }

  return grid;
}

// ============================================================
// 海藻 — 太さグラデーション＋バブル
// ============================================================
export function generateSeaweed(seed: number = 800): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(8, 20, 8);

  // 4本の茎
  for (let s = 0; s < 4; s++) {
    const sx = 2 + s * Math.round(rand() * 2);
    const sz = 2 + (s % 3);
    const h = 12 + Math.floor(rand() * 6);

    for (let y = 0; y < h; y++) {
      const t = y / h;
      const sway = Math.round(Math.sin(y * 0.5 + s * 1.5) * 1.5);
      const color = pick(SEAWEED_GREENS, seed + y + s);

      // メイン茎
      setVoxel(grid, sx + sway, y, sz, color);

      // 太さ（根元2ブロック幅）
      if (t < 0.5) {
        setVoxel(grid, sx + sway + 1, y, sz, pick(SEAWEED_GREENS, seed + y + s + 50));
      }

      // 葉っぱ（交互）
      if (y > 3 && y % 2 === 0) {
        const leafDir = y % 4 === 0 ? 1 : -1;
        for (let l = 1; l <= 2 + Math.floor(rand()); l++) {
          setVoxel(grid, sx + sway + leafDir * l, y, sz,
            pick(SEAWEED_GREENS, seed + y + s + l * 100));
        }
      }

      // バブル
      if (rand() > 0.85) {
        setVoxel(grid, sx + sway + (rand() > 0.5 ? 2 : -1), y, sz, '#B3E5FC');
      }
    }
  }

  return grid;
}

// ============================================================
// ビル — 窓＋屋上設備＋ネオンサイン ★新規
// ============================================================
export function generateBuilding(
  width: number = 10, height: number = 30, depth: number = 10,
  seed: number = 900,
): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(width + 4, height + 6, depth + 4);
  const ox = 2, oz = 2;

  // 本体
  fillBox(grid, ox, 0, oz, ox + width - 1, height - 1, oz + depth - 1, pick(BUILDING_DARKS, seed));

  // 各面に窓
  for (let y = 2; y < height - 2; y += 3) {
    for (let x = ox + 1; x < ox + width - 1; x += 3) {
      // 前面 (z = oz)
      const lit = rand() > 0.3;
      const winColor = lit ? pick(WINDOW_YELLOWS, seed + x + y) : '#111111';
      setVoxel(grid, x, y, oz, winColor);
      setVoxel(grid, x + 1, y, oz, winColor);
      setVoxel(grid, x, y + 1, oz, winColor);
      setVoxel(grid, x + 1, y + 1, oz, winColor);

      // 背面
      const lit2 = rand() > 0.3;
      const winColor2 = lit2 ? pick(WINDOW_YELLOWS, seed + x + y + 100) : '#111111';
      setVoxel(grid, x, y, oz + depth - 1, winColor2);
      setVoxel(grid, x + 1, y, oz + depth - 1, winColor2);
      setVoxel(grid, x, y + 1, oz + depth - 1, winColor2);
      setVoxel(grid, x + 1, y + 1, oz + depth - 1, winColor2);
    }

    // 側面窓
    for (let z = oz + 1; z < oz + depth - 1; z += 3) {
      const lit3 = rand() > 0.3;
      const winColor3 = lit3 ? pick(WINDOW_YELLOWS, seed + z + y + 200) : '#111111';
      setVoxel(grid, ox, y, z, winColor3);
      setVoxel(grid, ox, y + 1, z, winColor3);
      setVoxel(grid, ox + width - 1, y, z, winColor3);
      setVoxel(grid, ox + width - 1, y + 1, z, winColor3);
    }
  }

  // 屋上
  fillBox(grid, ox - 1, height, oz - 1, ox + width, height, oz + depth, pick(BUILDING_LIGHTS, seed));

  // アンテナ
  const antX = ox + Math.floor(width / 2);
  const antZ = oz + Math.floor(depth / 2);
  for (let y = height + 1; y < height + 5; y++) {
    setVoxel(grid, antX, y, antZ, pick(METAL_GRAYS, seed + y));
  }
  // アンテナ先端の赤ライト
  setVoxel(grid, antX, height + 5, antZ, '#FF0000');

  // AC室外機
  fillBox(grid, ox + 1, height + 1, oz + 1, ox + 3, height + 2, oz + 2, pick(METAL_GRAYS, seed + 300));

  // ネオンサイン（側面にカラーブロック）
  const neonY = Math.floor(height * 0.7);
  const neonColor = pick(NEON_COLORS, seed);
  for (let x = ox + 2; x < ox + width - 2; x++) {
    setVoxel(grid, x, neonY, oz, neonColor);
    setVoxel(grid, x, neonY + 1, oz, neonColor);
  }

  return grid;
}

// ============================================================
// 水塔 ★新規
// ============================================================
export function generateWaterTower(seed: number = 1000): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(14, 22, 14);
  const cx = 7, cz = 7;

  // 4本の脚
  const legs = [[-2, -2], [2, -2], [-2, 2], [2, 2]];
  for (const [lx, lz] of legs) {
    for (let y = 0; y < 12; y++) {
      setVoxel(grid, cx + lx!, y, cz + lz!, pick(WOOD_BROWNS, seed + y));
      setVoxel(grid, cx + lx! + 1, y, cz + lz!, pick(WOOD_BROWNS, seed + y + 10));
    }
  }

  // 脚同士をつなぐ横桁
  for (let y = 3; y < 12; y += 4) {
    for (let i = -2; i <= 3; i++) {
      setVoxel(grid, cx + i, y, cz - 2, pick(WOOD_BROWNS, seed + y + i));
      setVoxel(grid, cx + i, y, cz + 2, pick(WOOD_BROWNS, seed + y + i + 50));
      setVoxel(grid, cx - 2, y, cz + i, pick(WOOD_BROWNS, seed + y + i + 100));
      setVoxel(grid, cx + 2, y, cz + i, pick(WOOD_BROWNS, seed + y + i + 150));
    }
  }

  // タンク本体（円柱）
  fillCylinder(grid, cx, cz, 12, 18, 4, pick(METAL_GRAYS, seed));

  // タンク上面の蓋
  fillCylinder(grid, cx, cz, 19, 19, 5, pick(METAL_GRAYS, seed + 200));

  // タンクの帯
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (Math.abs(dx * dx + dz * dz - 16) < 3) {
        setVoxel(grid, cx + dx, 15, cz + dz, '#5D4037');
      }
    }
  }

  // パイプ
  for (let y = 5; y < 13; y++) {
    setVoxel(grid, cx + 4, y, cz, pick(METAL_GRAYS, seed + y + 300));
  }

  return grid;
}

// ============================================================
// 宇宙コンソール ★新規
// ============================================================
export function generateSpaceConsole(seed: number = 1100): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(16, 12, 10);

  const CONSOLE_BODY = ['#1A1A2E', '#16213E', '#0F3460'];
  const SCREEN_GREEN = ['#00FF7F', '#00E676', '#69F0AE'];
  const BUTTON_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  // 本体（テーブル状）
  fillBox(grid, 1, 0, 1, 14, 5, 8, pick(CONSOLE_BODY, seed));

  // スクリーン（傾斜）
  for (let x = 2; x <= 13; x++) {
    for (let y = 6; y <= 10; y++) {
      const z = 2 + Math.max(0, y - 8);
      setVoxel(grid, x, y, z, '#001122');
      // スクリーンのピクセル（ランダムデータ表示）
      if (rand() > 0.4) {
        setVoxel(grid, x, y, z, pick(SCREEN_GREEN, seed + x + y));
      }
    }
  }

  // ボタン群
  for (let x = 3; x <= 12; x += 2) {
    setVoxel(grid, x, 6, 7, pick(BUTTON_COLORS, seed + x));
  }

  // つまみ
  for (let x = 3; x <= 5; x++) {
    setVoxel(grid, x, 6, 5, pick(METAL_GRAYS, seed + x));
    setVoxel(grid, x, 7, 5, pick(METAL_GRAYS, seed + x + 10));
  }

  // インジケーターランプ
  for (let x = 8; x <= 13; x += 2) {
    setVoxel(grid, x, 6, 5, x % 4 === 0 ? '#FF0000' : '#00FF00');
  }

  // 配線（底面からはみ出す）
  for (let y = 0; y < 3; y++) {
    setVoxel(grid, 3, y, 9, '#333333');
    setVoxel(grid, 8, y, 9, '#333333');
    setVoxel(grid, 12, y, 9, '#333333');
  }

  return grid;
}

// ============================================================
// 宝箱 ★新規
// ============================================================
export function generateTreasureChest(seed: number = 1200): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(12, 10, 8);

  const CHEST_WOOD = ['#8B4513', '#A0522D', '#6B3410'];
  const CHEST_METAL = ['#DAA520', '#B8860B', '#FFD700'];
  const GOLD_COINS = ['#FFD700', '#FFC107', '#FFECB3'];

  // 箱本体
  fillBox(grid, 1, 0, 1, 10, 4, 6, pick(CHEST_WOOD, seed));

  // 蓋（半開き状態の弧）
  for (let x = 1; x <= 10; x++) {
    for (let ang = 0; ang < 4; ang++) {
      const y = 5 + ang;
      const z = 1 - Math.floor(ang * 0.5);
      if (z >= 0) {
        setVoxel(grid, x, y, z, pick(CHEST_WOOD, seed + x + ang));
      }
    }
  }

  // 金属バンド
  for (let z = 1; z <= 6; z++) {
    setVoxel(grid, 1, 2, z, pick(CHEST_METAL, seed + z));
    setVoxel(grid, 10, 2, z, pick(CHEST_METAL, seed + z + 10));
    setVoxel(grid, 1, 4, z, pick(CHEST_METAL, seed + z + 20));
    setVoxel(grid, 10, 4, z, pick(CHEST_METAL, seed + z + 30));
  }

  // 錠前
  setVoxel(grid, 5, 4, 1, '#B8860B');
  setVoxel(grid, 6, 4, 1, '#B8860B');
  setVoxel(grid, 5, 5, 1, '#FFD700');
  setVoxel(grid, 6, 5, 1, '#FFD700');

  // 中身（金貨）
  for (let z = 2; z <= 5; z++) {
    for (let x = 2; x <= 9; x++) {
      if (rand() > 0.3) {
        setVoxel(grid, x, 5, z, pick(GOLD_COINS, seed + x + z));
      }
      if (rand() > 0.6) {
        setVoxel(grid, x, 6, z, pick(GOLD_COINS, seed + x + z + 50));
      }
    }
  }

  // 宝石（ランダム）
  for (let i = 0; i < 3; i++) {
    const gx = 3 + Math.floor(rand() * 6);
    const gz = 2 + Math.floor(rand() * 3);
    setVoxel(grid, gx, 6, gz, pick(['#FF0000', '#0000FF', '#00FF00'], seed + i));
  }

  return grid;
}

// ============================================================
// クラゲ ★新規
// ============================================================
export function generateJellyfish(seed: number = 1300): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(14, 20, 14);
  const cx = 7, cz = 7;

  const JELLY_COLORS = ['#E0FFFF', '#B2EBF2', '#80DEEA', '#4DD0E1'];
  const JELLY_GLOW = ['#DDA0DD', '#E1BEE7', '#CE93D8'];

  // 傘（扁平な半球）
  for (let y = 10; y <= 16; y++) {
    const localY = y - 10;
    const r = localY <= 1 ? 5 : localY <= 2 ? 4.5 : localY <= 3 ? 3.5 : localY <= 4 ? 2.5 : localY <= 5 ? 1.5 : 0.5;
    for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dz * dz <= r * r) {
          const isEdge = dx * dx + dz * dz > (r - 1) * (r - 1);
          const color = isEdge
            ? pick(JELLY_GLOW, seed + dx + dz)
            : pick(JELLY_COLORS, seed + dx + dz + y);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // 触手（6本、波打つ）
  for (let t = 0; t < 6; t++) {
    const angle = (t / 6) * Math.PI * 2;
    const startX = cx + Math.round(Math.cos(angle) * 3);
    const startZ = cz + Math.round(Math.sin(angle) * 3);

    for (let y = 0; y < 10; y++) {
      const sway = Math.round(Math.sin(y * 0.8 + t * 1.2) * 1.2);
      const tx = startX + sway;
      const tz = startZ + Math.round(Math.cos(y * 0.6 + t) * 0.5);
      const color = y < 3 ? pick(JELLY_GLOW, seed + t + y) : pick(JELLY_COLORS, seed + t + y);
      setVoxel(grid, tx, 10 - y, tz, color);
    }
  }

  // 中央の口器
  setVoxel(grid, cx, 9, cz, pick(JELLY_GLOW, seed + 500));
  setVoxel(grid, cx, 8, cz, pick(JELLY_GLOW, seed + 501));

  return grid;
}

// ============================================================
// 島（浮島ベース）★新規ボーナス
// ============================================================
export function generateFloatingIsland(seed: number = 1400): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(32, 20, 32);
  const cx = 16, cz = 16;

  // 上面: 草地（楕円）
  for (let z = 0; z < 32; z++) {
    for (let x = 0; x < 32; x++) {
      const dx = (x - cx) / 12, dz = (z - cz) / 12;
      if (dx * dx + dz * dz <= 1) {
        setVoxel(grid, x, 12, z, pick(GRASS_COLORS, seed + x + z));
        setVoxel(grid, x, 11, z, pick(GRASS_DARK, seed + x + z + 100));
        // ランダム高草
        if (rand() > 0.7) {
          setVoxel(grid, x, 13, z, pick(GRASS_COLORS, seed + x + z + 200));
        }
      }
    }
  }

  // 下面: 岩の底（逆円錐）
  for (let y = 0; y < 12; y++) {
    const t = y / 12;
    const radius = lerp(3, 12, t);
    for (let dz = -Math.ceil(radius); dz <= Math.ceil(radius); dz++) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
        if (dx * dx + dz * dz <= radius * radius) {
          const noise = rand() > 0.1;
          if (noise) {
            const layerColor = t < 0.3
              ? pick(ROCK_BROWNS, seed + dx + dz + y)
              : pick(ROCK_GRAYS, seed + dx + dz + y);
            setVoxel(grid, cx + dx, y, cz + dz, layerColor);
          }
        }
      }
    }
  }

  // 花をランダムに追加
  for (let i = 0; i < 8; i++) {
    const fx = cx + Math.round((rand() - 0.5) * 18);
    const fz = cz + Math.round((rand() - 0.5) * 18);
    const dx = (fx - cx) / 12, dz = (fz - cz) / 12;
    if (dx * dx + dz * dz < 0.8) {
      setVoxel(grid, fx, 13, fz, pick(FLOWER_COLORS, seed + i));
    }
  }

  return grid;
}

// ============================================================
// ドア (12×24×3 高精細パネルドア)
// ============================================================

const DOOR_WOOD = ['#C8976B', '#B8875B', '#D8A77B', '#A87B55', '#BE8D65'];
const DOOR_WOOD_DARK = ['#8B6914', '#7A5D0E', '#9B7424', '#6B4E08'];
const DOOR_FRAME = ['#5C3A1E', '#6B4A2E', '#4A2E14', '#7A5A3E'];
const KNOB_METAL = ['#FFD700', '#DAA520', '#C0C0C0', '#B8860B'];

export function generateDoor(doorColor: string, frameColor: string, seed: number): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(14, 26, 4);

  // フレーム (左右+上)
  for (let y = 0; y < 24; y++) {
    for (let z = 0; z < 3; z++) {
      setVoxel(grid, 0, y, z, pick(DOOR_FRAME, seed + y));
      setVoxel(grid, 1, y, z, pick(DOOR_FRAME, seed + y + 1));
      setVoxel(grid, 12, y, z, pick(DOOR_FRAME, seed + y + 2));
      setVoxel(grid, 13, y, z, pick(DOOR_FRAME, seed + y + 3));
    }
  }
  // 上フレーム
  for (let x = 0; x < 14; x++) {
    for (let z = 0; z < 3; z++) {
      setVoxel(grid, x, 23, z, pick(DOOR_FRAME, seed + x));
      setVoxel(grid, x, 24, z, pick(DOOR_FRAME, seed + x + 1));
    }
  }

  // ドア本体 (木目色)
  for (let x = 2; x < 12; x++) {
    for (let y = 0; y < 23; y++) {
      const woodVariant = lerpColor(doorColor, DOOR_WOOD[Math.abs(x * 7 + y * 3 + seed) % DOOR_WOOD.length]!, 0.15 + rand() * 0.1);
      setVoxel(grid, x, y, 1, woodVariant);
      setVoxel(grid, x, y, 2, woodVariant);
    }
  }

  // パネル4枚 (凹み = 色を暗く)
  const panelDark = (c: string) => lerpColor(c, '#000000', 0.2);
  // 上2パネル
  for (let x = 3; x < 7; x++) for (let y = 14; y < 21; y++) setVoxel(grid, x, y, 2, panelDark(doorColor));
  for (let x = 7; x < 11; x++) for (let y = 14; y < 21; y++) setVoxel(grid, x, y, 2, panelDark(doorColor));
  // 下2パネル
  for (let x = 3; x < 7; x++) for (let y = 2; y < 12; y++) setVoxel(grid, x, y, 2, panelDark(doorColor));
  for (let x = 7; x < 11; x++) for (let y = 2; y < 12; y++) setVoxel(grid, x, y, 2, panelDark(doorColor));

  // ドアノブ
  setVoxel(grid, 10, 11, 3, pick(KNOB_METAL, seed));
  setVoxel(grid, 10, 12, 3, pick(KNOB_METAL, seed + 1));

  return grid;
}

// ============================================================
// 暖炉 (16×14×10 高精細)
// ============================================================

const BRICK_REDS = ['#8B4513', '#A0522D', '#CD853F', '#6B3410', '#B8622E'];
const BRICK_GRAYS = ['#696969', '#808080', '#5F5F5F'];

export function generateFireplace(seed: number): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(18, 16, 10);

  // ベース (レンガ壁) — 開口部は除外
  for (let x = 0; x < 18; x++) {
    for (let y = 0; y < 14; y++) {
      // 開口部(x:5-12, y:0-7)はスキップ
      if (x >= 5 && x < 13 && y < 8) continue;
      for (let z = 0; z < 3; z++) {
        const brickHue = (x + y * 2 + seed) % 3 === 0 ? pick(BRICK_GRAYS, seed + x + y) : pick(BRICK_REDS, seed + x * y);
        setVoxel(grid, x, y, z, brickHue);
      }
    }
  }

  // 開口部の奥壁 (dark)
  for (let x = 5; x < 13; x++) {
    for (let y = 0; y < 8; y++) {
      setVoxel(grid, x, y, 0, '#1A1A1A');
    }
  }

  // マントルピース (上の棚)
  for (let x = -1; x < 19; x++) {
    for (let z = 0; z < 5; z++) {
      if (x >= 0 && x < 18) {
        setVoxel(grid, x, 14, z, pick(DOOR_WOOD_DARK, seed + x));
        setVoxel(grid, x, 15, z, pick(DOOR_WOOD_DARK, seed + x + 1));
      }
    }
  }

  // 炎 (開口部内)
  for (let i = 0; i < 5; i++) {
    const fx = 7 + Math.floor(rand() * 4);
    const fy = 1 + Math.floor(rand() * 4);
    setVoxel(grid, fx, fy, 1, pick(LAVA_HOT, seed + i));
  }

  // 側面の柱
  for (let y = 0; y < 14; y++) {
    for (let z = 0; z < 4; z++) {
      setVoxel(grid, 3, y, z, pick(BRICK_REDS, seed + y * 3));
      setVoxel(grid, 4, y, z, pick(BRICK_REDS, seed + y * 3 + 1));
      setVoxel(grid, 13, y, z, pick(BRICK_REDS, seed + y * 3 + 2));
      setVoxel(grid, 14, y, z, pick(BRICK_REDS, seed + y * 3 + 3));
    }
  }

  return grid;
}

// ============================================================
// 棚のミニフィギュア (6×8×6)
// ============================================================

export function generateShelfFigurine(baseColor: string, seed: number): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(6, 8, 6);

  // 体
  fillBox(grid, 1, 0, 1, 4, 4, 4, baseColor);
  // 頭
  fillBox(grid, 1, 4, 1, 4, 3, 4, lerpColor(baseColor, '#FFFFFF', 0.15));
  // 目
  setVoxel(grid, 2, 6, 4, '#000000');
  setVoxel(grid, 3, 6, 4, '#000000');
  // 口
  setVoxel(grid, 2, 5, 4, '#FF6B6B');

  return grid;
}

// ============================================================
// 文字ブロック (5×5×5)
// ============================================================

export function generateLetterBlock(letter: string, blockColor: string, seed: number): VoxelData {
  const grid = createGrid(5, 5, 5);
  // ブロック本体
  fillBox(grid, 0, 0, 0, 5, 5, 5, blockColor);
  // 正面に文字(ドット絵パターン)
  const darkFace = lerpColor(blockColor, '#000000', 0.5);
  // 簡易的な文字パターン
  const patterns: Record<string, number[][]> = {
    'A': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
    'C': [[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
    'K': [[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]],
  };
  const pat = patterns[letter] ?? patterns['A']!;
  for (let row = 0; row < 5 && row < pat.length; row++) {
    for (let col = 0; col < 3 && col < pat[row]!.length; col++) {
      if (pat[row]![col]) {
        setVoxel(grid, col + 1, 4 - row, 4, darkFace);
      }
    }
  }
  return grid;
}

