/**
 * cocoro — Flow State Visualizer (3D)
 * ConversationFlowAnalyzerのフロー状態を3D空間で視覚化
 * 
 * 反復161-170:
 * - idle: 何もなし
 * - warming: 地面がわずかに光り始める
 * - flowing: オーブが中央に出現し、脈動
 * - zone: オーブが巨大化し、空間全体がゴールドに輝く
 * = 「良い会話をしている」ことが視覚的にわかる
 */
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';

type FlowLevel = 'idle' | 'warming' | 'flowing' | 'zone';

const FLOW_COLORS: Record<FlowLevel, { color: string; emissive: string; intensity: number }> = {
  idle: { color: '#1a1a2e', emissive: '#000000', intensity: 0 },
  warming: { color: '#2d1b69', emissive: '#8b5cf6', intensity: 0.3 },
  flowing: { color: '#7c3aed', emissive: '#a78bfa', intensity: 0.7 },
  zone: { color: '#fbbf24', emissive: '#f59e0b', intensity: 1.0 },
};

export function FlowStateVisualizer() {
  const density = useCocoroStore((s) => s.density);
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);

  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);


  // Derive flow level from store state (simplified for real-time)
  const derivedLevel: FlowLevel = density > 0.6 && activeSpeakers.length >= 2
    ? 'zone'
    : density > 0.4 && activeSpeakers.length >= 2
      ? 'flowing'
      : activeSpeakers.length >= 1
        ? 'warming'
        : 'idle';

  const config = FLOW_COLORS[derivedLevel];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (orbRef.current && derivedLevel !== 'idle') {
      // Orb pulsation
      const baseScale = derivedLevel === 'zone' ? 0.5 : derivedLevel === 'flowing' ? 0.3 : 0.15;
      const pulse = baseScale + Math.sin(t * 2) * 0.05 + density * 0.1;
      orbRef.current.scale.setScalar(pulse);
      orbRef.current.position.y = 2 + Math.sin(t * 0.5) * 0.3;
      orbRef.current.rotation.y = t * 0.3;

      // Emissive intensity
      const mat = orbRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = config.intensity * (0.8 + Math.sin(t * 3) * 0.2);
    }

    if (ringRef.current && derivedLevel !== 'idle') {
      // Ring expansion
      const ringScale = derivedLevel === 'zone' ? 3 + Math.sin(t) * 0.5 : derivedLevel === 'flowing' ? 2 : 1;
      ringRef.current.scale.setScalar(ringScale);
      ringRef.current.rotation.z = t * 0.1;
      
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = config.intensity * 0.3 * (0.5 + Math.sin(t * 2) * 0.5);
    }

    if (glowRef.current) {
      glowRef.current.intensity = config.intensity * 2 * (0.8 + Math.sin(t * 2) * 0.2);
      glowRef.current.color.set(config.emissive);
    }
  });

  if (derivedLevel === 'idle') return null;

  return (
    <group>
      {/* Central orb */}
      <mesh ref={orbRef} position={[0, 2, 0]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={config.intensity}
          transparent
          opacity={0.6}
          wireframe={derivedLevel !== 'zone'}
        />
      </mesh>

      {/* Expanding ring */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial
          color={config.emissive}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Point light glow */}
      <pointLight
        ref={glowRef}
        position={[0, 2, 0]}
        color={config.emissive}
        intensity={config.intensity * 2}
        distance={8}
        decay={2}
      />
    </group>
  );
}
