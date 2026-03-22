/**
 * VoxelAvatars v8 — Box-Based Crisp Voxel Avatars
 *
 * DESIGN RULES (from reference analysis):
 * 1. BOX-BASED: Use fillRoundedBox3D with cornerR=1 (just 1 voxel cut)
 * 2. FLAT FACE: Eyes/nose/mouth drawn directly on flat front surface
 * 3. MUZZLE: White area painted on face, protrusion MAX 1 voxel
 * 4. STRAIGHT ARMS: Simple rectangular blocks hanging down, no L-shape
 * 5. STRIPES: Clean horizontal lines evenly spaced
 * 6. BIG EYES: 3×3 black rectangles with white highlight in upper-left
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import { fillRoundedBox3D, adjustBrightness } from './VoxelPrimitives';

// ============================================================
// Color helpers
// ============================================================
type CP = { base: string; shadow: string; highlight: string };
function cp(base: string): CP {
  return { base, shadow: adjustBrightness(base, 0.75), highlight: adjustBrightness(base, 1.15) };
}

// ============================================================
// Face drawing helpers (on flat front face)
// ============================================================

/** Draw a 3×3 eye with white highlight at top-left */
function drawEye(g: VoxelData, x: number, y: number, z: number, black = '#1A1A1A') {
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) setVoxel(g, x+dx, y+dy, z, black);
  setVoxel(g, x, y+2, z, '#FFFFFF'); // highlight top-left
}

/** Draw pink triangular nose (2×2) */
function drawNose(g: VoxelData, cx: number, y: number, z: number, color = '#FFB0B0') {
  setVoxel(g, cx, y+1, z, color);
  setVoxel(g, cx+1, y+1, z, color);
  setVoxel(g, cx, y, z, color);
  setVoxel(g, cx+1, y, z, color);
}

/** Draw mouth line */
function drawMouth(g: VoxelData, cx: number, y: number, z: number, w = 4, color = '#666666') {
  for (let dx = 0; dx < w; dx++) setVoxel(g, cx - Math.floor(w/2) + dx, y, z, color);
}

/** Paint white muzzle area (elliptical mask on front face) */
function paintMuzzle(g: VoxelData, cx: number, cy: number, z: number, rx: number, ry: number, color = '#FFFFFF') {
  for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
    if ((dx/rx)**2 + (dy/ry)**2 <= 1.0) setVoxel(g, cx+dx, cy+dy, z, color);
  }
}

/** Draw horizontal stripes on front face */
function drawStripes(g: VoxelData, x1: number, x2: number, y: number, z: number, color: string, spacing = 3, count = 3) {
  for (let i = 0; i < count; i++) {
    const sy = y - i * spacing;
    for (let x = x1; x <= x2; x++) setVoxel(g, x, sy, z, color);
  }
}

// ============================================================
// Ear builders
// ============================================================
function buildPointedEars(g: VoxelData, cx: number, topY: number, fz: number, bz: number, headW: number, bodyColor: string, innerColor: string, h = 3) {
  const earDx = Math.floor(headW / 2) - 1;
  for (let hi = 0; hi < h; hi++) {
    const w = Math.max(1, 2 - Math.floor(hi * 0.7));
    for (let dx = 0; dx < w; dx++) {
      for (let dz = fz; dz <= bz; dz++) {
        const inner = dx === 0 && dz === fz + 1 && hi < h - 1;
        setVoxel(g, cx - earDx + dx, topY + hi, dz, inner ? innerColor : bodyColor);
        setVoxel(g, cx + earDx - dx + 1, topY + hi, dz, inner ? innerColor : bodyColor);
      }
    }
  }
}

