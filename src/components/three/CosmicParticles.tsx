/**
 * kokoro — Cosmic Particles
 * GLSLシェーダーベースの宇宙パーティクルシステム
 * Simplex Noiseで浮遊軌道を計算、密度と発話に連動
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKokoroStore } from '@/store/useKokoroStore';

const PARTICLE_COUNT = 500;

const particleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aOffset;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uDensity;
  uniform float uEmotionJoy;
  uniform float uEmotionAnger;
  uniform float uEmotionSorrow;

  varying float vAlpha;
  varying vec3 vColor;

  // Simplex-like noise for motion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x1 = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x1) - 0.5;
    vec3 ox = floor(x1 + 0.5);
    vec3 a0 = x1 - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float t = uTime * 0.15 + aOffset * 6.28;
    
    // Noise-driven orbit
    float nx = snoise(vec2(aOffset * 10.0, t * 0.3));
    float ny = snoise(vec2(aOffset * 10.0 + 100.0, t * 0.2));
    float nz = snoise(vec2(aOffset * 10.0 + 200.0, t * 0.25));
    
    vec3 pos = position;
    pos.x += nx * 1.5;
    pos.y += ny * 0.8 + sin(t) * 0.3;
    pos.z += nz * 1.5;
    
    // Y: Float upward and loop
    pos.y = mod(pos.y + uTime * 0.05 * (0.5 + aOffset), 10.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size: distance attenuation + density boost
    float sizeFactor = aSize * (1.0 + uDensity * 0.8);
    gl_PointSize = sizeFactor * (200.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
    
    // Alpha: fade near edges, boost with density
    float heightFade = 1.0 - abs(pos.y - 5.0) / 5.0;
    vAlpha = heightFade * (0.3 + uDensity * 0.4) * (0.5 + aOffset * 0.5);
    
    // Emotion-reactive color shift (Regenerative Space)
    vec3 emotionShift = vec3(0.0);
    emotionShift += vec3(0.3, 0.2, -0.1) * uEmotionJoy;    // warm amber
    emotionShift += vec3(0.3, -0.2, -0.2) * uEmotionAnger;  // crimson
    emotionShift += vec3(-0.2, -0.1, 0.3) * uEmotionSorrow; // deep blue
    vColor = aColor + emotionShift * 0.5;
  }
`;

const particleFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Soft circular particle
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    
    float alpha = vAlpha * (1.0 - d * 2.0);
    alpha *= alpha; // Soft falloff
    
    // Slight glow
    vec3 color = vColor + vec3(0.1, 0.05, 0.15) * (1.0 - d * 2.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function CosmicParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const density = useKokoroStore((s) => s.density);

  const { positions, sizes, offsets, colors } = useMemo(() => {
    // Seeded PRNG for deterministic particle generation (lint-safe)
    let _seed = 42;
    const rng = () => {
      _seed = (_seed * 16807 + 0) % 2147483647;
      return (_seed - 1) / 2147483646;
    };

    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const off = new Float32Array(PARTICLE_COUNT);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const angle = t * Math.PI * 2 * 13.7; // Golden angle spiral
      const radius = 1 + t * 10;
      const height = rng() * 10;

      pos[i * 3] = Math.cos(angle) * radius * (0.3 + rng() * 0.7);
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius * (0.3 + rng() * 0.7);

      sz[i] = 0.5 + rng() * 2.5;
      off[i] = rng();

      // Color palette: violet → magenta → soft cyan
      const colorT = rng();
      if (colorT < 0.4) {
        // Violet
        col[i * 3] = 0.5 + rng() * 0.2;
        col[i * 3 + 1] = 0.3 + rng() * 0.2;
        col[i * 3 + 2] = 0.8 + rng() * 0.2;
      } else if (colorT < 0.7) {
        // Magenta/Pink
        col[i * 3] = 0.7 + rng() * 0.3;
        col[i * 3 + 1] = 0.2 + rng() * 0.2;
        col[i * 3 + 2] = 0.6 + rng() * 0.3;
      } else {
        // Cyan/Teal
        col[i * 3] = 0.1 + rng() * 0.2;
        col[i * 3 + 1] = 0.5 + rng() * 0.3;
        col[i * 3 + 2] = 0.7 + rng() * 0.3;
      }
    }

    return { positions: pos, sizes: sz, offsets: off, colors: col };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDensity: { value: 0 },
      uEmotionJoy: { value: 0 },
      uEmotionAnger: { value: 0 },
      uEmotionSorrow: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uDensity.value = density;

    // Read local participant's emotion for spatial color shift
    const store = useKokoroStore.getState();
    const localId = store.localParticipantId;
    if (localId) {
      const p = store.participants.get(localId);
      if (p?.emotion) {
        // Smooth emotion transition
        uniforms.uEmotionJoy.value += (p.emotion.joy - uniforms.uEmotionJoy.value) * 0.05;
        uniforms.uEmotionAnger.value += (p.emotion.anger - uniforms.uEmotionAnger.value) * 0.05;
        uniforms.uEmotionSorrow.value += (p.emotion.sorrow - uniforms.uEmotionSorrow.value) * 0.05;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <float32BufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <float32BufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <float32BufferAttribute
          attach="attributes-aOffset"
          args={[offsets, 1]}
        />
        <float32BufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
