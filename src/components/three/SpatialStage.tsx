/**
 * kokoro — Spatial Stage Component
 * 「舞台設計」としての3D空間（加藤圭の言う「POPOPOは舞台設計」に対抗）
 * 
 * 設計思想:
 *   - roomThemeに応じて空間の「性格」が変わる（焚き火/深海/星空/桜）
 *   - 沈黙の空間にも「予感」がある（微かな光の揺らぎ、呼吸するパーティクル）
 *   - 声が空間を変形させる = 会話が視覚的報酬になる
 *   - 感情が空間の色を変える = 喜びは暖色、悲しみは寒色
 */
'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCocoroStore } from '@/store/useCocoroStore';
import { SpacePhase } from '@/types/cocoro';
import { VoiceReactiveFloor } from './VoiceReactiveFloor';
import { CosmicParticles } from './CosmicParticles';
import { GhostParticles } from './GhostParticles';
import { TouchInteraction } from './TouchInteraction';
import { useSpatialMemoryAvatar } from '@/hooks/useSpatialMemory';
import { getThemeForRoom, type RoomTheme, DEFAULT_THEME } from '@/data/roomThemes';

interface SpatialStageProps {
  roomId?: string;
}

// Room theme → 3D space palette mapping
function themeToColors(theme: RoomTheme) {
  const h = theme.floorHue / 360;
  const s = theme.floorSaturation;
  return {
    base: [
      Math.max(0, Math.cos(h * Math.PI * 2) * s * 0.08),
      Math.max(0, Math.cos((h + 0.33) * Math.PI * 2) * s * 0.06),
      Math.max(0, Math.cos((h + 0.66) * Math.PI * 2) * s * 0.08),
    ] as [number, number, number],
    active: [
      theme.particleColor[0] * 0.5,
      theme.particleColor[1] * 0.4,
      theme.particleColor[2] * 0.5,
    ] as [number, number, number],
    peak: [
      theme.particleColor[0] * 0.9,
      theme.particleColor[1] * 0.7,
      theme.particleColor[2] * 0.5,
    ] as [number, number, number],
  };
}