function buildRoundEars(g: VoxelData, cx: number, topY: number, fz: number, bz: number, headW: number, bodyColor: string, innerColor: string) {
  const earDx = Math.floor(headW / 2) - 1;
  // 3×3 round ears (bigger, more visible)
  for (let dz = fz; dz <= bz; dz++) {
    // Bottom row (3 wide)
    setVoxel(g, cx - earDx - 1, topY, dz, bodyColor);
    setVoxel(g, cx - earDx, topY, dz, bodyColor);
    setVoxel(g, cx - earDx + 1, topY, dz, bodyColor);
    setVoxel(g, cx + earDx - 1, topY, dz, bodyColor);
    setVoxel(g, cx + earDx, topY, dz, bodyColor);
    setVoxel(g, cx + earDx + 1, topY, dz, bodyColor);
    // Middle row (3 wide)
    setVoxel(g, cx - earDx - 1, topY + 1, dz, bodyColor);
    setVoxel(g, cx - earDx, topY + 1, dz, bodyColor);
    setVoxel(g, cx - earDx + 1, topY + 1, dz, bodyColor);
    setVoxel(g, cx + earDx - 1, topY + 1, dz, bodyColor);
    setVoxel(g, cx + earDx, topY + 1, dz, bodyColor);
    setVoxel(g, cx + earDx + 1, topY + 1, dz, bodyColor);
    // Top row (1 wide — rounded top)
    setVoxel(g, cx - earDx, topY + 2, dz, bodyColor);
    setVoxel(g, cx + earDx, topY + 2, dz, bodyColor);
  }
  // Inner color (visible on front face, 2×2 area)
  const ifz = fz + Math.floor((bz - fz) / 2); // mid-depth for inner
  setVoxel(g, cx - earDx, topY, ifz, innerColor);
  setVoxel(g, cx - earDx, topY + 1, ifz, innerColor);
  setVoxel(g, cx + earDx, topY, ifz, innerColor);
  setVoxel(g, cx + earDx, topY + 1, ifz, innerColor);
}

function buildLongEars(g: VoxelData, cx: number, topY: number, fz: number, bz: number, _headW: number, bodyColor: string, innerColor: string, h = 7) {
  const earDx = 3;
  for (let hi = 0; hi < h; hi++) {
    const w = hi < h - 1 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) for (let dz = fz; dz <= bz; dz++) {
      const inner = dx === 0 && dz > fz && dz < bz;
      setVoxel(g, cx - earDx + dx, topY + hi, dz, inner ? innerColor : bodyColor);
      setVoxel(g, cx + earDx - dx + 1, topY + hi, dz, inner ? innerColor : bodyColor);
    }
  }
}

function buildFloppyEars(g: VoxelData, cx: number, midY: number, fz: number, bz: number, headW: number, bodyColor: string, h = 5) {
  const earDx = Math.floor(headW / 2) + 1;
  for (let hi = 0; hi < h; hi++) for (let dz = fz; dz <= bz; dz++) {
    setVoxel(g, cx - earDx, midY - hi, dz, bodyColor);
    setVoxel(g, cx - earDx - 1, midY - hi, dz, bodyColor);
    setVoxel(g, cx + earDx, midY - hi, dz, bodyColor);
    setVoxel(g, cx + earDx + 1, midY - hi, dz, bodyColor);
  }
}

// ============================================================
// Generic avatar builder
// ============================================================
interface AvatarSpec {
  body: CP; belly: CP;
  headW: number; headH: number; headD: number;
  bodyW: number; bodyH: number; bodyD: number;
  armW: number; armH: number; armD: number;
  legW: number; legH: number; legD: number;
  legSpacing: number;
  bellyW: number; bellyH: number;
  noseColor: string;
  eyeSpacing: number; // distance from center to eye inner edge
  buildEars: (g: VoxelData, cx: number, topY: number, fz: number, bz: number, headW: number) => void;
  buildTail?: (g: VoxelData, cx: number, y: number, z: number) => void;
  buildItem?: (g: VoxelData, x: number, y: number, z: number) => void;
  drawFaceExtras?: (g: VoxelData, cx: number, headY: number, headW: number, headH: number, fz: number) => void;
  buildSpecial?: (g: VoxelData, cx: number, cz: number, headY: number, bodyY: number, headW: number, headH: number, bodyW: number, bodyH: number, armLX: number, armRX: number, armY: number, legY: number) => void;
}

