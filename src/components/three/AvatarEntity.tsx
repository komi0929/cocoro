/**
 * kokoro — VRM Avatar Entity Component
 * 生命感のあるVRMアバター：呼吸・揺れ・瞬き・リップシンク・IK視線追従
 * T-Poseを排除し、ロード直後から生きた動きを実現
 * 
 * P0修正: AttentionDirector統合 — アバターが話者を見る
 */
'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import type { Participant, SpeakingState, EmotionState } from '@/types/kokoro';
import { getAvatarById } from '@/data/avatarCatalog';
import { AuraSystem } from './AuraSystem';
import { EmotionParticles } from './EmotionParticles';
import { useSpatialMemoryAvatar } from '@/hooks/useSpatialMemory';
import { useKokoroStore } from '@/store/useKokoroStore';
import { AttentionDirector } from '@/engine/choreography/AttentionDirector';

interface AvatarEntityProps {
  participant: Participant;
  isLocal?: boolean;
}

// Default VRM URL (Three VRM sample)
const DEFAULT_VRM_URL =
  'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

/**
 * Safe VRM loader with MToon fallback for three@0.183 compatibility
 */
async function loadVRMSafe(
  url: string,
  loader: GLTFLoader
): Promise<VRM | null> {
  try {
    const gltf = await loader.loadAsync(url);
    const loadedVrm = gltf.userData.vrm as VRM | undefined;

    if (!loadedVrm) {
      console.warn('[AvatarEntity] No VRM data found in GLTF');
      return null;
    }

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    loadedVrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.frustumCulled = false;
      }
    });

    return loadedVrm;
  } catch (err) {
    console.warn(
      '[AvatarEntity] VRM load failed, retrying without MToon:',
      err
    );
    try {
      const fallbackLoader = new GLTFLoader();
      fallbackLoader.register((parser) => {
        return new VRMLoaderPlugin(parser, {
          mtoonMaterialPlugin: false as unknown as undefined,
        });
      });

      const gltf = await fallbackLoader.loadAsync(url);
      const loadedVrm = gltf.userData.vrm as VRM | undefined;

      if (loadedVrm) {
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        loadedVrm.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.frustumCulled = false;
          }
        });
        return loadedVrm;
      }
    } catch (fallbackErr) {
      console.error('[AvatarEntity] VRM fallback also failed:', fallbackErr);
    }
    return null;
  }
}

/** Hash a string to a 0-1 value */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

// Shared AttentionDirector instance for all avatars
const attentionDirector = new AttentionDirector();

