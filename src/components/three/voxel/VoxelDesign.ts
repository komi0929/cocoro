/**
 * VoxelDesign — ボクセルアートのデザインシステム
 *
 * 参考画像（Honey Island Defense）分析に基づく品質基準:
 *
 * 🎨 カラー原則:
 *   - 温かみのあるゴールデン系ベース
 *   - 同系色で5-8段階のグラデーション
 *   - ハイライト色は明度+20%、シャドウ色は明度-25%
 *   - パステル寄りの彩度（ビビッドすぎない）
 *
 * 🧸 kawaii原則:
 *   - 大きな頭:体比率（1:1.5〜1:2）
 *   - 丸みを帯びたシルエット（角を埋める）
 *   - 顔パーツ: 2x2の目、1x1の鼻、2x1の口（最小構成）
 *   - ほっぺた（ピンクのドット）
 *
 * 📐 密度原則:
 *   - 最小グリッド: 16x16x16（小物）
 *   - 標準グリッド: 32x32x32（家具・中型オブジェ）
 *   - 大型グリッド: 48x64x48（樹木・建物）
 *   - アバター: 16x24x12
 *
 * 🌿 自然物原則:
 *   - 完全な対称は避ける（±1ブロックのランダムオフセット）
 *   - 表面に凹凸（bark rings, 苔, 傷）
 *   - 色は位置依存のグラデーション（上ほど明るく）
 */

import { VoxelData, createGrid, setVoxel, fillSphere, fillEllipsoid } from './VoxelGrid';

// ============================================================
// シード付きランダム
// ============================================================
export function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ============================================================
// カラーユーティリティ
// ============================================================

/** hex → RGB */
export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** RGB → hex */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/** 色を明るく/暗く */
export function adjustBrightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, Math.max(0, r * factor)),
    Math.min(255, Math.max(0, g * factor)),
    Math.min(255, Math.max(0, b * factor)),
  );
}

/** 2色をブレンド */
export function blendColors(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/** パレットからグラデーション色を取得（位置ベース） */
export function gradientPick(palette: string[], t: number): string {
  const idx = Math.min(palette.length - 1, Math.max(0, Math.floor(t * palette.length)));
  return palette[idx]!;
}

/** パレットからランダムに±明度変化を加えて取得 */
export function noisyPick(palette: string[], seed: number, variance: number = 0.1): string {
  const base = pick(palette, seed);
  const factor = 1 + (((seed * 7 + 13) % 100) / 100 - 0.5) * variance * 2;
  return adjustBrightness(base, factor);
}

// ============================================================
// 高度な描画プリミティブ
// ============================================================

/** 角を丸めたボックス（角のブロックを削る） */
export function fillRoundedBox(
  grid: VoxelData,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  color: string, cornerCut: number = 1,
): void {
  for (let y = y1; y <= y2; y++) {
    for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) {
        // 8つの角を削る
        const atCornerX = (x - x1 < cornerCut) || (x2 - x < cornerCut);
        const atCornerY = (y - y1 < cornerCut) || (y2 - y < cornerCut);
        const atCornerZ = (z - z1 < cornerCut) || (z2 - z < cornerCut);
        const cornerCount = (atCornerX ? 1 : 0) + (atCornerY ? 1 : 0) + (atCornerZ ? 1 : 0);
        if (cornerCount >= 3) continue; // 3軸とも角→削る
        setVoxel(grid, x, y, z, color);
      }
    }
  }
}

/** 位置に応じた色のグラデーションで塗る楕円体 */
export function fillGradientEllipsoid(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  bottomColor: string, topColor: string,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1) {
          const t = (y - (cy - ry)) / (2 * ry); // 0=bottom, 1=top
          setVoxel(grid, x, y, z, blendColors(bottomColor, topColor, t));
        }
      }
    }
  }
}

/** ノイズ付き球体（不規則な表面） */
export function fillNoisySphere(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  radius: number, palette: string[], seed: number,
  noiseAmount: number = 0.15,
): void {
  const rand = seededRand(seed);
  for (let y = Math.floor(cy - radius * 1.2); y <= Math.ceil(cy + radius * 1.2); y++) {
    for (let z = Math.floor(cz - radius * 1.2); z <= Math.ceil(cz + radius * 1.2); z++) {
      for (let x = Math.floor(cx - radius * 1.2); x <= Math.ceil(cx + radius * 1.2); x++) {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const threshold = radius * (1 + (rand() - 0.5) * noiseAmount);
        if (dist <= threshold) {
          setVoxel(grid, x, y, z, noisyPick(palette, seed + x * 7 + y * 13 + z * 19));
        }
      }
    }
  }
}

/** タコ足状の根 — 有機的な広がりを生成 */
export function fillOrganicRoots(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  count: number, length: number,
  palette: string[], seed: number,
): void {
  const rand = seededRand(seed);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    let rx = cx, ry = cy, rz = cz;
    for (let s = 0; s < length; s++) {
      rx += Math.cos(angle) * 0.8 + (rand() - 0.5) * 0.3;
      ry -= 0.5 + rand() * 0.3;
      rz += Math.sin(angle) * 0.8 + (rand() - 0.5) * 0.3;
      const w = Math.max(1, Math.round(lerp(2, 0.5, s / length)));
      for (let dz = -w; dz <= w; dz++) {
        for (let dx = -w; dx <= w; dx++) {
          if (dx * dx + dz * dz <= w * w + 0.5) {
            setVoxel(grid, Math.round(rx + dx), Math.round(ry), Math.round(rz + dz),
              noisyPick(palette, seed + i * 100 + s + dx));
          }
        }
      }
    }
  }
}