function buildAvatar(spec: AvatarSpec): VoxelData {
  const S = spec;
  const totalW = Math.max(S.headW, S.bodyW) + S.armW * 2 + 10;
  const earH = 6;
  const totalH = S.legH + S.bodyH + S.headH + earH + 4;
  const totalD = Math.max(S.headD, S.bodyD) + 10;
  const g = createGrid(totalW, totalH, totalD);
  const cx = Math.floor(totalW / 2), cz = Math.floor(totalD / 2);

  // ===== LEGS =====
  const legY = 0;
  const lx1 = cx - S.legSpacing - S.legW, lx2 = cx + S.legSpacing + 1;
  const lz1 = cz - Math.floor(S.legD / 2);
  fillBox(g, lx1, legY, lz1, lx1+S.legW-1, legY+S.legH-1, lz1+S.legD-1, S.body.base);
  fillBox(g, lx2, legY, lz1, lx2+S.legW-1, legY+S.legH-1, lz1+S.legD-1, S.body.base);
  // Leg shadow (bottom row)
  fillBox(g, lx1, legY, lz1, lx1+S.legW-1, legY, lz1+S.legD-1, S.body.shadow);
  fillBox(g, lx2, legY, lz1, lx2+S.legW-1, legY, lz1+S.legD-1, S.body.shadow);

  // ===== BODY =====
  const bodyY = S.legH;
  const bx1 = cx - Math.floor(S.bodyW / 2), bz1 = cz - Math.floor(S.bodyD / 2);
  fillRoundedBox3D(g, bx1, bodyY, bz1, bx1+S.bodyW-1, bodyY+S.bodyH-1, bz1+S.bodyD-1, S.body.base, 1);
  // Body top highlight
  fillBox(g, bx1+1, bodyY+S.bodyH-1, bz1+1, bx1+S.bodyW-2, bodyY+S.bodyH-1, bz1+S.bodyD-2, S.body.highlight);
  // Body bottom shadow
  fillBox(g, bx1+1, bodyY, bz1+1, bx1+S.bodyW-2, bodyY, bz1+S.bodyD-2, S.body.shadow);

  // ===== BELLY (rectangle on front face) =====
  const bodyFZ = bz1 + S.bodyD - 1;
  const bellyCX = cx - Math.floor(S.bellyW / 2);
  const bellyCY = bodyY + 1;
  fillBox(g, bellyCX, bellyCY, bodyFZ, bellyCX+S.bellyW-1, bellyCY+S.bellyH-1, bodyFZ, S.belly.base);

  // ===== ARMS (straight rectangular blocks) =====
  const armY = bodyY + S.bodyH - S.armH;
  const armLX = bx1 - S.armW, armRX = bx1 + S.bodyW;
  const az1 = cz - Math.floor(S.armD / 2);
  fillBox(g, armLX, armY, az1, armLX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.base);
  fillBox(g, armRX, armY, az1, armRX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.base);
  // Arm shadows
  fillBox(g, armLX, armY, az1, armLX+S.armW-1, armY, az1+S.armD-1, S.body.shadow);
  fillBox(g, armRX, armY, az1, armRX+S.armW-1, armY, az1+S.armD-1, S.body.shadow);

  // ===== HEAD =====
  const headY = bodyY + S.bodyH;
  const hx1 = cx - Math.floor(S.headW / 2), hz1 = cz - Math.floor(S.headD / 2);
  fillRoundedBox3D(g, hx1, headY, hz1, hx1+S.headW-1, headY+S.headH-1, hz1+S.headD-1, S.body.base, 1);
  // Head top highlight
  fillBox(g, hx1+1, headY+S.headH-1, hz1+1, hx1+S.headW-2, headY+S.headH-1, hz1+S.headD-2, S.body.highlight);
  const headFZ = hz1 + S.headD - 1;

  // ===== FACE =====
  // Muzzle area (white elliptical zone on front face)
  paintMuzzle(g, cx, headY + Math.floor(S.headH * 0.35), headFZ, Math.floor(S.headW * 0.3), Math.floor(S.headH * 0.3), S.belly.base);

  // Eyes (3×3 black with white highlight)
  const eyeY = headY + Math.floor(S.headH * 0.5);
  drawEye(g, cx - S.eyeSpacing - 2, eyeY, headFZ);
  drawEye(g, cx + S.eyeSpacing, eyeY, headFZ);

  // Nose
  drawNose(g, cx - 1, headY + Math.floor(S.headH * 0.35), headFZ, S.noseColor);

  // Mouth
  drawMouth(g, cx, headY + Math.floor(S.headH * 0.2), headFZ, 4);

  // Face extras (stripes, patches, etc.)
  if (S.drawFaceExtras) S.drawFaceExtras(g, cx, headY, S.headW, S.headH, headFZ);

  // ===== EARS =====
  S.buildEars(g, cx, headY + S.headH, hz1, hz1 + S.headD - 1, S.headW);

  // ===== TAIL =====
  if (S.buildTail) S.buildTail(g, cx, bodyY + Math.floor(S.bodyH / 2), bz1 - 1);

  // ===== HELD ITEM =====
  if (S.buildItem) S.buildItem(g, armRX + S.armW, armY + 1, cz);

  // ===== SPECIAL =====
  if (S.buildSpecial) S.buildSpecial(g, cx, cz, headY, bodyY, S.headW, S.headH, S.bodyW, S.bodyH, armLX, armRX, armY, legY);

  return g;
}

