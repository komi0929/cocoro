/**
 * VoxelAvatars v3 — 完全データ駆動型アバター量産システム
 *
 * ★ 核心コンセプト:
 * 「キツネのアバターを作って」→ AnimalBodyPlan にキツネの形状パラメータを定義
 * → generateAvatar(plan) → 完璧な3Dモデルが即出力
 *
 * 全ての動物は「ボディプラン」（体の設計図）で定義される:
 * - 頭の大きさ・形状（球体/楕円体の比率）
 * - 耳の形状パラメータ（位置/高さ/幅/角度）
 * - 顔パーツの位置・サイズ
 * - 胴体の比率
 * - 手足の長さ・太さ
 * - しっぽの形状
 * - カラーパレット
 *
 * 新しい動物を追加する手順:
 * 1. BODY_PLANS に新しいエントリを追加（JSON定義のみ）
 * 2. 以上。コード変更不要。
 */

import { VoxelData, createGrid, setVoxel } from './VoxelGrid';
import { adjustBrightness } from './VoxelDesign';

// ============================================================
// ボディプラン定義
// ============================================================

export interface AnimalBodyPlan {
  /** 種族ID（一意） */
  id: string;
  /** 表示名 */
  name: string;
  /** メインカラーパレット（5色: base, dark, light, darker, lighter） */
  mainColors: [string, string, string, string, string];
  /** お腹/内側カラー */
  bellyColors: [string, string, string];
  /** 鼻の色 */
  noseColor: string;

  /** 頭: 半径 [rx, ry, rz] */
  head: { rx: number; ry: number; rz: number };
  /** マズル（口周り）: 相対位置と半径 */
  muzzle: { dy: number; rx: number; ry: number; rz: number };
  /** 目: 相対X位置、サイズ(1=小, 2=中, 3=大) */
  eyes: { dx: number; dy: number; size: 1 | 2 | 3 };
  /** 耳 */
  ears: {
    shape: 'round' | 'pointed' | 'long' | 'floppy' | 'round-small';
    dx: number; /** 中心からの横距離 */
    height: number; /** 耳の高さ */
    width: number; /** 耳の幅 */
  };
  /** 胴体: 半径 */
  body: { rx: number; ry: number; rz: number };
  /** 腕: 半径と横位置 */
  arms: { rx: number; ry: number; rz: number; dx: number };
  /** 足: 半径と横位置 */
  legs: { rx: number; ry: number; rz: number; dx: number };
  /** しっぽ */
  tail: {
    shape: 'tiny' | 'medium' | 'long' | 'fluffy' | 'curly';
    length: number;
  };
  /** ほっぺの色（デフォルト: ピンク） */
  blushColor?: string;
  /** 特殊模様 */
  markings?: {
    type: 'panda-eyes' | 'raccoon-mask' | 'tabby-stripes' | 'spots' | 'none';
    color?: string;
  };
}

// ============================================================
// 登録済みボディプラン
// ============================================================

