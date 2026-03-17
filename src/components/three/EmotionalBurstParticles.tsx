/**
 * cocoro — Emotional Burst Particles (3D)
 * ピークモーメント検出時に画面全体にパーティクルが爆発
 * 
 * silence_break → 青い光の粒子が中心から放射
 * peak_gravity → 金色の火花が下から噴き上がる
 * collective_laugh → 虹色の星が四方から集まる
 */
'use client';

import { useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type BurstType = 'silence_break' | 'peak_gravity' | 'collective_laugh' | 'resonance';

const BURST_CONFIG: Record<BurstType, { color1: string; color2: string; count: number; speed: number; size: number }> = {
  silence_break: { color1: '#60a5fa', color2: '#818cf8', count: 60, speed: 3, size: 0.08 },
  peak_gravity: { color1: '#fbbf24', color2: '#f97316', count: 80, speed: 5, size: 0.06 },
  collective_laugh: { color1: '#f472b6', color2: '#c084fc', count: 100, speed: 4, size: 0.07 },
  resonance: { color1: '#34d399', color2: '#22d3ee', count: 50, speed: 2.5, size: 0.09 },
};

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 100;

export function EmotionalBurstParticles() {
  const [activeBurst, setActiveBurst] = useState<BurstType | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointsRef = useRef<THREE.Points>(null);

  // Store typed arrays in refs so they can be mutated in useFrame
  const positionsRef = useRef(new Float32Array(MAX_PARTICLES * 3));
  const colorsRef = useRef(new Float32Array(MAX_PARTICLES * 3));
  const sizesRef = useRef(new Float32Array(MAX_PARTICLES));

  const triggerBurst = useCallback((type: BurstType) => {
    const config = BURST_CONFIG[type];
    const particles: Particle[] = [];

    for (let i = 0; i < config.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      particles.push({
        position: new THREE.Vector3(0, 1.5, 0),
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed * 0.7 + 1,
          Math.sin(phi) * Math.sin(theta) * speed,
        ),
        life: 1.0,
        maxLife: 1.5 + Math.random() * 1.5,
        size: config.size * (0.5 + Math.random() * 0.5),
      });
    }

    particlesRef.current = particles;
    setActiveBurst(type);
  }, []);

  // Expose trigger function via global
  const setupGlobal = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__cocoro_burst = (type: BurstType) => {
      triggerBurst(type);
    };
  }, [triggerBurst]);

  // Run setup once
  const didSetup = useRef(false);
  if (!didSetup.current) {
    if (typeof window !== 'undefined') {
      setupGlobal();
    }
    didSetup.current = true;
  }

  useFrame((_, delta) => {
    const particles = particlesRef.current;
    if (!pointsRef.current || particles.length === 0) return;

    const positions = positionsRef.current;
    const colors = colorsRef.current;
    const sizes = sizesRef.current;
    const geom = pointsRef.current.geometry;
    let alive = 0;

    for (let i = 0; i < particles.length && i < MAX_PARTICLES; i++) {
      const p = particles[i];
      p.life -= delta / p.maxLife;

      if (p.life <= 0) continue;

      // Physics
      p.velocity.y -= 2 * delta;
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.multiplyScalar(0.98);

      const i3 = alive * 3;
      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;

      const config = activeBurst ? BURST_CONFIG[activeBurst] : BURST_CONFIG.resonance;
      const c1 = new THREE.Color(config.color1);
      const c2 = new THREE.Color(config.color2);
      c1.lerp(c2, Math.sin(i * 0.5) * 0.5 + 0.5);

      colors[i3] = c1.r;
      colors[i3 + 1] = c1.g;
      colors[i3 + 2] = c1.b;

      sizes[alive] = p.size * p.life * 3;
      alive++;
    }

    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;
    geom.attributes.size.needsUpdate = true;
    geom.setDrawRange(0, alive);

    if (alive === 0 && particles.length > 0) {
      particlesRef.current = [];
      setActiveBurst(null);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorsRef.current, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizesRef.current, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
