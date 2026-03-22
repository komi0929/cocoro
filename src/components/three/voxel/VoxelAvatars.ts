/**
 * VoxelAvatars — Kawaii動物アバター生成エンジン v2
 *
 * v1からの改善:
 * - グリッドサイズ 20x28x16 → 32x44x24（解像度2倍）
 * - 球体ベースの体型（角張り解消）
 * - 顔パーツを大きく明瞭に（正面から必ず見える）
 * - 色ノイズを控えめに（ノイジーすぎた）
 * - お腹・足裏のディテール追加
 */

import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import {
  seededRand, pick, lerp, noisyPick, adjustBrightness,
  PAL_BEAR_BROWN, PAL_BEAR_BELLY,
} from './VoxelDesign';

export interface AvatarConfig {
  species: 'bear' | 'cat' | 'rabbit' | 'dog' | 'panda';
  mainColor?: string;
  bellyColor?: string;
  accessory?: 'none' | 'ribbon' | 'hat' | 'scarf';
  heldItem?: 'none' | 'honey' | 'fish' | 'flower' | 'star';
  expression?: 'happy' | 'neutral' | 'excited' | 'sleepy';
}

const SPECIES_DEFAULTS: Record<string, {
  mainPalette: string[];
  bellyPalette: string[];
  earShape: 'round' | 'pointed' | 'long' | 'floppy';
  tailSize: 'tiny' | 'medium' | 'long';
  noseColor: string;
}> = {
  bear: {
    mainPalette: ['#8B5A36', '#9C663E', '#7A4E2E', '#AD7246', '#6B4226'],
    bellyPalette: ['#D4B892', '#C4A882', '#E4C8A2'],
    earShape: 'round', tailSize: 'tiny', noseColor: '#2D1B0E',
  },
  cat: {
    mainPalette: ['#FF8C00', '#FFA500', '#E67300', '#FFB347', '#CC6600'],
    bellyPalette: ['#FFF8DC', '#FFEFD5', '#FFE4C4'],
    earShape: 'pointed', tailSize: 'long', noseColor: '#FF69B4',
  },
  rabbit: {
    mainPalette: ['#F5F5F5', '#ECECEC', '#E0E0E0', '#FAFAFA', '#FFF0F0'],
    bellyPalette: ['#FFFFFF', '#FFF5F5', '#FFEBEE'],
    earShape: 'long', tailSize: 'tiny', noseColor: '#FF69B4',
  },
  dog: {
    mainPalette: ['#C49A6C', '#B8895E', '#D4AA7C', '#A0784C', '#E0BA8C'],
    bellyPalette: ['#F5E6D3', '#FFE8D0', '#FFF0E0'],
    earShape: 'floppy', tailSize: 'medium', noseColor: '#2D1B0E',
  },
  panda: {
    mainPalette: ['#F5F5F5', '#ECECEC', '#E0E0E0', '#FFFFFF', '#F8F8F8'],
    bellyPalette: ['#FFFFFF', '#FAFAFA', '#F5F5F5'],
    earShape: 'round', tailSize: 'tiny', noseColor: '#1A1A1A',
  },
};

/** 楕円体を塗る（色ノイズ控えめ） */
function fillSoftEllipsoid(
  grid: VoxelData, cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  palette: string[], seed: number,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1) {
          // 非常に軽い色変化のみ（ノイジーにしない）
          const ci = Math.abs((x * 3 + y * 7 + z * 11 + seed) % palette.length);
          setVoxel(grid, x, y, z, palette[ci]!);
        }
      }
    }
  }
}

