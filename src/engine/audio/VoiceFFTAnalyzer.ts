/**
 * cocoro — Voice FFT Analyzer
 * マイク入力のFFT周波数スペクトラムをリアルタイム解析
 * 
 * 声の物理量を数値化して空間のシェーダーに注入する
 * = 声が空間を「変形」させる根幹エンジン
 * 
 * 出力:
 *   - frequencyData: Float32Array (0-1 normalized, 64 bins)
 *   - volume: number (0-1 overall loudness)
 *   - bass/mid/treble: number (0-1 周波数帯域別)
 *   - isSpeaking: boolean (voice activity detection)
 *   - energy: number (0-1 瞬間エネルギー)
 *   - smoothEnergy: number (0-1 平滑化エネルギー)
 */

export interface VoiceMetrics {
  frequencyData: Float32Array;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  isSpeaking: boolean;
  energy: number;
  smoothEnergy: number;
}

const FFT_SIZE = 128; // 64 frequency bins
const SMOOTH_FACTOR = 0.15;
const SPEAKING_THRESHOLD = 0.08;
const ENERGY_SMOOTH = 0.92;

export class VoiceFFTAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private rawData: Uint8Array = new Uint8Array(FFT_SIZE / 2);
  private normalizedData: Float32Array = new Float32Array(FFT_SIZE / 2);
  private smoothedData: Float32Array = new Float32Array(FFT_SIZE / 2);
  private _smoothEnergy = 0;
  private _isActive = false;

  /** マイクストリームから解析開始 */
  async start(stream: MediaStream): Promise<void> {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);

    // Create typed array from analyser
    this.rawData = new Uint8Array(this.analyser.frequencyBinCount);
    this._isActive = true;
  }

  /** デモモード（マイクなし）— ダミーデータ生成 */
  startDemo(): void {
    this._isActive = true;
  }

  /** 現在のフレームの声メトリクスを取得 */
  getMetrics(time: number = 0): VoiceMetrics {
    if (this.analyser && this._isActive) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.analyser.getByteFrequencyData(this.rawData as any);

      // Normalize to 0-1
      for (let i = 0; i < this.rawData.length; i++) {
        this.normalizedData[i] = this.rawData[i] / 255;
        // Smooth
        this.smoothedData[i] +=
          (this.normalizedData[i] - this.smoothedData[i]) * SMOOTH_FACTOR;
      }
    } else if (this._isActive) {
      // Demo mode: generate synthetic voice-like data
      this._generateDemoData(time);
    }

    // Calculate band energies
    const binCount = this.smoothedData.length;
    const bassEnd = Math.floor(binCount * 0.15);
    const midEnd = Math.floor(binCount * 0.5);

    let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;

    for (let i = 0; i < binCount; i++) {
      const v = this.smoothedData[i];
      totalSum += v;
      if (i < bassEnd) bassSum += v;
      else if (i < midEnd) midSum += v;
      else trebleSum += v;
    }

    const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
    const mid = (midEnd - bassEnd) > 0 ? midSum / (midEnd - bassEnd) : 0;
    const treble = (binCount - midEnd) > 0 ? trebleSum / (binCount - midEnd) : 0;
    const volume = binCount > 0 ? totalSum / binCount : 0;
    const energy = Math.min(1, volume * 2.5);

    this._smoothEnergy = this._smoothEnergy * ENERGY_SMOOTH + energy * (1 - ENERGY_SMOOTH);

    return {
      frequencyData: this.smoothedData,
      volume: Math.min(1, volume),
      bass: Math.min(1, bass),
      mid: Math.min(1, mid),
      treble: Math.min(1, treble),
      isSpeaking: volume > SPEAKING_THRESHOLD,
      energy,
      smoothEnergy: this._smoothEnergy,
    };
  }

  /** デモ用合成波形 */
  private _generateDemoData(time: number): void {
    const t = time * 0.001;
    for (let i = 0; i < this.smoothedData.length; i++) {
      const freq = i / this.smoothedData.length;
      // Simulate voice: strong low-mid, some variation
      const base =
        Math.sin(t * 2 + i * 0.5) * 0.3 +
        Math.sin(t * 3.7 + i * 0.3) * 0.2 +
        Math.sin(t * 1.1) * 0.15;

      // Voice frequency emphasis (200-3000 Hz range)
      const voiceEmphasis = freq > 0.1 && freq < 0.5 ? 1.5 : 0.5;
      const pulse = (Math.sin(t * 0.5) + 1) * 0.5; // breathing rhythm

      this.smoothedData[i] = Math.max(0, Math.min(1,
        (base * voiceEmphasis * pulse + 0.05) * 0.8
      ));
    }
  }

  get isActive(): boolean {
    return this._isActive;
  }

  dispose(): void {
    this._isActive = false;
    this.source?.disconnect();
    this.audioContext?.close();
    this.analyser = null;
    this.source = null;
    this.audioContext = null;
  }
}
