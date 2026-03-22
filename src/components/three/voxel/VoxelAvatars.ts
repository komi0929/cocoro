/**
 * VoxelAvatars v4 — キューブベース・ボクセルアート量産システム
 *
 * ★ 設計思想（参考画像分析に基づく）:
 * - 頭は「立方体」、体は「直方体」（球体禁止）
 * - 全高 14-16 ボクセル（少ないボクセルで意図的にデザイン）
 * - フラットカラー 2-3色（ノイズ/グラデーション禁止）
 * - 目: 2x2黒 + 1白ハイライト（ピクセルアートの基本）
 * - 各ボクセルが視認できるサイズ
 *
 * ★ 量産フロー:
 * 1. CubicBodyPlan に形状パラメータを定義（JSONのみ）
 * 2. generateCubicAvatar(plan) → 完成モデル出力
 * 3. 監査ページで確認
 */

import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';

// ============================================================
// キューブ型ボディプラン
// ============================================================

export interface CubicBodyPlan {
  id: string;
  name: string;
  /** メインカラー（体の色、1色のみ） */
  mainColor: string;
  /** メインカラーの影色 */
  mainShadow: string;
  /** お腹/胸の色 */
  bellyColor: string;
  /** 鼻の色 */
  noseColor: string;
  /** ほっぺの色 */
  blushColor: string;

  /** 頭のサイズ [w, h, d] */
  headSize: [number, number, number];
  /** 体のサイズ [w, h, d] */
  bodySize: [number, number, number];
  /** 腕のサイズ [w, h, d] */
  armSize: [number, number, number];
  /** 足のサイズ [w, h, d] */
  legSize: [number, number, number];
  /** 足の横位置（中心からの距離） */
  legSpacing: number;

  /** 目の横位置（中心からの距離） */
  eyeDx: number;
  /** 目のY位置（頭の中でのオフセット、0=中央） */
  eyeDy: number;
  /** 目のサイズ 2=2x2, 3=2x3 */
  eyeH: number;

  /** 耳 */
  ears: EarDef;
  /** しっぽ */
  tail: TailDef;

  /** お腹パネルのサイズ [w, h] — 体前面に配置 */
  bellyPanel: [number, number];

  /** 特殊マーキング */
  markings?: MarkingDef[];
}

interface EarDef {
  type: 'round' | 'pointed' | 'long' | 'floppy' | 'tiny';
  width: number;
  height: number;
  /** 頭頂部からの横オフセット */
  dx: number;
  /** 耳の内側色 */
  innerColor: string;
}

interface TailDef {
  type: 'stub' | 'long' | 'fluffy';
  length: number;
  color?: string; // デフォルトはmainColor
  tipColor?: string; // 先端色（キツネの白先端等）
}

interface MarkingDef {
  type: 'eye-patch' | 'face-white' | 'stripe';
  color: string;
  /** 適用位置 */
  area: 'head' | 'body';
}

// ============================================================
// お手本に基づくプリセット定義
// ============================================================

