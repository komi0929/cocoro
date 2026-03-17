/**
 * cocoro — Conversation Memory AI
 * 会話の文脈を理解して「共有記憶」を作る
 *
 * 反復241-250:
 * - ピークモーメントにタグ付け（自動ラベリング）
 * - セッション間で「前回の続き」を感じさせる
 * - 再会時に「〇〇さんとの最後の会話は3日前」を表示
 * - ルームごとの「伝説」を蓄積
 * = 一期一会ではなく「場に歴史がある」体験
 */

export interface SharedMemory {
  id: string;
  roomId: string;
  timestamp: number;
  type: 'peak_moment' | 'first_meeting' | 'long_session' | 'zone_entry' | 'collective_laugh';
  participants: string[];
  description: string;
  emotionalSignature: string;  // dominant emotion
  intensity: number;           // 0-1
}

export interface ConnectionRecord {
  participantId: string;
  displayName: string;
  firstMet: number;
  lastSeen: number;
  sharedSessions: number;
  sharedPeakMoments: number;
  connectionStrength: number;  // 0-1: based on frequency + recency + peaks
}

const MEMORY_STORAGE_KEY = 'cocoro_shared_memories';
const CONNECTION_STORAGE_KEY = 'cocoro_connections';

export class ConversationMemoryAI {
  private memories: SharedMemory[] = [];
  private connections: Map<string, ConnectionRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const memData = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (memData) this.memories = JSON.parse(memData);

      const connData = localStorage.getItem(CONNECTION_STORAGE_KEY);
      if (connData) {
        const arr: ConnectionRecord[] = JSON.parse(connData);
        for (const c of arr) this.connections.set(c.participantId, c);
      }
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories.slice(-200)));
      localStorage.setItem(CONNECTION_STORAGE_KEY,
        JSON.stringify(Array.from(this.connections.values())));
    } catch { /* storage full */ }
  }

  /**
   * 共有記憶を追加
   */
  addMemory(memory: Omit<SharedMemory, 'id'>): void {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.memories.push({ ...memory, id });

    // Update connections
    for (const pid of memory.participants) {
      this.touchConnection(pid, pid, memory.type === 'peak_moment');
    }

    this.saveToStorage();
  }

  /**
   * コネクション記録を更新
   */
  touchConnection(participantId: string, displayName: string, hadPeakMoment: boolean = false): void {
    const existing = this.connections.get(participantId);
    const now = Date.now();

    if (existing) {
      existing.lastSeen = now;
      existing.sharedSessions++;
      if (hadPeakMoment) existing.sharedPeakMoments++;
      existing.connectionStrength = this.calculateConnectionStrength(existing);
    } else {
      this.connections.set(participantId, {
        participantId,
        displayName,
        firstMet: now,
        lastSeen: now,
        sharedSessions: 1,
        sharedPeakMoments: hadPeakMoment ? 1 : 0,
        connectionStrength: 0.1,
      });
    }
  }

  private calculateConnectionStrength(conn: ConnectionRecord): number {
    const now = Date.now();
    const daysSinceLastSeen = (now - conn.lastSeen) / (1000 * 60 * 60 * 24);
    const recency = Math.exp(-daysSinceLastSeen / 14); // Half-life: 14 days
    const frequency = Math.min(1, conn.sharedSessions / 20); // Max at 20 sessions
    const peaks = Math.min(1, conn.sharedPeakMoments / 5); // Max at 5 peaks

    return Math.min(1, recency * 0.4 + frequency * 0.35 + peaks * 0.25);
  }

  /**
   * ルームの「伝説」（最強のピークモーメント集）
   */
  getRoomLegends(roomId: string, limit: number = 5): SharedMemory[] {
    return this.memories
      .filter(m => m.roomId === roomId)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, limit);
  }

  /**
   * 特定の人との関係
   */
  getConnection(participantId: string): ConnectionRecord | null {
    return this.connections.get(participantId) ?? null;
  }

  /**
   * 全コネクション（強度順）
   */
  getAllConnections(): ConnectionRecord[] {
    return Array.from(this.connections.values())
      .map(c => ({ ...c, connectionStrength: this.calculateConnectionStrength(c) }))
      .sort((a, b) => b.connectionStrength - a.connectionStrength);
  }

  /**
   * 最近の記憶
   */
  getRecentMemories(limit: number = 10): SharedMemory[] {
    return this.memories.slice(-limit).reverse();
  }
}
