/**
 * kokoro — Trust Score System
 * 信頼スコア / レピュテーション — コミュニティ自治の基盤
 *
 * リサーチ結果:
 * - Reddit/Stack Overflow成功 = カルマシステムで自己モデレーション
 * - 信頼は「行動の蓄積」で獲得、「一発の違反」で失う(非対称性)
 * -段階的権限: 新規ユーザーは制限付き → 信頼蓄積で解放
 * - EigenKarma: パーソナライズされた信頼グラフ
 */

export interface TrustProfile {
  userId: string;
  score: number;          // 0-1000
  level: TrustLevel;
  positiveActions: number;
  negativeActions: number;
  reportCount: number;
  joinedAt: number;
  permissions: Permission[];
}

export type TrustLevel = 'newcomer' | 'member' | 'trusted' | 'veteran' | 'guardian';

export type Permission =
  | 'join_room'          // Level 0: 基本
  | 'use_reactions'      // Level 0
  | 'create_room'        // Level 1: member
  | 'send_gifts'         // Level 1
  | 'invite_friends'     // Level 1
  | 'start_polls'        // Level 2: trusted
  | 'moderate_mute'      // Level 2
  | 'create_events'      // Level 3: veteran
  | 'pin_messages'       // Level 3
  | 'community_moderate' // Level 4: guardian
  | 'feature_rooms';     // Level 4

const LEVEL_THRESHOLDS: Array<{ level: TrustLevel; minScore: number; permissions: Permission[] }> = [
  { level: 'newcomer', minScore: 0, permissions: ['join_room', 'use_reactions'] },
  { level: 'member', minScore: 100, permissions: ['create_room', 'send_gifts', 'invite_friends'] },
  { level: 'trusted', minScore: 300, permissions: ['start_polls', 'moderate_mute'] },
  { level: 'veteran', minScore: 600, permissions: ['create_events', 'pin_messages'] },
  { level: 'guardian', minScore: 900, permissions: ['community_moderate', 'feature_rooms'] },
];

const SCORE_ACTIONS = {
  joinSession: 2,
  completeSession: 5,      // 5分以上参加
  receiveReaction: 1,
  receiveFriend: 10,
  receiveGift: 3,
  hostSession: 8,
  positiveReport: -50,     // 通報された(確認済み)
  falseReport: -20,        // 虚偽通報した
  spamDetected: -30,
  streakDay: 3,
};

const STORAGE_KEY = 'kokoro_trust';

export class TrustScoreSystem {
  private profiles: Map<string, TrustProfile> = new Map();

  constructor() {
    this.loadProfiles();
  }

  private loadProfiles(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const arr: TrustProfile[] = JSON.parse(data);
        for (const p of arr) this.profiles.set(p.userId, p);
      }
    } catch { /* ignore */ }
  }

  private saveProfiles(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.profiles.values()).slice(-50)));
    } catch { /* full */ }
  }

  /**
   * ユーザーのプロフィールを取得/作成
   */
  getOrCreate(userId: string): TrustProfile {
    if (!this.profiles.has(userId)) {
      const profile: TrustProfile = {
        userId, score: 0, level: 'newcomer',
        positiveActions: 0, negativeActions: 0,
        reportCount: 0, joinedAt: Date.now(),
        permissions: ['join_room', 'use_reactions'],
      };
      this.profiles.set(userId, profile);
    }
    return this.profiles.get(userId)!;
  }

  /**
   * スコアを加算/減算
   */
  modifyScore(userId: string, action: keyof typeof SCORE_ACTIONS): TrustProfile {
    const profile = this.getOrCreate(userId);
    const delta = SCORE_ACTIONS[action];

    profile.score = Math.max(0, Math.min(1000, profile.score + delta));

    if (delta > 0) profile.positiveActions++;
    else profile.negativeActions++;

    // レベルと権限を再計算
    const levelEntry = [...LEVEL_THRESHOLDS].reverse().find(l => profile.score >= l.minScore);
    if (levelEntry) {
      profile.level = levelEntry.level;
      // 累積的に権限を付与
      profile.permissions = LEVEL_THRESHOLDS
        .filter(l => profile.score >= l.minScore)
        .flatMap(l => l.permissions);
    }

    this.saveProfiles();
    return profile;
  }

  /**
   * 権限チェック
   */
  hasPermission(userId: string, permission: Permission): boolean {
    const profile = this.getOrCreate(userId);
    return profile.permissions.includes(permission);
  }

  getProfile(userId: string): TrustProfile { return this.getOrCreate(userId); }

  static getLevelInfo(level: TrustLevel): { emoji: string; label: string; color: string } {
    switch (level) {
      case 'newcomer': return { emoji: '🌱', label: '新参者', color: 'text-gray-400' };
      case 'member': return { emoji: '🤝', label: 'メンバー', color: 'text-blue-400' };
      case 'trusted': return { emoji: '⭐', label: '信頼者', color: 'text-emerald-400' };
      case 'veteran': return { emoji: '🏅', label: 'ベテラン', color: 'text-amber-400' };
      case 'guardian': return { emoji: '👑', label: '守護者', color: 'text-violet-400' };
    }
  }
}
