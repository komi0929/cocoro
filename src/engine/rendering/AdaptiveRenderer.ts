/**
 * cocoro — Adaptive Renderer
 * フレームレート適応制御 + 省電力モード
 *
 * サイクル3+5: モバイルパフォーマンスの要
 * - FPS監視 → 自動品質調整
 * - バッテリー残量監視(Battery API)
 * - 省電力モード: 3D品質を段階的に下げる
 * - デバイス性能判定(GPU Tier推定)
 */

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

export interface RenderingConfig {
  quality: QualityLevel;
  targetFPS: number;
  pixelRatio: number;
  shadowsEnabled: boolean;
  particlesEnabled: boolean;
  postProcessing: boolean;
  maxAvatarsRendered: number;
  antiAlias: boolean;
}

export interface PerformanceMetrics {
  currentFPS: number;
  avgFPS: number;
  gpuTimeMs: number;
  batteryLevel: number | null;
  isCharging: boolean | null;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
}

const QUALITY_PRESETS: Record<QualityLevel, RenderingConfig> = {
  ultra: { quality: 'ultra', targetFPS: 60, pixelRatio: 2, shadowsEnabled: true, particlesEnabled: true, postProcessing: true, maxAvatarsRendered: 16, antiAlias: true },
  high: { quality: 'high', targetFPS: 60, pixelRatio: 1.5, shadowsEnabled: true, particlesEnabled: true, postProcessing: true, maxAvatarsRendered: 12, antiAlias: true },
  medium: { quality: 'medium', targetFPS: 30, pixelRatio: 1, shadowsEnabled: false, particlesEnabled: true, postProcessing: false, maxAvatarsRendered: 8, antiAlias: false },
  low: { quality: 'low', targetFPS: 30, pixelRatio: 0.75, shadowsEnabled: false, particlesEnabled: false, postProcessing: false, maxAvatarsRendered: 5, antiAlias: false },
  minimal: { quality: 'minimal', targetFPS: 24, pixelRatio: 0.5, shadowsEnabled: false, particlesEnabled: false, postProcessing: false, maxAvatarsRendered: 3, antiAlias: false },
};

export class AdaptiveRenderer {
  private config: RenderingConfig;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private autoAdjust = true;

  constructor() {
    this.config = { ...QUALITY_PRESETS.medium };
    this.metrics = {
      currentFPS: 60, avgFPS: 60, gpuTimeMs: 0,
      batteryLevel: null, isCharging: null,
      thermalState: 'nominal',
    };
    this.detectDevice();
  }

  /**
   * デバイス性能を推定
   */
  private async detectDevice(): Promise<void> {
    // Screen size heuristic
    const isMobile = window.innerWidth < 768;
    const isHighEnd = window.devicePixelRatio >= 3;

    if (isMobile && !isHighEnd) {
      this.config = { ...QUALITY_PRESETS.low };
    } else if (isMobile) {
      this.config = { ...QUALITY_PRESETS.medium };
    } else {
      this.config = { ...QUALITY_PRESETS.high };
    }

    // Battery API
    try {
      const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
      if (nav.getBattery) {
        const battery = await nav.getBattery();
        this.metrics.batteryLevel = battery.level;
        this.metrics.isCharging = battery.charging;
      }
    } catch { /* Battery API not available */ }
  }

  /**
   * フレーム完了時に呼ぶ
   */
  onFrameComplete(deltaTimeMs: number): void {
    const fps = 1000 / Math.max(1, deltaTimeMs);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();

    this.metrics.currentFPS = Math.round(fps);
    this.metrics.avgFPS = Math.round(
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    );

    if (this.autoAdjust && this.fpsHistory.length >= 30) {
      this.adjustQuality();
    }
  }

  /**
   * FPSに基づく自動品質調整
   */
  private adjustQuality(): void {
    const avgFPS = this.metrics.avgFPS;
    const levels: QualityLevel[] = ['ultra', 'high', 'medium', 'low', 'minimal'];
    const currentIdx = levels.indexOf(this.config.quality);

    if (avgFPS < this.config.targetFPS * 0.7 && currentIdx < levels.length - 1) {
      // FPSが低い → 品質を下げる
      this.setQuality(levels[currentIdx + 1]);
    } else if (avgFPS > this.config.targetFPS * 0.95 && currentIdx > 0) {
      // FPSに余裕 → 品質を上げる(ゆっくり)
      if (this.fpsHistory.length >= 60) {
        this.setQuality(levels[currentIdx - 1]);
        this.fpsHistory = []; // Reset after upgrade attempt
      }
    }

    // Battery低下時は強制的に品質を下げる
    if (this.metrics.batteryLevel !== null && this.metrics.batteryLevel < 0.15 && !this.metrics.isCharging) {
      if (currentIdx < levels.indexOf('low')) {
        this.setQuality('low');
      }
    }
  }

  setQuality(level: QualityLevel): void {
    this.config = { ...QUALITY_PRESETS[level] };
  }

  getConfig(): RenderingConfig { return { ...this.config }; }
  getMetrics(): PerformanceMetrics { return { ...this.metrics }; }
  setAutoAdjust(enabled: boolean): void { this.autoAdjust = enabled; }
}
