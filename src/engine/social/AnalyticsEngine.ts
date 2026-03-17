/**
 * cocoro — Analytics Dashboard (Internal)
 * 内部分析 — データ駆動の改善
 *
 * - ユーザー行動の匿名集計
 * - ファネル分析(訪問→参加→発話→リピート)
 * - 機能利用率
 * - セッション品質スコア
 * = 「勘」ではなく「データ」で改善する
 */

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface FunnelMetrics {
  appOpened: number;
  roomJoined: number;
  firstSpoke: number;
  sessionOver5Min: number;
  returnedNextDay: number;
  conversionRate: number;
}

export interface FeatureUsage {
  feature: string;
  useCount: number;
  lastUsed: number;
}

const STORAGE_KEY = 'cocoro_analytics';

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private featureUsage: Map<string, FeatureUsage> = new Map();

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.events = parsed.events || [];
        if (parsed.features) {
          for (const f of parsed.features) this.featureUsage.set(f.feature, f);
        }
      }
    } catch { /* ignore */ }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events: this.events.slice(-200),
        features: Array.from(this.featureUsage.values()),
      }));
    } catch { /* full */ }
  }

  /**
   * イベント記録
   */
  track(name: string, properties: Record<string, string | number | boolean> = {}): void {
    this.events.push({ name, properties, timestamp: Date.now() });
    this.saveEvents();
  }

  /**
   * 機能利用を記録
   */
  trackFeature(feature: string): void {
    const existing = this.featureUsage.get(feature) || { feature, useCount: 0, lastUsed: 0 };
    existing.useCount++;
    existing.lastUsed = Date.now();
    this.featureUsage.set(feature, existing);
    this.saveEvents();
  }

  /**
   * ファネル分析
   */
  computeFunnel(): FunnelMetrics {
    const appOpened = this.events.filter(e => e.name === 'app_opened').length;
    const roomJoined = this.events.filter(e => e.name === 'room_joined').length;
    const firstSpoke = this.events.filter(e => e.name === 'first_spoke').length;
    const sessionOver5Min = this.events.filter(e =>
      e.name === 'session_ended' && (e.properties.durationMinutes as number) >= 5
    ).length;
    const returnedNextDay = this.events.filter(e => e.name === 'returned_next_day').length;

    const conversionRate = appOpened > 0 ? (sessionOver5Min / appOpened) * 100 : 0;

    return { appOpened, roomJoined, firstSpoke, sessionOver5Min, returnedNextDay, conversionRate: Math.round(conversionRate) };
  }

  /**
   * セッション品質スコア(0-100)
   */
  computeSessionQuality(params: {
    durationMinutes: number;
    participantCount: number;
    reactionsGiven: number;
    talkTimePercent: number;
    hadFun: boolean; // user-reported
  }): number {
    let score = 0;
    // Duration: 5-30分が理想
    if (params.durationMinutes >= 5) score += 20;
    if (params.durationMinutes >= 15) score += 10;
    // Participants: 3-5人が理想
    if (params.participantCount >= 3 && params.participantCount <= 5) score += 20;
    // Engagement
    if (params.reactionsGiven >= 3) score += 15;
    // Balance: 20-40%の発話が理想
    if (params.talkTimePercent >= 20 && params.talkTimePercent <= 40) score += 20;
    // Self-report
    if (params.hadFun) score += 15;

    return Math.min(100, score);
  }

  /**
   * 最も使われている機能TOP5
   */
  getTopFeatures(): FeatureUsage[] {
    return Array.from(this.featureUsage.values())
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5);
  }

  getEvents(): AnalyticsEvent[] { return [...this.events]; }
}
