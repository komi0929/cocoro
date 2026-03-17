/**
 * kokoro — Aura System v2 (Emotion Intelligence)
 * 感情知能(EQ)オーラシステム
 * 
 * 2026メタバース動向「感情知能アバター」(Hume AI EVI, Nuance Labs) を反映
 * 声の感情分析結果がオーラの色相・脈動・形態をリアルタイムに変化させる
 * 
 * レベル (5段階進化):
 *   0: なし（新規）
 *   1: 微かなグロー（5分発話）= 存在の証
 *   2: パルスリング（15分発話）= 空間への定着
 *   3: フルオーラ（30分発話）= アイデンティティの確立
 *   4: 感情反応オーラ（60分発話）= 感情知能の発現
 *   5: コグニティブ・コロナ（120分発話）= 空間との認知的融合
 *
 * 感情→色相マッピング (Hume AI 48次元モデルを簡素化):
 *   joy     → amber/gold (暖色系)
 *   anger   → crimson pulse (赤脈動)
 *   sorrow  → deep blue mist (深青霧)
 *   surprise → spark flash (閃光)
 *   neutral → violet/cyan (デフォルト)
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LEVEL_THRESHOLDS = [0, 300, 900, 1800, 3600, 7200]; // seconds

function getAuraLevel(speechSeconds: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (speechSeconds >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

/** 感情値 (0-1 each) */
interface EmotionState {
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  neutral: number;
}

interface AuraSystemProps {
  speechSeconds: number;
  accentColor?: string;
  isSpeaking: boolean;
  /** EQ感情状態 — 感情知能オーラを駆動 */
  emotion?: EmotionState;
}

/** 感情→HSLカラーマッピング */
function getEmotionColor(emotion: EmotionState, baseColor: THREE.Color, t: number): THREE.Color {
  const { joy, anger, sorrow, surprise, neutral } = emotion;
  
  // Base hue from accent color
  const baseHSL = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(baseHSL);

  // 感情による色相シフト
  let h = baseHSL.h;
  let s = baseHSL.s;
  let l = baseHSL.l;

  // Joy: warm amber shift (h=0.08-0.12)
  h += joy * 0.15 * Math.sin(t * 2) * 0.5;
  s += joy * 0.2;
  l += joy * 0.1;

  // Anger: crimson shift (h=0.0)  
  h = h * (1 - anger * 0.7) + 0.0 * anger * 0.7;
  s += anger * 0.3;
  l += anger * 0.05 * Math.sin(t * 6); // rapid pulse

  // Sorrow: deep blue shift (h=0.6)
  h = h * (1 - sorrow * 0.5) + 0.6 * sorrow * 0.5;
  s -= sorrow * 0.15;
  l -= sorrow * 0.1;

  // Surprise: bright white flash
  l += surprise * 0.3 * Math.max(0, Math.sin(t * 12));
  s -= surprise * 0.2;

  // Neutral: keep base
  h = h * (1 - neutral * 0.3) + baseHSL.h * neutral * 0.3;

  return new THREE.Color().setHSL(
    ((h % 1) + 1) % 1,
    Math.max(0, Math.min(1, s)),
    Math.max(0.1, Math.min(0.9, l))
  );
}

const DEFAULT_EMOTION: EmotionState = {
  joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
};

export function AuraSystem({
  speechSeconds,
  accentColor = '#8b5cf6',
  isSpeaking,
  emotion = DEFAULT_EMOTION,
}: AuraSystemProps) {
  const level = getAuraLevel(speechSeconds);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  const baseColor = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const eqColor = getEmotionColor(emotion, baseColor, t);

    // === Level 1+: Glow disc ===
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = Math.min(level * 0.06, 0.3);
      const speakPulse = isSpeaking ? Math.sin(t * 3) * 0.08 + 0.08 : 0;
      // Emotion intensity boost
      const emotionBoost = (emotion.joy + emotion.anger + emotion.surprise) * 0.05;
      mat.opacity = baseOpacity + speakPulse + emotionBoost;
      mat.color.copy(eqColor);
      
      const breathe = 1 + Math.sin(t * 1.2) * 0.04 * level;
      glowRef.current.scale.setScalar(breathe);
    }

    // === Level 2+: Evolution ring ===
    if (ringRef.current && level >= 2) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      ringRef.current.rotation.z = t * 0.4;
      const ringBase = 0.15 + level * 0.03;
      const ringPulse = isSpeaking ? Math.sin(t * 3.5) * 0.08 : 0;
      mat.opacity = ringBase + ringPulse;
      mat.color.copy(eqColor);
    }

    // === Level 4+: EQ Inner Ring (感情反応リング) ===
    if (innerRingRef.current && level >= 4) {
      const mat = innerRingRef.current.material as THREE.MeshBasicMaterial;
      innerRingRef.current.rotation.z = -t * 0.8;
      
      // Emotion reactivity: pulse speed matches dominant emotion
      const emotionIntensity = Math.max(emotion.joy, emotion.anger, emotion.sorrow, emotion.surprise);
      const pulseSpeed = 2 + emotionIntensity * 6;
      mat.opacity = 0.15 + Math.sin(t * pulseSpeed) * 0.1 * emotionIntensity;
      mat.color.copy(eqColor);
      
      // Scale breathes with emotion
      const scale = 1 + emotionIntensity * 0.15 * Math.sin(t * 2);
      innerRingRef.current.scale.setScalar(scale);
    }

    // === Level 5: Cognitive Corona (認知的コロナ) ===
    if (coronaRef.current && level >= 5) {
      const mat = coronaRef.current.material as THREE.MeshBasicMaterial;
      coronaRef.current.rotation.z = t * 0.2;
      
      const emotionIntensity = Math.max(emotion.joy, emotion.anger, emotion.sorrow, emotion.surprise);
      const coronaPulse = Math.sin(t * 1.5) * 0.03 + Math.sin(t * 3.7) * 0.02;
      mat.opacity = 0.04 + coronaPulse + emotionIntensity * 0.06;
      mat.color.copy(eqColor);
      
      coronaRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.08);
    }
  });

  if (level === 0) return null;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Level 1+: EQ Glow disc */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5 + level * 0.12, 48]} />
        <meshBasicMaterial
          color={baseColor}
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
          <ringGeometry args={[0.6 + level * 0.08, 0.65 + level * 0.08, 64]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Level 3+: Outer halo */}
      {level >= 3 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 1.0 + level * 0.1, 64]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.03}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Level 4+: EQ Inner Ring (感情知能リング) */}
      {level >= 4 && (
        <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 64]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Level 5: Cognitive Corona (認知的コロナ) */}
      {level >= 5 && (
        <mesh ref={coronaRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.8, 96]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
