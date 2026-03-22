/**
 * VoxelAvatars v7 — 3D Sculpted Voxel Avatars
 *
 * Key principles from reference analysis:
 * 1. MUZZLE: The snout/mouth area is a 3D BOX that PROTRUDES forward from the face
 * 2. BELLY: The chest/belly is ELLIPTICAL, not a rectangle
 * 3. ARMS: Arms bend FORWARD at the bottom (hands reach toward camera)
 * 4. SPHERICAL ROUNDING: Much more aggressive stepped sphere shape on head & body
 * 5. EARS: Small 3D bumps on top of head, not flat
 * 6. Everything is a 3D SCULPTURE, not a flat surface with textures
 */
import { VoxelData, createGrid, setVoxel, fillBox } from './VoxelGrid';
import { fillRoundedBox3D, adjustBrightness } from './VoxelPrimitives';

// ============================================================
// Utility: Elliptical fill for belly
// ============================================================
function fillEllipse2D(
  grid: VoxelData, cx: number, cy: number, z: number,
  radiusX: number, radiusY: number, color: string,
) {
  for (let dy = -radiusY; dy <= radiusY; dy++) {
    for (let dx = -radiusX; dx <= radiusX; dx++) {
      const nx = dx / radiusX;
      const ny = dy / radiusY;
      if (nx * nx + ny * ny <= 1.0) {
        setVoxel(grid, cx + dx, cy + dy, z, color);
      }
    }
  }
}

// ============================================================
// Utility: Stepped sphere (3D oval body shape)
// ============================================================
function fillSteppedEllipsoid(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  color: string,
) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      for (let dz = -rz; dz <= rz; dz++) {
        const nx = dx / rx;
        const ny = dy / ry;
        const nz = dz / rz;
        if (nx * nx + ny * ny + nz * nz <= 1.05) {
          setVoxel(grid, cx + dx, cy + dy, cz + dz, color);
        }
      }
    }
  }
}

