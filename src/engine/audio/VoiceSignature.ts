/**
 * cocoro — Voice Signature
 * FFTスペクトラムから声紋固有色を生成する
 * 
 * 思想: 声紋がアバターの「自分だけの色」になる
 * → Razer AVA の「進化パーソナリティ」を超える
 *    声そのものがアイデンティティ
 * 
 * 手法:
 *   数秒間のFFTの統計的特徴（重心、分散、ピーク周波数）を
 *   HSL色空間にマッピング。
 *   - H(色相): スペクトル重心 → 低音=暖色、高音=寒色
 *   - S(彩度): スペクトル分散 → 単調=低彩度、豊か=高彩度
 *   - L(明度): 平均音量 → 小声=暗い、大声=明るい
 */

export interface VoiceSignatureData {
  hue: number;        // 0-360
  saturation: number;  // 0-100
  lightness: number;   // 0-100
  cssColor: string;    // hsl(h, s%, l%)
  hexColor: string;    // #rrggbb
}

const SAMPLE_FRAMES = 60; // ~1 second at 60fps

export class VoiceSignature {
  private centroidSamples: number[] = [];
  private varianceSamples: number[] = [];
  private volumeSamples: number[] = [];
  private _signature: VoiceSignatureData | null = null;
  private _isCalibrated = false;

  /**
   * Feed FFT data each frame while speaking.
   * After SAMPLE_FRAMES, signature is computed and frozen.
   */
  feed(frequencyData: Float32Array, volume: number): void {
    if (this._isCalibrated) return;
    if (volume < 0.05) return; // ignore silence

    // Spectral centroid
    let weightedSum = 0, sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      weightedSum += (i / frequencyData.length) * frequencyData[i];
      sum += frequencyData[i];
    }
    const centroid = sum > 0 ? weightedSum / sum : 0.5;

    // Spectral variance
    let varSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const diff = (i / frequencyData.length) - centroid;
      varSum += diff * diff * frequencyData[i];
    }
    const variance = sum > 0 ? varSum / sum : 0;

    this.centroidSamples.push(centroid);
    this.varianceSamples.push(variance);
    this.volumeSamples.push(volume);

    if (this.centroidSamples.length >= SAMPLE_FRAMES) {
      this._computeSignature();
    }
  }

  private _computeSignature(): void {
    const avgCentroid = this._avg(this.centroidSamples);
    const avgVariance = this._avg(this.varianceSamples);
    const avgVolume = this._avg(this.volumeSamples);

    // Map to HSL
    const hue = Math.round(avgCentroid * 300 + 30) % 360; // 30-330
    const saturation = Math.round(
      Math.min(100, Math.max(30, avgVariance * 500 + 40))
    );
    const lightness = Math.round(
      Math.min(70, Math.max(30, avgVolume * 80 + 25))
    );

    const cssColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // HSL to HEX
    const hexColor = this._hslToHex(hue, saturation, lightness);

    this._signature = { hue, saturation, lightness, cssColor, hexColor };
    this._isCalibrated = true;
  }

  get signature(): VoiceSignatureData | null {
    return this._signature;
  }

  get isCalibrated(): boolean {
    return this._isCalibrated;
  }

  /** Reset for recalibration */
  reset(): void {
    this.centroidSamples = [];
    this.varianceSamples = [];
    this.volumeSamples = [];
    this._signature = null;
    this._isCalibrated = false;
  }

  private _avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private _hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}
