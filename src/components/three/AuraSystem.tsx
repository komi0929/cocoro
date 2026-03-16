/**
 * cocoro — Aura System
 * アバターの累積発話量でオーラが進化する
 * 
 * 思想: 使い続けるほどアバターが「自分のもの」になる
 * → 愛着爆増 → retention
 * 
 * レベル:
 *   0: なし（新規）
 *   1: 微かなグロー（5分発話）
 *   2: パルスリング（15分発話）
 *   3: フルオーラ（30分発話）
 */
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LEVEL_THRESHOLDS = [0, 300, 900, 1800]; // seconds of speech

function getAuraLevel(speechSeconds: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (speechSeconds >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

interface AuraSystemProps {
  speechSeconds: number;
  accentColor?: string;
  isSpeaking: boolean;
}

export function AuraSystem({ speechSeconds, accentColor = '#8b5cf6', isSpeaking }: AuraSystemProps) {
  const level = getAuraLevel(speechSeconds);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Glow pulse
    if (glowRef.current) {
      const baseOpacity = level * 0.08;
      const pulse = isSpeaking ? Math.sin(t * 3) * 0.1 + 0.1 : 0;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = baseOpacity + pulse;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05 * level);
    }

    // Evolution ring rotation
    if (ringRef.current && level >= 2) {
      ringRef.current.rotation.z = t * 0.5;
      const ringOpacity = level === 3 ? 0.4 : 0.2;
      const ringPulse = isSpeaking ? Math.sin(t * 4) * 0.1 : 0;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = ringOpacity + ringPulse;
    }
  });

  if (level === 0) return null;

  const color = new THREE.Color(accentColor);

  return (
    <group position={[0, 0.01, 0]}>
      {/* Level 1+: Subtle glow disc */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6 + level * 0.15, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Level 2+: Evolution ring */}
      {level >= 2 && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7 + level * 0.1, 0.75 + level * 0.1, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Level 3: Full aura particles (vertical column) */}
      {level >= 3 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 1.2, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
