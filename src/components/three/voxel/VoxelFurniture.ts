/**
 * VoxelFurniture v4 — Hardcoded Voxel-Perfect Furniture
 *
 * 参考画像 NORTH_STAR_3 を1ボクセル単位で精密再現。
 * ソファ、冷蔵庫、TV、壁時計、テーブル、椅子、ランプ、
 * 花瓶+花、コーヒーカップ、イーゼル、本の山、観葉植物、毛糸玉
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';

// ============================================================
// Color palettes — from reference image
// ============================================================
const WOOD = { base: '#A0724E', dark: '#7A5530', light: '#C49060' };
const SOFA = { base: '#C8B898', dark: '#A89878', light: '#E0D4B8', cushion: '#D8C8A0' };
const FRIDGE = { body: '#F5F0E0', dark: '#D8D0C0', handle: '#A0A0A0', trim: '#C0B8A8' };
const TV_C = { body: '#8B4513', dark: '#5C2E08', screen: '#2A4040', knob: '#FFD54F', antenna: '#555555' };
const CLOCK = { face: '#F5F0E0', frame: '#A0724E', hand: '#1A1A1A', dot: '#333333' };
const LAMP = { pole: '#C49060', shade: '#FFE4B5', shadeDark: '#DCC49A', light: '#FFFDE7' };
const FLOWER = { pot: '#E8E0D0', stem: '#2E8B57', petal: '#FF3333', center: '#FFD700', leaf: '#228B22' };
const COFFEE = { cup: '#B8A898', dark: '#8B7B68', liquid: '#4A2810' };
const EASEL = { wood: '#A0724E', woodDk: '#7A5530', canvas: '#F5F0E0', sky: '#87CEEB', ground: '#4CAF50', sun: '#FFD700' };
const BOOK = { red: '#8B2222', blue: '#1E4D8C', green: '#2E6B2E', brown: '#8B5E14', purple: '#5C2D91' };
const PLANT = { pot: '#B8642E', potDark: '#8B4513', soil: '#5D4037', green: '#4CAF50', greenDk: '#2E7D32', greenLt: '#66BB6A' };
const YARN = { base: '#5BC0EB', dark: '#3A9BC0', light: '#88D4F0', thread: '#4AA8D0' };

// ============================================================
// SOFA — 参考画像: wide 3-seat, tan, with cushion
// Grid: 28W × 14H × 12D
// ============================================================
export function generateSofa(_seed = 42): VoxelData {
  const W = 28, H = 14, D = 12;
  const g = createGrid(W, H, D);
  const S = SOFA;

  // Wooden feet (4 small blocks at corners)
  for (const [fx, fz] of [[2,2],[25,2],[2,9],[25,9]]) {
    fillBox(g, fx,0,fz, fx+1,0,fz+1, WOOD.base);
  }

  // Base/frame
  fillBox(g, 1,1,1, 26,2,10, S.dark);

  // Seat cushions (3 sections with gaps)
  fillBox(g, 1,3,2, 8,4,9, S.base);   // left cushion
  fillBox(g, 10,3,2, 18,4,9, S.base);  // center cushion
  fillBox(g, 20,3,2, 27,4,9, S.base);  // right cushion
  // Cushion top highlight
  fillBox(g, 2,4,3, 7,4,8, S.light);
  fillBox(g, 11,4,3, 17,4,8, S.light);
  fillBox(g, 21,4,3, 26,4,8, S.light);

  // Back rest (tall, same width as seat)
  fillBox(g, 1,3,0, 26,12,1, S.base);
  fillBox(g, 2,5,0, 25,12,0, S.light);  // back highlight
  // Back top edge
  fillBox(g, 1,12,0, 26,12,1, S.dark);

  // Armrests (sides)
  fillBox(g, 0,3,1, 1,8,10, S.base);   // left arm
  fillBox(g, 0,8,1, 1,8,10, S.light);  // left arm top
  fillBox(g, 26,3,1, 27,8,10, S.base); // right arm
  fillBox(g, 26,8,1, 27,8,10, S.light);

  // Decorative cushion/pillow on sofa
  fillBox(g, 11,5,4, 14,8,7, '#D4A85A');
  fillBox(g, 12,6,4, 13,7,4, '#E8C870');  // pillow pattern

  return g;
}

// ============================================================
// FRIDGE — 参考画像: tall cream, silver handles
// Grid: 12W × 26H × 10D
// ============================================================
export function generateFridge(_seed = 100): VoxelData {
  const W = 12, H = 26, D = 10;
  const g = createGrid(W, H, D);
  const F = FRIDGE;

  // Main body
  fillBox(g, 0,0,0, 11,25,9, F.body);

  // Side edges darker
  fillBox(g, 0,0,0, 0,25,9, F.dark);
  fillBox(g, 11,0,0, 11,25,9, F.dark);

  // Top darker
  fillBox(g, 0,25,0, 11,25,9, F.trim);

  // Door split line (horizontal at y=12)
  fillBox(g, 1,12,9, 10,12,9, F.dark);

  // Upper door handle (silver, right side)
  fillBox(g, 9,15,9, 10,18,9, F.handle);
  setVoxel(g, 10,15,9, F.handle);
  setVoxel(g, 10,18,9, F.handle);

  // Lower door handle
  fillBox(g, 9,5,9, 10,8,9, F.handle);

  // Bottom shadow
  fillBox(g, 0,0,0, 11,0,9, F.dark);

  return g;
}

// ============================================================
// RETRO TV — 参考画像: boxy brown TV on legs, antenna
// Grid: 14W × 16H × 10D
// ============================================================
export function generateTV(_seed = 200): VoxelData {
  const W = 14, H = 16, D = 10;
  const g = createGrid(W, H, D);
  const T = TV_C;

  // Stand/table legs
  for (const [lx, lz] of [[1,1],[12,1],[1,8],[12,8]]) {
    fillBox(g, lx,0,lz, lx,3,lz, WOOD.base);
  }
  // Table top
  fillBox(g, 0,4,0, 13,4,9, WOOD.base);
  fillBox(g, 1,4,1, 12,4,8, WOOD.light);

  // TV body
  fillBox(g, 1,5,1, 12,13,8, T.body);
  fillBox(g, 1,5,1, 12,5,8, T.dark);   // bottom edge dark
  fillBox(g, 1,13,1, 12,13,8, T.dark);  // top edge dark

  // Screen (recessed, dark)
  fillBox(g, 2,6,8, 9,12,8, T.screen);
  // Screen bezel
  fillBox(g, 2,6,8, 9,6,8, '#333333');
  fillBox(g, 2,12,8, 9,12,8, '#333333');

  // Control panel (right side of front)
  fillBox(g, 10,7,8, 11,11,8, T.dark);
  setVoxel(g, 10,10,8, T.knob);  // knob 1
  setVoxel(g, 11,10,8, T.knob);
  setVoxel(g, 10,8,8, T.knob);   // knob 2

  // Antenna (V-shape on top)
  setVoxel(g, 5,14,5, T.antenna);
  setVoxel(g, 4,15,4, T.antenna);
  setVoxel(g, 8,14,5, T.antenna);
  setVoxel(g, 9,15,4, T.antenna);
  setVoxel(g, 6,14,5, T.antenna);
  setVoxel(g, 7,14,5, T.antenna);

  return g;
}

// ============================================================
// WALL CLOCK — 参考画像: round face, brown frame
// Grid: 10W × 10H × 2D (thin, wall-mounted)
// ============================================================
export function generateWallClock(_seed = 250): VoxelData {
  const W = 10, H = 10, D = 2;
  const g = createGrid(W, H, D);
  const C = CLOCK;

  // Round frame (circle, r=4)
  const cx = 5, cy = 5;
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const d = dx*dx + dy*dy;
      if (d <= 16) {
        // Outer ring = frame, inner = face
        const color = d >= 12 ? C.frame : C.face;
        setVoxel(g, cx+dx, cy+dy, 0, color);
        setVoxel(g, cx+dx, cy+dy, 1, color);
      }
    }
  }

  // Hour marks (12, 3, 6, 9)
  setVoxel(g, cx, cy+3, 1, C.dot);     // 12
  setVoxel(g, cx+3, cy, 1, C.dot);     // 3
  setVoxel(g, cx, cy-3, 1, C.dot);     // 6
  setVoxel(g, cx-3, cy, 1, C.dot);     // 9

  // Hands
  setVoxel(g, cx, cy+1, 1, C.hand);    // minute hand up
  setVoxel(g, cx, cy+2, 1, C.hand);
  setVoxel(g, cx+1, cy, 1, C.hand);    // hour hand right
  setVoxel(g, cx+2, cy, 1, C.hand);

  // Center dot
  setVoxel(g, cx, cy, 1, '#FF0000');

  return g;
}

// ============================================================
// TABLE — 参考画像: simple wooden table with 4 legs
// Grid: 16W × 10H × 12D
// ============================================================
export function generateTable(_seed = 100): VoxelData {
  const W = 16, H = 10, D = 12;
  const g = createGrid(W, H, D);

  // Tabletop (thick with highlight)
  fillBox(g, 0,7,0, 15,9,11, WOOD.base);
  fillBox(g, 1,9,1, 14,9,10, WOOD.light);  // top highlight
  fillBox(g, 0,7,0, 15,7,11, WOOD.dark);   // bottom shadow

  // 4 legs (square, slightly tapered look)
  for (const [lx, lz] of [[1,1],[13,1],[1,9],[13,9]]) {
    fillBox(g, lx,0,lz, lx+1,6,lz+1, WOOD.base);
    fillBox(g, lx,0,lz, lx+1,0,lz+1, WOOD.dark);  // foot dark
  }

  return g;
}

// ============================================================
// CHAIR — 参考画像: simple wooden chair
// Grid: 10W × 16H × 10D
// ============================================================
export function generateChair(_seed = 200): VoxelData {
  const W = 10, H = 16, D = 10;
  const g = createGrid(W, H, D);

  // 4 legs
  for (const [lx, lz] of [[0,0],[8,0],[0,8],[8,8]]) {
    fillBox(g, lx,0,lz, lx+1,5,lz+1, WOOD.base);
    fillBox(g, lx,0,lz, lx+1,0,lz+1, WOOD.dark);
  }

  // Seat
  fillBox(g, 0,6,0, 9,7,9, WOOD.base);
  fillBox(g, 1,7,1, 8,7,8, WOOD.light);

  // Backrest (2 vertical slats)
  fillBox(g, 0,8,8, 9,14,9, WOOD.base);
  fillBox(g, 1,14,8, 8,14,9, WOOD.light);  // top rail
  // Back panel opening (gap between slats)
  fillBox(g, 3,9,8, 6,12,8, null as unknown as string);

  return g;
}

// ============================================================
// TABLE LAMP — 参考画像: pole on small table, yellow shade
// Grid: 8W × 18H × 8D
// ============================================================
export function generateLamp(_seed = 300): VoxelData {
  const W = 8, H = 18, D = 8;
  const g = createGrid(W, H, D);
  const L = LAMP;

  // Small side table
  fillBox(g, 0,0,0, 7,0,7, WOOD.dark);   // feet
  for (const [lx, lz] of [[0,0],[6,0],[0,6],[6,6]]) {
    fillBox(g, lx,1,lz, lx+1,5,lz+1, WOOD.base);
  }
  fillBox(g, 0,6,0, 7,7,7, WOOD.base);
  fillBox(g, 1,7,1, 6,7,6, WOOD.light);

  // Lamp pole
  fillBox(g, 3,8,3, 4,12,4, L.pole);

  // Lamp shade (tapered trapezoid)
  fillBox(g, 1,13,1, 6,13,6, L.shadeDark);  // bottom wide
  fillBox(g, 1,14,1, 6,14,6, L.shade);
  fillBox(g, 2,15,2, 5,15,5, L.shade);
  fillBox(g, 2,16,2, 5,16,5, L.shade);
  fillBox(g, 3,17,3, 4,17,4, L.shade);
  // Light glow inside
  setVoxel(g, 3,13,3, L.light);
  setVoxel(g, 4,13,4, L.light);

  return g;
}

// ============================================================
// FLOWER VASE — 参考画像: white vase with red flower
// Grid: 8W × 14H × 8D
// ============================================================
export function generateFlowerVase(_seed = 320): VoxelData {
  const W = 8, H = 14, D = 8;
  const g = createGrid(W, H, D);
  const F = FLOWER;

  // Vase body (white, tapered)
  fillBox(g, 2,0,2, 5,1,5, F.pot);      // base wide
  fillBox(g, 2,0,2, 5,0,5, '#D0C8B8');  // base shadow
  fillBox(g, 2,2,2, 5,5,5, F.pot);      // body
  fillBox(g, 3,6,3, 4,6,4, F.pot);      // neck narrow
  fillBox(g, 2,7,2, 5,7,5, F.pot);      // rim

  // Stem
  setVoxel(g, 4,8,4, F.stem);
  setVoxel(g, 4,9,4, F.stem);
  setVoxel(g, 4,10,4, F.stem);

  // Leaves
  setVoxel(g, 3,9,4, F.leaf);
  setVoxel(g, 5,10,4, F.leaf);
  setVoxel(g, 3,10,3, F.leaf);

  // Flower petals (red cross pattern)
  setVoxel(g, 4,11,4, F.center);         // center
  setVoxel(g, 3,11,4, F.petal);          // left
  setVoxel(g, 5,11,4, F.petal);          // right
  setVoxel(g, 4,12,4, F.petal);          // top
  setVoxel(g, 4,11,3, F.petal);          // front
  setVoxel(g, 4,11,5, F.petal);          // back
  // Outer petals
  setVoxel(g, 3,12,4, F.petal);
  setVoxel(g, 5,12,4, F.petal);
  setVoxel(g, 4,12,3, F.petal);
  setVoxel(g, 4,12,5, F.petal);
  setVoxel(g, 4,13,4, F.petal);

  return g;
}

// ============================================================
// COFFEE CUP — 参考画像: small cup on small table
// Grid: 10W × 8H × 10D
// ============================================================
export function generateCoffeeTable(_seed = 340): VoxelData {
  const W = 10, H = 8, D = 10;
  const g = createGrid(W, H, D);

  // Small side table
  for (const [lx, lz] of [[1,1],[7,1],[1,7],[7,7]]) {
    fillBox(g, lx,0,lz, lx+1,3,lz+1, WOOD.base);
    fillBox(g, lx,0,lz, lx+1,0,lz+1, WOOD.dark);
  }
  fillBox(g, 0,4,0, 9,4,9, WOOD.base);
  fillBox(g, 1,4,1, 8,4,8, WOOD.light);

  // Cup (cylindrical)
  const cx = 5, cz = 5;
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx*dx + dz*dz <= 1) {
          setVoxel(g, cx+dx, 5+dy, cz+dz, COFFEE.cup);
        }
      }
    }
  }
  // Coffee liquid (dark inside)
  setVoxel(g, cx, 7, cz, COFFEE.liquid);
  setVoxel(g, cx-1, 7, cz, COFFEE.liquid);
  setVoxel(g, cx+1, 7, cz, COFFEE.liquid);
  setVoxel(g, cx, 7, cz-1, COFFEE.liquid);
  setVoxel(g, cx, 7, cz+1, COFFEE.liquid);

  // Handle
  setVoxel(g, cx+2, 6, cz, COFFEE.dark);
  setVoxel(g, cx+2, 5, cz, COFFEE.dark);

  return g;
}

// ============================================================
// EASEL WITH PAINTING — 参考画像: A-frame easel, landscape canvas
// Grid: 10W × 16H × 8D
// ============================================================
export function generateEasel(_seed = 360): VoxelData {
  const W = 10, H = 16, D = 8;
  const g = createGrid(W, H, D);
  const E = EASEL;

  // Legs (A-frame: 2 front, 1 back)
  fillBox(g, 1,0,5, 1,10,5, E.wood);    // left leg
  fillBox(g, 8,0,5, 8,10,5, E.wood);    // right leg
  fillBox(g, 4,0,1, 5,8,1, E.woodDk);   // back leg

  // Cross bar
  fillBox(g, 1,5,5, 8,5,5, E.wood);

  // Canvas ledge
  fillBox(g, 1,6,5, 8,6,6, E.wood);

  // Canvas/painting
  fillBox(g, 2,7,6, 7,14,6, E.canvas);  // canvas base

  // Painting: simple landscape
  fillBox(g, 2,7,6, 7,9,6, E.ground);   // grass
  fillBox(g, 2,10,6, 7,14,6, E.sky);    // sky
  // Sun
  setVoxel(g, 6,13,6, E.sun);
  setVoxel(g, 5,13,6, E.sun);
  setVoxel(g, 6,12,6, E.sun);
  // Mountain
  setVoxel(g, 3,10,6, '#6B8E23');
  setVoxel(g, 4,10,6, '#6B8E23');
  setVoxel(g, 4,11,6, '#6B8E23');
  // Tree
  setVoxel(g, 2,10,6, '#228B22');
  setVoxel(g, 2,11,6, '#228B22');

  // Frame border (brown)
  fillBox(g, 2,7,6, 7,7,6, E.wood);
  fillBox(g, 2,14,6, 7,14,6, E.wood);
  fillBox(g, 2,7,6, 2,14,6, E.wood);
  fillBox(g, 7,7,6, 7,14,6, E.wood);

  return g;
}

// ============================================================
// BOOK STACK — 参考画像: 3-4 books stacked
// Grid: 8W × 6H × 6D
// ============================================================
export function generateBookStack(_seed = 380): VoxelData {
  const W = 8, H = 6, D = 6;
  const g = createGrid(W, H, D);

  // Book 1 (bottom, largest, red)
  fillBox(g, 0,0,0, 7,1,5, BOOK.red);
  fillBox(g, 1,1,1, 6,1,4, '#A03333'); // page edge
  setVoxel(g, 0,0,0, '#6B1818');

  // Book 2 (green, slightly offset)
  fillBox(g, 1,2,0, 7,3,5, BOOK.green);
  fillBox(g, 2,3,1, 6,3,4, '#3A8040'); // page edge

  // Book 3 (thin, brown)
  fillBox(g, 0,4,1, 6,4,4, BOOK.brown);

  // Book 4 (top, blue, small)
  fillBox(g, 1,5,0, 5,5,4, BOOK.blue);

  return g;
}

// ============================================================
// POTTED PLANT — 参考画像: terracotta pot, bushy green
// Grid: 10W × 14H × 10D
// ============================================================
export function generatePottedPlant(_seed = 500): VoxelData {
  const W = 10, H = 14, D = 10;
  const g = createGrid(W, H, D);
  const P = PLANT;

  // Pot (terracotta, tapered)
  fillBox(g, 2,0,2, 7,0,7, P.potDark);  // base
  fillBox(g, 2,1,2, 7,3,7, P.pot);       // pot body
  fillBox(g, 1,4,1, 8,4,8, P.pot);       // rim (wider)
  fillBox(g, 1,4,1, 8,4,8, '#C0724E');   // rim highlight

  // Soil
  fillBox(g, 2,4,2, 7,4,7, P.soil);

  // Bushy leaves (clustered spheroid)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const d = dx*dx + dy*dy*2 + dz*dz;
        if (d <= 12) {
          const c = dy >= 1 ? P.greenLt : (dx + dz) % 3 === 0 ? P.greenDk : P.green;
          setVoxel(g, 5+dx, 8+dy, 5+dz, c);
        }
      }
    }
  }

  // Stem
  setVoxel(g, 5,5,5, P.greenDk);
  setVoxel(g, 5,6,5, P.greenDk);

  return g;
}

// ============================================================
// YARN BALL — 参考画像: cyan ball with thread trail
// Grid: 8W × 8H × 8D
// ============================================================
export function generateYarnBall(_seed = 600): VoxelData {
  const W = 8, H = 8, D = 8;
  const g = createGrid(W, H, D);
  const Y = YARN;

  // Sphere (r=3)
  const cx = 4, cy = 4, cz = 4;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (dx*dx + dy*dy + dz*dz <= 9) {
          // Yarn texture: alternating colors based on position
          const stripe = (dx + dy + dz) % 2 === 0 ? Y.base : Y.dark;
          setVoxel(g, cx+dx, cy+dy, cz+dz, stripe);
        }
      }
    }
  }
  // Highlight on top
  setVoxel(g, cx, cy+3, cz, Y.light);
  setVoxel(g, cx-1, cy+3, cz, Y.light);
  setVoxel(g, cx, cy+3, cz-1, Y.light);

  // Yarn wrap lines visible on surface
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI;
    const x = Math.round(cx + Math.cos(angle) * 3);
    const z = Math.round(cz + Math.sin(angle) * 3);
    setVoxel(g, x, cy, z, Y.thread);
  }

  // Thread trailing
  setVoxel(g, cx+3, cy-1, cz, Y.thread);
  setVoxel(g, cx+4, cy-2, cz+1, Y.thread);
  setVoxel(g, cx+5, cy-3, cz+1, Y.thread);
  setVoxel(g, cx+5, cy-3, cz+2, Y.thread);

  return g;
}

// ============================================================
// HONEY JAR — retained, improved
// Grid: 14W × 16H × 14D
// ============================================================
export function generateHoneyJar(_seed = 42): VoxelData {
  const W = 14, H = 16, D = 14;
  const g = createGrid(W, H, D);
  const cx = 7, cz = 7;

  // Body (barrel ellipsoid)
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        if ((dx/4)**2 + (dy/5)**2 + (dz/4)**2 <= 1.0) {
          setVoxel(g, cx+dx, 5+dy, cz+dz, '#FFD54F');
        }
      }
    }
  }
  // Dark bottom
  fillBox(g, 4,0,4, 10,0,10, '#DAA520');

  // Neck
  fillBox(g, 5,10,5, 9,11,9, '#E0B030');

  // Lid (wood)
  fillBox(g, 4,12,4, 10,12,10, WOOD.base);
  fillBox(g, 5,13,5, 9,13,9, WOOD.base);
  setVoxel(g, 7,14,7, WOOD.dark);

  // Label
  fillBox(g, 5,4,11, 9,7,11, '#FFF8E1');
  // Kawaii face
  setVoxel(g, 6,6,12, '#1A1A1A'); setVoxel(g, 8,6,12, '#1A1A1A');
  setVoxel(g, 7,5,12, '#8B6914');
  setVoxel(g, 5,5,12, '#FFB6C1'); setVoxel(g, 9,5,12, '#FFB6C1');

  return g;
}

// ============================================================
// CUSHION — puffy pillow
// Grid: 12W × 6H × 12D
// ============================================================
export function generateCushion(_seed = 400): VoxelData {
  const W = 12, H = 6, D = 12;
  const g = createGrid(W, H, D);
  const color = '#FF8A65';

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        if ((dx/5)**2 + (dy/2)**2 + (dz/5)**2 <= 1.0) {
          const bright = dy >= 1 ? '#FFA080' : (dy <= -1 ? '#E07050' : color);
          setVoxel(g, 6+dx, 3+dy, 6+dz, bright);
        }
      }
    }
  }

  // Kawaii face
  setVoxel(g, 4,3,11, '#1A1A1A'); setVoxel(g, 8,3,11, '#1A1A1A');
  setVoxel(g, 6,2,11, '#FFB6C1');

  return g;
}

// ============================================================
// BOOKSHELF — warm wood, colorful books
// Grid: 16W × 18H × 7D
// ============================================================
export function generateBookshelf(_seed = 600): VoxelData {
  const W = 16, H = 18, D = 7;
  const g = createGrid(W, H, D);

  // Side panels
  fillBox(g, 0,0,0, 1,17,6, WOOD.dark);
  fillBox(g, 14,0,0, 15,17,6, WOOD.dark);

  // Shelves (5 horizontal)
  for (const sy of [0, 4, 8, 12, 17]) {
    fillBox(g, 0,sy,0, 15,sy,6, WOOD.base);
    fillBox(g, 1,sy,1, 14,sy,5, WOOD.light);
  }

  // Back panel
  fillBox(g, 0,0,6, 15,17,6, WOOD.dark);

  // Books on each shelf
  const bookColors = [BOOK.red, BOOK.blue, BOOK.green, BOOK.brown, BOOK.purple,
    '#B87333', '#CD4545', '#4169E1', '#6B2C6B'];
  let ci = 0;
  for (const by of [1, 5, 9, 13]) {
    for (let x = 2; x < 14; x++) {
      const c = bookColors[ci % bookColors.length]!;
      fillBox(g, x, by, 2, x, by+2, 5, c);
      ci++;
    }
  }

  return g;
}

// ============================================================
// BED — soft blanket, pillows, headboard
// Grid: 16W × 10H × 20D
// ============================================================
export function generateBed(_seed = 700): VoxelData {
  const W = 16, H = 10, D = 20;
  const g = createGrid(W, H, D);
  const sheet = '#B3E5FC';
  const pillow = '#FFF8E1';

  // Frame
  fillBox(g, 0,0,0, 15,3,19, WOOD.base);
  fillBox(g, 0,0,0, 15,0,19, WOOD.dark);

  // Mattress
  fillBox(g, 1,4,1, 14,5,18, '#FFFFFF');

  // Blanket
  fillBox(g, 1,6,6, 14,7,18, sheet);
  fillBox(g, 2,7,7, 13,7,17, '#C8E8FF');

  // Pillows
  fillBox(g, 2,6,2, 6,7,5, pillow);
  fillBox(g, 9,6,2, 13,7,5, pillow);
  fillBox(g, 3,7,3, 5,7,4, '#FFFDE7');
  fillBox(g, 10,7,3, 12,7,4, '#FFFDE7');

  // Headboard
  fillBox(g, 0,4,0, 15,9,0, WOOD.base);
  fillBox(g, 1,9,0, 14,9,0, WOOD.light);

  return g;
}

// ============================================================
// CAKE — layered with strawberries
// Grid: 12W × 10H × 12D
// ============================================================
export function generateCake(_seed = 800): VoxelData {
  const W = 12, H = 10, D = 12;
  const g = createGrid(W, H, D);
  const cx = 6, cz = 6;

  // Base layer
  for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    if ((dx/4)**2 + (dy/2)**2 + (dz/4)**2 <= 1) setVoxel(g, cx+dx, 2+dy, cz+dz, '#CD853F');
  }

  // Cream layers
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (dx*dx + dz*dz <= 9) {
      setVoxel(g, cx+dx, 4, cz+dz, '#FFF8E1');
      setVoxel(g, cx+dx, 5, cz+dz, '#FFF8E1');
    }
  }

  // Strawberries
  setVoxel(g, cx-2,5,cz, '#FF4444'); setVoxel(g, cx+2,5,cz, '#FF4444');
  setVoxel(g, cx,5,cz-2, '#FF4444'); setVoxel(g, cx,5,cz+2, '#FF4444');
  // Top
  setVoxel(g, cx,6,cz, '#FFF8E1');
  setVoxel(g, cx,7,cz, '#FF4444');

  return g;
}

// ============================================================
// PARAMETRIC GENERATORS — 全100種の家具をカバーする汎用関数
// ============================================================

/** 汎用: 箱型家具（テーブル、デスク、棚、ラック等） */
export function generateBoxFurniture(
  w: number, h: number, d: number,
  color: string, legH = 0, legColor = '#5C3A1E',
  topColor?: string, _seed = 42,
): VoxelData {
  const g = createGrid(w, h + legH, d);
  // Legs
  if (legH > 0) {
    for (const [lx, lz] of [[1,1],[w-2,1],[1,d-2],[w-2,d-2]]) {
      fillBox(g, lx, 0, lz, lx+1, legH-1, lz+1, legColor);
    }
  }
  // Main body
  fillBox(g, 0, legH, 0, w-1, h+legH-1, d-1, color);
  if (topColor) fillBox(g, 0, h+legH-1, 0, w-1, h+legH-1, d-1, topColor);
  return g;
}