export const CUBIC_PLANS: Record<string, CubicBodyPlan> = {
  bear: {
    id: 'bear', name: 'クマ',
    mainColor: '#8B5E3C', mainShadow: '#6B4226',
    bellyColor: '#D4B892', noseColor: '#2D1B0E', blushColor: '#FFB0B0',
    headSize: [8, 7, 7], bodySize: [7, 6, 5], armSize: [2, 5, 2], legSize: [2, 3, 2],
    legSpacing: 2, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [5, 4],
    ears: { type: 'round', width: 2, height: 2, dx: 3, innerColor: '#C49A6C' },
    tail: { type: 'stub', length: 1 },
  },
  cat: {
    id: 'cat', name: 'ネコ',
    mainColor: '#E88A36', mainShadow: '#C06D1E',
    bellyColor: '#FFF5E6', noseColor: '#FF8CAA', blushColor: '#FFB6C1',
    headSize: [7, 6, 6], bodySize: [6, 6, 4], armSize: [2, 4, 2], legSize: [2, 3, 2],
    legSpacing: 1, eyeDx: 2, eyeDy: 1, eyeH: 3,
    bellyPanel: [4, 4],
    ears: { type: 'pointed', width: 2, height: 3, dx: 2, innerColor: '#FFB6C1' },
    tail: { type: 'long', length: 6 },
  },
  rabbit: {
    id: 'rabbit', name: 'ウサギ',
    mainColor: '#F0EDE8', mainShadow: '#D5D0C8',
    bellyColor: '#FFFFFF', noseColor: '#FFB0B0', blushColor: '#FFB6C1',
    headSize: [7, 7, 6], bodySize: [6, 5, 5], armSize: [2, 4, 2], legSize: [2, 3, 3],
    legSpacing: 1, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [4, 3],
    ears: { type: 'long', width: 2, height: 6, dx: 2, innerColor: '#FFB6C1' },
    tail: { type: 'stub', length: 2 },
  },
  dog: {
    id: 'dog', name: 'イヌ',
    mainColor: '#C49A6C', mainShadow: '#A07848',
    bellyColor: '#F5E6D3', noseColor: '#2D1B0E', blushColor: '#FFB6C1',
    headSize: [8, 7, 7], bodySize: [7, 6, 5], armSize: [2, 5, 2], legSize: [2, 3, 2],
    legSpacing: 2, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [5, 4],
    ears: { type: 'floppy', width: 2, height: 4, dx: 3, innerColor: '#A07848' },
    tail: { type: 'long', length: 4, color: '#C49A6C' },
  },
  panda: {
    id: 'panda', name: 'パンダ',
    mainColor: '#F0F0F0', mainShadow: '#D8D8D8',
    bellyColor: '#FFFFFF', noseColor: '#1A1A1A', blushColor: '#FFB6C1',
    headSize: [8, 7, 7], bodySize: [7, 6, 5], armSize: [2, 5, 2], legSize: [2, 3, 2],
    legSpacing: 2, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [5, 4],
    ears: { type: 'round', width: 2, height: 2, dx: 3, innerColor: '#1A1A1A' },
    tail: { type: 'stub', length: 1 },
    markings: [
      { type: 'eye-patch', color: '#1A1A1A', area: 'head' },
    ],
  },
  fox: {
    id: 'fox', name: 'キツネ',
    mainColor: '#D4652B', mainShadow: '#AA4518',
    bellyColor: '#FFF5E6', noseColor: '#1A1A1A', blushColor: '#FFB6C1',
    headSize: [7, 6, 6], bodySize: [6, 6, 5], armSize: [2, 4, 2], legSize: [2, 3, 2],
    legSpacing: 1, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [4, 4],
    ears: { type: 'pointed', width: 3, height: 4, dx: 2, innerColor: '#FFF5E6' },
    tail: { type: 'fluffy', length: 5, tipColor: '#FFFFFF' },
    markings: [
      { type: 'face-white', color: '#FFF5E6', area: 'head' },
    ],
  },
  penguin: {
    id: 'penguin', name: 'ペンギン',
    mainColor: '#2C3E6B', mainShadow: '#1A2744',
    bellyColor: '#FFFFFF', noseColor: '#FF8C00', blushColor: '#FFB6C1',
    headSize: [7, 6, 6], bodySize: [6, 6, 5], armSize: [2, 5, 1], legSize: [2, 1, 2],
    legSpacing: 1, eyeDx: 2, eyeDy: 1, eyeH: 2,
    bellyPanel: [5, 5],
    ears: { type: 'tiny', width: 0, height: 0, dx: 0, innerColor: '#2C3E6B' },
    tail: { type: 'stub', length: 1 },
  },
  hamster: {
    id: 'hamster', name: 'ハムスター',
    mainColor: '#E8C39E', mainShadow: '#C4A07A',
    bellyColor: '#FFF8F0', noseColor: '#FFB0B0', blushColor: '#FF9999',
    headSize: [8, 7, 7], bodySize: [7, 5, 5], armSize: [2, 3, 2], legSize: [2, 2, 2],
    legSpacing: 2, eyeDx: 2, eyeDy: 1, eyeH: 3,
    bellyPanel: [5, 3],
    ears: { type: 'round', width: 2, height: 2, dx: 3, innerColor: '#FFB6C1' },
    tail: { type: 'stub', length: 1 },
  },
};

// ============================================================
// コア描画: ボックス塗り（フラットカラー、ノイズなし）
// ============================================================

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
// メイン生成関数
// ============================================================

