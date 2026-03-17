/**
 * kokoro — Voice Signature Engine
 * 声の周波数特性から固有の「声紋カラー」を生成
 * 
 * 反復126-130:
 * - FFTスペクトルの特徴量から一意のHSLカラーを計算
 * - 毎セッション安定した色を返す（同じ声=同じ色）
 * - アバターのグローリング、ProfileCard、フロアヒートマップに反映
 * = 「声にはその人だけの色がある」という体験
 */

export class VoiceSignatureEngine {
  private spectralHistory: Float32Array[] = [];
  private stableSignature: string | null = null;
  private readonly HISTORY_SIZE = 30; // 30フレーム分の平均で安定化

  /**
   * FFTデータから特徴量を抽出
   */
  processFFT(frequencyData: Uint8Array): void {
    // Extract key features
    const normalized = new Float32Array(4);
    const binSize = Math.floor(frequencyData.length / 4);

    for (let band = 0; band < 4; band++) {
      let sum = 0;
      for (let i = band * binSize; i < (band + 1) * binSize; i++) {
        sum += frequencyData[i] / 255;
      }
      normalized[band] = sum / binSize;
    }

    this.spectralHistory.push(normalized);
    if (this.spectralHistory.length > this.HISTORY_SIZE) {
      this.spectralHistory.shift();
    }

    // Update stable signature after enough samples
    if (this.spectralHistory.length >= 10) {
      this.computeSignature();
    }
  }

  /**
   * 安定した声紋を計算
   */
  private computeSignature(): void {
    const avgBands = [0, 0, 0, 0];
    for (const frame of this.spectralHistory) {
      for (let i = 0; i < 4; i++) {
        avgBands[i] += frame[i];
      }
    }
    for (let i = 0; i < 4; i++) {
      avgBands[i] /= this.spectralHistory.length;
    }

    // Map bands to HSL
    // Hue: bass/treble ratio (low voice = warm, high voice = cool)
    const bassWeight = avgBands[0] + avgBands[1];
    const trebleWeight = avgBands[2] + avgBands[3];
    const total = bassWeight + trebleWeight + 0.001;

    const hue = Math.round(
      (bassWeight / total) * 30 +          // Warm offset
      (trebleWeight / total) * 200 +       // Cool offset
      (avgBands[1] / (total * 0.5)) * 60   // Mid variation
    ) % 360;

    // Saturation: spectral variation (monotone=low, expressive=high)
    const variance = avgBands.reduce((v, b) => v + Math.abs(b - 0.25), 0);
    const saturation = Math.round(40 + variance * 200);

    // Lightness: overall volume
    const avgVolume = avgBands.reduce((s, b) => s + b, 0) / 4;
    const lightness = Math.round(45 + avgVolume * 30);

    this.stableSignature = `hsl(${hue}, ${Math.min(90, saturation)}%, ${Math.min(75, lightness)}%)`;
  }

  /**
   * 声紋カラーをHSL文字列で返す
   */
  getColor(): string | null {
    return this.stableSignature;
  }

  /**
   * 声紋カラーをHex文字列で返す
   */
  getHexColor(): string | null {
    if (!this.stableSignature) return null;

    // Parse HSL
    const match = this.stableSignature.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return null;

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    // HSL to RGB
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * 十分なデータがあるか
   */
  isReady(): boolean {
    return this.stableSignature !== null;
  }

  /**
   * リセット
   */
  reset(): void {
    this.spectralHistory = [];
    this.stableSignature = null;
  }
}