/** 汎用: 座る家具（ソファ、ビーンバッグ等） */
export function generateSeatingFurniture(
  w: number, seatH: number, d: number,
  seatColor: string, backH: number, backColor: string,
  armW = 0, armColor = '#5C3A1E',
  _seed = 42,
): VoxelData {
  const totalH = seatH + backH + 2;
  const g = createGrid(w + armW * 2, totalH, d);
  const ox = armW;
  // Seat
  fillBox(g, ox, 0, 0, ox+w-1, seatH-1, d-1, seatColor);
  // Backrest
  if (backH > 0) fillBox(g, ox, seatH, 0, ox+w-1, seatH+backH-1, 1, backColor);
  // Arms
  if (armW > 0) {
    fillBox(g, 0, 0, 0, armW-1, seatH+2, d-1, armColor);
    fillBox(g, ox+w, 0, 0, ox+w+armW-1, seatH+2, d-1, armColor);
  }
  return g;
}

/** 汎用: 丸い/球形アイテム */
export function generateSphereItem(
  radius: number, color: string, hlColor?: string, _seed = 42,
): VoxelData {
  const s = radius * 2 + 2;
  const g = createGrid(s, s, s);
  const c = Math.floor(s / 2);
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++)
      for (let dz = -radius; dz <= radius; dz++)
        if (dx*dx + dy*dy + dz*dz <= radius*radius)
          setVoxel(g, c+dx, c+dy, c+dz, dy > radius-2 && hlColor ? hlColor : color);
  return g;
}

