/**
 * cocoro — Emotion Timeline
 * セッション中の感情の流れをリアルタイムで記録・可視化
 * 
 * 反復121-125:
 * - フレームごとの支配的感情を記録
 * - セッション後にタイムラインとして表示
 * - ピークモーメントとの関連付け
 * = 「あの瞬間、全員が笑ってた」がデータで見える
 */

export interface EmotionSnapshot {
  timestamp: number;          // seconds since session start
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  dominant: string;
  speakerCount: number;
  participantCount: number;
}

export class EmotionTimeline {
  private snapshots: EmotionSnapshot[] = [];
  private sessionStart: number;
  private lastSnapshotTime = 0;
  private readonly INTERVAL = 2; // seconds between snapshots

  constructor() {
    this.sessionStart = Date.now();
  }

  /**
   * 現在の感情状態をスナップショット
   */
  record(state: {
    emotions: { joy: number; anger: number; sorrow: number; surprise: number }[];
    speakerCount: number;
    participantCount: number;
  }): void {
    const elapsed = (Date.now() - this.sessionStart) / 1000;
    if (elapsed - this.lastSnapshotTime < this.INTERVAL) return;

    // Average all participants' emotions
    const avg = { joy: 0, anger: 0, sorrow: 0, surprise: 0 };
    if (state.emotions.length > 0) {
      for (const e of state.emotions) {
        avg.joy += e.joy;
        avg.anger += e.anger;
        avg.sorrow += e.sorrow;
        avg.surprise += e.surprise;
      }
      const n = state.emotions.length;
      avg.joy /= n;
      avg.anger /= n;
      avg.sorrow /= n;
      avg.surprise /= n;
    }

    // Find dominant
    const pairs = [
      ['joy', avg.joy],
      ['anger', avg.anger],
      ['sorrow', avg.sorrow],
      ['surprise', avg.surprise],
    ] as const;
    const dominant = pairs.reduce((best, curr) =>
      curr[1] > best[1] ? curr : best
    )[0];

    this.snapshots.push({
      timestamp: elapsed,
      ...avg,
      dominant: avg.joy + avg.anger + avg.sorrow + avg.surprise < 0.1 ? 'neutral' : dominant,
      speakerCount: state.speakerCount,
      participantCount: state.participantCount,
    });

    this.lastSnapshotTime = elapsed;
  }

  /**
   * タイムラインデータをセッションサマリー用にダウンサンプル
   */
  getSummary(maxPoints: number = 30): EmotionSnapshot[] {
    if (this.snapshots.length <= maxPoints) return [...this.snapshots];

    const step = Math.ceil(this.snapshots.length / maxPoints);
    const sampled: EmotionSnapshot[] = [];
    for (let i = 0; i < this.snapshots.length; i += step) {
      sampled.push(this.snapshots[i]);
    }
    return sampled;
  }

  /**
   * セッション全体の支配的感情を返す
   */
  getDominantEmotion(): string {
    if (this.snapshots.length === 0) return 'neutral';

    const counts: Record<string, number> = {};
    for (const s of this.snapshots) {
      counts[s.dominant] = (counts[s.dominant] ?? 0) + 1;
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'neutral';
  }

  /**
   * 感情の変化率（ボラティリティ）= セッションの「ドラマ度」
   */
  getEmotionalVolatility(): number {
    if (this.snapshots.length < 3) return 0;

    let totalChange = 0;
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];
      totalChange += Math.abs(curr.joy - prev.joy)
        + Math.abs(curr.anger - prev.anger)
        + Math.abs(curr.sorrow - prev.sorrow)
        + Math.abs(curr.surprise - prev.surprise);
    }

    return totalChange / (this.snapshots.length - 1);
  }

  /**
   * 全スナップショット
   */
  getAll(): EmotionSnapshot[] {
    return [...this.snapshots];
  }
}
