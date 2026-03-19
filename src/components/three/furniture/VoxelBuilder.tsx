/**
 * cocoro — VoxelBuilder Phase 6 (High-Poly Voxel)
 *
 * ハイポリボクセルスタイル:
 * - RoundedBoxGeometry で角丸ブロック
 * - 16x16 ノイズテクスチャ（スムース補間）
 * - 高セグメントのシリンダー/スフィア
 * - ベベルエッジ、グラデーション対応
 */

import { useMemo } from 'react';
import * as THREE from 'three';

// ============================================================
// RoundedBoxGeometry (three-stdlib 互換カスタム実装)
// ============================================================

function createRoundedBoxGeometry(
  width: number, height: number, depth: number,
  segments: number, radius: number,
): THREE.BufferGeometry {
  // Use standard box with subdivisions and modify vertices for rounded edges
  const geometry = new THREE.BoxGeometry(
    width - radius * 2,
    height - radius * 2,
    depth - radius * 2,
    segments, segments, segments,
  );

  const pos = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  const hw = (width - radius * 2) / 2;
  const hh = (height - radius * 2) / 2;
  const hd = (depth - radius * 2) / 2;

  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    n.set(normals.getX(i), normals.getY(i), normals.getZ(i));

    // Push vertices outward along normal by radius
    const dx = Math.max(0, Math.abs(v.x) - hw) * Math.sign(v.x);
    const dy = Math.max(0, Math.abs(v.y) - hh) * Math.sign(v.y);
    const dz = Math.max(0, Math.abs(v.z) - hd) * Math.sign(v.z);

    const offset = new THREE.Vector3(dx, dy, dz);
    if (offset.length() > 0) {
      offset.normalize().multiplyScalar(radius);
    }

    // Clamp to inner box
    const cx = Math.min(hw, Math.max(-hw, v.x));
    const cy = Math.min(hh, Math.max(-hh, v.y));
    const cz = Math.min(hd, Math.max(-hd, v.z));

    pos.setXYZ(i, cx + offset.x, cy + offset.y, cz + offset.z);

    if (offset.length() > 0) {
      normals.setXYZ(i, offset.x, offset.y, offset.z);
    }
  }

  geometry.computeVertexNormals();
  return geometry;
}

// ============================================================
// Color noise texture generator (High Quality)
// ============================================================

interface NoiseOpts {
  /** テクスチャサイズ (NxN) */
  size?: number;
  /** 明度のランダム幅(0-1) */
  lightnessSpread?: number;
  /** 彩度のランダム幅(0-1) */
  saturationSpread?: number;
  /** 色相のランダム幅(0-1, 0.05 = ±18°) */
  hueSpread?: number;
  /** 再現性のためのシード */
  seed?: number;
  /** スムースフィルター（ハイポリ用） */
  smooth?: boolean;
}

/** 簡易疑似乱数 (seedable) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** HSL→RGB変換 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  const sector = Math.floor(h * 6);
  switch (sector % 6) {
    case 0: r = c; g = x; break;
    case 1: r = x; g = c; break;
    case 2: g = c; b = x; break;
    case 3: g = x; b = c; break;
    case 4: r = x; b = c; break;
    case 5: r = c; b = x; break;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** Hex→HSL変換 */
function hexToHsl(hex: string): [number, number, number] {
  // Handle 3-char hex and named colors
  if (hex.length <= 4 && hex.startsWith('#')) {
    const r = parseInt(hex[1] + hex[1], 16) / 255;
    const g = parseInt(hex[2] + hex[2], 16) / 255;
    const b = parseInt(hex[3] + hex[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h, s, l];
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Fallback for named colors
    const tmp = new THREE.Color(hex);
    const r = tmp.r, g = tmp.g, b = tmp.b;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h, s, l];
  }
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h, s, l];
}

/**
 * ハイクオリティノイズテクスチャ
 * - サイズ 16x16 (旧 6x6)
 * - リニア補間 (旧 NearestFilter)
 * - グラデーション付き自然な色ムラ
 */
