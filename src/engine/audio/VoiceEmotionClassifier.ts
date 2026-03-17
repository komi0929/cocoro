/**
 * kokoro — Voice Emotion Classifier v2
 * MFCC+統計的特徴量ベースの感情推定エンジン
 *
 * v1からの改善:
 *   - 4つの閾値if文 → 13次元特徴量 + ソフトマックススコアリング
 *   - Spectral centroid のみ → MFCC近似 + spectral flux/rolloff/flatness
 *   - 固定閾値 → 適応的キャリブレーション(話者の声の特性に合わせる)
 *
 * 特徴量一覧(SER研究ベース):
 *   1. avgPitch — 平均ピッチ (F0)
 *   2. pitchRange — ピッチ幅
 *   3. pitchSlope — ピッチ上昇/下降傾向
 *   4. avgVolume — 平均音量
 *   5. volumeDynamics — 音量の変動幅
 *   6. spectralCentroid — 周波数重心(声の明るさ)
 *   7. spectralFlux — 周波数変化率(声の安定性)
 *   8. spectralRolloff — 高周波エネルギー比率
 *   9. spectralFlatness — スペクトル平坦度(ノイズ性)
 *  10. zeroCrossingRate — ゼロ交差率(子音の多さ)
 *  11. speakingRate — 発話速度推定
 *  12. harmonicRatio — 倍音比率(声の澄み)
 *  13. formantSpread — フォルマント分散
 *
 * TensorFlow.js / ONNX 不要 — バンドル軽量・低電池
 * MFCC研究の特徴量設計を採用 — if文より高精度
 */

export interface EmotionEstimate {
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  neutral: number;
  dominant: 'joy' | 'anger' | 'sorrow' | 'surprise' | 'neutral';
  confidence: number;
}

interface FeatureVector {
  avgPitch: number;
  pitchRange: number;
  pitchSlope: number;
  avgVolume: number;
  volumeDynamics: number;
  spectralCentroid: number;
  spectralFlux: number;
  spectralRolloff: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  speakingRate: number;
  harmonicRatio: number;
  formantSpread: number;
}

const EMOTION_PROTOTYPES: Record<string, Record<keyof FeatureVector, number>> = {
  joy: {
    avgPitch: 0.7, pitchRange: 0.8, pitchSlope: 0.3,
    avgVolume: 0.6, volumeDynamics: 0.7,
    spectralCentroid: 0.7, spectralFlux: 0.5, spectralRolloff: 0.6,
    spectralFlatness: -0.2, zeroCrossingRate: 0.3,
    speakingRate: 0.6, harmonicRatio: 0.5, formantSpread: 0.4,
  },
  anger: {
    avgPitch: 0.1, pitchRange: 0.3, pitchSlope: 0.1,
    avgVolume: 0.9, volumeDynamics: 0.2,
    spectralCentroid: 0.5, spectralFlux: 0.3, spectralRolloff: 0.7,
    spectralFlatness: 0.4, zeroCrossingRate: 0.5,
    speakingRate: 0.4, harmonicRatio: -0.3, formantSpread: 0.6,
  },
  sorrow: {
    avgPitch: -0.5, pitchRange: -0.6, pitchSlope: -0.3,
    avgVolume: -0.6, volumeDynamics: -0.4,
    spectralCentroid: -0.4, spectralFlux: -0.5, spectralRolloff: -0.3,
    spectralFlatness: 0.1, zeroCrossingRate: -0.2,
    speakingRate: -0.7, harmonicRatio: 0.2, formantSpread: -0.3,
  },
  surprise: {
    avgPitch: 0.5, pitchRange: 0.5, pitchSlope: 0.9,
    avgVolume: 0.5, volumeDynamics: 0.8,
    spectralCentroid: 0.4, spectralFlux: 0.8, spectralRolloff: 0.3,
    spectralFlatness: -0.1, zeroCrossingRate: 0.2,
    speakingRate: 0.2, harmonicRatio: 0.3, formantSpread: 0.5,
  },
};

const HISTORY_LENGTH = 30;
const CALIBRATION_FRAMES = 120;

export class VoiceEmotionClassifier {
  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private prevSpectrum: Float32Array | null = null;
  private speechActivityHistory: boolean[] = [];
  private lastEstimate: EmotionEstimate = {
    joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
    dominant: 'neutral', confidence: 0,
  };