export const BODY_PLANS: Record<string, AnimalBodyPlan> = {
  bear: {
    id: 'bear', name: 'クマ',
    mainColors: ['#8B5A36', '#7A4E2E', '#9C663E', '#6B4226', '#AD7246'],
    bellyColors: ['#D4B892', '#C4A882', '#E4C8A2'],
    noseColor: '#2D1B0E',
    head: { rx: 8, ry: 8, rz: 7 },
    muzzle: { dy: -2, rx: 3, ry: 2, rz: 2 },
    eyes: { dx: 4, dy: 1, size: 2 },
    ears: { shape: 'round', dx: 6, height: 3, width: 2.5 },
    body: { rx: 7, ry: 7, rz: 6 },
    arms: { rx: 2.5, ry: 5, rz: 2.5, dx: 8 },
    legs: { rx: 3, ry: 4, rz: 3, dx: 4 },
    tail: { shape: 'tiny', length: 2 },
  },
  cat: {
    id: 'cat', name: 'ネコ',
    mainColors: ['#FF8C00', '#E67300', '#FFA500', '#CC6600', '#FFB347'],
    bellyColors: ['#FFF8DC', '#FFEFD5', '#FFE4C4'],
    noseColor: '#FF69B4',
    head: { rx: 7.5, ry: 7, rz: 6.5 },
    muzzle: { dy: -2, rx: 2.5, ry: 1.5, rz: 2 },
    eyes: { dx: 4, dy: 1, size: 3 },
    ears: { shape: 'pointed', dx: 5, height: 6, width: 3 },
    body: { rx: 6, ry: 6.5, rz: 5.5 },
    arms: { rx: 2, ry: 4.5, rz: 2, dx: 7 },
    legs: { rx: 2.5, ry: 4, rz: 2.5, dx: 3.5 },
    tail: { shape: 'long', length: 8 },
  },
  rabbit: {
    id: 'rabbit', name: 'ウサギ',
    mainColors: ['#F5F5F5', '#E0E0E0', '#FAFAFA', '#D5D5D5', '#FFFFFF'],
    bellyColors: ['#FFFFFF', '#FFF5F5', '#FFEBEE'],
    noseColor: '#FF69B4',
    head: { rx: 7, ry: 7.5, rz: 6.5 },
    muzzle: { dy: -2, rx: 2.5, ry: 2, rz: 2 },
    eyes: { dx: 3.5, dy: 1, size: 3 },
    ears: { shape: 'long', dx: 4, height: 10, width: 1.5 },
    body: { rx: 6, ry: 6, rz: 5 },
    arms: { rx: 2, ry: 4, rz: 2, dx: 7 },
    legs: { rx: 3, ry: 5, rz: 3, dx: 3.5 },
    tail: { shape: 'tiny', length: 2 },
    blushColor: '#FFB6C1',
  },
  dog: {
    id: 'dog', name: 'イヌ',
    mainColors: ['#C49A6C', '#A0784C', '#D4AA7C', '#8B6544', '#E0BA8C'],
    bellyColors: ['#F5E6D3', '#FFE8D0', '#FFF0E0'],
    noseColor: '#2D1B0E',
    head: { rx: 7.5, ry: 7, rz: 7 },
    muzzle: { dy: -2, rx: 3, ry: 2, rz: 3 },
    eyes: { dx: 3.5, dy: 1, size: 2 },
    ears: { shape: 'floppy', dx: 7, height: 5, width: 2 },
    body: { rx: 6.5, ry: 7, rz: 6 },
    arms: { rx: 2.5, ry: 5, rz: 2.5, dx: 7.5 },
    legs: { rx: 3, ry: 4.5, rz: 3, dx: 4 },
    tail: { shape: 'curly', length: 5 },
  },
  panda: {
    id: 'panda', name: 'パンダ',
    mainColors: ['#F5F5F5', '#E0E0E0', '#FAFAFA', '#ECECEC', '#FFFFFF'],
    bellyColors: ['#FFFFFF', '#FAFAFA', '#F5F5F5'],
    noseColor: '#1A1A1A',
    head: { rx: 8, ry: 8, rz: 7 },
    muzzle: { dy: -2, rx: 3, ry: 2, rz: 2 },
    eyes: { dx: 4, dy: 1, size: 2 },
    ears: { shape: 'round', dx: 6, height: 3, width: 2.5 },
    body: { rx: 7, ry: 7, rz: 6 },
    arms: { rx: 2.5, ry: 5, rz: 2.5, dx: 8 },
    legs: { rx: 3, ry: 4, rz: 3, dx: 4 },
    tail: { shape: 'tiny', length: 1 },
    markings: { type: 'panda-eyes', color: '#1A1A1A' },
  },
  fox: {
    id: 'fox', name: 'キツネ',
    mainColors: ['#D4652B', '#C05520', '#E47538', '#AA4518', '#F08548'],
    bellyColors: ['#FFF8DC', '#FFEFD5', '#FFE4C4'],
    noseColor: '#1A1A1A',
    head: { rx: 7, ry: 6.5, rz: 6 },
    muzzle: { dy: -2, rx: 3.5, ry: 2, rz: 3 },
    eyes: { dx: 3.5, dy: 2, size: 2 },
    ears: { shape: 'pointed', dx: 5, height: 7, width: 3.5 },
    body: { rx: 5.5, ry: 6, rz: 5 },
    arms: { rx: 2, ry: 4.5, rz: 2, dx: 6.5 },
    legs: { rx: 2, ry: 4.5, rz: 2, dx: 3 },
    tail: { shape: 'fluffy', length: 8 },
  },
  penguin: {
    id: 'penguin', name: 'ペンギン',
    mainColors: ['#1A1A2E', '#101020', '#2A2A3E', '#0A0A18', '#3A3A4E'],
    bellyColors: ['#FFFFFF', '#F5F5F5', '#FAFAFA'],
    noseColor: '#FF8C00',
    head: { rx: 6.5, ry: 6.5, rz: 6 },
    muzzle: { dy: -1, rx: 2, ry: 1.5, rz: 3 },
    eyes: { dx: 3, dy: 1, size: 2 },
    ears: { shape: 'round-small', dx: 5, height: 1, width: 1 },
    body: { rx: 6, ry: 7, rz: 5.5 },
    arms: { rx: 1.5, ry: 5, rz: 2, dx: 7 },
    legs: { rx: 2.5, ry: 2.5, rz: 3, dx: 3 },
    tail: { shape: 'tiny', length: 1 },
  },
  hamster: {
    id: 'hamster', name: 'ハムスター',
    mainColors: ['#E8C39E', '#D4B08C', '#F0D0AE', '#C09878', '#F8E0BE'],
    bellyColors: ['#FFFFFF', '#FFF8F0', '#FFF0E0'],
    noseColor: '#FF69B4',
    head: { rx: 8.5, ry: 7.5, rz: 7 },
    muzzle: { dy: -2, rx: 3.5, ry: 2.5, rz: 2.5 },
    eyes: { dx: 3.5, dy: 1, size: 3 },
    ears: { shape: 'round-small', dx: 7, height: 2, width: 2 },
    body: { rx: 7, ry: 5.5, rz: 6 },
    arms: { rx: 2, ry: 3, rz: 2, dx: 7.5 },
    legs: { rx: 2, ry: 2, rz: 2, dx: 3.5 },
    tail: { shape: 'tiny', length: 1 },
  },
};