// ============================================================
// Bear — Exact reference reproduction
// ============================================================
function sculptBear(grid: VoxelData, ox: number, oy: number, oz: number) {
  // Colors from reference
  const brown = '#A0722E';       // Warm mid-brown (reference match)
  const darkBrown = '#7A5518';   // Shadow brown
  const lightBrown = '#B88838';  // Highlight brown
  const tan = '#D4B478';         // Belly/muzzle color
  const lightTan = '#E8CCA0';    // Belly highlight
  const black = '#1A1A1A';       // Eyes, nose
  const white = '#FFFFFF';       // Eye highlight

  // Reference proportions (total ~30 voxels tall):
  // Legs: 6h, Body: 12h, Head: 12h
  // Head is ~14w x 12h x 12d (sphere-ish)
  // Body is ~12w x 12h x 10d
  // Muzzle protrudes 3 blocks from face

  // ===== LEGS =====
  const legH = 6, legW = 5, legD = 5;
  const legSpacing = 1; // gap between legs
  const legLX = ox - legSpacing - legW;
  const legRX = ox + legSpacing;
  for (let dy = 0; dy < legH; dy++) {
    for (let dx = 0; dx < legW; dx++) {
      for (let dz = 0; dz < legD; dz++) {
        const c = dy === 0 ? darkBrown : brown;
        setVoxel(grid, legLX + dx, oy + dy, oz - Math.floor(legD / 2) + dz, c);
        setVoxel(grid, legRX + dx, oy + dy, oz - Math.floor(legD / 2) + dz, c);
      }
    }
  }

  // ===== BODY =====
  // Spherical body using stepped ellipsoid
  const bodyW = 14, bodyH = 12, bodyD = 11;
  const bodyCY = oy + legH + Math.floor(bodyH / 2);
  fillSteppedEllipsoid(grid, ox, bodyCY, oz,
    Math.floor(bodyW / 2), Math.floor(bodyH / 2), Math.floor(bodyD / 2), brown);

  // Top highlight
  const bodyTopY = oy + legH + bodyH - 1;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (grid[bodyTopY]?.[oz + dz]?.[ox + dx] != null) {
        setVoxel(grid, ox + dx, bodyTopY, oz + dz, lightBrown);
      }
    }
  }
  // Bottom shadow
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (grid[oy + legH]?.[oz + dz]?.[ox + dx] != null) {
        setVoxel(grid, ox + dx, oy + legH, oz + dz, darkBrown);
      }
    }
  }

  // ===== BELLY (elliptical, on front face +Z) =====
  const bellyRX = 4, bellyRY = 4;
  const bellyCY = bodyCY;
  // Find front Z of body
  const bodyFrontZ = oz + Math.floor(bodyD / 2);
  fillEllipse2D(grid, ox, bellyCY, bodyFrontZ, bellyRX, bellyRY, tan);
  // Belly highlight (smaller ellipse)
  fillEllipse2D(grid, ox, bellyCY + 1, bodyFrontZ, bellyRX - 1, bellyRY - 1, lightTan);

  // ===== ARMS =====
  // Arms are L-shaped: upper part on sides, lower part bends forward
  const armW = 4, armUpperH = 7, armLowerH = 3, armD = 4;
  const armY = oy + legH + bodyH - armUpperH - 1;

  // Left arm — upper (side)
  const armLX = ox - Math.floor(bodyW / 2) - armW;
  for (let dy = 0; dy < armUpperH; dy++) {
    for (let dx = 0; dx < armW; dx++) {
      for (let dz = 0; dz < armD; dz++) {
        setVoxel(grid, armLX + dx, armY + dy, oz - Math.floor(armD / 2) + dz, brown);
      }
    }
  }
  // Left arm — lower (bends forward)
  for (let dy = 0; dy < armLowerH; dy++) {
    for (let dx = 0; dx < armW; dx++) {
      for (let dz = 0; dz < armD; dz++) {
        setVoxel(grid, armLX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, brown);
      }
    }
  }

  // Right arm
  const armRX = ox + Math.floor(bodyW / 2);
  for (let dy = 0; dy < armUpperH; dy++) {
    for (let dx = 0; dx < armW; dx++) {
      for (let dz = 0; dz < armD; dz++) {
        setVoxel(grid, armRX + dx, armY + dy, oz - Math.floor(armD / 2) + dz, brown);
      }
    }
  }
  // Right arm — lower (bends forward)
  for (let dy = 0; dy < armLowerH; dy++) {
    for (let dx = 0; dx < armW; dx++) {
      for (let dz = 0; dz < armD; dz++) {
        setVoxel(grid, armRX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, brown);
      }
    }
  }

  // ===== HEAD =====
  // Spherical head using stepped ellipsoid
  const headW = 16, headH = 14, headD = 14;
  const headCY = oy + legH + bodyH + Math.floor(headH / 2) - 2; // slight overlap
  fillSteppedEllipsoid(grid, ox, headCY, oz,
    Math.floor(headW / 2), Math.floor(headH / 2), Math.floor(headD / 2), brown);

  // Head top highlight
  const headTopY = headCY + Math.floor(headH / 2);
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      if (grid[headTopY]?.[oz + dz]?.[ox + dx] != null) {
        setVoxel(grid, ox + dx, headTopY, oz + dz, lightBrown);
      }
    }
  }

  // ===== MUZZLE (3D protrusion from face) =====
  const muzzleW = 6, muzzleH = 4, muzzleD = 3;
  const muzzleCY = headCY - 2; // below center of head
  const headFrontZ = oz + Math.floor(headD / 2);
  for (let dx = -Math.floor(muzzleW / 2); dx < Math.floor(muzzleW / 2); dx++) {
    for (let dy = 0; dy < muzzleH; dy++) {
      for (let dz = 0; dz < muzzleD; dz++) {
        setVoxel(grid, ox + dx, muzzleCY + dy, headFrontZ + dz, tan);
      }
    }
  }
  // Muzzle highlight (top row)
  for (let dx = -Math.floor(muzzleW / 2) + 1; dx < Math.floor(muzzleW / 2) - 1; dx++) {
    setVoxel(grid, ox + dx, muzzleCY + muzzleH - 1, headFrontZ + muzzleD - 1, lightTan);
  }

  // ===== NOSE (on front of muzzle) =====
  const noseZ = headFrontZ + muzzleD - 1;
  const noseY = muzzleCY + muzzleH - 1;
  setVoxel(grid, ox - 1, noseY, noseZ, black);
  setVoxel(grid, ox, noseY, noseZ, black);
  setVoxel(grid, ox - 1, noseY + 1, noseZ, black);
  setVoxel(grid, ox, noseY + 1, noseZ, black);

  // ===== EYES =====
  const eyeY = headCY + 1;
  const eyeDx = 3;
  // Left eye (2w x 3h)
  for (let dy = 0; dy < 3; dy++) {
    setVoxel(grid, ox - eyeDx, eyeY + dy, headFrontZ, black);
    setVoxel(grid, ox - eyeDx + 1, eyeY + dy, headFrontZ, black);
  }
  // Left eye highlight
  setVoxel(grid, ox - eyeDx + 1, eyeY + 2, headFrontZ, white);

  // Right eye (2w x 3h)
  for (let dy = 0; dy < 3; dy++) {
    setVoxel(grid, ox + eyeDx - 1, eyeY + dy, headFrontZ, black);
    setVoxel(grid, ox + eyeDx, eyeY + dy, headFrontZ, black);
  }
  // Right eye highlight
  setVoxel(grid, ox + eyeDx, eyeY + 2, headFrontZ, white);

  // ===== EARS =====
  // Small rounded bumps on top-sides of head
  const earY = headCY + Math.floor(headH / 2) - 1;
  const earDx = Math.floor(headW / 2) - 2;
  // Left ear (3x3x2 bump)
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = -1; dz <= 0; dz++) {
      setVoxel(grid, ox - earDx + dx, earY, oz + dz, brown);
      setVoxel(grid, ox - earDx + dx, earY + 1, oz + dz, brown);
      if (dx === 1) setVoxel(grid, ox - earDx + dx, earY + 2, oz + dz, brown);
    }
  }
  // Right ear
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = -1; dz <= 0; dz++) {
      setVoxel(grid, ox + earDx - 2 + dx, earY, oz + dz, brown);
      setVoxel(grid, ox + earDx - 2 + dx, earY + 1, oz + dz, brown);
      if (dx === 1) setVoxel(grid, ox + earDx - 2 + dx, earY + 2, oz + dz, brown);
    }
  }

  // ===== TAIL (small stub on back) =====
  const tailZ = oz - Math.floor(bodyD / 2) - 1;
  const tailY = bodyCY + 1;
  setVoxel(grid, ox, tailY, tailZ, brown);
  setVoxel(grid, ox + 1, tailY, tailZ, brown);
  setVoxel(grid, ox, tailY + 1, tailZ, brown);

  // ===== HELD ITEM: Honey jar =====
  const jarX = armRX + 1;
  const jarY = armY + 1;
  const jarZ = oz + Math.floor(armD / 2) + 1;
  for (let dx = 0; dx < 4; dx++) {
    for (let dy = 0; dy < 5; dy++) {
      for (let dz = 0; dz < 3; dz++) {
        setVoxel(grid, jarX + dx, jarY + dy, jarZ + dz, '#FFD54F');
      }
    }
  }
  // Jar lid
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      setVoxel(grid, jarX + dx, jarY + 5, jarZ + dz, '#8B4513');
    }
  }
}