export function SpatialStage({ roomId }: SpatialStageProps) {
  const phase = useCocoroStore((s) => s.phase);
  const density = useCocoroStore((s) => s.density);
  const lighting = useCocoroStore((s) => s.lighting);
  
  // Voice metrics from active speakers
  const activeSpeakers = useCocoroStore((s) => s.activeSpeakers);
  const participants = useCocoroStore((s) => s.participants);

  // Room theme (each room has a unique personality)
  const theme = useMemo(() => roomId ? getThemeForRoom(roomId) : DEFAULT_THEME, [roomId]);
  const themeColors = useMemo(() => themeToColors(theme), [theme]);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const rimLight1Ref = useRef<THREE.DirectionalLight>(null);
  const rimLight2Ref = useRef<THREE.DirectionalLight>(null);
  // Firefly point lights for "living silence"
  const firefly1Ref = useRef<THREE.PointLight>(null);
  const firefly2Ref = useRef<THREE.PointLight>(null);
  const firefly3Ref = useRef<THREE.PointLight>(null);

  // "First voice" trigger — 沈黙が破れた瞬間の演出
  const firstVoiceTriggerRef = useRef(0); // 0 = idle, >0 = flash countdown
  const wasSilentRef = useRef(true);
  // Voice pulse ring radius
  const voicePulseRef = useRef(0);

  // Aggregate voice energy from all speakers
  const [voiceEnergy, setVoiceEnergy] = useState({ bass: 0, mid: 0, treble: 0, energy: 0, smoothEnergy: 0 });

  // Emotion-driven theme colors (blended with room theme)
  const [emotionColors, setEmotionColors] = useState(themeColors);

  // Load heatmap from IndexedDB
  const { heatmap } = useSpatialMemoryAvatar('global');
  const heatSpots = useMemo(() =>
    heatmap.map(cell => ({ x: cell.x, z: cell.z, energy: cell.energy })),
    [heatmap]
  );
  
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

    // Aggregate emotion from speaking participants
    let aggJoy = 0, aggAnger = 0, aggSorrow = 0, aggSurprise = 0, aggNeutral = 0;
    let emotionCount = 0;
    for (const id of activeSpeakers) {
      const p = participants.get(id);
      if (p && p.speakingState.isSpeaking) {
        aggJoy += p.emotion.joy;
        aggAnger += p.emotion.anger;
        aggSorrow += p.emotion.sorrow;
        aggSurprise += p.emotion.surprise;
        aggNeutral += p.emotion.neutral;
        emotionCount++;
      }
    }
    
    let dominant = 'neutral';
    if (emotionCount > 0) {
      const emotions: Record<string, number> = {
        joy: aggJoy / emotionCount,
        anger: aggAnger / emotionCount,
        sorrow: aggSorrow / emotionCount,
        surprise: aggSurprise / emotionCount,
        neutral: aggNeutral / emotionCount,
      };
      dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Blend room theme colors with emotion colors
    const EMOTION_TINT: Record<string, [number, number, number]> = {
      joy:      [0.3, 0.15, 0.0],
      anger:    [0.2, -0.05, -0.05],
      sorrow:   [-0.05, -0.03, 0.2],
      surprise: [-0.03, 0.15, 0.2],
      neutral:  [0, 0, 0],
    };
    const tint = EMOTION_TINT[dominant] ?? [0, 0, 0];

    setEmotionColors(prev => ({
      base: prev.base.map((v, i) => v * 0.92 + (themeColors.base[i] + tint[i] * 0.3) * 0.08) as [number, number, number],
      active: prev.active.map((v, i) => v * 0.9 + (themeColors.active[i] + tint[i] * 0.5) * 0.1) as [number, number, number],
      peak: prev.peak.map((v, i) => v * 0.9 + (themeColors.peak[i] + tint[i]) * 0.1) as [number, number, number],
    }));
  }, [activeSpeakers, participants, voiceEnergy, themeColors]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Update voice energy each frame
    updateVoiceEnergy();

    // === "FIRST VOICE" TRIGGER — 沈黙が破れた瞬間の光の爆発 ===
    const isSilentNow = activeSpeakers.length === 0;
    if (wasSilentRef.current && !isSilentNow) {
      // 沈黙→発話の瞬間！
      firstVoiceTriggerRef.current = 1.0; // Flash starts
      voicePulseRef.current = 0; // Reset pulse ring
    }
    wasSilentRef.current = isSilentNow;

    // First-voice flash decay
    if (firstVoiceTriggerRef.current > 0) {
      firstVoiceTriggerRef.current *= 0.95; // Decay over ~60 frames
      if (firstVoiceTriggerRef.current < 0.01) firstVoiceTriggerRef.current = 0;
    }

    // Voice pulse ring expansion
    if (!isSilentNow) {
      voicePulseRef.current += 0.02 + voiceEnergy.smoothEnergy * 0.03;
      if (voicePulseRef.current > 1) voicePulseRef.current = 0;
    }

    const triggerFlash = firstVoiceTriggerRef.current;

    // --- Ambient light: breathes with collective conversation ---
    if (ambientRef.current) {
      const baseIntensity = lighting.ambientIntensity + voiceEnergy.smoothEnergy * 0.15 + triggerFlash * 0.3;
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        baseIntensity,
        0.04
      );
      const tempColor = colorTemperatureToRGB(lighting.colorTemperature);
      const themeColor = new THREE.Color(theme.ambientColor);
      tempColor.lerp(themeColor, 0.4);
      // Flash: white burst on first voice
      if (triggerFlash > 0.3) {
        tempColor.lerp(new THREE.Color(1, 1, 1), triggerFlash * 0.5);
      }
      ambientRef.current.color.lerp(tempColor, 0.04);
    }

    // --- Central bonfire: DRAMATICALLY reacts to voice ---
    if (pointLightRef.current) {
      const silenceBreathing = Math.sin(time * 0.8) * 0.08 + Math.sin(time * 1.3) * 0.04;
      const voiceBoom = voiceEnergy.smoothEnergy * 1.5; // 3x stronger than before
      const flicker =
        phase === SpacePhase.SILENCE
          ? 0.25 + silenceBreathing
          : 0.6 + density * 1.0 + voiceBoom + triggerFlash * 2.0;
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        flicker,
        0.08 // Faster response
      );
      // Color shifts warmer with energy, cooler in silence
      const themeHue = theme.floorHue / 360;
      const energyShift = voiceEnergy.smoothEnergy * 0.08;
      const hue = themeHue + energyShift + triggerFlash * 0.05;
      const saturation = 0.7 + voiceEnergy.smoothEnergy * 0.2;
      const lightness = 0.5 + triggerFlash * 0.3;
      pointLightRef.current.color.setHSL(hue % 1, saturation, lightness);
      // Distance expands with conversation energy
      pointLightRef.current.distance = 15 + voiceEnergy.smoothEnergy * 8 + triggerFlash * 10;
    }

    // --- Spotlight: follows conversation intensity ---
    if (spotlightRef.current) {
      const spotIntensity = lighting.spotlightIntensity + voiceEnergy.energy * 0.8 + triggerFlash * 1.5;
      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        spotIntensity,
        0.05
      );
      // Spotlight angle widens with more speakers
      spotlightRef.current.angle = THREE.MathUtils.lerp(
        spotlightRef.current.angle,
        0.4 + activeSpeakers.length * 0.1,
        0.03
      );
    }

    // --- Rim lights: PULSE with voice rhythm ---
    if (rimLight1Ref.current) {
      const voicePulse = Math.sin(time * 4) * voiceEnergy.bass * 0.15;
      const rimIntensity =
        phase === SpacePhase.GRAVITY
          ? 0.25 + density * 0.2 + voiceEnergy.bass * 0.3 + voicePulse + triggerFlash * 0.5
          : 0.08 + Math.sin(time * 0.5) * 0.02;
      rimLight1Ref.current.intensity = THREE.MathUtils.lerp(
        rimLight1Ref.current.intensity,
        rimIntensity,
        0.04
      );
    }
    if (rimLight2Ref.current) {
      const voicePulse = Math.cos(time * 3.5) * voiceEnergy.mid * 0.1;
      const rimIntensity =
        phase === SpacePhase.GRAVITY
          ? 0.2 + density * 0.15 + voiceEnergy.mid * 0.2 + voicePulse + triggerFlash * 0.4
          : 0.06 + Math.cos(time * 0.4) * 0.015;
      rimLight2Ref.current.intensity = THREE.MathUtils.lerp(
        rimLight2Ref.current.intensity,
        rimIntensity,
        0.04
      );
    }

    // --- Firefly lights: alive in silence, retreat in conversation ---
    const fireflyLights = [firefly1Ref, firefly2Ref, firefly3Ref];
    fireflyLights.forEach((ref, i) => {
      if (!ref.current) return;
      const offset = i * 2.094;
      const speed = 0.15 + i * 0.05;
      const radius = 3 + Math.sin(time * speed * 0.7 + offset) * 1.5;
      
      ref.current.position.x = Math.cos(time * speed + offset) * radius;
      ref.current.position.z = Math.sin(time * speed + offset) * radius;
      ref.current.position.y = 0.5 + Math.sin(time * speed * 1.5 + offset) * 0.8;
      
      const fireflyIntensity = phase === SpacePhase.SILENCE
        ? 0.2 + Math.sin(time * 2 + offset * 3) * 0.12
        : Math.max(0, 0.03 - voiceEnergy.smoothEnergy * 0.15);
      ref.current.intensity = THREE.MathUtils.lerp(ref.current.intensity, fireflyIntensity, 0.03);
    });
  });

  // Fog color from room theme
  const fogColor = useMemo(() => theme.bgColor, [theme]);

  return (
    <>
      {/* === Lighting === */}
      <ambientLight ref={ambientRef} intensity={0.3} color={theme.ambientColor} />

      {/* Central bonfire (themed) */}
      <pointLight
        ref={pointLightRef}
        position={[0, 2, 0]}
        intensity={0.5}
        color={theme.ambientColor}
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

      {/* Rim lights (themed) */}
      <directionalLight ref={rimLight1Ref} position={[5, 5, 5]} intensity={0.15} color={theme.ambientColor} />
      <directionalLight ref={rimLight2Ref} position={[-5, 3, -5]} intensity={0.1} color="#fbbf24" />

      {/* Under-light */}
      <pointLight position={[0, -1, 0]} intensity={0.04} color={theme.ambientColor} distance={10} decay={2} />

      {/* === Firefly lights (沈黙に生命感を) === */}
      <pointLight ref={firefly1Ref} intensity={0.1} color={theme.ambientColor} distance={4} decay={2} />
      <pointLight ref={firefly2Ref} intensity={0.1} color="#fbbf24" distance={3} decay={2} />
      <pointLight ref={firefly3Ref} intensity={0.1} color="#22d3ee" distance={3.5} decay={2} />

      {/* === Voice Reactive Floor (GLSL Custom Shader) === */}
      <VoiceReactiveFloor
        bass={voiceEnergy.bass}
        mid={voiceEnergy.mid}
        treble={voiceEnergy.treble}
        energy={voiceEnergy.energy}
        smoothEnergy={voiceEnergy.smoothEnergy}
        themeColors={emotionColors}
        heatSpots={heatSpots}
      />

      {/* === Ghost Particles (Past Visitor Presence) === */}
      <GhostParticles />

      {/* === Cosmic Particles === */}
      <CosmicParticles />

      {/* === Touch Interaction === */}
      <TouchInteraction />

      {/* === Fog (themed) === */}
      <fog attach="fog" args={[fogColor, 10, 30]} />
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
