/**
 * kokoro — ReputationFederation
 * ルーム間で評判を**共有する連邦制**システム
 *
 * TrustScoreSystemの上位版
 * 「このルームでの良い行動」が他ルームでも認知される
 * バンリスト共有 = 悪質ユーザーの連邦ブロック
 *
 * Clubhouseの教訓: モデレーション不足を根本解決
 * Discord/Redditから学ぶ: 分散型信頼システム
 */

export interface ReputationRecord {
  participantId: string;
  roomId: string;
  score: number;        // -100 to +100
  positiveActions: number;
  negativeActions: number;
  reports: number;
  bans: number;
  lastUpdated: number;
}

export interface FederatedReputation {
  participantId: string;
  globalScore: number;    // weighted average across rooms
  roomScores: Map<string, number>;
  totalPositive: number;
  totalNegative: number;
  totalReports: number;
  isFederallyBanned: boolean;
  trustLevel: 'untrusted' | 'newcomer' | 'trusted' | 'respected' | 'exemplary';
  badges: string[];
}

export type ReputationAction =
  | 'helpful_comment'     // +3
  | 'great_host'          // +10
  | 'conflict_resolved'   // +5
  | 'welcomed_newbie'     // +2
  | 'reported_valid'      // +5 (正当な通報)
  | 'toxic_behavior'      // -10
  | 'harassment'          // -20
  | 'spam'                // -5
  | 'ban_received'        // -30
  | 'false_report';       // -3

const ACTION_SCORES: Record<ReputationAction, number> = {
  helpful_comment: 3,
  great_host: 10,
  conflict_resolved: 5,
  welcomed_newbie: 2,
  reported_valid: 5,
  toxic_behavior: -10,
  harassment: -20,
  spam: -5,
  ban_received: -30,
  false_report: -3,
};

const TRUST_THRESHOLDS = [
  { min: -Infinity, max: -20, level: 'untrusted' as const },
  { min: -20, max: 10, level: 'newcomer' as const },
  { min: 10, max: 50, level: 'trusted' as const },
  { min: 50, max: 150, level: 'respected' as const },
  { min: 150, max: Infinity, level: 'exemplary' as const },
];

const BADGE_CRITERIA: { badge: string; condition: (rep: FederatedReputation) => boolean }[] = [
  { badge: '🛡️ Guardian', condition: r => r.globalScore >= 100 && r.totalReports === 0 },
  { badge: '🌟 Star Host', condition: r => r.totalPositive >= 50 },
  { badge: '🤝 Peacemaker', condition: r => r.globalScore >= 30 && r.totalNegative === 0 },
  { badge: '👋 Welcomer', condition: r => r.totalPositive >= 20 },
  { badge: '🏆 Veteran', condition: r => r.roomScores.size >= 10 },
];

export class ReputationFederation {
  private records: Map<string, Map<string, ReputationRecord>> = new Map(); // participantId → (roomId → record)
  private federalBanList: Set<string> = new Set();
  private STORAGE_KEY = 'kokoro_reputation_federation';

  constructor() {
    this.loadFromStorage();
  }

  /** レピュテーションアクション記録 */
  recordAction(participantId: string, roomId: string, action: ReputationAction): void {
    if (!this.records.has(participantId)) {
      this.records.set(participantId, new Map());
    }
    const roomRecords = this.records.get(participantId)!;

    if (!roomRecords.has(roomId)) {
      roomRecords.set(roomId, {
        participantId, roomId, score: 0,
        positiveActions: 0, negativeActions: 0,
        reports: 0, bans: 0, lastUpdated: Date.now(),
      });
    }

    const record = roomRecords.get(roomId)!;
    const delta = ACTION_SCORES[action];
    record.score = Math.max(-100, Math.min(100, record.score + delta));
    record.lastUpdated = Date.now();

    if (delta > 0) record.positiveActions++;
    else record.negativeActions++;

    if (action === 'ban_received') {
      record.bans++;
      // Federal ban: 3+ bans across different rooms
      if (this.getTotalBans(participantId) >= 3) {
        this.federalBanList.add(participantId);
      }
    }

    this.saveToStorage();
  }

  /** 連邦評判の取得 */
  getFederatedReputation(participantId: string): FederatedReputation {
    const roomRecords = this.records.get(participantId);

    if (!roomRecords || roomRecords.size === 0) {
      return {
        participantId,
        globalScore: 0,
        roomScores: new Map(),
        totalPositive: 0,
        totalNegative: 0,
        totalReports: 0,
        isFederallyBanned: this.federalBanList.has(participantId),
        trustLevel: 'newcomer',
        badges: [],
      };
    }

    let totalScore = 0;
    let totalPositive = 0;
    let totalNegative = 0;
    let totalReports = 0;
    const roomScores = new Map<string, number>();

    roomRecords.forEach((record, roomId) => {
      totalScore += record.score;
      totalPositive += record.positiveActions;
      totalNegative += record.negativeActions;
      totalReports += record.reports;
      roomScores.set(roomId, record.score);
    });

    const globalScore = Math.round(totalScore / roomRecords.size);
    const trustLevel = TRUST_THRESHOLDS.find(t => globalScore >= t.min && globalScore < t.max)?.level ?? 'newcomer';

    const rep: FederatedReputation = {
      participantId,
      globalScore,
      roomScores,
      totalPositive,
      totalNegative,
      totalReports,
      isFederallyBanned: this.federalBanList.has(participantId),
      trustLevel,
      badges: [],
    };

    // Compute badges
    rep.badges = BADGE_CRITERIA.filter(bc => bc.condition(rep)).map(bc => bc.badge);

    return rep;
  }

  /** 連邦BAN判定 */
  isFederallyBanned(participantId: string): boolean {
    return this.federalBanList.has(participantId);
  }

  /** ルーム共有バンリスト */
  getSharedBanList(): string[] {
    return Array.from(this.federalBanList);
  }

  private getTotalBans(participantId: string): number {
    const records = this.records.get(participantId);
    if (!records) return 0;
    let total = 0;
    records.forEach(r => { total += r.bans; });
    return total;
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.federalBanList = new Set(parsed.bans ?? []);
      }
    } catch { /* no storage */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        bans: Array.from(this.federalBanList),
      }));
    } catch { /* storage full */ }
  }
}
