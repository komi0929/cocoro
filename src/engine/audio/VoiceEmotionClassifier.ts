/**
 * cocoro — Voice Emotion Classifier
 * クライアントサイド音声感情推定（AIランタイムゼロ）
 * 
 * Web Audio API の AnalyserNode から MFCC 的特徴量を抽出し、
 * ルールベース + 統計的閾値で感情を推定する。
 * 
 * TensorFlow.js不要 = バンドル軽量、低電池。
 * 精度はML推定より低いが、リアルタイム性とゼロコストを優先。
 * 
 * 推定感情:
 *   - joy: ピッチ高め + 音量高め + 変動大
 *   - anger: ピッチ低〜中 + 音量非常に高い + 変動小（一定の怒鳴り）
 *   - sorrow: ピッチ低め + 音量低め + 変動小
 *   - surprise: ピッチ急上昇 + 音量急上昇
 *   - neutral: 上記いずれにも該当しない
 * 
 * 参考: MFCC-based SER (Speech Emotion Recognition) の特徴量設計
 * https://ijfmr.com — "Real-time emotion detection in browser, 85% accuracy"
 */

export interface EmotionEstimate {
  joy: number;       // 0-1
  anger: number;     // 0-1
  sorrow: number;    // 0-1
  surprise: number;  // 0-1
  neutral: number;   // 0-1
  dominant: 'joy' | 'anger' | 'sorrow' | 'surprise' | 'neutral';
  confidence: number; // 0-1
}

// --- Feature extraction params ---
const HISTORY_LENGTH = 30; // frames of history (~0.5s at 60fps)
const PITCH_JOY_THRESHOLD = 0.55;
const PITCH_SORROW_THRESHOLD = 0.35;
const VOLUME_ANGER_THRESHOLD = 0.7;
const VOLUME_SORROW_THRESHOLD = 0.2;
const SURPRISE_DELTA_THRESHOLD = 0.3;

export class VoiceEmotionClassifier {
  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private spectralCentroidHistory: number[] = [];
  private lastEstimate: EmotionEstimate = {
    joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
    dominant: 'neutral', confidence: 0,
  };