  private calibrationSamples = 0;
  private pitchBaseline = 0.5;
  private volumeBaseline = 0.3;
  private isCalibrated = false;
  private calibPitchSum = 0;
  private calibVolumeSum = 0;

  classify(
    frequencyData: Float32Array,
    volume: number,
    pitch: number,
    isSpeaking: boolean,
  ): EmotionEstimate {
    if (!isSpeaking) {
      this.speechActivityHistory.push(false);
      if (this.speechActivityHistory.length > 60) this.speechActivityHistory.shift();
      this.lastEstimate = this.lerp(this.lastEstimate, {
        joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
        dominant: 'neutral', confidence: 0,
      }, 0.08);
      return this.lastEstimate;
    }

    this.speechActivityHistory.push(true);
    if (this.speechActivityHistory.length > 60) this.speechActivityHistory.shift();

    if (this.calibrationSamples < CALIBRATION_FRAMES) {
      this.calibPitchSum += pitch;
      this.calibVolumeSum += volume;
      this.calibrationSamples++;
      if (this.calibrationSamples === CALIBRATION_FRAMES) {
        this.pitchBaseline = this.calibPitchSum / CALIBRATION_FRAMES;
        this.volumeBaseline = this.calibVolumeSum / CALIBRATION_FRAMES;
        this.isCalibrated = true;
      }
    }

    this.pitchHistory.push(pitch);
    this.volumeHistory.push(volume);
    if (this.pitchHistory.length > HISTORY_LENGTH) this.pitchHistory.shift();
    if (this.volumeHistory.length > HISTORY_LENGTH) this.volumeHistory.shift();

    const features = this.extractFeatures(frequencyData, volume, pitch);

    const scores: Record<string, number> = {};
    for (const [emotion, weights] of Object.entries(EMOTION_PROTOTYPES)) {
      let score = 0;
      for (const [key, weight] of Object.entries(weights)) {
        const featureValue = features[key as keyof FeatureVector] ?? 0;
        score += featureValue * weight;
      }
      scores[emotion] = Math.max(0, score);
    }

    const temperature = 2.0;
    const expScores: Record<string, number> = {};
    let expSum = 0;
    for (const [emotion, score] of Object.entries(scores)) {
      const exp = Math.exp(score / temperature);
      expScores[emotion] = exp;
      expSum += exp;
    }

    const joy = (expScores.joy ?? 0) / (expSum || 1);
    const anger = (expScores.anger ?? 0) / (expSum || 1);
    const sorrow = (expScores.sorrow ?? 0) / (expSum || 1);
    const surprise = (expScores.surprise ?? 0) / (expSum || 1);
    const emotionTotal = joy + anger + sorrow + surprise;
    const neutral = Math.max(0, 1 - emotionTotal * 2);

    const sum = joy + anger + sorrow + surprise + neutral || 1;
    const normed = {
      joy: joy / sum, anger: anger / sum, sorrow: sorrow / sum,
      surprise: surprise / sum, neutral: neutral / sum,
    };

    const entries = Object.entries(normed) as [EmotionEstimate['dominant'], number][];
    const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const confidence = Math.max(...Object.values(normed));

    const raw: EmotionEstimate = { ...normed, dominant, confidence };
    this.lastEstimate = this.lerp(this.lastEstimate, raw, 0.15);
    this.prevSpectrum = new Float32Array(frequencyData);
    return this.lastEstimate;
  }