// ============================================================
// Yarn ball (for cat)
// ============================================================
function makeYarnBall(g: VoxelData, x: number, y: number, z: number, r = 3, color = '#5BC0EB') {
  const dark = adjustBrightness(color, 0.85);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (dx*dx + dy*dy + dz*dz <= r*r) {
      const isGroove = (dy + dx) % 3 === 0;
      setVoxel(g, x+dx, y+dy, z+dz, isGroove ? dark : color);
    }
  }
}

// ============================================================
// Avatar definitions
// ============================================================
export function generateBearAvatar(_seed = 42): VoxelData {
  return buildAvatar({
    body: cp('#A07030'), belly: cp('#D4B478'),
    headW: 13, headH: 11, headD: 10,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 3, armH: 8, armD: 3,
    legW: 4, legH: 5, legD: 4, legSpacing: 1,
    bellyW: 7, bellyH: 7,
    noseColor: '#2D1B0E', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#A07030', '#C49060'),
    buildTail: (g, cx, y, z) => {
      // Small round tail (2×2×2)
      setVoxel(g, cx, y, z, '#A07030');
      setVoxel(g, cx+1, y, z, '#A07030');
      setVoxel(g, cx, y+1, z, '#A07030');
      setVoxel(g, cx+1, y+1, z, '#A07030');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // ===== BLUSH CHEEKS (pink, outside eyes) =====
      const cheekY = headY + Math.floor(headH * 0.4);
      const cheekDx = Math.floor(headW / 2) - 1;
      setVoxel(g, cx - cheekDx, cheekY, fz, '#FFB6C1');
      setVoxel(g, cx - cheekDx, cheekY + 1, fz, '#FFB6C1');
      setVoxel(g, cx + cheekDx, cheekY, fz, '#FFB6C1');
      setVoxel(g, cx + cheekDx, cheekY + 1, fz, '#FFB6C1');

      // ===== PROTRUDING NOSE (1 block forward) =====
      setVoxel(g, cx, headY + Math.floor(headH * 0.35), fz + 1, '#2D1B0E');
      setVoxel(g, cx - 1, headY + Math.floor(headH * 0.35), fz + 1, '#2D1B0E');
    },
    buildItem: (g, x, y, z) => {
      // ===== HONEY JAR (improved, rounder, with detail) =====
      // Jar body (golden, 4 wide × 4 tall × 3 deep)
      fillBox(g, x, y, z-1, x+3, y+3, z+1, '#FFD54F');
      // Jar shadow (bottom row darker)
      fillBox(g, x, y, z-1, x+3, y, z+1, '#E6B800');
      // Jar highlight (top row brighter)
      fillBox(g, x, y+3, z-1, x+3, y+3, z+1, '#FFE082');
      // Lid (brown, slightly wider)
      fillBox(g, x, y+4, z-1, x+3, y+4, z+1, '#8B4513');
      // Honey drip detail (1 dot on front)
      setVoxel(g, x+1, y+2, z+1, '#E6B800');
      // "H" label (dark dot pattern on front)
      setVoxel(g, x+1, y+1, z+2, '#B8860B');
      setVoxel(g, x+2, y+1, z+2, '#B8860B');
    },
    buildSpecial: (g, cx, _cz, _hY, _bY, _hw, _hh, _bw, _bh, _alx, _arx, _ay, legY) => {
      // ===== DARKER LEG BOTTOMS (paw pads) =====
      const padColor = '#5C3D1E';
      const lz1 = Math.floor(g[0].length / 2) - 2;
      const lx1 = cx - 1 - 4, lx2 = cx + 1 + 1;
      // Left paw pad
      setVoxel(g, lx1 + 1, legY, lz1 + 1, padColor);
      setVoxel(g, lx1 + 2, legY, lz1 + 1, padColor);
      setVoxel(g, lx1 + 1, legY, lz1 + 2, padColor);
      setVoxel(g, lx1 + 2, legY, lz1 + 2, padColor);
      // Right paw pad
      setVoxel(g, lx2 + 1, legY, lz1 + 1, padColor);
      setVoxel(g, lx2 + 2, legY, lz1 + 1, padColor);
      setVoxel(g, lx2 + 1, legY, lz1 + 2, padColor);
      setVoxel(g, lx2 + 2, legY, lz1 + 2, padColor);
    },
  });
}

