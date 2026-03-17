/**
 * cocoro — Habit Loop Engine
 * 習慣形成ループ — Trigger → Action → Variable Reward → Investment
 *
 * リサーチ結果(Nir Eyal's Hooked Model):
 * - Trigger: 外部(通知) + 内部(退屈/寂しさ)
 * - Action: 最小限の操作で報酬に到達
 * - Variable Reward: 毎回違う体験(誰がいるか分からない)
 * - Investment: 使うほど蓄積される資産(フレンド/レベル/アバター)
 */

export interface HabitState {
  lastVisit: number;
  visitStreak: number;
  totalVisits: number;
  internalTriggers: string[];         // ユーザーがいつ来るか
  peakHours: number[];                // 最もアクティブな時間帯
  investmentLevel: number;            // 蓄積された資産量
  variableRewardHistory: string[];    // 過去の「今日の驚き」
}

export interface HabitTrigger {
  type: 'external' | 'internal';
  channel: 'notification' | 'email' | 'boredom' | 'loneliness' | 'curiosity' | 'fomo';
  message: string;
  priority: number;
}

const VARIABLE_REWARDS = [
  '今日のルームに常連さんがいます！',
  '新しいトピック「{topic}」が人気です',
  'あなたのフレンドが今オンラインです',
  '今夜のイベント「{event}」が盛り上がっています',
  '新しいギフトアイテムが追加されました',
  'レベルアップまであと少し！',
  'あなたの声紋カラーが進化しました',
  '限定アクセサリーが24時間だけ登場',
];

const STORAGE_KEY = 'cocoro_habit';

export class HabitLoopEngine {
  private state: HabitState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): HabitState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      lastVisit: 0, visitStreak: 0, totalVisits: 0,
      internalTriggers: [], peakHours: [],
      investmentLevel: 0, variableRewardHistory: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* full */ }
  }

  /**
   * 訪問を記録
   */
  recordVisit(): { isNewDay: boolean; streak: number; reward: string } {
    const now = Date.now();
    const today = new Date().toDateString();
    const lastDay = this.state.lastVisit ? new Date(this.state.lastVisit).toDateString() : '';
    const isNewDay = today !== lastDay;

    if (isNewDay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDay === yesterday.toDateString()) {
        this.state.visitStreak++;
      } else if (lastDay !== '') {
        this.state.visitStreak = 1;
      } else {
        this.state.visitStreak = 1;
      }
    }

    this.state.lastVisit = now;
    this.state.totalVisits++;

    // 時間帯記録
    const hour = new Date().getHours();
    this.state.peakHours.push(hour);
    if (this.state.peakHours.length > 50) this.state.peakHours.shift();

    // Variable Reward
    const reward = VARIABLE_REWARDS[Math.floor(Math.random() * VARIABLE_REWARDS.length)];
    this.state.variableRewardHistory.push(reward);
    if (this.state.variableRewardHistory.length > 10) this.state.variableRewardHistory.shift();

    this.saveState();
    return { isNewDay, streak: this.state.visitStreak, reward };
  }

  /**
   * 投資レベルを更新(使うほど蓄積)
   */
  updateInvestment(params: {
    friendCount: number;
    level: number;
    avatarCustomizations: number;
    roomsCreated: number;
  }): void {
    this.state.investmentLevel =
      params.friendCount * 3 +
      params.level * 5 +
      params.avatarCustomizations * 2 +
      params.roomsCreated * 10;
    this.saveState();
  }

  /**
   * 最適なトリガーを選択
   */
  getBestTrigger(): HabitTrigger {
    const hour = new Date().getHours();
    const isLateNight = hour >= 22 || hour < 5;
    const isEvening = hour >= 18 && hour < 22;

    // Investment-based: 投資が多いほど「もったいない」効果
    if (this.state.investmentLevel > 50) {
      return {
        type: 'internal', channel: 'fomo',
        message: 'フレンドが今夜も集まっています',
        priority: 3,
      };
    }

    if (isLateNight) {
      return {
        type: 'internal', channel: 'loneliness',
        message: '夜更かし仲間がいます 🌙',
        priority: 2,
      };
    }

    if (isEvening) {
      return {
        type: 'external', channel: 'notification',
        message: '今夜のイベントがまもなく始まります',
        priority: 3,
      };
    }

    return {
      type: 'internal', channel: 'curiosity',
      message: '新しい人が来ているかも',
      priority: 1,
    };
  }

  /**
   * ユーザーのピークアワー
   */
  getPeakHours(): number[] {
    const counts = new Map<number, number>();
    for (const h of this.state.peakHours) {
      counts.set(h, (counts.get(h) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => h);
  }

  getState(): HabitState { return { ...this.state }; }
  getStreak(): number { return this.state.visitStreak; }
  getInvestmentLevel(): number { return this.state.investmentLevel; }
}
