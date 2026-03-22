/**
 * VoxelAvatars v5 — ナノブロック品質ボクセルアバター量産システム
 *
 * ★ 参考画像分析に基づくデザイン原則:
 * - 全高 32-40 ボクセル（頭:体 = 1:0.8 大頭身）
 * - 1パーツ3-5色階調（ベース+影+ハイライト+中間色）
 * - ステップドカーブで角を段差的に丸める
 * - 高精度顔: 3x4目（瞳+白目+複数ハイライト）
 * - 種族固有パターン（猫の縞、パンダの黒パッチ等）
 * - 立体的な持ち物（毛糸玉の溝、ひまわりの種の殻等）
 */

import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import {
  fillRoundedBox3D, fillSteppedSphere,
  drawDetailedEye, drawNose3D, drawMouth, drawBlush,
  drawRoundEars, drawPointedEars, drawLongEars, drawFloppyEars,
  drawYarnBall, drawSunflowerSeed, drawCollar,
  adjustBrightness, type EyeStyle,
} from './VoxelPrimitives';

// ============================================================
// カラープロファイル
// ============================================================

interface ColorProfile {
  base: string;
  highlight: string;
  shadow: string;
  midtone: string;
}

interface AvatarPlanV5 {
  id: string;
  name: string;
  body: ColorProfile;
  belly: ColorProfile;
  noseColor: string;
  blushColor: string;
  eyeStyle: EyeStyle;

  // サイズ (全体が32-40ボクセルになるよう)
  headW: number; headH: number; headD: number;
  bodyW: number; bodyH: number; bodyD: number;
  armW: number;  armH: number;  armD: number;
  legW: number;  legH: number;  legD: number;
  legSpacing: number;
  headCornerR: number; // 頭の角丸め段数
  bodyCornerR: number;

  // 顔位置
  eyeDx: number;
  eyeY: number; // 頭内での目のY位置(0=中央)

  // 耳
  earType: 'round' | 'pointed' | 'long' | 'floppy' | 'none';
  earParams: {
    dx: number; height: number; width: number;
    outerColor: string; innerColor: string;
  };

  // しっぽ
  tailType: 'stub' | 'long' | 'fluffy';
  tailLength: number;
  tailColor?: string;
  tailTipColor?: string;

  // お腹パネル
  bellyW: number; bellyH: number;

  // 特殊描画
  specialFeatures?: (grid: VoxelData, ctx: DrawContext) => void;
}

interface DrawContext {
  cx: number; cz: number;
  headY: number; bodyY: number; legY: number;
  headX1: number; headX2: number;
  headZ1: number; headFrontZ: number;
  bodyX1: number; bodyZ1: number; bodyFrontZ: number;
  armLX: number; armRX: number; armY: number;
  plan: AvatarPlanV5;
}

// ============================================================
// 種族定義
// ============================================================

function cp(base: string, hf = 1.15, sf = 0.75, mf = 0.92): ColorProfile {
  return { base, highlight: adjustBrightness(base, hf), shadow: adjustBrightness(base, sf), midtone: adjustBrightness(base, mf) };
}