/** 汎用: 高い家具（棒立ち型：ランタン、ポール等） */
export function generateTallItem(
  baseW: number, baseD: number, baseH: number, baseColor: string,
  poleH: number, poleColor: string,
  topW: number, topH: number, topColor: string,
  _seed = 42,
): VoxelData {
  const totalH = baseH + poleH + topH;
  const maxW = Math.max(baseW, topW);
  const g = createGrid(maxW, totalH, Math.max(baseD, topW));
  const cx = Math.floor(maxW / 2);
  const cz = Math.floor(Math.max(baseD, topW) / 2);
  // Base
  fillBox(g, cx-Math.floor(baseW/2), 0, cz-Math.floor(baseD/2),
    cx+Math.floor(baseW/2), baseH-1, cz+Math.floor(baseD/2), baseColor);
  // Pole
  fillBox(g, cx, baseH, cz, cx+1, baseH+poleH-1, cz+1, poleColor);
  // Top
  const tw = Math.floor(topW/2);
  fillBox(g, cx-tw, baseH+poleH, cz-tw, cx+tw, totalH-1, cz+tw, topColor);
  return g;
}

/** 汎用: 平面家具（ラグ、マット等） */
export function generateFlatItem(
  w: number, d: number, h: number, color: string,
  stripeColor?: string, _seed = 42,
): VoxelData {
  const g = createGrid(w, h, d);
  fillBox(g, 0, 0, 0, w-1, h-1, d-1, color);
  if (stripeColor) {
    fillBox(g, 1, h-1, Math.floor(d/3), w-2, h-1, Math.floor(d/3)+1, stripeColor);
    fillBox(g, 1, h-1, Math.floor(d*2/3), w-2, h-1, Math.floor(d*2/3)+1, stripeColor);
  }
  return g;
}

