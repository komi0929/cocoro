/**
 * cocoro — Voice Tone Analyzer
 * 声のトーン（明るさ・温かさ・力強さ）をリアルタイム分析
 *
 * 反復211-215:
 * - スペクトル重心 → 明るさ (brightness)
 * - スペクトル拡散 → 温かさ (warmth: 狭い=温かい、広い=シャープ)
 * - スペクトルフラックス → エネルギー変化率 (dynamism)
 * = 「この人の声が心地良い」を数値化
 */

export interface ToneProfile {
  brightness: number;   // 0-1: 高い=明るい声
  warmth: number;       // 0-1: 高い=温かい声
  dynamism: number;     // 0-1: 高い=抑揚が大きい
  resonance: number;    // 0-1: 高い=響きが豊か
  composite: number;    // 0-1: 総合的な声の魅力度
}

export class VoiceToneAnalyzer {
  private prevSpectrum: Float32Array | null = null;
  private smoothBrightness = 0;
  private smoothWarmth = 0;
  private smoothDynamism = 0;
  private smoothResonance = 0;
  private readonly SMOOTH = 0.15;

  /**
   * FFTデータからトーンプロファイルを計算
   */
  analyze(frequencyData: Uint8Array, sampleRate: number): ToneProfile {
    const N = frequencyData.length;
    const hzPerBin = sampleRate / (N * 2);

    // === Spectral Centroid → Brightness ===
    let weightedSum = 0;
    let totalEnergy = 0;
    for (let i = 1; i < N; i++) {
      const mag = frequencyData[i] / 255;
      weightedSum += mag * i * hzPerBin;
      totalEnergy += mag;
    }
    const centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
    const rawBrightness = Math.min(1, centroid / 4000); // 4kHz = max brightness

    // === Spectral Spread → Warmth (inverse) ===
    let spreadSum = 0;
    if (totalEnergy > 0) {
      for (let i = 1; i < N; i++) {
        const mag = frequencyData[i] / 255;
        const freq = i * hzPerBin;
        spreadSum += mag * (freq - centroid) ** 2;
      }
    }
    const spread = totalEnergy > 0 ? Math.sqrt(spreadSum / totalEnergy) : 0;
    const rawWarmth = 1 - Math.min(1, spread / 3000);

    // === Spectral Flux → Dynamism ===
    let flux = 0;
    const currentSpectrum = new Float32Array(N);
    for (let i = 0; i < N; i++) currentSpectrum[i] = frequencyData[i] / 255;

    if (this.prevSpectrum) {
      for (let i = 0; i < N; i++) {
        const diff = currentSpectrum[i] - this.prevSpectrum[i];
        if (diff > 0) flux += diff;
      }
      flux /= N;
    }
    this.prevSpectrum = currentSpectrum;
    const rawDynamism = Math.min(1, flux * 10);

    // === Harmonic-to-Noise Ratio estimate → Resonance ===
    // Simple: ratio of peaks to overall energy
    let peakEnergy = 0;
    for (let i = 2; i < N - 2; i++) {
      const cur = frequencyData[i];
      if (cur > frequencyData[i - 1] && cur > frequencyData[i + 1] &&
          cur > frequencyData[i - 2] && cur > frequencyData[i + 2]) {
        peakEnergy += cur / 255;
      }
    }
    const rawResonance = totalEnergy > 0 ? Math.min(1, (peakEnergy / totalEnergy) * 3) : 0;

    // Smooth
    this.smoothBrightness += (rawBrightness - this.smoothBrightness) * this.SMOOTH;
    this.smoothWarmth += (rawWarmth - this.smoothWarmth) * this.SMOOTH;
    this.smoothDynamism += (rawDynamism - this.smoothDynamism) * this.SMOOTH;
    this.smoothResonance += (rawResonance - this.smoothResonance) * this.SMOOTH;

    // Composite: weighted combination
    const composite = (
      this.smoothWarmth * 0.35 +
      this.smoothResonance * 0.3 +
      this.smoothBrightness * 0.2 +
      this.smoothDynamism * 0.15
    );

    return {
      brightness: Math.round(this.smoothBrightness * 100) / 100,
      warmth: Math.round(this.smoothWarmth * 100) / 100,
      dynamism: Math.round(this.smoothDynamism * 100) / 100,
      resonance: Math.round(this.smoothResonance * 100) / 100,
      composite: Math.round(composite * 100) / 100,
    };
  }

  reset(): void {
    this.prevSpectrum = null;
    this.smoothBrightness = 0;
    this.smoothWarmth = 0;
    this.smoothDynamism = 0;
    this.smoothResonance = 0;
  }
}
