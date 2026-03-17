/**
 * kokoro — Anti-Churn System
 * 離脱予兆の検知と介入 — リテンションの最後の砦
 *
 * - 離脱パターンの学習(訪問頻度低下/セッション短縮/リアクション減少)
 * - 段階的な介入(通知→特典→人的フォロー)
 * - Win-back戦略(離脱後の復帰施策)
 */

export type ChurnRisk = 'safe' | 'at_risk' | 'high_risk' | 'churned';

export interface UserEngagement {
  lastVisit: number;
  visitFrequency: number;      // visits per week (moving avg)
  avgSessionMinutes: number;
  recentSessions: number[];    // last 5 session durations
  recentReactions: number[];   // last 5 session reaction counts
  friendInteractions: number;  // this week
}

export interface ChurnAnalysis {
  risk: ChurnRisk;
  score: number;       // 0-100 (lower = more at risk)
  signals: string[];
  intervention: string | null;
  urgency: number;     // 1-5
}

const STORAGE_KEY = 'kokoro_engagement';

export class AntiChurnSystem {
  private engagement: UserEngagement;

  constructor() {
    this.engagement = this.loadEngagement();
  }

  private loadEngagement(): UserEngagement {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      lastVisit: Date.now(), visitFrequency: 0,
      avgSessionMinutes: 0, recentSessions: [],
      recentReactions: [], friendInteractions: 0,
    };
  }

  private saveEngagement(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.engagement));
    } catch { /* full */ }
  }

  /**
   * セッション記録
   */
  recordSession(durationMinutes: number, reactionCount: number): void {
    this.engagement.lastVisit = Date.now();
    this.engagement.recentSessions.push(durationMinutes);
    if (this.engagement.recentSessions.length > 5) this.engagement.recentSessions.shift();
    this.engagement.recentReactions.push(reactionCount);
    if (this.engagement.recentReactions.length > 5) this.engagement.recentReactions.shift();

    this.engagement.avgSessionMinutes = this.engagement.recentSessions.reduce((a, b) => a + b, 0)
      / this.engagement.recentSessions.length;

    this.saveEngagement();
  }

  /**
   * 離脱リスクを分析
   */
  analyze(): ChurnAnalysis {
    const signals: string[] = [];
    let score = 100;

    const daysSinceLastVisit = (Date.now() - this.engagement.lastVisit) / 86400000;

    // 1. 訪問頻度の低下
    if (daysSinceLastVisit > 7) {
      score -= 40;
      signals.push('7日以上ログインなし');
    } else if (daysSinceLastVisit > 3) {
      score -= 20;
      signals.push('3日以上ログインなし');
    }

    // 2. セッション時間の短縮傾向
    const sessions = this.engagement.recentSessions;
    if (sessions.length >= 3) {
      const recent = sessions.slice(-2).reduce((a, b) => a + b, 0) / 2;
      const older = sessions.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(1, sessions.length - 2);
      if (recent < older * 0.5) {
        score -= 25;
        signals.push('セッション時間が半分以下に');
      }
    }

    // 3. リアクションの減少
    const reactions = this.engagement.recentReactions;
    if (reactions.length >= 3) {
      const recentR = reactions.slice(-2).reduce((a, b) => a + b, 0) / 2;
      if (recentR < 1) {
        score -= 15;
        signals.push('リアクションがほぼゼロ');
      }
    }

    // 4. フレンド交流の欠如
    if (this.engagement.friendInteractions < 1 && sessions.length > 3) {
      score -= 10;
      signals.push('フレンドとの交流なし');
    }

    score = Math.max(0, score);

    let risk: ChurnRisk;
    let intervention: string | null = null;
    let urgency = 1;

    if (score > 70) {
      risk = 'safe';
    } else if (score > 40) {
      risk = 'at_risk';
      intervention = 'おかえりボーナス: 今日ログインすると50コイン！';
      urgency = 2;
    } else if (score > 10) {
      risk = 'high_risk';
      intervention = '特別イベントに招待されました！フレンドも待っています';
      urgency = 4;
    } else {
      risk = 'churned';
      intervention = 'あなたのアバターが寂しがっています... 久しぶりに遊びに来ませんか？';
      urgency = 5;
    }

    return { risk, score, signals, intervention, urgency };
  }

  getRisk(): ChurnRisk { return this.analyze().risk; }
}
