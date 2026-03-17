/**
 * kokoro — InputLatencyOptimizer + NetworkQualityPredictor
 * 入力遅延最適化 + ネットワーク品質予測
 *
 * コミュニケーションアプリ = 遅延は一発アウト
 * - タッチ応答: 50ms以内
 * - マイク→表示: 100ms以内目標
 * - ネットワーク品質劣化を**予測して先に対策**
 */

// ========================================
// 1. InputLatencyOptimizer
// ========================================

export interface LatencyMetrics {
  touchToResponse: number;      // ms (タッチ→UI応答)
  micToDisplay: number;         // ms (マイク入力→表示反映)
  eventQueueDepth: number;
  passiveListenerCount: number;
  willChangeElements: number;
  isLowLatencyMode: boolean;
}

export class InputLatencyOptimizer {
  private metrics: LatencyMetrics;
  private touchTimestamps: Map<number, number> = new Map();
  private lowLatencyMode = false;

  constructor() {
    this.metrics = {
      touchToResponse: 0, micToDisplay: 0,
      eventQueueDepth: 0, passiveListenerCount: 0,
      willChangeElements: 0, isLowLatencyMode: false,
    };
  }

  /**
   * タッチ/クリック遅延計測の開始
   * イベントハンドラの最初で呼ぶ
   */
  markInputStart(eventId: number): void {
    this.touchTimestamps.set(eventId, performance.now());
    // 古いエントリのクリーンアップ
    if (this.touchTimestamps.size > 50) {
      const oldest = Array.from(this.touchTimestamps.keys()).slice(0, 25);
      oldest.forEach(k => this.touchTimestamps.delete(k));
    }
  }

  /** 応答完了時に呼ぶ → 遅延計測 */
  markInputEnd(eventId: number): number {
    const start = this.touchTimestamps.get(eventId);
    if (!start) return 0;
    const latency = performance.now() - start;
    this.touchTimestamps.delete(eventId);
    this.metrics.touchToResponse = latency;
    return latency;
  }

  /** マイク→表示パイプライン遅延計測 */
  markMicInput(): number {
    return performance.now();
  }

  markDisplayOutput(micTimestamp: number): number {
    const latency = performance.now() - micTimestamp;
    this.metrics.micToDisplay = latency;
    return latency;
  }

  /**
   * 低遅延最適化の適用
   * - CSS will-change管理
   * - passive リスナー確認
   */
  enableLowLatencyMode(): void {
    this.lowLatencyMode = true;
    this.metrics.isLowLatencyMode = true;

    // CSS最適化のヒントを返す(直接DOMは触らない)
  }

  /**
   * passiveリスナー推奨設定を返す
   */
  getOptimalListenerOptions(): { passive: boolean; capture: boolean } {
    return { passive: true, capture: false };
  }

  /**
   * パフォーマンスバジェットの確認
   * 50ms以内ならOK、超えたら警告
   */
  isWithinBudget(): boolean {
    return this.metrics.touchToResponse < 50;
  }

  getMetrics(): LatencyMetrics { return { ...this.metrics }; }
}

// ========================================
// 2. NetworkQualityPredictor
// ========================================

export type NetworkTier = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface NetworkState {
  tier: NetworkTier;
  rttMs: number;
  rttTrend: 'improving' | 'stable' | 'degrading';
  packetLossPercent: number;
  bandwidthKbps: number;
  effectiveType: string;           // '4g', '3g', '2g'
  isSaveData: boolean;
  predictedQualityIn30s: NetworkTier;  // 30秒後予測
  recommendedBitrate: number;
  recommendedBufferMs: number;
}

export class NetworkQualityPredictor {
  private rttHistory: number[] = [];
  private lossHistory: number[] = [];
  private state: NetworkState;
  private readonly MAX_HISTORY = 60; // 60サンプル

  constructor() {
    this.state = {
      tier: 'good',
      rttMs: 50,
      rttTrend: 'stable',
      packetLossPercent: 0,
      bandwidthKbps: 1000,
      effectiveType: '4g',
      isSaveData: false,
      predictedQualityIn30s: 'good',
      recommendedBitrate: 32000,
      recommendedBufferMs: 100,
    };
    this.detectConnection();
  }

