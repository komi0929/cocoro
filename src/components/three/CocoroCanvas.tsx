/**
 * cocoro — CocoroCanvas
 * React Three Fiber のルートCanvas
 * 子ども向け: 明るいパステル空間 + ネームプレート + 発話リング
 */
'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarEntity } from './AvatarEntity';
import { CinematicCamera } from './CinematicCamera';
import { useCocoroStore } from '@/store/useCocoroStore';
import { getPerformanceProfile } from '@/engine/performance/PerformanceConfig';
import { AuroraFloor } from './AuroraFloor';
import type { Participant } from '@/types/cocoro';

interface CocoroCanvasProps {
  className?: string;
}

/**
 * アバター上のネームプレート + 発話インジケーター
 * HTML overlayで3D空間上に表示
 */
function AvatarLabel({ participant }: { participant: Participant }) {
  const isSpeaking = participant.speakingState?.isSpeaking ?? false;
  const pos = participant.transform?.position ?? { x: 0, y: 0, z: 0 };

  return (
    <group position={[pos.x, 2.8, pos.z]}>
      <Html center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-1">
          {/* 発話インジケーター */}
          {isSpeaking && (
            <div className="flex gap-0.5 mb-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-green-400 rounded-full"
                  style={{
                    height: `${6 + Math.sin(Date.now() / 200 + i * 1.2) * 4}px`,
                    animation: 'none',
                  }}
                />
              ))}
            </div>
          )}
          {/* ネームプレート */}
          <div className={`
            px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
            backdrop-blur-md shadow-sm border
            ${isSpeaking
              ? 'bg-green-100/90 text-green-700 border-green-200/50'
              : 'bg-white/80 text-gray-500 border-white/50'
            }
          `}>
            {participant.displayName}
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * アバター足元のスピーキングリング（3Dメッシュ）
 */
function SpeakingRing({ participant }: { participant: Participant }) {
  const isSpeaking = participant.speakingState?.isSpeaking ?? false;
  const volume = participant.speakingState?.volume ?? 0;
  const pos = participant.transform?.position ?? { x: 0, y: 0, z: 0 };

  if (!isSpeaking) return null;

  const scale = 1.0 + volume * 0.5;
  const opacity = 0.3 + volume * 0.3;

  return (
    <mesh position={[pos.x, 0.02, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8 * scale, 1.0 * scale, 32]} />
      <meshBasicMaterial
        color="#86efac"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function CocoroCanvas({ className }: CocoroCanvasProps) {
  const participants = useCocoroStore((s) => s.participants);
  const localId = useCocoroStore((s) => s.localParticipantId);
  const perfProfile = useMemo(() => getPerformanceProfile(), []);

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
          toneMappingExposure: 1.4,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: 'linear-gradient(180deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)' }}
      >
        <Suspense fallback={null}>
          <CinematicCamera enableEntrance />

          {/* 明るい環境光 */}
          <ambientLight intensity={1.2} color="#f8f0ff" />
          <directionalLight position={[5, 10, 5]} intensity={0.8} color="#fff5ee" />

          {/* アバター + ネームプレート + 発話リング */}
          {avatarsToRender.map((participant) => (
            <group key={participant.id}>
              <AvatarEntity
                participant={participant}
                isLocal={participant.id === localId}
              />
              <AvatarLabel participant={participant} />
              <SpeakingRing participant={participant} />
            </group>
          ))}

          {/* パステルオーロラ床 */}
          <AuroraFloor />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
