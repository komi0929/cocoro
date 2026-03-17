/**
 * cocoro — Aurora Floor
 * カスタムGLSLシェーダーによるオーロラ波紋フロア
 * 発話者の足元から声の波形に連動した波紋が広がる
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';
import { SpacePhase } from '@/types/cocoro';

// Simplex Noise GLSL (embedded)
const SIMPLEX_NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  ${SIMPLEX_NOISE_GLSL}

  uniform float uTime;
  uniform float uDensity;
  uniform int   uPhase; // 0=SILENCE, 1=TRIGGER, 2=GRAVITY
  uniform vec3  uSpeakerPositions[8];
  uniform float uSpeakerVolumes[8];
  uniform int   uSpeakerCount;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Phase-based color palettes
  vec3 getSilenceColor(float n) {
    vec3 deep = vec3(0.06, 0.02, 0.12);     // deep indigo
    vec3 accent = vec3(0.15, 0.05, 0.25);   // purple
    return mix(deep, accent, n * 0.5 + 0.5);
  }

  vec3 getTriggerColor(float n) {
    vec3 warm = vec3(0.18, 0.08, 0.02);     // dark amber
    vec3 gold = vec3(0.4, 0.2, 0.05);       // gold
    return mix(warm, gold, n * 0.5 + 0.5);
  }

  vec3 getGravityColor(float n, float density) {
    vec3 hot = vec3(0.1, 0.05, 0.2);         // violet base
    vec3 plasma = vec3(0.4, 0.1, 0.35);      // magenta
    vec3 white = vec3(0.5, 0.4, 0.6);        // white heat
    vec3 base = mix(hot, plasma, n * 0.5 + 0.5);
    return mix(base, white, density * 0.4);
  }

  void main() {
    vec2 pos = vWorldPosition.xz;
    float dist = length(pos);

    // Multi-octave noise for aurora
    float n1 = snoise(pos * 0.15 + uTime * 0.08);
    float n2 = snoise(pos * 0.3 - uTime * 0.12);
    float n3 = snoise(pos * 0.6 + vec2(uTime * 0.05, -uTime * 0.1));
    float aurora = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Radial fade (central glow)
    float radialFade = 1.0 - smoothstep(0.0, 12.0, dist);
    float centralGlow = exp(-dist * 0.15) * 0.3;

    // Speaker ripple effects
    float ripple = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= uSpeakerCount) break;
      vec2 speakerPos = uSpeakerPositions[i].xz;
      float speakerDist = length(pos - speakerPos);
      float vol = uSpeakerVolumes[i];

      // Expanding ring
      float ringPhase = fract(uTime * 0.5 + float(i) * 0.17);
      float ringRadius = ringPhase * 6.0;
      float ring = exp(-pow(speakerDist - ringRadius, 2.0) * 2.0) * (1.0 - ringPhase);
      ripple += ring * vol * 1.5;

      // Static glow at speaker position
      float speakerGlow = exp(-speakerDist * 0.8) * vol;
      ripple += speakerGlow * 0.5;
    }

    // Phase-based coloring
    vec3 color;
    if (uPhase == 0) {
      color = getSilenceColor(aurora);
    } else if (uPhase == 1) {
      color = mix(getSilenceColor(aurora), getTriggerColor(aurora), 0.6);
    } else {
      color = getGravityColor(aurora, uDensity);
    }

    // Add ripple glow (cyan-tinted)
    vec3 rippleColor = vec3(0.1, 0.6, 0.8) * ripple;
    color += rippleColor;

    // Add central glow
    color += vec3(0.2, 0.1, 0.3) * centralGlow;

    // Apply radial fade
    float alpha = radialFade * (0.3 + aurora * 0.15 + ripple * 0.3 + centralGlow);
    alpha = clamp(alpha, 0.0, 0.85);

    // Edge shimmer
    float edgeNoise = snoise(pos * 0.8 + uTime * 0.2) * 0.5 + 0.5;
    float edgeFade = smoothstep(8.0, 12.0, dist);
    alpha *= (1.0 - edgeFade * 0.7 * edgeNoise);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function AuroraFloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useCocoroStore((s) => s.phase);
  const density = useCocoroStore((s) => s.density);
  const participants = useCocoroStore((s) => s.participants);
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDensity: { value: 0 },
      uPhase: { value: 0 },
      uSpeakerPositions: {
        value: Array.from({ length: 8 }, () => new THREE.Vector3()),
      },
      uSpeakerVolumes: { value: new Float32Array(8) },
      uSpeakerCount: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    uniforms.uTime.value = time;
    uniforms.uDensity.value = density;

    // Phase mapping
    switch (phase) {
      case SpacePhase.SILENCE:
        uniforms.uPhase.value = 0;
        break;
      case SpacePhase.TRIGGER:
        uniforms.uPhase.value = 1;
        break;
      case SpacePhase.GRAVITY:
        uniforms.uPhase.value = 2;
        break;
    }

    // Speaker positions and volumes
    let speakerIdx = 0;
    activeSpeakers.forEach((id) => {
      if (speakerIdx >= 8) return;
      const p = participants.get(id);
      if (p) {
        uniforms.uSpeakerPositions.value[speakerIdx].set(
          p.transform.position.x,
          0,
          p.transform.position.z
        );
        uniforms.uSpeakerVolumes.value[speakerIdx] =
          p.speakingState.volume;
        speakerIdx++;
      }
    });
    uniforms.uSpeakerCount.value = speakerIdx;

    // Clear unused slots
    for (let i = speakerIdx; i < 8; i++) {
      uniforms.uSpeakerVolumes.value[i] = 0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
    >
      <planeGeometry args={[30, 30, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
