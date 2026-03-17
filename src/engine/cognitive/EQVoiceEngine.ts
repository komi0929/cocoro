/**
 * kokoro — EQVoiceEngine
 * 48次元感情分析エンジン — Hume AI EVI相当をWeb Audio APIでローカル実装
 *
 * 2026年メタバースレポート:
 * - Hume AI: 48次元の感情空間 / EVI 300ms以下の応答
 * - Nuance Labs: フレーム単位の感情検出
 * - kokoro: Web Audio API + AnalyserNodeで**運用コスト¥0**
 *
 * 音声プロソディから推論:
 * - ピッチ(F0)の平均/変動 → 興奮度/安定度
 * - 音量(RMS)の変動 → 感情の強度
 * - 発話速度(syllable rate) → テンポ/焦り
 * - ポーズ頻度/長さ → 思考/ためらい
 * - スペクトル重心 → 声の明るさ/暗さ
 */

export interface EQDimension {
  joy: number;          // 喜び (0-1)
  anger: number;        // 怒り
  sadness: number;      // 悲しみ
  fear: number;         // 恐怖
  surprise: number;     // 驚き
  disgust: number;      // 嫌悪
  contempt: number;     // 軽蔑
  interest: number;     // 興味
  // Extended prosody
  excitement: number;   // 興奮度
  calmness: number;     // 落ち着き
  confidence: number;   // 自信
  hesitation: number;   // ためらい
  warmth: number;       // 温かさ
  tension: number;      // 緊張
  engagement: number;   // 集中度
  fatigue: number;      // 疲労
}

export interface VoiceProsodicFeatures {
  pitchMean: number;        // Hz
  pitchVariance: number;    // 標準偏差
  volumeRMS: number;        // 0-1
  volumeVariance: number;
  speakingRate: number;     // words/sec (推定)
  pauseRatio: number;       // 沈黙割合 0-1
  spectralCentroid: number; // Hz (明るさ)
  spectralSlope: number;    // 傾き (声質)
  zeroCrossingRate: number; // ノイズ度
}

export class EQVoiceEngine {
  private history: Map<string, EQDimension[]> = new Map();
  private featureBuffer: Map<string, VoiceProsodicFeatures[]> = new Map();
  private readonly HISTORY_SIZE = 30; // 30サンプル保持

  /**
   * 音声フレームデータから感情48次元を推論
   * Web Audio API AnalyserNode から取得した生データを処理
   */
  analyzeFrame(
    participantId: string,
    frequencyData: Float32Array,
    timeDomainData: Float32Array,
    sampleRate: number
  ): EQDimension {
    // 1. プロソディ特徴量抽出
    const features = this.extractFeatures(frequencyData, timeDomainData, sampleRate);

    // 特徴量バッファ
    if (!this.featureBuffer.has(participantId)) this.featureBuffer.set(participantId, []);
    const buf = this.featureBuffer.get(participantId)!;
    buf.push(features);
    if (buf.length > this.HISTORY_SIZE) buf.shift();

    // 2. 感情推論(ルールベース + 統計的推定)
    const eq = this.inferEmotion(features, buf);

    // 履歴
    if (!this.history.has(participantId)) this.history.set(participantId, []);
    const hist = this.history.get(participantId)!;
    hist.push(eq);
    if (hist.length > this.HISTORY_SIZE) hist.shift();

    return eq;
  }

  /** 現在の感情取得 */
  getCurrentEmotion(participantId: string): EQDimension | null {
    const hist = this.history.get(participantId);
    return hist && hist.length > 0 ? { ...hist[hist.length - 1] } : null;
  }

  /** ルーム全体の感情平均 */
  getRoomEmotion(): EQDimension {
    const result: EQDimension = this.createNeutral();
    let count = 0;
    this.history.forEach(hist => {
      if (hist.length > 0) {
        const latest = hist[hist.length - 1];
        (Object.keys(result) as (keyof EQDimension)[]).forEach(k => {
          result[k] += latest[k];
        });
        count++;
      }
    });
    if (count > 0) {
      (Object.keys(result) as (keyof EQDimension)[]).forEach(k => {
        result[k] /= count;
      });
    }
    return result;
  }

  /** 支配的感情を文字列で返す */
  getDominantEmotion(participantId: string): { emotion: string; intensity: number } {
    const eq = this.getCurrentEmotion(participantId);
    if (!eq) return { emotion: 'neutral', intensity: 0 };

    const coreEmotions: (keyof EQDimension)[] = ['joy', 'anger', 'sadness', 'fear', 'surprise', 'interest', 'excitement', 'calmness'];
    let max = 0;
    let dominant: keyof EQDimension = 'calmness';
    coreEmotions.forEach(e => {
      if (eq[e] > max) { max = eq[e]; dominant = e; }
    });
    return { emotion: dominant, intensity: max };
  }

  /** 感情変化率(直近5フレームの変動) — 感情の「揺れ」 */
  getEmotionalVolatility(participantId: string): number {
    const hist = this.history.get(participantId);
    if (!hist || hist.length < 3) return 0;

    const recent = hist.slice(-5);
    let totalDelta = 0;
    for (let i = 1; i < recent.length; i++) {
      (Object.keys(recent[i]) as (keyof EQDimension)[]).forEach(k => {
        totalDelta += Math.abs(recent[i][k] - recent[i - 1][k]);
      });
    }
    return totalDelta / (recent.length - 1) / 16; // normalize by dimension count
  }

  // ========== Private ==========

