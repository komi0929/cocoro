/**
 * kokoro — Gravity Formation Engine (Spring Physics)
 * 
 * ばね物理演算（Spring-Damper System）による動的アバター配置
 * 静的Lerpを完全撤廃し、弾力のある有機的な動きを実現
 *
 * 数理モデル:
 *   F_spring = -k * (x - x_target)
 *   F_damping = -d * velocity
 *   F_repulsion = c / max(dist^2, epsilon)
 *   acceleration = (F_spring + F_damping + F_repulsion) / mass
 *   velocity += acceleration * dt
 *   position += velocity * dt
 */

import type { AvatarTransform, GravityParams, LightingState } from '@/types/kokoro';
import { SpacePhase } from '@/types/kokoro';

/** フォーメーション計算結果 */
export interface FormationResult {
  transforms: Map<string, AvatarTransform>;
  lighting: LightingState;
}

/** Per-avatar physics state */
interface AvatarPhysicsState {
  posX: number;
  posZ: number;
  velX: number;
  velZ: number;
  targetX: number;
  targetZ: number;
}

// Spring-Damper constants
const SPRING_K = 2.5;         // Spring stiffness
const DAMPING_D = 3.0;        // Damping coefficient (overdamped to prevent oscillation)
const REPULSION_C = 0.8;      // Repulsion constant (between avatars)
const MIN_DISTANCE = 1.2;     // Minimum inter-avatar distance
const ATTRACTION_HEAT = 1.5;  // Extra attraction when conversation heats up
const LEAN_IN_FACTOR = 0.35;  // How much speakers lean toward center
const DT = 0.016;             // Fixed timestep (~60fps)

// デフォルトパラメータ
const DEFAULT_PARAMS: GravityParams = {
  minDistance: 1.5,
  maxDistance: 6.0,
  attractionStrength: 0.08,
  circleRadius: 3.0,
  lerpSpeed: 0.04,
};

/**
 * Spring Physics 引力フォーメーション計算エンジン
 */
export class GravityFormation {
  private params: GravityParams;
  private physicsStates: Map<string, AvatarPhysicsState> = new Map();
  private time = 0;