export function generateAvatar(config: AvatarConfig, seed: number = 42): VoxelData {
  const grid = createGrid(32, 44, 24);
  const cx = 16, cz = 12; // 中心

  const sp = SPECIES_DEFAULTS[config.species] ?? SPECIES_DEFAULTS['bear']!;
  const main = config.mainColor
    ? [config.mainColor, adjustBrightness(config.mainColor, 0.9), adjustBrightness(config.mainColor, 1.1),
       adjustBrightness(config.mainColor, 0.85), adjustBrightness(config.mainColor, 1.15)]
    : sp.mainPalette;
  const belly = config.bellyColor
    ? [config.bellyColor, adjustBrightness(config.bellyColor, 0.95)]
    : sp.bellyPalette;

  // ===== 足 (y: 0-8) — 短くて太い丸脚 =====
  // 左足
  fillSoftEllipsoid(grid, cx - 4, 4, cz, 3, 4, 3, main, seed + 100);
  // 右足
  fillSoftEllipsoid(grid, cx + 4, 4, cz, 3, 4, 3, main, seed + 200);
  // 足裏パッド（前面）
  for (let dx = -2; dx <= 0; dx++) {
    for (let dz = -2; dz <= 0; dz++) {
      if (dx * dx + dz * dz <= 5) {
        setVoxel(grid, cx - 4 + dx, 0, cz + dz, belly[0]!);
        setVoxel(grid, cx + 4 + dx + 2, 0, cz + dz, belly[0]!);
      }
    }
  }

  // ===== 胴体 (y: 7-20) — 楕円体、お腹白い =====
  fillSoftEllipsoid(grid, cx, 14, cz, 7, 7, 6, main, seed + 300);
  // お腹（前面の白い部分）
  for (let y = 9; y <= 18; y++) {
    for (let z = cz - 6; z <= cz - 2; z++) {
      for (let x = cx - 4; x <= cx + 4; x++) {
        const dx = (x - cx) / 5, dy = (y - 14) / 7, dz = (z - cz) / 6;
        if (dx * dx + dy * dy + dz * dz <= 0.7) {
          setVoxel(grid, x, y, z, belly[Math.abs(x + y + z + seed) % belly.length]!);
        }
      }
    }
  }

  // ===== 腕 (y: 12-19) — 丸い棒状 =====
  // 左腕
  fillSoftEllipsoid(grid, cx - 8, 16, cz, 2.5, 5, 2.5, main, seed + 400);
  // 右腕
  fillSoftEllipsoid(grid, cx + 8, 16, cz, 2.5, 5, 2.5, main, seed + 500);

  // ===== 頭 (y: 20-38) — 大きい球体! =====
  const headCy = 30;
  const headR = 8;
  fillSoftEllipsoid(grid, cx, headCy, cz, headR, headR, headR - 1, main, seed + 600);

  // ===== マズル（口周り） =====
  const muzzleZ = cz - headR + 1;
  fillSoftEllipsoid(grid, cx, headCy - 2, muzzleZ, 3, 2, 2, belly, seed + 650);

  // ===== 顔パーツ（正面 = Z最小面） =====
  const faceZ = cz - headR; // 最前面
  const EYE = '#1A1A1A';
  const HIGHLIGHT = '#FFFFFF';
  const BLUSH = '#FFB6C1';

  // 目（3x3 大きめ + ハイライト2ドット）
  // 左目
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      setVoxel(grid, cx - 4 + dx, headCy + 1 + dy, faceZ, EYE);
      setVoxel(grid, cx - 4 + dx, headCy + 1 + dy, faceZ + 1, EYE);
    }
  }
  // 左目ハイライト
  setVoxel(grid, cx - 4, headCy + 3, faceZ, HIGHLIGHT);
  setVoxel(grid, cx - 3, headCy + 3, faceZ, HIGHLIGHT);

  // 右目
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      setVoxel(grid, cx + 3 + dx, headCy + 1 + dy, faceZ, EYE);
      setVoxel(grid, cx + 3 + dx, headCy + 1 + dy, faceZ + 1, EYE);
    }
  }
  // 右目ハイライト
  setVoxel(grid, cx + 3, headCy + 3, faceZ, HIGHLIGHT);
  setVoxel(grid, cx + 4, headCy + 3, faceZ, HIGHLIGHT);

  // パンダの目パッチ
  if (config.species === 'panda') {
    for (let dy = -1; dy <= 4; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px1 = cx - 4 + dx, px2 = cx + 3 + dx;
        const py = headCy + 1 + dy;
        if (Math.abs(dx) <= 2 && dy >= -1 && dy <= 4) {
          setVoxel(grid, px1, py, faceZ + 2, '#1A1A1A');
          setVoxel(grid, px2, py, faceZ + 2, '#1A1A1A');
        }
      }
    }
  }

  // 鼻（大きく）
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = 0; dz <= 1; dz++) {
      setVoxel(grid, cx + dx, headCy - 1, faceZ + dz, sp.noseColor);
    }
  }

  // ほっぺた（大きいブラッシュ、4ドット各側）
  for (let dy = 0; dy <= 1; dy++) {
    setVoxel(grid, cx - 6, headCy - 1 + dy, faceZ, BLUSH);
    setVoxel(grid, cx - 7, headCy - 1 + dy, faceZ, BLUSH);
    setVoxel(grid, cx + 6, headCy - 1 + dy, faceZ, BLUSH);
    setVoxel(grid, cx + 7, headCy - 1 + dy, faceZ, BLUSH);
  }

  // 口（にっこり弧）
  const expr = config.expression ?? 'happy';
  if (expr === 'happy' || expr === 'excited') {
    // 笑顔（へ の字+端上がり）
    for (let dx = -2; dx <= 2; dx++) {
      setVoxel(grid, cx + dx, headCy - 3, faceZ, '#555555');
    }
    setVoxel(grid, cx - 3, headCy - 2, faceZ, '#555555');
    setVoxel(grid, cx + 3, headCy - 2, faceZ, '#555555');
  } else {
    for (let dx = -2; dx <= 2; dx++) {
      setVoxel(grid, cx + dx, headCy - 3, faceZ, '#777777');
    }
  }

  // ===== 耳 =====
  if (sp.earShape === 'round') {
    // クマ耳（丸い、太い）
    fillSoftEllipsoid(grid, cx - 6, headCy + 8, cz, 2.5, 2.5, 2, main, seed + 700);
    fillSoftEllipsoid(grid, cx + 6, headCy + 8, cz, 2.5, 2.5, 2, main, seed + 800);
    // 内側ピンク
    setVoxel(grid, cx - 6, headCy + 8, cz - 2, BLUSH);
    setVoxel(grid, cx + 6, headCy + 8, cz - 2, BLUSH);
  } else if (sp.earShape === 'pointed') {
    // ネコ耳（三角、大きい）
    for (let h = 0; h < 6; h++) {
      const w = Math.max(0, 3 - h);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -w; dx <= w; dx++) {
          setVoxel(grid, cx - 6 + dx, headCy + 7 + h, cz + dz, main[0]!);
          setVoxel(grid, cx + 6 + dx, headCy + 7 + h, cz + dz, main[0]!);
        }
      }
    }
    // 内側
    for (let h = 0; h < 4; h++) {
      const w2 = Math.max(0, 2 - h);
      for (let dx = -w2; dx <= w2; dx++) {
        setVoxel(grid, cx - 6 + dx, headCy + 8 + h, cz - 1, BLUSH);
        setVoxel(grid, cx + 6 + dx, headCy + 8 + h, cz - 1, BLUSH);
      }
    }
  } else if (sp.earShape === 'long') {
    // ウサギ耳（長い）
    for (let h = 0; h < 10; h++) {
      const w = h < 8 ? 1.5 : 1;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) {
          if (dx * dx <= w * w + 0.5) {
            setVoxel(grid, cx - 4 + dx, headCy + 7 + h, cz + dz, main[0]!);
            setVoxel(grid, cx + 4 + dx, headCy + 7 + h, cz + dz, main[0]!);
          }
        }
      }
      // 内側ピンク
      setVoxel(grid, cx - 4, headCy + 7 + h, cz - 1, BLUSH);
      setVoxel(grid, cx + 4, headCy + 7 + h, cz - 1, BLUSH);
    }
  } else {
    // イヌ耳（垂れ）
    for (let h = 0; h < 3; h++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          setVoxel(grid, cx - 7 + dx, headCy + 7 - h, cz + dz, main[0]!);
          setVoxel(grid, cx + 7 + dx, headCy + 7 - h, cz + dz, main[0]!);
        }
      }
    }
    // 垂れ
    for (let h = 0; h < 5; h++) {
      setVoxel(grid, cx - 8, headCy + 6 - h, cz, main[1]!);
      setVoxel(grid, cx - 8, headCy + 6 - h, cz - 1, main[1]!);
      setVoxel(grid, cx + 8, headCy + 6 - h, cz, main[1]!);
      setVoxel(grid, cx + 8, headCy + 6 - h, cz - 1, main[1]!);
    }
  }

  // ===== しっぽ =====
  if (sp.tailSize === 'tiny') {
    fillSoftEllipsoid(grid, cx, 12, cz + 6, 2, 2, 2, main, seed + 900);
  } else if (sp.tailSize === 'long') {
    for (let s = 0; s < 8; s++) {
      const tx = Math.round(Math.sin(s * 0.5) * 1.5);
      const ty = 12 + Math.round(s * 0.6);
      fillSoftEllipsoid(grid, cx + tx, ty, cz + 6 + s, 1, 1, 1, main, seed + 900 + s);
    }
  } else {
    for (let s = 0; s < 4; s++) {
      setVoxel(grid, cx, 12 + s, cz + 6 + s, main[0]!);
      setVoxel(grid, cx + 1, 12 + s, cz + 6 + s, main[1]!);
    }
  }

  // ===== アクセサリ =====
  if (config.accessory === 'ribbon') {
    const ry = headCy + headR + 2;
    const ribbonCol = '#FF1493';
    const ribbonLight = '#FF69B4';
    // リボン中央
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 0; dz++) {
        setVoxel(grid, cx + dx, ry, cz + dz, ribbonCol);
        setVoxel(grid, cx + dx, ry + 1, cz + dz, ribbonCol);
      }
    }
    // リボン左右の蝶
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 2; dx <= 4; dx++) {
        setVoxel(grid, cx - dx, ry + dy, cz, ribbonLight);
        setVoxel(grid, cx + dx, ry + dy, cz, ribbonLight);
      }
    }
  } else if (config.accessory === 'hat') {
    const hatBase = headCy + headR;
    // つば
    for (let dz = -5; dz <= 5; dz++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx * dx + dz * dz <= 25) {
          setVoxel(grid, cx + dx, hatBase, cz + dz, '#8B4513');
        }
      }
    }
    // 本体
    for (let dy = 1; dy <= 5; dy++) {
      const r = dy < 4 ? 3.5 : 2;
      for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dz * dz <= r * r) {
            setVoxel(grid, cx + dx, hatBase + dy, cz + dz, '#8B4513');
          }
        }
      }
    }
    // リボン帯
    for (let angle = 0; angle < 20; angle++) {
      const a = (angle / 20) * Math.PI * 2;
      setVoxel(grid, cx + Math.round(Math.cos(a) * 3.5), hatBase + 2, cz + Math.round(Math.sin(a) * 3.5), '#FF4444');
    }
  } else if (config.accessory === 'scarf') {
    for (let angle = 0; angle < 24; angle++) {
      const a = (angle / 24) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(a) * 7);
      const sz = Math.round(cz + Math.sin(a) * 6);
      setVoxel(grid, sx, 20, sz, '#FF4444');
      setVoxel(grid, sx, 21, sz, '#FF4444');
      setVoxel(grid, sx, 22, sz, '#CC3333');
    }
    // たれ
    for (let dy = 0; dy < 5; dy++) {
      setVoxel(grid, cx + 7, 19 - dy, cz, '#FF4444');
      setVoxel(grid, cx + 7, 19 - dy, cz - 1, '#CC3333');
    }
  }

  // ===== 持ち物 =====
  if (config.heldItem === 'honey') {
    // ハチミツ壺（右手）
    const hx = cx + 10, hy = 14, hz = cz;
    for (let dy = 0; dy < 5; dy++) {
      const r = dy === 0 || dy === 4 ? 1.5 : 2.5;
      for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dz * dz <= r * r) {
            const c = dy >= 3 ? '#8B4513' : '#FFD54F';
            setVoxel(grid, hx + dx, hy + dy, hz + dz, c);
          }
        }
      }
    }
    // 壺蓋
    setVoxel(grid, hx, hy + 5, hz, '#6B3E1E');
  } else if (config.heldItem === 'flower') {
    const fx = cx + 10, fy = 15, fz = cz;
    // 茎
    for (let dy = 0; dy < 4; dy++) setVoxel(grid, fx, fy + dy, fz, '#228B22');
    // 花弁
    const petals = ['#FF69B4', '#FF1493', '#FFB6C1', '#FF82AB'];
    setVoxel(grid, fx, fy + 4, fz, '#FFD700');
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      setVoxel(grid, fx + dx!, fy + 4, fz + dz!, petals[Math.abs(dx! + dz! + seed) % 4]!);
      setVoxel(grid, fx + dx!, fy + 5, fz + dz!, petals[Math.abs(dx! + dz! + seed + 1) % 4]!);
    }
  } else if (config.heldItem === 'star') {
    const sx = cx + 10, sy = 16, sz = cz;
    // 中心
    setVoxel(grid, sx, sy, sz, '#FFFFFF');
    // 5方向
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      setVoxel(grid, sx + dx!, sy + dy!, sz, '#FFD700');
      setVoxel(grid, sx + dx! * 2, sy + dy! * 2, sz, '#FFD700');
    }
    setVoxel(grid, sx, sy, sz + 1, '#FFD700');
    setVoxel(grid, sx, sy, sz - 1, '#FFD700');
  } else if (config.heldItem === 'fish') {
    const fx = cx + 10, fy = 15, fz = cz;
    // 体
    for (let dx = -1; dx <= 2; dx++) {
      setVoxel(grid, fx + dx, fy, fz, '#87CEEB');
      setVoxel(grid, fx + dx, fy + 1, fz, '#B0E0E6');
    }
    // 尾
    setVoxel(grid, fx + 3, fy + 1, fz, '#87CEEB');
    setVoxel(grid, fx + 3, fy - 1, fz, '#87CEEB');
    // 目
    setVoxel(grid, fx - 1, fy + 1, fz - 1, '#1A1A1A');
  }

  return grid;
}

// プリセット
export function generateBearAvatar(seed: number = 42): VoxelData {
  return generateAvatar({ species: 'bear', expression: 'happy', heldItem: 'honey' }, seed);
}
export function generateCatAvatar(seed: number = 100): VoxelData {
  return generateAvatar({ species: 'cat', expression: 'happy', accessory: 'ribbon' }, seed);
}
export function generateRabbitAvatar(seed: number = 200): VoxelData {
  return generateAvatar({ species: 'rabbit', expression: 'happy', heldItem: 'flower' }, seed);
}
export function generateDogAvatar(seed: number = 300): VoxelData {
  return generateAvatar({ species: 'dog', expression: 'excited', accessory: 'scarf' }, seed);
}
export function generatePandaAvatar(seed: number = 400): VoxelData {
  return generateAvatar({ species: 'panda', expression: 'happy', heldItem: 'star' }, seed);
}
