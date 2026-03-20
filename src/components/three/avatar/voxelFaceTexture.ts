/**
 * cocoro — Voxel Face Texture Generator (Phase 8 - Premium)
 * Canvas API generates 32×32 face textures with enhanced detail:
 * - Larger eyes with pupils, irises, and specular highlights
 * - Refined noses and mouths
 * - Soft cheek blush gradients
 * THREE.NearestFilter for crisp pixel art
 */

import * as THREE from 'three';
import type { AvatarSpecies } from '@/types/cocoro';

const TEX_SIZE = 32;

/** Draw a filled pixel */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Draw a filled rect */
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Draw a soft circle (for blush effects) */
function softCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        const alpha = Math.max(0, 1 - dist / r) * 0.6;
        ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
        ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }
  }
}

/** Draw an eye with iris, pupil, and highlight */
function eye(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, irisColor: string, style: 'round' | 'cat' | 'big' = 'round') {
  if (style === 'cat') {
    // Vertical slit eye
    for (let dy = -size; dy <= size; dy++) {
      const w = Math.max(1, Math.round(size * 0.6 * (1 - Math.abs(dy) / (size + 1))));
      rect(ctx, cx - Math.floor(w / 2), cy + dy, w, 1, '#111');
    }
    // Iris slit
    const slitH = Math.max(2, size);
    for (let dy = -Math.floor(slitH / 2); dy < Math.ceil(slitH / 2); dy++) {
      px(ctx, cx, cy + dy, irisColor);
    }
    // Highlight
    px(ctx, cx, cy - Math.floor(size / 2), '#FFF');
  } else if (style === 'big') {
    // Big round eye
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        if (dx * dx + dy * dy <= size * size) {
          ctx.fillStyle = '#111';
          ctx.fillRect(cx + dx, cy + dy, 1, 1);
        }
      }
    }
    // Iris
    const iR = Math.max(1, size - 1);
    for (let dy = -iR; dy <= iR; dy++) {
      for (let dx = -iR; dx <= iR; dx++) {
        if (dx * dx + dy * dy <= iR * iR) {
          ctx.fillStyle = irisColor;
          ctx.fillRect(cx + dx, cy + dy, 1, 1);
        }
      }
    }
    // Pupil
    px(ctx, cx, cy, '#111');
    if (size > 2) px(ctx, cx + 1, cy, '#111');
    // Highlight
    px(ctx, cx - 1, cy - Math.floor(size / 2), '#FFF');
    if (size > 2) px(ctx, cx, cy - Math.floor(size / 2), '#FFF');
  } else {
    // Standard round eye
    rect(ctx, cx - 1, cy - 1, 3, 3, '#111');
    rect(ctx, cx, cy, 2, 2, '#111');
    // Iris
    px(ctx, cx, cy, irisColor);
    px(ctx, cx + 1, cy, irisColor);
    // Pupil
    px(ctx, cx, cy + 1, '#000');
    // Highlight
    px(ctx, cx - 1, cy - 1, '#FFF');
  }
}

// ============================
// Face drawers (32x32)
// ============================

function drawBearFace(ctx: CanvasRenderingContext2D) {
  eye(ctx, 10, 12, 2, '#5D4037');
  eye(ctx, 20, 12, 2, '#5D4037');
  // Nose
  rect(ctx, 14, 16, 4, 2, '#3E2723');
  // Mouth
  px(ctx, 13, 19, '#5D4037'); px(ctx, 14, 20, '#5D4037');
  px(ctx, 18, 19, '#5D4037'); px(ctx, 17, 20, '#5D4037');
  // Cheeks
  softCircle(ctx, 7, 18, 3, 'rgb(255, 143, 170)');
  softCircle(ctx, 24, 18, 3, 'rgb(255, 143, 170)');
}

function drawCatFace(ctx: CanvasRenderingContext2D) {
  eye(ctx, 10, 12, 3, '#66BB6A', 'cat');
  eye(ctx, 21, 12, 3, '#66BB6A', 'cat');
  // Nose (small pink triangle)
  px(ctx, 15, 16, '#FFB6C1'); px(ctx, 16, 16, '#FFB6C1');
  px(ctx, 15, 17, '#FFB6C1'); px(ctx, 16, 17, '#FFB6C1');
  // ω mouth
  px(ctx, 13, 18, '#666'); px(ctx, 14, 19, '#666');
  px(ctx, 15, 18, '#666'); px(ctx, 16, 18, '#666');
  px(ctx, 18, 18, '#666'); px(ctx, 17, 19, '#666');
  // Whiskers
  rect(ctx, 2, 15, 6, 1, '#888');
  rect(ctx, 24, 15, 6, 1, '#888');
  rect(ctx, 2, 19, 6, 1, '#888');
  rect(ctx, 24, 19, 6, 1, '#888');
  rect(ctx, 3, 17, 5, 1, '#888');
  rect(ctx, 24, 17, 5, 1, '#888');
  // Cheeks
  softCircle(ctx, 7, 18, 2, 'rgb(255, 176, 192)');
  softCircle(ctx, 24, 18, 2, 'rgb(255, 176, 192)');
}

function drawDogFace(ctx: CanvasRenderingContext2D) {
  eye(ctx, 10, 12, 2, '#6D4C41', 'big');
  eye(ctx, 21, 12, 2, '#6D4C41', 'big');
  // Nose
  rect(ctx, 14, 16, 4, 2, '#3E2723');
  rect(ctx, 15, 15, 2, 1, '#3E2723');
  // Tongue
  rect(ctx, 14, 20, 4, 3, '#FF8A80');
  rect(ctx, 15, 23, 2, 1, '#FF8A80');
  // Cheeks
  softCircle(ctx, 7, 18, 2, 'rgb(255, 176, 192)');
  softCircle(ctx, 24, 18, 2, 'rgb(255, 176, 192)');
}

