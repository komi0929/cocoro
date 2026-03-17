/**
 * cocoro — Notification Engine
 * 次来る理由を作る通知システム
 *
 * 反復386-395:
 * - フレンドが部屋にいる通知
 * - お気に入りルームが盛り上がっている通知
 * - 深夜のおやすみ通知停止
 * - 通知の種類ごとの優先度管理
 * = リテンション — 「戻ってきたくなる」仕組み
 */

export type NotificationType =
  | 'friend_online'
  | 'friend_in_room'
  | 'room_trending'
  | 'achievement_unlocked'
  | 'session_reminder'
  | 'connection_milestone';

export interface cocoroNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  emoji: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

const STORAGE_KEY = 'cocoro_notifications';

export class NotificationEngine {
  private notifications: cocoroNotification[] = [];
  private isQuietMode = false;
  private onNotifyCallbacks: Array<(n: cocoroNotification) => void> = [];

  constructor() {
    this.loadFromStorage();
    this.updateQuietMode();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) this.notifications = JSON.parse(data);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications.slice(-50)));
    } catch { /* full */ }
  }

  private updateQuietMode(): void {
    const hour = new Date().getHours();
    this.isQuietMode = hour >= 23 || hour < 7;
  }

  /**
   * 通知を発行
   */
  emit(params: {
    type: NotificationType;
    title: string;
    body: string;
    emoji: string;
    priority?: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }): cocoroNotification | null {
    this.updateQuietMode();

    // 深夜モード: lowはブロック
    if (this.isQuietMode && (params.priority ?? 'medium') === 'low') return null;

    const notification: cocoroNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: params.type,
      title: params.title,
      body: params.body,
      emoji: params.emoji,
      timestamp: Date.now(),
      read: false,
      priority: params.priority ?? 'medium',
      actionUrl: params.actionUrl,
    };

    this.notifications.push(notification);
    this.saveToStorage();

    // Callback
    for (const fn of this.onNotifyCallbacks) fn(notification);

    // Browser notification (if permitted)
    this.sendBrowserNotification(notification);

    return notification;
  }

  /**
   * 便利メソッド: フレンドがオンライン
   */
  notifyFriendOnline(friendName: string): cocoroNotification | null {
    return this.emit({
      type: 'friend_online',
      title: `${friendName}がオンライン`,
      body: '部屋に誘ってみましょう！',
      emoji: '👋',
      priority: 'medium',
    });
  }

  /**
   * 便利メソッド: フレンドが部屋にいる
   */
  notifyFriendInRoom(friendName: string, roomName: string, roomId: string): cocoroNotification | null {
    return this.emit({
      type: 'friend_in_room',
      title: `${friendName}が「${roomName}」にいます`,
      body: '参加しますか？',
      emoji: '🏠',
      priority: 'high',
      actionUrl: `/space?room=${roomId}`,
    });
  }

  /**
   * 便利メソッド: ルームが盛り上がっている
   */
  notifyRoomTrending(roomName: string, participantCount: number): cocoroNotification | null {
    return this.emit({
      type: 'room_trending',
      title: `「${roomName}」が盛り上がり中`,
      body: `${participantCount}人が参加中！`,
      emoji: '🔥',
      priority: 'low',
    });
  }

  /**
   * ブラウザ通知
   */
  private async sendBrowserNotification(n: cocoroNotification): Promise<void> {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      if (Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
      return;
    }
    new Notification(`${n.emoji} ${n.title}`, { body: n.body, tag: n.id });
  }

  /**
   * 既読にする
   */
  markAsRead(id: string): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) { n.read = true; this.saveToStorage(); }
  }

  /**
   * 未読数
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * 最近の通知
   */
  getRecent(limit: number = 10): cocoroNotification[] {
    return this.notifications.slice(-limit).reverse();
  }

  /**
   * 通知コールバック
   */
  onNotify(fn: (n: cocoroNotification) => void): () => void {
    this.onNotifyCallbacks.push(fn);
    return () => { this.onNotifyCallbacks = this.onNotifyCallbacks.filter(f => f !== fn); };
  }
}
