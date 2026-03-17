/**
 * kokoro — Smart Notification
 * 通知AIがユーザーの反応率で頻度を自動調整
 *
 * サイクル20: 通知のスマート化
 * - 通知の開封率をトラッキング
 * - 反応率が低い → 頻度を下げる
 * - 反応率が高い → より積極的に
 * - 時間帯ごとの最適タイミング学習
 * = 「ウザくならない」通知設計
 */

interface NotificationStats {
  sent: number;
  opened: number;
  actedOn: number;
  lastSentAt: number;
  hourlyStats: Record<number, { sent: number; opened: number }>; // hour → stats
}

const STORAGE_KEY = 'kokoro_smart_notif';

export class SmartNotificationEngine {
  private stats: NotificationStats;
  private cooldownMs = 1800000; // 30 minutes default

  constructor() {
    this.stats = this.loadStats();
    this.adjustCooldown();
  }

  private loadStats(): NotificationStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      sent: 0, opened: 0, actedOn: 0,
      lastSentAt: 0, hourlyStats: {},
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch { /* full */ }
  }

  /**
   * 通知を送るべきか判定
   */
  shouldSend(): boolean {
    const now = Date.now();
    // Cooldown check
    if (now - this.stats.lastSentAt < this.cooldownMs) return false;

    // Hour optimization: この時間帯の開封率が低いなら送らない
    const hour = new Date().getHours();
    const hourStat = this.stats.hourlyStats[hour];
    if (hourStat && hourStat.sent > 3) {
      const hourOpenRate = hourStat.opened / hourStat.sent;
      if (hourOpenRate < 0.1) return false; // 10%未満なら送らない
    }

    return true;
  }

  /**
   * 通知送信を記録
   */
  recordSent(): void {
    this.stats.sent++;
    this.stats.lastSentAt = Date.now();

    const hour = new Date().getHours();
    if (!this.stats.hourlyStats[hour]) {
      this.stats.hourlyStats[hour] = { sent: 0, opened: 0 };
    }
    this.stats.hourlyStats[hour].sent++;

    this.saveStats();
  }

  /**
   * 通知開封を記録
   */
  recordOpened(): void {
    this.stats.opened++;
    const hour = new Date().getHours();
    if (this.stats.hourlyStats[hour]) {
      this.stats.hourlyStats[hour].opened++;
    }
    this.adjustCooldown();
    this.saveStats();
  }

  /**
   * 通知アクションを記録
   */
  recordActedOn(): void {
    this.stats.actedOn++;
    this.adjustCooldown();
    this.saveStats();
  }

  /**
   * 開封率に基づいてcooldownを自動調整
   */
  private adjustCooldown(): void {
    if (this.stats.sent < 5) return; // 十分なデータがない

    const openRate = this.stats.opened / this.stats.sent;
    const actionRate = this.stats.actedOn / Math.max(1, this.stats.opened);

    if (openRate > 0.5 && actionRate > 0.3) {
      // 高反応率 → 頻度アップ (15分最小)
      this.cooldownMs = Math.max(900000, this.cooldownMs * 0.8);
    } else if (openRate < 0.15) {
      // 低反応率 → 頻度ダウン (最大4時間)
      this.cooldownMs = Math.min(14400000, this.cooldownMs * 1.5);
    }
  }

  getOpenRate(): number {
    return this.stats.sent > 0 ? this.stats.opened / this.stats.sent : 0;
  }

  getCooldownMinutes(): number { return Math.round(this.cooldownMs / 60000); }

  /**
   * ベストアワー(開封率最高の時間帯)
   */
  getBestHours(): number[] {
    return Object.entries(this.stats.hourlyStats)
      .filter(([, s]) => s.sent >= 2)
      .sort(([, a], [, b]) => (b.opened / b.sent) - (a.opened / a.sent))
      .slice(0, 3)
      .map(([h]) => Number(h));
  }
}