const PLANS: Record<string, AvatarPlanV5> = {
  bear: {
    id: 'bear', name: 'クマ',
    body: cp('#8B6240'),
    belly: cp('#D4B892', 1.08, 0.88),
    noseColor: '#2D1B0E', blushColor: '#FF9999',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 14, headH: 12, headD: 12,
    bodyW: 12, bodyH: 10, bodyD: 10,
    armW: 4, armH: 8, armD: 4,
    legW: 4, legH: 5, legD: 4,
    legSpacing: 3, headCornerR: 3, bodyCornerR: 2,
    eyeDx: 3, eyeY: 1,
    earType: 'round',
    earParams: { dx: 5, height: 4, width: 3, outerColor: '#8B6240', innerColor: '#C49A6C' },
    tailType: 'stub', tailLength: 2,
    bellyW: 8, bellyH: 7,
  },
  cat: {
    id: 'cat', name: 'ネコ',
    body: cp('#9E9E9E'),
    belly: cp('#E8E8E8', 1.05, 0.90),
    noseColor: '#FF8CAA', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 14, headH: 11, headD: 11,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 3, armH: 7, armD: 3,
    legW: 3, legH: 5, legD: 3,
    legSpacing: 2, headCornerR: 3, bodyCornerR: 1,
    eyeDx: 3, eyeY: 1,
    earType: 'pointed',
    earParams: { dx: 3, height: 5, width: 4, outerColor: '#9E9E9E', innerColor: '#FFB6C1' },
    tailType: 'long', tailLength: 8,
    bellyW: 7, bellyH: 7,
    specialFeatures: (grid, ctx) => {
      // 猫の縞模様（体+頭の側面・背面に暗いグレー縞）
      const stripeColor = '#707070';
      const { plan, headY, headX1, headX2, headZ1, bodyY, bodyX1, bodyZ1 } = ctx;
      // 頭の縞模様(上面)
      for (let dy = 2; dy < plan.headH; dy += 3) {
        for (let dx = headX1 + 1; dx < headX2; dx += 2) {
          for (let dz = headZ1; dz < headZ1 + plan.headD; dz++) {
            const ry = headY + dy;
            if (ry >= 0 && ry < grid.length && dz >= 0 && grid[ry]?.[dz]?.[dx] !== null && grid[ry]?.[dz]?.[dx] !== undefined) {
              setVoxel(grid, dx, ry, dz, stripeColor);
            }
          }
        }
      }
      // 体の縞
      for (let dy = 1; dy < plan.bodyH; dy += 3) {
        for (let dx = bodyX1 + 1; dx < bodyX1 + plan.bodyW - 1; dx += 2) {
          for (let dz = bodyZ1; dz < bodyZ1 + plan.bodyD; dz++) {
            const ry = bodyY + dy;
            if (ry >= 0 && ry < grid.length && grid[ry]?.[dz]?.[dx] !== null && grid[ry]?.[dz]?.[dx] !== undefined) {
              setVoxel(grid, dx, ry, dz, stripeColor);
            }
          }
        }
      }
    },
  },
  rabbit: {
    id: 'rabbit', name: 'ウサギ',
    body: cp('#D9C9A8'),
    belly: cp('#F5EDE0', 1.05, 0.92),
    noseColor: '#FFB0B0', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 14, headH: 12, headD: 11,
    bodyW: 11, bodyH: 9, bodyD: 9,
    armW: 3, armH: 7, armD: 3,
    legW: 4, legH: 4, legD: 5,
    legSpacing: 2, headCornerR: 3, bodyCornerR: 1,
    eyeDx: 3, eyeY: 1,
    earType: 'long',
    earParams: { dx: 3, height: 10, width: 3, outerColor: '#D9C9A8', innerColor: '#FFAABB' },
    tailType: 'stub', tailLength: 3, tailColor: '#F5EDE0',
    bellyW: 7, bellyH: 6,
  },
  dog: {
    id: 'dog', name: 'イヌ',
    body: cp('#EADDD0'),
    belly: cp('#FFFFFF', 1.0, 0.92),
    noseColor: '#2D1B0E', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 14, headH: 12, headD: 12,
    bodyW: 12, bodyH: 10, bodyD: 10,
    armW: 4, armH: 8, armD: 4,
    legW: 4, legH: 5, legD: 4,
    legSpacing: 3, headCornerR: 3, bodyCornerR: 2,
    eyeDx: 3, eyeY: 1,
    earType: 'floppy',
    earParams: { dx: 5, height: 6, width: 3, outerColor: '#C49050', innerColor: '#B08040' },
    tailType: 'long', tailLength: 5,
    bellyW: 8, bellyH: 7,
    specialFeatures: (grid, ctx) => {
      const patchColor = '#C49050';
      const { headY, headX1, headX2, headZ1, headFrontZ, bodyY, bodyFrontZ, cx, cz, plan } = ctx;
      // 頭頂パッチ（右半分を茶色）
      for (let dy = Math.floor(plan.headH * 0.5); dy < plan.headH; dy++) {
        for (let dx = cx; dx <= headX2; dx++) {
          for (let dz = headZ1; dz < headZ1 + plan.headD; dz++) {
            const ry = headY + dy;
            if (ry >= 0 && ry < grid.length && grid[ry]?.[dz]?.[dx] !== null && grid[ry]?.[dz]?.[dx] !== undefined) {
              setVoxel(grid, dx, ry, dz, patchColor);
            }
          }
        }
      }
      // 首輪 + 鈴
      const collarY = bodyY + plan.bodyH - 1;
      drawCollar(grid, cx, collarY, headZ1, headZ1 + plan.headD - 1, Math.floor(plan.bodyW / 2), '#4488CC', '#FFD700');
      // 舌c（前面=+Z方向に突出）
      const mouthY = headY + Math.floor(plan.headH / 2) + plan.eyeY - 3;
      setVoxel(grid, cx, mouthY, headFrontZ + 1, '#FF6B8A');
      setVoxel(grid, cx + 1, mouthY, headFrontZ + 1, '#FF6B8A');
    },
  },
  panda: {
    id: 'panda', name: 'パンダ',
    body: cp('#F0F0F0', 1.05, 0.85),
    belly: cp('#FFFFFF'),
    noseColor: '#1A1A1A', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 14, headH: 12, headD: 12,
    bodyW: 13, bodyH: 11, bodyD: 10,
    armW: 4, armH: 9, armD: 4,
    legW: 4, legH: 5, legD: 4,
    legSpacing: 3, headCornerR: 3, bodyCornerR: 2,
    eyeDx: 3, eyeY: 1,
    earType: 'round',
    earParams: { dx: 5, height: 4, width: 3, outerColor: '#1A1A1A', innerColor: '#1A1A1A' },
    tailType: 'stub', tailLength: 1,
    bellyW: 9, bellyH: 8,
    specialFeatures: (grid, ctx) => {
      // パンダ: 精密な目パッチ + 黒い手足
      const black = '#1A1A1A';
      const darkGray = '#2A2A2A';
      const { headY, cx, headZ1, headFrontZ, plan, bodyY, bodyX1, bodyZ1, legY, armLX, armRX, armY } = ctx;
      // 目パッチ（楕円形の黒パッチ — 前面）
      const eyeBaseY = headY + Math.floor(plan.headH / 2) + plan.eyeY;
      for (let dy = -2; dy <= 3; dy++) {
        const w = (dy === -2 || dy === 3) ? 1 : (dy === -1 || dy === 2) ? 2 : 3;
        for (let dx = 0; dx < w; dx++) {
          setVoxel(grid, cx - plan.eyeDx - dx, eyeBaseY + dy, headFrontZ, black);
          setVoxel(grid, cx + plan.eyeDx + dx + 1, eyeBaseY + dy, headFrontZ, black);
          setVoxel(grid, cx - plan.eyeDx - dx, eyeBaseY + dy, headFrontZ - 1, black);
          setVoxel(grid, cx + plan.eyeDx + dx + 1, eyeBaseY + dy, headFrontZ - 1, black);
        }
      }
      // 腕を黒に
      for (let dy = 0; dy < plan.armH; dy++) {
        for (let dz = 0; dz < plan.armD; dz++) {
          for (let dx = 0; dx < plan.armW; dx++) {
            setVoxel(grid, armLX + dx, armY + dy, ctx.bodyZ1 + Math.floor(plan.bodyD/2) - Math.floor(plan.armD/2) + dz, black);
            setVoxel(grid, armRX + dx, armY + dy, ctx.bodyZ1 + Math.floor(plan.bodyD/2) - Math.floor(plan.armD/2) + dz, black);
          }
        }
      }
      // 足を黒に
      for (let dy = 0; dy < plan.legH; dy++) {
        for (let dz = 0; dz < plan.legD; dz++) {
          for (let dx = 0; dx < plan.legW; dx++) {
            const lx1 = cx - plan.legSpacing - plan.legW + 1;
            const lx2 = cx + plan.legSpacing;
            setVoxel(grid, lx1 + dx, legY + dy, ctx.cz - Math.floor(plan.legD/2) + dz, black);
            setVoxel(grid, lx2 + dx, legY + dy, ctx.cz - Math.floor(plan.legD/2) + dz, black);
          }
        }
      }
    },
  },
  fox: {
    id: 'fox', name: 'キツネ',
    body: cp('#D4652B'),
    belly: cp('#FFF5E6', 1.02, 0.90),
    noseColor: '#1A1A1A', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 13, headH: 11, headD: 11,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 3, armH: 7, armD: 3,
    legW: 3, legH: 5, legD: 3,
    legSpacing: 2, headCornerR: 3, bodyCornerR: 1,
    eyeDx: 3, eyeY: 1,
    earType: 'pointed',
    earParams: { dx: 3, height: 6, width: 4, outerColor: '#D4652B', innerColor: '#FFF5E6' },
    tailType: 'fluffy', tailLength: 7, tailColor: '#D4652B', tailTipColor: '#FFFFFF',
    bellyW: 7, bellyH: 7,
    specialFeatures: (grid, ctx) => {
      // キツネ: 白い顔の逆三角+足先の黒
      const white = '#FFF5E6';
      const { headY, cx, headFrontZ, plan } = ctx;
      // 顔の下半分を白に（前面のみ）
      for (let dy = 0; dy < Math.floor(plan.headH * 0.6); dy++) {
        const maxW = Math.floor(plan.headW / 2) - Math.floor(dy * 0.5);
        for (let dx = -maxW; dx <= maxW; dx++) {
          setVoxel(grid, cx + dx, headY + dy, headFrontZ, white);
        }
      }
      // 足先を暗く（靴下）
      const dark = '#2D1B0E';
      for (let dx = 0; dx < plan.legW; dx++) {
        for (let dz = 0; dz < plan.legD; dz++) {
          const lx1 = ctx.cx - plan.legSpacing - plan.legW + 1 + dx;
          const lx2 = ctx.cx + plan.legSpacing + dx;
          const lz = ctx.cz - Math.floor(plan.legD/2) + dz;
          setVoxel(grid, lx1, ctx.legY, lz, dark);
          setVoxel(grid, lx2, ctx.legY, lz, dark);
        }
      }
    },
  },
  penguin: {
    id: 'penguin', name: 'ペンギン',
    body: cp('#2C3E6B'),
    belly: cp('#FFFFFF'),
    noseColor: '#FF8C00', blushColor: '#FFB6C1',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 13, headH: 11, headD: 11,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 2, armH: 8, armD: 2,
    legW: 3, legH: 2, legD: 3,
    legSpacing: 2, headCornerR: 3, bodyCornerR: 1,
    eyeDx: 3, eyeY: 1,
    earType: 'none',
    earParams: { dx: 0, height: 0, width: 0, outerColor: '', innerColor: '' },
    tailType: 'stub', tailLength: 1,
    bellyW: 8, bellyH: 8,
    specialFeatures: (grid, ctx) => {
      // ペンギン: くちばしを立体的に
      const orange = '#FF8C00';
      const { headY, cx, headFrontZ, plan } = ctx;
      const beakY = headY + Math.floor(plan.headH / 2) + plan.eyeY - 1;
      // 立体くちばし（+Z方向に突出）
      setVoxel(grid, cx, beakY, headFrontZ + 1, orange);
      setVoxel(grid, cx + 1, beakY, headFrontZ + 1, orange);
      setVoxel(grid, cx, beakY, headFrontZ + 2, adjustBrightness(orange, 0.85));
      setVoxel(grid, cx + 1, beakY, headFrontZ + 2, adjustBrightness(orange, 0.85));
      // 足はオレンジ
      for (let dx = 0; dx < plan.legW; dx++) {
        for (let dz = 0; dz < plan.legD; dz++) {
          const lx1 = ctx.cx - plan.legSpacing - plan.legW + 1 + dx;
          const lx2 = ctx.cx + plan.legSpacing + dx;
          const lz = ctx.cz - Math.floor(plan.legD/2) + dz;
          setVoxel(grid, lx1, ctx.legY, lz, orange);
          setVoxel(grid, lx2, ctx.legY, lz, orange);
        }
      }
    },
  },
  hamster: {
    id: 'hamster', name: 'ハムスター',
    body: cp('#E8C39E'),
    belly: cp('#FFF8F0', 1.03, 0.92),
    noseColor: '#FFB0B0', blushColor: '#FF9999',
    eyeStyle: { width: 2, height: 3, pupilColor: '#1A1A1A', highlightCount: 2 },
    headW: 15, headH: 13, headD: 12,
    bodyW: 12, bodyH: 8, bodyD: 9,
    armW: 3, armH: 5, armD: 3,
    legW: 3, legH: 3, legD: 3,
    legSpacing: 3, headCornerR: 3, bodyCornerR: 1,
    eyeDx: 3, eyeY: 1,
    earType: 'round',
    earParams: { dx: 6, height: 3, width: 3, outerColor: '#E8C39E', innerColor: '#FFB6C1' },
    tailType: 'stub', tailLength: 1,
    bellyW: 8, bellyH: 5,
    specialFeatures: (grid, ctx) => {
      // ハムスター: 頬袋のふくらみ + 背中のライン
      const cheekColor = '#F0D8B8';
      const { headY, headX1, headX2, headZ1, cx, plan } = ctx;
      // 頬袋（頭の横にボリュームを追加）
      const cheekY = headY + Math.floor(plan.headH / 2) - 1;
      for (let dy = -1; dy <= 2; dy++) {
        for (let dz = 0; dz < 3; dz++) {
          setVoxel(grid, headX1 - 1, cheekY + dy, headZ1 + dz + 1, cheekColor);
          setVoxel(grid, headX2 + 1, cheekY + dy, headZ1 + dz + 1, cheekColor);
          if (dy >= 0 && dy <= 1) {
            setVoxel(grid, headX1 - 2, cheekY + dy, headZ1 + dz + 2, cheekColor);
            setVoxel(grid, headX2 + 2, cheekY + dy, headZ1 + dz + 2, cheekColor);
          }
        }
      }
      // 背中のライン（濃い色のストライプ）
      const lineColor = '#C4A070';
      for (let dy = headY + plan.headH - 3; dy > headY + 2; dy -= 1) {
        setVoxel(grid, cx, dy, headZ1 + plan.headD - 1, lineColor);
        setVoxel(grid, cx + 1, dy, headZ1 + plan.headD - 1, lineColor);
      }
    },
  },
};