  /** RTT/パケットロスのサンプル追加(WebRTC statsから) */
  addSample(rttMs: number, packetLossPercent: number): NetworkState {
    this.rttHistory.push(rttMs);
    this.lossHistory.push(packetLossPercent);
    if (this.rttHistory.length > this.MAX_HISTORY) this.rttHistory.shift();
    if (this.lossHistory.length > this.MAX_HISTORY) this.lossHistory.shift();

    this.state.rttMs = rttMs;
    this.state.packetLossPercent = packetLossPercent;

    // Tier determination
    this.state.tier = this.determineTier(rttMs, packetLossPercent);

    // Trend analysis
    this.state.rttTrend = this.analyzeTrend();

    // Prediction: 30s ahead
    this.state.predictedQualityIn30s = this.predictQuality();

    // Recommendations (先回りで対策)
    this.updateRecommendations();

    return { ...this.state };
  }

  /** 現在のネットワーク状態 */
  getState(): NetworkState { return { ...this.state }; }

  /** プリエンプティブな対策が必要か */
  needsPreemptiveAction(): boolean {
    return this.state.rttTrend === 'degrading' ||
      this.tierIndex(this.state.predictedQualityIn30s) < this.tierIndex(this.state.tier);
  }

  // ========== Private ==========

  private determineTier(rtt: number, loss: number): NetworkTier {
    if (rtt < 50 && loss < 1) return 'excellent';
    if (rtt < 100 && loss < 3) return 'good';
    if (rtt < 200 && loss < 5) return 'fair';
    if (rtt < 400 && loss < 10) return 'poor';
    return 'critical';
  }

  private analyzeTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.rttHistory.length < 10) return 'stable';

    const recent5 = this.rttHistory.slice(-5);
    const earlier5 = this.rttHistory.slice(-10, -5);

    const recentAvg = recent5.reduce((a, b) => a + b, 0) / 5;
    const earlierAvg = earlier5.reduce((a, b) => a + b, 0) / 5;

    const change = (recentAvg - earlierAvg) / earlierAvg;
    if (change > 0.2) return 'degrading';
    if (change < -0.2) return 'improving';
    return 'stable';
  }

  private predictQuality(): NetworkTier {
    if (this.rttHistory.length < 5) return this.state.tier;

    // Linear extrapolation
    const recent = this.rttHistory.slice(-5);
    const slope = (recent[4] - recent[0]) / 4;
    const predicted = recent[4] + slope * 10; // 10 more samples ahead

    const avgLoss = this.lossHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
    return this.determineTier(Math.max(0, predicted), avgLoss);
  }

  private updateRecommendations(): void {
    // Use predicted quality for proactive adjustment
    const target = this.tierIndex(this.state.predictedQualityIn30s) < this.tierIndex(this.state.tier)
      ? this.state.predictedQualityIn30s
      : this.state.tier;

    switch (target) {
      case 'excellent':
        this.state.recommendedBitrate = 64000;
        this.state.recommendedBufferMs = 50;
        break;
      case 'good':
        this.state.recommendedBitrate = 32000;
        this.state.recommendedBufferMs = 100;
        break;
      case 'fair':
        this.state.recommendedBitrate = 24000;
        this.state.recommendedBufferMs = 200;
        break;
      case 'poor':
        this.state.recommendedBitrate = 16000;
        this.state.recommendedBufferMs = 400;
        break;
      case 'critical':
        this.state.recommendedBitrate = 8000;
        this.state.recommendedBufferMs = 800;
        break;
    }
  }

  private tierIndex(tier: NetworkTier): number {
    return ['critical', 'poor', 'fair', 'good', 'excellent'].indexOf(tier);
  }

  private detectConnection(): void {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (conn) {
      if (conn.effectiveType) this.state.effectiveType = conn.effectiveType;
      if (conn.saveData) this.state.isSaveData = true;
    }
  }
}
