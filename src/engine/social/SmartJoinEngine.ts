/**
 * kokoro — Smart Join
 * AIが最適な部屋を選ぶ — 「おまかせ入室」
 *
 * サイクル55: ルーム選択のフリクションをゼロに
 * - ユーザーの性格/時間帯/過去の好みからマッチング
 * - 「どの部屋に入ればいいかわからない」を解消
 * - 1ボタンで最適なルームに即入室
 * = Clubhouse失敗原因「何をすればいいかわからない」の解決
 */

export interface RoomScore {
  roomId: string;
  roomName: string;
  score: number;
  reason: string;
  participantCount: number;
  category: string;
}

export interface UserPreferences {
  preferredCategories: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'latenight';
  maxParticipants: number;
  history: Array<{ category: string; enjoymentScore: number }>;
}

interface RoomInfo {
  id: string;
  name: string;
  category: string;
  participantCount: number;
  maxParticipants: number;
  averageFlowScore: number;
  tags: string[];
}

const STORAGE_KEY = 'kokoro_preferences';

export class SmartJoinEngine {
  private preferences: UserPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return {
      preferredCategories: [], preferredTime: 'evening',
      maxParticipants: 8, history: [],
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch { /* full */ }
  }

  /**
   * セッション体験を記録(次回のマッチング精度向上)
   */
  recordExperience(category: string, enjoymentScore: number): void {
    this.preferences.history.push({ category, enjoymentScore });
    if (this.preferences.history.length > 30) this.preferences.history.shift();

    // カテゴリ好みを自動更新
    const categoryScores = new Map<string, number>();
    for (const h of this.preferences.history) {
      categoryScores.set(h.category, (categoryScores.get(h.category) || 0) + h.enjoymentScore);
    }
    this.preferences.preferredCategories = Array.from(categoryScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    this.savePreferences();
  }

  /**
   * ルームスコアリング
   */
  scoreRooms(rooms: RoomInfo[]): RoomScore[] {
    const hour = new Date().getHours();

    return rooms.map(room => {
      let score = 0;
      let reason = '';

      // 1. カテゴリマッチ (40%)
      if (this.preferences.preferredCategories.includes(room.category)) {
        score += 40;
        reason = '好みのカテゴリ';
      }

      // 2. 参加者数 (30%): 少なすぎず多すぎず
      const ratio = room.participantCount / room.maxParticipants;
      if (ratio >= 0.3 && ratio <= 0.7) {
        score += 30;
        if (!reason) reason = 'ちょうどいい人数';
      } else if (ratio > 0 && ratio < 0.3) {
        score += 15; // 少人数だがアリ
      }

      // 3. フロースコア (20%): 盛り上がっている部屋
      score += room.averageFlowScore * 20;
      if (room.averageFlowScore > 0.6 && !reason) reason = '盛り上がっている部屋';

      // 4. 時間帯マッチ (10%)
      const isNight = hour >= 22 || hour < 5;
      if (isNight && room.category === 'night') score += 10;
      if (!isNight && room.category !== 'night') score += 5;

      return {
        roomId: room.id, roomName: room.name,
        score: Math.round(score),
        reason: reason || 'おすすめ',
        participantCount: room.participantCount,
        category: room.category,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * ベストルームを1つ返す
   */
  getBestRoom(rooms: RoomInfo[]): RoomScore | null {
    const scored = this.scoreRooms(rooms);
    return scored.length > 0 ? scored[0] : null;
  }

  getPreferences(): UserPreferences { return { ...this.preferences }; }
}
