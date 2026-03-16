/**
 * cocoro — Spatial Stage Component
 * 声の物理量で空間が変形する超越的3Dステージ
 * VoiceReactiveFloor (GLSL) + GhostParticles + CosmicParticles + プレミアムライティング
 */
'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpacePhase } from '@/types/kokoro';
import { VoiceReactiveFloor } from './VoiceReactiveFloor';
import { CosmicParticles } from './CosmicParticles';
import { GhostParticles } from './GhostParticles';
import { TouchInteraction } from './TouchInteraction';
import { VoiceEmotionClassifier } from '@/engine/audio/VoiceEmotionClassifier';

export function SpatialStage() {
  const phase = useKokoroStore((s) => s.phase);
  const density = useKokoroStore((s) => s.density);
  const lighting = useKokoroStore((s) => s.lighting);
  
  // Voice metrics from active speakers
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const participants = useKokoroStore((s) => s.participants);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const rimLight1Ref = useRef<THREE.DirectionalLight>(null);
  const rimLight2Ref = useRef<THREE.DirectionalLight>(null);

  // Aggregate voice energy from all speakers
  const [voiceEnergy, setVoiceEnergy] = useState({ bass: 0, mid: 0, treble: 0, energy: 0, smoothEnergy: 0 });

  // Emotion-driven theme colors
  const emotionClassifier = useMemo(() => new VoiceEmotionClassifier(), []);
  const [emotionColors, setEmotionColors] = useState({
    base: [0.03, 0.01, 0.08] as [number, number, number],
    active: [0.2, 0.05, 0.4] as [number, number, number],
    peak: [0.6, 0.1, 0.3] as [number, number, number],
  });
  
  const updateVoiceEnergy = useCallback(() => {
    let totalVolume = 0;
    let speakerCount = 0;
    
    for (const id of activeSpeakers) {
      const p = participants.get(id);
      if (p && p.speakingState.isSpeaking) {
        totalVolume += p.speakingState.volume;
        speakerCount++;
      }
    }
    
    const avgVolume = speakerCount > 0 ? totalVolume / speakerCount : 0;
    const bass = avgVolume * 1.2;
    const mid = avgVolume * 0.9;
    const treble = avgVolume * 0.5;
    const energy = Math.min(1, avgVolume * 2);
    
    const prev_ve = voiceEnergy;
    setVoiceEnergy({
      bass: prev_ve.bass * 0.85 + bass * 0.15,
      mid: prev_ve.mid * 0.85 + mid * 0.15,
      treble: prev_ve.treble * 0.85 + treble * 0.15,
      energy,
      smoothEnergy: prev_ve.smoothEnergy * 0.92 + energy * 0.08,
    });

    // Emotion classification from aggregate voice data
    const fakeFFT = new Float32Array(64);
    for (let i = 0; i < 64; i++) {
      fakeFFT[i] = avgVolume * (1 - i / 64) * (1 + Math.sin(i * 0.5) * 0.3);
    }
    const emotion = emotionClassifier.classify(fakeFFT, avgVolume, avgVolume * 0.7, speakerCount > 0);

    // Map dominant emotion to theme colors
    const EMOTION_THEMES: Record<string, { base: [number, number, number]; active: [number, number, number]; peak: [number, number, number] }> = {
      joy:      { base: [0.05, 0.03, 0.01], active: [0.5, 0.3, 0.05], peak: [1.0, 0.7, 0.1] },
      anger:    { base: [0.08, 0.01, 0.01], active: [0.5, 0.05, 0.05], peak: [0.8, 0.1, 0.05] },
      sorrow:   { base: [0.01, 0.01, 0.06], active: [0.05, 0.05, 0.3], peak: [0.1, 0.1, 0.5] },
      surprise: { base: [0.01, 0.05, 0.06], active: [0.05, 0.3, 0.4], peak: [0.2, 0.8, 1.0] },
      neutral:  { base: [0.03, 0.01, 0.08], active: [0.2, 0.05, 0.4], peak: [0.6, 0.1, 0.3] },
    };
    const targetTheme = EMOTION_THEMES[emotion.dominant] ?? EMOTION_THEMES.neutral;
    setEmotionColors(prev_ec => ({
      base: prev_ec.base.map((v, i) => v * 0.9 + targetTheme.base[i] * 0.1) as [number, number, number],
      active: prev_ec.active.map((v, i) => v * 0.9 + targetTheme.active[i] * 0.1) as [number, number, number],
      peak: prev_ec.peak.map((v, i) => v * 0.9 + targetTheme.peak[i] * 0.1) as [number, number, number],
    }));
  }, [activeSpeakers, participants, emotionClassifier, voiceEnergy]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Update voice energy each frame
    updateVoiceEnergy();

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
          : 0.5 + density * 0.8 + voiceEnergy.smoothEnergy * 0.5;
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        flicker,
        0.05
      );
      // Color shifts with voice energy
      const warmth = 1 - density * 0.3;
      const hue = 0.08 * warmth - voiceEnergy.smoothEnergy * 0.03;
      pointLightRef.current.color.setHSL(hue, 0.8, 0.5);
    }

    // --- Spotlight (speaker focus) ---
    if (spotlightRef.current) {
      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        lighting.spotlightIntensity + voiceEnergy.energy * 0.3,
        0.03
      );
    }

    // --- Rim lights: pulse with voice ---
    if (rimLight1Ref.current) {
      const rimIntensity =
        phase === SpacePhase.GRAVITY
          ? 0.2 + Math.sin(time * 1.5) * 0.05 + density * 0.15 + voiceEnergy.bass * 0.1
          : 0.15 + voiceEnergy.smoothEnergy * 0.05;
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

      {/* Rim lights */}
      <directionalLight ref={rimLight1Ref} position={[5, 5, 5]} intensity={0.15} color="#c4b5fd" />
      <directionalLight ref={rimLight2Ref} position={[-5, 3, -5]} intensity={0.1} color="#fbbf24" />

      {/* Under-light */}
      <pointLight position={[0, -1, 0]} intensity={0.05} color="#8b5cf6" distance={10} decay={2} />

      {/* === Voice Reactive Floor (GLSL Custom Shader) === */}
      <VoiceReactiveFloor
        bass={voiceEnergy.bass}
        mid={voiceEnergy.mid}
        treble={voiceEnergy.treble}
        energy={voiceEnergy.energy}
        smoothEnergy={voiceEnergy.smoothEnergy}
        themeColors={emotionColors}
      />

      {/* === Ghost Particles (Past Visitor Presence) === */}
      <GhostParticles />

      {/* === Cosmic Particles === */}
      <CosmicParticles />

      {/* === Touch Interaction === */}
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