// ============================================================
// メイン生成関数
// ============================================================

export function generateCubicAvatar(
  planId: string,
  options: {
    accessory?: 'none' | 'ribbon' | 'hat' | 'scarf' | 'crown';
    heldItem?: 'none' | 'honey' | 'yarn_ball' | 'flower' | 'star' | 'seed';
    expression?: 'happy' | 'neutral' | 'wink';
  } = {},
  _seed: number = 42,
): VoxelData {
  const P = PLANS[planId];
  if (!P) { console.error(`Unknown plan: ${planId}`); return createGrid(1, 1, 1); }

  // グリッドサイズ計算（余裕を持たせる）
  const earH = P.earType !== 'none' ? P.earParams.height : 0;
  const totalW = Math.max(P.headW, P.bodyW + P.armW * 2 + 2) + 12;
  const totalH = P.legH + P.bodyH + P.headH + earH + 6;
  const totalD = Math.max(P.headD, P.bodyD + P.tailLength) + 6;
  const grid = createGrid(totalW, totalH, totalD);

  const cx = Math.floor(totalW / 2);
  const cz = Math.floor(totalD / 2) - 1;

  // ===== 1. 足 =====
  const legY = 0;
  const lx1 = cx - P.legSpacing - P.legW + 1;
  const lx2 = cx + P.legSpacing;
  for (let dx = 0; dx < P.legW; dx++) {
    for (let dy = 0; dy < P.legH; dy++) {
      for (let dz = 0; dz < P.legD; dz++) {
        const c = dy === 0 ? P.body.shadow : P.body.base;
        setVoxel(grid, lx1 + dx, legY + dy, cz - Math.floor(P.legD/2) + dz, c);
        setVoxel(grid, lx2 + dx, legY + dy, cz - Math.floor(P.legD/2) + dz, c);
      }
    }
  }

  // ===== 2. 体 =====
  const bodyY = P.legH;
  const bx1 = cx - Math.floor(P.bodyW / 2);
  const bz1 = cz - Math.floor(P.bodyD / 2);
  fillRoundedBox3D(grid, bx1, bodyY, bz1, bx1 + P.bodyW - 1, bodyY + P.bodyH - 1, bz1 + P.bodyD - 1, P.body.base, P.bodyCornerR);
  // 体底面=影、体上面=ハイライト
  fillBox(grid, bx1 + 1, bodyY, bz1 + 1, bx1 + P.bodyW - 2, bodyY, bz1 + P.bodyD - 2, P.body.shadow);
  fillBox(grid, bx1 + 1, bodyY + P.bodyH - 1, bz1 + 1, bx1 + P.bodyW - 2, bodyY + P.bodyH - 1, bz1 + P.bodyD - 2, P.body.highlight);

  // お腹パネル（前面=+Z側）
  const bpx1 = cx - Math.floor(P.bellyW / 2);
  const bpy1 = bodyY + 1;
  const bodyFrontZ = bz1 + P.bodyD - 1;
  fillBox(grid, bpx1, bpy1, bodyFrontZ, bpx1 + P.bellyW - 1, bpy1 + P.bellyH - 1, bodyFrontZ, P.belly.base);
  // お腹にもグラデーション
  fillBox(grid, bpx1 + 1, bpy1 + P.bellyH - 1, bodyFrontZ, bpx1 + P.bellyW - 2, bpy1 + P.bellyH - 1, bodyFrontZ, P.belly.highlight);

  // ===== 3. 腕 =====
  const armY = bodyY + P.bodyH - P.armH;
  const armLX = bx1 - P.armW;
  const armRX = bx1 + P.bodyW;
  const armCZ = cz - Math.floor(P.armD / 2);
  for (let dx = 0; dx < P.armW; dx++) {
    for (let dy = 0; dy < P.armH; dy++) {
      for (let dz = 0; dz < P.armD; dz++) {
        const c = dy === 0 ? P.body.shadow : (dy === P.armH - 1 ? P.body.highlight : P.body.base);
        setVoxel(grid, armLX + dx, armY + dy, armCZ + dz, c);
        setVoxel(grid, armRX + dx, armY + dy, armCZ + dz, c);
      }
    }
  }

  // ===== 4. 頭 =====
  const headY = bodyY + P.bodyH;
  const hx1 = cx - Math.floor(P.headW / 2);
  const hz1 = cz - Math.floor(P.headD / 2);
  fillRoundedBox3D(grid, hx1, headY, hz1, hx1 + P.headW - 1, headY + P.headH - 1, hz1 + P.headD - 1, P.body.base, P.headCornerR);
  // 頭頂ハイライト
  fillBox(grid, hx1 + 2, headY + P.headH - 1, hz1 + 2, hx1 + P.headW - 3, headY + P.headH - 1, hz1 + P.headD - 3, P.body.highlight);

  // ===== 5. 特殊フィーチャー（パターン、パッチ等） =====
  const drawCtx: DrawContext = {
    cx, cz, headY, bodyY, legY,
    headX1: hx1, headX2: hx1 + P.headW - 1,
    headZ1: hz1, headFrontZ: hz1 + P.headD - 1,
    bodyX1: bx1, bodyZ1: bz1, bodyFrontZ: bz1 + P.bodyD - 1,
    armLX, armRX, armY, plan: P,
  };
  if (P.specialFeatures) {
    P.specialFeatures(grid, drawCtx);
  }

  // ===== 6. 顔（+Z方向=前面=カメラ側） =====
  const faceZ = hz1 + P.headD - 1;
  const eyeCY = headY + Math.floor(P.headH / 2) + P.eyeY;

  // 目
  drawDetailedEye(grid, cx - P.eyeDx, eyeCY, faceZ, P.eyeStyle);
  if (options.expression === 'wink') {
    // ウィンク: 右目を横線に
    setVoxel(grid, cx + P.eyeDx, eyeCY, faceZ, '#1A1A1A');
    setVoxel(grid, cx + P.eyeDx + 1, eyeCY, faceZ, '#1A1A1A');
    setVoxel(grid, cx + P.eyeDx - 1, eyeCY, faceZ, '#1A1A1A');
  } else {
    drawDetailedEye(grid, cx + P.eyeDx + 1, eyeCY, faceZ, P.eyeStyle);
  }

  // 鼻（+Z方向に突出）
  drawNose3D(grid, cx, eyeCY - 2, faceZ, P.noseColor, 2);

  // ほっぺ
  drawBlush(grid, cx, eyeCY - 2, faceZ, P.eyeDx + 1, P.blushColor, 1);

  // 口
  const mouthStyle = (P.id === 'dog') ? 'tongue' : (options.expression === 'happy' ? 'smile' : 'simple');
  drawMouth(grid, cx, eyeCY - 4, faceZ, mouthStyle as any, 3);

  // ===== 7. 耳 =====
  const earTopY = headY + P.headH;
  if (P.earType === 'round') {
    drawRoundEars(grid, cx, earTopY, cz, P.earParams.dx, Math.floor(P.earParams.height / 2), P.earParams.outerColor, P.earParams.innerColor);
  } else if (P.earType === 'pointed') {
    drawPointedEars(grid, cx, earTopY, cz, Math.floor(P.headW / 2), P.earParams.height, P.earParams.width, P.earParams.outerColor, P.earParams.innerColor);
  } else if (P.earType === 'long') {
    drawLongEars(grid, cx, earTopY, cz, P.earParams.dx, P.earParams.width, P.earParams.height, P.earParams.outerColor, P.earParams.innerColor);
  } else if (P.earType === 'floppy') {
    drawFloppyEars(grid, hx1, hx1 + P.headW - 1, headY + P.headH - 2, cz, P.earParams.width, P.earParams.height, P.earParams.outerColor, P.earParams.innerColor);
  }

  // ===== 8. しっぽ（-Z方向=背面） =====
  const tailZ = bz1 - 1;
  const tailY = bodyY + Math.floor(P.bodyH / 2);
  const tailC = P.tailColor ?? P.body.base;
  if (P.tailType === 'stub') {
    for (let i = 0; i < P.tailLength; i++) {
      setVoxel(grid, cx, tailY, tailZ - i, tailC);
      setVoxel(grid, cx + 1, tailY, tailZ - i, tailC);
    }
  } else if (P.tailType === 'long') {
    for (let i = 0; i < P.tailLength; i++) {
      const ty = tailY + Math.round(Math.sin(i * 0.4) * 1.5);
      setVoxel(grid, cx, ty, tailZ - i, tailC);
      setVoxel(grid, cx + 1, ty, tailZ - i, tailC);
      setVoxel(grid, cx, ty + 1, tailZ - i, tailC);
    }
  } else if (P.tailType === 'fluffy') {
    for (let i = 0; i < P.tailLength; i++) {
      const w = Math.min(2, Math.floor(i * 0.5) + 1);
      const c = i >= P.tailLength - 2 ? (P.tailTipColor ?? tailC) : tailC;
      for (let dx = -w; dx <= w; dx++) {
        for (let dy = -w; dy <= w; dy++) {
          if (dx * dx + dy * dy <= w * w + 1) {
            setVoxel(grid, cx + dx, tailY + dy, tailZ - i, c);
          }
        }
      }
    }
  }

  // ===== 9. 持ち物 =====
  const itemX = armRX + P.armW + 1;
  const itemY = armY + 2;
  if (options.heldItem === 'yarn_ball') {
    drawYarnBall(grid, itemX + 2, itemY + 2, cz, 3, '#5BC0EB');
  } else if (options.heldItem === 'seed') {
    drawSunflowerSeed(grid, itemX, itemY, cz);
  } else if (options.heldItem === 'honey') {
    // ハチミツ壺（高精度）
    fillRoundedBox3D(grid, itemX, itemY, cz - 2, itemX + 3, itemY + 4, cz + 1, '#FFD54F', 1);
    fillBox(grid, itemX, itemY + 4, cz - 2, itemX + 3, itemY + 4, cz + 1, '#8B4513');
    fillBox(grid, itemX + 1, itemY + 5, cz - 1, itemX + 2, itemY + 5, cz, '#6B3E1E');
    // ハチミツたれ
    setVoxel(grid, itemX + 1, itemY + 3, cz - 2, '#FFAB00');
  } else if (options.heldItem === 'flower') {
    // 花束
    for (let dy = 0; dy < 4; dy++) setVoxel(grid, itemX + 1, itemY + dy, cz, '#228B22');
    setVoxel(grid, itemX + 1, itemY + 4, cz, '#FFD700');
    setVoxel(grid, itemX, itemY + 4, cz, '#FF69B4');
    setVoxel(grid, itemX + 2, itemY + 4, cz, '#FF69B4');
    setVoxel(grid, itemX + 1, itemY + 5, cz, '#FF69B4');
    setVoxel(grid, itemX, itemY + 5, cz, '#FF96B4');
    setVoxel(grid, itemX + 2, itemY + 5, cz, '#FF96B4');
  } else if (options.heldItem === 'star') {
    setVoxel(grid, itemX + 1, itemY + 3, cz, '#FFFFFF');
    setVoxel(grid, itemX, itemY + 2, cz, '#FFD700');
    setVoxel(grid, itemX + 2, itemY + 2, cz, '#FFD700');
    setVoxel(grid, itemX + 1, itemY + 4, cz, '#FFD700');
    setVoxel(grid, itemX + 1, itemY + 1, cz, '#FFD700');
    setVoxel(grid, itemX - 1, itemY + 2, cz, '#FFD700');
    setVoxel(grid, itemX + 3, itemY + 2, cz, '#FFD700');
  }

  return grid;
}