function drawRabbitFace(ctx: CanvasRenderingContext2D) {
  eye(ctx, 10, 12, 3, '#E91E63', 'big');
  eye(ctx, 21, 12, 3, '#E91E63', 'big');
  // Nose (Y shape)
  px(ctx, 15, 17, '#FFB6C1'); px(ctx, 16, 17, '#FFB6C1');
  // Mouth (small)
  px(ctx, 15, 19, '#CC7799'); px(ctx, 16, 19, '#CC7799');
  // Cheeks (bigger blush)
  softCircle(ctx, 6, 18, 3, 'rgb(255, 153, 181)');
  softCircle(ctx, 25, 18, 3, 'rgb(255, 153, 181)');
}

function drawFoxFace(ctx: CanvasRenderingContext2D) {
  // Sly eyes
  rect(ctx, 8, 12, 5, 1, '#111');
  rect(ctx, 9, 11, 3, 1, '#111');
  rect(ctx, 19, 12, 5, 1, '#111');
  rect(ctx, 19, 11, 3, 1, '#111');
  px(ctx, 10, 12, '#FFD54F'); // Iris
  px(ctx, 21, 12, '#FFD54F');
  // White muzzle area
  rect(ctx, 10, 15, 12, 8, 'rgba(255,255,255,0.2)');
  // Nose
  px(ctx, 15, 17, '#333'); px(ctx, 16, 17, '#333');
  // Smirk
  px(ctx, 12, 19, '#666'); px(ctx, 13, 20, '#666');
  px(ctx, 19, 19, '#666'); px(ctx, 18, 20, '#666');
}

function drawFrogFace(ctx: CanvasRenderingContext2D) {
  // Giant bulging eyes
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy <= 9) {
        ctx.fillStyle = '#111';
        ctx.fillRect(7 + dx, 8 + dy, 1, 1);
        ctx.fillRect(24 + dx, 8 + dy, 1, 1);
      }
    }
  }
  // Iris
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy <= 4) {
        ctx.fillStyle = '#CDDC39';
        ctx.fillRect(7 + dx, 8 + dy, 1, 1);
        ctx.fillRect(24 + dx, 8 + dy, 1, 1);
      }
    }
  }
  px(ctx, 7, 8, '#333'); px(ctx, 24, 8, '#333');
  // Big smile
  rect(ctx, 6, 20, 20, 1, '#2E7D32');
  px(ctx, 6, 19, '#2E7D32'); px(ctx, 25, 19, '#2E7D32');
  // Cheeks
  softCircle(ctx, 4, 17, 3, 'rgb(255, 136, 136)');
  softCircle(ctx, 27, 17, 3, 'rgb(255, 136, 136)');
}

function drawPenguinFace(ctx: CanvasRenderingContext2D) {
  // White face area
  rect(ctx, 6, 6, 20, 20, 'rgba(255,255,255,0.3)');
  // Eyes
  eye(ctx, 10, 12, 2, '#37474F');
  eye(ctx, 20, 12, 2, '#37474F');
  // Beak
  rect(ctx, 12, 17, 8, 2, '#FFB300');
  rect(ctx, 14, 19, 4, 1, '#FFB300');
  // Cheeks
  softCircle(ctx, 8, 17, 2, 'rgb(255, 153, 181)');
  softCircle(ctx, 23, 17, 2, 'rgb(255, 153, 181)');
}

function drawPandaFace(ctx: CanvasRenderingContext2D) {
  // Black eye patches
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dy * dy <= 16) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(9 + dx, 12 + dy, 1, 1);
        ctx.fillRect(22 + dx, 12 + dy, 1, 1);
      }
    }
  }
  // Eyes
  eye(ctx, 9, 12, 2, '#FFF');
  eye(ctx, 22, 12, 2, '#FFF');
  // Nose
  px(ctx, 15, 18, '#333'); px(ctx, 16, 18, '#333');
  // Mouth
  px(ctx, 15, 20, '#555'); px(ctx, 16, 20, '#555');
  // Cheeks
  softCircle(ctx, 8, 20, 2, 'rgb(255, 153, 181)');
  softCircle(ctx, 24, 20, 2, 'rgb(255, 153, 181)');
}

const FACE_DRAWERS: Record<AvatarSpecies, (ctx: CanvasRenderingContext2D) => void> = {
  bear: drawBearFace,
  cat: drawCatFace,
  dog: drawDogFace,
  rabbit: drawRabbitFace,
  fox: drawFoxFace,
  frog: drawFrogFace,
  penguin: drawPenguinFace,
  panda: drawPandaFace,
};

/** Species default fur colors */
export const SPECIES_DEFAULT_COLORS: Record<AvatarSpecies, string> = {
  bear: '#8B6914',
  cat: '#FF9800',
  dog: '#C49A6C',
  rabbit: '#F8F0E3',
  fox: '#FF6D00',
  frog: '#4CAF50',
  penguin: '#37474F',
  panda: '#FAFAFA',
};

// Texture cache
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generate a face texture for a species (cached)
 */
export function createFaceTexture(species: AvatarSpecies): THREE.CanvasTexture {
  const cacheKey = species;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Draw face
  const drawer = FACE_DRAWERS[species];
  if (drawer) drawer(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/** Clear texture cache */
export function clearFaceTextureCache() {
  textureCache.forEach(t => t.dispose());
  textureCache.clear();
}