export function AvatarEntity({
  participant,
}: AvatarEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loading, setLoading] = useState(true);
  const speechAccRef = useRef(0); // frame-level speech accumulator

  // Store access for speaker centroid calculation
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const participants = useKokoroStore((s) => s.participants);

  // Load saved evolution data from IndexedDB
  const { avatarEvolution } = useSpatialMemoryAvatar(
    participant.avatarId ?? 'seed-san'
  );
  const savedSpeechSeconds = avatarEvolution?.totalSpeechSeconds ?? 0;
  const savedSignatureColor = avatarEvolution?.voiceSignatureHex ?? undefined;

  // Unique hash for per-avatar variation
  const avatarHash = useMemo(() => hashString(participant.id), [participant.id]);

  // Blendshape smooth weights
  const blendWeights = useRef<Record<string, number>>({
    aa: 0, ih: 0, ou: 0, ee: 0, oh: 0,
    happy: 0, angry: 0, sad: 0, surprised: 0, neutral: 0,
    blink: 0,
  });

  // Blink timer
  const nextBlinkTime = useRef(2 + Math.random() * 3);
  const blinkPhase = useRef<'idle' | 'closing' | 'opening'>('idle');
  const blinkTimer = useRef(0);

  // Idle animation state
  const idleState = useRef({
    spineRotX: 0,
    spineRotZ: 0,
    headRotX: 0,
    headRotY: 0,
  });

  // Entrance animation: spring scale 0→1
  const entranceProgress = useRef(0);
  const hasEnteredRef = useRef(false);

  // Speaker glow ring
  const glowRingRef = useRef<THREE.Mesh>(null);
  const glowIntensity = useRef(0);

  // VRM Loader
  const loader = useMemo(() => {
    const l = new GLTFLoader();
    l.register((parser) => new VRMLoaderPlugin(parser));
    return l;
  }, []);

  // Load VRM
  useEffect(() => {
    // Resolve VRM URL: participant.vrmUrl > catalog avatarId > default
    let url = participant.vrmUrl;
    if (!url && participant.avatarId) {
      const avatarDef = getAvatarById(participant.avatarId);
      url = avatarDef?.vrmUrl ?? DEFAULT_VRM_URL;
    }
    if (!url) url = DEFAULT_VRM_URL;
    setLoading(true);
    let cancelled = false;

    loadVRMSafe(url, loader).then((loadedVrm) => {
      if (cancelled) return;
      if (loadedVrm) setVrm(loadedVrm);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant.vrmUrl]);

  // Attach VRM scene to group
  useEffect(() => {
    if (!vrm || !groupRef.current) return;
    groupRef.current.clear();
    groupRef.current.add(vrm.scene);
  }, [vrm]);

  // Cleanup attention state on unmount
  useEffect(() => {
    return () => {
      attentionDirector.removeAvatar(participant.id);
    };
  }, [participant.id]);

  // Main animation loop
  useFrame((_, delta) => {
    if (!vrm) return;

    const time = performance.now() / 1000;
    const clampedDelta = Math.min(delta, 0.05); // Cap delta

    // Update VRM internal
    vrm.update(clampedDelta);

    // === ENTRANCE ANIMATION: spring scale 0→1 ===
    if (!hasEnteredRef.current) {
      entranceProgress.current += (1 - entranceProgress.current) * 0.06; // Spring ease-out
      if (entranceProgress.current > 0.99) {
        entranceProgress.current = 1;
        hasEnteredRef.current = true;
      }
      const s = entranceProgress.current;
      // Overshoot spring: goes to 1.05 then settles
      const springScale = s + Math.sin(s * Math.PI) * 0.05;
      vrm.scene.scale.setScalar(springScale);
      // Rise from below ground
      vrm.scene.position.y = (1 - s) * -0.5;
    }

    // === SPEAKER GLOW RING ===
    if (glowRingRef.current) {
      const targetGlow = participant.speakingState.isSpeaking ? 0.6 + participant.speakingState.volume * 0.4 : 0;
      glowIntensity.current += (targetGlow - glowIntensity.current) * 0.08;
      const mat = glowRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = glowIntensity.current * 0.6;
      const pulseScale = 1 + glowIntensity.current * 0.15 + Math.sin(time * 4) * glowIntensity.current * 0.05;
      glowRingRef.current.scale.set(pulseScale, 1, pulseScale);
    }

    // === BREATHING & IDLE SWAY ===
    applyIdleAnimation(vrm, time, avatarHash, participant.speakingState.isSpeaking, idleState.current);

    // === BLINK ===
    applyBlink(vrm, time, clampedDelta, blendWeights.current, nextBlinkTime, blinkPhase, blinkTimer);

    // === LIP SYNC ===
    applyLipSync(vrm, participant.speakingState, blendWeights.current, clampedDelta);

    // === EMOTION ===
    applyEmotion(vrm, participant.emotion, blendWeights.current, clampedDelta);

    // === ATTENTION DIRECTOR (P0: アバターが話者を見る) ===
    {
      const avatarWorldPos = new THREE.Vector3(
        participant.transform.position.x,
        0,
        participant.transform.position.z
      );

      // Calculate attention target: speaker centroid
      let targetPos: THREE.Vector3 | null = null;
      const isSpeaking = participant.speakingState.isSpeaking;

      if (!isSpeaking && activeSpeakers.length > 0) {
        // Listener: look at the centroid of all active speakers
        let cx = 0, cy = 0, cz = 0, count = 0;
        for (const spId of activeSpeakers) {
          if (spId === participant.id) continue;
          const sp = participants.get(spId);
          if (sp) {
            cx += sp.transform.position.x;
            cy += 1.3; // Head height
            cz += sp.transform.position.z;
            count++;
          }
        }
        if (count > 0) {
          targetPos = new THREE.Vector3(cx / count, cy / count, cz / count);
        }
      } else if (isSpeaking && activeSpeakers.length > 1) {
        // Speaker: look at the other speaker(s)
        let cx = 0, cy = 0, cz = 0, count = 0;
        for (const spId of activeSpeakers) {
          if (spId === participant.id) continue;
          const sp = participants.get(spId);
          if (sp) {
            cx += sp.transform.position.x;
            cy += 1.3;
            cz += sp.transform.position.z;
            count++;
          }
        }
        if (count > 0) {
          targetPos = new THREE.Vector3(cx / count, cy / count, cz / count);
        }
      }

      attentionDirector.update(
        participant.id,
        vrm,
        avatarWorldPos,
        targetPos,
        clampedDelta,
        isSpeaking
      );
    }

    // === SPEECH TIME ACCUMULATOR ===
    if (participant.speakingState.isSpeaking) {
      speechAccRef.current += clampedDelta;
    }

    // === POSITION & ROTATION (LERP) ===
    if (groupRef.current) {
      const pos = participant.transform.position;
      const breathOffset = Math.sin(time * 1.5 + avatarHash * Math.PI * 2) * 0.008;

      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        pos.x,
        0.05
      );
      groupRef.current.position.y = pos.y + breathOffset;
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        pos.z,
        0.05
      );

      const rot = participant.transform.rotation;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        rot.y,
        0.03
      );
    }

    // === LOOKAT (now handled by AttentionDirector, fallback only) ===
    // AttentionDirector handles VRM.lookAt internally
  });

  // Loading indicator (pulsing ethereal glow)
  if (loading) {
    return (
      <group
        ref={groupRef}
        position={[
          participant.transform.position.x,
          0,
          participant.transform.position.z,
        ]}
      >
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.8}
            transparent
            opacity={0.4}
          />
        </mesh>
        {/* Outer glow ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.4, 0.8, 32]} />
          <meshBasicMaterial
            color="#c4b5fd"
            transparent
            opacity={0.15}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[
        participant.transform.position.x,
        0,
        participant.transform.position.z,
      ]}
    >
      {/* Speaking indicator (animated glow ring) */}
      {participant.speakingState.isSpeaking && (
        <mesh
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.3 + participant.speakingState.volume * 0.5}
          />
        </mesh>
      )}

      {/* Aura System (進化オーラ — IndexedDBから累積発話量を読み込み + 感情知能EQ) */}
      <AuraSystem
        speechSeconds={savedSpeechSeconds + speechAccRef.current}
        isSpeaking={participant.speakingState.isSpeaking}
        accentColor={savedSignatureColor}
        emotion={participant.emotion}
      />

      {/* Emotion Particles (感情パーティクル放出) */}
      <EmotionParticles
        joy={participant.emotion.joy}
        surprise={participant.emotion.surprise}
        isSpeaking={participant.speakingState.isSpeaking}
        volume={participant.speakingState.volume}
      />
    </group>
  );
}