export function createNoisyTexture(baseColor: string, opts: NoiseOpts = {}): THREE.CanvasTexture {
  const {
    size = 16,
    lightnessSpread = 0.08,
    saturationSpread = 0.05,
    hueSpread = 0.015,
    seed = Math.floor(Math.random() * 100000),
    smooth = true,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const [baseH, baseS, baseL] = hexToHsl(baseColor);
  const rand = seededRandom(seed);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = baseH + (rand() - 0.5) * hueSpread * 2;
      const s = baseS + (rand() - 0.5) * saturationSpread * 2;
      const l = baseL + (rand() - 0.5) * lightnessSpread * 2;
      const [r, g, b] = hslToRgb(h, s, l);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  if (smooth) {
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
  } else {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================
// React Hooks
// ============================================================

export function useNoisyTexture(baseColor: string, opts: NoiseOpts = {}): THREE.CanvasTexture {
  return useMemo(() => createNoisyTexture(baseColor, opts), [baseColor, opts.seed]);
}

// Reusable RoundedBox geometry hook
function useRoundedBox(size: [number, number, number], segments = 2, radius = 0.02): THREE.BufferGeometry {
  return useMemo(
    () => createRoundedBoxGeometry(size[0], size[1], size[2], segments, Math.min(radius, Math.min(size[0], size[1], size[2]) * 0.4)),
    [size[0], size[1], size[2], segments, radius],
  );
}

// ============================================================
// Reusable High-Poly Noisy Primitives
// ============================================================

interface NoisyBoxProps {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  seed?: number;
  noiseSize?: number;
  lightnessSpread?: number;
  transparent?: boolean;
  opacity?: number;
  /** 角丸半径 (0 でシャープ) */
  bevel?: number;
  /** セグメント分割数 */
  segments?: number;
}

export function NoisyBox({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  roughness = 0.75,
  metalness = 0.05,
  emissive,
  emissiveIntensity,
  castShadow = true,
  receiveShadow = false,
  seed,
  noiseSize = 16,
  lightnessSpread = 0.08,
  transparent = false,
  opacity = 1,
  bevel = 0.015,
  segments = 2,
}: NoisyBoxProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  const geo = useRoundedBox(size, segments, bevel);

  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      geometry={geo}
    >
      <meshStandardMaterial
        map={tex}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive ? new THREE.Color(emissive) : undefined}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
}

interface NoisyCylinderProps {
  args: [number, number, number, number?];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  seed?: number;
  noiseSize?: number;
  lightnessSpread?: number;
}

export function NoisyCylinder({
  args,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  roughness = 0.75,
  metalness = 0.05,
  castShadow = true,
  seed,
  noiseSize = 16,
  lightnessSpread = 0.08,
}: NoisyCylinderProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  // Enforce minimum 16 segments for smooth cylinders
  const segments = Math.max(args[3] ?? 16, 16);
  const geoArgs: [number, number, number, number] = [args[0], args[1], args[2], segments];

  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow}>
      <cylinderGeometry args={geoArgs} />
      <meshStandardMaterial map={tex} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

interface NoisySphereProps {
  args: [number, number?, number?];
  position?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  seed?: number;
  noiseSize?: number;
  lightnessSpread?: number;
}

export function NoisySphere({
  args,
  position = [0, 0, 0],
  color,
  roughness = 0.75,
  metalness = 0.05,
  castShadow = true,
  seed,
  noiseSize = 16,
  lightnessSpread = 0.08,
}: NoisySphereProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  // Enforce minimum 24 for width, 16 for height
  const w = Math.max(args[1] ?? 24, 24);
  const h = Math.max(args[2] ?? 16, 16);

  return (
    <mesh position={position} castShadow={castShadow}>
      <sphereGeometry args={[args[0], w, h]} />
      <meshStandardMaterial map={tex} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

// ============================================================
// Emissive Box (for screens, neon, LEDs — no noise needed)
// ============================================================
interface EmissiveBoxProps {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  emissiveIntensity?: number;
  toneMapped?: boolean;
}

export function EmissiveBox({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  emissiveIntensity = 2,
  toneMapped = false,
}: EmissiveBoxProps) {
  const geo = useRoundedBox(size, 2, 0.008);
  return (
    <mesh position={position} rotation={rotation} geometry={geo}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        toneMapped={toneMapped}
      />
    </mesh>
  );
}