// ============================================================
// Cat — 3D sculpted
// ============================================================
function sculptCat(grid: VoxelData, ox: number, oy: number, oz: number) {
  const gray = '#9E9E9E';
  const darkGray = '#757575';
  const lightGray = '#BDBDBD';
  const white = '#E8E8E8';
  const pink = '#FF8CAA';
  const black = '#1A1A1A';
  const stripeColor = '#6E6E6E';

  // Legs
  const legH = 5, legW = 4, legD = 4, legSp = 1;
  const lx1 = ox - legSp - legW, lx2 = ox + legSp;
  for (let dy = 0; dy < legH; dy++) for (let dx = 0; dx < legW; dx++) for (let dz = 0; dz < legD; dz++) {
    setVoxel(grid, lx1 + dx, oy + dy, oz - Math.floor(legD / 2) + dz, dy === 0 ? darkGray : gray);
    setVoxel(grid, lx2 + dx, oy + dy, oz - Math.floor(legD / 2) + dz, dy === 0 ? darkGray : gray);
  }

  // Body (ellipsoid)
  const bodyW = 12, bodyH = 11, bodyD = 10;
  const bodyCY = oy + legH + Math.floor(bodyH / 2);
  fillSteppedEllipsoid(grid, ox, bodyCY, oz, Math.floor(bodyW / 2), Math.floor(bodyH / 2), Math.floor(bodyD / 2), gray);

  // Belly ellipse
  const bodyFZ = oz + Math.floor(bodyD / 2);
  fillEllipse2D(grid, ox, bodyCY, bodyFZ, 3, 4, white);

  // Stripes on body
  for (let dy = -Math.floor(bodyH / 2); dy <= Math.floor(bodyH / 2); dy += 3) {
    for (let dx = -Math.floor(bodyW / 2); dx <= Math.floor(bodyW / 2); dx += 2) {
      if (grid[bodyCY + dy]?.[bodyFZ]?.[ox + dx] != null) {
        setVoxel(grid, ox + dx, bodyCY + dy, bodyFZ, stripeColor);
      }
    }
  }

  // Arms (L-shaped)
  const armW = 3, armUH = 6, armLH = 3, armD = 3;
  const armY = oy + legH + bodyH - armUH - 1;
  const aLX = ox - Math.floor(bodyW / 2) - armW, aRX = ox + Math.floor(bodyW / 2);
  for (let dy = 0; dy < armUH; dy++) for (let dx = 0; dx < armW; dx++) for (let dz = 0; dz < armD; dz++) {
    setVoxel(grid, aLX + dx, armY + dy, oz - Math.floor(armD / 2) + dz, gray);
    setVoxel(grid, aRX + dx, armY + dy, oz - Math.floor(armD / 2) + dz, gray);
  }
  for (let dy = 0; dy < armLH; dy++) for (let dx = 0; dx < armW; dx++) for (let dz = 0; dz < armD; dz++) {
    setVoxel(grid, aLX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, gray);
    setVoxel(grid, aRX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, gray);
  }

  // Head (ellipsoid)
  const headW = 15, headH = 13, headD = 13;
  const headCY = oy + legH + bodyH + Math.floor(headH / 2) - 2;
  fillSteppedEllipsoid(grid, ox, headCY, oz, Math.floor(headW / 2), Math.floor(headH / 2), Math.floor(headD / 2), gray);
  const hFZ = oz + Math.floor(headD / 2);

  // Stripes on head
  for (let dy = 2; dy <= Math.floor(headH / 2); dy += 2) {
    for (let dx = -Math.floor(headW / 2) + 1; dx <= Math.floor(headW / 2) - 1; dx += 2) {
      if (grid[headCY + dy]?.[hFZ]?.[ox + dx] != null) setVoxel(grid, ox + dx, headCY + dy, hFZ, stripeColor);
    }
  }

  // Muzzle
  const mW = 6, mH = 3, mD = 2;
  const mCY = headCY - 2;
  for (let dx = -Math.floor(mW / 2); dx < Math.floor(mW / 2); dx++) for (let dy = 0; dy < mH; dy++) for (let dz = 0; dz < mD; dz++) {
    setVoxel(grid, ox + dx, mCY + dy, hFZ + dz, white);
  }

  // Nose (pink triangle)
  setVoxel(grid, ox - 1, mCY + mH - 1, hFZ + mD - 1, pink);
  setVoxel(grid, ox, mCY + mH - 1, hFZ + mD - 1, pink);
  setVoxel(grid, ox - 1, mCY + mH, hFZ + mD - 1, pink);
  setVoxel(grid, ox, mCY + mH, hFZ + mD - 1, pink);

  // Mouth
  setVoxel(grid, ox - 1, mCY, hFZ + mD - 1, darkGray);
  setVoxel(grid, ox, mCY, hFZ + mD - 1, darkGray);

  // Eyes
  const eY = headCY + 1, eDx = 3;
  for (let dy = 0; dy < 3; dy++) { setVoxel(grid, ox - eDx, eY + dy, hFZ, black); setVoxel(grid, ox - eDx + 1, eY + dy, hFZ, black); }
  setVoxel(grid, ox - eDx + 1, eY + 2, hFZ, '#FFFFFF');
  for (let dy = 0; dy < 3; dy++) { setVoxel(grid, ox + eDx - 1, eY + dy, hFZ, black); setVoxel(grid, ox + eDx, eY + dy, hFZ, black); }
  setVoxel(grid, ox + eDx, eY + 2, hFZ, '#FFFFFF');

  // Ears (pointed, with pink inside)
  const earY = headCY + Math.floor(headH / 2);
  const earDx = Math.floor(headW / 2) - 2;
  for (let h = 0; h < 4; h++) {
    const w = Math.max(1, 3 - h);
    for (let dx = 0; dx < w; dx++) for (let dz = -1; dz <= 0; dz++) {
      const inner = dx < w - 1 && dz === -1 && h < 3;
      setVoxel(grid, ox - earDx + dx, earY + h, oz + dz, inner ? pink : gray);
      setVoxel(grid, ox + earDx - dx, earY + h, oz + dz, inner ? pink : gray);
    }
  }

  // Tail (long, curving)
  const tailZ = oz - Math.floor(bodyD / 2) - 1;
  const tailY = bodyCY + 2;
  for (let i = 0; i < 7; i++) {
    const ty = tailY + Math.round(Math.sin(i * 0.4) * 1.5);
    setVoxel(grid, ox, ty, tailZ - i, gray);
    setVoxel(grid, ox + 1, ty, tailZ - i, gray);
    setVoxel(grid, ox, ty + 1, tailZ - i, gray);
  }

  // Yarn ball
  const ybX = aRX + armW + 1, ybY = armY + 2;
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) {
    if (dx * dx + dy * dy + dz * dz <= 10) setVoxel(grid, ybX + dx, ybY + dy, oz + dz, '#5BC0EB');
  }
}

