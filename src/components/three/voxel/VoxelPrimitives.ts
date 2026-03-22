/**
 * VoxelPrimitives — 高精度ボクセル描画プリミティブ
 * 
 * 参考画像（ナノブロック風）の品質を実現するための描画関数群。
 * ステップドカーブ、パターン描画、立体的な顔パーツなど。
 */

import { VoxelData, setVoxel, fillBox } from './VoxelGrid';

// ============================================================
// ステップドカーブ: 段差で丸みを出す
// ============================================================

/** 角を段差で丸めたボックス。cornerR=丸め段数（大きいほど丸い） */
export function fillRoundedBox3D(
  grid: VoxelData,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  color: string, cornerR: number = 1,
): void {
  for (let y = y1; y <= y2; y++) {
    for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) {
        // 各軸の最寄り端面からの距離
        const dx = Math.min(x - x1, x2 - x);
        const dy = Math.min(y - y1, y2 - y);
        const dz = Math.min(z - z1, z2 - z);

        // ユークリッド距離で角を丸める
        // 2軸以上が角にあるとき、球面的にカット
        let skip = false;
        if (dx < cornerR && dy < cornerR && dz < cornerR) {
          // 3隅: 球面カット
          const rd = Math.sqrt(
            (cornerR - dx) * (cornerR - dx) +
            (cornerR - dy) * (cornerR - dy) +
            (cornerR - dz) * (cornerR - dz)
          );
          if (rd > cornerR + 0.5) skip = true;
        } else if (dx < cornerR && dy < cornerR) {
          // XY辺: 円柱カット
          const rd = Math.sqrt((cornerR - dx) * (cornerR - dx) + (cornerR - dy) * (cornerR - dy));
          if (rd > cornerR + 0.5) skip = true;
        } else if (dx < cornerR && dz < cornerR) {
          const rd = Math.sqrt((cornerR - dx) * (cornerR - dx) + (cornerR - dz) * (cornerR - dz));
          if (rd > cornerR + 0.5) skip = true;
        } else if (dy < cornerR && dz < cornerR) {
          const rd = Math.sqrt((cornerR - dy) * (cornerR - dy) + (cornerR - dz) * (cornerR - dz));
          if (rd > cornerR + 0.5) skip = true;
        }
        if (skip) continue;

        setVoxel(grid, x, y, z, color);
      }
    }
  }
}

/** ステップド球体: ボクセルアートらしい段差のある球 */
export function fillSteppedSphere(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  color: string,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1.0) {
          setVoxel(grid, x, y, z, color);
        }
      }
    }
  }
}

// ============================================================
// パターン描画
// ============================================================

/** 横縞模様を既存ブロック上に重ねる */
export function applyHorizontalStripes(
  grid: VoxelData,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  stripeColor: string, frequency: number = 2,
  zFace?: number, // 特定のZ面のみに適用
): void {
  for (let y = y1; y <= y2; y++) {
    if ((y - y1) % frequency !== 0) continue;
    for (let z = z1; z <= z2; z++) {
      if (zFace !== undefined && z !== zFace) continue;
      for (let x = x1; x <= x2; x++) {
        // 既存ブロックがある場合のみ上書き
        const ry = Math.round(y), rz = Math.round(z), rx = Math.round(x);
        if (ry >= 0 && ry < grid.length &&
            rz >= 0 && rz < grid[ry]!.length &&
            rx >= 0 && rx < grid[ry]![rz]!.length &&
            grid[ry]![rz]![rx] !== null) {
          setVoxel(grid, x, y, z, stripeColor);
        }
      }
    }
  }
}

// ============================================================
// 高精度 顔パーツ
// ============================================================

export interface EyeStyle {
  width: number;   // 目の幅（2-4）
  height: number;  // 目の高さ（3-5）
  pupilColor: string;
  highlightCount: number; // ハイライトのドット数
}

/** 高精度目描画: 瞳 + ハイライト(複数) */
export function drawDetailedEye(
  grid: VoxelData,
  cx: number, cy: number, z: number,
  style: EyeStyle,
): void {
  const hw = Math.floor(style.width / 2);
  const hh = Math.floor(style.height / 2);
  // 瞳全体
  for (let dy = -hh; dy <= hh; dy++) {
    for (let dx = -hw; dx <= hw; dx++) {
      setVoxel(grid, cx + dx, cy + dy, z, style.pupilColor);
    }
  }
  // ハイライト（右上に配置）
  if (style.highlightCount >= 1) {
    setVoxel(grid, cx + hw, cy + hh, z, '#FFFFFF');
  }
  if (style.highlightCount >= 2) {
    setVoxel(grid, cx - hw, cy - hh, z, '#EEEEEE');
  }
}

