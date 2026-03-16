/**
 * kokoro — Attention Director (IK-Enhanced)
 * アバターの視線・首・体の追従をSpring-DampedなIK制御で実現
 * 発話者への自然な首追従 + 眼球追従 + 体回転
 */

import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';

/** 追従状態 */
interface AttentionState {
  // Current smooth angles
  bodyYaw: number;
  headPitch: number;
  headYaw: number;
  eyePitch: number;
  eyeYaw: number;
  // Velocities for spring damping
  bodyYawVel: number;
  headPitchVel: number;
  headYawVel: number;
  eyePitchVel: number;
  eyeYawVel: number;
  // Idle animation offset
  idlePhase: number;
}

// Spring Constants
const BODY_SPRING = 1.5;
const BODY_DAMP = 2.8;
const HEAD_SPRING = 4.0;
const HEAD_DAMP = 3.5;
const EYE_SPRING = 8.0;
const EYE_DAMP = 4.0;

// Max rotation angles (radians)
const MAX_HEAD_YAW = 0.8;     // ±45°
const MAX_HEAD_PITCH = 0.35;  // ±20°
const MAX_EYE_YAW = 0.5;     // ±28°
const MAX_EYE_PITCH = 0.25;  // ±14°
const BODY_FOLLOW_THRESHOLD = 0.6; // Beyond this head yaw, body follows

/**
 * Spring-Damped Attention Director
 * VRMのLookAt + ボーン操作で自然な視線追従を実現
 */
export class AttentionDirector {
  private states: Map<string, AttentionState> = new Map();

  /**
   * アバターの注意方向を更新
   * @param avatarId Avatar ID
   * @param vrm VRM instance
   * @param avatarWorldPos Avatar world position
   * @param targetPos Target to look at (null = idle gaze)
   * @param delta Time delta
   * @param isSpeaking Whether this avatar is speaking
   */
  update(
    avatarId: string,
    vrm: VRM | null,
    avatarWorldPos: THREE.Vector3,
    targetPos: THREE.Vector3 | null,
    delta: number,
    isSpeaking: boolean
  ): void {
    if (!vrm) return;

    let state = this.states.get(avatarId);
    if (!state) {
      state = {
        bodyYaw: 0,
        headPitch: 0,
        headYaw: 0,
        eyePitch: 0,
        eyeYaw: 0,
        bodyYawVel: 0,
        headPitchVel: 0,
        headYawVel: 0,
        eyePitchVel: 0,
        eyeYawVel: 0,
        idlePhase: Math.random() * Math.PI * 2,
      };
      this.states.set(avatarId, state);
    }

    state.idlePhase += delta;
    const clampedDelta = Math.min(delta, 0.033);

    // Calculate target angles
    let targetHeadYaw = 0;
    let targetHeadPitch = 0;
    let targetEyeYaw = 0;
    let targetEyePitch = 0;
    let targetBodyYaw = 0;

    if (targetPos) {
      // Direction to target in avatar local space
      const dx = targetPos.x - avatarWorldPos.x;
      const dy = targetPos.y - avatarWorldPos.y - 1.4; // Head height offset
      const dz = targetPos.z - avatarWorldPos.z;

      const horizontalDist = Math.sqrt(dx * dx + dz * dz);
      const yaw = Math.atan2(dx, dz);
      const pitch = Math.atan2(dy, horizontalDist);

      // Eyes: fastest reaction, full range
      targetEyeYaw = THREE.MathUtils.clamp(yaw, -MAX_EYE_YAW, MAX_EYE_YAW);
      targetEyePitch = THREE.MathUtils.clamp(pitch, -MAX_EYE_PITCH, MAX_EYE_PITCH);

      // Head: follows with delay, limited range
      targetHeadYaw = THREE.MathUtils.clamp(yaw, -MAX_HEAD_YAW, MAX_HEAD_YAW);
      targetHeadPitch = THREE.MathUtils.clamp(pitch, -MAX_HEAD_PITCH, MAX_HEAD_PITCH);

      // Body: follows if head yaw exceeds threshold
      if (Math.abs(yaw) > BODY_FOLLOW_THRESHOLD) {
        targetBodyYaw = yaw * 0.3; // Partial body follow
      }
    } else {
      // Idle gaze: gentle wandering
      const t = state.idlePhase;
      targetHeadYaw = Math.sin(t * 0.2) * 0.15;
      targetHeadPitch = Math.sin(t * 0.15 + 1) * 0.08;
      targetEyeYaw = Math.sin(t * 0.3) * 0.1;
      targetEyePitch = Math.cos(t * 0.25 + 2) * 0.06;
    }

    // If speaking, add subtle head bobbing
    if (isSpeaking) {
      const t = state.idlePhase;
      targetHeadPitch += Math.sin(t * 4) * 0.02;
      targetHeadYaw += Math.sin(t * 2.5) * 0.015;
    }

    // Spring-Damped integration for each channel
    this.springUpdate(
      state,
      'bodyYaw',
      'bodyYawVel',
      targetBodyYaw,
      BODY_SPRING,
      BODY_DAMP,
      clampedDelta
    );
    this.springUpdate(
      state,
      'headYaw',
      'headYawVel',
      targetHeadYaw,
      HEAD_SPRING,
      HEAD_DAMP,
      clampedDelta
    );
    this.springUpdate(
      state,
      'headPitch',
      'headPitchVel',
      targetHeadPitch,
      HEAD_SPRING,
      HEAD_DAMP,
      clampedDelta
    );
    this.springUpdate(
      state,
      'eyeYaw',
      'eyeYawVel',
      targetEyeYaw,
      EYE_SPRING,
      EYE_DAMP,
      clampedDelta
    );
    this.springUpdate(
      state,
      'eyePitch',
      'eyePitchVel',
      targetEyePitch,
      EYE_SPRING,
      EYE_DAMP,
      clampedDelta
    );

    // Apply to VRM lookAt
    if (vrm.lookAt) {
      // Use the VRM's built-in lookAt with computed target
      const lookDistance = 10;
      const combinedYaw = state.headYaw + state.eyeYaw * 0.3;
      const combinedPitch = state.headPitch + state.eyePitch * 0.3;

      const lookTarget = new THREE.Object3D();
      lookTarget.position.set(
        avatarWorldPos.x + Math.sin(combinedYaw) * lookDistance,
        avatarWorldPos.y + 1.4 + Math.tan(combinedPitch) * lookDistance,
        avatarWorldPos.z + Math.cos(combinedYaw) * lookDistance
      );
      vrm.lookAt.target = lookTarget;
    }
  }

  /**
   * Spring-Damped integration
   * F = -k * (x - target) - d * velocity
   */
  private springUpdate(
    state: AttentionState,
    posKey: 'bodyYaw' | 'headPitch' | 'headYaw' | 'eyePitch' | 'eyeYaw',
    velKey: 'bodyYawVel' | 'headPitchVel' | 'headYawVel' | 'eyePitchVel' | 'eyeYawVel',
    target: number,
    k: number,
    d: number,
    dt: number
  ): void {
    const pos = state[posKey];
    const vel = state[velKey];

    const force = -k * (pos - target) - d * vel;
    const newVel = vel + force * dt;
    const newPos = pos + newVel * dt;

    state[posKey] = newPos;
    state[velKey] = newVel;
  }

  /**
   * クリーンアップ
   */
  removeAvatar(avatarId: string): void {
    this.states.delete(avatarId);
  }

  dispose(): void {
    this.states.clear();
  }
}
