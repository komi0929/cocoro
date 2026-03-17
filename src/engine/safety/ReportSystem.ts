/**
 * cocoro — Report System
 * ワンタップ通報 + 自動証拠保存
 *
 * サイクル7: 安全対策の第2層
 * - ワンタップ通報: 理由選択 + 即座に証拠記録
 * - 証拠: 通報前後30秒のメタデータ(音声は保存しない)
 * - 通報カテゴリ: ハラスメント/暴言/つきまとい/不適切/その他
 * - 自動アクション: 3回通報でルームから自動退出
 */

export type ReportCategory = 'harassment' | 'verbal_abuse' | 'stalking' | 'inappropriate' | 'spam' | 'other';

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetName: string;
  category: ReportCategory;
  description: string;
  roomId: string;
  timestamp: number;
  // メタデータのみ(音声は保存しない)
  evidenceMetadata: {
    targetSpeakingSeconds: number;
    targetVolume: number;
    proximityDistance: number;
    recentActions: string[];
  };
}

const STORAGE_KEY = 'cocoro_reports';

export class ReportSystem {
  private reports: Report[] = [];
  private reportCounts: Map<string, number> = new Map(); // targetId → count
  private onReportCallbacks: Array<(r: Report) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.reports = JSON.parse(data);
        for (const r of this.reports) {
          this.reportCounts.set(r.targetId, (this.reportCounts.get(r.targetId) || 0) + 1);
        }
      }
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports.slice(-100)));
    } catch { /* full */ }
  }

  /**
   * 通報を送信
   */
  submit(params: {
    reporterId: string; targetId: string; targetName: string;
    category: ReportCategory; description: string; roomId: string;
    evidenceMetadata: Report['evidenceMetadata'];
  }): Report {
    const report: Report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...params, timestamp: Date.now(),
    };

    this.reports.push(report);
    const count = (this.reportCounts.get(params.targetId) || 0) + 1;
    this.reportCounts.set(params.targetId, count);
    this.saveToStorage();

    for (const fn of this.onReportCallbacks) fn(report);

    // Haptic confirmation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }

    return report;
  }

  /**
   * 自動アクション判定: 3回通報でkick推奨
   */
  shouldAutoKick(targetId: string): boolean {
    return (this.reportCounts.get(targetId) || 0) >= 3;
  }

  /**
   * 通報カテゴリ一覧(UI用)
   */
  static getCategories(): Array<{ key: ReportCategory; label: string; emoji: string }> {
    return [
      { key: 'harassment', label: 'ハラスメント', emoji: '⚠️' },
      { key: 'verbal_abuse', label: '暴言・誹謗中傷', emoji: '🤬' },
      { key: 'stalking', label: 'つきまとい', emoji: '👀' },
      { key: 'inappropriate', label: '不適切な行為', emoji: '🚫' },
      { key: 'spam', label: 'スパム・荒らし', emoji: '📢' },
      { key: 'other', label: 'その他', emoji: '📝' },
    ];
  }

  onReport(fn: (r: Report) => void): () => void {
    this.onReportCallbacks.push(fn);
    return () => { this.onReportCallbacks = this.onReportCallbacks.filter(f => f !== fn); };
  }

  getReportsForTarget(targetId: string): Report[] {
    return this.reports.filter(r => r.targetId === targetId);
  }
}
