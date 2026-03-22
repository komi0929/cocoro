/**
 * VoxelEnvironments — シチュエーション（部屋環境）生成エンジン
 *
 * 参考画像の浮島のような、精密な地形・植生・雰囲気を持つ
 * 環境要素をプロシージャルに生成する。
 *
 * カテゴリ:
 * - 浮島/地形ベース
 * - 植生（草・花・低木）
 * - 地表テクスチャ（草地・砂・岩場・雪）
 */

import { VoxelData, createGrid, setVoxel, fillBox, fillSphere, fillCylinder, fillEllipsoid } from './VoxelGrid';
import {
  seededRand, pick, lerp, noisyPick, blendColors, adjustBrightness,
  fillNoisySphere, fillOrganicRoots,
  PAL_GRASS, PAL_GRASS_DARK, PAL_DIRT, PAL_ROCK_WARM, PAL_FLOWERS,
  PAL_TRUNK, PAL_LEAVES,
} from './VoxelDesign';

// ============================================================
// 浮島 — 参考画像の核心要素
// ============================================================
export function generateIslandBase(seed: number = 42): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(48, 32, 48);
  const cx = 24, cz = 24;

  // ---- 底面: 逆円錐の岩 ----
  for (let y = 0; y < 16; y++) {
    const t = y / 15;
    const radius = lerp(4, 20, t);
    for (let dz = -Math.ceil(radius); dz <= Math.ceil(radius); dz++) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
        const d2 = dx * dx + dz * dz;
        if (d2 <= radius * radius) {
          // 不規則な表面
          const noise = (rand() - 0.5) * 2;
          if (d2 > (radius - 1) * (radius - 1) && noise > 0.5) continue;

          // 層状テクスチャ
          let color: string;
          if (t < 0.3) {
            color = noisyPick(PAL_ROCK_WARM, seed + dx + dz + y, 0.15);
          } else if (t < 0.6) {
            color = noisyPick(PAL_DIRT, seed + dx + dz + y, 0.12);
          } else {
            color = blendColors(
              pick(PAL_DIRT, seed + dx),
              pick(PAL_GRASS_DARK, seed + dz),
              t * 0.5,
            );
          }

          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // ---- 側面の段差（ブロック状突起） ----
  for (let y = 4; y < 16; y += 2) {
    const baseR = lerp(5, 18, y / 15);
    for (let i = 0; i < 8; i++) {
      if (rand() > 0.5) continue;
      const angle = (i / 8) * Math.PI * 2 + rand() * 0.3;
      const dist = baseR + rand() * 2;
      const bx = Math.round(cx + Math.cos(angle) * dist);
      const bz = Math.round(cz + Math.sin(angle) * dist);
      const bw = 1 + Math.floor(rand() * 2);
      for (let dy = -1; dy <= 1; dy++) {
        for (let ddz = -bw; ddz <= bw; ddz++) {
          for (let ddx = -bw; ddx <= bw; ddx++) {
            if (ddx * ddx + ddz * ddz <= bw * bw + 1) {
              setVoxel(grid, bx + ddx, y + dy, bz + ddz,
                noisyPick(y > 10 ? PAL_DIRT : PAL_ROCK_WARM, seed + i + y + ddx));
            }
          }
        }
      }
    }
  }

  // ---- 上面: 草地 ----
  for (let z = 0; z < 48; z++) {
    for (let x = 0; x < 48; x++) {
      const dx = (x - cx) / 18, dz = (z - cz) / 18;
      if (dx * dx + dz * dz <= 1) {
        // 土層
        setVoxel(grid, x, 15, z, noisyPick(PAL_DIRT, seed + x + z, 0.1));
        // 草層
        const grassColor = noisyPick(PAL_GRASS, seed + x * 7 + z * 13, 0.15);
        setVoxel(grid, x, 16, z, grassColor);

        // ランダム高草
        if (rand() > 0.55) {
          setVoxel(grid, x, 17, z, noisyPick(PAL_GRASS, seed + x + z + 1000, 0.2));
        }
        if (rand() > 0.82) {
          setVoxel(grid, x, 18, z, noisyPick(PAL_GRASS, seed + x + z + 2000, 0.25));
        }
        // 花（パステル）
        if (rand() > 0.93) {
          const flowerH = 17 + (rand() > 0.5 ? 1 : 0);
          setVoxel(grid, x, flowerH, z, pick(PAL_FLOWERS, seed + x + z + 3000));
        }
      }
    }
  }

  // ---- 草地の端のディテール（垂れ下がる草） ----
  for (let z = 0; z < 48; z++) {
    for (let x = 0; x < 48; x++) {
      const dx = (x - cx) / 18, dz = (z - cz) / 18;
      const edgeDist = Math.sqrt(dx * dx + dz * dz);
      if (edgeDist > 0.85 && edgeDist <= 1.1) {
        // 端の草が下に垂れる
        if (rand() > 0.4) {
          setVoxel(grid, x, 15, z, noisyPick(PAL_GRASS, seed + x + z + 4000));
          if (rand() > 0.5) {
            setVoxel(grid, x, 14, z, noisyPick(PAL_GRASS_DARK, seed + x + z + 4500));
          }
        }
      }
    }
  }

  return grid;
}

// ============================================================
// 高品質ヤシの木（参考画像レベル）
// ============================================================
export function generatePremiumPalmTree(seed: number = 100): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(32, 48, 32);
  const cx = 16, cz = 16;

  // ---- 根元（有機的な広がり） ----
  fillOrganicRoots(grid, cx, 4, cz, 5, 4, PAL_TRUNK, seed);

  // ---- 幹（ゴールデンブラウン、リング付き、緩やかなカーブ） ----
  for (let y = 0; y < 32; y++) {
    const t = y / 31;
    // 幹の太さ（下太く上細く）
    const r = lerp(3, 1.5, t * t);
    // わずかな傾き
    const tiltX = Math.round(t * t * 3);
    const tiltZ = Math.round(Math.sin(t * 2) * 1.5);

    for (let dz = -Math.ceil(r) - 1; dz <= Math.ceil(r) + 1; dz++) {
      for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) {
        const d2 = dx * dx + dz * dz;
        if (d2 <= r * r) {
          // 中心部
          const isCore = d2 <= (r - 0.8) * (r - 0.8);
          const color = isCore
            ? noisyPick(PAL_TRUNK, seed + y + dx + dz, 0.08)
            : noisyPick(PAL_TRUNK.slice(0, 3), seed + y + dx + dz, 0.12); // 外側は暗め
          setVoxel(grid, cx + dx + tiltX, y, cz + dz + tiltZ, color);
        }
      }
    }

    // バークリング（4ブロック間隔）
    if (y % 4 === 2 && y > 4 && y < 28) {
      for (let dz = -Math.ceil(r) - 1; dz <= Math.ceil(r) + 1; dz++) {
        for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) {
          const d2 = dx * dx + dz * dz;
          if (d2 > r * r && d2 <= (r + 1) * (r + 1)) {
            setVoxel(grid, cx + dx + tiltX, y, cz + dz + tiltZ,
              noisyPick(PAL_TRUNK.slice(0, 4), seed + y + 500));
          }
        }
      }
    }
  }

  // ---- 葉のキャノピー ----
  const topY = 32;
  const leafCx = cx + 3;
  const leafCz = cz + Math.round(Math.sin(2) * 1.5);

  // 中心の密な部分
  fillNoisySphere(grid, leafCx, topY + 3, leafCz, 4, PAL_LEAVES, seed + 600, 0.1);

  // フロンド（10本）
  for (let f = 0; f < 10; f++) {
    const angle = (f / 10) * Math.PI * 2 + (rand() - 0.5) * 0.15;
    const droop = 0.2 + rand() * 0.15;
    const len = 10 + Math.floor(rand() * 4);

    for (let seg = 0; seg < len; seg++) {
      const segT = seg / len;
      const fx = Math.round(leafCx + Math.cos(angle) * seg);
      const fy = Math.round(topY + 5 - seg * droop);
      const fz = Math.round(leafCz + Math.sin(angle) * seg);

      // メイン
      const leafColor = noisyPick(
        segT < 0.5 ? PAL_LEAVES : PAL_LEAVES.slice(3),
        seed + f + seg, 0.12,
      );
      setVoxel(grid, fx, fy, fz, leafColor);
      setVoxel(grid, fx, fy + 1, fz, noisyPick(PAL_LEAVES, seed + f + seg + 50));

      // 幅（先端に向かって狭く）
      const halfW = Math.max(0, Math.round(lerp(3, 0, segT)));
      const perpX = -Math.sin(angle);
      const perpZ = Math.cos(angle);

      for (let w = -halfW; w <= halfW; w++) {
        if (w === 0) continue;
        const wx = Math.round(fx + perpX * w);
        const wz = Math.round(fz + perpZ * w);
        setVoxel(grid, wx, fy, wz, noisyPick(PAL_LEAVES, seed + f + seg + w * 7, 0.15));
      }
    }
  }

  // ---- ココナッツ ----
  const coconuts = [[1, 0], [-1, 1], [0, -1], [1, 1], [-1, -1]];
  const COCONUT_COLORS = ['#5C3D1E', '#6B4E2E', '#4A2F10'];
  for (const [dx, dz] of coconuts) {
    fillNoisySphere(grid, leafCx + dx!, topY, leafCz + dz!, 1, COCONUT_COLORS, seed + dx! + dz!, 0.05);
  }

  return grid;
}

