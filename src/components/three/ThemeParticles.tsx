/**
 * cocoro — Theme Particles
 * テーマ固有のパーティクルエフェクト
 * 各テーマの世界観を視覚的に強化する浮遊パーティクル
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThemeParticleConfig } from '@/types/cocoro';

interface ThemeParticlesProps {
  config: ThemeParticleConfig;
  bounds?: [number, number, number]; // 空間の範囲
}

export function ThemeParticles({ config, bounds = [7, 3, 7] }: ThemeParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(config.count * 3);
    const vel = new Float32Array(config.count * 3);

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      if (config.shape === 'sphere') {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * bounds[0] / 2;
        pos[i3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = Math.random() * bounds[1];
        pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      } else {
        pos[i3] = (Math.random() - 0.5) * bounds[0];
        pos[i3 + 1] = Math.random() * bounds[1];
        pos[i3 + 2] = (Math.random() - 0.5) * bounds[2];
      }

      vel[i3] = (Math.random() - 0.5) * config.speed * 0.5;
      vel[i3 + 1] = (Math.random() - 0.5) * config.speed;
      vel[i3 + 2] = (Math.random() - 0.5) * config.speed * 0.5;
    }

    return { positions: pos, velocities: vel };
  }, [config.count, config.shape, config.speed, bounds]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;

      switch (config.pattern) {
        case 'float': {
          arr[i3] += Math.sin(timeRef.current * 0.5 + i) * delta * config.speed * 0.3;
          arr[i3 + 1] += Math.sin(timeRef.current * 0.3 + i * 0.7) * delta * config.speed * 0.2;
          arr[i3 + 2] += Math.cos(timeRef.current * 0.4 + i * 1.1) * delta * config.speed * 0.3;
          break;
        }
        case 'fall': {
          arr[i3 + 1] -= delta * config.speed;
          arr[i3] += Math.sin(timeRef.current + i) * delta * 0.2;
          if (arr[i3 + 1] < 0) {
            arr[i3 + 1] = bounds[1];
            arr[i3] = (Math.random() - 0.5) * bounds[0];
            arr[i3 + 2] = (Math.random() - 0.5) * bounds[2];
          }
          break;
        }
        case 'rise': {
          arr[i3 + 1] += delta * config.speed;
          arr[i3] += Math.sin(timeRef.current * 0.7 + i * 1.3) * delta * 0.15;
          arr[i3 + 2] += Math.cos(timeRef.current * 0.5 + i * 0.9) * delta * 0.15;
          if (arr[i3 + 1] > bounds[1]) {
            arr[i3 + 1] = 0;
            arr[i3] = (Math.random() - 0.5) * bounds[0];
            arr[i3 + 2] = (Math.random() - 0.5) * bounds[2];
          }
          break;
        }
        case 'orbit': {
          const radius = Math.sqrt(arr[i3] ** 2 + arr[i3 + 2] ** 2);
          const angle = Math.atan2(arr[i3 + 2], arr[i3]) + delta * config.speed * 0.3;
          arr[i3] = Math.cos(angle) * radius;
          arr[i3 + 2] = Math.sin(angle) * radius;
          arr[i3 + 1] += Math.sin(timeRef.current + i) * delta * 0.1;
          break;
        }
        case 'drift': {
          arr[i3] += velocities[i3] * delta;
          arr[i3 + 1] += velocities[i3 + 1] * delta * 0.3;
          arr[i3 + 2] += velocities[i3 + 2] * delta;
          // Wrap around bounds
          for (let j = 0; j < 3; j++) {
            const half = bounds[j] / 2;
            if (arr[i3 + j] > half) arr[i3 + j] = -half;
            if (arr[i3 + j] < -half) arr[i3 + j] = half;
          }
          break;
        }
        case 'flicker': {
          // Stars that twinkle in place
          const flickerPhase = Math.sin(timeRef.current * 2 + i * 3.7);
          arr[i3] += Math.sin(timeRef.current * 0.1 + i) * delta * 0.02;
          arr[i3 + 1] += Math.cos(timeRef.current * 0.15 + i) * delta * 0.02;
          arr[i3 + 2] += Math.sin(timeRef.current * 0.12 + i * 1.5) * delta * 0.02;
          // Use material opacity for flicker via scale hack
          if (meshRef.current && meshRef.current.material instanceof THREE.PointsMaterial) {
            meshRef.current.material.opacity = 0.5 + flickerPhase * 0.3;
          }
          break;
        }
      }
    }

    posAttr.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={config.color}
        size={config.size}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