export function generateCatAvatar(_seed = 100): VoxelData {
  return buildAvatar({
    body: cp('#9E9E9E'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 9,
    bodyW: 11, bodyH: 9, bodyD: 8,
    armW: 3, armH: 7, armD: 3,
    legW: 3, legH: 4, legD: 3, legSpacing: 1,
    bellyW: 7, bellyH: 6,
    noseColor: '#FFB0B0', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildPointedEars(g, cx, y, fz, bz, hw, '#9E9E9E', '#FFB6C1', 3),
    buildTail: (g, cx, y, z) => {
      for (let i = 0; i < 6; i++) {
        const ty = y + Math.round(Math.sin(i * 0.5) * 1.5);
        setVoxel(g, cx, ty, z - i, '#9E9E9E');
        setVoxel(g, cx+1, ty, z - i, '#9E9E9E');
      }
    },
    buildItem: (g, x, y, z) => makeYarnBall(g, x + 2, y + 2, z, 3, '#5BC0EB'),
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // Horizontal stripes on head top (dark gray)
      const sc = '#707070';
      const hx1 = cx - Math.floor(headW / 2) + 2;
      const hx2 = cx + Math.floor(headW / 2) - 2;
      drawStripes(g, hx1, hx2, headY + headH - 2, fz, sc, 3, 3);
    },
  });
}

export function generateRabbitAvatar(_seed = 200): VoxelData {
  return buildAvatar({
    body: cp('#D4BC96'), belly: cp('#F5EDE0'),
    headW: 13, headH: 11, headD: 10,
    bodyW: 11, bodyH: 9, bodyD: 8,
    armW: 3, armH: 6, armD: 3,
    legW: 4, legH: 4, legD: 4, legSpacing: 1,
    bellyW: 7, bellyH: 6,
    noseColor: '#FFB0B0', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildLongEars(g, cx, y, fz, bz, hw, '#D4BC96', '#FFAABB', 7),
    drawFaceExtras: (g, cx, headY, _hw, headH, fz) => {
      // Pink cheeks
      setVoxel(g, cx - 5, headY + Math.floor(headH * 0.35), fz, '#FFB6C1');
      setVoxel(g, cx + 5, headY + Math.floor(headH * 0.35), fz, '#FFB6C1');
    },
  });
}

