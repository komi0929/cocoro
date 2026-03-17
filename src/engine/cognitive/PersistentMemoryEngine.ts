/**
 * cocoro — PersistentMemoryEngine
 * Google Titans / Inworld AI相当の永続記憶 — IndexedDB実装(運用コスト¥0)
 *
 * 2026年メタバースレポート:
 * - Google Titans: 200万トークン超のコンテキスト保持
 * - Inworld AI: NPCの行動記憶 + 状況認識
 * - cocoro: IndexedDBでユーザー間関係/会話記憶/嗜好を永続保存
 *
 * Clubhouseの教訓: ライブ限定→記憶なし→関係が浅い
 * cocoro: 「前回の続き」が可能=深い関係構築
 */

export type RelationshipLevel = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend';

export interface RelationshipRecord {
  participantId: string;
  displayName: string;
  level: RelationshipLevel;
  // 定量データ
  totalConversationMinutes: number;
  sessionCount: number;
  lastSeenTimestamp: number;
  firstMetTimestamp: number;
  // 定性データ
  sharedTopics: string[];
  sharedJokes: string[];           // 共有した笑いの記録
  memorableQuotes: string[];       // 印象的な発言
  commonEmotions: string[];        // よく共有する感情
  // スコア
  affinityScore: number;           // 0-100 親密度
  trustScore: number;              // 0-100 信頼度
  interactionVariety: number;      // 0-100 交流の多様性
}

export interface ConversationMemory {
  sessionId: string;
  timestamp: number;
  duration: number;
  participantIds: string[];
  highlights: string[];
  dominantTopics: string[];
  peakEmotion: string;
  qualityScore: number; // 0-100
}

export interface UserPreference {
  preferredTopics: string[];
  dislikedTopics: string[];
  favoriteRoomSize: number;
  activeHours: number[];       // 0-23
  communicationStyle: 'listener' | 'talker' | 'balanced';
  bgmPreference: string;
  introExtroScore: number;     // 0=intro 1=extro
}

const DB_NAME = 'cocoro_memory';
const DB_VERSION = 1;

export class PersistentMemoryEngine {
  private db: IDBDatabase | null = null;
  private cache: Map<string, RelationshipRecord> = new Map();
  private memoryCache: ConversationMemory[] = [];
  private preferences: UserPreference;
  private isReady = false;

