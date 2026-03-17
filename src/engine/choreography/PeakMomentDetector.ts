/**
 * cocoro — Peak Moment Detector
 * 「伝説の瞬間」を自動検出してタイムラインに記録
 * 
 * 反復51-55:
 * - 全員が同時に笑った瞬間
 * - 長い沈黙の後の最初の声
 * - 盛り上がりがピークに達した瞬間
 * = セッション後に振り返れる「ハイライト」を自動生成
 */

export interface PeakMoment {
  id: string;
  timestamp: number;
  type: 'collective_laugh' | 'silence_break' | 'peak_gravity' | 'emotional_resonance';
  label: string;
  emoji: string;
  participantCount: number;
  duration: number; // seconds the moment lasted
  intensity: number; // 0-1
}

export class PeakMomentDetector {
  private moments: PeakMoment[] = [];
  private lastSilenceStart = 0;
  private wasSilent = true;
  private peakGravityReached = false;
  private gravityStartTime = 0;
  private collectiveLaughStartTime = 0;
  private isCollectiveLaughing = false;
  private sessionStartTime: number;

  constructor() {
    this.sessionStartTime = Date.now();
  }

  /**
   * フレームごとに呼ばれる。ストアの状態を分析してピークモーメントを検出
   */
  analyze(state: {
    phase: string;
    density: number;
    activeSpeakers: string[];
    participantCount: number;
    emotions: { joy: number; surprise: number }[];
  }): PeakMoment | null {
    const now = Date.now();
    const elapsed = (now - this.sessionStartTime) / 1000;

    // === 1. Silence Break: 長い沈黙の後の最初の声 ===
    if (state.activeSpeakers.length === 0) {
      if (!this.wasSilent) {
        this.lastSilenceStart = now;
        this.wasSilent = true;
      }
    } else if (this.wasSilent) {
      const silenceDuration = (now - this.lastSilenceStart) / 1000;
      this.wasSilent = false;

      if (silenceDuration > 8) { // 8秒以上の沈黙後
        const moment: PeakMoment = {
          id: `sb-${now}`,
          timestamp: elapsed,
          type: 'silence_break',
          label: `${Math.round(silenceDuration)}秒の沈黙を破る声`,
          emoji: '💫',
          participantCount: state.participantCount,
          duration: silenceDuration,
          intensity: Math.min(1, silenceDuration / 30),
        };
        this.moments.push(moment);
        return moment;
      }
    }

    // === 2. Peak Gravity: 密度が0.7を超えた瞬間 ===
    if (state.density >= 0.7 && !this.peakGravityReached) {
      this.peakGravityReached = true;
      this.gravityStartTime = now;
      const moment: PeakMoment = {
        id: `pg-${now}`,
        timestamp: elapsed,
        type: 'peak_gravity',
        label: '盛り上がりが最高潮に！',
        emoji: '🔥',
        participantCount: state.participantCount,
        duration: 0,
        intensity: state.density,
      };
      this.moments.push(moment);
      return moment;
    }
    if (state.density < 0.5) {
      this.peakGravityReached = false;
    }

    // === 3. Collective Laugh: 過半数がjoy状態 ===
    if (state.emotions.length >= 2) {
      const joyCount = state.emotions.filter((e) => e.joy > 0.5).length;
      const ratio = joyCount / state.emotions.length;

      if (ratio >= 0.6 && !this.isCollectiveLaughing) {
        this.isCollectiveLaughing = true;
        this.collectiveLaughStartTime = now;
      } else if (ratio < 0.4 && this.isCollectiveLaughing) {
        this.isCollectiveLaughing = false;
        const laughDuration = (now - this.collectiveLaughStartTime) / 1000;

        if (laughDuration >= 2) { // 2秒以上の集団笑い
          const moment: PeakMoment = {
            id: `cl-${now}`,
            timestamp: elapsed,
            type: 'collective_laugh',
            label: `みんなで${Math.round(laughDuration)}秒間笑った`,
            emoji: '😂',
            participantCount: state.participantCount,
            duration: laughDuration,
            intensity: Math.min(1, laughDuration / 10),
          };
          this.moments.push(moment);
          return moment;
        }
      }
    }

    return null;
  }

  /**
   * セッションのハイライトを返す
   */
  getHighlights(): PeakMoment[] {
    return [...this.moments]
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10);
  }

  /**
   * 全モーメントを返す
   */
  getAllMoments(): PeakMoment[] {
    return [...this.moments];
  }

  /**
   * セッションサマリーを生成
   */
  getSessionSummary(): {
    totalMoments: number;
    bestMoment: PeakMoment | null;
    sessionDurationMinutes: number;
  } {
    return {
      totalMoments: this.moments.length,
      bestMoment: this.moments.reduce<PeakMoment | null>(
        (best, m) => (!best || m.intensity > best.intensity ? m : best),
        null,
      ),
      sessionDurationMinutes: Math.round((Date.now() - this.sessionStartTime) / 60000),
    };
  }
}