// ============================================================
// 低木（丸い形、密な葉）
// ============================================================
export function generateBush(seed: number = 200): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(12, 8, 12);
  const cx = 6, cz = 6;

  // 幹（短い）
  for (let y = 0; y < 3; y++) {
    setVoxel(grid, cx, y, cz, noisyPick(PAL_TRUNK.slice(0, 4), seed + y));
  }

  // 葉（不規則な球体 x 3つの重なり）
  fillNoisySphere(grid, cx, 5, cz, 3.5, PAL_LEAVES, seed + 100, 0.2);
  fillNoisySphere(grid, cx - 1, 4, cz + 1, 2.5, PAL_LEAVES.slice(2), seed + 200, 0.15);
  fillNoisySphere(grid, cx + 1, 5, cz - 1, 2, PAL_LEAVES.slice(4), seed + 300, 0.18);

  // 花（ランダム）
  for (let y = 3; y <= 7; y++) {
    for (let dz = -4; dz <= 4; dz++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (rand() > 0.92 && dx * dx + dz * dz <= 16) {
          setVoxel(grid, cx + dx, y, cz + dz, pick(PAL_FLOWERS, seed + dx + dz + y));
        }
      }
    }
  }

  return grid;
}

// ============================================================
// 岩（温かみのあるグレー、苔と層）
// ============================================================
export function generateWarmRock(seed: number = 300, size: number = 12): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(size, size, size);
  const c = Math.floor(size / 2);

  // coarse noise sphere
  fillNoisySphere(grid, c, c * 0.7, c, c * 0.6, PAL_ROCK_WARM, seed, 0.2);

  // 上面に苔
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      for (let y = size - 1; y >= 0; y--) {
        if (grid[y]?.[z]?.[x]) {
          // 一番上のブロックを苔色に
          if (rand() > 0.4) {
            setVoxel(grid, x, y, z, noisyPick(PAL_GRASS_DARK, seed + x + z));
          }
          break;
        }
      }
    }
  }

  return grid;
}

// ============================================================
// 草パッチ（個別の草ブレード）
// ============================================================
export function generateGrassPatch(
  width: number = 24, depth: number = 24, seed: number = 400,
): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(width, 6, depth);

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      // 土層
      setVoxel(grid, x, 0, z, noisyPick(PAL_DIRT, seed + x + z, 0.1));
      // 草
      setVoxel(grid, x, 1, z, noisyPick(PAL_GRASS, seed + x * 7 + z * 13, 0.15));

      // ブレード（高さばらつき）
      if (rand() > 0.4) {
        setVoxel(grid, x, 2, z, noisyPick(PAL_GRASS, seed + x + z + 1000));
      }
      if (rand() > 0.7) {
        setVoxel(grid, x, 3, z, noisyPick(PAL_GRASS, seed + x + z + 2000));
      }
      if (rand() > 0.9) {
        setVoxel(grid, x, 4, z, noisyPick(PAL_GRASS, seed + x + z + 3000));
      }
      // 花
      if (rand() > 0.94) {
        const fh = 2 + Math.floor(rand() * 2);
        setVoxel(grid, x, fh, z, pick(PAL_FLOWERS, seed + x + z + 5000));
      }
    }
  }

  return grid;
}
