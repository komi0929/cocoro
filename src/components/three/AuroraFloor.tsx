/**
 * cocoro — Aurora Floor (パステル版)
 * 明るくやさしいグラデーション床
 * 話している人の足元からパステルカラーの波紋が広がる
 */
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';

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
  uniform vec3  uSpeakerPositions[8];
  uniform float uSpeakerVolumes[8];
  uniform int   uSpeakerCount;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vec2 pos = vWorldPosition.xz;
    float dist = length(pos);

    // ゆらめくパステルノイズ
    float n1 = snoise(pos * 0.12 + uTime * 0.06);
    float n2 = snoise(pos * 0.25 - uTime * 0.08);
    float n3 = snoise(pos * 0.5 + vec2(uTime * 0.04, -uTime * 0.07));
    float aurora = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // パステルカラー（ラベンダー / ミント / ピーチ）
    vec3 lavender = vec3(0.78, 0.72, 0.95);
    vec3 mint     = vec3(0.65, 0.92, 0.82);
    vec3 peach    = vec3(0.98, 0.82, 0.78);
    vec3 sky      = vec3(0.72, 0.85, 0.98);

    // ノイズでカラーをブレンド
    float blend1 = aurora * 0.5 + 0.5;
    float blend2 = snoise(pos * 0.08 + uTime * 0.03) * 0.5 + 0.5;
    vec3 color = mix(
      mix(lavender, mint, blend1),
      mix(sky, peach, blend1),
      blend2
    );

    // 中心グロー
    float radialFade = 1.0 - smoothstep(0.0, 14.0, dist);
    float centralGlow = exp(-dist * 0.12) * 0.2;

    // 話している人の波紋
    float ripple = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= uSpeakerCount) break;
      vec2 speakerPos = uSpeakerPositions[i].xz;
      float speakerDist = length(pos - speakerPos);
      float vol = uSpeakerVolumes[i];

      // やさしく広がるリング
      float ringPhase = fract(uTime * 0.3 + float(i) * 0.17);
      float ringRadius = ringPhase * 5.0;
      float ring = exp(-pow(speakerDist - ringRadius, 2.0) * 3.0) * (1.0 - ringPhase);
      ripple += ring * vol * 1.0;

      // 話し手の足元のグロー
      float speakerGlow = exp(-speakerDist * 1.0) * vol;
      ripple += speakerGlow * 0.3;
    }

    // 波紋はやさしいゴールデン
    vec3 rippleColor = vec3(1.0, 0.9, 0.7) * ripple * 0.5;
    color += rippleColor;
    color += vec3(0.9, 0.85, 0.95) * centralGlow;

    // フェードアウト
    float alpha = radialFade * (0.25 + aurora * 0.08 + ripple * 0.2 + centralGlow);
    alpha = clamp(alpha, 0.0, 0.6);

    // エッジ
    float edgeNoise = snoise(pos * 0.6 + uTime * 0.15) * 0.5 + 0.5;
    float edgeFade = smoothstep(10.0, 14.0, dist);
    alpha *= (1.0 - edgeFade * 0.8 * edgeNoise);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function AuroraFloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const participants = useCocoroStore((s) => s.participants);
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeakerPositions: {
        value: Array.from({ length: 8 }, () => new THREE.Vector3()),
      },
      uSpeakerVolumes: { value: new Float32Array(8) },
      uSpeakerCount: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();

    let speakerIdx = 0;
    activeSpeakers.forEach((id) => {
      if (speakerIdx >= 8) return;
      const p = participants.get(id);
      if (p) {
        uniforms.uSpeakerPositions.value[speakerIdx].set(
          p.transform.position.x, 0, p.transform.position.z
        );
        uniforms.uSpeakerVolumes.value[speakerIdx] = p.speakingState.volume;
        speakerIdx++;
      }
    });
    uniforms.uSpeakerCount.value = speakerIdx;
    for (let i = speakerIdx; i < 8; i++) {
      uniforms.uSpeakerVolumes.value[i] = 0;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
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
