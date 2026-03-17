/**
 * kokoro — Mood Lighting Engine
 * 会話の雰囲気に連動するリアルタイム照明制御
 * 
 * 反復141-145:
 * - 感情の変化に応じて空間全体の色温度が変わる
 * - 笑い → 暖色系（金/琥珀）
 * - 驚き → 冷色系（青/紫）
 * - 悲しみ → 深い藍色
 * - 怒り → 赤/オレンジ
 * - 中立 → ニュートラルな紫/藍
 * = 感情が空間の「色」を塗り替える
 */

import * as THREE from 'three';

export interface MoodColors {
  ambient: THREE.Color;
  spotlight: THREE.Color;
  fog: THREE.Color;
  intensity: number;
}

interface EmotionWeights {
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
}

const EMOTION_PALETTES: Record<string, { ambient: string; spotlight: string; fog: string }> = {
  joy:      { ambient: '#fbbf24', spotlight: '#f59e0b', fog: '#78350f' },
  anger:    { ambient: '#ef4444', spotlight: '#dc2626', fog: '#7f1d1d' },
  sorrow:   { ambient: '#3b82f6', spotlight: '#6366f1', fog: '#1e1b4b' },
  surprise: { ambient: '#a78bfa', spotlight: '#c084fc', fog: '#2e1065' },
  neutral:  { ambient: '#8b5cf6', spotlight: '#6d28d9', fog: '#0f0a1a' },
};

export class MoodLightingEngine {
  private currentMood: MoodColors;
  private targetMood: MoodColors;
  private transitionSpeed = 0.02; // Per frame blend factor

  constructor() {
    const neutral = EMOTION_PALETTES.neutral;
    this.currentMood = {
      ambient: new THREE.Color(neutral.ambient),
      spotlight: new THREE.Color(neutral.spotlight),
      fog: new THREE.Color(neutral.fog),
      intensity: 0.5,
    };
    this.targetMood = this.cloneMood(this.currentMood);
  }

  private cloneMood(m: MoodColors): MoodColors {
    return {
      ambient: m.ambient.clone(),
      spotlight: m.spotlight.clone(),
      fog: m.fog.clone(),
      intensity: m.intensity,
    };
  }

  /**
   * 感情の重みから目標照明を計算
   */
  setEmotion(weights: EmotionWeights): void {
    const total = weights.joy + weights.anger + weights.sorrow + weights.surprise + 0.001;

    // Weighted blend of palettes
    const blended = {
      ambient: new THREE.Color(0, 0, 0),
      spotlight: new THREE.Color(0, 0, 0),
      fog: new THREE.Color(0, 0, 0),
    };

    const emotionEntries: [string, number][] = [
      ['joy', weights.joy],
      ['anger', weights.anger],
      ['sorrow', weights.sorrow],
      ['surprise', weights.surprise],
    ];

    // Keep neutral as base
    const neutralWeight = Math.max(0, 1 - total);
    const neutralPalette = EMOTION_PALETTES.neutral;
    blended.ambient.add(new THREE.Color(neutralPalette.ambient).multiplyScalar(neutralWeight));
    blended.spotlight.add(new THREE.Color(neutralPalette.spotlight).multiplyScalar(neutralWeight));
    blended.fog.add(new THREE.Color(neutralPalette.fog).multiplyScalar(neutralWeight));

    for (const [emotion, w] of emotionEntries) {
      const palette = EMOTION_PALETTES[emotion];
      const normalizedW = w / total * (1 - neutralWeight);
      blended.ambient.add(new THREE.Color(palette.ambient).multiplyScalar(normalizedW));
      blended.spotlight.add(new THREE.Color(palette.spotlight).multiplyScalar(normalizedW));
      blended.fog.add(new THREE.Color(palette.fog).multiplyScalar(normalizedW));
    }

    this.targetMood.ambient.copy(blended.ambient);
    this.targetMood.spotlight.copy(blended.spotlight);
    this.targetMood.fog.copy(blended.fog);
    this.targetMood.intensity = 0.3 + total * 0.5; // More emotion = more intense
  }

  /**
   * フレーム更新: スムーズ遷移
   */
  update(): MoodColors {
    const t = this.transitionSpeed;
    this.currentMood.ambient.lerp(this.targetMood.ambient, t);
    this.currentMood.spotlight.lerp(this.targetMood.spotlight, t);
    this.currentMood.fog.lerp(this.targetMood.fog, t);
    this.currentMood.intensity += (this.targetMood.intensity - this.currentMood.intensity) * t;
    return this.currentMood;
  }

  /**
   * 現在のムードカラーを取得
   */
  getCurrent(): MoodColors {
    return this.currentMood;
  }

  /**
   * 遷移速度を設定（0-1、デフォルト0.02）
   */
  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = Math.max(0.001, Math.min(0.1, speed));
  }
}
