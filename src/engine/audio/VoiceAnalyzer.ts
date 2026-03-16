/**
 * kokoro — Voice Analyzer Engine
 * Web Audio API + AudioWorklet による音声解析
 * VAD（Voice Activity Detection）、RMS音量、ピッチ推定、ビゼーム出力
 */

export interface VisemeResult {
  viseme: string;   // aa, ih, ou, ee, oh, sil
  weight: number;   // 0-1
}

export interface VoiceAnalysisResult {
  isSpeaking: boolean;
  volume: number;    // RMS 0-1
  pitch: number;     // Hz
  pitchNormalized: number; // 0-1 (mapped to vocal range 75-500Hz)
  viseme: VisemeResult;
}

type AnalysisCallback = (result: VoiceAnalysisResult) => void;

/**
 * リアルタイム音声解析エンジン
 * マイク入力 → FFT → VAD/ピッチ/ビゼーム推定
 */
export class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private rafId: number = 0;
  private callback: AnalysisCallback | null = null;

  // VAD parameters
  private readonly VAD_THRESHOLD = 0.015;
  private readonly VAD_HYSTERESIS_ON = 8;   // frames to confirm speech start
  private readonly VAD_HYSTERESIS_OFF = 20; // frames to confirm speech end
  private vadOnCount = 0;
  private vadOffCount = 0;
  private isSpeakingInternal = false;

  // Frequency data buffer
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Float32Array | null = null;

  /**
   * マイクを取得し解析を開始
   */
  async start(callback: AnalysisCallback): Promise<void> {
    this.callback = callback;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext();
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.source.connect(this.analyser);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.analyser.fftSize);

      this.analyze();
    } catch (err) {
      console.error('[VoiceAnalyzer] Failed to start:', err);
      throw err;
    }
  }

  /**
   * 解析ループ（requestAnimationFrame ベース）
   */
  private analyze = (): void => {
    if (!this.analyser || !this.frequencyData || !this.timeDomainData) return;

    this.analyser.getByteFrequencyData(this.frequencyData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getFloatTimeDomainData(this.timeDomainData as unknown as Float32Array<ArrayBuffer>);

    const volume = this.calculateRMS(this.timeDomainData);
    const pitch = this.estimatePitch(this.timeDomainData, this.audioContext!.sampleRate);
    const isSpeaking = this.updateVAD(volume);
    const viseme = this.estimateViseme(this.frequencyData, volume, isSpeaking);

    this.callback?.({
      isSpeaking,
      volume: Math.min(1, volume * 5), // Normalize for UI
      pitch,
      pitchNormalized: this.normalizePitch(pitch),
      viseme,
    });

    this.rafId = requestAnimationFrame(this.analyze);
  };

  /**
   * RMS（Root Mean Square）音量の計算
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * 簡易ピッチ推定（自己相関法）
   */
  private estimatePitch(data: Float32Array, sampleRate: number): number {
    const SIZE = data.length;
    const maxSamples = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Float32Array(maxSamples);

    for (let offset = 50; offset < maxSamples; offset++) {
      let correlation = 0;
      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(data[i] - data[i + offset]);
      }
      correlation = 1 - correlation / maxSamples;
      correlations[offset] = correlation;

      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
        foundGoodCorrelation = true;
      } else if (foundGoodCorrelation) {
        break;
      }
    }

    if (bestCorrelation > 0.01 && bestOffset > 0) {
      return sampleRate / bestOffset;
    }
    return 0;
  }

  /**
   * VAD（Voice Activity Detection）— ヒステリシス付き
   */
  private updateVAD(rms: number): boolean {
    if (rms > this.VAD_THRESHOLD) {
      this.vadOnCount++;
      this.vadOffCount = 0;
      if (this.vadOnCount >= this.VAD_HYSTERESIS_ON) {
        this.isSpeakingInternal = true;
      }
    } else {
      this.vadOffCount++;
      this.vadOnCount = 0;
      if (this.vadOffCount >= this.VAD_HYSTERESIS_OFF) {
        this.isSpeakingInternal = false;
      }
    }
    return this.isSpeakingInternal;
  }

  /**
   * 周波数帯域からビゼームを推定
   * 母音 (あいうえお) → aa, ih, ou, ee, oh
   */
  private estimateViseme(
    freqData: Uint8Array,
    volume: number,
    isSpeaking: boolean
  ): VisemeResult {
    if (!isSpeaking || volume < 0.01) {
      return { viseme: 'sil', weight: 0 };
    }

    const binCount = freqData.length;
    // Divide into formant-like bands
    const low = this.bandEnergy(freqData, 0, Math.floor(binCount * 0.05));       // ~0-400Hz
    const midLow = this.bandEnergy(freqData, Math.floor(binCount * 0.05), Math.floor(binCount * 0.1));  // ~400-800Hz
    const mid = this.bandEnergy(freqData, Math.floor(binCount * 0.1), Math.floor(binCount * 0.2));      // ~800-1600Hz
    const midHigh = this.bandEnergy(freqData, Math.floor(binCount * 0.2), Math.floor(binCount * 0.35)); // ~1600-2800Hz

    // Simple formant-based viseme classification
    let viseme = 'aa';
    let maxScore = 0;

    const scores: Record<string, number> = {
      'aa': low * 1.2 + midLow * 0.8,         // あ: F1高, F2中
      'ih': mid * 1.0 + midHigh * 1.2,          // い: F1低, F2高
      'ou': low * 1.5 + mid * 0.3,              // う: F1低, F2低
      'ee': midLow * 0.8 + midHigh * 1.3,       // え: F1中, F2高
      'oh': low * 1.0 + midLow * 1.0 + mid * 0.5, // お: F1中, F2低
    };

    for (const [key, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        viseme = key;
      }
    }

    const weight = Math.min(1, volume * 3);

    return { viseme, weight };
  }

  /**
   * 指定帯域のエネルギー計算
   */
  private bandEnergy(data: Uint8Array, start: number, end: number): number {
    let sum = 0;
    const count = end - start;
    if (count <= 0) return 0;
    for (let i = start; i < end && i < data.length; i++) {
      sum += data[i];
    }
    return sum / count / 255;
  }

  /**
   * MediaStreamを外部から取得（WebRTC用）
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * AudioContextを外部から取得
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * 正規化されたFFT周波数データを取得（外部連携用）
   * Returns Float32Array of 0-1 values
   */
  getFrequencyDataNormalized(): Float32Array {
    if (!this.frequencyData) return new Float32Array(0);
    const out = new Float32Array(this.frequencyData.length);
    for (let i = 0; i < this.frequencyData.length; i++) {
      out[i] = this.frequencyData[i] / 255;
    }
    return out;
  }

  /**
   * ピッチをボーカル範囲（75-500Hz）に正規化（0-1）
   */
  private normalizePitch(hz: number): number {
    if (hz <= 0) return 0;
    return Math.min(1, Math.max(0, (hz - 75) / (500 - 75)));
  }

  /**
   * 解析を停止
   */
  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.source = null;
    this.callback = null;
  }
}