// ============================================================
// Generic avatar using same technique (for the other 6)
// ============================================================
function sculptGeneric(
  grid: VoxelData, ox: number, oy: number, oz: number,
  mainColor: string, bellyColor: string, noseColor: string,
  earType: 'round' | 'pointed' | 'long' | 'floppy' | 'none',
  earInnerColor: string,
  tailType: 'stub' | 'long' | 'fluffy',
  extras?: (g: VoxelData, ox: number, oy: number, oz: number, bodyCY: number, headCY: number, bodyFZ: number, headFZ: number) => void,
) {
  const dark = adjustBrightness(mainColor, 0.75);
  const light = adjustBrightness(mainColor, 1.15);
  const bellyLight = adjustBrightness(bellyColor, 1.08);
  const black = '#1A1A1A';

  // Legs
  const legH = 5, legW = 4, legD = 4, legSp = 1;
  for (let dy = 0; dy < legH; dy++) for (let dx = 0; dx < legW; dx++) for (let dz = 0; dz < legD; dz++) {
    setVoxel(grid, ox - legSp - legW + dx, oy + dy, oz - 2 + dz, dy === 0 ? dark : mainColor);
    setVoxel(grid, ox + legSp + dx, oy + dy, oz - 2 + dz, dy === 0 ? dark : mainColor);
  }

  // Body
  const bodyH = 11, bodyW = 12, bodyD = 10;
  const bodyCY = oy + legH + Math.floor(bodyH / 2);
  fillSteppedEllipsoid(grid, ox, bodyCY, oz, Math.floor(bodyW / 2), Math.floor(bodyH / 2), Math.floor(bodyD / 2), mainColor);
  const bodyFZ = oz + Math.floor(bodyD / 2);
  fillEllipse2D(grid, ox, bodyCY, bodyFZ, 3, 4, bellyColor);
  fillEllipse2D(grid, ox, bodyCY + 1, bodyFZ, 2, 3, bellyLight);

  // Arms (L-shaped)
  const armW = 3, armUH = 6, armD = 3;
  const armY = oy + legH + bodyH - armUH - 1;
  const aLX = ox - Math.floor(bodyW / 2) - armW, aRX = ox + Math.floor(bodyW / 2);
  for (let dy = 0; dy < armUH; dy++) for (let dx = 0; dx < armW; dx++) for (let dz = 0; dz < armD; dz++) {
    setVoxel(grid, aLX + dx, armY + dy, oz - 1 + dz, mainColor);
    setVoxel(grid, aRX + dx, armY + dy, oz - 1 + dz, mainColor);
  }
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < armW; dx++) for (let dz = 0; dz < armD; dz++) {
    setVoxel(grid, aLX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, mainColor);
    setVoxel(grid, aRX + dx, armY + dy, oz + Math.floor(armD / 2) + dz, mainColor);
  }

  // Head
  const headH = 13, headW = 15, headD = 13;
  const headCY = oy + legH + bodyH + Math.floor(headH / 2) - 2;
  fillSteppedEllipsoid(grid, ox, headCY, oz, Math.floor(headW / 2), Math.floor(headH / 2), Math.floor(headD / 2), mainColor);
  const headFZ = oz + Math.floor(headD / 2);

  // Muzzle
  const mW = 6, mH = 3, mD = 2, mCY = headCY - 2;
  for (let dx = -Math.floor(mW / 2); dx < Math.floor(mW / 2); dx++) for (let dy = 0; dy < mH; dy++) for (let dz = 0; dz < mD; dz++) {
    setVoxel(grid, ox + dx, mCY + dy, headFZ + dz, bellyColor);
  }

  // Nose
  setVoxel(grid, ox - 1, mCY + mH - 1, headFZ + mD - 1, noseColor);
  setVoxel(grid, ox, mCY + mH - 1, headFZ + mD - 1, noseColor);

  // Eyes
  const eY = headCY + 1, eDx = 3;
  for (let dy = 0; dy < 3; dy++) { setVoxel(grid, ox - eDx, eY + dy, headFZ, black); setVoxel(grid, ox - eDx + 1, eY + dy, headFZ, black); }
  setVoxel(grid, ox - eDx + 1, eY + 2, headFZ, '#FFFFFF');
  for (let dy = 0; dy < 3; dy++) { setVoxel(grid, ox + eDx - 1, eY + dy, headFZ, black); setVoxel(grid, ox + eDx, eY + dy, headFZ, black); }
  setVoxel(grid, ox + eDx, eY + 2, headFZ, '#FFFFFF');

  // Ears
  const earY = headCY + Math.floor(headH / 2);
  const earDx = Math.floor(headW / 2) - 2;
  if (earType === 'round') {
    for (let h = 0; h < 3; h++) { const w = h === 2 ? 1 : 2; for (let dx = 0; dx < w; dx++) for (let dz = -1; dz <= 0; dz++) { setVoxel(grid, ox - earDx + dx, earY + h, oz + dz, dx === 0 && dz === -1 ? earInnerColor : mainColor); setVoxel(grid, ox + earDx - dx, earY + h, oz + dz, dx === 0 && dz === -1 ? earInnerColor : mainColor); } }
  } else if (earType === 'pointed') {
    for (let h = 0; h < 4; h++) { const w = Math.max(1, 3 - h); for (let dx = 0; dx < w; dx++) for (let dz = -1; dz <= 0; dz++) { const inner = dx < w - 1 && dz === -1 && h < 3; setVoxel(grid, ox - earDx + dx, earY + h, oz + dz, inner ? earInnerColor : mainColor); setVoxel(grid, ox + earDx - dx, earY + h, oz + dz, inner ? earInnerColor : mainColor); } }
  } else if (earType === 'long') {
    for (let h = 0; h < 8; h++) { const w = h < 7 ? 2 : 1; for (let dx = 0; dx < w; dx++) for (let dz = -1; dz <= 0; dz++) { setVoxel(grid, ox - 3 + dx, earY + h, oz + dz, dx === 0 && dz === -1 ? earInnerColor : mainColor); setVoxel(grid, ox + 3 - dx, earY + h, oz + dz, dx === 0 && dz === -1 ? earInnerColor : mainColor); } }
  } else if (earType === 'floppy') {
    for (let h = 0; h < 5; h++) for (let dz = -1; dz <= 0; dz++) for (let w = 0; w < 3; w++) { setVoxel(grid, ox - earDx - 3 + w, earY - 2 - h, oz + dz, earInnerColor); setVoxel(grid, ox + earDx + 1 + w, earY - 2 - h, oz + dz, earInnerColor); }
  }

  // Tail
  const tailZ = oz - Math.floor(bodyD / 2) - 1;
  const tailY = bodyCY + 1;
  if (tailType === 'stub') { setVoxel(grid, ox, tailY, tailZ, mainColor); setVoxel(grid, ox + 1, tailY, tailZ, mainColor); }
  else if (tailType === 'long') { for (let i = 0; i < 6; i++) { const ty = tailY + Math.round(Math.sin(i * 0.4) * 1.5); setVoxel(grid, ox, ty, tailZ - i, mainColor); setVoxel(grid, ox + 1, ty, tailZ - i, mainColor); } }
  else if (tailType === 'fluffy') { for (let i = 0; i < 6; i++) { const w = Math.min(2, Math.floor(i * 0.5) + 1); const c = i >= 4 ? '#FFFFFF' : mainColor; for (let dx = -w; dx <= w; dx++) for (let dy = -w; dy <= w; dy++) if (dx * dx + dy * dy <= w * w + 1) setVoxel(grid, ox + dx, tailY + dy, tailZ - i, c); } }

  if (extras) extras(grid, ox, oy, oz, bodyCY, headCY, bodyFZ, headFZ);
}

