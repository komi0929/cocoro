/**
 * cocoro — CocoroCanvas
 * React Three Fiber のルート Canvas ラッパー
 * シネマティックカメラ + プレミアムポストプロセス
 */
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { SpatialStage } from './SpatialStage';
import { AvatarEntity } from './AvatarEntity';
import { CinematicCamera } from './CinematicCamera';
import { useCocoroStore } from '@/store/useCocoroStore';
import { getThemeForRoom, DEFAULT_THEME } from '@/data/roomThemes';
import { getPerformanceProfile } from '@/engine/performance/PerformanceConfig';
import { CollectiveResonance } from './CollectiveResonance';
import { EmotionalBurstParticles } from './EmotionalBurstParticles';
import { FlowStateVisualizer } from './FlowStateVisualizer';
import { VocalEnergyField } from './VocalEnergyField';
import { GravityWaves } from './GravityWaves';
import { SpectralAurora } from './SpectralAurora';
import { AuraSystem } from './AuraSystem';
import { AuroraFloor } from './AuroraFloor';
import { EmotionParticles } from './EmotionParticles';
import { PresenceAura } from './PresenceAura';

interface CocoroCanvasProps {
  className?: string;
}

/**
 * Deferred post-processing wrapper.
 * Waits for GL context to be ready before initializing EffectComposer.
 */
function DeferredPostProcessing() {
  const { gl } = useThree();
  const [ready, setReady] = useState(false);
  const density = useCocoroStore((s) => s.density);
  const lighting = useCocoroStore((s) => s.lighting);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const maxRetries = 30; // ~500ms total

    const check = () => {
      if (cancelled) return;
      try {
        const ctx = gl?.getContext?.();
        // Ensure both the context AND its properties exist (alpha, etc.)
        if (ctx && typeof ctx.getParameter === 'function') {
          setReady(true);
          return;
        }
      } catch { /* context not ready */ }

      retries++;
      if (retries < maxRetries) {
        requestAnimationFrame(check);
      }
    };

    // Delay first check to let Canvas fully initialize
    const timeoutId = setTimeout(() => check(), 100);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [gl]);

  if (!ready) return null;

  // Dynamic bloom threshold: lower in heated phases for more glow
  const bloomThreshold = Math.max(0.3, 0.6 - density * 0.3);

  return (
    <EffectComposer>
      <Bloom
        intensity={lighting.bloomStrength * 1.5}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <Vignette
        offset={0.25}
        darkness={0.85}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={
          new THREE.Vector2(
            density * 0.0015 + 0.0003,
            density * 0.0015 + 0.0003
          )
        }
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export function CocoroCanvas({ className }: CocoroCanvasProps) {
  const participants = useCocoroStore((s) => s.participants);
  const localId = useCocoroStore((s) => s.localParticipantId);
  const roomId = useCocoroStore((s) => s.roomId);
  const theme = useMemo(() => roomId ? getThemeForRoom(roomId) : DEFAULT_THEME, [roomId]);
  const perfProfile = useMemo(() => getPerformanceProfile(), []);

  // Limit avatars rendered based on performance tier
  const avatarsToRender = useMemo(() => {
    const all = Array.from(participants.values());
    if (all.length <= perfProfile.maxAvatars) return all;
    // Prioritize: local avatar first, then closest to center
    const sorted = all.sort((a, b) => {
      if (a.id === localId) return -1;
      if (b.id === localId) return 1;
      const aDist = Math.sqrt(a.transform.position.x ** 2 + a.transform.position.z ** 2);
      const bDist = Math.sqrt(b.transform.position.x ** 2 + b.transform.position.z ** 2);
      return aDist - bDist;
    });
    return sorted.slice(0, perfProfile.maxAvatars);
  }, [participants, localId, perfProfile.maxAvatars]);

  // Camera settings (initial; CinematicCamera overrides this)
  const cameraConfig = useMemo(
    () => ({
      position: [0, 25, 30] as [number, number, number],
      fov: 50,
      near: 0.1,
      far: 100,
    }),
    []
  );

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={cameraConfig}
        dpr={[1, perfProfile.maxDpr]}
        shadows={perfProfile.enableShadows}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: theme.bgColor }}
      >
        <Suspense fallback={null}>
          {/* Cinematic Camera (entrancedive + phase-dynamic) */}
          <CinematicCamera enableEntrance />

          {/* Spatial Stage (floor shader, particles, lights — themed) */}
          <SpatialStage roomId={roomId ?? undefined} />

          {/* Render all avatars */}
          {avatarsToRender.map((participant) => (
            <AvatarEntity
              key={participant.id}
              participant={participant}
              isLocal={participant.id === localId}
            />
          ))}

          {/* Collective Emotion Resonance */}
          <CollectiveResonance />

          {/* Peak Moment Burst Particles */}
          <EmotionalBurstParticles />

          {/* Flow State Visualizer (orb + ring) */}
          <FlowStateVisualizer />

          {/* Vocal Energy Field (GLSL speaker fields) */}
          <VocalEnergyField />

          {/* Gravity Waves (voice ripples) */}
          <GravityWaves />

          {/* Spectral Aurora (ceiling) */}
          <SpectralAurora />

          {/* Aura System (cognitive color mapping) */}
          {(() => {
            const lp = localId ? participants.get(localId) : undefined;
            const speaking = lp?.speakingState;
            return (
              <AuraSystem
                speechSeconds={speaking?.isSpeaking ? 1 : 0}
                isSpeaking={speaking?.isSpeaking ?? false}
              />
            );
          })()}

          {/* Aurora Floor (room floor effect) */}
          <AuroraFloor />

          {/* Emotion Particles (ambient emotion) */}
          {(() => {
            const lp = localId ? participants.get(localId) : undefined;
            return (
              <EmotionParticles
                joy={lp?.emotion?.joy ?? 0}
                surprise={lp?.emotion?.surprise ?? 0}
                isSpeaking={lp?.speakingState?.isSpeaking ?? false}
                volume={lp?.speakingState?.volume ?? 0}
              />
            );
          })()}

          {/* Presence Aura (user presence) */}
          {(() => {
            const lp = localId ? participants.get(localId) : undefined;
            const pos = lp?.transform?.position;
            return (
              <PresenceAura
                position={pos ? [pos.x, pos.y, pos.z] : [0, 0, 0]}
                isSpeaking={lp?.speakingState?.isSpeaking ?? false}
                volume={lp?.speakingState?.volume ?? 0}
              />
            );
          })()}

          {/* Post-processing (deferred) */}
          <DeferredPostProcessing />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
