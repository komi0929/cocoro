/**
 * cocoro — CocoroCanvas
 * React Three Fiber のルート Canvas ラッパー
 * シネマティックカメラ + 3D空間描画
 * ※ EffectComposer(post-processing)は本番WebGL安定性のため意図的に除外
 */
'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
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
    const sorted = all.sort((a, b) => {
      if (a.id === localId) return -1;
      if (b.id === localId) return 1;
      const aDist = Math.sqrt(a.transform.position.x ** 2 + a.transform.position.z ** 2);
      const bDist = Math.sqrt(b.transform.position.x ** 2 + b.transform.position.z ** 2);
      return aDist - bDist;
    });
    return sorted.slice(0, perfProfile.maxAvatars);
  }, [participants, localId, perfProfile.maxAvatars]);

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
          <CinematicCamera enableEntrance />
          <SpatialStage roomId={roomId ?? undefined} />

          {avatarsToRender.map((participant) => (
            <AvatarEntity
              key={participant.id}
              participant={participant}
              isLocal={participant.id === localId}
            />
          ))}

          <CollectiveResonance />
          <EmotionalBurstParticles />
          <FlowStateVisualizer />
          <VocalEnergyField />
          <GravityWaves />
          <SpectralAurora />

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

          <AuroraFloor />

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

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
