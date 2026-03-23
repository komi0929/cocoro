/**
 * VoxelAvatars v10 — Hardcoded Voxel-Perfect Avatars
 *
 * 参考画像 NORTH_STAR_2 を1ボクセル単位で再現。
 * プロシージャル生成ではなく、各アバターの正確な形状をハードコード。
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';

// ============================================================
// Color constants — 参考画像から抽出
// ============================================================
const BEAR = {
  body: '#8B5E3C',      // メイン茶色
  dark: '#6B4226',      // ダークブラウン（パウ、影）
  light: '#A67B5B',     // ライトブラウン（ベリー、マズル）
  nose: '#1A1A1A',      // 黒（鼻）
  eye: '#1A1A1A',       // 黒（目）
  highlight: '#FFFFFF',  // 白（目のハイライト）
  muzzle: '#C4956A',    // マズル色
  belly: '#C4956A',     // ベリーの明るい茶
};

const CAT = {
  body: '#9E9E9E',
  dark: '#707070',
  stripe: '#787878',
  light: '#BDBDBD',
  nose: '#FFB0B0',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  muzzle: '#E0E0E0',
  inner_ear: '#FFB6C1',
  belly: '#FFFFFF',
};

const RABBIT = {
  body: '#D4BC96',
  dark: '#B89E78',
  light: '#E8D8C0',
  nose: '#FFB0B0',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  muzzle: '#F0E4D4',
  inner_ear: '#FFAABB',
  belly: '#F5EDE0',
  paw: '#C8C8C8',
};

const DOG = {
  body: '#F0E8E0',
  patch: '#C49050',
  dark: '#D8D0C8',
  nose: '#2D1B0E',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  muzzle: '#FFFFFF',
  tongue: '#FF6B8A',
  collar: '#4488CC',
  medal: '#FFD700',
};

const PANDA = {
  body: '#F5F5F5',
  black: '#1A1A1A',
  muzzle: '#FFFFFF',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  nose: '#1A1A1A',
};

const FOX = {
  body: '#E07830',
  dark: '#C06020',
  light: '#FFF5E6',
  nose: '#1A1A1A',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  muzzle: '#FFF5E6',
  belly: '#FFF5E6',
  tail_tip: '#FFFFFF',
};

const PENGUIN = {
  body: '#3A5080',
  dark: '#2A3D60',
  belly: '#FFFFFF',
  beak: '#FF8C00',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  feet: '#FF8C00',
  cheek: '#FFB6C1',
};

const HAMSTER = {
  body: '#E8C8A0',
  dark: '#C8A880',
  light: '#FFF0E0',
  nose: '#1A1A1A',
  eye: '#1A1A1A',
  highlight: '#FFFFFF',
  cheek: '#F0D8B8',
  stripe: '#C4A070',
  belly: '#FFF0E0',
  paw: '#FFB6C1',
  seed: '#4A3508',
};

// ============================================================
// Helper: paint a slice (Z-layer) from a string pattern
// ============================================================
type PaletteMap = Record<string, string>;

/** 
 * Paint a Z-slice from a string pattern.
 * Each character maps to a color via palette. '.' = empty.
 * Pattern rows are bottom-to-top (y=0 is first row).
 */
function paintSlice(
  g: VoxelData, z: number, xOff: number, yOff: number,
  rows: string[], palette: PaletteMap,
): void {
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const y = yOff + rowIdx;
    const row = rows[rowIdx]!;
    for (let col = 0; col < row.length; col++) {
      const ch = row[col]!;
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color) setVoxel(g, xOff + col, y, z, color);
    }
  }
}

/**
 * Paint multiple Z-slices from front to back.
 * slices[0] = front face (highest Z), slices[last] = back face.
 */
function paintModel(
  g: VoxelData, xOff: number, yOff: number, zStart: number,
  slices: string[][], palette: PaletteMap,
): void {
  for (let si = 0; si < slices.length; si++) {
    paintSlice(g, zStart - si, xOff, yOff, slices[si]!, palette);
  }
}

