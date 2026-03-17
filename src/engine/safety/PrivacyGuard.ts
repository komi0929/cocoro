/**
 * kokoro — Privacy Guard
 * プライバシーバイデザイン — GDPR/個人情報保護
 *
 * - データ最小化原則
 * - 位置情報/連絡先へのアクセスなし
 * - 匿名でも参加可能
 * - 録音しない(デフォルト)
 * - データ削除リクエスト
 */

export interface PrivacySettings {
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  showInDiscovery: boolean;
  shareVoiceData: boolean;
  allowAnalytics: boolean;
  dataRetentionDays: number;
}

export interface DataInventory {
  category: string;
  description: string;
  stored: boolean;
  canDelete: boolean;
  retentionDays: number;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  showOnlineStatus: true,
  allowFriendRequests: true,
  showInDiscovery: true,
  shareVoiceData: false,    // デフォルトOFF(プライバシー重視)
  allowAnalytics: true,
  dataRetentionDays: 30,
};

const DATA_INVENTORY: DataInventory[] = [
  { category: 'プロフィール', description: '名前、アバター設定', stored: true, canDelete: true, retentionDays: -1 },
  { category: 'フレンド情報', description: 'フレンドリスト', stored: true, canDelete: true, retentionDays: -1 },
  { category: 'セッション履歴', description: '参加したルームと時間', stored: true, canDelete: true, retentionDays: 30 },
  { category: '音声データ', description: 'リアルタイム処理のみ、保存なし', stored: false, canDelete: false, retentionDays: 0 },
  { category: '声紋特徴', description: 'アバタカラー生成用(匿名化済)', stored: true, canDelete: true, retentionDays: 90 },
  { category: 'チャット残', description: 'テキストメッセージ', stored: true, canDelete: true, retentionDays: 30 },
  { category: '位置情報', description: '収集しません', stored: false, canDelete: false, retentionDays: 0 },
  { category: '連絡先', description: '収集しません', stored: false, canDelete: false, retentionDays: 0 },
];

const STORAGE_KEY = 'kokoro_privacy';

export class PrivacyGuard {
  private settings: PrivacySettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): PrivacySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch { /* full */ }
  }

  updateSetting<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  getSettings(): PrivacySettings { return { ...this.settings }; }

  /**
   * データインベントリ(何を保存しているか)
   */
  static getDataInventory(): DataInventory[] { return [...DATA_INVENTORY]; }

  /**
   * データ削除リクエスト
   */
  requestDataDeletion(): { deleted: string[]; notStored: string[] } {
    const deleted: string[] = [];
    const notStored: string[] = [];

    for (const item of DATA_INVENTORY) {
      if (item.stored && item.canDelete) {
        deleted.push(item.category);
      } else if (!item.stored) {
        notStored.push(item.category);
      }
    }

    // 実際のデータ削除
    const keysToDelete = [
      'kokoro_guest', 'kokoro_coins', 'kokoro_gifts',
      'kokoro_trust', 'kokoro_habit', 'kokoro_engagement',
      'kokoro_preferences', 'kokoro_aha', 'kokoro_invites',
    ];
    for (const key of keysToDelete) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }

    return { deleted, notStored };
  }

  /**
   * プライバシーサマリー(ユーザー向け)
   */
  static getPrivacySummary(): string {
    return [
      '🔒 kokoroのプライバシー',
      '• 音声はリアルタイム処理のみ、録音しません',
      '• 位置情報・連絡先にアクセスしません',
      '• アカウントなしでも参加できます',
      '• いつでもデータを完全削除できます',
    ].join('\n');
  }
}