  constructor(params: Partial<GravityParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * メインの空間配置計算 — Spring Physics
   */
  calculate(
    phase: SpacePhase,
    participantIds: string[],
    activeSpeakerIds: string[],
    currentTransforms: Map<string, AvatarTransform>,
    density: number
  ): FormationResult {
    this.time += DT;
    const targetTransforms = new Map<string, AvatarTransform>();

    // Initialize physics states for new participants
    for (const id of participantIds) {
      if (!this.physicsStates.has(id)) {
        const existing = currentTransforms.get(id);
        const px = existing?.position.x ?? 0;
        const pz = existing?.position.z ?? 0;
        this.physicsStates.set(id, {
          posX: px,
          posZ: pz,
          velX: 0,
          velZ: 0,
          targetX: px,
          targetZ: pz,
        });
      }
    }

    // Remove physics states for departed participants
    for (const id of this.physicsStates.keys()) {
      if (!participantIds.includes(id)) {
        this.physicsStates.delete(id);
      }
    }

    // Calculate target positions based on phase
    this.calculateTargetPositions(
      phase,
      participantIds,
      activeSpeakerIds,
      density
    );

    // Run spring physics simulation
    this.simulateSpringPhysics(participantIds, density);

    // Build output transforms
    for (const id of participantIds) {
      const physics = this.physicsStates.get(id)!;
      const existing = currentTransforms.get(id);
      const isSpeaker = activeSpeakerIds.includes(id);

      // Calculate look-at target
      let lookAtTarget: { x: number; y: number; z: number } | null = null;
      if (phase !== SpacePhase.SILENCE && activeSpeakerIds.length > 0) {
        if (isSpeaker) {
          // Speakers look at center or opposite speaker
          const oppositeIdx =
            (activeSpeakerIds.indexOf(id) + 1) % activeSpeakerIds.length;
          const oppositeId = activeSpeakerIds[oppositeIdx];
          const oppositePhys = this.physicsStates.get(oppositeId);
          if (oppositePhys && oppositeId !== id) {
            lookAtTarget = { x: oppositePhys.posX, y: 1.2, z: oppositePhys.posZ };
          } else {
            lookAtTarget = { x: 0, y: 1.2, z: 0 };
          }
        } else {
          // Listeners look at speaker centroid
          const centroid = this.calculateSpeakerCentroid(activeSpeakerIds);
          lookAtTarget = centroid;
        }
      }

      // Calculate rotation toward look target
      let rotY = existing?.rotation.y ?? 0;
      if (lookAtTarget) {
        const dx = lookAtTarget.x - physics.posX;
        const dz = lookAtTarget.z - physics.posZ;
        const targetAngle = Math.atan2(dx, dz);
        // Spring-based rotation (not lerp)
        let angleDiff = targetAngle - rotY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        rotY += angleDiff * 0.06; // Soft follow
      }

      targetTransforms.set(id, {
        position: { x: physics.posX, y: 0, z: physics.posZ },
        rotation: { x: 0, y: rotY, z: 0 },
        lookAtTarget,
      });
    }

    const lighting = this.calculateLighting(phase, density);
    return { transforms: targetTransforms, lighting };
  }

  /**
   * フェーズ別のターゲット位置を計算
   */
  private calculateTargetPositions(
    phase: SpacePhase,
    participantIds: string[],
    activeSpeakerIds: string[],
    density: number
  ): void {
    const count = participantIds.length;

    switch (phase) {
      case SpacePhase.SILENCE: {
        // Scattered — each avatar drifts to a personal zone
        participantIds.forEach((id, index) => {
          const physics = this.physicsStates.get(id)!;
          const hash = this.seededRandom(id);
          const angle =
            (index / count) * Math.PI * 2 + hash * 0.8;
          const radius =
            this.params.maxDistance * (0.6 + hash * 0.5);
          // Slow drifting targets
          const drift = Math.sin(this.time * 0.1 + hash * 10) * 0.3;
          physics.targetX = Math.cos(angle + drift * 0.1) * radius;
          physics.targetZ = Math.sin(angle + drift * 0.1) * radius;
        });
        break;
      }

      case SpacePhase.TRIGGER: {
        // Speaker pulled to center, listeners face speaker
        const speakerIds = new Set(activeSpeakerIds);
        participantIds.forEach((id, index) => {
          const physics = this.physicsStates.get(id)!;
          if (speakerIds.has(id)) {
            // Speaker: strong pull toward center
            physics.targetX = physics.posX * (1 - LEAN_IN_FACTOR);
            physics.targetZ = physics.posZ * (1 - LEAN_IN_FACTOR);
          } else {
            // Listeners: maintain position but orient
            const hash = this.seededRandom(id);
            const angle = (index / count) * Math.PI * 2 + hash * 0.5;
            const radius = this.params.circleRadius * 1.1;
            physics.targetX = Math.cos(angle) * radius;
            physics.targetZ = Math.sin(angle) * radius;
          }
        });
        break;
      }

      case SpacePhase.GRAVITY: {
        // Dynamic contraction based on density
        // Speakers on inner ring, listeners on outer ring
        const speakerIdsSet = new Set(activeSpeakerIds);
        const listeners = participantIds.filter(
          (id) => !speakerIdsSet.has(id)
        );

        // Inner ring contracts with density + heat
        const innerRadius =
          this.params.circleRadius * 0.35 * (1 - density * 0.5);
        // Outer ring also contracts
        const outerRadius =
          this.params.circleRadius * (1 - density * 0.55);

        // Speakers — inner circle with attraction force
        activeSpeakerIds.forEach((id, index) => {
          const physics = this.physicsStates.get(id)!;
          const angle =
            (index / Math.max(activeSpeakerIds.length, 2)) *
            Math.PI *
            2;
          physics.targetX = Math.cos(angle) * innerRadius;
          physics.targetZ = Math.sin(angle) * innerRadius;
        });

        // Listeners — outer circle, pulled inward by density
        listeners.forEach((id, index) => {
          const physics = this.physicsStates.get(id)!;
          const angle =
            (index / Math.max(listeners.length, 1)) * Math.PI * 2;
          physics.targetX = Math.cos(angle) * outerRadius;
          physics.targetZ = Math.sin(angle) * outerRadius;
        });
        break;
      }
    }
  }

  /**
   * Spring-Damper Physics simulation step
   * F = -k*(x - target) - d*v + repulsion
   */
  private simulateSpringPhysics(
    participantIds: string[],
    density: number
  ): void {
    const states = participantIds
      .map((id) => ({ id, state: this.physicsStates.get(id)! }))
      .filter((s) => s.state != null);

    // Dynamically increase spring stiffness during heated phases
    const dynamicK = SPRING_K + density * ATTRACTION_HEAT;

    for (const { id, state } of states) {
      // Spring force toward target
      const springFx = -dynamicK * (state.posX - state.targetX);
      const springFz = -dynamicK * (state.posZ - state.targetZ);

      // Damping force (viscous drag)
      const dampFx = -DAMPING_D * state.velX;
      const dampFz = -DAMPING_D * state.velZ;

      // Repulsion from other avatars (prevent overlap)
      let repFx = 0;
      let repFz = 0;
      for (const { id: otherId, state: other } of states) {
        if (otherId === id) continue;
        const dx = state.posX - other.posX;
        const dz = state.posZ - other.posZ;
        const distSq = dx * dx + dz * dz;
        const dist = Math.sqrt(distSq);
        if (dist < MIN_DISTANCE * 2) {
          const force =
            REPULSION_C /
            Math.max(distSq, MIN_DISTANCE * MIN_DISTANCE * 0.25);
          const nx = dist > 0.001 ? dx / dist : Math.random() - 0.5;
          const nz = dist > 0.001 ? dz / dist : Math.random() - 0.5;
          repFx += nx * force;
          repFz += nz * force;
        }
      }

      // Total acceleration
      const ax = springFx + dampFx + repFx;
      const az = springFz + dampFz + repFz;

      // Verlet-style integration
      state.velX += ax * DT;
      state.velZ += az * DT;
      state.posX += state.velX * DT;
      state.posZ += state.velZ * DT;

      // Clamp velocity to prevent explosion
      const maxVel = 5;
      const velMag = Math.sqrt(
        state.velX * state.velX + state.velZ * state.velZ
      );
      if (velMag > maxVel) {
        state.velX = (state.velX / velMag) * maxVel;
        state.velZ = (state.velZ / velMag) * maxVel;
      }

      // Boundary clamping (soft ceiling)
      const maxRange = 12;
      const rangeSq =
        state.posX * state.posX + state.posZ * state.posZ;
      if (rangeSq > maxRange * maxRange) {
        const rangeDist = Math.sqrt(rangeSq);
        state.posX = (state.posX / rangeDist) * maxRange;
        state.posZ = (state.posZ / rangeDist) * maxRange;
        state.velX *= -0.5;
        state.velZ *= -0.5;
      }
    }
  }

  /**
   * Speaker centroid calculation
   */
  private calculateSpeakerCentroid(
    speakerIds: string[]
  ): { x: number; y: number; z: number } {
    let cx = 0;
    let cz = 0;
    let count = 0;
    for (const id of speakerIds) {
      const s = this.physicsStates.get(id);
      if (s) {
        cx += s.posX;
        cz += s.posZ;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 1.2, z: 0 };
    return { x: cx / count, y: 1.2, z: cz / count };
  }

  /**
   * フェーズと密度に基づくライティング計算
   */
  private calculateLighting(
    phase: SpacePhase,
    density: number
  ): LightingState {
    switch (phase) {
      case SpacePhase.SILENCE:
        return {
          ambientIntensity: 0.2,
          spotlightIntensity: 0,
          bloomStrength: 0.3,
          colorTemperature: 3500,
        };
      case SpacePhase.TRIGGER:
        return {
          ambientIntensity: 0.35,
          spotlightIntensity: 0.6,
          bloomStrength: 0.5,
          colorTemperature: 4000,
        };
      case SpacePhase.GRAVITY:
        return {
          ambientIntensity: 0.25 + density * 0.3,
          spotlightIntensity: 0.5 + density * 0.8,
          bloomStrength: 0.4 + density * 0.6,
          colorTemperature: 4000 + density * 2500,
        };
    }
  }

  /** 文字列ベースのシード付き擬似乱数 (0-1) */
  private seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return (Math.abs(hash) % 10000) / 10000;
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    this.physicsStates.clear();
  }
}