/** 立体的な鼻（前方に突出） */
export function drawNose3D(
  grid: VoxelData,
  cx: number, cy: number, z: number,
  color: string, size: number = 2,
): void {
  if (size >= 2) {
    setVoxel(grid, cx, cy, z, color);
    setVoxel(grid, cx + 1, cy, z, color);
    setVoxel(grid, cx, cy, z + 1, color); // 前方(+Z)突出
    setVoxel(grid, cx + 1, cy, z + 1, color);
  } else {
    setVoxel(grid, cx, cy, z, color);
    setVoxel(grid, cx, cy, z + 1, color);
  }
}

/** 口（にっこり or 舌出し） */
export function drawMouth(
  grid: VoxelData,
  cx: number, cy: number, z: number,
  style: 'smile' | 'tongue' | 'simple' = 'smile',
  width: number = 3,
): void {
  const hw = Math.floor(width / 2);
  if (style === 'smile') {
    // u字型
    for (let dx = -hw; dx <= hw; dx++) {
      setVoxel(grid, cx + dx, cy, z, '#444444');
    }
    setVoxel(grid, cx - hw - 1, cy + 1, z, '#444444');
    setVoxel(grid, cx + hw + 1, cy + 1, z, '#444444');
  } else if (style === 'tongue') {
    for (let dx = -hw; dx <= hw; dx++) {
      setVoxel(grid, cx + dx, cy, z, '#444444');
    }
    // 舌
    setVoxel(grid, cx, cy - 1, z, '#FF6B8A');
    setVoxel(grid, cx + 1, cy - 1, z, '#FF6B8A');
    setVoxel(grid, cx, cy - 1, z + 1, '#FF6B8A');
  } else {
    for (let dx = -hw; dx <= hw; dx++) {
      setVoxel(grid, cx + dx, cy, z, '#555555');
    }
  }
}

/** ほっぺ（ピンクドット） */
export function drawBlush(
  grid: VoxelData,
  cx: number, cy: number, z: number,
  dx: number, color: string = '#FF9999', size: number = 2,
): void {
  for (let i = 0; i < size; i++) {
    setVoxel(grid, cx - dx - i, cy, z, color);
    setVoxel(grid, cx + dx + i + 1, cy, z, color);
  }
}

// ============================================================
// 耳の高精度描画
// ============================================================

/** 丸耳（クマ、パンダ、ハムスター） */
export function drawRoundEars(
  grid: VoxelData,
  cx: number, topY: number, cz: number,
  dx: number, r: number,
  outerColor: string, innerColor: string,
): void {
  // 左耳
  for (let dy = 0; dy < r * 2; dy++) {
    for (let ddx = -r; ddx <= r; ddx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const dist = Math.sqrt(ddx * ddx + (dy - r) * (dy - r));
        if (dist <= r) {
          const c = (dist <= r - 1 && dz === -1) ? innerColor : outerColor;
          setVoxel(grid, cx - dx + ddx, topY + dy, cz + dz, c);
          setVoxel(grid, cx + dx + ddx, topY + dy, cz + dz, c);
        }
      }
    }
  }
}

/** 三角耳（ネコ、キツネ） */
export function drawPointedEars(
  grid: VoxelData,
  cx: number, topY: number, cz: number,
  headHW: number, height: number, baseWidth: number,
  outerColor: string, innerColor: string,
): void {
  for (let h = 0; h < height; h++) {
    const t = h / (height - 1);
    const w = Math.max(1, Math.round(baseWidth * (1 - t * 0.7)));
    for (let dx = 0; dx < w; dx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const isInner = (dx < w - 1 && dz === -1 && h < height - 1);
        const c = isInner ? innerColor : outerColor;
        setVoxel(grid, cx - headHW + dx, topY + h, cz + dz, c);
        setVoxel(grid, cx + headHW - dx, topY + h, cz + dz, c);
      }
    }
  }
}

/** 長耳（ウサギ） */
export function drawLongEars(
  grid: VoxelData,
  cx: number, topY: number, cz: number,
  dx: number, width: number, height: number,
  outerColor: string, innerColor: string,
): void {
  for (let h = 0; h < height; h++) {
    const w = h < height - 1 ? width : Math.max(1, width - 1);
    for (let ddx = 0; ddx < w; ddx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const isInner = (ddx > 0 && ddx < w - 1 && dz === -1);
        const c = isInner ? innerColor : outerColor;
        setVoxel(grid, cx - dx + ddx, topY + h, cz + dz, c);
        setVoxel(grid, cx + dx - ddx, topY + h, cz + dz, c);
      }
    }
  }
}

/** 垂れ耳（イヌ） */
export function drawFloppyEars(
  grid: VoxelData,
  headX1: number, headX2: number,
  baseY: number, cz: number,
  width: number, dropHeight: number,
  color: string, innerColor: string,
): void {
  for (let h = 0; h < dropHeight; h++) {
    for (let dz = -1; dz <= 0; dz++) {
      for (let w = 0; w < width; w++) {
        const c = (dz === -1 && w > 0) ? innerColor : color;
        setVoxel(grid, headX1 - width + w, baseY - h, cz + dz, c);
        setVoxel(grid, headX2 + 1 + w, baseY - h, cz + dz, c);
      }
    }
  }
}