/** 汎用: 画面付き機器（モニタ、アーケード、PC等） */
export function generateScreenDevice(
  w: number, h: number, d: number,
  bodyColor: string, screenColor: string,
  standH = 0, standColor = '#555555',
  _seed = 42,
): VoxelData {
  const g = createGrid(w, h + standH, d);
  // Stand
  if (standH > 0) {
    fillBox(g, Math.floor(w/2)-1, 0, Math.floor(d/2)-1,
      Math.floor(w/2)+1, standH-1, Math.floor(d/2)+1, standColor);
  }
  // Body
  fillBox(g, 0, standH, 0, w-1, h+standH-1, d-1, bodyColor);
  // Screen (recessed front face)
  fillBox(g, 1, standH+1, d-1, w-2, h+standH-2, d-1, screenColor);
  return g;
}

/** 汎用: 照明（ネオン、キャンドル等） */
export function generateLightItem(
  shape: 'box' | 'sphere' | 'cylinder',
  w: number, h: number, d: number,
  color: string, glowColor?: string,
  _seed = 42,
): VoxelData {
  const g = createGrid(w, h, d);
  const cx = Math.floor(w/2), cy = Math.floor(h/2), cz = Math.floor(d/2);
  if (shape === 'sphere') {
    const r = Math.min(cx, cy, cz) - 1;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        for (let ddz = -r; ddz <= r; ddz++)
          if (dx*dx + dy*dy + ddz*ddz <= r*r)
            setVoxel(g, cx+dx, cy+dy, cz+ddz, color);
  } else if (shape === 'cylinder') {
    const r = Math.min(cx, cz) - 1;
    for (let y = 0; y < h; y++)
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++)
          if (dx*dx + dz*dz <= r*r)
            setVoxel(g, cx+dx, y, cz+dz, color);
  } else {
    fillBox(g, 0, 0, 0, w-1, h-1, d-1, color);
  }
  if (glowColor) {
    setVoxel(g, cx, cy, cz, glowColor);
  }
  return g;
}