// ============================================================
// アクセサリ・持ち物
// ============================================================

export interface AvatarOptions {
  /** アクセサリ */
  accessory?: 'none' | 'ribbon' | 'hat' | 'scarf' | 'crown' | 'glasses';
  /** 持ち物 */
  heldItem?: 'none' | 'honey' | 'fish' | 'flower' | 'star' | 'heart' | 'mushroom';
  /** 表情 */
  expression?: 'happy' | 'neutral' | 'excited' | 'sleepy' | 'wink';
  /** カスタムカラー上書き */
  customMainColor?: string;
  customBellyColor?: string;
}

// ============================================================
// 汎用楕円体描画
// ============================================================

function fillBodyPart(
  grid: VoxelData, cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  colors: string[], seed: number,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1) {
          const ci = Math.abs((x * 3 + y * 7 + z * 11 + seed) % colors.length);
          setVoxel(grid, x, y, z, colors[ci]!);
        }
      }
    }
  }
}

// ============================================================
// メイン生成関数
// ============================================================

export function generateAvatar(planId: string, options: AvatarOptions = {}, seed: number = 42): VoxelData {
  const plan = BODY_PLANS[planId];
  if (!plan) {
    console.error(`Unknown body plan: ${planId}. Available: ${Object.keys(BODY_PLANS).join(', ')}`);
    return createGrid(1, 1, 1);
  }

  const grid = createGrid(36, 48, 28);
  const cx = 18, cz = 14;

  // カスタムカラー適用
  const main = options.customMainColor
    ? [options.customMainColor, adjustBrightness(options.customMainColor, 0.88),
       adjustBrightness(options.customMainColor, 1.12),
       adjustBrightness(options.customMainColor, 0.76),
       adjustBrightness(options.customMainColor, 1.24)]
    : [...plan.mainColors];
  const belly = options.customBellyColor
    ? [options.customBellyColor, adjustBrightness(options.customBellyColor, 0.95),
       adjustBrightness(options.customBellyColor, 1.05)]
    : [...plan.bellyColors];

  const B = plan;
  const BLUSH = B.blushColor ?? '#FFB6C1';
  const EYE = '#1A1A1A';

  // ===== 1. 足 =====
  const legY = B.legs.ry;
  fillBodyPart(grid, cx - B.legs.dx, legY, cz, B.legs.rx, B.legs.ry, B.legs.rz, main, seed + 100);
  fillBodyPart(grid, cx + B.legs.dx, legY, cz, B.legs.rx, B.legs.ry, B.legs.rz, main, seed + 200);
  // 足裏
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx * dx + dz * dz <= 2) {
        setVoxel(grid, cx - B.legs.dx + dx, 0, cz + dz, belly[0]!);
        setVoxel(grid, cx + B.legs.dx + dx, 0, cz + dz, belly[0]!);
      }
    }
  }

  // ===== 2. 胴体 =====
  const bodyY = B.legs.ry * 2 + B.body.ry - 2;
  fillBodyPart(grid, cx, bodyY, cz, B.body.rx, B.body.ry, B.body.rz, main, seed + 300);
  // お腹
  for (let y = Math.floor(bodyY - B.body.ry * 0.7); y <= Math.ceil(bodyY + B.body.ry * 0.5); y++) {
    for (let z = Math.floor(cz - B.body.rz); z <= Math.floor(cz - B.body.rz * 0.3); z++) {
      for (let x = Math.floor(cx - B.body.rx * 0.55); x <= Math.ceil(cx + B.body.rx * 0.55); x++) {
        const dx = (x - cx) / (B.body.rx * 0.6), dy = (y - bodyY) / B.body.ry, dz = (z - cz) / B.body.rz;
        if (dx * dx + dy * dy + dz * dz <= 0.8) {
          setVoxel(grid, x, y, z, belly[Math.abs(x + y + z + seed) % belly.length]!);
        }
      }
    }
  }

  // ===== 3. 腕 =====
  const armY = bodyY + 2;
  fillBodyPart(grid, cx - B.arms.dx, armY, cz, B.arms.rx, B.arms.ry, B.arms.rz, main, seed + 400);
  fillBodyPart(grid, cx + B.arms.dx, armY, cz, B.arms.rx, B.arms.ry, B.arms.rz, main, seed + 500);

  // ===== 4. 頭 =====
  const headY = bodyY + B.body.ry + B.head.ry - 1;
  fillBodyPart(grid, cx, headY, cz, B.head.rx, B.head.ry, B.head.rz, main, seed + 600);
  // マズル
  const muzzleZ = cz - B.head.rz + 1;
  fillBodyPart(grid, cx, headY + B.muzzle.dy, muzzleZ, B.muzzle.rx, B.muzzle.ry, B.muzzle.rz, belly, seed + 650);

  // パンダ目パッチ
  if (B.markings?.type === 'panda-eyes') {
    const mc = B.markings.color ?? '#1A1A1A';
    for (let dy = -1; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        setVoxel(grid, cx - B.eyes.dx + dx, headY + B.eyes.dy + dy, cz - B.head.rz + 2, mc);
        setVoxel(grid, cx + B.eyes.dx + dx, headY + B.eyes.dy + dy, cz - B.head.rz + 2, mc);
      }
    }
  }

  // ===== 5. 顔パーツ =====
  const faceZ = cz - B.head.rz;
  const eyeY = headY + B.eyes.dy;

  // 目
  if (B.eyes.size >= 2) {
    for (let dy = 0; dy < B.eyes.size; dy++) {
      for (let dx = 0; dx < Math.min(B.eyes.size, 2); dx++) {
        setVoxel(grid, cx - B.eyes.dx + dx, eyeY + dy, faceZ, EYE);
        setVoxel(grid, cx - B.eyes.dx + dx, eyeY + dy, faceZ + 1, EYE);
        setVoxel(grid, cx + B.eyes.dx - 1 + dx, eyeY + dy, faceZ, EYE);
        setVoxel(grid, cx + B.eyes.dx - 1 + dx, eyeY + dy, faceZ + 1, EYE);
      }
    }
    // ハイライト（目の左上）
    setVoxel(grid, cx - B.eyes.dx, eyeY + B.eyes.size - 1, faceZ, '#FFFFFF');
    setVoxel(grid, cx + B.eyes.dx - 1, eyeY + B.eyes.size - 1, faceZ, '#FFFFFF');
  } else {
    setVoxel(grid, cx - B.eyes.dx, eyeY, faceZ, EYE);
    setVoxel(grid, cx + B.eyes.dx, eyeY, faceZ, EYE);
  }

  // ウィンク
  if (options.expression === 'wink') {
    // 右目を線にする
    for (let dx = 0; dx < Math.min(B.eyes.size, 2); dx++) {
      for (let dy = 0; dy < B.eyes.size; dy++) {
        setVoxel(grid, cx + B.eyes.dx - 1 + dx, eyeY + dy, faceZ, main[0]!);
        setVoxel(grid, cx + B.eyes.dx - 1 + dx, eyeY + dy, faceZ + 1, main[0]!);
      }
    }
    setVoxel(grid, cx + B.eyes.dx - 1, eyeY + 1, faceZ, EYE);
    setVoxel(grid, cx + B.eyes.dx, eyeY + 1, faceZ, EYE);
  }

  // 鼻
  for (let dx = -1; dx <= 0; dx++) {
    setVoxel(grid, cx + dx, headY + B.muzzle.dy, faceZ, B.noseColor);
    setVoxel(grid, cx + dx, headY + B.muzzle.dy, faceZ + 1, B.noseColor);
  }

  // ほっぺた
  const blushY = headY + B.muzzle.dy;
  for (let dy = 0; dy <= 1; dy++) {
    setVoxel(grid, cx - B.eyes.dx - 2, blushY + dy, faceZ, BLUSH);
    setVoxel(grid, cx - B.eyes.dx - 3, blushY + dy, faceZ, BLUSH);
    setVoxel(grid, cx + B.eyes.dx + 2, blushY + dy, faceZ, BLUSH);
    setVoxel(grid, cx + B.eyes.dx + 3, blushY + dy, faceZ, BLUSH);
  }

  // 口
  const expr = options.expression ?? 'happy';
  const mouthY = headY + B.muzzle.dy - 2;
  if (expr === 'happy' || expr === 'excited' || expr === 'wink') {
    for (let dx = -2; dx <= 2; dx++) setVoxel(grid, cx + dx, mouthY, faceZ, '#555555');
    setVoxel(grid, cx - 3, mouthY + 1, faceZ, '#555555');
    setVoxel(grid, cx + 3, mouthY + 1, faceZ, '#555555');
  } else if (expr === 'sleepy') {
    for (let dx = -1; dx <= 1; dx++) setVoxel(grid, cx + dx, mouthY, faceZ, '#888888');
  } else {
    for (let dx = -2; dx <= 2; dx++) setVoxel(grid, cx + dx, mouthY, faceZ, '#777777');
  }

  // ===== 6. 耳 =====
  const earBaseY = headY + B.head.ry;
  if (B.ears.shape === 'round' || B.ears.shape === 'round-small') {
    const r = B.ears.width;
    const h = B.ears.height;
    for (let dy = 0; dy < h; dy++) {
      const rr = r * (1 - dy / (h * 2));
      for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) {
        for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) {
          if (dx * dx + dz * dz <= rr * rr) {
            setVoxel(grid, cx - B.ears.dx + dx, earBaseY + dy, cz + dz, main[0]!);
            setVoxel(grid, cx + B.ears.dx + dx, earBaseY + dy, cz + dz, main[0]!);
          }
        }
      }
    }
    if (B.ears.shape === 'round') {
      setVoxel(grid, cx - B.ears.dx, earBaseY + 1, cz - 2, BLUSH);
      setVoxel(grid, cx + B.ears.dx, earBaseY + 1, cz - 2, BLUSH);
    }
  } else if (B.ears.shape === 'pointed') {
    for (let h = 0; h < B.ears.height; h++) {
      const w = Math.max(0, Math.round(B.ears.width * (1 - h / B.ears.height)));
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -w; dx <= w; dx++) {
          setVoxel(grid, cx - B.ears.dx + dx, earBaseY + h, cz + dz, main[0]!);
          setVoxel(grid, cx + B.ears.dx + dx, earBaseY + h, cz + dz, main[0]!);
        }
      }
    }
    // 内側ピンク
    for (let h = 1; h < B.ears.height - 1; h++) {
      const w = Math.max(0, Math.round((B.ears.width - 1) * (1 - h / B.ears.height)));
      for (let dx = -w; dx <= w; dx++) {
        setVoxel(grid, cx - B.ears.dx + dx, earBaseY + h, cz - 1, BLUSH);
        setVoxel(grid, cx + B.ears.dx + dx, earBaseY + h, cz - 1, BLUSH);
      }
    }
  } else if (B.ears.shape === 'long') {
    for (let h = 0; h < B.ears.height; h++) {
      const w = h < B.ears.height - 2 ? B.ears.width : B.ears.width * 0.7;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) {
          if (dx * dx <= w * w + 0.5) {
            setVoxel(grid, cx - B.ears.dx + dx, earBaseY + h, cz + dz, main[0]!);
            setVoxel(grid, cx + B.ears.dx + dx, earBaseY + h, cz + dz, main[0]!);
          }
        }
      }
      setVoxel(grid, cx - B.ears.dx, earBaseY + h, cz - 1, BLUSH);
      setVoxel(grid, cx + B.ears.dx, earBaseY + h, cz - 1, BLUSH);
    }
  } else if (B.ears.shape === 'floppy') {
    for (let h = 0; h < 3; h++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          setVoxel(grid, cx - B.ears.dx + dx, earBaseY - h, cz + dz, main[0]!);
          setVoxel(grid, cx + B.ears.dx + dx, earBaseY - h, cz + dz, main[0]!);
        }
      }
    }
    for (let h = 0; h < B.ears.height; h++) {
      setVoxel(grid, cx - B.ears.dx - 1, earBaseY - 1 - h, cz, main[1]!);
      setVoxel(grid, cx - B.ears.dx - 1, earBaseY - 1 - h, cz - 1, main[1]!);
      setVoxel(grid, cx + B.ears.dx + 1, earBaseY - 1 - h, cz, main[1]!);
      setVoxel(grid, cx + B.ears.dx + 1, earBaseY - 1 - h, cz - 1, main[1]!);
    }
  }

  // ===== 7. しっぽ =====
  const tailBaseY = bodyY;
  const tailBaseZ = cz + B.body.rz;
  if (B.tail.shape === 'tiny') {
    fillBodyPart(grid, cx, tailBaseY, tailBaseZ + 1, 2, 2, 2, main, seed + 900);
  } else if (B.tail.shape === 'long') {
    for (let s = 0; s < B.tail.length; s++) {
      const tx = Math.round(Math.sin(s * 0.5) * 1.5);
      setVoxel(grid, cx + tx, tailBaseY + Math.floor(s * 0.5), tailBaseZ + s, main[0]!);
      setVoxel(grid, cx + tx + 1, tailBaseY + Math.floor(s * 0.5), tailBaseZ + s, main[2]!);
    }
  } else if (B.tail.shape === 'fluffy') {
    for (let s = 0; s < B.tail.length; s++) {
      const r = 1.5 + Math.sin(s * 0.5) * 0.5;
      const tx = Math.round(Math.sin(s * 0.3) * 2);
      fillBodyPart(grid, cx + tx, tailBaseY + Math.floor(s * 0.4), tailBaseZ + s, r, r, r, main, seed + 900 + s);
    }
    // 先端白
    const tipZ = tailBaseZ + B.tail.length - 1;
    const tipX = Math.round(Math.sin((B.tail.length - 1) * 0.3) * 2);
    fillBodyPart(grid, cx + tipX, tailBaseY + Math.floor((B.tail.length - 1) * 0.4), tipZ, 1.5, 1.5, 1.5, belly, seed + 950);
  } else if (B.tail.shape === 'curly') {
    for (let s = 0; s < B.tail.length; s++) {
      const a = (s / B.tail.length) * Math.PI * 1.5;
      const tx = Math.round(Math.cos(a) * 2);
      const ty = Math.round(Math.sin(a) * 2);
      setVoxel(grid, cx + tx, tailBaseY + ty + 2, tailBaseZ + 1 + Math.floor(s * 0.3), main[0]!);
    }
  } else {
    for (let s = 0; s < B.tail.length; s++) {
      setVoxel(grid, cx, tailBaseY + s, tailBaseZ + 1, main[0]!);
    }
  }

  // ===== 8. アクセサリ =====
  const accY = headY + B.head.ry;
  if (options.accessory === 'ribbon') {
    for (let dx = -1; dx <= 1; dx++) {
      setVoxel(grid, cx + dx, accY + 1, cz - 2, '#FF1493');
      setVoxel(grid, cx + dx, accY + 2, cz - 2, '#FF1493');
    }
    for (let dx = 2; dx <= 4; dx++) {
      setVoxel(grid, cx - dx, accY + 1, cz - 2, '#FF69B4');
      setVoxel(grid, cx + dx, accY + 1, cz - 2, '#FF69B4');
    }
  } else if (options.accessory === 'hat') {
    for (let dz = -4; dz <= 4; dz++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dz * dz <= 18) setVoxel(grid, cx + dx, accY, cz + dz, '#8B4513');
      }
    }
    for (let dy = 1; dy <= 4; dy++) {
      const r = dy < 3 ? 3 : 2;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dz * dz <= r * r) setVoxel(grid, cx + dx, accY + dy, cz + dz, '#8B4513');
        }
      }
    }
  } else if (options.accessory === 'crown') {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dz * dz <= 10) setVoxel(grid, cx + dx, accY, cz + dz, '#FFD700');
      }
    }
    // 尖り
    for (const dx of [-2, 0, 2]) {
      setVoxel(grid, cx + dx, accY + 1, cz, '#FFD700');
      setVoxel(grid, cx + dx, accY + 2, cz, '#FFD700');
    }
    // 宝石
    setVoxel(grid, cx, accY + 1, cz - 3, '#FF0000');
  } else if (options.accessory === 'scarf') {
    for (let angle = 0; angle < 24; angle++) {
      const a = (angle / 24) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(a) * (B.body.rx + 1));
      const sz = Math.round(cz + Math.sin(a) * (B.body.rz + 1));
      const scarfY = bodyY + B.body.ry - 1;
      setVoxel(grid, sx, scarfY, sz, '#FF4444');
      setVoxel(grid, sx, scarfY + 1, sz, '#CC3333');
    }
  } else if (options.accessory === 'glasses') {
    // 左レンズ
    for (let dy = 0; dy <= 2; dy++) {
      setVoxel(grid, cx - B.eyes.dx - 1, eyeY + dy, faceZ - 1, '#333333');
      setVoxel(grid, cx - B.eyes.dx + 2, eyeY + dy, faceZ - 1, '#333333');
    }
    setVoxel(grid, cx - B.eyes.dx - 1, eyeY + 2, faceZ - 1, '#333333');
    setVoxel(grid, cx - B.eyes.dx + 2, eyeY + 2, faceZ - 1, '#333333');
    // 右レンズ
    for (let dy = 0; dy <= 2; dy++) {
      setVoxel(grid, cx + B.eyes.dx - 2, eyeY + dy, faceZ - 1, '#333333');
      setVoxel(grid, cx + B.eyes.dx + 1, eyeY + dy, faceZ - 1, '#333333');
    }
    // ブリッジ
    setVoxel(grid, cx, eyeY + 1, faceZ - 1, '#333333');
    setVoxel(grid, cx - 1, eyeY + 1, faceZ - 1, '#333333');
  }

  // ===== 9. 持ち物 =====
  const itemX = cx + Math.round(B.arms.dx) + 2;
  const itemY = armY;
  if (options.heldItem === 'honey') {
    for (let dy = 0; dy < 5; dy++) {
      const r = dy === 0 || dy === 4 ? 1.5 : 2.5;
      for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dz * dz <= r * r) {
            setVoxel(grid, itemX + dx, itemY + dy, cz + dz, dy >= 4 ? '#6B3E1E' : '#FFD54F');
          }
        }
      }
    }
  } else if (options.heldItem === 'flower') {
    for (let dy = 0; dy < 3; dy++) setVoxel(grid, itemX, itemY + dy, cz, '#228B22');
    setVoxel(grid, itemX, itemY + 3, cz, '#FFD700');
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      setVoxel(grid, itemX + dx!, itemY + 3, cz + dz!, '#FF69B4');
    }
  } else if (options.heldItem === 'star') {
    setVoxel(grid, itemX, itemY + 2, cz, '#FFFFFF');
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      setVoxel(grid, itemX + dx!, itemY + 2 + dy!, cz, '#FFD700');
    }
  } else if (options.heldItem === 'heart') {
    setVoxel(grid, itemX - 1, itemY + 2, cz, '#FF1493');
    setVoxel(grid, itemX + 1, itemY + 2, cz, '#FF1493');
    setVoxel(grid, itemX - 1, itemY + 3, cz, '#FF1493');
    setVoxel(grid, itemX, itemY + 3, cz, '#FF1493');
    setVoxel(grid, itemX + 1, itemY + 3, cz, '#FF1493');
    setVoxel(grid, itemX, itemY + 1, cz, '#FF1493');
  } else if (options.heldItem === 'fish') {
    for (let dx = -1; dx <= 2; dx++) {
      setVoxel(grid, itemX + dx, itemY + 1, cz, '#87CEEB');
    }
    setVoxel(grid, itemX + 3, itemY + 2, cz, '#87CEEB');
    setVoxel(grid, itemX + 3, itemY, cz, '#87CEEB');
    setVoxel(grid, itemX - 1, itemY + 1, cz - 1, '#1A1A1A');
  }

  return grid;
}