// ============================================================
// Public API — one function per avatar
// ============================================================
export function generateBearAvatar(_seed = 42): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptBear(grid, 20, 2, 25);
  return grid;
}

export function generateCatAvatar(_seed = 100): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptCat(grid, 20, 2, 25);
  return grid;
}

export function generateRabbitAvatar(_seed = 200): VoxelData {
  const grid = makeGrid(50, 55, 50);
  sculptGeneric(grid, 20, 2, 25, '#D9C9A8', '#F5EDE0', '#FFB0B0', 'long', '#FFAABB', 'stub');
  return grid;
}

export function generateDogAvatar(_seed = 300): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptGeneric(grid, 20, 2, 25, '#EADDD0', '#FFFFFF', '#2D1B0E', 'floppy', '#C49050', 'long',
    (g, ox, _oy, oz, bodyCY, headCY, _bodyFZ, headFZ) => {
      // Brown patch on top of head
      for (let dy = 3; dy <= 6; dy++) for (let dx = 0; dx <= 6; dx++) for (let dz = -3; dz <= 3; dz++) {
        if (g[headCY + dy]?.[oz + dz]?.[ox + dx] != null) setVoxel(g, ox + dx, headCY + dy, oz + dz, '#C49050');
      }
      // Blue collar
      const collarY = bodyCY + 4;
      for (let dx = -5; dx <= 5; dx++) for (let dz = -4; dz <= 4; dz++) {
        if (g[collarY]?.[oz + dz]?.[ox + dx] != null) setVoxel(g, ox + dx, collarY, oz + dz, '#4488CC');
      }
    });
  return grid;
}

