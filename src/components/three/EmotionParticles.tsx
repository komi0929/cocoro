/**
 * cocoro — Emotion Particles
 * アバターの感情状態に応じて自動的にパーティクルが放出される
 * 
 * 思想: 声のトーンから感情を推定 → パーティクルで可視化
 * → 「この人楽しそう」が視覚的にわかる
 * → 感情の伝染 → 会話が活性化
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 30;

interface EmotionParticlesProps {
  joy: number;       // 0-1
  surprise: number;  // 0-1
  isSpeaking: boolean;
  volume: number;    // 0-1
}

// Deterministic pseudo-random
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function EmotionParticles({ joy, surprise, isSpeaking, volume }: EmotionParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const lifetimesRef = useRef<Float32Array | null>(null);

  const { positions, colors } = useMemo(() => {
    const rng = seededRng(7);
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const col = new Float32Array(MAX_PARTICLES * 3);
    const vel = new Float32Array(MAX_PARTICLES * 3);
    const life = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3;
      // Start at origin (will be animated)
      pos[i3] = 0;
      pos[i3 + 1] = -10; // hidden below
      pos[i3 + 2] = 0;

      // Velocity: upward with spread
      vel[i3] = (rng() - 0.5) * 2;
      vel[i3 + 1] = 1 + rng() * 3;
      vel[i3 + 2] = (rng() - 0.5) * 2;

      life[i] = -1; // inactive

      // Joy = warm yellow/pink, Surprise = cyan/white
      col[i3] = 1;
      col[i3 + 1] = 0.8;
      col[i3 + 2] = 0.3;
    }

    velocitiesRef.current = vel;
    lifetimesRef.current = life;

    return { positions: pos, colors: col };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const spawnTimerRef = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const vel = velocitiesRef.current;
    const life = lifetimesRef.current;
    const dt = Math.min(delta, 0.05);

    // Spawn condition: speaking + joy/surprise
    const shouldSpawn = isSpeaking && (joy > 0.3 || surprise > 0.4) && volume > 0.15;

    if (shouldSpawn) {
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > 0.15) { // spawn every 150ms
        spawnTimerRef.current = 0;
        // Find inactive particle
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (life[i] <= 0) {
            const i3 = i * 3;
            posAttr.array[i3] = (Math.sin(state.clock.elapsedTime * 7 + i) * 0.3);
            posAttr.array[i3 + 1] = 1.5;
            posAttr.array[i3 + 2] = (Math.cos(state.clock.elapsedTime * 5 + i) * 0.3);

            life[i] = 1.5 + Math.sin(i * 0.7) * 0.5;

            // Color based on emotion
            if (joy > surprise) {
              // Warm: yellow → pink
              colAttr.array[i3] = 1;
              colAttr.array[i3 + 1] = 0.7 + Math.sin(i) * 0.2;
              colAttr.array[i3 + 2] = 0.2;
            } else {
              // Cool: cyan → white
              colAttr.array[i3] = 0.5;
              colAttr.array[i3 + 1] = 0.9;
              colAttr.array[i3 + 2] = 1;
            }
            colAttr.needsUpdate = true;
            break;
          }
        }
      }
    }

    // Update active particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (life[i] <= 0) continue;

      const i3 = i * 3;
      life[i] -= dt;

      posAttr.array[i3] += vel[i3] * dt * 0.3;
      posAttr.array[i3 + 1] += vel[i3 + 1] * dt * 0.5;
      posAttr.array[i3 + 2] += vel[i3 + 2] * dt * 0.3;

      // Fade out when dead
      if (life[i] <= 0) {
        posAttr.array[i3 + 1] = -10; // hide
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
