/**
 * cocoro — Vocal Energy Field (3D)
 * 声のエネルギーが空間に「力場」として可視化される
 * 
 * 反復191-200:
 * - アクティブスピーカーの位置から放射状にエネルギーフィールドが展開
 * - 声量が大きいほどフィールドが強く脈動
 * - 複数話者のフィールドが重なると「共鳴エリア」が生まれる
 * = 「声が空間そのものを変形させる」究極の演出
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';

const FIELD_SHADER = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform vec3 uSpeakerPositions[8];
    uniform float uSpeakerEnergies[8];
    uniform int uSpeakerCount;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    
    varying vec2 vUv;
    varying vec3 vWorldPos;
    
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    void main() {
      float totalField = 0.0;
      vec3 fieldColor = vec3(0.0);
      
      for (int i = 0; i < 8; i++) {
        if (i >= uSpeakerCount) break;
        
        float dist = length(vWorldPos.xz - uSpeakerPositions[i].xz);
        float energy = uSpeakerEnergies[i];
        
        // Radial field falloff
        float field = energy * smoothstep(4.0, 0.0, dist);
        
        // Pulsing rings
        float ring = sin(dist * 3.0 - uTime * 4.0 * energy) * 0.5 + 0.5;
        ring *= smoothstep(3.0, 0.5, dist);
        
        // Combine
        float contribution = field * (0.6 + ring * 0.4);
        totalField += contribution;
        
        // Color variation per speaker
        float hueShift = float(i) * 0.15;
        vec3 speakerColor = mix(uColor1, uColor2, hueShift);
        fieldColor += speakerColor * contribution;
      }
      
      // Normalize
      if (totalField > 0.01) {
        fieldColor /= totalField;
      }
      
      // Noise overlay
      float noise = hash(vWorldPos.xz * 5.0 + uTime * 0.1) * 0.1;
      totalField += noise * totalField;
      
      // Alpha: stronger in center, fades at edges
      float alpha = totalField * 0.4;
      alpha *= smoothstep(6.0, 2.0, length(vWorldPos.xz));
      
      gl_FragColor = vec4(fieldColor, alpha);
    }
  `,
};

export function VocalEnergyField() {
  const participants = useCocoroStore((s) => s.participants);
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeakerPositions: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) },
    uSpeakerEnergies: { value: new Float32Array(8) },
    uSpeakerCount: { value: 0 },
    uColor1: { value: new THREE.Vector3(0.54, 0.36, 0.96) }, // violet
    uColor2: { value: new THREE.Vector3(0.06, 0.71, 0.80) }, // cyan
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    // Update speaker positions and energies
    const speakers = activeSpeakers.slice(0, 8);
    mat.uniforms.uSpeakerCount.value = speakers.length;

    for (let i = 0; i < 8; i++) {
      if (i < speakers.length) {
        const p = participants.get(speakers[i]);
        if (p) {
          const pos = p.transform.position;
          mat.uniforms.uSpeakerPositions.value[i].set(pos.x, pos.y, pos.z);
          mat.uniforms.uSpeakerEnergies.value[i] = p.speakingState.volume;
        }
      } else {
        mat.uniforms.uSpeakerEnergies.value[i] = 0;
      }
    }
  });

  if (activeSpeakers.length === 0) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} frustumCulled={false}>
      <planeGeometry args={[12, 12, 1, 1]} />
      <shaderMaterial
        vertexShader={FIELD_SHADER.vertex}
        fragmentShader={FIELD_SHADER.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