export function generatePandaAvatar(_seed = 400): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptGeneric(grid, 20, 2, 25, '#F0F0F0', '#FFFFFF', '#1A1A1A', 'round', '#1A1A1A', 'stub',
    (g, ox, oy, oz, bodyCY, headCY, _bodyFZ, headFZ) => {
      // Black eye patches
      const eY = headCY + 1, eDx = 3;
      for (let dy = -1; dy <= 3; dy++) { const w = (dy <= 0 || dy >= 3) ? 1 : 2; for (let dx = 0; dx < w; dx++) { setVoxel(g, ox - eDx - dx, eY + dy, headFZ, '#1A1A1A'); setVoxel(g, ox + eDx + dx, eY + dy, headFZ, '#1A1A1A'); } }
      // Black arms & legs
      const armY = oy + 5 + 11 - 6 - 1;
      const aLX = ox - 6 - 3, aRX = ox + 6;
      for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) { setVoxel(g, aLX + dx, armY + dy, oz - 1 + dz, '#1A1A1A'); setVoxel(g, aRX + dx, armY + dy, oz - 1 + dz, '#1A1A1A'); }
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) { setVoxel(g, ox - 1 - 4 + dx, oy + dy, oz - 2 + dz, '#1A1A1A'); setVoxel(g, ox + 1 + dx, oy + dy, oz - 2 + dz, '#1A1A1A'); }
    });
  return grid;
}

