/**
 * cocoro - AvatarEntity
 * Avatar AI behavior component with furniture collision avoidance
 *
 * State machine:
 *   IDLE -> (3s) -> WANDER -> (arrive at furniture) -> PLAYING
 *   Any state + someone speaks -> CONVERSATION
 *   CONVERSATION -> (silence 5s) -> IDLE
 *
 * Collision: Avatar stops short of furniture (FURNITURE_RADIUS)
 * and faces it from a comfortable distance.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VoxelAvatar } from './avatar/VoxelAvatar';
import { useSceneStore } from '@/store/useSceneStore';
import { useCallStore } from '@/store/useCallStore';
import { useAjitStore } from '@/store/useAjitStore';
import { useAvatarStore } from '@/store/useAvatarStore';
import type { FurnitureItem } from '@/types/cocoro';

// ============================================================
// Constants
// ============================================================

const ROOM_HALF = 3.5;
const WALK_SPEED = 0.8;
const ARRIVE_THRESHOLD = 0.6; // stop before furniture (not on top)
const FURNITURE_RADIUS = 0.5; // collision radius around each furniture
const IDLE_TO_WANDER_DELAY = 3;
const SILENCE_TO_IDLE_DELAY = 5;
const PLAY_DURATION = 6;
const CONVERSATION_GATHER_POINT: [number, number, number] = [0, 0, 0];

const PLAYABLE_TYPES = new Set([
  'arcade', 'skateboard', 'dj_booth', 'guitar', 'boombox',
  'pinball', 'vinyl_player', 'foam_sword', 'basketball',
  'gaming_chair', 'monitor', 'gaming_pc', 'beanbag', 'sofa',
  'sofa_red', 'sofa_green', 'l_sofa', 'pizza_box',
]);

// ============================================================
// Helpers
// ============================================================

function randomRoomPos(): [number, number, number] {
  const margin = 0.8;
  return [
    (Math.random() - 0.5) * (ROOM_HALF * 2 - margin * 2),
    0,
    (Math.random() - 0.5) * (ROOM_HALF * 2 - margin * 2),
  ];
}

function dist2D(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2);
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function angleTo(from: [number, number, number], to: [number, number, number]): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

/**
 * Check if moving to nextPos would collide with any furniture.
 * Returns a pushed-out position if collision detected.
 */
function avoidFurniture(
  nextPos: [number, number, number],
  furniture: FurnitureItem[],
  targetFurnitureId: string | null,
): [number, number, number] {
  let [x, y, z] = nextPos;

  for (const item of furniture) {
    // Don't avoid the furniture we're walking toward
    if (item.id === targetFurnitureId) continue;

    const dx = x - item.position[0];
    const dz = z - item.position[2];
    const d = Math.sqrt(dx * dx + dz * dz);

    if (d < FURNITURE_RADIUS && d > 0.001) {
      // Push avatar outward from furniture center
      const nx = dx / d;
      const nz = dz / d;
      x = item.position[0] + nx * FURNITURE_RADIUS;
      z = item.position[2] + nz * FURNITURE_RADIUS;
    }
  }

  return [x, y, z];
}

// ============================================================
// Component
// ============================================================

