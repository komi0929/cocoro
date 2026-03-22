/**
 * VoxelFurniture v3 — 3D Sculpted Furniture
 *
 * Design system rules applied:
 * 1. 3D Sculpture: All parts have rounded edges, no pure rectangles
 * 2. 3-Color Grading: base + shadow(×0.75) + highlight(×1.15)
 * 3. Warm Colors: No pure gray/white/black
 * 4. kawaii details: faces, blush, small decorations
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import { fillRoundedBox3D, adjustBrightness } from './VoxelPrimitives';

function cp(base: string) {
  return { base, shadow: adjustBrightness(base, 0.75), highlight: adjustBrightness(base, 1.15) };
}

function fillEllipsoid(
  grid: VoxelData, cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number, color: string,
) {
  for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) for (let dz = -rz; dz <= rz; dz++) {
    if ((dx/rx)**2 + (dy/ry)**2 + (dz/rz)**2 <= 1.05) setVoxel(grid, cx+dx, cy+dy, cz+dz, color);
  }
}

function fillEllipse2D(grid: VoxelData, cx: number, cy: number, z: number, rx: number, ry: number, color: string) {
  for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
    if ((dx/rx)**2 + (dy/ry)**2 <= 1.0) setVoxel(grid, cx+dx, cy+dy, z, color);
  }
}

// ============================================================
// Honey Jar — sculpted with kawaii face
// ============================================================
export function generateHoneyJar(_seed = 42): VoxelData {
  const grid = createGrid(14, 16, 14);
  const cx = 7, cz = 7;
  const honey = cp('#FFD54F');
  const wood = cp('#8B5A36');

  // Body: ellipsoid (barrel shape)
  fillEllipsoid(grid, cx, 5, cz, 4, 5, 4, honey.base);
  // Darker bottom
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (grid[0]?.[cz+dz]?.[cx+dx] != null) setVoxel(grid, cx+dx, 0, cz+dz, honey.shadow);
  }

  // Neck
  fillRoundedBox3D(grid, cx-2, 10, cz-2, cx+2, 11, cz+2, honey.shadow, 1);

  // Lid
  fillRoundedBox3D(grid, cx-3, 12, cz-3, cx+3, 12, cz+3, wood.base, 1);
  fillRoundedBox3D(grid, cx-2, 13, cz-2, cx+2, 13, cz+2, wood.base, 1);
  setVoxel(grid, cx, 14, cz, wood.shadow);

  // Label (front)
  fillBox(grid, cx-2, 4, cz+4, cx+2, 7, cz+4, '#FFF8E1');

  // kawaii face on label
  const fz = cz + 5;
  setVoxel(grid, cx-1, 6, fz-1, '#1A1A1A'); setVoxel(grid, cx+1, 6, fz-1, '#1A1A1A');
  setVoxel(grid, cx-1, 7, fz-1, '#FFFFFF'); setVoxel(grid, cx+1, 7, fz-1, '#FFFFFF');
  setVoxel(grid, cx, 5, fz-1, '#8B6914'); // mouth
  setVoxel(grid, cx-2, 5, fz-1, '#FFB6C1'); setVoxel(grid, cx+2, 5, fz-1, '#FFB6C1'); // blush

  // Honey drip
  setVoxel(grid, cx+3, 8, cz+3, '#DAA520');
  setVoxel(grid, cx+3, 7, cz+3, '#DAA520');
  setVoxel(grid, cx+3, 6, cz+3, '#E4B027');

  return grid;
}

// ============================================================
// Table — rounded top, tapered legs
// ============================================================
export function generateTable(_seed = 100): VoxelData {
  const grid = createGrid(16, 10, 12);
  const w = cp('#A0724E');
  const top = cp('#C49060');

  // Tabletop (rounded box)
  fillRoundedBox3D(grid, 0, 7, 0, 15, 9, 11, top.base, 1);
  // Top highlight
  fillBox(grid, 1, 9, 1, 14, 9, 10, top.highlight);
  // Bottom shadow
  fillBox(grid, 1, 7, 1, 14, 7, 10, top.shadow);

  // 4 legs (tapered: wider at top, narrower at bottom)
  for (const [lx, lz] of [[1,1],[13,1],[1,9],[13,9]]) {
    fillBox(grid, lx, 2, lz, lx+1, 6, lz+1, w.base);
    setVoxel(grid, lx, 0, lz, w.shadow); setVoxel(grid, lx+1, 0, lz, w.shadow);
    setVoxel(grid, lx, 0, lz+1, w.shadow); setVoxel(grid, lx+1, 0, lz+1, w.shadow);
    setVoxel(grid, lx, 1, lz, w.base); setVoxel(grid, lx+1, 1, lz+1, w.base);
  }

  return grid;
}

// ============================================================
// Chair — rounded seat cushion, warm wood
// ============================================================
export function generateChair(_seed = 200): VoxelData {
  const grid = createGrid(10, 16, 10);
  const w = cp('#A0724E');
  const cushion = cp('#FF8A65');

  // Legs
  for (const [lx, lz] of [[0,0],[8,0],[0,8],[8,8]]) {
    fillBox(grid, lx, 0, lz, lx+1, 5, lz+1, w.base);
    setVoxel(grid, lx, 0, lz, w.shadow); setVoxel(grid, lx+1, 0, lz+1, w.shadow);
  }

  // Seat frame
  fillRoundedBox3D(grid, 0, 6, 0, 9, 7, 9, w.base, 1);

  // Cushion (ellipsoid on top)
  fillEllipsoid(grid, 5, 8, 5, 4, 1, 4, cushion.base);
  // Cushion highlight
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (grid[9]?.[5+dz]?.[5+dx] != null) setVoxel(grid, 5+dx, 9, 5+dz, cushion.highlight);
  }

  // Backrest
  fillRoundedBox3D(grid, 0, 8, 8, 9, 14, 9, w.base, 1);
  fillBox(grid, 1, 14, 8, 8, 14, 9, w.highlight);

  return grid;
}

// ============================================================
// Lamp — ellipsoid shade
// ============================================================
export function generateLamp(_seed = 300): VoxelData {
  const grid = createGrid(10, 16, 10);
  const metal = cp('#D4A574');
  const shade = cp('#FFE4B5');

  // Base (rounded)
  fillRoundedBox3D(grid, 2, 0, 2, 7, 1, 7, metal.base, 1);
  setVoxel(grid, 3, 0, 3, metal.shadow); setVoxel(grid, 6, 0, 6, metal.shadow);

  // Pole
  fillBox(grid, 4, 2, 4, 5, 8, 5, metal.base);

  // Shade (ellipsoid)
  fillEllipsoid(grid, 5, 12, 5, 4, 3, 4, shade.base);
  // Shade highlight (top)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (grid[14]?.[5+dz]?.[5+dx] != null) setVoxel(grid, 5+dx, 14, 5+dz, shade.highlight);
  }
  // Light glow
  setVoxel(grid, 5, 9, 5, '#FFFDE7');
  setVoxel(grid, 4, 9, 5, '#FFFDE7');

  return grid;
}

// ============================================================
// Cushion — puffy ellipsoid with face
// ============================================================
export function generateCushion(_seed = 400, color = '#FF8A65'): VoxelData {
  const grid = createGrid(12, 6, 12);
  const c = cp(color);

  fillEllipsoid(grid, 6, 3, 6, 5, 2, 5, c.base);
  // Highlight top
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (grid[5]?.[6+dz]?.[6+dx] != null) setVoxel(grid, 6+dx, 5, 6+dz, c.highlight);
  }
  // Shadow bottom
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (grid[1]?.[6+dz]?.[6+dx] != null) setVoxel(grid, 6+dx, 1, 6+dz, c.shadow);
  }

  // kawaii face
  const fz = 11;
  setVoxel(grid, 4, 3, fz, '#1A1A1A'); setVoxel(grid, 8, 3, fz, '#1A1A1A');
  setVoxel(grid, 6, 2, fz, '#FFB6C1');

  return grid;
}

// ============================================================
// Potted Plant — rounded pot, organic leaves
// ============================================================
export function generatePottedPlant(_seed = 500): VoxelData {
  const grid = createGrid(10, 14, 10);
  const pot = cp('#B8642E');
  const green = cp('#4CAF50');

  // Pot (tapered ellipsoid)
  fillEllipsoid(grid, 5, 3, 5, 3, 3, 3, pot.base);
  // Rim
  fillRoundedBox3D(grid, 2, 6, 2, 8, 6, 8, pot.highlight, 1);
  // Soil
  fillEllipse2D(grid, 5, 5, 6, 3, 3, '#5D4037');

  // Leaves (overlapping ellipsoids)
  fillEllipsoid(grid, 5, 9, 5, 3, 2, 3, green.base);
  fillEllipsoid(grid, 4, 11, 4, 2, 1, 2, green.highlight);
  fillEllipsoid(grid, 6, 10, 6, 2, 2, 2, adjustBrightness(green.base, 0.9));
  // Stem
  setVoxel(grid, 5, 7, 5, '#2E7D32');
  setVoxel(grid, 5, 8, 5, '#388E3C');

  return grid;
}

// ============================================================
// Bookshelf — warm wood, rounded edges, colorful books
// ============================================================
export function generateBookshelf(_seed = 600): VoxelData {
  const grid = createGrid(16, 18, 7);
  const w = cp('#A0724E');

  // Frame (sides)
  fillRoundedBox3D(grid, 0, 0, 0, 1, 17, 6, w.shadow, 1);
  fillRoundedBox3D(grid, 14, 0, 0, 15, 17, 6, w.shadow, 1);

  // Shelves
  for (const sy of [0, 4, 8, 12, 17]) {
    fillRoundedBox3D(grid, 0, sy, 0, 15, sy, 6, w.base, 0);
    fillBox(grid, 1, sy, 1, 14, sy, 5, w.highlight);
  }

  // Back panel
  fillBox(grid, 0, 0, 6, 15, 17, 6, w.shadow);

  // Books
  const BOOKS = ['#8B2222','#1E4D8C','#2E6B2E','#8B5E14','#5C2D91','#B87333','#CD4545','#4169E1','#6B2C6B','#2F5F5F'];
  let ci = 0;
  for (const by of [1, 5, 9, 13]) {
    let x = 2;
    while (x < 14) {
      const bookH = by === 13 ? 3 : 3;
      const c = BOOKS[ci % BOOKS.length]!;
      fillBox(grid, x, by, 2, x, by + bookH - 1, 5, c);
      // Book highlight (top edge)
      setVoxel(grid, x, by + bookH - 1, 3, adjustBrightness(c, 1.3));
      x += 1; ci++;
    }
  }

  return grid;
}

// ============================================================
// Bed — soft blanket, puffy pillows
// ============================================================
export function generateBed(_seed = 700): VoxelData {
  const grid = createGrid(16, 10, 20);
  const w = cp('#A0724E');
  const sheet = cp('#B3E5FC');
  const pillow = cp('#FFF8E1');

  // Frame (rounded)
  fillRoundedBox3D(grid, 0, 0, 0, 15, 3, 19, w.base, 1);
  fillBox(grid, 1, 0, 1, 14, 0, 18, w.shadow);

  // Mattress
  fillBox(grid, 1, 4, 1, 14, 5, 18, '#FFFFFF');

  // Blanket (puffed up with ellipsoid)
  fillEllipsoid(grid, 8, 7, 12, 6, 2, 6, sheet.base);
  // Blanket highlight
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    if (grid[8]?.[12+dz]?.[8+dx] != null) setVoxel(grid, 8+dx, 8, 12+dz, sheet.highlight);
  }

  // Pillows (ellipsoids)
  fillEllipsoid(grid, 4, 7, 3, 3, 1, 2, pillow.base);
  fillEllipsoid(grid, 12, 7, 3, 3, 1, 2, pillow.base);
  // Pillow highlights
  setVoxel(grid, 4, 8, 3, pillow.highlight); setVoxel(grid, 12, 8, 3, pillow.highlight);

  // Headboard
  fillRoundedBox3D(grid, 0, 4, 0, 15, 9, 0, w.base, 1);
  fillBox(grid, 1, 9, 0, 14, 9, 0, w.highlight);

  return grid;
}

// ============================================================
// Cake — layered with strawberries
// ============================================================
export function generateCake(_seed = 800): VoxelData {
  const grid = createGrid(12, 10, 12);
  const cx = 6, cz = 6;
  const cake = cp('#CD853F');
  const cream = cp('#FFF8E1');

  // Base layer (ellipsoid)
  fillEllipsoid(grid, cx, 2, cz, 4, 2, 4, cake.base);

  // Cream layer
  fillEllipse2D(grid, cx, 2, cz, 4, 4, cream.base);
  // Top cream
  fillEllipse2D(grid, cx, 4, cz, 3, 3, cream.base);
  fillEllipse2D(grid, cx, 5, cz, 2, 2, cream.highlight);

  // Strawberries
  const berry = '#FF4444';
  setVoxel(grid, cx-2, 5, cz, berry); setVoxel(grid, cx+2, 5, cz, berry);
  setVoxel(grid, cx, 5, cz-2, berry); setVoxel(grid, cx, 5, cz+2, berry);
  // Top cream swirl
  setVoxel(grid, cx, 6, cz, cream.base);
  setVoxel(grid, cx, 7, cz, cream.highlight);

  return grid;
}
