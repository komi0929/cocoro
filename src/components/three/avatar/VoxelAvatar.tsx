/**
 * cocoro — VoxelAvatar (量産エンジン直結版)
 *
 * VoxelAvatars.ts (量産エンジン) の generateCubicAvatar → VoxelGrid で描画。
 * アニメーション（歩行、座る、踊る、話す等）は group レベルで適用。
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarConfig, FurnitureActionType } from '@/types/cocoro';
import { VoxelGrid } from '../voxel/VoxelGrid';
import { generateCubicAvatar } from '../voxel/VoxelAvatars';
import { ensureQuality } from '../voxel/VoxelEngine';
import { VoxelItem } from './VoxelItems';

// ============================================================
// Main Component — 量産エンジン直結（品質ゲート適用）
// ============================================================

export interface VoxelAvatarProps {
  config: AvatarConfig;
  voiceVolume?: number;
  isWalking?: boolean;
  isSpeaking?: boolean;
  emissiveBoost?: number;
  currentAction?: FurnitureActionType | null;
}

export function VoxelAvatar({
  config,
  voiceVolume = 0,
  isWalking = false,
  isSpeaking = false,
  emissiveBoost = 0,
  currentAction = null,
}: VoxelAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { species, item } = config;

  // 量産エンジンからボクセルデータを生成（品質ゲート適用）
  const voxelData = useMemo(
    () => ensureQuality((s) => generateCubicAvatar(species, {}, s), 'avatar'),
    [species],
  );

  // Animation frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.015;
      let jumpY = 0;
      let rotZ = 0;

      if (isSpeaking && voiceVolume > 0.08) {
        jumpY = Math.abs(Math.sin(t * 12)) * 0.06 * Math.min(1, voiceVolume * 3);
      }

      if (isWalking) {
        jumpY += Math.abs(Math.sin(t * 8)) * 0.03;
      }

      if (currentAction) {
        switch (currentAction) {
          case 'sit':
            jumpY = -0.15;
            break;
          case 'sleep':
            rotZ = Math.PI / 2 * 0.8;
            jumpY = -0.2;
            break;
          case 'dance':
            jumpY = Math.abs(Math.sin(t * 6)) * 0.1;
            rotZ = Math.sin(t * 3) * 0.15;
            break;
          case 'relax':
            jumpY = -0.2;
            break;
          case 'play':
          case 'dj':
            jumpY = Math.abs(Math.sin(t * 10)) * 0.04;
            break;
        }
      }

      groupRef.current.position.y = jumpY;
      groupRef.current.scale.set(1, breathe, 1);
      // Smooth rotation
      groupRef.current.rotation.z += (rotZ - groupRef.current.rotation.z) * 0.1;
    }
  });

  // voxelSize controls overall avatar scale in the scene
  // The avatar grid is ~18×26×14 voxels, at 0.05 each → ~0.9×1.3×0.7 world units
  const voxelSize = 0.028;

  return (
    <group ref={groupRef}>
      <VoxelGrid
        data={voxelData}
        voxelSize={voxelSize}
        enableAO
        aoIntensity={0.7}
        // Center the avatar: offset so feet are at y=0
        position={[
          -(voxelData[0]?.[0]?.length ?? 18) * voxelSize / 2,
          0,
          -(voxelData[0]?.length ?? 14) * voxelSize / 2,
        ]}
      />
      {/* ITEM (held item, if any) */}
      <VoxelItem itemType={item} />
    </group>
  );
}
