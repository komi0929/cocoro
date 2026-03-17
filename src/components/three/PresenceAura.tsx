/**
 * kokoro — Presence Aura (3D)
 * 各参加者の存在感をオーラとして可視化
 *
 * 反復251-260:
 * - 話している人: 明るく脈動するオーラ
 * - 聞いている人: 穏やかに呼吸するオーラ
 * - リアクションした人: 一瞬オーラが拡大
 * - コネクション強度が高い人: オーラの色が温かくなる
 * = 「存在感」そのものが見える
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AURA_SHADER = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;
    uniform float uPulse;
    
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);
      
      // Soft radial gradient
      float alpha = smoothstep(0.5, 0.1, dist);
      alpha *= alpha;
      
      // Pulsation
      float pulse = 1.0 + sin(uTime * 3.0 + dist * 5.0) * 0.15 * uPulse;
      alpha *= pulse;
      
      // Breathing
      float breath = 1.0 + sin(uTime * 1.2) * 0.05;
      alpha *= breath;
      
      alpha *= uIntensity;
      
      gl_FragColor = vec4(uColor, alpha * 0.3);
    }
  `,
};

interface PresenceAuraProps {
  position: [number, number, number];
  isSpeaking: boolean;
  volume: number;
  connectionStrength?: number;
  accentColor?: string;
}

export function PresenceAura({
  position,
  isSpeaking,
  volume,
  connectionStrength = 0,
  accentColor = '#8b5cf6',
}: PresenceAuraProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => {
    const col = new THREE.Color(accentColor);
    // Warm shift for strong connections
    if (connectionStrength > 0.5) {
      col.lerp(new THREE.Color('#fbbf24'), connectionStrength * 0.3);
    }

    return {
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uColor: { value: new THREE.Vector3(col.r, col.g, col.b) },
      uPulse: { value: 0 },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uIntensity.value = isSpeaking ? 0.6 + volume * 0.4 : 0.2;
    mat.uniforms.uPulse.value = isSpeaking ? 0.8 + volume * 0.2 : 0.2;

    // Scale based on presence
    const targetScale = isSpeaking ? 1.5 + volume : 1.0;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (targetScale - s) * 0.05);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={AURA_SHADER.vertex}
        fragmentShader={AURA_SHADER.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
