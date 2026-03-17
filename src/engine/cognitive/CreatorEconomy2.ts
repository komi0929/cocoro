/**
 * cocoro — CreatorEconomy2 + DigitalProvenance + AdaptivePrivacyShield
 * クリエイターエコノミー2.0 / デジタル来歴 / 適応型プライバシー
 *
 * 2026年メタバースレポート:
 * - Roblox: シーズンパス/クリエイター収益$10億/yr
 * - ガートナー: デジタル・プロベナンス(来歴管理)
 * - GDPR/APRA: 生体データ保護 → cocoro: 全てクライアントサイド管理
 *
 * 運用コスト: ¥0
 */

// ========================================
// 1. CreatorEconomy2Engine — シーズンパス + 拡張経済
// ========================================

export interface SeasonPass {
  id: string;
  title: string;
  startDate: number;
  endDate: number;
  challenges: SeasonChallenge[];
  tiers: { level: number; requiredXP: number; reward: string; unlocked: boolean }[];
  currentXP: number;
  currentTier: number;
}

export interface SeasonChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  requirement: { type: 'talk_minutes' | 'reactions' | 'games_played' | 'sessions' | 'friends_made'; target: number };
  progress: number;
  isCompleted: boolean;
}

export interface FanFunding {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  backerCount: number;
  reward: string;
  isCompleted: boolean;
}

export class CreatorEconomy2Engine {
  private activeSeason: SeasonPass | null = null;
  private fanFundings: FanFunding[] = [];

  /** シーズンパス開始 */
  startSeason(title: string, durationDays = 28): SeasonPass {
    const now = Date.now();
    this.activeSeason = {
      id: `season_${now}`,
      title,
      startDate: now,
      endDate: now + durationDays * 86400000,
      challenges: this.generateChallenges(),
      tiers: [
        { level: 1, requiredXP: 0, reward: 'ブロンズバッジ', unlocked: true },
        { level: 2, requiredXP: 100, reward: 'カスタムエモート x3', unlocked: false },
        { level: 3, requiredXP: 300, reward: 'シルバーバッジ + 限定エフェクト', unlocked: false },
        { level: 4, requiredXP: 600, reward: 'ゴールドバッジ + VIPルーム', unlocked: false },
        { level: 5, requiredXP: 1000, reward: 'レジェンダリーアバター装飾', unlocked: false },
      ],
      currentXP: 0,
      currentTier: 1,
    };
    return this.activeSeason;
  }

  /** チャレンジ進捗更新 */
  updateChallengeProgress(type: SeasonChallenge['requirement']['type'], amount: number): void {
    if (!this.activeSeason) return;

    this.activeSeason.challenges.forEach(ch => {
      if (!ch.isCompleted && ch.requirement.type === type) {
        ch.progress = Math.min(ch.requirement.target, ch.progress + amount);
        if (ch.progress >= ch.requirement.target) {
          ch.isCompleted = true;
          this.activeSeason!.currentXP += ch.xpReward;
          this.updateTier();
        }
      }
    });
  }

  /** ファンファンディング作成 */
  createFanFunding(title: string, description: string, goalAmount: number, reward: string): FanFunding {
    const funding: FanFunding = {
      id: `fund_${Date.now()}`,
      title, description, goalAmount, reward,
      currentAmount: 0, backerCount: 0, isCompleted: false,
    };
    this.fanFundings.push(funding);
    return funding;
  }

  /** ファンファンディングへ出資 */
  backFunding(fundingId: string, amount: number): boolean {
    const fund = this.fanFundings.find(f => f.id === fundingId);
    if (!fund || fund.isCompleted) return false;
    fund.currentAmount += amount;
    fund.backerCount++;
    if (fund.currentAmount >= fund.goalAmount) fund.isCompleted = true;
    return true;
  }

  getSeason(): SeasonPass | null { return this.activeSeason; }
  getFundings(): FanFunding[] { return [...this.fanFundings]; }

  private updateTier(): void {
    if (!this.activeSeason) return;
    const xp = this.activeSeason.currentXP;
    this.activeSeason.tiers.forEach(tier => {
      if (xp >= tier.requiredXP) {
        tier.unlocked = true;
        this.activeSeason!.currentTier = tier.level;
      }
    });
  }

