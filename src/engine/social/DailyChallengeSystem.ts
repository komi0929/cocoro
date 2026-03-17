/**
 * kokoro — Daily Challenge + Streak
 * 毎日来る理由を作る — リテンション設計の要
 *
 * サイクル17: デイリーお題 + ストリーク
 * - 毎日異なるお題/チャレンジ
 * - 連続ログインストリーク
 * - ストリーク報酬(アバターアクセサリー解放)
 * - 週間テーマ(月曜は趣味の日、金曜は深夜雑談の日)
 */

export interface DailyState {
  todayChallenge: DailyChallenge;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string;  // YYYY-MM-DD
  totalCheckIns: number;
  unlockedRewards: string[];
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: 'topic' | 'social' | 'game' | 'listen' | 'express';
  requirement: string;
  rewardPoints: number;
}

const WEEKLY_THEMES: Record<number, { name: string; emoji: string }> = {
  0: { name: 'まったりサンデー', emoji: '☕' },    // Sunday
  1: { name: '趣味マンデー', emoji: '🎮' },
  2: { name: 'チャレンジ火曜日', emoji: '🔥' },
  3: { name: 'なんでも水曜日', emoji: '💬' },
  4: { name: '深い話サーズデー', emoji: '🌙' },
  5: { name: '金曜ナイトトーク', emoji: '🎉' },
  6: { name: '自由な土曜日', emoji: '✨' },
};

const CHALLENGES: DailyChallenge[] = [
  { id: 'c1', title: '初対面と話そう', description: '知らない1人と3分以上会話', emoji: '🤝', type: 'social', requirement: 'talk_stranger_3min', rewardPoints: 10 },
  { id: 'c2', title: 'リアクション王', description: 'ジェスチャーを10回使おう', emoji: '👏', type: 'express', requirement: 'gesture_10', rewardPoints: 5 },
  { id: 'c3', title: '聞き上手', description: '5分間ずっとリスナーとして参加', emoji: '👂', type: 'listen', requirement: 'listen_5min', rewardPoints: 8 },
  { id: 'c4', title: 'トピックマスター', description: '3つのトピックカードに答えよう', emoji: '🃏', type: 'topic', requirement: 'answer_3_topics', rewardPoints: 8 },
  { id: 'c5', title: 'ゲームチャンピオン', description: '会話ゲームで1回勝利', emoji: '🏆', type: 'game', requirement: 'win_game', rewardPoints: 15 },
  { id: 'c6', title: 'フレンドメーカー', description: '新しくフレンド申請しよう', emoji: '💌', type: 'social', requirement: 'send_friend_request', rewardPoints: 10 },
  { id: 'c7', title: '部屋ホスト', description: '自分でルームを作って人を集めよう', emoji: '🏠', type: 'social', requirement: 'host_room_3people', rewardPoints: 20 },
];

const STREAK_REWARDS: Array<{ streak: number; reward: string; emoji: string }> = [
  { streak: 3, reward: '🌟 3日連続！星のオーラ解放', emoji: '⭐' },
  { streak: 7, reward: '🔥 7日連続！炎のエフェクト解放', emoji: '🔥' },
  { streak: 14, reward: '💎 14日連続！ダイヤモンドフレーム解放', emoji: '💎' },
  { streak: 30, reward: '👑 30日連続！ゴールドクラウン解放', emoji: '👑' },
];

const STORAGE_KEY = 'kokoro_daily';

export class DailyChallengeSystem {
  private state: DailyState;

  constructor() {
    this.state = this.loadState();
    this.checkAndUpdateDay();
  }

  private loadState(): DailyState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      todayChallenge: CHALLENGES[0],
      currentStreak: 0, longestStreak: 0,
      lastCheckIn: '', totalCheckIns: 0,
      unlockedRewards: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* full */ }
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private checkAndUpdateDay(): void {
    const today = this.getToday();
    if (this.state.lastCheckIn === today) return;

    // New day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (this.state.lastCheckIn === yesterdayStr) {
      this.state.currentStreak++;
    } else if (this.state.lastCheckIn !== '') {
      this.state.currentStreak = 1; // Reset
    } else {
      this.state.currentStreak = 1; // First day
    }

    this.state.lastCheckIn = today;
    this.state.totalCheckIns++;
    if (this.state.currentStreak > this.state.longestStreak) {
      this.state.longestStreak = this.state.currentStreak;
    }

    // Daily challenge (deterministic based on date)
    const dayHash = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    this.state.todayChallenge = CHALLENGES[dayHash % CHALLENGES.length];

    // Streak rewards
    for (const sr of STREAK_REWARDS) {
      if (this.state.currentStreak >= sr.streak && !this.state.unlockedRewards.includes(sr.reward)) {
        this.state.unlockedRewards.push(sr.reward);
      }
    }

    this.saveState();
  }

  checkIn(): void { this.checkAndUpdateDay(); }
  getState(): DailyState { return { ...this.state }; }
  getTodayChallenge(): DailyChallenge { return this.state.todayChallenge; }
  getStreak(): number { return this.state.currentStreak; }
  getWeeklyTheme(): { name: string; emoji: string } {
    return WEEKLY_THEMES[new Date().getDay()];
  }

  static getStreakRewards(): typeof STREAK_REWARDS { return STREAK_REWARDS; }
}