export function AvatarEntity() {
  const groupRef = useRef<THREE.Group>(null);

  // Stores
  const avatarConfig = useAvatarStore(s => s.config);
  const furniture = useAjitStore(s => s.placedFurniture);
  const localVol = useCallStore(s => s.localVolume);
  const localIsSpeaking = useCallStore(s => s.localIsSpeaking);
  const callParticipants = useCallStore(s => s.participants);

  const localAvatar = useSceneStore(s => s.localAvatar);
  const setLocalAvatarPos = useSceneStore(s => s.setLocalAvatarPos);
  const setLocalAvatarTarget = useSceneStore(s => s.setLocalAvatarTarget);
  const setLocalAvatarRotation = useSceneStore(s => s.setLocalAvatarRotation);
  const setLocalAvatarBehavior = useSceneStore(s => s.setLocalAvatarBehavior);
  const setPlayTarget = useSceneStore(s => s.setPlayTarget);
  const setCameraMode = useSceneStore(s => s.setCameraMode);
  const setFocusTarget = useSceneStore(s => s.setFocusTarget);
  const setAnySpeaking = useSceneStore(s => s.setAnySpeaking);

  // Internal refs (avoid re-renders)
  const stateTimerRef = useRef(0);
  const playTimerRef = useRef(0);
  const silenceTimerRef = useRef(0);
  const posRef = useRef<[number, number, number]>([...localAvatar.position]);
  const rotRef = useRef(localAvatar.rotationY);
  const isWalkingRef = useRef(false);

  // Detect speaking
  const localSpeaking = localIsSpeaking;
  const localVolumeVal = localVol ?? 0;
  const remoteSpeaking = callParticipants.some(p => p.isSpeaking);
  const anySpeaking = localSpeaking || remoteSpeaking;

  const pickPlayTarget = useCallback((): FurnitureItem | null => {
    const playable = furniture.filter(f => PLAYABLE_TYPES.has(f.type));
    if (playable.length === 0) return null;
    return playable[Math.floor(Math.random() * playable.length)];
  }, [furniture]);

  useEffect(() => {
    setAnySpeaking(anySpeaking);
  }, [anySpeaking, setAnySpeaking]);

  // Main behavior loop
  useFrame((_, delta) => {
    const behavior = localAvatar.behavior;
    const dt = Math.min(delta, 0.1);

    // ============================================================
    // 1. Conversation detection
    // ============================================================
    if (anySpeaking && behavior !== 'conversation') {
      setLocalAvatarBehavior('conversation');
      stateTimerRef.current = 0;
      silenceTimerRef.current = 0;

      const gatherOffset: [number, number, number] = [
        CONVERSATION_GATHER_POINT[0] + (Math.random() - 0.5) * 1.2,
        0,
        CONVERSATION_GATHER_POINT[2] + (Math.random() - 0.5) * 1.2,
      ];
      setLocalAvatarTarget(gatherOffset);
      setCameraMode('speaker-focus');
      return;
    }

    // ============================================================
    // 2. State machine
    // ============================================================
    switch (behavior) {
      case 'idle': {
        isWalkingRef.current = false;
        stateTimerRef.current += dt;

        if (stateTimerRef.current > IDLE_TO_WANDER_DELAY) {
          const target = pickPlayTarget();
          if (target) {
            setLocalAvatarBehavior('wander');
            setPlayTarget(target.id);
            setLocalAvatarTarget(target.position);
          } else {
            setLocalAvatarBehavior('wander');
            setLocalAvatarTarget(randomRoomPos());
          }
          stateTimerRef.current = 0;
        }
        break;
      }

      case 'wander': {
        isWalkingRef.current = true;
        const target = localAvatar.targetPosition;
        if (!target) {
          setLocalAvatarBehavior('idle');
          break;
        }

        const d = dist2D(posRef.current, target);
        if (d < ARRIVE_THRESHOLD) {
          // Arrived - face the furniture
          if (localAvatar.playTargetId) {
            const playItem = furniture.find(f => f.id === localAvatar.playTargetId);
            if (playItem) {
              const faceAngle = angleTo(posRef.current, playItem.position);
              rotRef.current = faceAngle;
              setLocalAvatarRotation(rotRef.current);
            }
            setLocalAvatarBehavior('playing');
            playTimerRef.current = 0;
          } else {
            const nextTarget = pickPlayTarget();
            if (nextTarget) {
              setPlayTarget(nextTarget.id);
              setLocalAvatarTarget(nextTarget.position);
            } else {
              setLocalAvatarTarget(randomRoomPos());
            }
          }
          isWalkingRef.current = false;
        } else {
          // Walk toward target with collision avoidance
          const angle = angleTo(posRef.current, target);
          rotRef.current = lerpAngle(rotRef.current, angle, dt * 5);
          const step = WALK_SPEED * dt;
          let nextPos: [number, number, number] = [
            posRef.current[0] + Math.sin(angle) * step,
            0,
            posRef.current[2] + Math.cos(angle) * step,
          ];

          // Furniture collision avoidance
          nextPos = avoidFurniture(nextPos, furniture, localAvatar.playTargetId);

          // Wall clipping
          nextPos[0] = Math.max(-ROOM_HALF + 0.4, Math.min(ROOM_HALF - 0.4, nextPos[0]));
          nextPos[2] = Math.max(-ROOM_HALF + 0.4, Math.min(ROOM_HALF - 0.4, nextPos[2]));

          posRef.current = nextPos;
          setLocalAvatarPos([...posRef.current]);
          setLocalAvatarRotation(rotRef.current);
        }
        break;
      }

      case 'playing': {
        isWalkingRef.current = false;
        playTimerRef.current += dt;

        // Face the furniture
        const playItem = furniture.find(f => f.id === localAvatar.playTargetId);
        if (playItem) {
          const toFurniture = angleTo(posRef.current, playItem.position);
          rotRef.current = lerpAngle(rotRef.current, toFurniture, dt * 3);
          setLocalAvatarRotation(rotRef.current);
        }

        if (playTimerRef.current > PLAY_DURATION) {
          const next = pickPlayTarget();
          if (next) {
            setPlayTarget(next.id);
            setLocalAvatarTarget(next.position);
            setLocalAvatarBehavior('wander');
          } else {
            setLocalAvatarBehavior('idle');
            setPlayTarget(null);
          }
          playTimerRef.current = 0;
        }
        break;
      }

      case 'conversation': {
        isWalkingRef.current = false;

        const target = localAvatar.targetPosition;
        if (target) {
          const d = dist2D(posRef.current, target);
          if (d > ARRIVE_THRESHOLD) {
            isWalkingRef.current = true;
            const angle = angleTo(posRef.current, target);
            rotRef.current = lerpAngle(rotRef.current, angle, dt * 5);
            const step = WALK_SPEED * 1.5 * dt;
            let nextPos: [number, number, number] = [
              posRef.current[0] + Math.sin(angle) * step,
              0,
              posRef.current[2] + Math.cos(angle) * step,
            ];
            nextPos = avoidFurniture(nextPos, furniture, null);
            nextPos[0] = Math.max(-ROOM_HALF + 0.4, Math.min(ROOM_HALF - 0.4, nextPos[0]));
            nextPos[2] = Math.max(-ROOM_HALF + 0.4, Math.min(ROOM_HALF - 0.4, nextPos[2]));
            posRef.current = nextPos;
            setLocalAvatarPos([...posRef.current]);
            setLocalAvatarRotation(rotRef.current);
          } else {
            setLocalAvatarTarget(null);
          }
        } else {
          const lookAngle = angleTo(posRef.current, CONVERSATION_GATHER_POINT);
          rotRef.current = lerpAngle(rotRef.current, lookAngle, dt * 3);
          setLocalAvatarRotation(rotRef.current);
        }

        if (localSpeaking) {
          setFocusTarget([posRef.current[0], 0.7, posRef.current[2]]);
        }

        if (!anySpeaking) {
          silenceTimerRef.current += dt;
          if (silenceTimerRef.current > SILENCE_TO_IDLE_DELAY) {
            setLocalAvatarBehavior('idle');
            setCameraMode('overview');
            setFocusTarget(null);
            setPlayTarget(null);
            stateTimerRef.current = 0;
            silenceTimerRef.current = 0;
          }
        } else {
          silenceTimerRef.current = 0;
        }
        break;
      }
    }

    // ============================================================
    // 3. Apply group transform
    // ============================================================
    if (groupRef.current) {
      groupRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2]);
      groupRef.current.rotation.y = rotRef.current;
    }
  });

  return (
    <group ref={groupRef} position={localAvatar.position}>
      <VoxelAvatar
        config={avatarConfig}
        voiceVolume={localVol}
        isSpeaking={localSpeaking}
        isWalking={isWalkingRef.current}
      />
    </group>
  );
}
