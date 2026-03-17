/**
 * cocoro — Speech Rhythm Analyzer
 * 会話のリズムパターンを分析
 * 
 * 反復131-135:
 * - 発話のテンポ（速い/ゆっくり）
 * - ターンテイキングのパターン（一人独占/均等分散/ピンポン）
 * - 沈黙の長さと頻度
 * = 「会話の質」を数値化→UX改善フィードバック
 */

export interface TurnEvent {
  speakerId: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ConversationRhythm {
  avgTurnDuration: number;          // 平均ターン時間（秒）
  turnTakingBalance: number;        // 0-1: 0=一人独占、1=完全均等
  avgSilenceBetweenTurns: number;   // ターン間の平均沈黙（秒）
  tempo: 'slow' | 'moderate' | 'fast';
  style: 'monologue' | 'interview' | 'pingpong' | 'free';
  totalTurns: number;
}

export class SpeechRhythmAnalyzer {
  private turns: TurnEvent[] = [];
  private activeSpeaker: string | null = null;
  private turnStartTime = 0;
  private lastTurnEndTime = 0;

  /**
   * フレームごとに呼ばれる
   */
  update(activeSpeakers: string[]): void {
    const now = Date.now() / 1000;

    if (activeSpeakers.length === 0) {
      // 沈黙
      if (this.activeSpeaker) {
        // ターン終了
        this.turns.push({
          speakerId: this.activeSpeaker,
          startTime: this.turnStartTime,
          endTime: now,
          duration: now - this.turnStartTime,
        });
        this.lastTurnEndTime = now;
        this.activeSpeaker = null;
      }
    } else {
      const primarySpeaker = activeSpeakers[0];
      if (primarySpeaker !== this.activeSpeaker) {
        // 話者交代
        if (this.activeSpeaker) {
          this.turns.push({
            speakerId: this.activeSpeaker,
            startTime: this.turnStartTime,
            endTime: now,
            duration: now - this.turnStartTime,
          });
          this.lastTurnEndTime = now;
        }
        this.activeSpeaker = primarySpeaker;
        this.turnStartTime = now;
      }
    }
  }

  /**
   * 会話リズム分析結果を返す
   */
  analyze(): ConversationRhythm {
    if (this.turns.length === 0) {
      return {
        avgTurnDuration: 0,
        turnTakingBalance: 0,
        avgSilenceBetweenTurns: 0,
        tempo: 'moderate',
        style: 'monologue',
        totalTurns: 0,
      };
    }

    // 平均ターン時間
    const avgDuration = this.turns.reduce((s, t) => s + t.duration, 0) / this.turns.length;

    // ターンテイキングバランス
    const speakerDurations = new Map<string, number>();
    for (const t of this.turns) {
      speakerDurations.set(t.speakerId, (speakerDurations.get(t.speakerId) ?? 0) + t.duration);
    }
    const totalDuration = Array.from(speakerDurations.values()).reduce((s, d) => s + d, 0);
    const speakerCount = speakerDurations.size;

    let balance = 0;
    if (speakerCount > 1 && totalDuration > 0) {
      const expected = totalDuration / speakerCount;
      const deviations = Array.from(speakerDurations.values())
        .map(d => Math.abs(d - expected) / expected);
      balance = 1 - Math.min(1, deviations.reduce((s, d) => s + d, 0) / speakerCount);
    }

    // 平均沈黙時間
    let totalSilence = 0;
    let silenceCount = 0;
    for (let i = 1; i < this.turns.length; i++) {
      const gap = this.turns[i].startTime - this.turns[i - 1].endTime;
      if (gap > 0.3) { // 0.3秒以上を沈黙とカウント
        totalSilence += gap;
        silenceCount++;
      }
    }
    const avgSilence = silenceCount > 0 ? totalSilence / silenceCount : 0;

    // テンポ判定
    const tempo = avgDuration < 3 ? 'fast' : avgDuration < 8 ? 'moderate' : 'slow';

    // スタイル判定
    let style: ConversationRhythm['style'] = 'free';
    if (speakerCount <= 1) {
      style = 'monologue';
    } else if (balance < 0.3) {
      style = 'interview'; // 一人が圧倒的に多い
    } else if (avgDuration < 4 && balance > 0.6) {
      style = 'pingpong'; // 短いターンで均等
    }

    return {
      avgTurnDuration: Math.round(avgDuration * 10) / 10,
      turnTakingBalance: Math.round(balance * 100) / 100,
      avgSilenceBetweenTurns: Math.round(avgSilence * 10) / 10,
      tempo,
      style,
      totalTurns: this.turns.length,
    };
  }

  /**
   * 直近のターン数（アクティビティ指標）
   */
  getRecentTurnRate(windowSeconds: number = 60): number {
    const now = Date.now() / 1000;
    const recentTurns = this.turns.filter(t => now - t.endTime < windowSeconds);
    return recentTurns.length / (windowSeconds / 60); // turns per minute
  }
}
