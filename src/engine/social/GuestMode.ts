/**
 * kokoro — Guest Mode
 * アカウント不要で即参加 — コールドスタート対策の核
 *
 * サイクル21: 3タップで会話開始
 * - ランダムアバター + ランダム名前を自動生成
 * - 制限: フレンド追加不可、ルーム作成不可
 * - 5分の体験後に「アカウント作成で全機能解放」を提案
 * = ダウンロード→初回会話のフリクションをゼロに
 */

export interface GuestProfile {
  id: string;
  displayName: string;
  avatarSeed: number;
  isGuest: true;
  createdAt: number;
  sessionCount: number;
  totalMinutes: number;
}

const NAMES_PREFIX = ['ふわふわ', 'キラキラ', 'もこもこ', 'ぽかぽか', 'にこにこ', 'わくわく', 'そよそよ', 'ひらひら'];
const NAMES_SUFFIX = ['うさぎ', 'ねこ', 'くま', 'ペンギン', '星', '月', '雲', '風'];

const STORAGE_KEY = 'kokoro_guest';

export class GuestMode {
  private profile: GuestProfile | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) this.profile = JSON.parse(data);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      if (this.profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch { /* full */ }
  }

  /**
   * ゲストプロフィールを生成(初回のみ)
   */
  createGuest(): GuestProfile {
    if (this.profile) return this.profile;

    const prefix = NAMES_PREFIX[Math.floor(Math.random() * NAMES_PREFIX.length)];
    const suffix = NAMES_SUFFIX[Math.floor(Math.random() * NAMES_SUFFIX.length)];

    this.profile = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      displayName: `${prefix}${suffix}`,
      avatarSeed: Math.floor(Math.random() * 1000),
      isGuest: true,
      createdAt: Date.now(),
      sessionCount: 0,
      totalMinutes: 0,
    };

    this.saveToStorage();
    return this.profile;
  }

  /**
   * セッション記録
   */
  recordSession(minutes: number): void {
    if (!this.profile) return;
    this.profile.sessionCount++;
    this.profile.totalMinutes += minutes;
    this.saveToStorage();
  }

  /**
   * アップグレード提案のタイミング判定
   */
  shouldSuggestUpgrade(): { suggest: boolean; reason: string } {
    if (!this.profile) return { suggest: false, reason: '' };
    if (this.profile.totalMinutes >= 5) {
      return { suggest: true, reason: 'フレンド機能やルーム作成を使ってみませんか？' };
    }
    if (this.profile.sessionCount >= 3) {
      return { suggest: true, reason: 'いつものアバターで参加しませんか？' };
    }
    return { suggest: false, reason: '' };
  }

  /**
   * ゲスト権限チェック
   */
  static getPermissions(): {
    canCreateRoom: boolean;
    canAddFriend: boolean;
    canCustomizeAvatar: boolean;
    canAccessHistory: boolean;
    canSendGifts: boolean;
  } {
    return {
      canCreateRoom: false,
      canAddFriend: false,
      canCustomizeAvatar: false,
      canAccessHistory: false,
      canSendGifts: false,
    };
  }

  getProfile(): GuestProfile | null { return this.profile; }
  isGuest(): boolean { return !!this.profile; }

  /**
   * アカウント作成でゲストデータを引き継ぎ
   */
  upgradeToAccount(): { guestData: GuestProfile | null } {
    const data = this.profile;
    localStorage.removeItem(STORAGE_KEY);
    this.profile = null;
    return { guestData: data };
  }
}
