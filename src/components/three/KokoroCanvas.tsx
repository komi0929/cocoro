/**
 * kokoro — KokoroCanvas
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
import { useKokoroStore } from '@/store/useKokoroStore';

interface KokoroCanvasProps {
  className?: string;
}

/**
 * Deferred post-processing wrapper.
 * Waits for GL context to be ready before initializing EffectComposer.
 */
function DeferredPostProcessing() {
  const { gl } = useThree();
  const [ready, setReady] = useState(false);
  const density = useKokoroStore((s) => s.density);
  const lighting = useKokoroStore((s) => s.lighting);

  useEffect(() => {
    if (gl && gl.getContext()) {
      setReady(true);
    } else {
      const id = requestAnimationFrame(() => {
        if (gl && gl.getContext()) {
          setReady(true);
        }
      });
      return () => cancelAnimationFrame(id);
    }
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

export function KokoroCanvas({ className }: KokoroCanvasProps) {
  const participants = useKokoroStore((s) => s.participants);
  const localId = useKokoroStore((s) => s.localParticipantId);

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
        dpr={[1, 1.5]}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: '#0f0a1a' }}
      >
        <Suspense fallback={null}>
          {/* Cinematic Camera (entrancedive + phase-dynamic) */}
          <CinematicCamera enableEntrance />

          {/* Spatial Stage (floor shader, particles, lights) */}
          <SpatialStage />

          {/* Render all avatars */}
          {Array.from(participants.values()).map((participant) => (
            <AvatarEntity
              key={participant.id}
              participant={participant}
              isLocal={participant.id === localId}
            />
          ))}

          {/* Post-processing (deferred) */}
          <DeferredPostProcessing />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