// ============================================================
// 一括生成マップ — IDからVoxelDataを生成する関数テーブル
// furniture/VoxelFurniture.tsx の ENGINE_MAP から参照される
// ============================================================
export const FURNITURE_GENERATOR_MAP: Record<string, () => VoxelData> = {
  // --- 既存の精密モデル ---
  sofa: () => generateSofa(),
  fridge: () => generateFridge(),
  tv: () => generateTV(),
  wall_clock: () => generateWallClock(),
  table: () => generateTable(),
  chair: () => generateChair(),
  lamp: () => generateLamp(),
  flower_vase: () => generateFlowerVase(),
  coffee_table: () => generateCoffeeTable(),
  easel: () => generateEasel(),
  book_stack: () => generateBookStack(),
  potted_plant: () => generatePottedPlant(),
  yarn_ball: () => generateYarnBall(),
  honey_jar: () => generateHoneyJar(),
  cushion: () => generateCushion(),
  bookshelf: () => generateBookshelf(),
  bed: () => generateBed(),
  cake: () => generateCake(),

  // --- チル系 (Chill) ---
  l_sofa: () => generateSeatingFurniture(20, 4, 10, '#7c3aed', 5, '#6d28d9', 2, '#5b21b6'),
  beanbag: () => generateSphereItem(5, '#a78bfa', '#8b5cf6'),
  hammock: () => generateFlatItem(16, 6, 1, '#fbbf24', '#d4a574'),
  rug: () => generateFlatItem(18, 12, 1, '#6d28d9', '#a78bfa'),
  rug_round: () => generateFlatItem(12, 12, 1, '#6d28d9'),
  rug_stripe: () => generateFlatItem(16, 10, 1, '#92400e', '#fbbf24'),
  cactus: () => generateTallItem(4, 4, 3, '#92400e', 6, '#16a34a', 2, 2, '#15803d'),
  kotatsu: () => generateBoxFurniture(12, 3, 10, '#dc2626', 4, '#5c3a1e', '#78350f'),
  rocking_chair: () => generateSeatingFurniture(8, 4, 8, '#78350f', 6, '#92400e'),
  daybed: () => generateSeatingFurniture(16, 3, 8, '#7c3aed', 4, '#6d28d9', 1, '#5b21b6'),
  blanket: () => generateFlatItem(10, 8, 1, '#f472b6', '#f9a8d4'),
  pillow_pile: () => generateSphereItem(3, '#06b6d4', '#67e8f9'),
  sleeping_bag: () => generateFlatItem(6, 14, 2, '#16a34a'),
  swing_chair: () => generateSphereItem(5, '#e2e8f0', '#f472b6'),
  futon: () => generateFlatItem(10, 16, 2, '#f5f5f4', '#6d28d9'),
  floor_mat: () => generateFlatItem(8, 16, 1, '#7c3aed'),
  low_table: () => generateBoxFurniture(12, 2, 8, '#92400e', 3, '#78350f', '#78350f'),

  // --- 遊び系 (Play) ---
  arcade: () => generateScreenDevice(10, 16, 8, '#2A2A2A', '#2A4040', 0),
  skateboard: () => generateFlatItem(4, 12, 2, '#fbbf24', '#dc2626'),
  dj_booth: () => generateBoxFurniture(14, 6, 8, '#1e1b4b', 4, '#1A1A1A', '#333333'),
  pizza_box: () => generateBoxFurniture(8, 2, 8, '#CD853F', 0, '', '#FFF8E1'),
  basketball: () => generateSphereItem(4, '#FF8C00', '#FFB74D'),
  guitar: () => generateTallItem(4, 3, 2, '#8B4513', 10, '#A0522D', 3, 3, '#8B4513'),
  boombox: () => generateBoxFurniture(14, 6, 6, '#333333', 0, '', '#555555'),
  big_speaker: () => generateBoxFurniture(8, 14, 8, '#1A1A1A', 0, '', '#333333'),
  pinball: () => generateScreenDevice(12, 14, 8, '#1e40af', '#2A4040', 2),
  vinyl_player: () => generateBoxFurniture(10, 3, 10, '#78350f', 4, '#5c3a1e', '#92400e'),
  foam_sword: () => generateTallItem(2, 2, 2, '#78350f', 10, '#60a5fa', 1, 2, '#3b82f6'),
  dart_board: () => generateLightItem('sphere', 10, 10, 2, '#dc2626', '#F5F5F5'),
  pool_table: () => generateBoxFurniture(18, 3, 10, '#16a34a', 4, '#78350f'),
  karaoke_mic: () => generateTallItem(3, 3, 1, '#555555', 8, '#888888', 3, 3, '#333333'),
  drum_set: () => generateTallItem(6, 6, 4, '#8B4513', 3, '#888888', 4, 3, '#FFD700'),
  soccer_ball: () => generateSphereItem(4, '#FFFFFF', '#1A1A1A'),
  board_game: () => generateBoxFurniture(10, 1, 10, '#78350f', 0, '', '#FFF8E1'),
  vr_headset: () => generateBoxFurniture(6, 4, 6, '#1A1A1A', 0, '', '#3b82f6'),
  trampoline: () => generateFlatItem(14, 14, 3, '#333333', '#60a5fa'),
  punching_bag: () => generateTallItem(3, 3, 4, '#555555', 4, '#888888', 4, 8, '#dc2626'),

  // --- デスク系 (Desk) ---
  desk: () => generateBoxFurniture(16, 2, 8, '#78350f', 6, '#5c3a1e', '#92400e'),
  gaming_chair: () => generateSeatingFurniture(8, 4, 8, '#1A1A1A', 8, '#dc2626', 1, '#333333'),
  monitor: () => generateScreenDevice(14, 10, 3, '#1A1A1A', '#2A4040', 4, '#555555'),
  monitor_dual: () => generateScreenDevice(20, 10, 3, '#1A1A1A', '#2A4040', 4, '#555555'),
  gaming_pc: () => generateBoxFurniture(6, 14, 10, '#1A1A1A', 0, '', '#333333'),
  steel_rack: () => generateBoxFurniture(14, 16, 6, '#9E9E9E', 0, '', '#BDBDBD'),
  filing_cabinet: () => generateBoxFurniture(8, 12, 6, '#78909C', 0, '', '#90A4AE'),
  whiteboard: () => generateScreenDevice(16, 12, 1, '#E0E0E0', '#FFFFFF', 6),
  laptop: () => generateBoxFurniture(8, 1, 6, '#555555', 0, '', '#333333'),
  tablet_stand: () => generateScreenDevice(6, 8, 2, '#333333', '#2A4040', 3, '#555555'),
  desk_organizer: () => generateBoxFurniture(8, 4, 4, '#78350f', 0, '', '#A0724E'),
  keyboard: () => generateFlatItem(12, 4, 1, '#333333', '#555555'),
  mouse_pad: () => generateFlatItem(6, 8, 1, '#1e40af'),
  webcam: () => generateSphereItem(2, '#1A1A1A', '#333333'),
  headset_stand: () => generateTallItem(4, 4, 2, '#333333', 6, '#555555', 4, 2, '#1A1A1A'),
  cable_box: () => generateBoxFurniture(6, 3, 6, '#78350f', 0, '', '#A0724E'),
  standing_desk: () => generateBoxFurniture(16, 2, 8, '#E0E0E0', 10, '#9E9E9E'),

  // --- 照明系 (Light) ---
  floor_lamp: () => generateTallItem(4, 4, 1, '#D4A574', 12, '#D4A574', 6, 4, '#FFE4B5'),
  neon_sign: () => generateLightItem('box', 12, 6, 2, '#FF1493', '#FF69B4'),
  neon_heart: () => generateLightItem('sphere', 8, 8, 2, '#FF1493', '#FF69B4'),
  neon_star: () => generateLightItem('sphere', 8, 8, 2, '#FFD700', '#FFECB3'),
  lava_lamp: () => generateTallItem(3, 3, 2, '#333333', 6, '#FF4500', 3, 3, '#FF6347'),
  string_lights: () => generateFlatItem(16, 1, 1, '#FFD700', '#FF69B4'),
  pendant_light: () => generateLightItem('sphere', 8, 6, 8, '#FFE4B5', '#FFFDE7'),
  candle_set: () => generateTallItem(2, 2, 2, '#F5F0E0', 4, '#F5F0E0', 1, 1, '#FF8C00'),
  disco_ball: () => generateSphereItem(4, '#C0C0C0', '#FFFFFF'),
  spot_light: () => generateTallItem(3, 3, 1, '#1A1A1A', 6, '#555555', 4, 3, '#FFD700'),
  led_strip: () => generateFlatItem(20, 1, 1, '#00FF7F'),
  paper_lantern: () => generateLightItem('sphere', 8, 10, 8, '#FFE4B5', '#FF8C00'),
  fairy_jar: () => generateLightItem('cylinder', 4, 8, 4, '#E0E0E0', '#FFD700'),
  moon_light: () => generateLightItem('sphere', 8, 8, 8, '#FFF8E1', '#FFFDE7'),
  star_projector: () => generateLightItem('cylinder', 6, 8, 6, '#1A1A2E', '#9C27B0'),
  fireplace: () => generateBoxFurniture(12, 10, 6, '#8B4513', 0, '', '#5C2E08'),
  torch: () => generateTallItem(2, 2, 1, '#78350f', 8, '#78350f', 2, 2, '#FF4500'),
  lantern: () => generateLightItem('cylinder', 6, 8, 6, '#D4A574', '#FF8C00'),
  neon_lightning: () => generateLightItem('box', 6, 10, 2, '#00BFFF', '#00FF7F'),

  // --- デコ系 (Deco) ---
  poster: () => generateFlatItem(8, 10, 1, '#dc2626'),
  poster_frame: () => generateBoxFurniture(10, 12, 1, '#78350f', 0, '', '#F5F0E0'),
  wall_shelf: () => generateBoxFurniture(12, 1, 4, '#A0724E'),
  plant: () => generatePottedPlant(),
  plant_tall: () => generateTallItem(4, 4, 2, '#B8642E', 4, '#2E7D32', 6, 4, '#4CAF50'),
  plant_hanging: () => generateTallItem(4, 4, 2, '#92400e', 1, '#2E7D32', 6, 4, '#4CAF50'),
  terrarium: () => generateLightItem('sphere', 8, 8, 8, '#E0F0E0', '#4CAF50'),
  globe: () => generateSphereItem(4, '#1e40af', '#2E8B57'),
  trophy: () => generateTallItem(3, 3, 2, '#FFD700', 3, '#FFD700', 3, 2, '#FFD700'),
  clock: () => generateWallClock(),
  vinyl_record: () => generateFlatItem(8, 8, 1, '#1A1A1A', '#dc2626'),
  mini_fridge: () => generateFridge(),
  fish_tank: () => generateBoxFurniture(12, 8, 6, '#87CEEB', 2, '#555555'),
  dream_catcher: () => generateLightItem('sphere', 8, 10, 2, '#D4A574', '#F5F0E0'),
  mirror: () => generateBoxFurniture(8, 12, 1, '#C0C0C0', 0, '', '#E0E0E0'),
  flag: () => generateFlatItem(6, 10, 1, '#dc2626', '#FFFFFF'),
  photo_frame: () => generateBoxFurniture(8, 10, 1, '#78350f', 0, '', '#F5F0E0'),
  snow_globe: () => generateSphereItem(4, '#E0F0FF', '#FFFFFF'),
  music_box: () => generateBoxFurniture(6, 4, 4, '#8B4513', 0, '', '#FFD700'),
  bonsai: () => generateTallItem(4, 4, 2, '#B8642E', 3, '#5D4037', 5, 3, '#228B22'),
};

