/**
 * cocoro  EVoxelBuilder
 * マイクラ風「色ムラ�E�カラーノイズ�E�」�Eクセルエンジン
 * 
 * Canvas API で小さなドット絵風ノイズチE��スチャを動皁E��成し、E * THREE.NearestFilter で適用 ↁE見た目リチE��、描画は軽釁E */

import { useMemo } from 'react';
import * as THREE from 'three';

// ============================================================
// Color noise texture generator
// ============================================================

interface NoiseOpts {
  /** チE��スチャサイズ (NxN)  E4、Eが最適 */
  size?: number;
  /** 明度のランダム幁E(0、E) */
  lightnessSpread?: number;
  /** 彩度のランダム幁E(0、E) */
  saturationSpread?: number;
  /** 色相のランダム幁E(0、E, 0.05 = ±18°) */
  hueSpread?: number;
  /** 再現性のためのシーチE*/
  seed?: number;
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
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0.5];
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
 * Canvas API でノイズチE��スチャを生戁E * 色ベ�Eスに近似色をランダムに散り�Eめるマイクラ風チE��スチャ
 */
export function createNoisyTexture(baseColor: string, opts: NoiseOpts = {}): THREE.CanvasTexture {
  const {
    size = 6,
    lightnessSpread = 0.12,
    saturationSpread = 0.08,
    hueSpread = 0.02,
    seed = Math.floor(Math.random() * 100000),
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
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
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

// ============================================================
// Reusable Noisy Primitives
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
}

export function NoisyBox({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color,
  roughness = 0.8,
  metalness = 0.05,
  emissive,
  emissiveIntensity,
  castShadow = true,
  receiveShadow = false,
  seed,
  noiseSize = 6,
  lightnessSpread = 0.12,
  transparent = false,
  opacity = 1,
}: NoisyBoxProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
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
  roughness = 0.8,
  metalness = 0.05,
  castShadow = true,
  seed,
  noiseSize = 6,
  lightnessSpread = 0.12,
}: NoisyCylinderProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow}>
      <cylinderGeometry args={args} />
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
  roughness = 0.8,
  metalness = 0.05,
  castShadow = true,
  seed,
  noiseSize = 6,
  lightnessSpread = 0.12,
}: NoisySphereProps) {
  const tex = useNoisyTexture(color, { size: noiseSize, seed, lightnessSpread });
  return (
    <mesh position={position} castShadow={castShadow}>
      <sphereGeometry args={args} />
      <meshStandardMaterial map={tex} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

// ============================================================
// Emissive Box (for screens, neon, LEDs  Eno noise needed)
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
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        toneMapped={toneMapped}
      />
    </mesh>
  );
}
