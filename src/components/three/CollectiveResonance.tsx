/**
 * cocoro — Collective Resonance Effect
 * 全員の感情が一致した時の「共鳴」演出
 * 
 * 会話のピークで全員が笑っている → 空間が虹色に脈動
 * 全員が驚いている → ライトニングフラッシュ
 * = 「みんなで同じ気持ちになった」瞬間を祝福する
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';

// 共鳴の閾値: この割合以上の参加者が同じ感情なら発動
const RESONANCE_THRESHOLD = 0.6;
const MIN_PARTICIPANTS = 2;

type EmotionKey = 'joy' | 'anger' | 'sorrow' | 'surprise';

const RESONANCE_COLORS: Record<EmotionKey, THREE.Color> = {
  joy: new THREE.Color('#ffb347'),      // Warm golden
  anger: new THREE.Color('#ff6b6b'),    // Not used for resonance (anger = individual)
  sorrow: new THREE.Color('#74b9ff'),   // Gentle blue
  surprise: new THREE.Color('#a29bfe'), // Electric purple
};

export function CollectiveResonance() {
  const participants = useCocoroStore((s) => s.participants);
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);
  
  const resonanceLightRef = useRef<THREE.PointLight>(null);
  const resonanceRingRef = useRef<THREE.Mesh>(null);
  const resonanceState = useRef({
    active: false,
    dominant: 'joy' as EmotionKey,
    intensity: 0,
    ringScale: 0,
  });

  // Calculate collective emotion
  const collectiveEmotion = useMemo(() => {
    const counts = { joy: 0, anger: 0, sorrow: 0, surprise: 0 };
    let total = 0;

    for (const id of activeSpeakers) {
      const p = participants.get(id);
      if (!p) continue;
      total++;
      
      const { joy, anger, sorrow, surprise } = p.emotion;
      const dominant = Math.max(joy, anger, sorrow, surprise);
      if (dominant < 0.3) continue;
      
      if (dominant === joy) counts.joy++;
      else if (dominant === anger) counts.anger++;
      else if (dominant === sorrow) counts.sorrow++;
      else if (dominant === surprise) counts.surprise++;
    }

    if (total < MIN_PARTICIPANTS) return null;

    for (const [emotion, count] of Object.entries(counts)) {
      if (emotion === 'anger') continue; // Anger resonance is not celebrated
      if (count / total >= RESONANCE_THRESHOLD) {
        return emotion as EmotionKey;
      }
    }
    return null;
  }, [participants, activeSpeakers]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const rs = resonanceState.current;

    // Update resonance state
    const isResonating = collectiveEmotion !== null;
    if (isResonating && collectiveEmotion) {
      rs.active = true;
      rs.dominant = collectiveEmotion;
      rs.intensity += (1 - rs.intensity) * 0.05;
    } else {
      rs.intensity *= 0.95;
      if (rs.intensity < 0.01) {
        rs.active = false;
        rs.intensity = 0;
      }
    }

    // Resonance light
    if (resonanceLightRef.current) {
      const color = RESONANCE_COLORS[rs.dominant] ?? RESONANCE_COLORS.joy;
      resonanceLightRef.current.color.lerp(color, 0.05);
      const pulse = Math.sin(time * 3) * 0.3 + 0.7;
      resonanceLightRef.current.intensity = rs.intensity * 2 * pulse;
      resonanceLightRef.current.distance = 15 + rs.intensity * 10;
    }

    // Resonance ring
    if (resonanceRingRef.current) {
      rs.ringScale += 0.01 * rs.intensity;
      if (rs.ringScale > 1) rs.ringScale = 0;
      
      const scale = rs.ringScale * 8 + 1;
      resonanceRingRef.current.scale.set(scale, scale, 1);
      
      const mat = resonanceRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - rs.ringScale) * rs.intensity * 0.4);
      const color = RESONANCE_COLORS[rs.dominant] ?? RESONANCE_COLORS.joy;
      mat.color.lerp(color, 0.1);
    }
  });

  return (
    <>
      {/* Resonance central glow */}
      <pointLight
        ref={resonanceLightRef}
        position={[0, 3, 0]}
        intensity={0}
        color="#ffb347"
        distance={15}
        decay={1.5}
      />

      {/* Resonance expanding ring */}
      <mesh ref={resonanceRingRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
