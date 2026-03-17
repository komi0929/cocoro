/**
 * kokoro — MembershipTier + CommunityMilestone + AIAutoModerator + ContentArchive + CreatorDashboard
 * コミュニティ自治の残り5システムを統合実装
 */

// ========================================
// 1. MembershipTier — VTuber的サブスク制度
// ========================================

export type MemberTier = 'free' | 'supporter' | 'vip' | 'patron';

export interface MembershipState {
  userId: string;
  tier: MemberTier;
  since: number;
  monthsActive: number;
  totalSpent: number;
}

export interface TierBenefits {
  tier: MemberTier;
  price: number; // monthly coins
  badge: string;
  customEmotes: number;
  vipRoomAccess: boolean;
  priorityStage: boolean;
  creatorDM: boolean;
  exclusiveEffects: string[];
}

const TIER_CONFIG: TierBenefits[] = [
  { tier: 'free', price: 0, badge: '', customEmotes: 0, vipRoomAccess: false, priorityStage: false, creatorDM: false, exclusiveEffects: [] },
  { tier: 'supporter', price: 500, badge: '⭐', customEmotes: 3, vipRoomAccess: false, priorityStage: false, creatorDM: false, exclusiveEffects: ['sparkle_aura'] },
  { tier: 'vip', price: 1500, badge: '💎', customEmotes: 10, vipRoomAccess: true, priorityStage: true, creatorDM: false, exclusiveEffects: ['sparkle_aura', 'rainbow_trail'] },
  { tier: 'patron', price: 5000, badge: '👑', customEmotes: 50, vipRoomAccess: true, priorityStage: true, creatorDM: true, exclusiveEffects: ['sparkle_aura', 'rainbow_trail', 'golden_entrance'] },
];

export class MembershipTier {
  private members: Map<string, MembershipState> = new Map();

  subscribe(userId: string, tier: MemberTier): boolean {
    const config = TIER_CONFIG.find(t => t.tier === tier);
    if (!config) return false;

    const existing = this.members.get(userId);
    this.members.set(userId, {
      userId,
      tier,
      since: existing?.since ?? Date.now(),
      monthsActive: (existing?.monthsActive ?? 0) + 1,
      totalSpent: (existing?.totalSpent ?? 0) + config.price,
    });
    return true;
  }

  getBenefits(userId: string): TierBenefits {
    const member = this.members.get(userId);
    const tier = member?.tier ?? 'free';
    return TIER_CONFIG.find(t => t.tier === tier) ?? TIER_CONFIG[0];
  }

  getMember(userId: string): MembershipState | null {
    return this.members.get(userId) ?? null;
  }

  /** クリエイター収益(80%分配) */
  getCreatorRevenue(): number {
    let total = 0;
    this.members.forEach(m => { total += TIER_CONFIG.find(t => t.tier === m.tier)?.price ?? 0; });
    return Math.floor(total * 0.8);
  }

  getTierConfig(): TierBenefits[] { return [...TIER_CONFIG]; }
}

// ========================================
// 2. CommunityMilestone — コミュニティ共通目標
// ========================================

export interface Milestone {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetValue: number;
  currentValue: number;
  reward: string;
  isCompleted: boolean;
  completedAt?: number;
}

export class CommunityMilestone {
  private milestones: Milestone[] = [
    { id: 'talk_100h', title: '100時間トーク', description: '全員の会話時間を合わせて100時間達成', emoji: '🎤', targetValue: 360000, currentValue: 0, reward: '限定アバターフレーム', isCompleted: false },
    { id: 'members_50', title: '50人突破', description: 'コミュニティメンバー50人', emoji: '👥', targetValue: 50, currentValue: 0, reward: '特別ルームテーマ', isCompleted: false },
    { id: 'reactions_1k', title: 'リアクション1000回', description: '合計リアクション1000回', emoji: '✨', targetValue: 1000, currentValue: 0, reward: 'カスタムリアクションパック', isCompleted: false },
    { id: 'games_100', title: 'ゲーム100回', description: 'ゲームプレイ100回', emoji: '🎮', targetValue: 100, currentValue: 0, reward: '限定ゲームモード解放', isCompleted: false },
    { id: 'streak_7', title: '7日連続稼働', description: '7日間連続でルームがアクティブ', emoji: '🔥', targetValue: 7, currentValue: 0, reward: '永久バッジ', isCompleted: false },
  ];
  private onComplete: Array<(milestone: Milestone) => void> = [];

  /** 進捗更新 */
  addProgress(milestoneId: string, amount: number): Milestone | null {
    const ms = this.milestones.find(m => m.id === milestoneId);
    if (!ms || ms.isCompleted) return null;

    ms.currentValue = Math.min(ms.targetValue, ms.currentValue + amount);
    if (ms.currentValue >= ms.targetValue) {
      ms.isCompleted = true;
      ms.completedAt = Date.now();
      for (const fn of this.onComplete) fn(ms);
    }
    return { ...ms };
  }