  constructor() {
    this.preferences = {
      preferredTopics: [],
      dislikedTopics: [],
      favoriteRoomSize: 5,
      activeHours: [],
      communicationStyle: 'balanced',
      bgmPreference: 'lofi',
      introExtroScore: 0.5,
    };
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') { this.isReady = true; return; }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const tdb = (event.target as IDBOpenDBRequest).result;
          if (!tdb.objectStoreNames.contains('relationships')) {
            tdb.createObjectStore('relationships', { keyPath: 'participantId' });
          }
          if (!tdb.objectStoreNames.contains('conversations')) {
            const convStore = tdb.createObjectStore('conversations', { keyPath: 'sessionId' });
            convStore.createIndex('timestamp', 'timestamp');
          }
          if (!tdb.objectStoreNames.contains('preferences')) {
            tdb.createObjectStore('preferences', { keyPath: 'key' });
          }
        };
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isReady = true;
          this.loadCache();
          resolve();
        };
        request.onerror = () => { this.isReady = true; resolve(); };
      } catch {
        this.isReady = true;
        resolve();
      }
    });
  }

  /** 会話セッション記録 */
  recordConversation(memory: ConversationMemory): void {
    this.memoryCache.push(memory);
    if (this.memoryCache.length > 200) this.memoryCache = this.memoryCache.slice(-100);
    this.writeToStore('conversations', memory);

    // Update relationships
    memory.participantIds.forEach(pid => {
      this.updateRelationship(pid, memory.duration, memory.dominantTopics);
    });
  }

  /** 関係更新 */
  updateRelationship(participantId: string, durationMinutes: number, topics: string[] = []): void {
    const existing = this.cache.get(participantId) ?? this.createNewRelationship(participantId);

    existing.totalConversationMinutes += durationMinutes;
    existing.sessionCount++;
    existing.lastSeenTimestamp = Date.now();

    // トピック蓄積
    topics.forEach(t => {
      if (!existing.sharedTopics.includes(t)) {
        existing.sharedTopics.push(t);
        if (existing.sharedTopics.length > 20) existing.sharedTopics.shift();
      }
    });

    // 親密度計算
    existing.affinityScore = this.calculateAffinity(existing);
    existing.level = this.determineLevel(existing.affinityScore);

    this.cache.set(participantId, existing);
    this.writeToStore('relationships', existing);
  }

  /** 記憶的発言の記録 */
  recordMemorableQuote(participantId: string, quote: string): void {
    const rel = this.cache.get(participantId);
    if (rel) {
      rel.memorableQuotes.push(quote);
      if (rel.memorableQuotes.length > 10) rel.memorableQuotes.shift();
      this.cache.set(participantId, rel);
      this.writeToStore('relationships', rel);
    }
  }

  /** 特定ユーザーとの関係取得 */
  getRelationship(participantId: string): RelationshipRecord | null {
    return this.cache.get(participantId) ?? null;
  }

  /** 全関係リスト(親密度順) */
  getAllRelationships(): RelationshipRecord[] {
    return Array.from(this.cache.values()).sort((a, b) => b.affinityScore - a.affinityScore);
  }

  /** 友達以上の関係リスト */
  getFriends(): RelationshipRecord[] {
    return this.getAllRelationships().filter(r => r.level === 'friend' || r.level === 'close_friend' || r.level === 'best_friend');
  }

  /** 共通話題の提案(2人の共有トピックから) */
  suggestTopics(participantIds: string[]): string[] {
    const topicSets = participantIds.map(id => new Set(this.cache.get(id)?.sharedTopics ?? []));
    if (topicSets.length < 2) return [];

    const common: string[] = [];
    topicSets[0].forEach(topic => {
      if (topicSets.slice(1).every(s => s.has(topic))) common.push(topic);
    });
    return common;
  }

  /** ユーザー嗜好更新 */
  updatePreference(partial: Partial<UserPreference>): void {
    Object.assign(this.preferences, partial);
    this.writeToStore('preferences', { key: 'user_prefs', ...this.preferences });
  }

  getPreferences(): UserPreference { return { ...this.preferences }; }

  /** 最近の会話記憶 */
  getRecentMemories(count = 10): ConversationMemory[] {
    return this.memoryCache.slice(-count).reverse();
  }

  // ========== Private ==========

  private calculateAffinity(rel: RelationshipRecord): number {
    let score = 0;
    score += Math.min(30, rel.totalConversationMinutes / 10);    // Max 30 from time
    score += Math.min(20, rel.sessionCount * 2);                  // Max 20 from frequency
    score += Math.min(15, rel.sharedTopics.length * 3);          // Max 15 from shared topics
    score += Math.min(10, rel.memorableQuotes.length * 2);       // Max 10 from memorable moments
    // Recency bonus
    const daysSinceLastSeen = (Date.now() - rel.lastSeenTimestamp) / 86400000;
    score += Math.max(0, 15 - daysSinceLastSeen);                // Max 15 from recency
    // Longevity
    const daysSinceFirstMet = (Date.now() - rel.firstMetTimestamp) / 86400000;
    score += Math.min(10, daysSinceFirstMet / 7);                // Max 10 from longevity
    return Math.round(Math.min(100, score));
  }

  private determineLevel(affinity: number): RelationshipLevel {
    if (affinity >= 80) return 'best_friend';
    if (affinity >= 60) return 'close_friend';
    if (affinity >= 35) return 'friend';
    if (affinity >= 10) return 'acquaintance';
    return 'stranger';
  }

  private createNewRelationship(participantId: string): RelationshipRecord {
    return {
      participantId,
      displayName: participantId,
      level: 'stranger',
      totalConversationMinutes: 0,
      sessionCount: 0,
      lastSeenTimestamp: Date.now(),
      firstMetTimestamp: Date.now(),
      sharedTopics: [],
      sharedJokes: [],
      memorableQuotes: [],
      commonEmotions: [],
      affinityScore: 0,
      trustScore: 50,
      interactionVariety: 0,
    };
  }

  private writeToStore(storeName: string, data: unknown): void {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(data);
    } catch { /* IndexedDB unavailable */ }
  }

  private async loadCache(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('relationships', 'readonly');
      const req = tx.objectStore('relationships').getAll();
      req.onsuccess = () => {
        (req.result as RelationshipRecord[]).forEach(r => this.cache.set(r.participantId, r));
      };
    } catch { /* ignore */ }
  }
}
