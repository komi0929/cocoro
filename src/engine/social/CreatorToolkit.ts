/**
 * kokoro — Creator Tools
 * ルームホストのための支援ツール — クリエイター動機の研究結果
 *
 * リサーチ結果:
 * - VRChat/RecRoomの成功 = UGC → ユーザーが空間を作る
 * - クリエイター動機: 自己表現/認知/収益/コミュニティ形成/治療的効果
 * - 対策: ホスト用ツール(MC機能/進行管理/トピック管理)を提供
 */

export interface HostControls {
  canMuteAll: boolean;
  canKick: boolean;
  canPinTopic: boolean;
  canStartGame: boolean;
  canStartPoll: boolean;
  canSetBGM: boolean;
  canSpotlight: boolean;
}

export interface CreatorStats {
  totalSessions: number;
  totalMinutesHosted: number;
  totalParticipantsServed: number;
  averageRating: number;
  totalGiftsReceived: number;
  totalCoinsEarned: number;
  repeatVisitorPercent: number;
  hostLevel: number;
  hostTitle: string;
}

const HOST_TITLES: Array<{ minLevel: number; title: string; emoji: string }> = [
  { minLevel: 1, title: '新米ホスト', emoji: '🌱' },
  { minLevel: 3, title: '場作り上手', emoji: '🏠' },
  { minLevel: 5, title: 'パーティーマスター', emoji: '🎉' },
  { minLevel: 10, title: 'コミュニティリーダー', emoji: '⭐' },
  { minLevel: 20, title: '伝説のホスト', emoji: '👑' },
];

const STORAGE_KEY = 'kokoro_creator';

export class CreatorToolkit {
  private stats: CreatorStats;

  constructor() {
    this.stats = this.loadStats();
  }

  private loadStats(): CreatorStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      totalSessions: 0, totalMinutesHosted: 0,
      totalParticipantsServed: 0, averageRating: 0,
      totalGiftsReceived: 0, totalCoinsEarned: 0,
      repeatVisitorPercent: 0, hostLevel: 1,
      hostTitle: '🌱 新米ホスト',
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch { /* full */ }
  }

  /**
   * セッション終了時の記録
   */
  recordSession(params: {
    durationMinutes: number;
    participantCount: number;
    giftsReceived: number;
    coinsEarned: number;
    rating: number;
  }): void {
    this.stats.totalSessions++;
    this.stats.totalMinutesHosted += params.durationMinutes;
    this.stats.totalParticipantsServed += params.participantCount;
    this.stats.totalGiftsReceived += params.giftsReceived;
    this.stats.totalCoinsEarned += params.coinsEarned;

    // 評価の移動平均
    this.stats.averageRating = (
      this.stats.averageRating * (this.stats.totalSessions - 1) + params.rating
    ) / this.stats.totalSessions;

    // ホストレベル計算
    this.stats.hostLevel = Math.floor(Math.sqrt(this.stats.totalSessions * 2 + this.stats.totalMinutesHosted / 30));
    const titleEntry = [...HOST_TITLES].reverse().find(t => this.stats.hostLevel >= t.minLevel);
    if (titleEntry) this.stats.hostTitle = `${titleEntry.emoji} ${titleEntry.title}`;

    this.saveStats();
  }

  /**
   * MC用の進行管理ツール
   */
  getHostActions(): Array<{ id: string; label: string; emoji: string; description: string }> {
    return [
      { id: 'mute_all', label: '全員ミュート', emoji: '🔇', description: 'ホスト以外をミュート' },
      { id: 'spotlight', label: 'スポットライト', emoji: '🔦', description: '特定の人を注目させる' },
      { id: 'topic_change', label: 'トピック変更', emoji: '🃏', description: '新しいトピックを出す' },
      { id: 'start_game', label: 'ゲーム開始', emoji: '🎲', description: 'ミニゲームを始める' },
      { id: 'start_poll', label: '投票開始', emoji: '📊', description: '全員参加の投票を始める' },
      { id: 'time_check', label: '残り時間', emoji: '⏱️', description: 'セッション残り時間を表示' },
      { id: 'bgm_change', label: 'BGM変更', emoji: '🎵', description: '雰囲気に合うBGMに変更' },
      { id: 'group_split', label: 'グループ分け', emoji: '👥', description: '小グループに分ける' },
    ];
  }

  /**
   * スポットライト: 特定の参加者を全員に注目させる
   */
  static createSpotlightEvent(participantId: string, participantName: string): {
    type: 'spotlight';
    targetId: string;
    message: string;
    durationMs: number;
  } {
    return {
      type: 'spotlight',
      targetId: participantId,
      message: `🔦 ${participantName}さんに注目！`,
      durationMs: 5000,
    };
  }

  getStats(): CreatorStats { return { ...this.stats }; }
  getLevel(): number { return this.stats.hostLevel; }
  getTitle(): string { return this.stats.hostTitle; }

  static getPermissions(): HostControls {
    return {
      canMuteAll: true, canKick: true, canPinTopic: true,
      canStartGame: true, canStartPoll: true,
      canSetBGM: true, canSpotlight: true,
    };
  }
}
