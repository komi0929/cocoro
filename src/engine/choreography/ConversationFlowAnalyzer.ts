/**
 * cocoro — Conversation Flow Analyzer
 * 「良い会話」の条件を分析し、フロー状態を検出
 * 
 * 反復146-150:
 * - フロー状態 = テンポが安定 + ターンバランスが良い + 感情が豊か
 * - フロー状態に入ると空間全体が輝き出す
 * - フロー状態が続くと「ゾーン」に突入（特別エフェクト）
 * = チクセントミハイのフロー理論を会話に適用
 */

export type FlowLevel = 'idle' | 'warming' | 'flowing' | 'zone';

export interface FlowState {
  level: FlowLevel;
  score: number;         // 0-1
  streakSeconds: number; // フロー状態の連続時間
  factors: {
    rhythmBalance: number;    // ターンテイキングのバランス
    emotionalRichness: number; // 感情の多様性
    engagement: number;       // 参加率
    tempo: number;            // テンポの安定性
  };
}

export class ConversationFlowAnalyzer {
  private flowStartTime = 0;
  private currentLevel: FlowLevel = 'idle';
  private scoreHistory: number[] = [];
  private readonly HISTORY_SIZE = 30;

  /**
   * 各種分析結果からフロースコアを計算
   */
  analyze(params: {
    turnBalance: number;      // 0-1 from SpeechRhythmAnalyzer
    emotionalVolatility: number; // from EmotionTimeline
    speakerRatio: number;     // active speakers / total participants
    avgTurnDuration: number;  // seconds
    silenceBetweenTurns: number; // seconds
  }): FlowState {
    const {
      turnBalance,
      emotionalVolatility,
      speakerRatio,
      avgTurnDuration,
      silenceBetweenTurns,
    } = params;

    // Factor 1: Rhythm Balance (0-1)
    const rhythmBalance = turnBalance;

    // Factor 2: Emotional Richness (too much = chaotic, too little = boring)
    const emotionalRichness = 1 - Math.abs(emotionalVolatility - 0.3) * 3;

    // Factor 3: Engagement (how many people are participating)
    const engagement = Math.min(1, speakerRatio * 2);

    // Factor 4: Tempo (sweet spot: 4-8 second turns, 0.5-2 second gaps)
    const turnScore = 1 - Math.min(1, Math.abs(avgTurnDuration - 6) / 6);
    const gapScore = 1 - Math.min(1, Math.abs(silenceBetweenTurns - 1) / 3);
    const tempo = (turnScore + gapScore) / 2;

    // Combined score
    const rawScore = (
      rhythmBalance * 0.3 +
      Math.max(0, emotionalRichness) * 0.25 +
      engagement * 0.25 +
      tempo * 0.2
    );

    // Smoothing
    this.scoreHistory.push(rawScore);
    if (this.scoreHistory.length > this.HISTORY_SIZE) {
      this.scoreHistory.shift();
    }
    const smoothScore = this.scoreHistory.reduce((s, v) => s + v, 0) / this.scoreHistory.length;

    // Level thresholds
    let newLevel: FlowLevel = 'idle';
    if (smoothScore >= 0.7) newLevel = 'zone';
    else if (smoothScore >= 0.5) newLevel = 'flowing';
    else if (smoothScore >= 0.3) newLevel = 'warming';

    // Track flow streak
    if (newLevel !== this.currentLevel) {
      if (newLevel === 'flowing' || newLevel === 'zone') {
        if (this.currentLevel !== 'flowing' && this.currentLevel !== 'zone') {
          this.flowStartTime = Date.now();
        }
      }
      this.currentLevel = newLevel;
    }

    const streakSeconds = (this.currentLevel === 'flowing' || this.currentLevel === 'zone')
      ? (Date.now() - this.flowStartTime) / 1000
      : 0;

    return {
      level: this.currentLevel,
      score: Math.round(smoothScore * 100) / 100,
      streakSeconds: Math.round(streakSeconds),
      factors: {
        rhythmBalance: Math.round(rhythmBalance * 100) / 100,
        emotionalRichness: Math.round(Math.max(0, emotionalRichness) * 100) / 100,
        engagement: Math.round(engagement * 100) / 100,
        tempo: Math.round(tempo * 100) / 100,
      },
    };
  }

  /**
   * フロー状態が「ゾーン」に達しているか
   */
  isInZone(): boolean {
    return this.currentLevel === 'zone';
  }

  /**
   * フロースコアの最近の傾向（上昇中/下降中/安定）
   */
  getTrend(): 'rising' | 'falling' | 'stable' {
    if (this.scoreHistory.length < 5) return 'stable';
    const recent = this.scoreHistory.slice(-5);
    const older = this.scoreHistory.slice(-10, -5);
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;
    const diff = recentAvg - olderAvg;

    if (diff > 0.05) return 'rising';
    if (diff < -0.05) return 'falling';
    return 'stable';
  }
}