export function generateCubicAvatar(
  planId: string,
  options: {
    accessory?: 'none' | 'ribbon' | 'hat' | 'scarf' | 'crown';
    heldItem?: 'none' | 'honey' | 'flower' | 'star' | 'sword' | 'shield';
    expression?: 'happy' | 'neutral' | 'wink';
  } = {},
  _seed: number = 42,
): VoxelData {
  const P = CUBIC_PLANS[planId];
  if (!P) { console.error(`Unknown plan: ${planId}`); return createGrid(1, 1, 1); }

  const [hw, hh, hd] = P.headSize;
  const [bw, bh, bd] = P.bodySize;
  const [aw, ah, ad] = P.armSize;
  const [lw, lh, ld] = P.legSize;

  // グリッドサイズを計算
  const totalW = Math.max(hw, bw + aw * 2 + 2) + 8; // 持ち物スペース
  const totalH = lh + bh + hh + P.ears.height + 4;
  const totalD = Math.max(hd, bd, P.tail.length + bd) + 2;
  const grid = createGrid(totalW, totalH, totalD);

  const cx = Math.floor(totalW / 2);
  const cz = Math.floor(totalD / 2) - 1; // やや前寄り

  // ===== 1. 足 =====
  const legY = 0;
  const lx1 = cx - P.legSpacing - lw + 1;
  const lx2 = cx + P.legSpacing;
  fillFlat(grid, lx1, legY, cz - Math.floor(ld / 2), lx1 + lw - 1, legY + lh - 1, cz + Math.floor(ld / 2), P.mainColor);
  fillFlat(grid, lx2, legY, cz - Math.floor(ld / 2), lx2 + lw - 1, legY + lh - 1, cz + Math.floor(ld / 2), P.mainColor);

  // ===== 2. 体 =====
  const bodyY = lh;
  const bx1 = cx - Math.floor(bw / 2);
  const bz1 = cz - Math.floor(bd / 2);
  fillFlat(grid, bx1, bodyY, bz1, bx1 + bw - 1, bodyY + bh - 1, bz1 + bd - 1, P.mainColor);
  // 体の底面を影色に
  fillFlat(grid, bx1, bodyY, bz1, bx1 + bw - 1, bodyY, bz1 + bd - 1, P.mainShadow);

  // お腹パネル（前面）
  const [bpw, bph] = P.bellyPanel;
  const bpx1 = cx - Math.floor(bpw / 2);
  const bpy1 = bodyY + 1;
  fillFlat(grid, bpx1, bpy1, bz1, bpx1 + bpw - 1, bpy1 + bph - 1, bz1, P.bellyColor);

  // ===== 3. 腕 =====
  const armY = bodyY + bh - ah;
  const armLx = bx1 - aw;
  const armRx = bx1 + bw;
  fillFlat(grid, armLx, armY, cz - Math.floor(ad / 2), armLx + aw - 1, armY + ah - 1, cz + Math.floor(ad / 2), P.mainColor);
  fillFlat(grid, armRx, armY, cz - Math.floor(ad / 2), armRx + aw - 1, armY + ah - 1, cz + Math.floor(ad / 2), P.mainColor);

  // ===== 4. 頭 =====
  const headY = bodyY + bh;
  const hx1 = cx - Math.floor(hw / 2);
  const hz1 = cz - Math.floor(hd / 2);
  fillFlat(grid, hx1, headY, hz1, hx1 + hw - 1, headY + hh - 1, hz1 + hd - 1, P.mainColor);
  // 頭頂を少し明るく
  fillFlat(grid, hx1, headY + hh - 1, hz1, hx1 + hw - 1, headY + hh - 1, hz1 + hd - 1, P.mainColor);

  // マーキング
  if (P.markings) {
    for (const m of P.markings) {
      if (m.type === 'eye-patch' && m.area === 'head') {
        // パンダの目パッチ
        const ey = headY + Math.floor(hh / 2) + P.eyeDy;
        for (let dy = -1; dy <= 2; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            setVoxel(grid, cx - P.eyeDx + dx, ey + dy, hz1, m.color);
            setVoxel(grid, cx + P.eyeDx + dx, ey + dy, hz1, m.color);
          }
        }
      } else if (m.type === 'face-white' && m.area === 'head') {
        // キツネの白い顔マーク
        const fy = headY;
        for (let dy = 0; dy < Math.floor(hh / 2) + 1; dy++) {
          const w = Math.max(1, Math.floor(hw / 2) - dy);
          for (let dx = -w; dx <= w; dx++) {
            setVoxel(grid, cx + dx, fy + dy, hz1, m.color);
          }
        }
      }
    }
  }

  // ===== 5. 顔 =====
  const faceZ = hz1; // 前面
  const eyeY = headY + Math.floor(hh / 2) + P.eyeDy;

  // 目（2xN 黒 + ハイライト）
  const expr = options.expression ?? 'happy';
  // 左目
  for (let dy = 0; dy < P.eyeH; dy++) {
    setVoxel(grid, cx - P.eyeDx, eyeY + dy, faceZ, '#1A1A1A');
    setVoxel(grid, cx - P.eyeDx + 1, eyeY + dy, faceZ, '#1A1A1A');
  }
  // 左目ハイライト
  setVoxel(grid, cx - P.eyeDx, eyeY + P.eyeH - 1, faceZ, '#FFFFFF');

  // 右目
  if (expr === 'wink') {
    // ウィンク: 右目を1ラインに
    setVoxel(grid, cx + P.eyeDx, eyeY + 1, faceZ, '#1A1A1A');
    setVoxel(grid, cx + P.eyeDx + 1, eyeY + 1, faceZ, '#1A1A1A');
  } else {
    for (let dy = 0; dy < P.eyeH; dy++) {
      setVoxel(grid, cx + P.eyeDx, eyeY + dy, faceZ, '#1A1A1A');
      setVoxel(grid, cx + P.eyeDx + 1, eyeY + dy, faceZ, '#1A1A1A');
    }
    setVoxel(grid, cx + P.eyeDx + 1, eyeY + P.eyeH - 1, faceZ, '#FFFFFF');
  }

  // 鼻（中央）
  setVoxel(grid, cx, eyeY - 1, faceZ, P.noseColor);
  setVoxel(grid, cx + 1, eyeY - 1, faceZ, P.noseColor);

  // ほっぺ
  setVoxel(grid, cx - P.eyeDx - 1, eyeY - 1, faceZ, P.blushColor);
  setVoxel(grid, cx + P.eyeDx + 2, eyeY - 1, faceZ, P.blushColor);

  // 口
  if (expr === 'happy') {
    setVoxel(grid, cx, eyeY - 2, faceZ, '#555555');
    setVoxel(grid, cx + 1, eyeY - 2, faceZ, '#555555');
    setVoxel(grid, cx - 1, eyeY - 2, faceZ, '#555555');
  }

  // ===== 6. 耳 =====
  const earY = headY + hh;
  const E = P.ears;
  if (E.type === 'round') {
    // 丸耳（クマ、ハムスター、パンダ）
    fillFlat(grid, cx - E.dx, earY, cz - 1, cx - E.dx + E.width - 1, earY + E.height - 1, cz, E.innerColor === '#1A1A1A' ? '#1A1A1A' : P.mainColor);
    fillFlat(grid, cx + E.dx - E.width + 1, earY, cz - 1, cx + E.dx, earY + E.height - 1, cz, E.innerColor === '#1A1A1A' ? '#1A1A1A' : P.mainColor);
    // 内側色
    if (E.innerColor !== '#1A1A1A') {
      setVoxel(grid, cx - E.dx, earY, cz - 1, E.innerColor);
      setVoxel(grid, cx + E.dx, earY, cz - 1, E.innerColor);
    }
  } else if (E.type === 'pointed') {
    // 三角耳（ネコ、キツネ）
    for (let h = 0; h < E.height; h++) {
      const w = Math.max(1, E.width - h);
      for (let dx = 0; dx < w; dx++) {
        setVoxel(grid, cx - E.dx - Math.floor(hw / 2) + 1 + dx, earY + h, cz, P.mainColor);
        setVoxel(grid, cx + E.dx + Math.floor(hw / 2) - 1 - dx + 1, earY + h, cz, P.mainColor);
        setVoxel(grid, cx - E.dx - Math.floor(hw / 2) + 1 + dx, earY + h, cz - 1, P.mainColor);
        setVoxel(grid, cx + E.dx + Math.floor(hw / 2) - 1 - dx + 1, earY + h, cz - 1, P.mainColor);
      }
      // 内側
      if (h < E.height - 1 && w > 1) {
        setVoxel(grid, cx - E.dx - Math.floor(hw / 2) + 2, earY + h, cz - 1, E.innerColor);
        setVoxel(grid, cx + E.dx + Math.floor(hw / 2) - 1, earY + h, cz - 1, E.innerColor);
      }
    }
  } else if (E.type === 'long') {
    // 長耳（ウサギ）
    for (let h = 0; h < E.height; h++) {
      fillFlat(grid, cx - E.dx, earY + h, cz - 1, cx - E.dx + E.width - 1, earY + h, cz, P.mainColor);
      fillFlat(grid, cx + E.dx - E.width + 2, earY + h, cz - 1, cx + E.dx + 1, earY + h, cz, P.mainColor);
      // 内側ピンク
      setVoxel(grid, cx - E.dx, earY + h, cz - 1, E.innerColor);
      setVoxel(grid, cx + E.dx + 1, earY + h, cz - 1, E.innerColor);
    }
  } else if (E.type === 'floppy') {
    // 垂れ耳（イヌ）
    const earBaseY = headY + hh - 2;
    for (let h = 0; h < E.height; h++) {
      fillFlat(grid, hx1 - E.width, earBaseY - h, cz - 1, hx1 - 1, earBaseY - h, cz, E.innerColor);
      fillFlat(grid, hx1 + hw, earBaseY - h, cz - 1, hx1 + hw + E.width - 1, earBaseY - h, cz, E.innerColor);
    }
  }
  // 'tiny' = 耳なし（ペンギン等）

  // ===== 7. しっぽ =====
  const tailZ = bz1 + bd;
  const tailY = bodyY + Math.floor(bh / 2);
  if (P.tail.type === 'stub') {
    for (let i = 0; i < P.tail.length; i++) {
      setVoxel(grid, cx, tailY, tailZ + i, P.tail.color ?? P.mainColor);
    }
  } else if (P.tail.type === 'long') {
    for (let i = 0; i < P.tail.length; i++) {
      const ty = tailY + Math.round(Math.sin(i * 0.5) * 1);
      setVoxel(grid, cx, ty, tailZ + i, P.tail.color ?? P.mainColor);
      setVoxel(grid, cx, ty + 1, tailZ + i, P.tail.color ?? P.mainColor);
    }
  } else if (P.tail.type === 'fluffy') {
    for (let i = 0; i < P.tail.length; i++) {
      const w = i < P.tail.length - 1 ? 1 : 0;
      const c = i >= P.tail.length - 2 ? (P.tail.tipColor ?? P.mainColor) : (P.tail.color ?? P.mainColor);
      for (let dx = -w; dx <= w; dx++) {
        for (let dy = -w; dy <= w; dy++) {
          setVoxel(grid, cx + dx, tailY + dy, tailZ + i, c);
        }
      }
    }
  }

  // ===== 8. アクセサリ =====
  const accY = headY + hh + (E.type !== 'tiny' ? E.height : 0);
  if (options.accessory === 'ribbon') {
    // ピンクリボン（頭の上）
    setVoxel(grid, cx, accY, cz, '#FF1493');
    setVoxel(grid, cx - 1, accY, cz, '#FF69B4');
    setVoxel(grid, cx + 1, accY, cz, '#FF69B4');
    setVoxel(grid, cx - 2, accY, cz, '#FF69B4');
    setVoxel(grid, cx + 2, accY, cz, '#FF69B4');
    setVoxel(grid, cx, accY + 1, cz, '#FF1493');
  } else if (options.accessory === 'crown') {
    // 王冠
    fillFlat(grid, cx - 2, accY, cz - 1, cx + 2, accY, cz + 1, '#FFD700');
    setVoxel(grid, cx - 2, accY + 1, cz, '#FFD700');
    setVoxel(grid, cx, accY + 1, cz, '#FFD700');
    setVoxel(grid, cx + 2, accY + 1, cz, '#FFD700');
    setVoxel(grid, cx, accY + 1, cz - 1, '#FF0000');
  } else if (options.accessory === 'scarf') {
    const sy = bodyY + bh - 1;
    fillFlat(grid, bx1 - 1, sy, bz1 - 1, bx1 + bw, sy, bz1 + bd, '#FF4444');
    fillFlat(grid, bx1 - 1, sy + 1, bz1 - 1, bx1 + bw, sy + 1, bz1 + bd, '#CC3333');
    // たれ
    for (let dy = 0; dy < 3; dy++) {
      setVoxel(grid, bx1 + bw, sy - dy, bz1, '#FF4444');
    }
  } else if (options.accessory === 'hat') {
    fillFlat(grid, cx - 3, accY, cz - 2, cx + 3, accY, cz + 2, '#8B4513');
    fillFlat(grid, cx - 2, accY + 1, cz - 1, cx + 2, accY + 2, cz + 1, '#8B4513');
    fillFlat(grid, cx - 2, accY + 1, cz - 1, cx + 2, accY + 1, cz + 1, '#FF4444');
  }

  // ===== 9. 持ち物 =====
  const itemX = armRx + aw;
  const itemY = armY + 1;
  if (options.heldItem === 'honey') {
    // ハチミツ壺
    fillFlat(grid, itemX, itemY, cz - 1, itemX + 2, itemY + 3, cz + 1, '#FFD54F');
    fillFlat(grid, itemX, itemY + 3, cz - 1, itemX + 2, itemY + 3, cz + 1, '#8B4513');
    setVoxel(grid, itemX + 1, itemY + 4, cz, '#6B3E1E');
  } else if (options.heldItem === 'flower') {
    // 花
    for (let dy = 0; dy < 3; dy++) setVoxel(grid, itemX + 1, itemY + dy, cz, '#228B22');
    setVoxel(grid, itemX + 1, itemY + 3, cz, '#FFD700');
    setVoxel(grid, itemX, itemY + 3, cz, '#FF69B4');
    setVoxel(grid, itemX + 2, itemY + 3, cz, '#FF69B4');
    setVoxel(grid, itemX + 1, itemY + 4, cz, '#FF69B4');
  } else if (options.heldItem === 'star') {
    setVoxel(grid, itemX + 1, itemY + 2, cz, '#FFFFFF');
    setVoxel(grid, itemX, itemY + 2, cz, '#FFD700');
    setVoxel(grid, itemX + 2, itemY + 2, cz, '#FFD700');
    setVoxel(grid, itemX + 1, itemY + 3, cz, '#FFD700');
    setVoxel(grid, itemX + 1, itemY + 1, cz, '#FFD700');
  } else if (options.heldItem === 'sword') {
    // 剣（ペンギン参考）
    for (let dy = 0; dy < 5; dy++) setVoxel(grid, itemX + 1, itemY + dy, cz, '#C0C0C0');
    setVoxel(grid, itemX, itemY + 2, cz, '#8B4513');
    setVoxel(grid, itemX + 2, itemY + 2, cz, '#8B4513');
    setVoxel(grid, itemX + 1, itemY + 5, cz, '#E0E0E0');
  } else if (options.heldItem === 'shield') {
    // 盾（ペンギン参考）
    fillFlat(grid, armLx - 2, armY, cz - 2, armLx - 1, armY + 3, cz + 1, '#6B8EC0');
    fillFlat(grid, armLx - 2, armY + 1, cz - 1, armLx - 1, armY + 2, cz, '#FFFFFF');
  }

  return grid;
}

