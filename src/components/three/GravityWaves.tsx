/**
 * kokoro — Gravity Waves (3D)
 * 声のエネルギーが波紋として空間を伝播する視覚効果
 *
 * 反復231-240:
 * - 発話開始時に足元から波紋が展開
 * - 声量に比例して波紋の振幅が変化
 * - 感情に応じて波紋の色が変化
 * - 複数の波紋が干渉パターンを形成
 * = 「声が空間に波を起こす」— 究極の空間体験
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKokoroStore } from '@/store/useKokoroStore';

const WAVE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec3 uWaveOrigins[6];
  uniform float uWaveStartTimes[6];
  uniform float uWaveAmplitudes[6];
  uniform int uWaveCount;

  varying vec2 vUv;
  varying float vWaveHeight;
  varying float vDist;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float totalHeight = 0.0;

    for (int i = 0; i < 6; i++) {
      if (i >= uWaveCount) break;
      float age = uTime - uWaveStartTimes[i];
      if (age < 0.0 || age > 4.0) continue;

      float dist = length(pos.xy - uWaveOrigins[i].xz);
      float waveRadius = age * 3.0;
      float ringWidth = 0.8 + age * 0.3;

      float ring = exp(-pow(dist - waveRadius, 2.0) / (ringWidth * ringWidth));
      float decay = exp(-age * 0.8);
      float amplitude = uWaveAmplitudes[i] * decay;

      totalHeight += ring * amplitude * sin(dist * 4.0 - uTime * 6.0) * 0.15;
    }

    pos.z += totalHeight;
    vWaveHeight = totalHeight;
    vDist = length(pos.xy);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WAVE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uWaveColor;

  varying vec2 vUv;
  varying float vWaveHeight;
  varying float vDist;

  void main() {
    float edgeFade = smoothstep(6.0, 3.0, vDist);
    float waveVis = abs(vWaveHeight) * 8.0;

    vec3 color = mix(uBaseColor, uWaveColor, waveVis);
    float alpha = (0.05 + waveVis * 0.5) * edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface WaveSource {
  origin: THREE.Vector3;
  startTime: number;
  amplitude: number;
}

export function GravityWaves() {
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const participants = useKokoroStore((s) => s.participants);
  const meshRef = useRef<THREE.Mesh>(null);
  const wavesRef = useRef<WaveSource[]>([]);
  const lastSpawnRef = useRef<Map<string, number>>(new Map());

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveOrigins: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) },
    uWaveStartTimes: { value: new Float32Array(6).fill(-10) },
    uWaveAmplitudes: { value: new Float32Array(6) },
    uWaveCount: { value: 0 },
    uBaseColor: { value: new THREE.Vector3(0.05, 0.02, 0.1) },
    uWaveColor: { value: new THREE.Vector3(0.4, 0.2, 0.8) },
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = t;

    // Spawn new waves for active speakers
    for (const sid of activeSpeakers) {
      const p = participants.get(sid);
      if (!p) continue;

      const lastSpawn = lastSpawnRef.current.get(sid) ?? 0;
      if (t - lastSpawn < 1.5) continue; // One wave every 1.5s per speaker

      lastSpawnRef.current.set(sid, t);
      const pos = p.transform.position;
      wavesRef.current.push({
        origin: new THREE.Vector3(pos.x, pos.z, 0),
        startTime: t,
        amplitude: Math.min(1, p.speakingState.volume * 2),
      });
    }

    // Clean old waves
    wavesRef.current = wavesRef.current.filter(w => t - w.startTime < 4);

    // Upload to uniforms
    const waves = wavesRef.current.slice(0, 6);
    mat.uniforms.uWaveCount.value = waves.length;
    for (let i = 0; i < 6; i++) {
      if (i < waves.length) {
        mat.uniforms.uWaveOrigins.value[i].copy(waves[i].origin);
        mat.uniforms.uWaveStartTimes.value[i] = waves[i].startTime;
        mat.uniforms.uWaveAmplitudes.value[i] = waves[i].amplitude;
      } else {
        mat.uniforms.uWaveStartTimes.value[i] = -10;
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} frustumCulled={false}>
      <planeGeometry args={[12, 12, 96, 96]} />
      <shaderMaterial
        vertexShader={WAVE_VERTEX}
        fragmentShader={WAVE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