// ============================================================
// BEAR — 参考画像からボクセル単位で精密再現
// Grid: 16W × 24H × 12D
// ============================================================
export function generateBearAvatar(_seed = 42): VoxelData {
  const W = 18, H = 26, D = 14;
  const g = createGrid(W, H, D);
  const B = BEAR.body, D_ = BEAR.dark, L = BEAR.light;
  const N = BEAR.nose, E = BEAR.eye, Hi = BEAR.highlight;
  const M = BEAR.muzzle, Be = BEAR.belly;

  // === FEET (y=0..1) ===
  // Left foot
  fillBox(g, 3,0,4, 6,0,8, D_);   // foot pad (dark)
  fillBox(g, 3,1,4, 6,1,8, B);    // foot top
  // Right foot
  fillBox(g, 11,0,4, 14,0,8, D_);
  fillBox(g, 11,1,4, 14,1,8, B);

  // === LEGS (y=2..5) ===
  fillBox(g, 4,2,5, 6,5,7, B);    // left leg
  fillBox(g, 11,2,5, 13,5,7, B);  // right leg

  // === BODY (y=6..14) ===
  // Main body block
  fillBox(g, 3,6,4, 14,14,9, B);
  // Body front face highlight (belly)
  // Rounded belly mark - elliptical on front face
  for (let dy = 0; dy < 7; dy++) {
    const y = 7 + dy;
    const halfW = dy <= 1 || dy >= 5 ? 2 : (dy <= 2 || dy >= 4 ? 3 : 4);
    for (let dx = -halfW; dx <= halfW; dx++) {
      setVoxel(g, 9 + dx, y, 9, Be);
    }
  }

  // Body corners cut (rounded look)
  setVoxel(g, 3,6,4, null as unknown as string);   // bottom-left-front
  setVoxel(g, 14,6,4, null as unknown as string);  // bottom-right-front
  setVoxel(g, 3,6,9, null as unknown as string);   // bottom-left-back
  setVoxel(g, 14,6,9, null as unknown as string);  // bottom-right-back
  setVoxel(g, 3,14,4, null as unknown as string);  // top-left-front
  setVoxel(g, 14,14,4, null as unknown as string); // top-right-front

  // === ARMS (y=7..14) ===
  // Left arm (hangs down from body side)
  fillBox(g, 1,7,5, 3,13,7, B);
  fillBox(g, 1,7,5, 3,7,7, D_);   // paw (dark bottom)
  // Right arm
  fillBox(g, 14,7,5, 16,13,7, B);
  fillBox(g, 14,7,5, 16,7,7, D_); // paw

  // === HEAD (y=15..23) ===
  fillBox(g, 3,15,3, 14,23,10, B);
  // Head corners cut (rounded)
  // Front face corners
  for (const [x,y,z] of [[3,15,3],[14,15,3],[3,23,3],[14,23,3],
    [3,15,10],[14,15,10],[3,23,10],[14,23,10],
    [3,22,3],[14,22,3],[3,16,3],[14,16,3]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // === MUZZLE (protrudes 2 blocks forward from head face) ===
  // y=16..19, x=6..11, z=10..11
  fillBox(g, 6,16,10, 11,19,11, M);
  // Muzzle front face top highlight
  fillBox(g, 7,19,11, 10,19,11, BEAR.highlight);

  // === NOSE (on muzzle, y=19, z=12) ===
  setVoxel(g, 8,19,12, N);
  setVoxel(g, 9,19,12, N);
  // Nose protrusion
  setVoxel(g, 8,19,11, N);
  setVoxel(g, 9,19,11, N);

  // === EYES (3×3 black with white highlight, on head front face z=10) ===
  // Left eye at x=5..7, y=19..21
  fillBox(g, 5,19,10, 7,21,10, E);
  setVoxel(g, 5,21,10, Hi);  // highlight top-left
  // Right eye at x=10..12, y=19..21
  fillBox(g, 10,19,10, 12,21,10, E);
  setVoxel(g, 10,21,10, Hi); // highlight top-left

  // === CHEEKS (ほっぺ — ピンク) ===
  setVoxel(g, 4,17,10, '#FFB6C1');
  setVoxel(g, 4,18,10, '#FFB6C1');
  setVoxel(g, 13,17,10, '#FFB6C1');
  setVoxel(g, 13,18,10, '#FFB6C1');

  // === MOUTH ===
  setVoxel(g, 8,16,12, '#555555');
  setVoxel(g, 9,16,12, '#555555');

  // === EARS (small round, y=24..25) ===
  // Left ear
  fillBox(g, 4,24,5, 6,25,8, B);
  fillBox(g, 5,24,6, 5,24,7, L);  // inner ear
  // Right ear
  fillBox(g, 11,24,5, 13,25,8, B);
  fillBox(g, 12,24,6, 12,24,7, L); // inner ear

  // === TAIL (small round bump behind body) ===
  setVoxel(g, 8,10,3, B);
  setVoxel(g, 9,10,3, B);
  setVoxel(g, 8,11,3, B);
  setVoxel(g, 9,11,3, B);

  return g;
}

// ============================================================
// CAT — 参考画像: グレーの縞模様、三角耳、毛糸玉
// Grid: 16W × 24H × 12D
// ============================================================
export function generateCatAvatar(_seed = 100): VoxelData {
  const W = 18, H = 26, D = 14;
  const g = createGrid(W, H, D);
  const C = CAT;

  // FEET
  fillBox(g, 4,0,5, 6,1,7, C.dark);
  fillBox(g, 11,0,5, 13,1,7, C.dark);

  // LEGS
  fillBox(g, 4,2,5, 6,4,7, C.body);
  fillBox(g, 11,2,5, 13,4,7, C.body);

  // BODY
  fillBox(g, 3,5,4, 14,12,9, C.body);
  // Belly (white front)
  for (let dy = 0; dy < 5; dy++) {
    const y = 6 + dy;
    const hw = dy <= 0 || dy >= 4 ? 2 : 3;
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 9 + dx, y, 9, C.belly);
  }

  // ARMS
  fillBox(g, 1,6,5, 3,11,7, C.body);
  fillBox(g, 1,6,5, 3,6,7, C.dark);
  fillBox(g, 14,6,5, 16,11,7, C.body);
  fillBox(g, 14,6,5, 16,6,7, C.dark);

  // HEAD (slightly wider than body, very rounded)
  fillBox(g, 3,13,3, 14,22,10, C.body);
  // Corner cuts
  for (const [x,y,z] of [[3,13,3],[14,13,3],[3,22,3],[14,22,3],
    [3,13,10],[14,13,10],[3,22,10],[14,22,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // Stripes on head (horizontal dark gray lines)
  for (let sx = 5; sx <= 12; sx++) {
    setVoxel(g, sx, 21, 10, C.stripe);
    setVoxel(g, sx, 19, 10, C.stripe);
    setVoxel(g, sx, 22, 6, C.stripe);
    setVoxel(g, sx, 20, 6, C.stripe);
  }

  // MUZZLE
  fillBox(g, 6,14,10, 11,17,11, C.muzzle);

  // NOSE
  setVoxel(g, 8,17,11, C.nose);
  setVoxel(g, 9,17,11, C.nose);

  // EYES
  fillBox(g, 5,17,10, 7,19,10, C.eye);
  setVoxel(g, 5,19,10, C.highlight);
  fillBox(g, 10,17,10, 12,19,10, C.eye);
  setVoxel(g, 10,19,10, C.highlight);

  // CHEEKS (ほっぺ — ピンク)
  setVoxel(g, 4,15,10, '#FFB6C1');
  setVoxel(g, 4,16,10, '#FFB6C1');
  setVoxel(g, 13,15,10, '#FFB6C1');
  setVoxel(g, 13,16,10, '#FFB6C1');

  // POINTED EARS
  fillBox(g, 3,23,5, 5,25,8, C.body);
  setVoxel(g, 4,24,6, C.inner_ear);
  setVoxel(g, 4,23,7, C.inner_ear);
  fillBox(g, 12,23,5, 14,25,8, C.body);
  setVoxel(g, 13,24,6, C.inner_ear);
  setVoxel(g, 13,23,7, C.inner_ear);
  // Pointed tip
  setVoxel(g, 4,25,6, C.body);
  setVoxel(g, 4,25,7, C.body);
  setVoxel(g, 13,25,6, C.body);
  setVoxel(g, 13,25,7, C.body);

  // YARN BALL (held near right arm)
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (dx*dx+dy*dy+dz*dz <= 5) setVoxel(g, 17+dx, 8+dy, 6+dz, '#5BC0EB');
  }

  // TAIL (curved, behind body)
  for (let i = 0; i < 5; i++) {
    const ty = 8 + Math.round(Math.sin(i * 0.5) * 1.5);
    setVoxel(g, 8, ty, 3 - i, C.body);
    setVoxel(g, 9, ty, 3 - i, C.body);
  }

  return g;
}

// ============================================================
// RABBIT — 参考画像: ベージュ、長い耳、小さい体
// ============================================================
export function generateRabbitAvatar(_seed = 200): VoxelData {
  const W = 18, H = 30, D = 14;
  const g = createGrid(W, H, D);
  const R = RABBIT;

  // FEET
  fillBox(g, 4,0,5, 7,1,8, R.paw);
  fillBox(g, 10,0,5, 13,1,8, R.paw);

  // LEGS
  fillBox(g, 5,2,5, 7,4,7, R.body);
  fillBox(g, 10,2,5, 12,4,7, R.body);

  // BODY
  fillBox(g, 4,5,4, 13,12,9, R.body);
  // Belly
  for (let dy = 0; dy < 5; dy++) {
    const y = 6 + dy;
    const hw = dy <= 0 || dy >= 4 ? 2 : 3;
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 9 + dx, y, 9, R.belly);
  }

  // ARMS (thin)
  fillBox(g, 2,6,5, 4,11,7, R.body);
  fillBox(g, 2,6,5, 4,6,7, R.paw);
  fillBox(g, 13,6,5, 15,11,7, R.body);
  fillBox(g, 13,6,5, 15,6,7, R.paw);

  // HEAD (round, big)
  fillBox(g, 3,13,3, 14,22,10, R.body);
  for (const [x,y,z] of [[3,13,3],[14,13,3],[3,22,3],[14,22,3],
    [3,13,10],[14,13,10],[3,22,10],[14,22,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // MUZZLE
  fillBox(g, 6,14,10, 11,17,11, R.muzzle);

  // NOSE (small pink)
  setVoxel(g, 8,17,11, R.nose);
  setVoxel(g, 9,17,11, R.nose);

  // EYES
  fillBox(g, 5,17,10, 7,19,10, R.eye);
  setVoxel(g, 5,19,10, R.highlight);
  fillBox(g, 10,17,10, 12,19,10, R.eye);
  setVoxel(g, 10,19,10, R.highlight);

  // Cheek blush
  setVoxel(g, 4,16,10, '#FFB6C1');
  setVoxel(g, 4,17,10, '#FFB6C1');
  setVoxel(g, 13,16,10, '#FFB6C1');
  setVoxel(g, 13,17,10, '#FFB6C1');

  // LONG EARS (tall, 7 blocks)
  fillBox(g, 5,23,5, 7,29,8, R.body);
  fillBox(g, 6,23,6, 6,28,7, R.inner_ear); // inner pink
  fillBox(g, 10,23,5, 12,29,8, R.body);
  fillBox(g, 11,23,6, 11,28,7, R.inner_ear);

  // TAIL (small white puff)
  fillBox(g, 8,8,3, 9,9,3, R.belly);

  return g;
}

// ============================================================
// DOG — 参考画像: 白い体、茶パッチ、首輪
// ============================================================
export function generateDogAvatar(_seed = 300): VoxelData {
  const W = 18, H = 26, D = 14;
  const g = createGrid(W, H, D);
  const Dg = DOG;

  // FEET
  fillBox(g, 3,0,4, 6,1,8, Dg.dark);
  fillBox(g, 11,0,4, 14,1,8, Dg.dark);

  // LEGS
  fillBox(g, 4,2,5, 6,5,7, Dg.body);
  fillBox(g, 11,2,5, 13,5,7, Dg.body);

  // BODY
  fillBox(g, 3,6,4, 14,14,9, Dg.body);

  // ARMS
  fillBox(g, 1,7,5, 3,13,7, Dg.body);
  fillBox(g, 14,7,5, 16,13,7, Dg.body);

  // HEAD
  fillBox(g, 3,15,3, 14,23,10, Dg.body);
  for (const [x,y,z] of [[3,15,3],[14,15,3],[3,23,3],[14,23,3],
    [3,15,10],[14,15,10],[3,23,10],[14,23,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // Brown patch (top-right of head, like reference)
  for (let y = 20; y <= 23; y++) {
    for (let x = 8; x <= 14; x++) {
      for (let z = 3; z <= 10; z++) {
        if (g[y]?.[z]?.[x] != null) setVoxel(g, x, y, z, Dg.patch);
      }
    }
  }
  // Patch on right ear area
  fillBox(g, 10,20,10, 13,23,10, Dg.patch);

  // MUZZLE
  fillBox(g, 6,16,10, 11,19,11, Dg.muzzle);

  // NOSE (big black)
  fillBox(g, 7,19,11, 10,19,12, Dg.nose);

  // EYES
  fillBox(g, 5,19,10, 7,21,10, Dg.eye);
  setVoxel(g, 5,21,10, '#FFFFFF');
  fillBox(g, 10,19,10, 12,21,10, Dg.eye);
  setVoxel(g, 10,21,10, '#FFFFFF');

  // CHEEKS (ほっぺ — ピンク)
  setVoxel(g, 4,17,10, '#FFB6C1');
  setVoxel(g, 4,18,10, '#FFB6C1');
  setVoxel(g, 13,17,10, '#FFB6C1');
  setVoxel(g, 13,18,10, '#FFB6C1');

  // TONGUE (small red on muzzle)
  setVoxel(g, 8,16,12, Dg.tongue);
  setVoxel(g, 9,16,12, Dg.tongue);

  // COLLAR (blue ring around body top)
  for (let x = 3; x <= 14; x++) for (let z = 4; z <= 9; z++) {
    if (g[14]?.[z]?.[x] != null) setVoxel(g, x, 14, z, Dg.collar);
  }
  // Medal
  setVoxel(g, 9, 13, 9, Dg.medal);

  // FLOPPY EARS (droop down from head sides)
  fillBox(g, 2,19,5, 3,23,8, Dg.patch);
  fillBox(g, 14,19,5, 15,23,8, Dg.patch);
  fillBox(g, 2,17,5, 3,19,8, Dg.patch); // ear droop down

  // TAIL
  for (let i = 0; i < 4; i++) setVoxel(g, 9, 10+i, 3-i, Dg.body);

  return g;
}

// ============================================================
// PANDA — 参考画像: 白黒、黒い目パッチ、黒い四肢
// ============================================================
export function generatePandaAvatar(_seed = 400): VoxelData {
  const W = 18, H = 26, D = 14;
  const g = createGrid(W, H, D);
  const P = PANDA;

  // FEET (black)
  fillBox(g, 3,0,4, 6,1,8, P.black);
  fillBox(g, 11,0,4, 14,1,8, P.black);

  // LEGS (black)
  fillBox(g, 4,2,5, 6,5,7, P.black);
  fillBox(g, 11,2,5, 13,5,7, P.black);

  // BODY (white)
  fillBox(g, 3,6,4, 14,14,9, P.body);

  // ARMS (black)
  fillBox(g, 1,7,5, 3,13,7, P.black);
  fillBox(g, 14,7,5, 16,13,7, P.black);

  // HEAD (white)
  fillBox(g, 3,15,3, 14,23,10, P.body);
  for (const [x,y,z] of [[3,15,3],[14,15,3],[3,23,3],[14,23,3],
    [3,15,10],[14,15,10],[3,23,10],[14,23,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // MUZZLE (white, protruding)
  fillBox(g, 6,16,10, 11,19,11, P.muzzle);

  // NOSE
  setVoxel(g, 8,19,11, P.nose);
  setVoxel(g, 9,19,11, P.nose);

  // BLACK EYE PATCHES (diamond-shaped, larger than eyes)
  // Left patch
  for (let dy = -2; dy <= 2; dy++) {
    const w = Math.abs(dy) <= 1 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) {
      setVoxel(g, 5-dx, 20+dy, 10, P.black);
      setVoxel(g, 6-dx, 20+dy, 10, P.black);
    }
  }
  // Right patch
  for (let dy = -2; dy <= 2; dy++) {
    const w = Math.abs(dy) <= 1 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) {
      setVoxel(g, 11+dx, 20+dy, 10, P.black);
      setVoxel(g, 12+dx, 20+dy, 10, P.black);
    }
  }

  // EYES (white highlight on black patches)
  setVoxel(g, 5, 20, 10, P.highlight);
  setVoxel(g, 12, 20, 10, P.highlight);

  // CHEEKS (ほっぺ — ピンク)
  setVoxel(g, 4,17,10, '#FFB6C1');
  setVoxel(g, 4,18,10, '#FFB6C1');
  setVoxel(g, 13,17,10, '#FFB6C1');
  setVoxel(g, 13,18,10, '#FFB6C1');

  // EARS (black round)
  fillBox(g, 3,23,5, 5,25,8, P.black);
  fillBox(g, 12,23,5, 14,25,8, P.black);

  return g;
}

// ============================================================
// FOX — 参考画像: オレンジ、白い顔V、大きな三角耳、ふさふさ尻尾
// ============================================================
export function generateFoxAvatar(_seed = 500): VoxelData {
  const W = 18, H = 26, D = 16;
  const g = createGrid(W, H, D);
  const F = FOX;

  // FEET (dark)
  fillBox(g, 4,0,6, 6,1,8, F.dark);
  fillBox(g, 11,0,6, 13,1,8, F.dark);

  // LEGS
  fillBox(g, 4,2,6, 6,4,8, F.body);
  fillBox(g, 11,2,6, 13,4,8, F.body);

  // BODY (narrower than bear — fox is slim)
  fillBox(g, 4,5,5, 13,12,10, F.body);
  // White belly
  for (let dy = 0; dy < 5; dy++) {
    const y = 6 + dy;
    const hw = dy <= 0 || dy >= 4 ? 2 : 3;
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 9 + dx, y, 10, F.belly);
  }

  // ARMS (thin)
  fillBox(g, 2,6,6, 4,11,8, F.body);
  fillBox(g, 2,6,6, 4,6,8, F.dark);
  fillBox(g, 13,6,6, 15,11,8, F.body);
  fillBox(g, 13,6,6, 15,6,8, F.dark);

  // HEAD
  fillBox(g, 4,13,4, 13,21,11, F.body);
  for (const [x,y,z] of [[4,13,4],[13,13,4],[4,21,4],[13,21,4],
    [4,13,11],[13,13,11],[4,21,11],[13,21,11]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // White face V-shape (inverted triangle on front)
  for (let dy = 0; dy < 5; dy++) {
    const y = 14 + dy;
    const hw = 4 - dy;
    if (hw <= 0) continue;
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 9 + dx, y, 11, F.light);
  }

  // MUZZLE (longer — fox has pointed muzzle)
  fillBox(g, 7,14,11, 10,17,13, F.muzzle);

  // NOSE
  setVoxel(g, 8,17,13, F.nose);
  setVoxel(g, 9,17,13, F.nose);

  // EYES
  fillBox(g, 5,17,11, 7,19,11, F.eye);
  setVoxel(g, 5,19,11, F.highlight);
  fillBox(g, 10,17,11, 12,19,11, F.eye);
  setVoxel(g, 10,19,11, F.highlight);

  // CHEEKS (ほっぺ — ピンク)
  setVoxel(g, 4,15,11, '#FFB6C1');
  setVoxel(g, 4,16,11, '#FFB6C1');
  setVoxel(g, 13,15,11, '#FFB6C1');
  setVoxel(g, 13,16,11, '#FFB6C1');

  // TALL POINTED EARS (5 blocks tall)
  for (let h = 0; h < 5; h++) {
    const w = Math.max(1, 3 - h);
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 5; dz <= 9; dz++) {
        setVoxel(g, 4+dx, 22+h, dz, F.body);
        setVoxel(g, 13-dx, 22+h, dz, F.body);
      }
    }
  }
  // Inner ear (light)
  setVoxel(g, 5, 23, 7, F.light);
  setVoxel(g, 12, 23, 7, F.light);

  // BUSHY TAIL (behind body, fluffy)
  for (let dy = -2; dy <= 3; dy++) {
    for (let dz = -3; dz <= 0; dz++) {
      const r = 2.5 - Math.abs(dz + 1.5) * 0.5;
      for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
        const c = dz <= -2 ? F.tail_tip : F.body;
        setVoxel(g, 9+dx, 8+dy, 4+dz, c);
      }
    }
  }

  return g;
}

// ============================================================
// PENGUIN — 参考画像: 青い体、白い腹、オレンジくちばし/足
// ============================================================
export function generatePenguinAvatar(_seed = 600): VoxelData {
  const W = 16, H = 22, D = 14;
  const g = createGrid(W, H, D);
  const Pg = PENGUIN;

  // ORANGE FEET
  fillBox(g, 3,0,5, 6,0,8, Pg.feet);
  fillBox(g, 9,0,5, 12,0,8, Pg.feet);

  // SHORT LEGS
  fillBox(g, 4,1,6, 6,2,7, Pg.body);
  fillBox(g, 9,1,6, 11,2,7, Pg.body);

  // BODY (round, wide belly)
  fillBox(g, 3,3,4, 12,11,9, Pg.body);
  // White belly (large oval)
  for (let dy = 0; dy < 7; dy++) {
    const y = 4 + dy;
    const hw = dy <= 0 || dy >= 6 ? 2 : (dy <= 1 || dy >= 5 ? 3 : 4);
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 8 + dx, y, 9, Pg.belly);
  }

  // FLIPPERS (instead of arms — thin, angled)
  fillBox(g, 1,5,5, 3,10,7, Pg.body);
  fillBox(g, 12,5,5, 14,10,7, Pg.body);

  // HEAD (round, slightly blue)
  fillBox(g, 3,12,3, 12,20,10, Pg.body);
  for (const [x,y,z] of [[3,12,3],[12,12,3],[3,20,3],[12,20,3],
    [3,12,10],[12,12,10],[3,20,10],[12,20,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // White face area
  fillBox(g, 5,13,10, 10,18,10, Pg.belly);

  // BEAK (orange, protruding)
  fillBox(g, 6,15,10, 9,16,12, Pg.beak);

  // EYES (small, 2×2)
  fillBox(g, 5,17,10, 6,18,10, Pg.eye);
  setVoxel(g, 5,18,10, Pg.highlight);
  fillBox(g, 9,17,10, 10,18,10, Pg.eye);
  setVoxel(g, 9,18,10, Pg.highlight);

  // CHEEKS
  setVoxel(g, 4,15,10, Pg.cheek);
  setVoxel(g, 4,16,10, Pg.cheek);
  setVoxel(g, 11,15,10, Pg.cheek);
  setVoxel(g, 11,16,10, Pg.cheek);

  return g;
}

// ============================================================
// HAMSTER — 参考画像: 巨大な頭、小さい体、頬袋、ひまわりの種
// ============================================================
export function generateHamsterAvatar(_seed = 700): VoxelData {
  const W = 18, H = 22, D = 14;
  const g = createGrid(W, H, D);
  const Hm = HAMSTER;

  // TINY FEET (pink)
  fillBox(g, 5,0,5, 7,0,7, Hm.paw);
  fillBox(g, 10,0,5, 12,0,7, Hm.paw);

  // SHORT LEGS
  fillBox(g, 5,1,5, 7,2,7, Hm.body);
  fillBox(g, 10,1,5, 12,2,7, Hm.body);

  // SMALL BODY
  fillBox(g, 4,3,4, 13,8,9, Hm.body);
  // Belly
  for (let dy = 0; dy < 4; dy++) {
    const y = 4 + dy;
    const hw = dy <= 0 || dy >= 3 ? 2 : 3;
    for (let dx = -hw; dx <= hw; dx++) setVoxel(g, 9 + dx, y, 9, Hm.belly);
  }

  // TINY ARMS
  fillBox(g, 2,4,5, 4,7,7, Hm.body);
  fillBox(g, 13,4,5, 15,7,7, Hm.body);

  // HUGE HEAD (larger than body!)
  fillBox(g, 2,9,3, 15,20,10, Hm.body);
  for (const [x,y,z] of [[2,9,3],[15,9,3],[2,20,3],[15,20,3],
    [2,9,10],[15,9,10],[2,20,10],[15,20,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // CHEEK POUCHES (protrude beyond head!)
  fillBox(g, 1,12,5, 2,16,8, Hm.cheek);
  fillBox(g, 15,12,5, 16,16,8, Hm.cheek);

  // Head stripe
  for (let z = 3; z <= 10; z++) {
    setVoxel(g, 8, 20, z, Hm.stripe);
    setVoxel(g, 9, 20, z, Hm.stripe);
  }

  // MUZZLE
  fillBox(g, 6,10,10, 11,14,11, Hm.light);

  // NOSE
  setVoxel(g, 8,14,11, Hm.nose);
  setVoxel(g, 9,14,11, Hm.nose);

  // EYES
  fillBox(g, 5,14,10, 7,16,10, Hm.eye);
  setVoxel(g, 5,16,10, '#FFFFFF');
  fillBox(g, 10,14,10, 12,16,10, Hm.eye);
  setVoxel(g, 10,16,10, '#FFFFFF');

  // ROUND EARS
  fillBox(g, 3,20,5, 5,21,8, Hm.body);
  setVoxel(g, 4,20,6, Hm.paw);
  fillBox(g, 12,20,5, 14,21,8, Hm.body);
  setVoxel(g, 13,20,6, Hm.paw);

  // SUNFLOWER SEED (held in paws)
  fillBox(g, 7,5,10, 9,7,11, Hm.seed);
  setVoxel(g, 8,7,11, '#6B5510');

  return g;
}

// ============================================================
// FROG — 緑カエル: 大きな目、丸い体、ぴょんと跳ねるポーズ
// Grid: 18W × 26H × 14D (他アバターと同じ)
// ============================================================
const FROG = {
  body: '#4CAF50',      // メイングリーン
  dark: '#388E3C',      // ダークグリーン（影、足裏）
  light: '#81C784',     // ライトグリーン（ハイライト）
  belly: '#C8E6C9',     // ベリー（白っぽいグリーン）
  eye: '#1A1A1A',       // 黒（瞳）
  eyeWhite: '#FFFFFF',  // 白目
  highlight: '#FFFFFF',  // ハイライト
  cheek: '#FFB6C1',     // ほっぺ（ピンク）
  mouth: '#2E7D32',     // 口
};

export function generateFrogAvatar(_seed = 800): VoxelData {
  const W = 18, H = 26, D = 14;
  const g = createGrid(W, H, D);
  const F = FROG;

  // === FEET (y=0..1) — 水かき付きの広い足 ===
  // Left foot (wide, webbed)
  fillBox(g, 2,0,4, 7,0,9, F.dark);
  fillBox(g, 3,1,5, 6,1,8, F.body);
  // Webbing detail (front toes)
  setVoxel(g, 2,0,9, F.light);
  setVoxel(g, 4,0,9, F.light);
  setVoxel(g, 7,0,9, F.light);
  // Right foot
  fillBox(g, 10,0,4, 15,0,9, F.dark);
  fillBox(g, 11,1,5, 14,1,8, F.body);
  setVoxel(g, 10,0,9, F.light);
  setVoxel(g, 13,0,9, F.light);
  setVoxel(g, 15,0,9, F.light);

  // === LEGS (y=2..5) — 短くてがっしり ===
  fillBox(g, 4,2,5, 6,4,7, F.body);
  fillBox(g, 11,2,5, 13,4,7, F.body);
  // Inner thigh highlight
  fillBox(g, 5,3,6, 5,4,6, F.light);
  fillBox(g, 12,3,6, 12,4,6, F.light);

  // === BODY (y=5..13) — 丸くてぷっくり ===
  fillBox(g, 3,5,4, 14,13,9, F.body);
  // Belly (front face, lighter green-white)
  for (let dy = 0; dy < 7; dy++) {
    const y = 6 + dy;
    const hw = dy <= 1 || dy >= 5 ? 2 : (dy <= 2 || dy >= 4 ? 3 : 4);
    for (let dx = -hw; dx <= hw; dx++) {
      setVoxel(g, 9 + dx, y, 9, F.belly);
    }
  }
  // Body corners cut (rounded look)
  setVoxel(g, 3,5,4, null as unknown as string);
  setVoxel(g, 14,5,4, null as unknown as string);
  setVoxel(g, 3,5,9, null as unknown as string);
  setVoxel(g, 14,5,9, null as unknown as string);
  setVoxel(g, 3,13,4, null as unknown as string);
  setVoxel(g, 14,13,4, null as unknown as string);
  // Back spine highlight
  for (let y = 6; y <= 12; y++) {
    setVoxel(g, 8, y, 4, F.light);
    setVoxel(g, 9, y, 4, F.light);
  }

  // === ARMS (y=6..12) — 短めの腕 ===
  fillBox(g, 1,6,5, 3,12,7, F.body);
  fillBox(g, 1,6,5, 3,6,7, F.dark);  // hand (dark)
  fillBox(g, 14,6,5, 16,12,7, F.body);
  fillBox(g, 14,6,5, 16,6,7, F.dark);

  // === HEAD (y=14..23) — 横に大きく丸い ===
  fillBox(g, 2,14,3, 15,22,10, F.body);
  // Head top (rounded)
  fillBox(g, 3,23,4, 14,23,9, F.body);
  // Corner cuts for roundness
  for (const [x,y,z] of [[2,14,3],[15,14,3],[2,22,3],[15,22,3],
    [2,14,10],[15,14,10],[2,22,10],[15,22,10],
    [2,23,3],[15,23,3],[2,23,10],[15,23,10]]) {
    setVoxel(g, x as number, y as number, z as number, null as unknown as string);
  }

  // === EYES (y=18..22) — カエルの特徴的な大きく飛び出た目 ===
  // Eye bumps on top of head
  // Left eye socket
  fillBox(g, 3,21,9, 6,24,11, F.body);
  // Left eye white
  fillBox(g, 4,22,10, 5,23,11, F.eyeWhite);
  // Left pupil
  setVoxel(g, 4,23,11, F.eye);
  setVoxel(g, 5,23,11, F.eye);
  setVoxel(g, 4,22,11, F.eye);
  setVoxel(g, 5,22,11, F.eye);
  // Left highlight
  setVoxel(g, 4,23,11, F.highlight);

  // Right eye socket
  fillBox(g, 11,21,9, 14,24,11, F.body);
  // Right eye white
  fillBox(g, 12,22,10, 13,23,11, F.eyeWhite);
  // Right pupil
  setVoxel(g, 12,23,11, F.eye);
  setVoxel(g, 13,23,11, F.eye);
  setVoxel(g, 12,22,11, F.eye);
  setVoxel(g, 13,22,11, F.eye);
  // Right highlight
  setVoxel(g, 12,23,11, F.highlight);

  // === CHEEKS (ほっぺ — ピンク) ===
  setVoxel(g, 3,17,10, F.cheek);
  setVoxel(g, 4,17,10, F.cheek);
  setVoxel(g, 13,17,10, F.cheek);
  setVoxel(g, 14,17,10, F.cheek);

  // === MOUTH (wide, カエルらしい横に広い口) ===
  // Wide smile on front face z=10
  for (let x = 5; x <= 12; x++) {
    setVoxel(g, x, 16, 10, F.mouth);
  }
  // Mouth corners curve up
  setVoxel(g, 4, 17, 10, F.mouth);
  setVoxel(g, 13, 17, 10, F.mouth);

  // === NOSTRILS ===
  setVoxel(g, 7, 19, 10, F.dark);
  setVoxel(g, 10, 19, 10, F.dark);

  // === SPOTS/PATTERN (背中の模様) ===
  setVoxel(g, 5, 11, 4, F.dark);
  setVoxel(g, 12, 9, 4, F.dark);
  setVoxel(g, 7, 8, 4, F.dark);
  setVoxel(g, 10, 12, 4, F.dark);

  return g;
}

// ============================================================
// Public API
// ============================================================
export function generateCubicAvatar(id: string, _opts: Record<string, string> = {}, s = 42): VoxelData {
  const m: Record<string, (s: number) => VoxelData> = {
    bear: generateBearAvatar, cat: generateCatAvatar, rabbit: generateRabbitAvatar,
    dog: generateDogAvatar, panda: generatePandaAvatar, fox: generateFoxAvatar,
    penguin: generatePenguinAvatar, frog: generateFrogAvatar,
  };
  return (m[id] ?? generateBearAvatar)(s);
}

export type CubicBodyPlan = { id: string };
export const CUBIC_PLANS: Record<string, CubicBodyPlan> = {
  bear: { id: 'bear' }, cat: { id: 'cat' }, rabbit: { id: 'rabbit' }, dog: { id: 'dog' },
  panda: { id: 'panda' }, fox: { id: 'fox' }, penguin: { id: 'penguin' }, frog: { id: 'frog' },
};
