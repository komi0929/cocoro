/**
 * cocoro — Dynamic Room Theme Engine
 * 会話の雰囲気に応じてルームのビジュアルテーマが動的に変化
 *
 * 反復226-230:
 * - 感情フィールド → 背景色のシフト
 * - フロー状態 → パーティクル密度の増加
 * - テンション → コントラストの強化
 * - 温かさ → 暖色寄りのグラデーション
 * = 同じルームでも会話の内容で見た目が変わる
 */

export interface DynamicThemeState {
  backgroundColor: [number, number, number];
  fogColor: [number, number, number];
  fogDensity: number;
  particleDensity: number;
  bloomIntensity: number;
  vignetteIntensity: number;
  ambientIntensity: number;
  floorHue: number;
}

interface EmotionInput {
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  tension: number;
  warmth: number;
}

// Base palettes
const PALETTES: Record<string, { bg: [number, number, number]; fog: [number, number, number] }> = {
  neutral: { bg: [0.04, 0.02, 0.08], fog: [0.02, 0.01, 0.05] },
  warm:    { bg: [0.08, 0.04, 0.02], fog: [0.05, 0.02, 0.01] },
  cool:    { bg: [0.02, 0.04, 0.10], fog: [0.01, 0.02, 0.06] },
  intense: { bg: [0.10, 0.02, 0.04], fog: [0.06, 0.01, 0.02] },
  serene:  { bg: [0.02, 0.06, 0.08], fog: [0.01, 0.03, 0.05] },
};

export class DynamicRoomThemeEngine {
  private current: DynamicThemeState;
  private target: DynamicThemeState;

  constructor() {
    const init: DynamicThemeState = {
      backgroundColor: [...PALETTES.neutral.bg] as [number, number, number],
      fogColor: [...PALETTES.neutral.fog] as [number, number, number],
      fogDensity: 0.05,
      particleDensity: 0.5,
      bloomIntensity: 0.4,
      vignetteIntensity: 0.3,
      ambientIntensity: 0.4,
      floorHue: 270, // Purple base
    };
    this.current = { ...init };
    this.target = { ...init };
  }

  /**
   * 感情フィールドからテーマターゲットを計算
   */
  setEmotionField(field: EmotionInput, flowScore: number): void {
    const { joy, anger, sorrow, surprise, tension, warmth } = field;

    // Select base palette by dominant emotion
    const dominant = Math.max(joy, anger, sorrow, surprise);
    let palette = PALETTES.neutral;
    if (joy === dominant && joy > 0.2) palette = PALETTES.warm;
    else if (anger === dominant && anger > 0.2) palette = PALETTES.intense;
    else if (sorrow === dominant && sorrow > 0.2) palette = PALETTES.cool;
    else if (surprise === dominant && surprise > 0.2) palette = PALETTES.serene;

    // Blend with warmth
    const w = warmth * 0.3;
    this.target.backgroundColor = [
      palette.bg[0] + w * 0.05,
      palette.bg[1] + w * 0.02,
      palette.bg[2] - w * 0.02,
    ];
    this.target.fogColor = [
      palette.fog[0] + w * 0.03,
      palette.fog[1] + w * 0.01,
      palette.fog[2] - w * 0.01,
    ];

    // Fog density: more tension = thicker fog
    this.target.fogDensity = 0.03 + tension * 0.05;

    // Particle density: higher in flow states
    this.target.particleDensity = 0.3 + flowScore * 0.7;

    // Bloom: more emotional = more bloom
    this.target.bloomIntensity = 0.3 + (joy + surprise) * 0.3;

    // Vignette: tension increases vignette
    this.target.vignetteIntensity = 0.2 + tension * 0.4;

    // Ambient: warmer = brighter
    this.target.ambientIntensity = 0.3 + warmth * 0.4;

    // Floor hue: shift based on emotion
    this.target.floorHue = 270 + joy * 30 - sorrow * 40 + anger * 20 - surprise * 10;
  }

  /**
   * フレーム更新: スムーズ遷移
   */
  update(): DynamicThemeState {
    const lerpRate = 0.015;

    for (let i = 0; i < 3; i++) {
      this.current.backgroundColor[i] += (this.target.backgroundColor[i] - this.current.backgroundColor[i]) * lerpRate;
      this.current.fogColor[i] += (this.target.fogColor[i] - this.current.fogColor[i]) * lerpRate;
    }
    this.current.fogDensity += (this.target.fogDensity - this.current.fogDensity) * lerpRate;
    this.current.particleDensity += (this.target.particleDensity - this.current.particleDensity) * lerpRate;
    this.current.bloomIntensity += (this.target.bloomIntensity - this.current.bloomIntensity) * lerpRate;
    this.current.vignetteIntensity += (this.target.vignetteIntensity - this.current.vignetteIntensity) * lerpRate;
    this.current.ambientIntensity += (this.target.ambientIntensity - this.current.ambientIntensity) * lerpRate;
    this.current.floorHue += (this.target.floorHue - this.current.floorHue) * lerpRate;

    return { ...this.current };
  }

  getCurrent(): DynamicThemeState { return { ...this.current }; }
}
