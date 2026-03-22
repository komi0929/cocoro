/**
 * VoxelAvatars — Kawaii動物アバター生成エンジン
 *
 * 参考画像のクマのような、温かみ・可愛さを持つアバターを
 * プロシージャルに生成する。
 *
 * 特徴:
 * - 大頭身（頭:体 = 1:1.2）
 * - 丸みを帯びた体型（角カット）
 * - kawaii顔パーツ（2x2目＋ハイライト、ピンクほっぺ）
 * - 種族ごとのカスタマイズ（クマ、ネコ、ウサギ、イヌ、パンダ）
 * - アクセサリ対応（帽子、リボン、持ち物）
 */

import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import {
  seededRand, pick, lerp, noisyPick,
  fillRoundedBox, fillNoisySphere, drawKawaiiFace, adjustBrightness,
  PAL_BEAR_BROWN, PAL_BEAR_BELLY,
} from './VoxelDesign';

// ============================================================
// アバター設定型
// ============================================================

export interface AvatarConfig {
  /** 種族 */
  species: 'bear' | 'cat' | 'rabbit' | 'dog' | 'panda';
  /** メインカラー */
  mainColor?: string;
  /** ベリー（お腹）カラー */
  bellyColor?: string;
  /** アクセサリ */
  accessory?: 'none' | 'ribbon' | 'hat' | 'scarf' | 'bow';
  /** 持ち物 */
  heldItem?: 'none' | 'honey' | 'fish' | 'flower' | 'star';
  /** 表情 */
  expression?: 'happy' | 'neutral' | 'excited' | 'sleepy';
}

// 種族ごとのデフォルト設定
const SPECIES_DEFAULTS: Record<string, {
  mainPalette: string[];
  bellyPalette: string[];
  earShape: 'round' | 'pointed' | 'long' | 'floppy';
  tailSize: 'tiny' | 'medium' | 'long';
  noseColor: string;
}> = {
  bear: {
    mainPalette: PAL_BEAR_BROWN,
    bellyPalette: PAL_BEAR_BELLY,
    earShape: 'round', tailSize: 'tiny', noseColor: '#2D1B0E',
  },
  cat: {
    mainPalette: ['#FF8C00', '#FFA500', '#FF7F24', '#E67300', '#CC6600'],
    bellyPalette: ['#FFF8DC', '#FFEFD5', '#FFE4C4', '#FFDAB9'],
    earShape: 'pointed', tailSize: 'long', noseColor: '#FF69B4',
  },
  rabbit: {
    mainPalette: ['#F5F5F5', '#ECECEC', '#E0E0E0', '#D5D5D5', '#FFF0F0'],
    bellyPalette: ['#FFF5F5', '#FFEBEE', '#FFFFFF', '#FFF8F8'],
    earShape: 'long', tailSize: 'tiny', noseColor: '#FF69B4',
  },
  dog: {
    mainPalette: ['#C49A6C', '#B8895E', '#D4AA7C', '#A0784C', '#E0BA8C'],
    bellyPalette: ['#F5E6D3', '#FFE8D0', '#FFF0E0', '#FFF5EA'],
    earShape: 'floppy', tailSize: 'medium', noseColor: '#2D1B0E',
  },
  panda: {
    mainPalette: ['#F5F5F5', '#ECECEC', '#E0E0E0', '#FFFFFF', '#F0F0F0'],
    bellyPalette: ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#F0F0F0'],
    earShape: 'round', tailSize: 'tiny', noseColor: '#1A1A1A',
  },
};

// ============================================================
// メインジェネレーター
// ============================================================