  private generateChallenges(): SeasonChallenge[] {
    return [
      { id: 'c1', title: '初めてのトーク', description: '合計30分会話する', xpReward: 50, requirement: { type: 'talk_minutes', target: 30 }, progress: 0, isCompleted: false },
      { id: 'c2', title: 'リアクションマスター', description: '50回リアクションする', xpReward: 30, requirement: { type: 'reactions', target: 50 }, progress: 0, isCompleted: false },
      { id: 'c3', title: 'ゲームチャンピオン', description: '5回ゲームに参加', xpReward: 80, requirement: { type: 'games_played', target: 5 }, progress: 0, isCompleted: false },
      { id: 'c4', title: '常連さん', description: '10回セッションに参加', xpReward: 100, requirement: { type: 'sessions', target: 10 }, progress: 0, isCompleted: false },
      { id: 'c5', title: '友達づくり', description: '3人と友達になる', xpReward: 120, requirement: { type: 'friends_made', target: 3 }, progress: 0, isCompleted: false },
    ];
  }
}

// ========================================
// 2. DigitalProvenanceSystem — デジタル来歴管理
// ========================================

export interface ProvenanceRecord {
  id: string;
  contentType: 'highlight_clip' | 'conversation_archive' | 'reaction_moment' | 'custom';
  creatorId: string;
  participantIds: string[];
  timestamp: number;
  hash: string;        // SHA-256 hash for integrity
  metadata: Record<string, unknown>;
  signatures: { participantId: string; approvedAt: number }[];
  isVerified: boolean;
}

export class DigitalProvenanceSystem {
  private records: ProvenanceRecord[] = [];
  private readonly STORAGE_KEY = 'cocoro_provenance';

  constructor() {
    this.loadFromStorage();
  }

