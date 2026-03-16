/**
 * kokoro — Spatial Stage Component
 * 空間全体を管理する3Dステージ
 * GLSL AuroraFloor + CosmicParticles + プレミアムライティング
 */
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpacePhase } from '@/types/kokoro';
import { AuroraFloor } from './AuroraFloor';
import { CosmicParticles } from './CosmicParticles';
import { TouchInteraction } from './TouchInteraction';

export function SpatialStage() {
  const phase = useKokoroStore((s) => s.phase);
  const density = useKokoroStore((s) => s.density);
  const lighting = useKokoroStore((s) => s.lighting);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const rimLight1Ref = useRef<THREE.DirectionalLight>(null);
  const rimLight2Ref = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // --- Ambient light with color temperature ---
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        lighting.ambientIntensity,
        0.02
      );
      const tempColor = colorTemperatureToRGB(lighting.colorTemperature);
      ambientRef.current.color.lerp(tempColor, 0.02);
    }

    // --- Central bonfire point light ---
    if (pointLightRef.current) {
      const flicker =
        phase === SpacePhase.SILENCE
          ? Math.sin(time * 2) * 0.1 + 0.3
          : 0.5 + density * 0.8;
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        flicker,
        0.05
      );
      const warmth = 1 - density * 0.3;
      pointLightRef.current.color.setHSL(0.08 * warmth, 0.8, 0.5);
    }

    // --- Spotlight (speaker focus) ---
    if (spotlightRef.current) {
      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        lighting.spotlightIntensity,
        0.03
      );
    }

    // --- Rim lights: pulse gently in GRAVITY ---
    if (rimLight1Ref.current) {
      const rimIntensity =
        phase === SpacePhase.GRAVITY
          ? 0.2 + Math.sin(time * 1.5) * 0.05 + density * 0.15
          : 0.15;
      rimLight1Ref.current.intensity = THREE.MathUtils.lerp(
        rimLight1Ref.current.intensity,
        rimIntensity,
        0.02
      );
    }
    if (rimLight2Ref.current) {
      const rimIntensity =
        phase === SpacePhase.GRAVITY
          ? 0.15 + Math.cos(time * 1.2) * 0.04 + density * 0.1
          : 0.1;
      rimLight2Ref.current.intensity = THREE.MathUtils.lerp(
        rimLight2Ref.current.intensity,
        rimIntensity,
        0.02
      );
    }
  });

  return (
    <>
      {/* === Lighting === */}
      <ambientLight ref={ambientRef} intensity={0.3} color="#ffd4a6" />

      {/* Central bonfire */}
      <pointLight
        ref={pointLightRef}
        position={[0, 2, 0]}
        intensity={0.5}
        color="#ff9944"
        distance={15}
        decay={2}
      />

      {/* Speaker spotlight */}
      <spotLight
        ref={spotlightRef}
        position={[0, 8, 0]}
        intensity={0}
        angle={0.6}
        penumbra={0.8}
        color="#e0e7ff"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* Rim lights for silhouette separation */}
      <directionalLight
        ref={rimLight1Ref}
        position={[5, 5, 5]}
        intensity={0.15}
        color="#c4b5fd"
      />
      <directionalLight
        ref={rimLight2Ref}
        position={[-5, 3, -5]}
        intensity={0.1}
        color="#fbbf24"
      />

      {/* Subtle under-light for dramatic effect */}
      <pointLight
        position={[0, -1, 0]}
        intensity={0.05}
        color="#8b5cf6"
        distance={10}
        decay={2}
      />

      {/* === GLSL Aurora Floor === */}
      <AuroraFloor />

      {/* === Cosmic Particles === */}
      <CosmicParticles />

      {/* === Touch Interaction (ROM specialist) === */}
      <TouchInteraction />

      {/* === Fog === */}
      <fog attach="fog" args={['#0f0a1a', 10, 30]} />
    </>
  );
}

// ============================================================
// Color Temperature → RGB helper
// ============================================================

function colorTemperatureToRGB(kelvin: number): THREE.Color {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = Math.max(
      0,
      Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661)
    );
    b =
      temp <= 19
        ? 0
        : Math.max(
            0,
            Math.min(
              255,
              138.5177312231 * Math.log(temp - 10) - 305.0447927307
            )
          );
  } else {
    r = Math.max(
      0,
      Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592))
    );
    g = Math.max(
      0,
      Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492))
    );
    b = 255;
  }

  return new THREE.Color(r / 255, g / 255, b / 255);
}
