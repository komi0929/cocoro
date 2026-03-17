/**
 * cocoro — Collective Insight
 * みんなの発言から自動要約 — popopoにない「集合知」
 *
 * サイクル26: 「会話が消えない」価値の創出
 * - セッション中のトピック/キーワード自動抽出
 * - 参加者の立場/意見の要約
 * - セッション後に「今日の話まとめ」を自動生成
 * - 共有可能なインサイトカード
 * = 音声チャットの最大の弱点「消えてしまう」を補う
 */

export interface InsightEntry {
  keyword: string;
  count: number;
  contributors: Set<string>;
  firstMentionAt: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface SessionInsight {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  totalSpeakingMinutes: number;
  participantCount: number;
  topKeywords: Array<{ word: string; count: number }>;
  topContributors: Array<{ name: string; speakingMinutes: number }>;
  moodSummary: { positive: number; neutral: number; negative: number };
  highlightQuotes: string[];  // AI抽出されたハイライト的なフレーズ
}

const STORAGE_KEY = 'cocoro_insights';

export class CollectiveInsightEngine {
  private entries: Map<string, InsightEntry> = new Map();
  private sessions: SessionInsight[] = [];
  private sessionStart = Date.now();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) this.sessions = JSON.parse(data);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions.slice(-20)));
    } catch { /* full */ }
  }

  /**
   * キーワード/トピックを記録
   */
  recordKeyword(keyword: string, contributorId: string, sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'): void {
    const normalized = keyword.trim().toLowerCase();
    if (normalized.length < 2) return;

    const entry = this.entries.get(normalized);
    if (entry) {
      entry.count++;
      entry.contributors.add(contributorId);
    } else {
      this.entries.set(normalized, {
        keyword: normalized, count: 1,
        contributors: new Set([contributorId]),
        firstMentionAt: Date.now(), sentiment,
      });
    }
  }

  /**
   * セッション終了時にインサイトを生成
   */
  finalizeSession(params: {
    sessionId: string;
    participantCount: number;
    contributors: Array<{ name: string; speakingMinutes: number }>;
  }): SessionInsight {
    const topKeywords = Array.from(this.entries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(e => ({ word: e.keyword, count: e.count }));

    const moodCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const entry of this.entries.values()) {
      moodCounts[entry.sentiment]++;
    }
    const total = Math.max(1, moodCounts.positive + moodCounts.neutral + moodCounts.negative);

    const insight: SessionInsight = {
      sessionId: params.sessionId,
      startedAt: this.sessionStart,
      endedAt: Date.now(),
      totalSpeakingMinutes: params.contributors.reduce((a, c) => a + c.speakingMinutes, 0),
      participantCount: params.participantCount,
      topKeywords,
      topContributors: params.contributors.sort((a, b) => b.speakingMinutes - a.speakingMinutes).slice(0, 5),
      moodSummary: {
        positive: moodCounts.positive / total,
        neutral: moodCounts.neutral / total,
        negative: moodCounts.negative / total,
      },
      highlightQuotes: [],
    };

    this.sessions.push(insight);
    this.saveToStorage();

    // Reset for next session
    this.entries.clear();
    this.sessionStart = Date.now();

    return insight;
  }

  /**
   * 現在のトレンドキーワード
   */
  getCurrentTrends(limit: number = 5): Array<{ word: string; count: number }> {
    return Array.from(this.entries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(e => ({ word: e.keyword, count: e.count }));
  }

  getSessionHistory(limit: number = 10): SessionInsight[] {
    return this.sessions.slice(-limit).reverse();
  }
}