  /**
   * FFT frequency data + volume + pitch から感情を推定
   * 
   * @param frequencyData - normalized FFT bins (0-1), 64 bins
   * @param volume - overall volume (0-1)
   * @param pitch - estimated pitch (0-1, normalized to vocal range)
   * @param isSpeaking - voice activity detection
   */
  classify(
    frequencyData: Float32Array,
    volume: number,
    pitch: number,
    isSpeaking: boolean,
  ): EmotionEstimate {
    if (!isSpeaking) {
      // Fade to neutral when not speaking
      this.lastEstimate = this._lerp(this.lastEstimate, {
        joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
        dominant: 'neutral', confidence: 0,
      }, 0.1);
      return this.lastEstimate;
    }

    // --- Push to history ---
    this.pitchHistory.push(pitch);
    this.volumeHistory.push(volume);
    if (this.pitchHistory.length > HISTORY_LENGTH) this.pitchHistory.shift();
    if (this.volumeHistory.length > HISTORY_LENGTH) this.volumeHistory.shift();

    // --- Compute spectral centroid (brightness of voice) ---
    const spectralCentroid = this._computeSpectralCentroid(frequencyData);
    this.spectralCentroidHistory.push(spectralCentroid);
    if (this.spectralCentroidHistory.length > HISTORY_LENGTH) {
      this.spectralCentroidHistory.shift();
    }

    // --- Feature extraction ---
    const avgPitch = this._average(this.pitchHistory);
    const avgVolume = this._average(this.volumeHistory);
    const pitchVariance = this._variance(this.pitchHistory);
    const volumeVariance = this._variance(this.volumeHistory);
    const pitchDelta = this.pitchHistory.length >= 2
      ? this.pitchHistory[this.pitchHistory.length - 1] - this.pitchHistory[this.pitchHistory.length - 2]
      : 0;
    const volumeDelta = this.volumeHistory.length >= 2
      ? this.volumeHistory[this.volumeHistory.length - 1] - this.volumeHistory[this.volumeHistory.length - 2]
      : 0;
    const avgCentroid = this._average(this.spectralCentroidHistory);

    // --- Rule-based classification ---
    let joy = 0, anger = 0, sorrow = 0, surprise = 0;

    // Joy: high pitch + high volume + high variance (animated speech)
    if (avgPitch > PITCH_JOY_THRESHOLD && avgVolume > 0.3) {
      joy = Math.min(1,
        (avgPitch - PITCH_JOY_THRESHOLD) * 3 +
        pitchVariance * 5 +
        avgCentroid * 0.5
      );
    }

    // Anger: high volume + low-mid pitch + low variance (sustained loud)
    if (avgVolume > VOLUME_ANGER_THRESHOLD) {
      anger = Math.min(1,
        (avgVolume - VOLUME_ANGER_THRESHOLD) * 4 +
        (1 - pitchVariance) * 0.3
      );
    }

    // Sorrow: low pitch + low volume + low variance (monotone, quiet)
    if (avgPitch < PITCH_SORROW_THRESHOLD && avgVolume < VOLUME_SORROW_THRESHOLD) {
      sorrow = Math.min(1,
        (PITCH_SORROW_THRESHOLD - avgPitch) * 3 +
        (VOLUME_SORROW_THRESHOLD - avgVolume) * 2
      );
    }

    // Surprise: rapid pitch + volume increase
    if (pitchDelta > SURPRISE_DELTA_THRESHOLD || volumeDelta > SURPRISE_DELTA_THRESHOLD) {
      surprise = Math.min(1,
        Math.max(pitchDelta, volumeDelta) * 3
      );
    }

    // Normalize
    const total = joy + anger + sorrow + surprise;
    const neutral = total < 0.3 ? 1 - total : 0;

    const sum = joy + anger + sorrow + surprise + neutral || 1;
    joy /= sum;
    anger /= sum;
    sorrow /= sum;
    surprise /= sum;
    const finalNeutral = neutral / sum;

    // Dominant
    const emotions = { joy, anger, sorrow, surprise, neutral: finalNeutral };
    const dominant = (Object.entries(emotions) as [EmotionEstimate['dominant'], number][])
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const confidence = Math.max(joy, anger, sorrow, surprise, finalNeutral);

    const raw: EmotionEstimate = {
      joy, anger, sorrow, surprise, neutral: finalNeutral,
      dominant, confidence,
    };

    // Smooth
    this.lastEstimate = this._lerp(this.lastEstimate, raw, 0.2);
    return this.lastEstimate;
  }

  /** Spectral centroid: weighted average of frequency bins */
  private _computeSpectralCentroid(data: Float32Array): number {
    let weightedSum = 0, sum = 0;
    for (let i = 0; i < data.length; i++) {
      weightedSum += (i / data.length) * data[i];
      sum += data[i];
    }
    return sum > 0 ? weightedSum / sum : 0.5;
  }

  private _average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private _variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const avg = this._average(arr);
    return arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length;
  }

  private _lerp(a: EmotionEstimate, b: EmotionEstimate, t: number): EmotionEstimate {
    return {
      joy: a.joy + (b.joy - a.joy) * t,
      anger: a.anger + (b.anger - a.anger) * t,
      sorrow: a.sorrow + (b.sorrow - a.sorrow) * t,
      surprise: a.surprise + (b.surprise - a.surprise) * t,
      neutral: a.neutral + (b.neutral - a.neutral) * t,
      dominant: b.dominant,
      confidence: a.confidence + (b.confidence - a.confidence) * t,
    };
  }

  reset(): void {
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.spectralCentroidHistory = [];
    this.lastEstimate = {
      joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
      dominant: 'neutral', confidence: 0,
    };
  }
}