  /** 完了リスナー */
  onMilestoneComplete(fn: (milestone: Milestone) => void): () => void {
    this.onComplete.push(fn);
    return () => { this.onComplete = this.onComplete.filter(f => f !== fn); };
  }

  getAll(): Milestone[] { return this.milestones.map(m => ({ ...m })); }
  getProgress(): number {
    const completed = this.milestones.filter(m => m.isCompleted).length;
    return Math.round((completed / this.milestones.length) * 100);
  }
}

// ========================================
// 3. AIAutoModerator — AI自動モデレーション
// ========================================

export type ToxicityLevel = 'safe' | 'mild' | 'moderate' | 'severe' | 'critical';

export interface ModerationAction {
  userId: string;
  level: ToxicityLevel;
  action: 'none' | 'warn' | 'mute_5min' | 'mute_30min' | 'kick' | 'ban';
  reason: string;
  timestamp: number;
}

export class AIAutoModerator {
  private warningCounts: Map<string, number> = new Map();
  private mutedUntil: Map<string, number> = new Map();
  private actionLog: ModerationAction[] = [];

  // キーワードベース(簡易版 — 本番はMLモデル)
  private toxicPatterns = [
    { pattern: /死ね|殺す/i, level: 'critical' as ToxicityLevel },
    { pattern: /バカ|アホ|消えろ/i, level: 'severe' as ToxicityLevel },
    { pattern: /うざい|きもい|ブス/i, level: 'moderate' as ToxicityLevel },
  ];

  /** テキストのToxicity判定 */
  evaluateText(userId: string, text: string): ModerationAction {
    let maxLevel: ToxicityLevel = 'safe';

    for (const { pattern, level } of this.toxicPatterns) {
      if (pattern.test(text)) {
        const levels: ToxicityLevel[] = ['safe', 'mild', 'moderate', 'severe', 'critical'];
        if (levels.indexOf(level) > levels.indexOf(maxLevel)) {
          maxLevel = level;
        }
      }
    }

    const action = this.determineAction(userId, maxLevel);
    this.actionLog.push(action);
    return action;
  }

  /** 音声のToxicity推定(音量/ピッチ/頻度ベース) */
  evaluateVoice(userId: string, params: { volume: number; pitchVariance: number; duration: number }): ModerationAction {
    let level: ToxicityLevel = 'safe';

    // 長時間の大声 = 攻撃的の可能性
    if (params.volume > 0.9 && params.duration > 10) {
      level = 'mild';
    }
    if (params.volume > 0.95 && params.duration > 30 && params.pitchVariance > 0.5) {
      level = 'moderate';
    }

    return this.determineAction(userId, level);
  }

  /** ミュート状態チェック */
  isMuted(userId: string): boolean {
    const until = this.mutedUntil.get(userId);
    if (!until) return false;
    if (Date.now() > until) {
      this.mutedUntil.delete(userId);
      return false;
    }
    return true;
  }

  private determineAction(userId: string, level: ToxicityLevel): ModerationAction {
    const warnings = this.warningCounts.get(userId) ?? 0;
    let action: ModerationAction['action'] = 'none';
    let reason = '';

    switch (level) {
      case 'safe':
        break;
      case 'mild':
        action = 'warn';
        reason = 'コミュニティガイドラインを確認してください';
        this.warningCounts.set(userId, warnings + 1);
        break;
      case 'moderate':
        action = warnings >= 2 ? 'mute_30min' : 'mute_5min';
        reason = '不適切な発言が検出されました';
        this.warningCounts.set(userId, warnings + 1);
        if (action === 'mute_5min') this.mutedUntil.set(userId, Date.now() + 5 * 60000);
        if (action === 'mute_30min') this.mutedUntil.set(userId, Date.now() + 30 * 60000);
        break;
      case 'severe':
        action = warnings >= 1 ? 'kick' : 'mute_30min';
        reason = '攻撃的な発言が検出されました';
        this.warningCounts.set(userId, warnings + 1);
        if (action === 'mute_30min') this.mutedUntil.set(userId, Date.now() + 30 * 60000);
        break;
      case 'critical':
        action = 'ban';
        reason = '重大な違反が検出されました';
        break;
    }

    return { userId, level, action, reason, timestamp: Date.now() };
  }

  getActionLog(): ModerationAction[] { return [...this.actionLog]; }
  getWarnings(userId: string): number { return this.warningCounts.get(userId) ?? 0; }
}

// ========================================
// 4. ContentArchive — 会話アーカイブ
// ========================================

export interface ArchivedSession {
  id: string;
  roomId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  participantIds: string[];
  highlights: { time: number; label: string; type: string }[];
  summary: string;
  topEmojis: string[];
  peakParticipants: number;
  totalReactions: number;
}

export class ContentArchive {
  private archives: ArchivedSession[] = [];
  private STORAGE_KEY = 'kokoro_content_archive';

