/**
 * cocoro — LOD Manager
 * Three.js Level of Detail — 距離ベースの品質調整
 *
 * サイクル2: スマホの3Dパフォーマンス対策
 * - 近いアバター: フルディテール(VRM)
 * - 中距離: 簡略化メッシュ
 * - 遠い: ビルボード(2Dスプライト)
 * - 画面外: 非表示
 * = バッテリー消費を50-70%削減
 */

import * as THREE from 'three';

export type LodLevel = 'full' | 'medium' | 'low' | 'billboard' | 'hidden';

export interface LodConfig {
  fullDistance: number;       // 0-3m: フルVRM
  mediumDistance: number;     // 3-8m: 簡略化
  lowDistance: number;        // 8-15m: 最小限
  billboardDistance: number;  // 15-25m: 2D
  hideDistance: number;       // 25m+: 非表示
}

export interface LodState {
  entityId: string;
  level: LodLevel;
  distance: number;
  isVisible: boolean;
}

export class LodManager {
  private config: LodConfig;
  private states: Map<string, LodState> = new Map();
  private cameraPosition = new THREE.Vector3();

  constructor(config?: Partial<LodConfig>) {
    this.config = {
      fullDistance: 3,
      mediumDistance: 8,
      lowDistance: 15,
      billboardDistance: 25,
      hideDistance: 40,
      ...config,
    };
  }

  /**
   * カメラ位置を更新
   */
  updateCamera(position: THREE.Vector3): void {
    this.cameraPosition.copy(position);
  }

  /**
   * エンティティのLODレベルを計算
   */
  computeLevel(entityId: string, entityPosition: THREE.Vector3): LodState {
    const distance = this.cameraPosition.distanceTo(entityPosition);

    let level: LodLevel;
    if (distance > this.config.hideDistance) {
      level = 'hidden';
    } else if (distance > this.config.billboardDistance) {
      level = 'billboard';
    } else if (distance > this.config.lowDistance) {
      level = 'low';
    } else if (distance > this.config.mediumDistance) {
      level = 'medium';
    } else {
      level = 'full';
    }

    const state: LodState = {
      entityId, level, distance,
      isVisible: level !== 'hidden',
    };

    this.states.set(entityId, state);
    return state;
  }

  /**
   * LODレベルに応じた推奨アクション
   */
  static getRecommendation(level: LodLevel): {
    renderSkeleton: boolean;
    renderBlendShapes: boolean;
    animationQuality: 'full' | 'simple' | 'none';
    shadowCast: boolean;
    particleEffects: boolean;
  } {
    switch (level) {
      case 'full':
        return { renderSkeleton: true, renderBlendShapes: true, animationQuality: 'full', shadowCast: true, particleEffects: true };
      case 'medium':
        return { renderSkeleton: true, renderBlendShapes: true, animationQuality: 'simple', shadowCast: false, particleEffects: true };
      case 'low':
        return { renderSkeleton: true, renderBlendShapes: false, animationQuality: 'simple', shadowCast: false, particleEffects: false };
      case 'billboard':
        return { renderSkeleton: false, renderBlendShapes: false, animationQuality: 'none', shadowCast: false, particleEffects: false };
      case 'hidden':
        return { renderSkeleton: false, renderBlendShapes: false, animationQuality: 'none', shadowCast: false, particleEffects: false };
    }
  }

  getState(entityId: string): LodState | undefined { return this.states.get(entityId); }
  getAllStates(): LodState[] { return Array.from(this.states.values()); }

  /**
   * 省電力モード: 全距離を半分に(より早くLODが下がる)
   */
  enablePowerSave(): void {
    this.config.fullDistance = 1.5;
    this.config.mediumDistance = 4;
    this.config.lowDistance = 8;
    this.config.billboardDistance = 12;
    this.config.hideDistance = 20;
  }

  disablePowerSave(): void {
    this.config.fullDistance = 3;
    this.config.mediumDistance = 8;
    this.config.lowDistance = 15;
    this.config.billboardDistance = 25;
    this.config.hideDistance = 40;
  }
}