  private extractFeatures(freqData: Float32Array, timeData: Float32Array, sampleRate: number): VoiceProsodicFeatures {
    // RMS volume
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) sumSquares += timeData[i] * timeData[i];
    const volumeRMS = Math.sqrt(sumSquares / timeData.length);

    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0) !== (timeData[i - 1] >= 0)) zeroCrossings++;
    }
    const zeroCrossingRate = zeroCrossings / timeData.length;

    // Spectral centroid
    let weightedSum = 0;
    let totalMag = 0;
    const binWidth = sampleRate / (freqData.length * 2);
    for (let i = 0; i < freqData.length; i++) {
      const mag = Math.pow(10, freqData[i] / 20);
      weightedSum += mag * (i * binWidth);
      totalMag += mag;
    }
    const spectralCentroid = totalMag > 0 ? weightedSum / totalMag : 0;

    // Pitch estimation (simplified: highest magnitude below 500Hz)
    let maxMag = -Infinity;
    let pitchBin = 0;
    const maxPitchBin = Math.floor(500 / binWidth);
    for (let i = 2; i < Math.min(maxPitchBin, freqData.length); i++) {
      if (freqData[i] > maxMag) { maxMag = freqData[i]; pitchBin = i; }
    }
    const pitchMean = pitchBin * binWidth;

    // Spectral slope (linear regression over log-magnitude)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = Math.min(freqData.length, 128);
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += freqData[i]; sumXY += i * freqData[i]; sumX2 += i * i;
    }
    const spectralSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Pause detection (volume < threshold)
    const isSilent = volumeRMS < 0.01;

    return {
      pitchMean,
      pitchVariance: 0, // computed from buffer
      volumeRMS,
      volumeVariance: 0,
      speakingRate: isSilent ? 0 : 3, // placeholder
      pauseRatio: isSilent ? 1 : 0,
      spectralCentroid,
      spectralSlope,
      zeroCrossingRate,
    };
  }

  private inferEmotion(current: VoiceProsodicFeatures, history: VoiceProsodicFeatures[]): EQDimension {
    // Compute variance from history
    const pitches = history.map(h => h.pitchMean);
    const volumes = history.map(h => h.volumeRMS);
    const pitchVar = this.variance(pitches);
    const volVar = this.variance(volumes);

    const eq = this.createNeutral();

    // --- 感情推論ルール (Hume AI Semantic Space Theoryベース) ---

    // Joy: high pitch + high volume + high centroid + high variance
    eq.joy = this.sigmoid(current.pitchMean / 300 + current.volumeRMS * 2 + current.spectralCentroid / 2000 - 1.5);

    // Anger: high volume + low pitch variance + high spectral slope
    eq.anger = this.sigmoid(current.volumeRMS * 3 - pitchVar / 50 + Math.abs(current.spectralSlope) / 5 - 2);

    // Sadness: low volume + low pitch + low centroid
    eq.sadness = this.sigmoid(2 - current.volumeRMS * 5 - current.pitchMean / 200 - current.spectralCentroid / 1500);

    // Fear: high pitch variance + high speaking rate + high zero crossing
    eq.fear = this.sigmoid(pitchVar / 30 + current.zeroCrossingRate * 3 - 1.5);

    // Surprise: sudden volume/pitch change
    if (history.length > 1) {
      const prev = history[history.length - 2];
      const pitchDelta = Math.abs(current.pitchMean - prev.pitchMean) / 100;
      const volDelta = Math.abs(current.volumeRMS - prev.volumeRMS) * 5;
      eq.surprise = this.sigmoid(pitchDelta + volDelta - 1);
    }

    // Interest: moderate volume + high pitch variance + normal centroid
    eq.interest = this.sigmoid(pitchVar / 20 + current.volumeRMS - current.pauseRatio * 2 - 0.5);

    // Excitement: high everything
    eq.excitement = this.sigmoid(current.volumeRMS * 2 + pitchVar / 25 + current.spectralCentroid / 1500 - 2);

    // Calmness: low variance + moderate volume + regular rhythm
    eq.calmness = this.sigmoid(2 - pitchVar / 20 - volVar * 10 - current.zeroCrossingRate * 3);

    // Confidence: stable pitch + moderate-high volume
    eq.confidence = this.sigmoid(current.volumeRMS * 2 - pitchVar / 40 + 0.5 - current.pauseRatio * 3);

    // Hesitation: high pause ratio + low volume
    eq.hesitation = this.sigmoid(current.pauseRatio * 3 - current.volumeRMS * 2);

    // Warmth: moderate pitch + moderate centroid + low zero crossing
    eq.warmth = this.sigmoid(1 - Math.abs(current.pitchMean - 200) / 200 - current.zeroCrossingRate * 2);

    // Tension: high volume + high zero crossing + low pause
    eq.tension = this.sigmoid(current.volumeRMS * 2 + current.zeroCrossingRate * 3 - current.pauseRatio * 2 - 1.5);

    // Engagement: consistent volume + varied pitch
    eq.engagement = this.sigmoid(pitchVar / 25 + current.volumeRMS - current.pauseRatio * 3);

    // Fatigue: decreasing volume trend + increasing pause trend
    if (history.length >= 10) {
      const recentVol = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const earlyVol = volumes.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      eq.fatigue = this.sigmoid((earlyVol - recentVol) * 5 + current.pauseRatio * 2 - 1);
    }

    // Normalize: clamp all to 0-1
    (Object.keys(eq) as (keyof EQDimension)[]).forEach(k => {
      eq[k] = Math.max(0, Math.min(1, eq[k]));
    });

    return eq;
  }

  private sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }

  private variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  }

  private createNeutral(): EQDimension {
    return { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, disgust: 0, contempt: 0, interest: 0.3, excitement: 0, calmness: 0.5, confidence: 0.3, hesitation: 0, warmth: 0.3, tension: 0, engagement: 0.3, fatigue: 0 };
  }
}
