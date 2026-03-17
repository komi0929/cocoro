/**
 * cocoro — Favorite Rooms + Room History
 * 常連・お気に入り・「いつもの場所」
 *
 * サイクル13+15: リピートの核
 * - ルームのお気に入り登録
 * - 過去の参加ルーム履歴
 * - 各ルームのベストモーメント記録
 * - 「盛り上がり傾向」の可視化
 */

export interface FavoriteRoom {
  roomId: string;
  roomName: string;
  category: string;
  addedAt: number;
  visitCount: number;
  lastVisitAt: number;
  peakParticipants: number;
  bestMoment: string | null;
}

export interface RoomVisitRecord {
  roomId: string;
  roomName: string;
  visitedAt: number;
  durationMinutes: number;
  participantCount: number;
  flowPeak: number;
  highlights: string[];
}

const FAV_KEY = 'cocoro_favorite_rooms';
const HISTORY_KEY = 'cocoro_room_history';

export class FavoriteRoomsManager {
  private favorites: Map<string, FavoriteRoom> = new Map();
  private history: RoomVisitRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const favData = localStorage.getItem(FAV_KEY);
      if (favData) {
        const arr: FavoriteRoom[] = JSON.parse(favData);
        for (const f of arr) this.favorites.set(f.roomId, f);
      }
      const histData = localStorage.getItem(HISTORY_KEY);
      if (histData) this.history = JSON.parse(histData);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(this.favorites.values())));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-50)));
    } catch { /* full */ }
  }

  addFavorite(roomId: string, roomName: string, category: string): void {
    if (this.favorites.has(roomId)) return;
    this.favorites.set(roomId, {
      roomId, roomName, category,
      addedAt: Date.now(), visitCount: 0,
      lastVisitAt: Date.now(), peakParticipants: 0,
      bestMoment: null,
    });
    this.saveToStorage();
  }

  removeFavorite(roomId: string): void {
    this.favorites.delete(roomId);
    this.saveToStorage();
  }

  isFavorite(roomId: string): boolean { return this.favorites.has(roomId); }

  recordVisit(params: {
    roomId: string; roomName: string;
    durationMinutes: number; participantCount: number;
    flowPeak: number; highlights: string[];
  }): void {
    this.history.push({ ...params, visitedAt: Date.now() });

    const fav = this.favorites.get(params.roomId);
    if (fav) {
      fav.visitCount++;
      fav.lastVisitAt = Date.now();
      if (params.participantCount > fav.peakParticipants) {
        fav.peakParticipants = params.participantCount;
      }
      if (params.highlights.length > 0) {
        fav.bestMoment = params.highlights[0];
      }
    }

    this.saveToStorage();
  }

  getFavorites(): FavoriteRoom[] {
    return Array.from(this.favorites.values())
      .sort((a, b) => b.lastVisitAt - a.lastVisitAt);
  }

  getHistory(limit: number = 20): RoomVisitRecord[] {
    return this.history.slice(-limit).reverse();
  }

  getMostVisitedRooms(limit: number = 5): FavoriteRoom[] {
    return this.getFavorites().sort((a, b) => b.visitCount - a.visitCount).slice(0, limit);
  }
}
