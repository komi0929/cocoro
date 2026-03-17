/**
 * kokoro — Event Scheduler
 * 定期イベント — 「金曜深夜のお題トーク」のような文化を作る
 *
 * サイクル29: イベント性の創出
 * - 自動イベント: 曜日/時間帯に応じた定期イベント
 * - 特別ルームの自動生成
 * - イベント通知
 * - 過去イベントの記録と「次回告知」
 * = 「この時間に来れば楽しい」→習慣化
 */

export interface ScheduledEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  dayOfWeek: number;     // 0=Sun 6=Sat
  startHour: number;     // 0-23
  durationHours: number;
  eventType: 'debate' | 'game' | 'topic' | 'free' | 'special';
  roomConfig?: {
    category: string;
    maxParticipants: number;
  };
}

const WEEKLY_EVENTS: ScheduledEvent[] = [
  {
    id: 'mon_hobby', name: '趣味トーク', description: '好きなことを語り合おう！',
    emoji: '🎮', dayOfWeek: 1, startHour: 21, durationHours: 2,
    eventType: 'topic', roomConfig: { category: 'hobby', maxParticipants: 12 },
  },
  {
    id: 'wed_debate', name: '水曜バトル', description: '2択ディベートで盛り上がろう！',
    emoji: '⚔️', dayOfWeek: 3, startHour: 21, durationHours: 2,
    eventType: 'debate', roomConfig: { category: 'game', maxParticipants: 10 },
  },
  {
    id: 'fri_night', name: '金曜深夜のお題トーク', description: '金曜の夜、ゆったり語ろう',
    emoji: '🌙', dayOfWeek: 5, startHour: 23, durationHours: 3,
    eventType: 'topic', roomConfig: { category: 'night', maxParticipants: 8 },
  },
  {
    id: 'sat_game', name: 'ゲームナイト', description: 'ワードウルフ/連想ゲーム大会！',
    emoji: '🎲', dayOfWeek: 6, startHour: 20, durationHours: 3,
    eventType: 'game', roomConfig: { category: 'game', maxParticipants: 12 },
  },
  {
    id: 'sun_chill', name: 'サンデーチル', description: '日曜の午後、まったり雑談',
    emoji: '☕', dayOfWeek: 0, startHour: 14, durationHours: 4,
    eventType: 'free', roomConfig: { category: 'casual', maxParticipants: 16 },
  },
];

export class EventScheduler {
  /**
   * 現在開催中のイベントを取得
   */
  getCurrentEvent(): ScheduledEvent | null {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    return WEEKLY_EVENTS.find(e => {
      if (e.dayOfWeek !== day) return false;
      return hour >= e.startHour && hour < e.startHour + e.durationHours;
    }) || null;
  }

  /**
   * 次のイベントを取得
   */
  getNextEvent(): { event: ScheduledEvent; startsIn: string } | null {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    // Sort by proximity to now
    const sorted = WEEKLY_EVENTS.map(e => {
      let daysUntil = (e.dayOfWeek - day + 7) % 7;
      if (daysUntil === 0 && hour >= e.startHour + e.durationHours) {
        daysUntil = 7; // Already passed today
      }
      const hoursUntil = daysUntil * 24 + (e.startHour - hour);
      return { event: e, hoursUntil };
    }).sort((a, b) => a.hoursUntil - b.hoursUntil);

    if (sorted.length === 0) return null;
    const next = sorted[0];

    let startsIn: string;
    if (next.hoursUntil < 1) startsIn = 'まもなく';
    else if (next.hoursUntil < 24) startsIn = `${Math.floor(next.hoursUntil)}時間後`;
    else startsIn = `${Math.floor(next.hoursUntil / 24)}日後`;

    return { event: next.event, startsIn };
  }

  /**
   * 今日のイベント一覧
   */
  getTodayEvents(): ScheduledEvent[] {
    const day = new Date().getDay();
    return WEEKLY_EVENTS.filter(e => e.dayOfWeek === day);
  }

  /**
   * 全イベント一覧
   */
  getAllEvents(): ScheduledEvent[] { return [...WEEKLY_EVENTS]; }
}
