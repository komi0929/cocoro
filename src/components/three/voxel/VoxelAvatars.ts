/**
 * VoxelAvatars v6 - Face Map based voxel avatars
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import { fillRoundedBox3D, drawYarnBall, drawSunflowerSeed, drawCollar, adjustBrightness } from './VoxelPrimitives';

type FaceMap = string[][];

function applyFaceMap(
  grid: VoxelData, map: FaceMap, cx: number, topY: number, faceZ: number,
  colorLookup: Record<string, string>,
): void {
  const rows = map.length;
  const cols = map[0]!.length;
  const x0 = cx - Math.floor(cols / 2);
  for (let r = 0; r < rows; r++) {
    const y = topY - r;
    const row = map[r]!;
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (!ch || ch === '_') continue;
      const color = colorLookup[ch];
      if (color) setVoxel(grid, x0 + c, y, faceZ, color);
    }
  }
}

interface ColorProfile { base: string; highlight: string; shadow: string; }
function cp(base: string, hf = 1.15, sf = 0.75): ColorProfile {
  return { base, highlight: adjustBrightness(base, hf), shadow: adjustBrightness(base, sf) };
}

interface AvatarDef {
  id: string; name: string;
  body: ColorProfile; belly: ColorProfile;
  headW: number; headH: number; headD: number; headCornerR: number;
  bodyW: number; bodyH: number; bodyD: number; bodyCornerR: number;
  armW: number; armH: number; armD: number;
  legW: number; legH: number; legD: number; legSpacing: number;
  bellyW: number; bellyH: number;
  faceMap: FaceMap; faceColorLookup: Record<string, string>; faceTopOffset: number;
  earBuilder?: (g: VoxelData, cx: number, y: number, cz: number, hw: number, b: ColorProfile) => void;
  tailBuilder?: (g: VoxelData, cx: number, y: number, z: number, b: ColorProfile) => void;
  itemBuilder?: (g: VoxelData, x: number, y: number, cz: number) => void;
  specialBuilder?: (g: VoxelData, cx: number, cz: number, hx1: number,
    headY: number, headW: number, headH: number, headD: number, headFrontZ: number,
    bodyX1: number, bodyY: number, bodyW: number, bodyH: number, bodyD: number, bodyFrontZ: number,
    armLX: number, armRX: number, armY: number, armH: number, armW: number, armD: number,
    legY: number, legW: number, legH: number, legD: number, body: ColorProfile) => void;
}

// Face maps
const BEAR_FACE: FaceMap = [
  '_____________'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
  '___BW____BW__'.split(''),
  '___BB____BB__'.split(''),
  '___BB____BB__'.split(''),
  '______NN_____'.split(''),
  '_____DDDD____'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
];
const CAT_FACE: FaceMap = [
  '_____________'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
  '___BW____BW__'.split(''),
  '___BB____BB__'.split(''),
  '___BB____BB__'.split(''),
  '______PP_____'.split(''),
  '_____DDDD____'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
];
const RABBIT_FACE: FaceMap = CAT_FACE;
const DOG_FACE: FaceMap = [
  '_____________'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
  '___BW____BW__'.split(''),
  '___BB____BB__'.split(''),
  '___BB____BB__'.split(''),
  '______NN_____'.split(''),
  '_____DDDD____'.split(''),
  '______TT_____'.split(''),
  '_____________'.split(''),
];
const PANDA_FACE: FaceMap = [
  '_____________'.split(''),
  '_____________'.split(''),
  '__KKK____KKK_'.split(''),
  '__KBWK__KBWK_'.split(''),
  '__KBBK__KBBK_'.split(''),
  '__KKK____KKK_'.split(''),
  '______NN_____'.split(''),
  '_____DDDD____'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
];
const FOX_FACE: FaceMap = BEAR_FACE;
const PENGUIN_FACE: FaceMap = [
  '_____________'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
  '___BW____BW__'.split(''),
  '___BB____BB__'.split(''),
  '___BB____BB__'.split(''),
  '______OO_____'.split(''),
  '______OO_____'.split(''),
  '_____________'.split(''),
  '_____________'.split(''),
];
const HAMSTER_FACE: FaceMap = CAT_FACE;

// Ear builders
function buildRoundEars(g: VoxelData, cx: number, y: number, cz: number, hw: number, b: ColorProfile, ic: string, r = 3) {
  const dx = Math.floor(hw / 2) - 1;
  for (let dy = 0; dy < r; dy++) {
    const w = dy === r - 1 ? 1 : 2;
    for (let ddx = 0; ddx < w; ddx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const c = (ddx === 0 && dz === -1 && dy < r - 1) ? ic : b.base;
        setVoxel(g, cx - dx + ddx, y + dy, cz + dz, c);
        setVoxel(g, cx + dx - ddx, y + dy, cz + dz, c);
      }
    }
  }
}
function buildPointedEars(g: VoxelData, cx: number, y: number, cz: number, hw: number, b: ColorProfile, ic: string, h = 4, bw = 3) {
  const hs = Math.floor(hw / 2);
  for (let hi = 0; hi < h; hi++) {
    const w = Math.max(1, bw - hi);
    for (let dx = 0; dx < w; dx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const inner = dx < w - 1 && dz === -1 && hi < h - 1;
        setVoxel(g, cx - hs + dx, y + hi, cz + dz, inner ? ic : b.base);
        setVoxel(g, cx + hs - dx, y + hi, cz + dz, inner ? ic : b.base);
      }
    }
  }
}
function buildLongEars(g: VoxelData, cx: number, y: number, cz: number, _hw: number, b: ColorProfile, ic: string, h = 8, edx = 3) {
  for (let hi = 0; hi < h; hi++) {
    const w = hi < h - 1 ? 2 : 1;
    for (let ddx = 0; ddx < w; ddx++) {
      for (let dz = -1; dz <= 0; dz++) {
        const inner = ddx === 0 && dz === -1;
        setVoxel(g, cx - edx + ddx, y + hi, cz + dz, inner ? ic : b.base);
        setVoxel(g, cx + edx - ddx, y + hi, cz + dz, inner ? ic : b.base);
      }
    }
  }
}
function buildFloppyEars(g: VoxelData, cx: number, by: number, cz: number, hw: number, _b: ColorProfile, c: string, dh = 5, ew = 3) {
  const hs = Math.floor(hw / 2);
  for (let h = 0; h < dh; h++) {
    for (let dz = -1; dz <= 0; dz++) {
      for (let w = 0; w < ew; w++) {
        setVoxel(g, cx - hs - ew + w, by - h, cz + dz, c);
        setVoxel(g, cx + hs + 1 + w, by - h, cz + dz, c);
      }
    }
  }
}

// Tail builders
function buildStubTail(g: VoxelData, cx: number, y: number, z: number, c: string, len = 2) {
  for (let i = 0; i < len; i++) { setVoxel(g, cx, y, z - i, c); setVoxel(g, cx + 1, y, z - i, c); }
}
function buildLongTail(g: VoxelData, cx: number, y: number, z: number, c: string, len = 6) {
  for (let i = 0; i < len; i++) {
    const ty = y + Math.round(Math.sin(i * 0.4) * 1.5);
    setVoxel(g, cx, ty, z - i, c); setVoxel(g, cx + 1, ty, z - i, c); setVoxel(g, cx, ty + 1, z - i, c);
  }
}
function buildFluffyTail(g: VoxelData, cx: number, y: number, z: number, c: string, tc: string, len = 6) {
  for (let i = 0; i < len; i++) {
    const w = Math.min(2, Math.floor(i * 0.5) + 1);
    const col = i >= len - 2 ? tc : c;
    for (let dx = -w; dx <= w; dx++) for (let dy = -w; dy <= w; dy++) if (dx*dx+dy*dy<=w*w+1) setVoxel(g, cx+dx, y+dy, z-i, col);
  }
}

// Avatar definitions
const AVATARS: Record<string, AvatarDef> = {
  bear: {
    id: 'bear', name: 'Bear',
    body: cp('#8B6240'), belly: cp('#D4B892', 1.08, 0.88),
    headW: 14, headH: 12, headD: 12, headCornerR: 3,
    bodyW: 12, bodyH: 10, bodyD: 10, bodyCornerR: 2,
    armW: 4, armH: 8, armD: 4, legW: 4, legH: 5, legD: 4, legSpacing: 3,
    bellyW: 8, bellyH: 7,
    faceMap: BEAR_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', N:'#2D1B0E', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildRoundEars(g,cx,y,cz,hw,b,'#C49A6C',3),
    tailBuilder: (g,cx,y,z,b) => buildStubTail(g,cx,y,z,b.base),
    itemBuilder: (g,x,y,cz) => { fillRoundedBox3D(g,x,y,cz-2,x+3,y+4,cz+1,'#FFD54F',1); fillBox(g,x,y+4,cz-2,x+3,y+4,cz+1,'#8B4513'); },
  },
  cat: {
    id: 'cat', name: 'Cat',
    body: cp('#9E9E9E'), belly: cp('#E8E8E8', 1.05, 0.90),
    headW: 14, headH: 11, headD: 11, headCornerR: 3,
    bodyW: 11, bodyH: 10, bodyD: 9, bodyCornerR: 1,
    armW: 3, armH: 7, armD: 3, legW: 3, legH: 5, legD: 3, legSpacing: 2,
    bellyW: 7, bellyH: 7,
    faceMap: CAT_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', P:'#FF8CAA', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildPointedEars(g,cx,y,cz,hw,b,'#FFB6C1',4,3),
    tailBuilder: (g,cx,y,z,b) => buildLongTail(g,cx,y,z,b.base,7),
    itemBuilder: (g,x,y,cz) => drawYarnBall(g,x+2,y+2,cz,3,'#5BC0EB'),
    specialBuilder: (g,cx,_cz,hx1,headY,headW,headH,_hD,headFrontZ,bodyX1,bodyY,bodyW,bodyH,_bD,bodyFrontZ) => {
      const sc = '#707070';
      for (let dy = 2; dy < headH; dy += 3) for (let dx = hx1+1; dx < hx1+headW-1; dx += 2) setVoxel(g,dx,headY+dy,headFrontZ,sc);
      for (let dy = 1; dy < bodyH; dy += 3) for (let dx = bodyX1+1; dx < bodyX1+bodyW-1; dx += 2) setVoxel(g,dx,bodyY+dy,bodyFrontZ,sc);
    },
  },
  rabbit: {
    id: 'rabbit', name: 'Rabbit',
    body: cp('#D9C9A8'), belly: cp('#F5EDE0', 1.05, 0.92),
    headW: 14, headH: 12, headD: 11, headCornerR: 3,
    bodyW: 11, bodyH: 9, bodyD: 9, bodyCornerR: 1,
    armW: 3, armH: 7, armD: 3, legW: 4, legH: 4, legD: 5, legSpacing: 2,
    bellyW: 7, bellyH: 6,
    faceMap: RABBIT_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', P:'#FFB0B0', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildLongEars(g,cx,y,cz,hw,b,'#FFAABB',8,3),
    tailBuilder: (g,cx,y,z) => buildStubTail(g,cx,y,z,'#F5EDE0',3),
  },
  dog: {
    id: 'dog', name: 'Dog',
    body: cp('#EADDD0'), belly: cp('#FFFFFF', 1.0, 0.92),
    headW: 14, headH: 12, headD: 12, headCornerR: 3,
    bodyW: 12, bodyH: 10, bodyD: 10, bodyCornerR: 2,
    armW: 4, armH: 8, armD: 4, legW: 4, legH: 5, legD: 4, legSpacing: 3,
    bellyW: 8, bellyH: 7,
    faceMap: DOG_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', N:'#2D1B0E', D:'#555555', T:'#FF6B8A' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildFloppyEars(g,cx,y,cz,hw,b,'#C49050',5,3),
    tailBuilder: (g,cx,y,z,b) => buildLongTail(g,cx,y,z,b.base,5),
    specialBuilder: (g,cx,cz,hx1,headY,headW,headH,headD,_hFZ,_bx1,bodyY,bodyW,bodyH) => {
      const pc = '#C49050';
      for (let dy = Math.floor(headH*0.5); dy < headH; dy++) for (let dx = cx; dx < hx1+headW; dx++) for (let dz = 0; dz < headD; dz++) setVoxel(g,dx,headY+dy,cz-Math.floor(headD/2)+dz,pc);
      drawCollar(g,cx,bodyY+bodyH-1,cz-Math.floor(bodyW/2),cz+Math.floor(bodyW/2),Math.floor(bodyW/2),'#4488CC','#FFD700');
    },
  },
  panda: {
    id: 'panda', name: 'Panda',
    body: cp('#F0F0F0', 1.05, 0.85), belly: cp('#FFFFFF'),
    headW: 14, headH: 12, headD: 12, headCornerR: 3,
    bodyW: 13, bodyH: 11, bodyD: 10, bodyCornerR: 2,
    armW: 4, armH: 9, armD: 4, legW: 4, legH: 5, legD: 4, legSpacing: 3,
    bellyW: 9, bellyH: 8,
    faceMap: PANDA_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', K:'#1A1A1A', N:'#1A1A1A', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw) => buildRoundEars(g,cx,y,cz,hw,cp('#1A1A1A'),'#1A1A1A',3),
    tailBuilder: (g,cx,y,z) => buildStubTail(g,cx,y,z,'#F0F0F0',1),
    specialBuilder: (g,cx,cz,_hx1,_hY,_hW,_hH,_hD,_hFZ,_bx1,_bY,_bW,_bH,_bD,_bFZ,armLX,armRX,armY,armH,armW,armD,legY,legW,legH,legD) => {
      const bk = '#1A1A1A';
      for (let dy=0;dy<armH;dy++) for (let dz=0;dz<armD;dz++) for (let dx=0;dx<armW;dx++) { setVoxel(g,armLX+dx,armY+dy,cz-Math.floor(armD/2)+dz,bk); setVoxel(g,armRX+dx,armY+dy,cz-Math.floor(armD/2)+dz,bk); }
      for (let dy=0;dy<legH;dy++) for (let dz=0;dz<legD;dz++) for (let dx=0;dx<legW;dx++) { setVoxel(g,cx-3-legW+1+dx,legY+dy,cz-Math.floor(legD/2)+dz,bk); setVoxel(g,cx+3+dx,legY+dy,cz-Math.floor(legD/2)+dz,bk); }
    },
  },
  fox: {
    id: 'fox', name: 'Fox',
    body: cp('#D4652B'), belly: cp('#FFF5E6', 1.02, 0.90),
    headW: 13, headH: 11, headD: 11, headCornerR: 3,
    bodyW: 11, bodyH: 10, bodyD: 9, bodyCornerR: 1,
    armW: 3, armH: 7, armD: 3, legW: 3, legH: 5, legD: 3, legSpacing: 2,
    bellyW: 7, bellyH: 7,
    faceMap: FOX_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', N:'#1A1A1A', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildPointedEars(g,cx,y,cz,hw,b,'#FFF5E6',5,4),
    tailBuilder: (g,cx,y,z,b) => buildFluffyTail(g,cx,y,z,b.base,'#FFFFFF',7),
    specialBuilder: (g,cx,_cz,_hx1,headY,headW,headH,_hD,headFrontZ) => {
      const w = '#FFF5E6';
      for (let dy=0; dy<Math.floor(headH*0.55); dy++) { const mw=Math.floor(headW/2)-Math.floor(dy*0.5); for (let dx=-mw;dx<=mw;dx++) setVoxel(g,cx+dx,headY+dy,headFrontZ,w); }
    },
  },
  penguin: {
    id: 'penguin', name: 'Penguin',
    body: cp('#2C3E6B'), belly: cp('#FFFFFF'),
    headW: 13, headH: 11, headD: 11, headCornerR: 3,
    bodyW: 11, bodyH: 10, bodyD: 9, bodyCornerR: 1,
    armW: 2, armH: 8, armD: 2, legW: 3, legH: 2, legD: 3, legSpacing: 2,
    bellyW: 8, bellyH: 8,
    faceMap: PENGUIN_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', O:'#FF8C00', D:'#555555' }, faceTopOffset: 1,
    specialBuilder: (g,cx,cz,_hx1,_hY,_hW,_hH,_hD,_hFZ,_bx1,_bY,_bW,_bH,_bD,_bFZ,_aLX,_aRX,_aY,_aH,_aW,_aD,legY,legW,_legH,legD) => {
      const o = '#FF8C00';
      for (let dx=0;dx<legW;dx++) for (let dz=0;dz<legD;dz++) { setVoxel(g,cx-2-legW+1+dx,legY,cz-Math.floor(legD/2)+dz,o); setVoxel(g,cx+2+dx,legY,cz-Math.floor(legD/2)+dz,o); }
    },
  },
  hamster: {
    id: 'hamster', name: 'Hamster',
    body: cp('#E8C39E'), belly: cp('#FFF8F0', 1.03, 0.92),
    headW: 15, headH: 13, headD: 12, headCornerR: 3,
    bodyW: 12, bodyH: 8, bodyD: 9, bodyCornerR: 1,
    armW: 3, armH: 5, armD: 3, legW: 3, legH: 3, legD: 3, legSpacing: 3,
    bellyW: 8, bellyH: 5,
    faceMap: HAMSTER_FACE, faceColorLookup: { B:'#1A1A1A', W:'#FFFFFF', P:'#FFB0B0', D:'#555555' }, faceTopOffset: 1,
    earBuilder: (g,cx,y,cz,hw,b) => buildRoundEars(g,cx,y,cz,hw,b,'#FFB6C1',3),
    tailBuilder: (g,cx,y,z,b) => buildStubTail(g,cx,y,z,b.base,1),
    itemBuilder: (g,x,y,cz) => drawSunflowerSeed(g,x,y,cz),
    specialBuilder: (g,cx,cz,hx1,headY,headW,headH) => {
      const cc = '#F0D8B8';
      const cy = headY + Math.floor(headH/2) - 1;
      for (let dy=-1;dy<=2;dy++) for (let dz=0;dz<3;dz++) { setVoxel(g,hx1-1,cy+dy,cz-1+dz,cc); setVoxel(g,hx1+headW,cy+dy,cz-1+dz,cc); }
    },
  },
};

// Main generation function
export function generateCubicAvatar(planId: string, _opts: Record<string, string> = {}, _seed = 42): VoxelData {
  const A = AVATARS[planId];
  if (!A) return createGrid(1,1,1);
  const earH = A.earBuilder ? 6 : 0;
  const totalW = Math.max(A.headW, A.bodyW + A.armW*2 + 2) + 12;
  const totalH = A.legH + A.bodyH + A.headH + earH + 6;
  const totalD = Math.max(A.headD, A.bodyD) + 16;
  const grid = createGrid(totalW, totalH, totalD);
  const cx = Math.floor(totalW/2), cz = Math.floor(totalD/2);

  // Legs
  const legY = 0;
  const lx1 = cx - A.legSpacing - A.legW + 1, lx2 = cx + A.legSpacing;
  for (let dx=0;dx<A.legW;dx++) for (let dy=0;dy<A.legH;dy++) for (let dz=0;dz<A.legD;dz++) {
    const c = dy===0 ? A.body.shadow : A.body.base;
    setVoxel(grid,lx1+dx,legY+dy,cz-Math.floor(A.legD/2)+dz,c);
    setVoxel(grid,lx2+dx,legY+dy,cz-Math.floor(A.legD/2)+dz,c);
  }

  // Body
  const bodyY = A.legH, bx1 = cx - Math.floor(A.bodyW/2), bz1 = cz - Math.floor(A.bodyD/2);
  fillRoundedBox3D(grid,bx1,bodyY,bz1,bx1+A.bodyW-1,bodyY+A.bodyH-1,bz1+A.bodyD-1,A.body.base,A.bodyCornerR);
  fillBox(grid,bx1+1,bodyY,bz1+1,bx1+A.bodyW-2,bodyY,bz1+A.bodyD-2,A.body.shadow);
  fillBox(grid,bx1+1,bodyY+A.bodyH-1,bz1+1,bx1+A.bodyW-2,bodyY+A.bodyH-1,bz1+A.bodyD-2,A.body.highlight);
  const bodyFrontZ = bz1+A.bodyD-1;
  fillBox(grid,cx-Math.floor(A.bellyW/2),bodyY+1,bodyFrontZ,cx-Math.floor(A.bellyW/2)+A.bellyW-1,bodyY+A.bellyH,bodyFrontZ,A.belly.base);

  // Arms
  const armY = bodyY+A.bodyH-A.armH, armLX = bx1-A.armW, armRX = bx1+A.bodyW;
  for (let dx=0;dx<A.armW;dx++) for (let dy=0;dy<A.armH;dy++) for (let dz=0;dz<A.armD;dz++) {
    const c = dy===0?A.body.shadow:A.body.base;
    setVoxel(grid,armLX+dx,armY+dy,cz-Math.floor(A.armD/2)+dz,c);
    setVoxel(grid,armRX+dx,armY+dy,cz-Math.floor(A.armD/2)+dz,c);
  }

  // Head
  const headY = bodyY+A.bodyH, hx1 = cx-Math.floor(A.headW/2), hz1 = cz-Math.floor(A.headD/2);
  fillRoundedBox3D(grid,hx1,headY,hz1,hx1+A.headW-1,headY+A.headH-1,hz1+A.headD-1,A.body.base,A.headCornerR);
  fillBox(grid,hx1+2,headY+A.headH-1,hz1+2,hx1+A.headW-3,headY+A.headH-1,hz1+A.headD-3,A.body.highlight);
  const headFrontZ = hz1+A.headD-1;

  // Special features (before face so face overwrites)
  if (A.specialBuilder) A.specialBuilder(grid,cx,cz,hx1,headY,A.headW,A.headH,A.headD,headFrontZ,bx1,bodyY,A.bodyW,A.bodyH,A.bodyD,bodyFrontZ,armLX,armRX,armY,A.armH,A.armW,A.armD,legY,A.legW,A.legH,A.legD,A.body);

  // Face map
  applyFaceMap(grid,A.faceMap,cx,headY+A.headH-1-A.faceTopOffset,headFrontZ,A.faceColorLookup);

  // Ears
  if (A.earBuilder) A.earBuilder(grid,cx,headY+A.headH,cz,A.headW,A.body);

  // Tail
  if (A.tailBuilder) A.tailBuilder(grid,cx,bodyY+Math.floor(A.bodyH/2),bz1-1,A.body);

  // Held item
  if (A.itemBuilder) A.itemBuilder(grid,armRX+A.armW+1,armY+2,cz);

  return grid;
}

// Shortcuts
export const generateBearAvatar = (s=42) => generateCubicAvatar('bear',{},s);
export const generateCatAvatar = (s=100) => generateCubicAvatar('cat',{},s);
export const generateRabbitAvatar = (s=200) => generateCubicAvatar('rabbit',{},s);
export const generateDogAvatar = (s=300) => generateCubicAvatar('dog',{},s);
export const generatePandaAvatar = (s=400) => generateCubicAvatar('panda',{},s);
export const generateFoxAvatar = (s=500) => generateCubicAvatar('fox',{},s);
export const generatePenguinAvatar = (s=600) => generateCubicAvatar('penguin',{},s);
export const generateHamsterAvatar = (s=700) => generateCubicAvatar('hamster',{},s);
export type { AvatarDef as CubicBodyPlan };
export const CUBIC_PLANS = AVATARS;
