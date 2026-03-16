/**
 * cocoro — Voice Reactive Floor
 * 声のFFTスペクトラムで脈動するカスタムGLSLシェーダーフロア
 * 
 * 思想: 「声が空間を変形させる」= 会話がエンタメになる根幹
 * 声を出した瞬間に床が波打ち、色が変わり、パーティクルが舞う
 * → 黙っている空間との劇的なコントラスト
 * → 「声を出したい」というモチベーション
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex shader: 声のエネルギーで頂点を変形
const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uSmoothEnergy;
  
  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Distance from center
    float dist = length(pos.xz);
    vDistFromCenter = dist;
    
    // Multi-frequency wave displacement
    float wave1 = sin(dist * 3.0 - uTime * 2.0) * uBass * 0.3;
    float wave2 = sin(dist * 6.0 + uTime * 3.0) * uMid * 0.15;
    float wave3 = sin(pos.x * 8.0 + pos.z * 8.0 + uTime * 5.0) * uTreble * 0.08;
    
    // Radial pulse from center (voice impact wave)
    float pulse = sin(dist * 2.0 - uTime * 4.0) * uEnergy * 0.2;
    pulse *= smoothstep(5.0, 0.0, dist); // Fade at edges
    
    // Ambient undulation even without voice
    float ambient = sin(dist * 1.5 - uTime * 0.3) * 0.02
                  + sin(pos.x * 2.0 + uTime * 0.5) * 0.01;
    
    pos.y += wave1 + wave2 + wave3 + pulse + ambient;
    vElevation = pos.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader: 声のエネルギーで色が変化
const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uSmoothEnergy;
  uniform vec3 uBaseColor;
  uniform vec3 uActiveColor;
  uniform vec3 uPeakColor;
  
  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;
  
  // Simplex noise approximation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    // Grid lines (subtle)
    float gridX = smoothstep(0.48, 0.5, abs(fract(vUv.x * 20.0) - 0.5));
    float gridZ = smoothstep(0.48, 0.5, abs(fract(vUv.y * 20.0) - 0.5));
    float grid = max(gridX, gridZ) * 0.15;
    
    // Noise pattern
    float n = noise(vUv * 10.0 + uTime * 0.1) * 0.3;
    
    // Distance-based fade
    float distFade = smoothstep(6.0, 0.0, vDistFromCenter);
    
    // Color mixing based on voice energy
    vec3 color = uBaseColor;
    color = mix(color, uActiveColor, uSmoothEnergy * 0.7);
    color = mix(color, uPeakColor, uEnergy * uEnergy * 0.5);
    
    // Elevation-based brightness
    color += vElevation * 2.0;
    
    // Add noise variation
    color += n * 0.05;
    
    // Grid overlay
    color += grid * (0.3 + uSmoothEnergy * 0.5);
    
    // Radial glow at center
    float centerGlow = smoothstep(3.0, 0.0, vDistFromCenter) * uSmoothEnergy * 0.3;
    color += centerGlow * uActiveColor;
    
    // Alpha: fade at edges
    float alpha = distFade * (0.4 + uSmoothEnergy * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface VoiceReactiveFloorProps {
  bass?: number;
  mid?: number;
  treble?: number;
  energy?: number;
  smoothEnergy?: number;
  themeColors?: {
    base: [number, number, number];
    active: [number, number, number];
    peak: [number, number, number];
  };
}

export function VoiceReactiveFloor({
  bass = 0,
  mid = 0,
  treble = 0,
  energy = 0,
  smoothEnergy = 0,
  themeColors,
}: VoiceReactiveFloorProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const colors = themeColors ?? {
    base: [0.03, 0.01, 0.08],    // Deep purple-black
    active: [0.2, 0.05, 0.4],     // Violet
    peak: [0.6, 0.1, 0.3],        // Fuchsia-red
  };

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uEnergy: { value: 0 },
      uSmoothEnergy: { value: 0 },
      uBaseColor: { value: new THREE.Vector3(...colors.base) },
      uActiveColor: { value: new THREE.Vector3(...colors.active) },
      uPeakColor: { value: new THREE.Vector3(...colors.peak) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uBass.value = bass;
    mat.uniforms.uMid.value = mid;
    mat.uniforms.uTreble.value = treble;
    mat.uniforms.uEnergy.value = energy;
    mat.uniforms.uSmoothEnergy.value = smoothEnergy;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[12, 12, 128, 128]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