// ============================================================
// Idle Animation (Breathing, Sway, Shoulder micro-motion)
// ============================================================

function applyIdleAnimation(
  vrm: VRM,
  time: number,
  hash: number,
  isSpeaking: boolean,
  state: {
    spineRotX: number;
    spineRotZ: number;
    headRotX: number;
    headRotY: number;
  }
): void {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;

  // Breathing: spine subtle up/down rotation
  const breathCycle = time * 1.3 + hash * Math.PI * 2;
  const breathIntensity = isSpeaking ? 0.025 : 0.012;
  const targetSpineX = Math.sin(breathCycle) * breathIntensity;

  // Weight shifting (重心移動): slow left-right weight transfer
  const weightCycle = time * 0.15 + hash * 7;
  const weightShift = Math.sin(weightCycle) * (isSpeaking ? 0.012 : 0.018);
  const targetSpineZ = weightShift;

  // Smooth interpolation
  state.spineRotX += (targetSpineX - state.spineRotX) * 0.08;
  state.spineRotZ += (targetSpineZ - state.spineRotZ) * 0.04;

  // Apply to Spine bone
  const spine = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Spine);
  if (spine) {
    spine.rotation.x = state.spineRotX;
    spine.rotation.z = state.spineRotZ;
  }

  // Hips (weight shift visible)
  const hips = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips);
  if (hips) {
    hips.rotation.z = weightShift * 0.5;
    hips.rotation.y = Math.sin(weightCycle * 0.7) * 0.01;
  }

  // Chest (breathing + speaking forward lean)
  const chest = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);
  if (chest) {
    const chestBreath = Math.sin(breathCycle * 0.8) * breathIntensity * 0.5;
    const speakLean = isSpeaking ? 0.04 : 0;
    chest.rotation.x = chestBreath + speakLean;
  }

  // Head idle micro-movement (AttentionDirector adds on top of this)
  const head = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
  if (head) {
    const headNodCycle = time * 0.25 + hash * 3;
    const nodBase = isSpeaking ? 0.025 : 0.015;
    const targetHeadX = Math.sin(headNodCycle) * nodBase;
    const speakNod = isSpeaking ? Math.sin(time * 2.5) * 0.015 : 0;
    const targetHeadY = Math.cos(headNodCycle * 0.7) * 0.02;

    state.headRotX += (targetHeadX + speakNod - state.headRotX) * 0.06;
    state.headRotY += (targetHeadY - state.headRotY) * 0.04;

    head.rotation.x += state.headRotX;
    head.rotation.y += state.headRotY;
  }

  // Shoulder micro-motion
  const leftShoulder = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftShoulder);
  const rightShoulder = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightShoulder);
  const shoulderBreath = Math.sin(breathCycle + 0.5) * (isSpeaking ? 0.01 : 0.005);
  if (leftShoulder) {
    leftShoulder.rotation.z = shoulderBreath;
  }
  if (rightShoulder) {
    rightShoulder.rotation.z = -shoulderBreath;
  }

  // If speaking: lean forward slightly
  if (isSpeaking && spine) {
    spine.rotation.x += 0.025;
  }

  // Arms: break T-Pose by rotating upper arms down  
  const leftUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
  const rightUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
  if (leftUpperArm) {
    leftUpperArm.rotation.z = 0.5 + Math.sin(time * 0.3 + hash) * 0.03;
  }
  if (rightUpperArm) {
    rightUpperArm.rotation.z = -0.5 - Math.sin(time * 0.3 + hash + 1) * 0.03;
  }

  // Lower arms: slight bend
  const leftLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
  const rightLowerArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);
  if (leftLowerArm) {
    const gesture = isSpeaking ? Math.sin(time * 1.8 + hash) * 0.06 : 0;
    leftLowerArm.rotation.z = 0.15 + Math.sin(time * 0.4 + hash * 2) * 0.02 + gesture;
    leftLowerArm.rotation.x = isSpeaking ? Math.sin(time * 2.2) * 0.04 : 0;
  }
  if (rightLowerArm) {
    const gesture = isSpeaking ? Math.sin(time * 1.8 + hash + 2) * 0.06 : 0;
    rightLowerArm.rotation.z = -0.15 - Math.sin(time * 0.4 + hash * 2 + 0.5) * 0.02 - gesture;
    rightLowerArm.rotation.x = isSpeaking ? Math.sin(time * 2.0 + 1) * 0.04 : 0;
  }
}

