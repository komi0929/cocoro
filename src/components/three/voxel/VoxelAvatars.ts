/**
 * VoxelAvatars v9 — High-Quality Primitive-Based Avatars
 *
 * DESIGN RULES (from NORTH_STAR reference analysis):
 * 1. USE HIGH-QUALITY PRIMITIVES from VoxelPrimitives.ts
 * 2. SPECIES-SPECIFIC PROPORTIONS: each animal has unique silhouette
 * 3. 3D MUZZLE: protrudes from face using fillSteppedSphere
 * 4. ELLIPTICAL BELLY: paintEllipse2D, never rectangular
 * 5. SHAPED LIMBS: arms taper to paws, legs have feet
 * 6. DETAILED EYES: drawDetailedEye with proper highlights
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import {
  fillRoundedBox3D, fillSteppedSphere, fillTaperedBox3D,
  paintEllipse2D, fillGradientBox,
  drawDetailedEye, drawNose3D,
  drawBlush, adjustBrightness,
  applyHorizontalStripes,
} from './VoxelPrimitives';

// ============================================================
// Color helpers
// ============================================================
type CP = { base: string; shadow: string; highlight: string };
function cp(base: string): CP {
  return { base, shadow: adjustBrightness(base, 0.75), highlight: adjustBrightness(base, 1.15) };
}

// ============================================================
// Mouth helper (simple, kept inline)
// ============================================================
function drawMouthLine(g: VoxelData, cx: number, y: number, z: number, w = 4, color = '#555555') {
  for (let dx = 0; dx < w; dx++) setVoxel(g, cx - Math.floor(w/2) + dx, y, z, color);
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
  // Head dimensions
  headW: number; headH: number; headD: number;
  // Body dimensions (each species has unique proportions)
  bodyW: number; bodyH: number; bodyD: number;
  // Arm dimensions
  armW: number; armH: number; armD: number;
  armPawW?: number; // hand/paw width at bottom (default: armW+2)
  // Leg dimensions
  legW: number; legH: number; legD: number;
  legSpacing: number;
  legPawW?: number; // foot width at bottom (default: legW+2)
  // Belly ellipse (painted on front face)
  bellyRX: number; bellyRY: number;
  // Species-specific muzzle (3D protrusion)
  muzzleW: number; muzzleH: number; muzzleD: number;
  noseColor: string; noseSize?: number;
  eyeW?: number; eyeH?: number; // eye dimensions (default 3×3)
  eyeSpacing: number;
  // Callbacks for species-specific parts
  buildEars: (g: VoxelData, cx: number, topY: number, fz: number, bz: number, headW: number) => void;
  buildTail?: (g: VoxelData, cx: number, y: number, z: number) => void;
  buildItem?: (g: VoxelData, x: number, y: number, z: number) => void;
  drawFaceExtras?: (g: VoxelData, cx: number, headY: number, headW: number, headH: number, fz: number) => void;
  buildSpecial?: (g: VoxelData, cx: number, cz: number, headY: number, bodyY: number, headW: number, headH: number, bodyW: number, bodyH: number, armLX: number, armRX: number, armY: number, legY: number) => void;
}

function buildAvatar(spec: AvatarSpec): VoxelData {
  const S = spec;
  const pawW = S.armPawW ?? S.armW + 2;
  const footW = S.legPawW ?? S.legW + 2;
  const eyeW = S.eyeW ?? 3;
  const eyeH = S.eyeH ?? 3;
  const noseSize = S.noseSize ?? 2;

  const totalW = Math.max(S.headW, S.bodyW) + pawW * 2 + 14;
  const earH = 8;
  const totalH = S.legH + S.bodyH + S.headH + earH + 6;
  const totalD = Math.max(S.headD, S.bodyD) + S.muzzleD + 14;
  const g = createGrid(totalW, totalH, totalD);
  const cx = Math.floor(totalW / 2), cz = Math.floor(totalD / 2);

  // ===== LEGS WITH PAW FEET =====
  const legY = 0;
  const lx1 = cx - S.legSpacing - S.legW, lx2 = cx + S.legSpacing + 1;
  const lz1 = cz - Math.floor(S.legD / 2);
  // Main leg columns
  fillRoundedBox3D(g, lx1, legY + 2, lz1, lx1+S.legW-1, legY+S.legH-1, lz1+S.legD-1, S.body.base, 0);
  fillRoundedBox3D(g, lx2, legY + 2, lz1, lx2+S.legW-1, legY+S.legH-1, lz1+S.legD-1, S.body.base, 0);
  // Paw feet — wider at bottom, using species-specific footW
  const fhw = Math.floor(footW / 2);
  const lcx1 = lx1 + Math.floor(S.legW / 2), lcx2 = lx2 + Math.floor(S.legW / 2);
  fillBox(g, lcx1 - fhw, legY, lz1, lcx1 + fhw, legY + 1, lz1 + S.legD, S.body.shadow);
  fillBox(g, lcx2 - fhw, legY, lz1, lcx2 + fhw, legY + 1, lz1 + S.legD, S.body.shadow);
  // Bottom paw pads (darkest)
  fillBox(g, lcx1 - fhw, legY, lz1, lcx1 + fhw, legY, lz1 + S.legD, adjustBrightness(S.body.base, 0.55));
  fillBox(g, lcx2 - fhw, legY, lz1, lcx2 + fhw, legY, lz1 + S.legD, adjustBrightness(S.body.base, 0.55));

  // ===== BODY =====
  const bodyY = S.legH;
  const bx1 = cx - Math.floor(S.bodyW / 2), bz1 = cz - Math.floor(S.bodyD / 2);
  fillRoundedBox3D(g, bx1, bodyY, bz1, bx1+S.bodyW-1, bodyY+S.bodyH-1, bz1+S.bodyD-1, S.body.base, 1);
  // Body top highlight
  fillBox(g, bx1+1, bodyY+S.bodyH-1, bz1+1, bx1+S.bodyW-2, bodyY+S.bodyH-1, bz1+S.bodyD-2, S.body.highlight);
  // Body bottom shadow
  fillBox(g, bx1+1, bodyY, bz1+1, bx1+S.bodyW-2, bodyY, bz1+S.bodyD-2, S.body.shadow);

  // ===== BELLY (ELLIPTICAL — using paintEllipse2D) =====
  const bodyFZ = bz1 + S.bodyD - 1;
  const bellyCY = bodyY + Math.floor(S.bodyH * 0.45);
  paintEllipse2D(g, cx, bellyCY, bodyFZ, S.bellyRX, S.bellyRY, S.belly.base);

  // ===== ARMS WITH PAW HANDS =====
  const armY = bodyY + S.bodyH - S.armH;
  const armLX = bx1 - S.armW, armRX = bx1 + S.bodyW;
  const az1 = cz - Math.floor(S.armD / 2);
  // Main arm columns
  fillBox(g, armLX, armY+2, az1, armLX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.base);
  fillBox(g, armRX, armY+2, az1, armRX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.base);
  // Paw hands — wider at bottom, using pawW
  const phw = Math.floor(pawW / 2);
  const acx1 = armLX + Math.floor(S.armW / 2), acx2 = armRX + Math.floor(S.armW / 2);
  fillBox(g, acx1 - phw, armY, az1, acx1 + phw, armY+2, az1+S.armD-1, S.body.base);
  fillBox(g, acx2 - phw, armY, az1, acx2 + phw, armY+2, az1+S.armD-1, S.body.base);
  // Hand bottom shadow
  fillBox(g, acx1 - phw, armY, az1, acx1 + phw, armY, az1+S.armD-1, S.body.shadow);
  fillBox(g, acx2 - phw, armY, az1, acx2 + phw, armY, az1+S.armD-1, S.body.shadow);
  // Arm top highlight (shoulder)
  fillBox(g, armLX, armY+S.armH-1, az1, armLX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.highlight);
  fillBox(g, armRX, armY+S.armH-1, az1, armRX+S.armW-1, armY+S.armH-1, az1+S.armD-1, S.body.highlight);

  // ===== HEAD =====
  const headY = bodyY + S.bodyH;
  const hx1 = cx - Math.floor(S.headW / 2), hz1 = cz - Math.floor(S.headD / 2);
  fillRoundedBox3D(g, hx1, headY, hz1, hx1+S.headW-1, headY+S.headH-1, hz1+S.headD-1, S.body.base, 1);
  // Head top highlight
  fillBox(g, hx1+1, headY+S.headH-1, hz1+1, hx1+S.headW-2, headY+S.headH-1, hz1+S.headD-2, S.body.highlight);
  // Head side shadow
  for (let y = headY+1; y < headY+S.headH-1; y++) {
    for (let z = hz1+1; z < hz1+S.headD-1; z++) {
      setVoxel(g, hx1, y, z, S.body.shadow);
      setVoxel(g, hx1+S.headW-1, y, z, S.body.shadow);
    }
  }
  const headFZ = hz1 + S.headD - 1;

  // ===== 3D MUZZLE (species-specific ellipsoid protrusion) =====
  const muzzleCY = headY + Math.floor(S.headH * 0.35);
  const muzzleFZ = headFZ + Math.floor(S.muzzleD / 2);
  // Paint muzzle area on the flat head face first
  paintEllipse2D(g, cx, muzzleCY, headFZ, Math.floor(S.muzzleW * 0.7), Math.floor(S.muzzleH * 0.9), S.belly.base);
  // 3D muzzle protrusion using ellipsoid
  fillSteppedSphere(g, cx, muzzleCY, muzzleFZ,
    Math.floor(S.muzzleW / 2), Math.floor(S.muzzleH / 2), Math.ceil(S.muzzleD / 2),
    S.belly.base);

  // ===== FACE =====
  const faceFZ = muzzleFZ + Math.ceil(S.muzzleD / 2); // front of muzzle

  // Nose (3D, on top of muzzle)
  drawNose3D(g, cx, muzzleCY + Math.floor(S.muzzleH / 2), faceFZ - 1, S.noseColor, noseSize);

  // Eyes (high-quality, on HEAD face above muzzle)
  const eyeY = headY + Math.floor(S.headH * 0.62);
  drawDetailedEye(g, cx - S.eyeSpacing - Math.floor(eyeW / 2), eyeY, headFZ,
    { width: eyeW, height: eyeH, pupilColor: '#1A1A1A', highlightCount: 1 });
  drawDetailedEye(g, cx + S.eyeSpacing + Math.floor(eyeW / 2), eyeY, headFZ,
    { width: eyeW, height: eyeH, pupilColor: '#1A1A1A', highlightCount: 1 });

  // Mouth (on muzzle face)
  drawMouthLine(g, cx, muzzleCY - Math.floor(S.muzzleH / 2) + 1, faceFZ - 1, 4);

  // Face extras (stripes, patches, blush, etc.)
  if (S.drawFaceExtras) S.drawFaceExtras(g, cx, headY, S.headW, S.headH, headFZ);

  // ===== BODY-HEAD TRANSITION =====
  const neckY = bodyY + S.bodyH - 1;
  const transW = Math.floor((S.headW - S.bodyW) / 2);
  if (transW > 0) {
    fillBox(g, bx1-transW, neckY, bz1+1, bx1, neckY, bz1+S.bodyD-2, S.body.base);
    fillBox(g, bx1+S.bodyW-1, neckY, bz1+1, bx1+S.bodyW-1+transW, neckY, bz1+S.bodyD-2, S.body.base);
  }

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
// Avatar definitions — each species has UNIQUE proportions
// ============================================================

// ===== BEAR: stocky body, round head, small ears, prominent muzzle =====
export function generateBearAvatar(_seed = 42): VoxelData {
  return buildAvatar({
    body: cp('#A07030'), belly: cp('#D4B478'),
    headW: 14, headH: 12, headD: 11,
    bodyW: 12, bodyH: 11, bodyD: 10,
    armW: 3, armH: 8, armD: 4, armPawW: 5,
    legW: 4, legH: 5, legD: 5, legSpacing: 1, legPawW: 6,
    bellyRX: 4, bellyRY: 4,
    muzzleW: 8, muzzleH: 6, muzzleD: 3,
    noseColor: '#2D1B0E', noseSize: 2, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#A07030', '#C49060'),
    buildTail: (g, cx, y, z) => {
      fillSteppedSphere(g, cx, y, z, 1.5, 1.5, 1, '#A07030');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      drawBlush(g, cx, headY + Math.floor(headH * 0.4), fz, Math.floor(headW / 2) - 2, '#FFB6C1', 1);
    },
    buildItem: (g, x, y, z) => {
      // Honey jar
      fillSteppedSphere(g, x+2, y+2, z, 2, 2.5, 2, '#FFD54F');
      fillBox(g, x, y+4, z-1, x+3, y+5, z+1, '#8B4513');
      setVoxel(g, x+2, y+2, z+2, '#E6B800'); // honey drip
    },
  });
}

// ===== CAT: slender, pointed ears, small muzzle, whisker area =====
export function generateCatAvatar(_seed = 100): VoxelData {
  return buildAvatar({
    body: cp('#9E9E9E'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 9,
    bodyW: 10, bodyH: 9, bodyD: 8,
    armW: 2, armH: 7, armD: 3, armPawW: 4,
    legW: 3, legH: 4, legD: 3, legSpacing: 1, legPawW: 4,
    bellyRX: 3, bellyRY: 3,
    muzzleW: 6, muzzleH: 4, muzzleD: 2,
    noseColor: '#FFB0B0', noseSize: 1, eyeSpacing: 3,
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
      const sc = '#707070';
      const hx1 = cx - Math.floor(headW / 2) + 2;
      const hx2 = cx + Math.floor(headW / 2) - 2;
      drawStripes(g, hx1, hx2, headY + headH - 2, fz, sc, 3, 3);
    },
  });
}

// ===== RABBIT: large head, long ears, small body, flat muzzle =====
export function generateRabbitAvatar(_seed = 200): VoxelData {
  return buildAvatar({
    body: cp('#D4BC96'), belly: cp('#F5EDE0'),
    headW: 14, headH: 12, headD: 10,
    bodyW: 10, bodyH: 9, bodyD: 8,
    armW: 2, armH: 6, armD: 3, armPawW: 3,
    legW: 4, legH: 4, legD: 4, legSpacing: 1, legPawW: 5,
    bellyRX: 3, bellyRY: 3,
    muzzleW: 6, muzzleH: 5, muzzleD: 2,
    noseColor: '#FFB0B0', noseSize: 1, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildLongEars(g, cx, y, fz, bz, hw, '#D4BC96', '#FFAABB', 7),
    drawFaceExtras: (g, cx, headY, _hw, headH, fz) => {
      drawBlush(g, cx, headY + Math.floor(headH * 0.35), fz, 4, '#FFB6C1', 1);
    },
  });
}

// ===== DOG: medium body, floppy ears, brown patch, collar =====
export function generateDogAvatar(_seed = 300): VoxelData {
  return buildAvatar({
    body: cp('#F0E8E0'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 10,
    bodyW: 11, bodyH: 10, bodyD: 9,
    armW: 3, armH: 8, armD: 3, armPawW: 5,
    legW: 4, legH: 5, legD: 4, legSpacing: 1, legPawW: 5,
    bellyRX: 4, bellyRY: 3,
    muzzleW: 7, muzzleH: 5, muzzleD: 3,
    noseColor: '#2D1B0E', noseSize: 2, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildFloppyEars(g, cx, y - 2, fz, bz, hw, '#C49050', 5),
    buildTail: (g, cx, y, z) => {
      for (let i = 0; i < 5; i++) setVoxel(g, cx, y + i, z - i, '#F0E8E0');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // Brown patch on top-right of head
      const pc = '#C49050';
      for (let dy = Math.floor(headH * 0.6); dy < headH; dy++) {
        for (let dx = 0; dx < Math.floor(headW / 2); dx++) {
          setVoxel(g, cx + dx, headY + dy, fz, pc);
        }
      }
      // Tongue
      drawMouthLine(g, cx, headY + Math.floor(headH * 0.15), fz, 2, '#FF6B8A');
    },
    buildSpecial: (g, cx, cz, _hY, bodyY, _hw, _hh, bodyW, bodyH) => {
      // Blue collar
      const collarY = bodyY + bodyH - 1;
      const bx1 = cx - Math.floor(bodyW / 2);
      const bz1 = cz - Math.floor(9 / 2);
      for (let dx = 0; dx < bodyW; dx++) for (let dz = 0; dz < 9; dz++) {
        if (g[collarY]?.[bz1+dz]?.[bx1+dx] != null) setVoxel(g, bx1+dx, collarY, bz1+dz, '#4488CC');
      }
      setVoxel(g, cx, collarY - 1, cz + Math.floor(9 / 2), '#FFD700');
    },
  });
}

// ===== PANDA: round body, black eye patches, black limbs =====
export function generatePandaAvatar(_seed = 400): VoxelData {
  return buildAvatar({
    body: cp('#F5F5F5'), belly: cp('#FFFFFF'),
    headW: 14, headH: 12, headD: 10,
    bodyW: 12, bodyH: 10, bodyD: 9,
    armW: 3, armH: 8, armD: 4, armPawW: 5,
    legW: 4, legH: 5, legD: 4, legSpacing: 1, legPawW: 6,
    bellyRX: 4, bellyRY: 4,
    muzzleW: 7, muzzleH: 5, muzzleD: 2,
    noseColor: '#1A1A1A', noseSize: 2, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#1A1A1A', '#1A1A1A'),
    buildSpecial: (g, cx, cz, headY, bodyY, headW, headH, bodyW, _bH, armLX, armRX, armY, legY) => {
      const bk = '#1A1A1A';
      const headFZ = cz + Math.floor(10 / 2) - 1;
      // Black eye patches (diamond-shaped around eyes)
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

// ===== FOX: slim body, tall pointed ears, LONG muzzle, bushy tail =====
export function generateFoxAvatar(_seed = 500): VoxelData {
  return buildAvatar({
    body: cp('#E07830'), belly: cp('#FFF5E6'),
    headW: 12, headH: 10, headD: 9,
    bodyW: 9, bodyH: 9, bodyD: 7,
    armW: 2, armH: 7, armD: 3, armPawW: 3,
    legW: 3, legH: 4, legD: 3, legSpacing: 1, legPawW: 4,
    bellyRX: 3, bellyRY: 3,
    muzzleW: 5, muzzleH: 4, muzzleD: 4, // LONG muzzle for fox!
    noseColor: '#1A1A1A', noseSize: 1, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildPointedEars(g, cx, y, fz, bz, hw, '#E07830', '#FFF5E6', 5),
    buildTail: (g, cx, y, z) => {
      // Bushy tail using ellipsoid
      fillSteppedSphere(g, cx, y, z - 3, 2, 3, 3, '#E07830');
      // White tail tip
      fillSteppedSphere(g, cx, y, z - 5, 1.5, 2, 1.5, '#FFFFFF');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // White lower face V-shape
      for (let dy = 0; dy < Math.floor(headH * 0.5); dy++) {
        const w = Math.floor(headW * 0.3) - Math.floor(dy * 0.5);
        if (w <= 0) continue;
        for (let dx = -w; dx <= w; dx++) setVoxel(g, cx + dx, headY + dy, fz, '#FFF5E6');
      }
    },
  });
}

// ===== PENGUIN: short, round body, tiny muzzle (beak), no ears, orange feet =====
export function generatePenguinAvatar(_seed = 600): VoxelData {
  return buildAvatar({
    body: cp('#3A5080'), belly: cp('#FFFFFF'),
    headW: 11, headH: 10, headD: 9,
    bodyW: 10, bodyH: 10, bodyD: 9,
    armW: 2, armH: 7, armD: 2, armPawW: 3,
    legW: 3, legH: 2, legD: 3, legSpacing: 1, legPawW: 4,
    bellyRX: 4, bellyRY: 4,
    muzzleW: 4, muzzleH: 3, muzzleD: 2, // Tiny beak
    noseColor: '#FF8C00', noseSize: 1, eyeSpacing: 2,
    eyeW: 2, eyeH: 2,
    buildEars: () => {},
    drawFaceExtras: (g, cx, headY, _hw, headH, fz) => {
      // Pink cheeks
      drawBlush(g, cx, headY + Math.floor(headH * 0.4), fz, 3, '#FFB6C1', 1);
    },
    buildSpecial: (g, cx, cz, _hY, _bY, _hw, _hh, _bw, _bh, _alx, _arx, _ay, legY) => {
      // Orange feet
      const lz = cz - 1;
      fillBox(g, cx-4, legY, lz, cx-2, legY, lz+2, '#FF8C00');
      fillBox(g, cx+2, legY, lz, cx+4, legY, lz+2, '#FF8C00');
    },
  });
}

// ===== HAMSTER: huge head, tiny body, cheek pouches, round =====
export function generateHamsterAvatar(_seed = 700): VoxelData {
  return buildAvatar({
    body: cp('#E8C8A0'), belly: cp('#FFF0E0'),
    headW: 15, headH: 13, headD: 11,
    bodyW: 10, bodyH: 7, bodyD: 8,
    armW: 2, armH: 5, armD: 3, armPawW: 3,
    legW: 3, legH: 3, legD: 3, legSpacing: 1, legPawW: 4,
    bellyRX: 3, bellyRY: 3,
    muzzleW: 6, muzzleH: 5, muzzleD: 2,
    noseColor: '#1A1A1A', noseSize: 1, eyeSpacing: 3,
    buildEars: (g, cx, y, fz, bz, hw) => buildRoundEars(g, cx, y, fz, bz, hw, '#E8C8A0', '#FFB6C1'),
    buildItem: (g, x, y, z) => {
      fillBox(g, x, y, z-1, x+2, y+3, z+1, '#4A3508');
      setVoxel(g, x+1, y+3, z, '#6B5510');
    },
    drawFaceExtras: (g, cx, headY, headW, headH, fz) => {
      // Cheek pouches (wider than head)
      const cy = headY + Math.floor(headH * 0.35);
      const px = Math.floor(headW / 2);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          setVoxel(g, cx - px - dx, cy + dy, fz, '#F0D8B8');
          setVoxel(g, cx + px + dx, cy + dy, fz, '#F0D8B8');
        }
      }
      // Head stripe
      setVoxel(g, cx, headY + headH - 2, fz, '#C4A070');
      setVoxel(g, cx+1, headY + headH - 2, fz, '#C4A070');
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
