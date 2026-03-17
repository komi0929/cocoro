/**
 * cocoro — Spectral Aurora (3D)
 * 会話のエネルギーがオーロラとして天井に表示される
 *
 * 反復301-310:
 * - 発話エネルギーが上昇するとオーロラが輝く
 * - 感情ごとに色が変化（joy=緑, surprise=紫, anger=赤）
 * - フロー状態でオーロラが全天を覆う
 * - GLSLシンプレックスノイズでリアルなオーロラ表現
 * = 「声が空を塗り替える」— 空間全体の没入感
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';

const AURORA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uJoy;
  uniform float uSurprise;
  uniform float uAnger;
  uniform float uFlowScore;

  varying vec2 vUv;
  varying vec3 vPos;

  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
  vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Flowing noise pattern
    float n1 = snoise(vUv * 3.0 + vec2(uTime * 0.15, uTime * 0.08));
    float n2 = snoise(vUv * 5.0 + vec2(-uTime * 0.1, uTime * 0.12));
    float n3 = snoise(vUv * 8.0 + vec2(uTime * 0.05, -uTime * 0.06));

    float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Aurora bands (horizontal with vertical variation)
    float bands = sin(vUv.x * 6.0 + noise * 2.0 + uTime * 0.3) * 0.5 + 0.5;
    bands *= bands;

    // Color mixing based on emotions
    vec3 joyColor = vec3(0.1, 0.8, 0.4);      // Green
    vec3 surpriseColor = vec3(0.6, 0.2, 0.9);  // Purple
    vec3 angerColor = vec3(0.9, 0.1, 0.2);     // Red
    vec3 baseColor = vec3(0.1, 0.3, 0.6);      // Blue base

    vec3 color = baseColor;
    color = mix(color, joyColor, uJoy * 0.6);
    color = mix(color, surpriseColor, uSurprise * 0.5);
    color = mix(color, angerColor, uAnger * 0.4);

    // Flow boost: more saturated + brighter
    color += vec3(0.1, 0.15, 0.2) * uFlowScore;

    // Vertical fade (stronger at edges of dome)
    float vertFade = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);

    // Final alpha
    float alpha = bands * noise * uEnergy * vertFade * 0.4;
    alpha *= 0.5 + uFlowScore * 0.5; // Flow makes aurora more visible
    alpha = max(0.0, alpha);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function SpectralAurora() {
  const density = useCocoroStore((s) => s.density);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uJoy: { value: 0 },
    uSurprise: { value: 0 },
    uAnger: { value: 0 },
    uFlowScore: { value: 0 },
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uEnergy.value = density;
    // Flow estimated from density
    mat.uniforms.uFlowScore.value = density > 0.5 ? (density - 0.5) * 2 : 0;
  });

  return (
    <mesh ref={meshRef} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[16, 16, 1, 1]} />
      <shaderMaterial
        vertexShader={AURORA_VERTEX}
        fragmentShader={AURORA_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