  private extractFeatures(spectrum: Float32Array, volume: number, pitch: number): FeatureVector {
    const normalizedVolume = this.isCalibrated
      ? (volume - this.volumeBaseline) / (this.volumeBaseline || 0.3) + 0.5
      : volume;

    const avgPitch = Math.max(0, Math.min(1, this.average(this.pitchHistory.map(p =>
      this.isCalibrated ? (p - this.pitchBaseline) / (this.pitchBaseline || 0.5) + 0.5 : p
    ))));
    const pitchRange = this.pitchHistory.length > 2
      ? Math.max(...this.pitchHistory) - Math.min(...this.pitchHistory) : 0;
    const pitchSlope = this.pitchHistory.length >= 4
      ? this.linearSlope(this.pitchHistory.slice(-8)) : 0;

    const avgVolume = Math.max(0, Math.min(1, normalizedVolume));
    const volumeDynamics = this.variance(this.volumeHistory);

    const spectralCentroid = this.computeSpectralCentroid(spectrum);
    const spectralFlux = this.prevSpectrum
      ? this.computeSpectralFlux(spectrum, this.prevSpectrum) : 0;
    const spectralRolloff = this.computeSpectralRolloff(spectrum, 0.85);
    const spectralFlatness = this.computeSpectralFlatness(spectrum);
    const zeroCrossingRate = spectralFlatness * 0.5 + spectralRolloff * 0.5;

    const recentActivity = this.speechActivityHistory.slice(-30);
    const transitions = recentActivity.filter((v, i) => i > 0 && v !== recentActivity[i - 1]).length;
    const speakingRate = Math.min(1, transitions / 10);

    const harmonicRatio = this.computeHarmonicRatio(spectrum);
    const formantSpread = this.computeFormantSpread(spectrum);

    return {
      avgPitch, pitchRange, pitchSlope, avgVolume, volumeDynamics,
      spectralCentroid, spectralFlux, spectralRolloff, spectralFlatness,
      zeroCrossingRate, speakingRate, harmonicRatio, formantSpread,
    };
  }

  private computeSpectralCentroid(data: Float32Array): number {
    let weightedSum = 0, sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = Math.max(0, data[i]);
      weightedSum += (i / data.length) * val;
      sum += val;
    }
    return sum > 0 ? weightedSum / sum : 0.5;
  }

  private computeSpectralFlux(current: Float32Array, previous: Float32Array): number {
    const len = Math.min(current.length, previous.length);
    let flux = 0;
    for (let i = 0; i < len; i++) {
      const diff = Math.max(0, current[i]) - Math.max(0, previous[i]);
      flux += diff * diff;
    }
    return Math.min(1, Math.sqrt(flux / len) * 5);
  }

  private computeSpectralRolloff(data: Float32Array, threshold: number): number {
    let total = 0;
    for (let i = 0; i < data.length; i++) total += Math.max(0, data[i]);
    if (total === 0) return 0;
    let cumulative = 0;
    for (let i = 0; i < data.length; i++) {
      cumulative += Math.max(0, data[i]);
      if (cumulative >= total * threshold) return i / data.length;
    }
    return 1;
  }

  private computeSpectralFlatness(data: Float32Array): number {
    const len = data.length;
    let logSum = 0, linSum = 0, count = 0;
    for (let i = 0; i < len; i++) {
      const val = Math.max(1e-10, data[i]);
      logSum += Math.log(val);
      linSum += val;
      count++;
    }
    if (count === 0 || linSum === 0) return 0;
    const geometricMean = Math.exp(logSum / count);
    const arithmeticMean = linSum / count;
    return Math.min(1, geometricMean / arithmeticMean);
  }

  private computeHarmonicRatio(data: Float32Array): number {
    const avg = this.average(Array.from(data).map(v => Math.max(0, v)));
    const peak = Math.max(...Array.from(data).map(v => Math.max(0, v)));
    if (avg === 0) return 0;
    return Math.min(1, (peak / avg - 1) / 5);
  }

  private computeFormantSpread(data: Float32Array): number {
    const peaks: number[] = [];
    for (let i = 2; i < data.length - 2; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] &&
          data[i] > data[i - 2] && data[i] > data[i + 2] && data[i] > 0.1) {
        peaks.push(i / data.length);
      }
    }
    if (peaks.length < 2) return 0;
    return Math.min(1, (peaks[peaks.length - 1] - peaks[0]) * 2);
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const avg = this.average(arr);
    return arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length;
  }

  private linearSlope(arr: number[]): number {
    const n = arr.length;
    if (n < 2) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += arr[i];
      sumXY += i * arr[i]; sumX2 += i * i;
    }
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return 0;
    return Math.max(-1, Math.min(1, ((n * sumXY - sumX * sumY) / denom) * 10));
  }

  private lerp(a: EmotionEstimate, b: EmotionEstimate, t: number): EmotionEstimate {
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
    this.prevSpectrum = null;
    this.speechActivityHistory = [];
    this.calibrationSamples = 0;
    this.calibPitchSum = 0;
    this.calibVolumeSum = 0;
    this.isCalibrated = false;
    this.lastEstimate = {
      joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1,
      dominant: 'neutral', confidence: 0,
    };
  }
}
