/**
 * kokoro — Presence Aura  
 * アバターの存在感を声の状態で自動演出
 *
 * - 話している人: 光のリングが脈動
 * - 盛り上がっている: パーティクルが舞う
 * - リスニング中: 穏やかな波紋
 * - 無言: 静かに佇むオーラ
 * = VRChatの「表情読み取り」をカメラなしで実現
 */

export type PresenceState = 'speaking' | 'listening' | 'reacting' | 'idle' | 'whisper' | 'spotlight';

export interface AuraConfig {
  baseColor: string;        // VoiceIdentityから取得
  intensity: number;        // 0-1
  pulseSpeed: number;       // 0.5-3.0
  particleCount: number;    // 0-20
  ringOpacity: number;      // 0-0.8
  size: number;             // 0.5-2.0
}

const STATE_CONFIGS: Record<PresenceState, Partial<AuraConfig>> = {
  speaking:   { intensity: 0.8, pulseSpeed: 1.5, particleCount: 5, ringOpacity: 0.6, size: 1.3 },
  listening:  { intensity: 0.3, pulseSpeed: 0.5, particleCount: 0, ringOpacity: 0.15, size: 1.0 },
  reacting:   { intensity: 1.0, pulseSpeed: 2.5, particleCount: 15, ringOpacity: 0.7, size: 1.5 },
  idle:       { intensity: 0.1, pulseSpeed: 0.3, particleCount: 0, ringOpacity: 0.05, size: 0.8 },
  whisper:    { intensity: 0.4, pulseSpeed: 0.8, particleCount: 2, ringOpacity: 0.25, size: 0.9 },
  spotlight:  { intensity: 1.0, pulseSpeed: 2.0, particleCount: 20, ringOpacity: 0.8, size: 2.0 },
};

export class PresenceAuraSystem {
  private currentState: PresenceState = 'idle';
  private config: AuraConfig;
  private targetConfig: AuraConfig;
  private readonly smoothFactor = 0.08;

  constructor(baseColor: string = 'hsl(270, 50%, 60%)') {
    this.config = {
      baseColor, intensity: 0.1, pulseSpeed: 0.3,
      particleCount: 0, ringOpacity: 0.05, size: 0.8,
    };
    this.targetConfig = { ...this.config };
  }

  /**
   * 状態を更新
   */
  setState(state: PresenceState): void {
    this.currentState = state;
    const stateConfig = STATE_CONFIGS[state];
    this.targetConfig = { ...this.config, ...stateConfig };
  }

  /**
   * フレーム更新(スムーシング)
   */
  update(): AuraConfig {
    const s = this.smoothFactor;
    this.config.intensity += (this.targetConfig.intensity - this.config.intensity) * s;
    this.config.pulseSpeed += (this.targetConfig.pulseSpeed - this.config.pulseSpeed) * s;
    this.config.particleCount += (this.targetConfig.particleCount - this.config.particleCount) * s;
    this.config.ringOpacity += (this.targetConfig.ringOpacity - this.config.ringOpacity) * s;
    this.config.size += (this.targetConfig.size - this.config.size) * s;
    return { ...this.config };
  }

  setBaseColor(color: string): void {
    this.config.baseColor = color;
    this.targetConfig.baseColor = color;
  }

  getConfig(): AuraConfig { return { ...this.config }; }
  getState(): PresenceState { return this.currentState; }

  /**
   * CSS変数としてエクスポート(UIコンポーネント用)
   */
  toCSSVars(): Record<string, string> {
    return {
      '--aura-color': this.config.baseColor,
      '--aura-intensity': String(this.config.intensity),
      '--aura-pulse-speed': `${this.config.pulseSpeed}s`,
      '--aura-ring-opacity': String(this.config.ringOpacity),
      '--aura-size': String(this.config.size),
    };
  }
}
