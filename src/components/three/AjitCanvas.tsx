/**
 * cocoro - AjitCanvas Phase 8
 * Main R3F Canvas wrapper with post-processing
 * Bloom + Vignette for premium visual feel
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AjitRoom } from './AjitRoom';
import { FurniturePlacer } from './FurniturePlacer';
import { FurnitureDragger } from './FurnitureDragger';
import { CinematicCamera } from './CinematicCamera';
import { ReactionCloud } from './EmojiReactions';
import { useAjitStore } from '@/store/useAjitStore';
import { useSceneStore } from '@/store/useSceneStore';

export function AjitCanvas() {
  const placingType = useAjitStore(s => s.placingType);
  const isDragging = useAjitStore(s => s.isDragging);
  const cameraMode = useSceneStore(s => s.cameraMode);

  const cinematicActive = cameraMode === 'speaker-focus';

  return (
    <Canvas
      shadows
      camera={{
        position: [0, 4, 6],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'default',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={null}>
        <AjitRoom />
        <FurniturePlacer />
        <FurnitureDragger />
        <ReactionCloud />
      </Suspense>

      <CinematicCamera />

      {/* Post-processing for premium visual feel */}
      <EffectComposer>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.5}
        />
      </EffectComposer>

      <OrbitControls
        enablePan={!cinematicActive}
        enableZoom={!cinematicActive}
        enableRotate={!placingType && !isDragging && !cinematicActive}
        enabled={!cinematicActive}
        minDistance={2}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.2}
        target={[0, 0.5, 0]}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: undefined as unknown as THREE.MOUSE,
        }}
        touches={{
          ONE: 1,
          TWO: 2,
        }}
      />
    </Canvas>
  );
}