export function generateAvatar(config: AvatarConfig, seed: number = 42): VoxelData {
  const rand = seededRand(seed);
  const grid = createGrid(20, 28, 16);
  const cx = 10, cz = 8; // 中心

  const sp = SPECIES_DEFAULTS[config.species] ?? SPECIES_DEFAULTS['bear']!;
  const mainPal = config.mainColor
    ? [config.mainColor, adjustBrightness(config.mainColor, 0.85), adjustBrightness(config.mainColor, 1.15),
       adjustBrightness(config.mainColor, 0.7), adjustBrightness(config.mainColor, 1.3)]
    : sp.mainPalette;
  const bellyPal = config.bellyColor
    ? [config.bellyColor, adjustBrightness(config.bellyColor, 0.9), adjustBrightness(config.bellyColor, 1.1)]
    : sp.bellyPalette;

  // =============== 足 (y: 0-5) ===============
  // 左足
  for (let y = 0; y <= 5; y++) {
    const w = y < 2 ? 3 : 2;
    for (let dz = -w; dz <= w; dz++) {
      for (let dx = -w; dx <= -1; dx++) {
        if (dx * dx + dz * dz <= w * w + 1) {
          setVoxel(grid, cx + dx - 1, y, cz + dz, noisyPick(mainPal, seed + y + dx + dz));
        }
      }
    }
  }
  // 右足
  for (let y = 0; y <= 5; y++) {
    const w = y < 2 ? 3 : 2;
    for (let dz = -w; dz <= w; dz++) {
      for (let dx = 1; dx <= w; dx++) {
        if (dx * dx + dz * dz <= w * w + 1) {
          setVoxel(grid, cx + dx + 1, y, cz + dz, noisyPick(mainPal, seed + y + dx + dz + 100));
        }
      }
    }
  }
  // 足の裏（パッド）
  for (let dx = -2; dx <= -1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      setVoxel(grid, cx + dx - 1, 0, cz + dz, noisyPick(bellyPal, seed + dx + dz));
    }
  }
  for (let dx = 1; dx <= 2; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      setVoxel(grid, cx + dx + 1, 0, cz + dz, noisyPick(bellyPal, seed + dx + dz + 200));
    }
  }

  // =============== 胴体 (y: 5-14) ===============
  for (let y = 5; y <= 14; y++) {
    const t = (y - 5) / 9;
    const rxBody = lerp(4, 3.5, t);
    const rzBody = lerp(3.5, 3, t);
    for (let dz = -Math.ceil(rzBody); dz <= Math.ceil(rzBody); dz++) {
      for (let dx = -Math.ceil(rxBody); dx <= Math.ceil(rxBody); dx++) {
        const ndx = dx / rxBody, ndz = dz / rzBody;
        if (ndx * ndx + ndz * ndz <= 1) {
          // お腹部分（前面の中央）
          const isBelly = dz < -rzBody * 0.3 && Math.abs(dx) < rxBody * 0.6 && y < 13;
          const color = isBelly
            ? noisyPick(bellyPal, seed + y + dx + dz + 300)
            : noisyPick(mainPal, seed + y + dx + dz);
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // =============== 腕 (y: 8-13) ===============
  // 左腕
  for (let y = 8; y <= 13; y++) {
    const armT = (y - 8) / 5;
    const w = lerp(2, 1.5, armT);
    for (let dz = -Math.ceil(w); dz <= Math.ceil(w); dz++) {
      for (let dx = 0; dx < Math.ceil(w); dx++) {
        if (dx * dx + dz * dz <= w * w) {
          setVoxel(grid, cx - 5 - dx, y, cz + dz, noisyPick(mainPal, seed + y + dx + 400));
        }
      }
    }
  }
  // 右腕
  for (let y = 8; y <= 13; y++) {
    const armT = (y - 8) / 5;
    const w = lerp(2, 1.5, armT);
    for (let dz = -Math.ceil(w); dz <= Math.ceil(w); dz++) {
      for (let dx = 0; dx < Math.ceil(w); dx++) {
        if (dx * dx + dz * dz <= w * w) {
          setVoxel(grid, cx + 5 + dx, y, cz + dz, noisyPick(mainPal, seed + y + dx + 500));
        }
      }
    }
  }

  // =============== 頭 (y: 14-25) — 大きい! ===============
  const headCy = 20;
  const headRx = 5.5, headRy = 5, headRz = 5;
  for (let y = Math.floor(headCy - headRy); y <= Math.ceil(headCy + headRy); y++) {
    for (let dz = -Math.ceil(headRz); dz <= Math.ceil(headRz); dz++) {
      for (let dx = -Math.ceil(headRx); dx <= Math.ceil(headRx); dx++) {
        const ndx = dx / headRx, ndy = (y - headCy) / headRy, ndz = dz / headRz;
        if (ndx * ndx + ndy * ndy + ndz * ndz <= 1) {
          // パンダの目の周り
          let color: string;
          if (config.species === 'panda') {
            const isEyePatch = Math.abs(dx) >= 2 && Math.abs(dx) <= 4 && y >= 19 && y <= 22 && dz < -headRz * 0.5;
            color = isEyePatch ? '#1A1A1A' : noisyPick(mainPal, seed + y + dx + dz + 600);
          } else {
            color = noisyPick(mainPal, seed + y + dx + dz + 600);
          }
          setVoxel(grid, cx + dx, y, cz + dz, color);
        }
      }
    }
  }

  // =============== 顔パーツ ===============
  const faceZ = cz - Math.ceil(headRz); // 顔の一番前
  const eyeColor = config.species === 'panda' ? '#1A1A1A' : '#1A1A1A';
  const expression = config.expression ?? 'happy';

  // 目（2x2 + ハイライト）
  // 左目
  setVoxel(grid, cx - 3, headCy + 1, faceZ, eyeColor);
  setVoxel(grid, cx - 2, headCy + 1, faceZ, eyeColor);
  setVoxel(grid, cx - 3, headCy, faceZ, eyeColor);
  setVoxel(grid, cx - 2, headCy, faceZ, eyeColor);
  // 左目ハイライト
  setVoxel(grid, cx - 3, headCy + 1, faceZ, '#FFFFFF');
  // 右目
  setVoxel(grid, cx + 2, headCy + 1, faceZ, eyeColor);
  setVoxel(grid, cx + 3, headCy + 1, faceZ, eyeColor);
  setVoxel(grid, cx + 2, headCy, faceZ, eyeColor);
  setVoxel(grid, cx + 3, headCy, faceZ, eyeColor);
  // 右目ハイライト
  setVoxel(grid, cx + 2, headCy + 1, faceZ, '#FFFFFF');

  // 鼻
  setVoxel(grid, cx, headCy - 1, faceZ, sp.noseColor);
  setVoxel(grid, cx - 1, headCy - 1, faceZ, sp.noseColor);

  // 口
  if (expression === 'happy' || expression === 'excited') {
    setVoxel(grid, cx - 1, headCy - 2, faceZ, '#555555');
    setVoxel(grid, cx, headCy - 2, faceZ, '#555555');
    setVoxel(grid, cx + 1, headCy - 2, faceZ, '#555555');
    // にっこり（端を上げる
    setVoxel(grid, cx - 2, headCy - 1, faceZ, '#555555');
    setVoxel(grid, cx + 2, headCy - 1, faceZ, '#555555');
  } else {
    setVoxel(grid, cx - 1, headCy - 2, faceZ, '#777777');
    setVoxel(grid, cx, headCy - 2, faceZ, '#777777');
    setVoxel(grid, cx + 1, headCy - 2, faceZ, '#777777');
  }

  // ほっぺた
  setVoxel(grid, cx - 4, headCy - 1, faceZ, '#FFB6C1');
  setVoxel(grid, cx - 5, headCy - 1, faceZ, '#FFB6C1');
  setVoxel(grid, cx + 4, headCy - 1, faceZ, '#FFB6C1');
  setVoxel(grid, cx + 5, headCy - 1, faceZ, '#FFB6C1');

  // =============== 耳 ===============
  if (sp.earShape === 'round') {
    // クマ耳（丸い）
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx * dx + dz * dz <= 1) {
            setVoxel(grid, cx - 4 + dx, headCy + headRy + dy, cz + dz,
              noisyPick(mainPal, seed + dy + dx + 700));
            setVoxel(grid, cx + 4 + dx, headCy + headRy + dy, cz + dz,
              noisyPick(mainPal, seed + dy + dx + 800));
          }
        }
      }
    }
    // 耳の内側
    setVoxel(grid, cx - 4, headCy + headRy + 1, cz - 1, noisyPick(bellyPal, seed + 710));
    setVoxel(grid, cx + 4, headCy + headRy + 1, cz - 1, noisyPick(bellyPal, seed + 810));
  } else if (sp.earShape === 'pointed') {
    // ネコ耳（三角）
    for (let h = 0; h < 4; h++) {
      const w = Math.max(0, 2 - h);
      for (let dx = -w; dx <= w; dx++) {
        setVoxel(grid, cx - 4 + dx, headCy + headRy + h, cz,
          noisyPick(mainPal, seed + h + dx + 700));
        setVoxel(grid, cx + 4 + dx, headCy + headRy + h, cz,
          noisyPick(mainPal, seed + h + dx + 800));
      }
    }
    // 内側ピンク
    setVoxel(grid, cx - 4, headCy + headRy + 1, cz, '#FFB6C1');
    setVoxel(grid, cx + 4, headCy + headRy + 1, cz, '#FFB6C1');
  } else if (sp.earShape === 'long') {
    // ウサギ耳（長い）
    for (let h = 0; h < 7; h++) {
      const w = h < 5 ? 1 : 0;
      for (let dx = -w; dx <= w; dx++) {
        setVoxel(grid, cx - 3 + dx, headCy + headRy + h, cz,
          noisyPick(mainPal, seed + h + dx + 700));
        setVoxel(grid, cx + 3 + dx, headCy + headRy + h, cz,
          noisyPick(mainPal, seed + h + dx + 800));
      }
      // 内側ピンク
      if (h < 6) {
        setVoxel(grid, cx - 3, headCy + headRy + h, cz - 1, '#FFB6C1');
        setVoxel(grid, cx + 3, headCy + headRy + h, cz - 1, '#FFB6C1');
      }
    }
  } else {
    // イヌ耳（垂れ耳）
    for (let h = 0; h < 2; h++) {
      for (let dx = -1; dx <= 1; dx++) {
        setVoxel(grid, cx - 5 + dx, headCy + headRy - h, cz,
          noisyPick(mainPal, seed + h + dx + 700));
        setVoxel(grid, cx + 5 + dx, headCy + headRy - h, cz,
          noisyPick(mainPal, seed + h + dx + 800));
      }
    }
    // 垂れ部分
    for (let h = 0; h < 4; h++) {
      setVoxel(grid, cx - 6, headCy + headRy - 1 - h, cz,
        noisyPick(mainPal, seed + h + 750));
      setVoxel(grid, cx + 6, headCy + headRy - 1 - h, cz,
        noisyPick(mainPal, seed + h + 850));
    }
  }

  // =============== しっぽ ===============
  if (sp.tailSize === 'tiny') {
    // 小さい丸しっぽ
    for (let dz = 0; dz <= 1; dz++) {
      for (let dx = -1; dx <= 0; dx++) {
        setVoxel(grid, cx + dx, 8, cz + headRz - 1 + dz, noisyPick(mainPal, seed + dx + dz + 900));
      }
    }
  } else if (sp.tailSize === 'long') {
    // 長いしっぽ
    for (let s = 0; s < 6; s++) {
      const tx = Math.round(Math.sin(s * 0.4) * 0.5);
      setVoxel(grid, cx + tx, 7 + Math.floor(s * 0.5), cz + headRz + s,
        noisyPick(mainPal, seed + s + 900));
    }
  } else {
    // 中間しっぽ
    for (let s = 0; s < 3; s++) {
      setVoxel(grid, cx, 8 + s, cz + headRz + s, noisyPick(mainPal, seed + s + 900));
    }
  }

  // =============== アクセサリ ===============
  const acc = config.accessory ?? 'none';
  if (acc === 'ribbon') {
    // 頭のリボン
    const ribbonY = headCy + headRy + (sp.earShape === 'long' ? 0 : 2);
    setVoxel(grid, cx - 1, ribbonY, cz - 2, '#FF1493');
    setVoxel(grid, cx, ribbonY, cz - 2, '#FF1493');
    setVoxel(grid, cx + 1, ribbonY, cz - 2, '#FF1493');
    setVoxel(grid, cx, ribbonY + 1, cz - 2, '#FF1493');
    setVoxel(grid, cx - 2, ribbonY, cz - 2, '#FF69B4');
    setVoxel(grid, cx + 2, ribbonY, cz - 2, '#FF69B4');
  } else if (acc === 'hat') {
    // 帽子
    const hatY = headCy + headRy;
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dz * dz <= 10) {
          setVoxel(grid, cx + dx, hatY, cz + dz, '#8B4513');
        }
      }
    }
    for (let dy = 1; dy <= 3; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx * dx + dz * dz <= 5) {
            setVoxel(grid, cx + dx, hatY + dy, cz + dz, '#8B4513');
          }
        }
      }
    }
  } else if (acc === 'scarf') {
    // マフラー
    for (let angle = 0; angle < 16; angle++) {
      const a = (angle / 16) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(a) * 4);
      const sz = Math.round(cz + Math.sin(a) * 3.5);
      setVoxel(grid, sx, 14, sz, '#FF4444');
      setVoxel(grid, sx, 15, sz, '#FF4444');
    }
    // たれ部分
    setVoxel(grid, cx + 4, 13, cz, '#FF4444');
    setVoxel(grid, cx + 4, 12, cz, '#FF6666');
    setVoxel(grid, cx + 4, 11, cz, '#FF4444');
  }

  // =============== 持ち物 ===============
  const item = config.heldItem ?? 'none';
  if (item === 'honey') {
    // ハチミツ壺（右手に持つ）
    const hx = cx + 7, hy = 10, hz = cz - 1;
    // 壺本体
    for (let dy = 0; dy < 4; dy++) {
      const r = dy === 0 || dy === 3 ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dz * dz <= r * r) {
            const color = dy === 3 ? '#8B4513' : pick(['#D4A017', '#E4B027', '#F4C037'], seed + dy + dx);
            setVoxel(grid, hx + dx, hy + dy, hz + dz, color);
          }
        }
      }
    }
  } else if (item === 'flower') {
    // 花
    const fx = cx + 7, fy = 11, fz = cz;
    setVoxel(grid, fx, fy, fz, '#228B22'); // 茎
    setVoxel(grid, fx, fy + 1, fz, '#228B22');
    setVoxel(grid, fx, fy + 2, fz, '#FFD700'); // 中心
    setVoxel(grid, fx + 1, fy + 2, fz, '#FF69B4');
    setVoxel(grid, fx - 1, fy + 2, fz, '#FF69B4');
    setVoxel(grid, fx, fy + 3, fz, '#FF69B4');
    setVoxel(grid, fx, fy + 2, fz + 1, '#FF69B4');
  } else if (item === 'star') {
    // 星
    const sx = cx + 7, sy = 12, sz = cz;
    setVoxel(grid, sx, sy, sz, '#FFD700');
    setVoxel(grid, sx + 1, sy, sz, '#FFD700');
    setVoxel(grid, sx - 1, sy, sz, '#FFD700');
    setVoxel(grid, sx, sy + 1, sz, '#FFD700');
    setVoxel(grid, sx, sy - 1, sz, '#FFD700');
    setVoxel(grid, sx, sy, sz, '#FFFFFF'); // 中心光
  }

  return grid;
}

// ============================================================
// プリセットアバター
// ============================================================

export function generateBearAvatar(seed: number = 42): VoxelData {
  return generateAvatar({ species: 'bear', expression: 'happy', heldItem: 'honey' }, seed);
}

export function generateCatAvatar(seed: number = 100): VoxelData {
  return generateAvatar({ species: 'cat', expression: 'happy', accessory: 'ribbon', heldItem: 'fish' }, seed);
}

export function generateRabbitAvatar(seed: number = 200): VoxelData {
  return generateAvatar({ species: 'rabbit', expression: 'happy', accessory: 'bow', heldItem: 'flower' }, seed);
}

export function generateDogAvatar(seed: number = 300): VoxelData {
  return generateAvatar({ species: 'dog', expression: 'excited', accessory: 'scarf' }, seed);
}

export function generatePandaAvatar(seed: number = 400): VoxelData {
  return generateAvatar({ species: 'panda', expression: 'happy', heldItem: 'star' }, seed);
}
