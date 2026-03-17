/**
 * cocoro — Conversation Level System
 * 成長実感 — 「使うほど上手くなる」ゲーミフィケーション
 *
 * サイクル18: 会話レベル + 称号
 * - 発話時間/リスナー時間/リアクション/フレンド数で経験値
 * - レベルアップで称号解放
 * - アバターに称号バッジ表示
 * = 「ここまで来た」感覚 → 離脱防止
 */

export interface LevelState {
  level: number;
  xp: number;
  xpToNext: number;
  title: string;
  titleEmoji: string;
  totalSpeakingMinutes: number;
  totalListeningMinutes: number;
  totalReactions: number;
  totalFriends: number;
  totalSessions: number;
}

const TITLES: Array<{ minLevel: number; title: string; emoji: string }> = [
  { minLevel: 1, title: 'はじめまして', emoji: '🌱' },
  { minLevel: 3, title: 'おしゃべり見習い', emoji: '💬' },
  { minLevel: 5, title: '聞き上手', emoji: '👂' },
  { minLevel: 8, title: 'ムードメーカー', emoji: '🎉' },
  { minLevel: 12, title: 'トークの達人', emoji: '🎤' },
  { minLevel: 16, title: 'つながりの星', emoji: '⭐' },
  { minLevel: 20, title: 'スペースマスター', emoji: '🌌' },
  { minLevel: 25, title: '伝説の語り部', emoji: '👑' },
  { minLevel: 30, title: 'cocoroの守護者', emoji: '🔮' },
];

const XP_PER_LEVEL = (level: number) => Math.floor(80 + level * 30);

const STORAGE_KEY = 'cocoro_level';

export class ConversationLevelSystem {
  private state: LevelState;
  private onLevelUpCallbacks: Array<(newLevel: number, title: string) => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LevelState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      level: 1, xp: 0, xpToNext: XP_PER_LEVEL(1),
      title: 'はじめまして', titleEmoji: '🌱',
      totalSpeakingMinutes: 0, totalListeningMinutes: 0,
      totalReactions: 0, totalFriends: 0, totalSessions: 0,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* full */ }
  }

  /**
   * XP獲得
   */
  addXP(params: {
    speakingMinutes?: number;
    listeningMinutes?: number;
    reactions?: number;
    newFriends?: number;
    sessionCompleted?: boolean;
  }): void {
    let xpGain = 0;
    if (params.speakingMinutes) {
      this.state.totalSpeakingMinutes += params.speakingMinutes;
      xpGain += params.speakingMinutes * 3;
    }
    if (params.listeningMinutes) {
      this.state.totalListeningMinutes += params.listeningMinutes;
      xpGain += params.listeningMinutes * 2; // リスナーも価値がある
    }
    if (params.reactions) {
      this.state.totalReactions += params.reactions;
      xpGain += params.reactions * 1;
    }
    if (params.newFriends) {
      this.state.totalFriends += params.newFriends;
      xpGain += params.newFriends * 10;
    }
    if (params.sessionCompleted) {
      this.state.totalSessions++;
      xpGain += 5;
    }

    this.state.xp += Math.floor(xpGain);

    // Level up check
    while (this.state.xp >= this.state.xpToNext) {
      this.state.xp -= this.state.xpToNext;
      this.state.level++;
      this.state.xpToNext = XP_PER_LEVEL(this.state.level);

      // Update title
      const newTitle = [...TITLES].reverse().find(t => this.state.level >= t.minLevel);
      if (newTitle) {
        this.state.title = newTitle.title;
        this.state.titleEmoji = newTitle.emoji;
      }

      // Notify
      for (const fn of this.onLevelUpCallbacks) {
        fn(this.state.level, this.state.title);
      }
    }

    this.saveState();
  }

  getState(): LevelState { return { ...this.state }; }
  getLevel(): number { return this.state.level; }
  getTitle(): string { return `${this.state.titleEmoji} ${this.state.title}`; }
  getProgress(): number { return this.state.xp / this.state.xpToNext; }

  onLevelUp(fn: (newLevel: number, title: string) => void): () => void {
    this.onLevelUpCallbacks.push(fn);
    return () => { this.onLevelUpCallbacks = this.onLevelUpCallbacks.filter(f => f !== fn); };
  }
}