export function generateFoxAvatar(_seed = 500): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptGeneric(grid, 20, 2, 25, '#D4652B', '#FFF5E6', '#1A1A1A', 'pointed', '#FFF5E6', 'fluffy',
    (g, ox, _oy, _oz, _bodyCY, headCY, _bodyFZ, headFZ) => {
      // White lower face
      for (let dy = -4; dy <= 0; dy++) {
        const w = 4 + dy;
        for (let dx = -w; dx <= w; dx++) setVoxel(g, ox + dx, headCY + dy, headFZ, '#FFF5E6');
      }
    });
  return grid;
}

export function generatePenguinAvatar(_seed = 600): VoxelData {
  const grid = makeGrid(50, 50, 50);
  sculptGeneric(grid, 20, 2, 25, '#2C3E6B', '#FFFFFF', '#FF8C00', 'none', '', 'stub',
    (g, ox, oy, oz) => {
      // Orange feet
      for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
        setVoxel(g, ox - 1 - 4 + dx, oy, oz - 2 + dz, '#FF8C00');
        setVoxel(g, ox + 1 + dx, oy, oz - 2 + dz, '#FF8C00');
      }
    });
  return grid;
}

export function generateHamsterAvatar(_seed = 700): VoxelData {
  const grid = makeGrid(50, 55, 50);
  sculptGeneric(grid, 20, 2, 25, '#E8C39E', '#FFF8F0', '#1A1A1A', 'round', '#FFB6C1', 'stub',
    (g, ox, _oy, oz, _bodyCY, headCY) => {
      // Cheek pouches
      const cy = headCY - 1;
      for (let dy = -1; dy <= 2; dy++) for (let dz = -1; dz <= 1; dz++) {
        setVoxel(g, ox - 8, cy + dy, oz + dz, '#F0D8B8');
        setVoxel(g, ox + 8, cy + dy, oz + dz, '#F0D8B8');
      }
    });
  return grid;
}

function makeGrid(w: number, h: number, d: number): VoxelData { return createGrid(w, h, d); }

export function generateCubicAvatar(id: string, _opts: Record<string, string> = {}, s = 42): VoxelData {
  const m: Record<string, (s: number) => VoxelData> = {
    bear: generateBearAvatar, cat: generateCatAvatar, rabbit: generateRabbitAvatar,
    dog: generateDogAvatar, panda: generatePandaAvatar, fox: generateFoxAvatar,
    penguin: generatePenguinAvatar, hamster: generateHamsterAvatar,
  };
  return (m[id] ?? generateBearAvatar)(s);
}
export type CubicBodyPlan = { id: string };
export const CUBIC_PLANS: Record<string, CubicBodyPlan> = { bear: { id: 'bear' }, cat: { id: 'cat' }, rabbit: { id: 'rabbit' }, dog: { id: 'dog' }, panda: { id: 'panda' }, fox: { id: 'fox' }, penguin: { id: 'penguin' }, hamster: { id: 'hamster' } };