// ============================================================
// 便利プリセット
// ============================================================
export function generateBearAvatar(seed: number = 42): VoxelData {
  return generateAvatar('bear', { expression: 'happy', heldItem: 'honey' }, seed);
}
export function generateCatAvatar(seed: number = 100): VoxelData {
  return generateAvatar('cat', { expression: 'happy', accessory: 'ribbon' }, seed);
}
export function generateRabbitAvatar(seed: number = 200): VoxelData {
  return generateAvatar('rabbit', { expression: 'happy', heldItem: 'flower' }, seed);
}
export function generateDogAvatar(seed: number = 300): VoxelData {
  return generateAvatar('dog', { expression: 'excited', accessory: 'scarf' }, seed);
}
export function generatePandaAvatar(seed: number = 400): VoxelData {
  return generateAvatar('panda', { expression: 'happy', heldItem: 'star' }, seed);
}
export function generateFoxAvatar(seed: number = 500): VoxelData {
  return generateAvatar('fox', { expression: 'wink', accessory: 'scarf' }, seed);
}
export function generatePenguinAvatar(seed: number = 600): VoxelData {
  return generateAvatar('penguin', { expression: 'happy', accessory: 'crown' }, seed);
}
export function generateHamsterAvatar(seed: number = 700): VoxelData {
  return generateAvatar('hamster', { expression: 'excited', heldItem: 'flower' }, seed);
}