  constructor() {
    this.loadFromStorage();
  }

  /** セッション保存 */
  archiveSession(params: {
    roomId: string;
    startTime: number;
    participantIds: string[];
    highlights: { time: number; label: string; type: string }[];
    peakParticipants: number;
    totalReactions: number;
  }): ArchivedSession {
    const session: ArchivedSession = {
      id: `archive_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      roomId: params.roomId,
      startTime: params.startTime,
      endTime: Date.now(),
      durationMinutes: Math.round((Date.now() - params.startTime) / 60000),
      participantIds: params.participantIds,
      highlights: params.highlights,
      summary: this.generateSummary(params),
      topEmojis: [],
      peakParticipants: params.peakParticipants,
      totalReactions: params.totalReactions,
    };

    this.archives.push(session);
    if (this.archives.length > 100) this.archives = this.archives.slice(-50);
    this.saveToStorage();
    return session;
  }

  /** 最近のアーカイブ */
  getRecent(count = 10): ArchivedSession[] {
    return this.archives.slice(-count).reverse();
  }

  /** ルーム別アーカイブ */
  getByRoom(roomId: string): ArchivedSession[] {
    return this.archives.filter(a => a.roomId === roomId);
  }

  /** 名場面集(ハイライト数順) */
  getBestSessions(count = 5): ArchivedSession[] {
    return [...this.archives]
      .sort((a, b) => b.highlights.length - a.highlights.length)
      .slice(0, count);
  }

  private generateSummary(params: { participantIds: string[]; highlights: { label: string }[]; peakParticipants: number }): string {
    const parts: string[] = [];
    parts.push(`${params.participantIds.length}人が参加`);
    if (params.peakParticipants > params.participantIds.length) {
      parts.push(`最大${params.peakParticipants}人`);
    }
    if (params.highlights.length > 0) {
      parts.push(`ハイライト${params.highlights.length}回`);
    }
    return parts.join(' · ');
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) this.archives = JSON.parse(data);
    } catch { /* no storage */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.archives));
    } catch { /* storage full */ }
  }
}

// ========================================
// 5. CreatorDashboard — データドリブン運営
// ========================================

export interface DashboardMetrics {
  // リスナー推移
  listenerHistory: { date: string; count: number }[];
  // 収益
  revenueHistory: { date: string; coins: number }[];
  // エンゲージメント
  avgSessionMinutes: number;
  returnRate: number;       // 翌日復帰率 (0-1)
  peakConcurrent: number;
  totalSessions: number;
  // コンテンツ
  totalHighlights: number;
  totalGamesPlayed: number;
  // トップリスナー
  topListeners: { userId: string; totalMinutes: number; sessions: number }[];
}

export class CreatorDashboard {
  private sessionData: { date: string; listeners: number; duration: number; revenue: number }[] = [];
  private listenerSessions: Map<string, { totalMinutes: number; sessions: number }> = new Map();

  /** セッション記録 */
  recordSession(params: { listenerCount: number; durationMinutes: number; revenue: number }): void {
    const date = new Date().toISOString().split('T')[0];
    this.sessionData.push({
      date,
      listeners: params.listenerCount,
      duration: params.durationMinutes,
      revenue: params.revenue,
    });
  }

  /** リスナー記録 */
  recordListener(userId: string, minutes: number): void {
    const existing = this.listenerSessions.get(userId) ?? { totalMinutes: 0, sessions: 0 };
    existing.totalMinutes += minutes;
    existing.sessions++;
    this.listenerSessions.set(userId, existing);
  }

  /** ダッシュボードメトリクス生成 */
  getMetrics(): DashboardMetrics {
    const byDate = new Map<string, { listeners: number[]; durations: number[]; revenue: number }>();
    this.sessionData.forEach(s => {
      const existing = byDate.get(s.date) ?? { listeners: [], durations: [], revenue: 0 };
      existing.listeners.push(s.listeners);
      existing.durations.push(s.duration);
      existing.revenue += s.revenue;
      byDate.set(s.date, existing);
    });

    const listenerHistory = Array.from(byDate.entries()).map(([date, d]) => ({
      date,
      count: Math.max(...d.listeners),
    }));

    const revenueHistory = Array.from(byDate.entries()).map(([date, d]) => ({
      date,
      coins: d.revenue,
    }));

    const allDurations = this.sessionData.map(s => s.duration);
    const avgSessionMinutes = allDurations.length > 0
      ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
      : 0;

    const topListeners = Array.from(this.listenerSessions.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 10);

    return {
      listenerHistory,
      revenueHistory,
      avgSessionMinutes,
      returnRate: 0.3, // Placeholder (needs multi-day tracking)
      peakConcurrent: listenerHistory.length > 0 ? Math.max(...listenerHistory.map(l => l.count)) : 0,
      totalSessions: this.sessionData.length,
      totalHighlights: 0,
      totalGamesPlayed: 0,
      topListeners,
    };
  }
}