  /** コンテンツ来歴記録 */
  async recordProvenance(
    contentType: ProvenanceRecord['contentType'],
    creatorId: string,
    participantIds: string[],
    metadata: Record<string, unknown>
  ): Promise<ProvenanceRecord> {
    const record: ProvenanceRecord = {
      id: `prov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      contentType,
      creatorId,
      participantIds,
      timestamp: Date.now(),
      hash: await this.computeHash(JSON.stringify({ contentType, creatorId, participantIds, metadata, ts: Date.now() })),
      metadata,
      signatures: [{ participantId: creatorId, approvedAt: Date.now() }],
      isVerified: true,
    };

    this.records.push(record);
    this.saveToStorage();
    return record;
  }

  /** 署名追加(参加者の同意) */
  addSignature(recordId: string, participantId: string): boolean {
    const record = this.records.find(r => r.id === recordId);
    if (!record) return false;
    if (record.signatures.some(s => s.participantId === participantId)) return false;
    record.signatures.push({ participantId, approvedAt: Date.now() });
    this.saveToStorage();
    return true;
  }

  /** 改ざん検証 */
  async verifyIntegrity(recordId: string): Promise<boolean> {
    const record = this.records.find(r => r.id === recordId);
    if (!record) return false;
    const expected = await this.computeHash(JSON.stringify({
      contentType: record.contentType,
      creatorId: record.creatorId,
      participantIds: record.participantIds,
      metadata: record.metadata,
      ts: record.timestamp,
    }));
    return expected === record.hash;
  }

  getRecords(): ProvenanceRecord[] { return [...this.records]; }
  getByCreator(creatorId: string): ProvenanceRecord[] { return this.records.filter(r => r.creatorId === creatorId); }

  private async computeHash(data: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0; }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private loadFromStorage(): void {
    try { const d = localStorage.getItem(this.STORAGE_KEY); if (d) this.records = JSON.parse(d); } catch { /* */ }
  }

  private saveToStorage(): void {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records.slice(-100))); } catch { /* */ }
  }
}

// ========================================
// 3. AdaptivePrivacyShield — 適応型プライバシー保護
// ========================================

export type DataCategory = 'emotion' | 'voice' | 'behavior' | 'relationship' | 'location' | 'biometric';
export type ConsentLevel = 'full' | 'anonymous' | 'aggregate_only' | 'none';

export interface PrivacyPolicy {
  category: DataCategory;
  consentLevel: ConsentLevel;
  retentionDays: number;
  allowSharing: boolean;
}

export interface DataRetentionRecord {
  category: DataCategory;
  storedAt: number;
  expiresAt: number;
  storageKey: string;
}

export class AdaptivePrivacyShield {
  private policies: Map<DataCategory, PrivacyPolicy> = new Map();
  private retentionRecords: DataRetentionRecord[] = [];
  private readonly POLICY_KEY = 'cocoro_privacy_policies';

  constructor() {
    // Default: conservative privacy
    const defaults: PrivacyPolicy[] = [
      { category: 'emotion', consentLevel: 'anonymous', retentionDays: 7, allowSharing: false },
      { category: 'voice', consentLevel: 'none', retentionDays: 0, allowSharing: false },
      { category: 'behavior', consentLevel: 'aggregate_only', retentionDays: 30, allowSharing: false },
      { category: 'relationship', consentLevel: 'full', retentionDays: 365, allowSharing: false },
      { category: 'location', consentLevel: 'none', retentionDays: 0, allowSharing: false },
      { category: 'biometric', consentLevel: 'none', retentionDays: 0, allowSharing: false },
    ];
    defaults.forEach(p => this.policies.set(p.category, p));
    this.loadPolicies();
  }

  /** 同意レベル設定 */
  setConsent(category: DataCategory, level: ConsentLevel): void {
    const policy = this.policies.get(category);
    if (policy) {
      policy.consentLevel = level;
      this.savePolicies();
    }
  }

  /** データ保存前のフィルタリング */
  filterData<T extends Record<string, unknown>>(category: DataCategory, data: T): T | null {
    const policy = this.policies.get(category);
    if (!policy || policy.consentLevel === 'none') return null;

    if (policy.consentLevel === 'anonymous') {
      // Strip identifying fields
      const filtered = { ...data };
      delete filtered.userId;
      delete filtered.participantId;
      delete filtered.displayName;
      delete filtered.ip;
      return filtered;
    }

    if (policy.consentLevel === 'aggregate_only') {
      // Only return aggregated stats
      const filtered = { ...data };
      Object.keys(filtered).forEach(key => {
        if (typeof filtered[key] !== 'number') delete filtered[key];
      });
      return filtered;
    }

    return data; // full consent
  }

  /** 保持期限チェック + 自動削除 */
  enforceRetention(): number {
    const now = Date.now();
    let deleted = 0;

    this.retentionRecords = this.retentionRecords.filter(record => {
      if (record.expiresAt > 0 && now > record.expiresAt) {
        try { localStorage.removeItem(record.storageKey); } catch { /* */ }
        deleted++;
        return false;
      }
      return true;
    });

    return deleted;
  }

  /** データ保持の記録 */
  trackStorage(category: DataCategory, storageKey: string): void {
    const policy = this.policies.get(category);
    if (!policy) return;

    this.retentionRecords.push({
      category,
      storedAt: Date.now(),
      expiresAt: policy.retentionDays > 0 ? Date.now() + policy.retentionDays * 86400000 : 0,
      storageKey,
    });
  }

  /** プライバシーレポート生成 */
  generateReport(): { category: DataCategory; consent: ConsentLevel; storedItems: number; retention: string }[] {
    return Array.from(this.policies.entries()).map(([category, policy]) => ({
      category,
      consent: policy.consentLevel,
      storedItems: this.retentionRecords.filter(r => r.category === category).length,
      retention: policy.retentionDays > 0 ? `${policy.retentionDays}日` : '保存なし',
    }));
  }

  /** 全データ削除(GDPR Right to Erasure) */
  deleteAllData(): void {
    this.retentionRecords.forEach(r => {
      try { localStorage.removeItem(r.storageKey); } catch { /* */ }
    });
    this.retentionRecords = [];
    try { indexedDB.deleteDatabase('cocoro_memory'); } catch { /* */ }
  }

  getPolicies(): PrivacyPolicy[] { return Array.from(this.policies.values()); }
  getPolicy(category: DataCategory): PrivacyPolicy | null { return this.policies.get(category) ?? null; }

  private loadPolicies(): void {
    try {
      const d = localStorage.getItem(this.POLICY_KEY);
      if (d) {
        const saved = JSON.parse(d) as PrivacyPolicy[];
        saved.forEach(p => this.policies.set(p.category, p));
      }
    } catch { /* */ }
  }

  private savePolicies(): void {
    try { localStorage.setItem(this.POLICY_KEY, JSON.stringify(Array.from(this.policies.values()))); } catch { /* */ }
  }
}
