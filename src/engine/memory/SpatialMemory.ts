/**
 * cocoro — Spatial Memory (IndexedDB永続化)
 * 空間の「記憶」をブラウザ内に永続保存する
 * 
 * 思想: Razer AVAの「永続クロスプラットフォーム記憶」を超える
 *   AVA: テキストベース記憶 → cocoro: 空間そのものが記憶
 * 
 * 保存データ:
 *   - 声量ヒートマップ: 座標ごとの累積エネルギー
 *   - 感情スナップショット: 訪問時の支配的感情
 *   - アバター進化データ: 累積発話秒数、感情履歴
 *   - 訪問履歴: タイムスタンプ、滞在時間
 * 
 * AIランタイムゼロ: 全てブラウザ内IndexedDB
 */

const DB_NAME = 'cocoro_spatial_memory';
const DB_VERSION = 1;
const STORE_HEATMAP = 'voice_heatmap';
const STORE_AVATAR = 'avatar_evolution';
const STORE_VISITS = 'visit_history';

export interface HeatmapCell {
  x: number;
  z: number;
  energy: number; // cumulative voice energy at this cell
  peakEmotion: string; // most frequent dominant emotion here
  lastUpdated: number; // timestamp
}

export interface AvatarEvolution {
  avatarId: string;
  totalSpeechSeconds: number;
  emotionCounts: Record<string, number>; // { joy: 120, anger: 5, ... }
  voiceSignatureHex: string | null;
  lastSeen: number;
}

export interface VisitRecord {
  roomId: string;
  timestamp: number;
  durationSeconds: number;
  dominantEmotion: string;
  participantCount: number;
}

class SpatialMemoryDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_HEATMAP)) {
          const store = db.createObjectStore(STORE_HEATMAP, { keyPath: 'id' });
          store.createIndex('coords', ['x', 'z'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORE_AVATAR)) {
          db.createObjectStore(STORE_AVATAR, { keyPath: 'avatarId' });
        }

        if (!db.objectStoreNames.contains(STORE_VISITS)) {
          const store = db.createObjectStore(STORE_VISITS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('roomId', 'roomId');
          store.createIndex('timestamp', 'timestamp');
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** Update voice energy at a grid cell */
  async updateHeatmap(x: number, z: number, energyDelta: number, emotion: string): Promise<void> {
    if (!this.db) await this.open();

    const gridX = Math.round(x * 2) / 2; // snap to 0.5 grid
    const gridZ = Math.round(z * 2) / 2;
    const id = `${gridX}_${gridZ}`;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_HEATMAP, 'readwrite');
      const store = tx.objectStore(STORE_HEATMAP);

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing: HeatmapCell | undefined = getReq.result;
        const cell: HeatmapCell & { id: string } = {
          id,
          x: gridX,
          z: gridZ,
          energy: (existing?.energy ?? 0) + energyDelta,
          peakEmotion: emotion,
          lastUpdated: Date.now(),
        };
        store.put(cell);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Get all heatmap data */
  async getHeatmap(): Promise<HeatmapCell[]> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_HEATMAP, 'readonly');
      const store = tx.objectStore(STORE_HEATMAP);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  /** Save/update avatar evolution data */
  async saveAvatarEvolution(data: AvatarEvolution): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_AVATAR, 'readwrite');
      tx.objectStore(STORE_AVATAR).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Load avatar evolution data */
  async loadAvatarEvolution(avatarId: string): Promise<AvatarEvolution | null> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_AVATAR, 'readonly');
      const req = tx.objectStore(STORE_AVATAR).get(avatarId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  /** Record a visit */
  async recordVisit(visit: VisitRecord): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_VISITS, 'readwrite');
      tx.objectStore(STORE_VISITS).add(visit);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Get visit history for a room */
  async getVisitHistory(roomId: string): Promise<VisitRecord[]> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_VISITS, 'readonly');
      const index = tx.objectStore(STORE_VISITS).index('roomId');
      const req = index.getAll(roomId);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  }
}

// Singleton
export const spatialMemory = new SpatialMemoryDB();
