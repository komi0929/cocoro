/**
 * cocoro  ECinematicCamera
 * 映画皁E��メラワーク
 * 
 * overview: 従来のOrbitControls皁E��ルーム全体俯瞰
 * speaker-focus: 発話老E�E顔にズームイン�E�映画のワンシーン風�E�E *   - 斜め前方からのミディアムクローズアチE�E
 *   - スムーズなイージング遷移
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/store/useSceneStore';

// Camera positions
const OVERVIEW_POS = new THREE.Vector3(0, 4, 6);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0.5, 0);

// Lerp factor (higher = faster transition)
const CAM_LERP = 1.8;
const TARGET_LERP = 2.5;

// Speaker focus: camera offset from speaker's face
const SPEAKER_CAM_OFFSET = new THREE.Vector3(1.2, 0.4, 1.8);

// Temp vectors (avoid allocation)
const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _currentTarget = new THREE.Vector3();

export function CinematicCamera() {
  const { camera } = useThree();
  const cameraMode = useSceneStore(s => s.cameraMode);
  const focusTarget = useSceneStore(s => s.focusTarget);
  const currentTargetRef = useRef(OVERVIEW_TARGET.clone());

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    if (cameraMode === 'speaker-focus' && focusTarget) {
      // === SPEAKER FOCUS MODE ===
      // カメラは発話老E�E斜め前方、E���E高さ
      _desiredTarget.set(focusTarget[0], focusTarget[1], focusTarget[2]);
      _desiredPos.set(
        focusTarget[0] + SPEAKER_CAM_OFFSET.x,
        focusTarget[1] + SPEAKER_CAM_OFFSET.y,
        focusTarget[2] + SPEAKER_CAM_OFFSET.z,
      );
    } else {
      // === OVERVIEW MODE ===
      _desiredPos.copy(OVERVIEW_POS);
      _desiredTarget.copy(OVERVIEW_TARGET);
    }

    // Smooth camera position
    camera.position.lerp(_desiredPos, CAM_LERP * dt);

    // Smooth look-at target
    currentTargetRef.current.lerp(_desiredTarget, TARGET_LERP * dt);
    camera.lookAt(currentTargetRef.current);
  });

  return null; // Renderless component
}
