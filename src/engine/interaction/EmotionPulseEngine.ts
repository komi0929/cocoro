/**
 * kokoro — Emotion Pulse
 * 会話中の感情をリアルタイムで可視化
 *
 * 声のトーン/テンポ/音量から感情を推定し、
 * 空間全体の「ムード」として表示
 * = 「今この部屋、盛り上がってる？」が視覚でわかる
 */

export type Emotion = 'excited' | 'happy' | 'calm' | 'curious' | 'bored' | 'tense';

export interface EmotionSample {
  participantId: string;
  emotion: Emotion;
  intensity: number; // 0-1
  timestamp: number;
}

export interface RoomMood {
  dominant: Emotion;
  intensity: number;
  distribution: Record<Emotion, number>;
  trend: 'rising' | 'stable' | 'declining';
  color: string;       // CSS color for the mood
  suggestion: string;  // コンテキストに合った提案
}

const EMOTION_COLORS: Record<Emotion, string> = {
  excited: 'hsl(30, 90%, 60%)',
  happy: 'hsl(50, 85%, 65%)',
  calm: 'hsl(220, 60%, 55%)',
  curious: 'hsl(270, 70%, 60%)',
  bored: 'hsl(200, 20%, 45%)',
  tense: 'hsl(0, 60%, 50%)',
};

const MOOD_SUGGESTIONS: Record<Emotion, string[]> = {
  excited: ['この盛り上がり、最高！🔥', 'みんなノッてるね！'],
  happy: ['いい雰囲気です ☺️', '楽しそう！'],
  calm: ['落ち着いたトーンだね', 'まったりモード ☕'],
  curious: ['みんな興味津々！', '深い話になってきた 🤔'],
  bored: ['トピック変えてみる？ 🃏', 'ゲームやってみる？ 🎲'],
  tense: ['ちょっと一息入れませんか？', 'リラックスBGM流そうか ☕'],
};

export class EmotionPulseEngine {
  private samples: EmotionSample[] = [];
  private previousMood: RoomMood | null = null;

  /**
   * 声の特徴から感情を推定
   */
  estimateEmotion(params: {
    pitch: number;
    volume: number;
    speakingRate: number;
    pitchVariance: number;
  }): Emotion {
    const { pitch, volume, speakingRate, pitchVariance } = params;

    // High pitch + high volume + fast → excited
    if (pitch > 250 && volume > 0.7 && speakingRate > 4) return 'excited';
    // High pitch + moderate volume → happy
    if (pitch > 200 && volume > 0.4 && pitchVariance > 30) return 'happy';
    // Low pitch + slow + low variance → calm
    if (pitch < 180 && speakingRate < 3 && pitchVariance < 15) return 'calm';
    // High pitch variance → curious (asking questions)
    if (pitchVariance > 40) return 'curious';
    // Low volume + slow → bored
    if (volume < 0.2 && speakingRate < 2) return 'bored';
    // High volume + low pitch → tense
    if (volume > 0.8 && pitch < 160) return 'tense';

    return 'calm';
  }

  /**
   * サンプルを追加
   */
  addSample(participantId: string, emotion: Emotion, intensity: number): void {
    this.samples.push({
      participantId, emotion, intensity, timestamp: Date.now(),
    });
    // 30秒分のみ保持
    const cutoff = Date.now() - 30000;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  /**
   * ルーム全体のムードを計算
   */
  computeRoomMood(): RoomMood {
    const distribution: Record<Emotion, number> = {
      excited: 0, happy: 0, calm: 0, curious: 0, bored: 0, tense: 0,
    };

    if (this.samples.length === 0) {
      return {
        dominant: 'calm', intensity: 0.3, distribution,
        trend: 'stable', color: EMOTION_COLORS.calm,
        suggestion: '',
      };
    }

    for (const s of this.samples) {
      distribution[s.emotion] += s.intensity;
    }

    // Normalize
    const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
    for (const key of Object.keys(distribution) as Emotion[]) {
      distribution[key] /= total;
    }

    const dominant = (Object.entries(distribution) as [Emotion, number][])
      .sort(([, a], [, b]) => b - a)[0][0];

    const intensity = Math.min(1, this.samples.reduce((a, s) => a + s.intensity, 0) / this.samples.length);

    // Trend
    const recentSamples = this.samples.filter(s => s.timestamp > Date.now() - 10000);
    const olderSamples = this.samples.filter(s => s.timestamp <= Date.now() - 10000);
    const recentAvg = recentSamples.length > 0
      ? recentSamples.reduce((a, s) => a + s.intensity, 0) / recentSamples.length : 0;
    const olderAvg = olderSamples.length > 0
      ? olderSamples.reduce((a, s) => a + s.intensity, 0) / olderSamples.length : 0;
    const trend = recentAvg > olderAvg + 0.1 ? 'rising' :
                  recentAvg < olderAvg - 0.1 ? 'declining' : 'stable';

    const suggestions = MOOD_SUGGESTIONS[dominant];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    const mood: RoomMood = {
      dominant, intensity, distribution, trend,
      color: EMOTION_COLORS[dominant], suggestion,
    };

    this.previousMood = mood;
    return mood;
  }

  getRoomMood(): RoomMood | null { return this.previousMood; }
}