// ============================================================
// プリセットショートカット（参考画像の持ち物に合わせる）
// ============================================================
export function generateBearAvatar(seed: number = 42): VoxelData {
  return generateCubicAvatar('bear', { expression: 'happy', heldItem: 'honey' }, seed);
}
export function generateCatAvatar(seed: number = 100): VoxelData {
  return generateCubicAvatar('cat', { expression: 'happy', heldItem: 'yarn_ball' }, seed);
}
export function generateRabbitAvatar(seed: number = 200): VoxelData {
  return generateCubicAvatar('rabbit', { expression: 'happy' }, seed);
}
export function generateDogAvatar(seed: number = 300): VoxelData {
  return generateCubicAvatar('dog', { expression: 'happy' }, seed);
}
export function generatePandaAvatar(seed: number = 400): VoxelData {
  return generateCubicAvatar('panda', { expression: 'happy' }, seed);
}
export function generateFoxAvatar(seed: number = 500): VoxelData {
  return generateCubicAvatar('fox', { expression: 'wink' }, seed);
}
export function generatePenguinAvatar(seed: number = 600): VoxelData {
  return generateCubicAvatar('penguin', { expression: 'happy' }, seed);
}
export function generateHamsterAvatar(seed: number = 700): VoxelData {
  return generateCubicAvatar('hamster', { expression: 'happy', heldItem: 'seed' }, seed);
}

// ============================================================
// 旧API互換のexport
// ============================================================
export { type AvatarPlanV5 as CubicBodyPlan };
export const CUBIC_PLANS = PLANS;