/** kawaii顔を描画 */
export function drawKawaiiFace(
  grid: VoxelData,
  cx: number, cy: number, faceZ: number,
  eyeColor: string, noseColor: string, blushColor: string,
  eyeSize: 'small' | 'medium' | 'large' = 'medium',
): void {
  if (eyeSize === 'small') {
    // 1x1 目
    setVoxel(grid, cx - 2, cy + 1, faceZ, eyeColor);
    setVoxel(grid, cx + 1, cy + 1, faceZ, eyeColor);
  } else if (eyeSize === 'medium') {
    // 2x2 目
    setVoxel(grid, cx - 2, cy + 1, faceZ, eyeColor);
    setVoxel(grid, cx - 2, cy + 2, faceZ, eyeColor);
    setVoxel(grid, cx - 1, cy + 1, faceZ, eyeColor);
    setVoxel(grid, cx - 1, cy + 2, faceZ, eyeColor);
    setVoxel(grid, cx + 1, cy + 1, faceZ, eyeColor);
    setVoxel(grid, cx + 1, cy + 2, faceZ, eyeColor);
    setVoxel(grid, cx + 2, cy + 1, faceZ, eyeColor);
    setVoxel(grid, cx + 2, cy + 2, faceZ, eyeColor);
    // ハイライト
    setVoxel(grid, cx - 2, cy + 2, faceZ, '#FFFFFF');
    setVoxel(grid, cx + 1, cy + 2, faceZ, '#FFFFFF');
  } else {
    // 3x2 目
    for (let dx = -3; dx <= -1; dx++) {
      setVoxel(grid, cx + dx, cy + 1, faceZ, eyeColor);
      setVoxel(grid, cx + dx, cy + 2, faceZ, eyeColor);
    }
    for (let dx = 1; dx <= 3; dx++) {
      setVoxel(grid, cx + dx, cy + 1, faceZ, eyeColor);
      setVoxel(grid, cx + dx, cy + 2, faceZ, eyeColor);
    }
    setVoxel(grid, cx - 3, cy + 2, faceZ, '#FFFFFF');
    setVoxel(grid, cx + 1, cy + 2, faceZ, '#FFFFFF');
  }

  // 鼻
  setVoxel(grid, cx, cy, faceZ, noseColor);

  // ほっぺた（ピンク）
  setVoxel(grid, cx - 3, cy, faceZ, blushColor);
  setVoxel(grid, cx - 4, cy, faceZ, blushColor);
  setVoxel(grid, cx + 3, cy, faceZ, blushColor);
  setVoxel(grid, cx + 4, cy, faceZ, blushColor);

  // 口（にっこり）
  setVoxel(grid, cx - 1, cy - 1, faceZ, '#555555');
  setVoxel(grid, cx, cy - 1, faceZ, '#555555');
  setVoxel(grid, cx + 1, cy - 1, faceZ, '#555555');
}

// ============================================================
// 標準カラーパレット（温かみ系）
// ============================================================

/** ヤシの木幹: ゴールデンブラウン8段階 */
export const PAL_TRUNK = ['#4A3308', '#5C4010', '#6B4E14', '#7A5C18', '#8B6B1E', '#9B7A28', '#AB8A32', '#BB9A3C'];
/** ヤシの木葉: 緑8段階（温かみのある緑） */
export const PAL_LEAVES = ['#1A5C1A', '#207020', '#268526', '#2E9A2E', '#38AF38', '#45C045', '#55D055', '#68DD68'];
/** 草: 明るい緑5段階 */
export const PAL_GRASS = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'];
export const PAL_GRASS_DARK = ['#1B4D1E', '#1B5E20', '#2E5D2E'];
/** 岩: ウォームグレー */
export const PAL_ROCK_WARM = ['#6B6358', '#7A7268', '#8B8278', '#9C9488', '#ADA598'];
/** 土: 暖色系ブラウン */
export const PAL_DIRT = ['#5D4037', '#6D4C41', '#795548', '#8D6E63', '#A1887F'];
/** 花: パステル */
export const PAL_FLOWERS = ['#FF8A80', '#FF80AB', '#EA80FC', '#FFD180', '#FFE57F', '#B9F6CA'];
/** 木材: 家具用 */
export const PAL_WOOD = ['#5C3317', '#6B3E1E', '#7A4925', '#8B552C', '#9C6133', '#AD6D3A'];
/** 布: やわらかい色 */
export const PAL_FABRIC = ['#E8D5C4', '#F0E0D0', '#F5EBE0', '#FFF3E0', '#FFF8F0'];
/** 金属: 暖色寄り */
export const PAL_METAL_WARM = ['#8D8070', '#9E9080', '#AFA090', '#C0B0A0', '#D0C0B0'];
/** アバター毛色: クマ系 */
export const PAL_BEAR_BROWN = ['#6B4226', '#7A4E2E', '#8B5A36', '#9C663E', '#AD7246'];
export const PAL_BEAR_BELLY = ['#C4A882', '#D4B892', '#E4C8A2', '#F0D8B2'];
/** ハチミツ */
export const PAL_HONEY = ['#D4A017', '#E4B027', '#F4C037', '#FFD54F', '#FFE082'];