// ============================================================
// 持ち物の高精度描画
// ============================================================

/** 毛糸玉（溝付き球体） */
export function drawYarnBall(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  radius: number, color: string,
): void {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let z = cz - radius; z <= cz + radius; z++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        if (dx * dx + dy * dy + dz * dz <= r2) {
          // 溝パターン: 球面上の位置に基づいて色を変える
          const angle = Math.atan2(dy, dx) + Math.atan2(dz, dx);
          const groove = Math.sin(angle * 3) > 0.3;
          const c = groove ? adjustBrightness(color, 0.8) : color;
          setVoxel(grid, x, y, z, c);
        }
      }
    }
  }
}

/** ひまわりの種 */
export function drawSunflowerSeed(
  grid: VoxelData, cx: number, cy: number, cz: number,
): void {
  // 種本体（濃い茶色の楕円）
  const colors = ['#3D2B1F', '#4A3728', '#2E1F14'];
  for (let dy = 0; dy < 4; dy++) {
    const w = dy === 0 || dy === 3 ? 1 : 2;
    for (let dx = 0; dx < w; dx++) {
      setVoxel(grid, cx + dx, cy + dy, cz, colors[dy % 3]!);
      setVoxel(grid, cx + dx, cy + dy, cz - 1, colors[(dy + 1) % 3]!);
    }
  }
  // 殻の白いライン
  setVoxel(grid, cx, cy + 1, cz, '#8B7D6B');
  setVoxel(grid, cx, cy + 2, cz, '#8B7D6B');
}

/** 首輪 + 鈴 */
export function drawCollar(
  grid: VoxelData,
  cx: number, cy: number, cz: number, czBack: number,
  halfW: number, color: string, bellColor: string = '#FFD700',
): void {
  // 首輪リング
  for (let dx = -halfW; dx <= halfW; dx++) {
    for (let z = cz; z <= czBack; z++) {
      if (dx === -halfW || dx === halfW || z === cz || z === czBack) {
        setVoxel(grid, cx + dx, cy, z, color);
      }
    }
  }
  // 鈴（前面中央）
  setVoxel(grid, cx, cy - 1, cz - 1, bellColor);
  setVoxel(grid, cx + 1, cy - 1, cz - 1, bellColor);
  setVoxel(grid, cx, cy, cz - 1, bellColor);
  setVoxel(grid, cx + 1, cy, cz - 1, bellColor);
  // 鈴のライン
  setVoxel(grid, cx, cy - 1, cz - 1, adjustBrightness(bellColor, 0.7));
}

// ============================================================
// テーパー形状: 先細り/先太りボックス
// ============================================================

/** テーパーボックス: Y軸方向に幅が変化するボックス。
 * bottomW/bottomD が底面、topW/topD が頂面。中間はリニア補間。*/
export function fillTaperedBox3D(
  grid: VoxelData,
  cx: number, y1: number, cz: number,
  bottomW: number, topW: number,
  bottomD: number, topD: number,
  height: number, color: string,
): void {
  for (let y = 0; y < height; y++) {
    const t = height > 1 ? y / (height - 1) : 0;
    const w = Math.round(bottomW + (topW - bottomW) * t);
    const d = Math.round(bottomD + (topD - bottomD) * t);
    const x1 = cx - Math.floor(w / 2);
    const z1 = cz - Math.floor(d / 2);
    fillBox(grid, x1, y1 + y, z1, x1 + w - 1, y1 + y, z1 + d - 1, color);
  }
}

// ============================================================
// 2D楕円塗り: 表面にellipseを描画
// ============================================================

/** 指定面(z固定)に楕円を塗る。ベリー/マズル等の柔らかい形に使用 */
export function paintEllipse2D(
  grid: VoxelData,
  cx: number, cy: number, z: number,
  rx: number, ry: number, color: string,
): void {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1.0) {
        setVoxel(grid, cx + dx, cy + dy, z, color);
      }
    }
  }
}

// ============================================================
// グラデーションボックス: Y方向に色が変化
// ============================================================

/** Y軸方向にbottomColor→topColorへグラデーションするボックス */
export function fillGradientBox(
  grid: VoxelData,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  bottomColor: string, topColor: string,
): void {
  const height = y2 - y1;
  for (let y = y1; y <= y2; y++) {
    const t = height > 0 ? (y - y1) / height : 0;
    const color = lerpColor(bottomColor, topColor, t);
    fillBox(grid, x1, y, z1, x2, y, z2, color);
  }
}

/** 色の線形補間 */
export function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}

// ============================================================
// ユーティリティ
// ============================================================

export function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' +
    Math.min(255, Math.max(0, Math.round(r * factor))).toString(16).padStart(2, '0') +
    Math.min(255, Math.max(0, Math.round(g * factor))).toString(16).padStart(2, '0') +
    Math.min(255, Math.max(0, Math.round(b * factor))).toString(16).padStart(2, '0');
}

