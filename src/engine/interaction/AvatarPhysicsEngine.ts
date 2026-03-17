/**
 * cocoro — Avatar Physics Engine
 * アバターの物理シミュレーション
 *
 * 反復221-225:
 * - アイドルアニメーション（呼吸・体の揺れ・頭の傾き）
 * - 話者への注目（頭が自動で話者方向を向く）
 * - 声量に応じた体の前傾
 * - リアクション時のジェスチャー（うなずき・手振り）
 * = アバターが「生きている」感覚
 */

import * as THREE from 'three';

export interface AvatarPhysicsState {
  bodySwayX: number;
  bodySwayZ: number;
  breathScale: number;
  headRotationY: number;     // 話者方向への回転
  headTiltX: number;         // うなずき
  leanForward: number;       // 前傾
  gestureProgress: number;   // ジェスチャーの進行度 0-1
  gestureType: 'none' | 'nod' | 'wave' | 'lean';
}

export class AvatarPhysicsEngine {
  private state: AvatarPhysicsState;
  private gestureEndTime = 0;
  private targetHeadY = 0;

  constructor() {
    this.state = {
      bodySwayX: 0, bodySwayZ: 0,
      breathScale: 1,
      headRotationY: 0, headTiltX: 0,
      leanForward: 0,
      gestureProgress: 0, gestureType: 'none',
    };
  }

  /**
   * フレーム更新
   */
  update(params: {
    deltaTime: number;
    elapsedTime: number;
    isSpeaking: boolean;
    volume: number;
    // 最も近いアクティブスピーカーの方向ベクトル
    speakerDirection?: { x: number; z: number } | null;
    isListening: boolean;
  }): AvatarPhysicsState {
    const { deltaTime: dt, elapsedTime: t, isSpeaking, volume, speakerDirection, isListening } = params;

    // === 呼吸 ===
    this.state.breathScale = 1 + Math.sin(t * 1.2) * 0.008;

    // === 体の揺れ（アイドル） ===
    const swayIntensity = isSpeaking ? 0.015 : 0.008;
    this.state.bodySwayX = Math.sin(t * 0.7) * swayIntensity;
    this.state.bodySwayZ = Math.cos(t * 0.9) * swayIntensity * 0.5;

    // === 話者方向への注目 ===
    if (speakerDirection && !isSpeaking) {
      this.targetHeadY = Math.atan2(speakerDirection.x, speakerDirection.z);
    } else if (isSpeaking) {
      // 話している間は正面を向く
      this.targetHeadY = 0;
    }
    this.state.headRotationY += (this.targetHeadY - this.state.headRotationY) * Math.min(1, 3 * dt);

    // === 聞いている時のうなずき ===
    if (isListening && !isSpeaking) {
      // ゆっくりした自然なうなずき
      this.state.headTiltX = Math.sin(t * 1.5) * 0.04 + Math.sin(t * 0.4) * 0.02;
    } else {
      this.state.headTiltX *= 0.95;
    }

    // === 声量に応じた前傾 ===
    const targetLean = isSpeaking ? volume * 0.05 : 0;
    this.state.leanForward += (targetLean - this.state.leanForward) * Math.min(1, 5 * dt);

    // === ジェスチャー ===
    const now = Date.now();
    if (now < this.gestureEndTime) {
      const totalDuration = this.state.gestureType === 'nod' ? 400 : 600;
      const elapsed = totalDuration - (this.gestureEndTime - now);
      this.state.gestureProgress = Math.min(1, elapsed / totalDuration);
    } else {
      this.state.gestureProgress = 0;
      this.state.gestureType = 'none';
    }

    return { ...this.state };
  }

  /**
   * ジェスチャーを発動
   */
  triggerGesture(type: 'nod' | 'wave' | 'lean'): void {
    this.state.gestureType = type;
    const duration = type === 'nod' ? 400 : 600;
    this.gestureEndTime = Date.now() + duration;
    this.state.gestureProgress = 0;
  }

  /**
   * 物理状態をThree.jsのオブジェクトに適用
   */
  applyToObject(obj: THREE.Object3D): void {
    const s = this.state;

    // Body sway
    obj.position.x += s.bodySwayX;
    obj.position.z += s.bodySwayZ;

    // Breath
    obj.scale.setScalar(s.breathScale);

    // Lean
    obj.rotation.x = s.leanForward;

    // Head (if child named 'head' exists)
    const head = obj.getObjectByName('head');
    if (head) {
      head.rotation.y = s.headRotationY;
      head.rotation.x = s.headTiltX;

      // Gesture
      if (s.gestureType === 'nod' && s.gestureProgress > 0) {
        head.rotation.x += Math.sin(s.gestureProgress * Math.PI * 2) * 0.15;
      }
    }
  }
}