// ============================================================
// プリセットショートカット
// ============================================================
export function generateBearAvatar(seed: number = 42): VoxelData {
  return generateCubicAvatar('bear', { expression: 'happy', heldItem: 'honey' }, seed);
}
export function generateCatAvatar(seed: number = 100): VoxelData {
  return generateCubicAvatar('cat', { expression: 'happy', accessory: 'ribbon' }, seed);
}
export function generateRabbitAvatar(seed: number = 200): VoxelData {
  return generateCubicAvatar('rabbit', { expression: 'happy', heldItem: 'flower' }, seed);
}
export function generateDogAvatar(seed: number = 300): VoxelData {
  return generateCubicAvatar('dog', { expression: 'happy', accessory: 'scarf' }, seed);
}
export function generatePandaAvatar(seed: number = 400): VoxelData {
  return generateCubicAvatar('panda', { expression: 'happy', heldItem: 'star' }, seed);
}
export function generateFoxAvatar(seed: number = 500): VoxelData {
  return generateCubicAvatar('fox', { expression: 'wink' }, seed);
}
export function generatePenguinAvatar(seed: number = 600): VoxelData {
  return generateCubicAvatar('penguin', { expression: 'happy', heldItem: 'sword' }, seed);
}
export function generateHamsterAvatar(seed: number = 700): VoxelData {
  return generateCubicAvatar('hamster', { expression: 'happy', heldItem: 'flower' }, seed);
}