export function generateDogAvatar(_seed = 300): VoxelData {
  return buildAvatar({
    body: cp('#F0E8E0'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 10,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 3, armH: 8, armD: 3,
    legW: 4, legH: 5, legD: 4, legSpacing: 1,
    bellyW: 7, bellyH: 7,
    noseColor: '#2D1B0E', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildFloppyEars(g, cx, y - 2, fz, bz, hw, '#C49050', 5),
    buildTail: (g, cx, y, z) => {
      for (let i = 0; i < 5; i++) setVoxel(g, cx, y + i, z - i, '#F0E8E0');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // Brown patch on top of head
      const pc = '#C49050';
      const hx2 = cx + Math.floor(headW / 2);
      for (let dy = Math.floor(headH * 0.6); dy < headH; dy++) {
        for (let dx = 0; dx < Math.floor(headW / 2); dx++) {
          setVoxel(g, cx + dx, headY + dy, fz, pc);
        }
      }
      // Tongue
      drawMouth(g, cx, headY + Math.floor(headH * 0.15), fz, 2, '#FF6B8A');
    },
    buildSpecial: (g, cx, cz, _hY, bodyY, _hw, _hh, bodyW, bodyH) => {
      // Blue collar
      const collarY = bodyY + bodyH - 1;
      const bx1 = cx - Math.floor(bodyW / 2);
      const bz1 = cz - Math.floor(9 / 2);
      for (let dx = 0; dx < bodyW; dx++) for (let dz = 0; dz < 9; dz++) {
        if (g[collarY]?.[bz1+dz]?.[bx1+dx] != null) setVoxel(g, bx1+dx, collarY, bz1+dz, '#4488CC');
      }
      // Medal
      setVoxel(g, cx, collarY - 1, cz + Math.floor(9 / 2), '#FFD700');
    },
  });
}

export function generatePandaAvatar(_seed = 400): VoxelData {
  return buildAvatar({
    body: cp('#F5F5F5'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 10,
    bodyW: 12, bodyH: 10, bodyD: 9,
    armW: 3, armH: 8, armD: 3,
    legW: 4, legH: 5, legD: 4, legSpacing: 1,
    bellyW: 8, bellyH: 7,
    noseColor: '#1A1A1A', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#1A1A1A', '#1A1A1A'),
    buildSpecial: (g, cx, cz, headY, bodyY, headW, headH, bodyW, _bH, armLX, armRX, armY, legY) => {
      const bk = '#1A1A1A';
      const headFZ = cz + Math.floor(10 / 2) - 1;
      // Black eye patches (larger than eyes)
      for (let dy = -1; dy <= 3; dy++) {
        const w = (dy <= 0 || dy >= 3) ? 2 : 3;
        for (let dx = 0; dx < w; dx++) {
          setVoxel(g, cx - 3 - dx, headY + Math.floor(headH * 0.5) + dy, headFZ, bk);
          setVoxel(g, cx + 3 + dx, headY + Math.floor(headH * 0.5) + dy, headFZ, bk);
        }
      }
      // Black arms
      const az1 = cz - 1;
      fillBox(g, armLX, armY, az1, armLX+2, armY+7, az1+2, bk);
      fillBox(g, armRX, armY, az1, armRX+2, armY+7, az1+2, bk);
      // Black legs
      const lz1 = cz - 2;
      fillBox(g, cx-1-4, legY, lz1, cx-1-1, legY+4, lz1+3, bk);
      fillBox(g, cx+2, legY, lz1, cx+5, legY+4, lz1+3, bk);
    },
  });
}

export function generateFoxAvatar(_seed = 500): VoxelData {
  return buildAvatar({
    body: cp('#E07830'), belly: cp('#FFF5E6'),
    headW: 13, headH: 11, headD: 9,
    bodyW: 11, bodyH: 9, bodyD: 8,
    armW: 3, armH: 7, armD: 3,
    legW: 3, legH: 4, legD: 3, legSpacing: 1,
    bellyW: 7, bellyH: 6,
    noseColor: '#1A1A1A', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildPointedEars(g, cx, y, fz, bz, hw, '#E07830', '#FFF5E6', 4),
    buildTail: (g, cx, y, z) => {
      for (let i = 0; i < 5; i++) {
        const w = Math.min(2, i);
        for (let dx = -w; dx <= w; dx++) for (let dy = -w; dy <= w; dy++) {
          if (dx*dx+dy*dy <= w*w+1) setVoxel(g, cx+dx, y+dy, z-i, i >= 3 ? '#FFFFFF' : '#E07830');
        }
      }
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // White lower face (V-shape)
      for (let dy = 0; dy < Math.floor(headH * 0.5); dy++) {
        const w = Math.floor(headW * 0.3) - Math.floor(dy * 0.5);
        if (w <= 0) continue;
        for (let dx = -w; dx <= w; dx++) setVoxel(g, cx + dx, headY + dy, fz, '#FFF5E6');
      }
    },
  });
}

export function generatePenguinAvatar(_seed = 600): VoxelData {
  return buildAvatar({
    body: cp('#3A5080'), belly: cp('#FFFFFF'),
    headW: 11, headH: 10, headD: 9,
    bodyW: 10, bodyH: 9, bodyD: 8,
    armW: 2, armH: 7, armD: 2,
    legW: 3, legH: 2, legD: 3, legSpacing: 1,
    bellyW: 7, bellyH: 7,
    noseColor: '#FF8C00', eyeSpacing: 2,
    buildEars: () => {}, // No ears
    drawFaceExtras: (g, cx, headY, _hw, headH, fz) => {
      // Orange beak protrusion
      setVoxel(g, cx, headY + Math.floor(headH * 0.3), fz + 1, '#FF8C00');
      setVoxel(g, cx+1, headY + Math.floor(headH * 0.3), fz + 1, '#FF8C00');
    },
    buildSpecial: (g, cx, cz, _hY, _bY, _hw, _hh, _bw, _bh, _alx, _arx, _ay, legY) => {
      // Orange feet
      const lz = cz - 1;
      fillBox(g, cx-4, legY, lz, cx-2, legY, lz+2, '#FF8C00');
      fillBox(g, cx+2, legY, lz, cx+4, legY, lz+2, '#FF8C00');
    },
  });
}

export function generateHamsterAvatar(_seed = 700): VoxelData {
  return buildAvatar({
    body: cp('#E8C8A0'), belly: cp('#FFF0E0'),
    headW: 14, headH: 12, headD: 10,
    bodyW: 11, bodyH: 8, bodyD: 8,
    armW: 3, armH: 5, armD: 3,
    legW: 3, legH: 3, legD: 3, legSpacing: 1,
    bellyW: 7, bellyH: 5,
    noseColor: '#1A1A1A', eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#E8C8A0', '#FFB6C1'),
    buildItem: (g, x, y, z) => {
      // Sunflower seed
      fillBox(g, x, y, z-1, x+2, y+3, z+1, '#4A3508');
      setVoxel(g, x+1, y+3, z, '#6B5510');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // Cheek pouches (wider than head)
      const cy = headY + Math.floor(headH * 0.4);
      const px = Math.floor(headW / 2) + 1;
      for (let dy = -1; dy <= 1; dy++) {
        setVoxel(g, cx - px, cy + dy, fz, '#F0D8B8');
        setVoxel(g, cx + px, cy + dy, fz, '#F0D8B8');
      }
      // Head stripe
      setVoxel(g, cx, headY + headH - 2, fz, '#C4A070');
      setVoxel(g, cx+1, headY + headH - 2, fz, '#C4A070');
      // Pink feet
    },
    buildSpecial: (g, cx, cz, _hY, _bY, _hw, _hh, _bw, _bh, _alx, _arx, _ay, legY) => {
      const lz = cz - 1;
      fillBox(g, cx-3, legY, lz, cx-1, legY, lz+2, '#FFB6C1');
      fillBox(g, cx+1, legY, lz, cx+3, legY, lz+2, '#FFB6C1');
    },
  });
}

// ============================================================
// Public API
// ============================================================
export function generateCubicAvatar(id: string, _opts: Record<string, string> = {}, s = 42): VoxelData {
  const m: Record<string, (s: number) => VoxelData> = {
    bear: generateBearAvatar, cat: generateCatAvatar, rabbit: generateRabbitAvatar,
    dog: generateDogAvatar, panda: generatePandaAvatar, fox: generateFoxAvatar,
    penguin: generatePenguinAvatar, hamster: generateHamsterAvatar,
  };
  return (m[id] ?? generateBearAvatar)(s);
}

export type CubicBodyPlan = { id: string };
export const CUBIC_PLANS: Record<string, CubicBodyPlan> = {
  bear: { id: 'bear' }, cat: { id: 'cat' }, rabbit: { id: 'rabbit' }, dog: { id: 'dog' },
  panda: { id: 'panda' }, fox: { id: 'fox' }, penguin: { id: 'penguin' }, hamster: { id: 'hamster' },
};
