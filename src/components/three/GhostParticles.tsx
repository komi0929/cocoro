/**
 * cocoro — Ghost Particles
 * 過去の訪問者の「残像」が空間に漂う
 * 
 * 思想: 誰もいない空間でも「ここに誰かがいた」感覚
 * → 孤独感の排除 → retention死守
 */
'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GHOST_COUNT = 120;

// Deterministic pseudo-random (mulberry32)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateParticleData() {
  const rng = seededRandom(42);
  const pos = new Float32Array(GHOST_COUNT * 3);
  const vel = new Float32Array(GHOST_COUNT * 3);
  const life = new Float32Array(GHOST_COUNT);
  const col = new Float32Array(GHOST_COUNT * 3);

  for (let i = 0; i < GHOST_COUNT; i++) {
    const i3 = i * 3;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = 1 + rng() * 4;

    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = 0.2 + rng() * 2.5;
    pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    vel[i3] = (rng() - 0.5) * 0.05;
    vel[i3 + 1] = (rng() - 0.5) * 0.02;
    vel[i3 + 2] = (rng() - 0.5) * 0.05;

    life[i] = rng() * Math.PI * 2;

    const hue = 0.6 + rng() * 0.15;
    const color = new THREE.Color().setHSL(hue, 0.5, 0.6);
    col[i3] = color.r;
    col[i3 + 1] = color.g;
    col[i3 + 2] = color.b;
  }

  return { positions: pos, velocities: vel, lifetimes: life, colors: col };
}

export function GhostParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const [data] = useState(generateParticleData);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [data]);

  // Cleanup
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < GHOST_COUNT; i++) {
      const i3 = i * 3;
      posAttr.array[i3] += data.velocities[i3] * 0.016;
      posAttr.array[i3 + 1] += Math.sin(t * 0.3 + data.lifetimes[i]) * 0.002;
      posAttr.array[i3 + 2] += data.velocities[i3 + 2] * 0.016;

      const dist = Math.sqrt(
        (posAttr.array[i3] as number) ** 2 + (posAttr.array[i3 + 2] as number) ** 2
      );
      if (dist > 6) {
        posAttr.array[i3] *= 0.1;
        posAttr.array[i3 + 2] *= 0.1;
      }
    }

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.01;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