// ============================================================
// Blink Animation
// ============================================================

function applyBlink(
  vrm: VRM,
  time: number,
  delta: number,
  weights: Record<string, number>,
  nextBlinkRef: React.MutableRefObject<number>,
  phaseRef: React.MutableRefObject<'idle' | 'closing' | 'opening'>,
  timerRef: React.MutableRefObject<number>
): void {
  if (!vrm.expressionManager) return;

  const BLINK_CLOSE_SPEED = 15;
  const BLINK_OPEN_SPEED = 8;

  if (phaseRef.current === 'idle') {
    if (time >= nextBlinkRef.current) {
      phaseRef.current = 'closing';
      timerRef.current = 0;
    }
    return;
  }

  timerRef.current += delta;

  if (phaseRef.current === 'closing') {
    weights.blink = THREE.MathUtils.lerp(
      weights.blink ?? 0,
      1,
      BLINK_CLOSE_SPEED * delta
    );
    if (weights.blink > 0.95) {
      phaseRef.current = 'opening';
    }
  } else if (phaseRef.current === 'opening') {
    weights.blink = THREE.MathUtils.lerp(
      weights.blink ?? 0,
      0,
      BLINK_OPEN_SPEED * delta
    );
    if (weights.blink < 0.05) {
      weights.blink = 0;
      phaseRef.current = 'idle';
      nextBlinkRef.current = time + 2 + Math.random() * 4;
    }
  }

  try {
    vrm.expressionManager.setValue('blink', weights.blink);
  } catch {
    // Expression not available
  }
}

// ============================================================
// Lip Sync (Spring-damped interpolation)
// ============================================================

function applyLipSync(
  vrm: VRM,
  speaking: SpeakingState,
  weights: Record<string, number>,
  delta: number
): void {
  if (!vrm.expressionManager) return;

  // Spring-damped interpolation speed
  const springSpeed = 15 * delta;
  const damping = 0.85;

  const visemeKeys = ['aa', 'ih', 'ou', 'ee', 'oh'] as const;
  const targets: Record<string, number> = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  if (speaking.isSpeaking && speaking.currentViseme !== 'sil') {
    const key = speaking.currentViseme;
    if (key in targets) {
      targets[key] = speaking.visemeWeight;
    }
  }

  for (const key of visemeKeys) {
    const current = weights[key] ?? 0;
    const target = targets[key];
    const diff = target - current;
    weights[key] = current + diff * springSpeed * damping;

    try {
      vrm.expressionManager.setValue(key, weights[key]);
    } catch {
      // Expression not available
    }
  }
}

// ============================================================
// Emotion Application
// ============================================================

function applyEmotion(
  vrm: VRM,
  emotion: EmotionState,
  weights: Record<string, number>,
  delta: number
): void {
  if (!vrm.expressionManager) return;

  const lerpSpeed = 4 * delta;

  const emotionMap: [string, number][] = [
    ['happy', emotion.joy],
    ['angry', emotion.anger],
    ['sad', emotion.sorrow],
    ['surprised', emotion.surprise],
    ['neutral', emotion.neutral],
  ];

  for (const [name, target] of emotionMap) {
    weights[name] = THREE.MathUtils.lerp(weights[name] ?? 0, target, lerpSpeed);
    try {
      vrm.expressionManager.setValue(name, weights[name]);
    } catch {
      // Expression not available
    }
  }
}
