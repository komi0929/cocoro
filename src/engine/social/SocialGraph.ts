/**
 * kokoro — Social Graph Engine
 * フレンド/つながり管理 — 次来る理由を作る
 *
 * 反復346-355:
 * - 会話後のフレンド申請ワンタップ
 * - フレンドのオンライン状態追跡
 * - コネクション強度(会話頻度/ピーク共有)
 * - 「フレンドの部屋に参加」クイックアクション
 * = リテンションの核 — 「あの人とまた話したい」
 */

export interface Friend {
  id: string;
  displayName: string;
  avatarId: string;
  addedAt: number;
  lastSeenAt: number;
  sharedSessions: number;
  sharedPeakMoments: number;
  connectionStrength: number; // 0-1
  isOnline: boolean;
  currentRoomId: string | null;
  currentRoomName: string | null;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  fromId: string;
  fromName: string;
  toId: string;
  sentAt: number;
  status: FriendRequestStatus;
}

const FRIENDS_STORAGE_KEY = 'kokoro_friends';
const REQUESTS_STORAGE_KEY = 'kokoro_friend_requests';

export class SocialGraph {
  private friends: Map<string, Friend> = new Map();
  private pendingRequests: FriendRequest[] = [];
  private onUpdateCallbacks: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const friendsData = localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (friendsData) {
        const arr: Friend[] = JSON.parse(friendsData);
        for (const f of arr) this.friends.set(f.id, f);
      }
      const reqData = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (reqData) this.pendingRequests = JSON.parse(reqData);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(Array.from(this.friends.values())));
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(this.pendingRequests));
    } catch { /* full */ }
  }

  /**
   * フレンド申請を送信
   */
  sendRequest(fromId: string, fromName: string, toId: string): FriendRequest {
    const req: FriendRequest = {
      fromId, fromName, toId,
      sentAt: Date.now(), status: 'pending',
    };
    this.pendingRequests.push(req);
    this.saveToStorage();
    this.notifyUpdate();
    return req;
  }

  /**
   * フレンド申請を承認
   */
  acceptRequest(fromId: string, displayName: string, avatarId: string): void {
    const req = this.pendingRequests.find(r => r.fromId === fromId && r.status === 'pending');
    if (req) req.status = 'accepted';

    this.friends.set(fromId, {
      id: fromId,
      displayName,
      avatarId,
      addedAt: Date.now(),
      lastSeenAt: Date.now(),
      sharedSessions: 1,
      sharedPeakMoments: 0,
      connectionStrength: 0.2,
      isOnline: true,
      currentRoomId: null,
      currentRoomName: null,
    });

    this.saveToStorage();
    this.notifyUpdate();
  }

  /**
   * フレンドのオンライン状態を更新
   */
  updateFriendPresence(friendId: string, isOnline: boolean, roomId?: string, roomName?: string): void {
    const f = this.friends.get(friendId);
    if (!f) return;
    f.isOnline = isOnline;
    f.lastSeenAt = Date.now();
    if (roomId !== undefined) f.currentRoomId = roomId;
    if (roomName !== undefined) f.currentRoomName = roomName;
    this.notifyUpdate();
  }

  /**
   * セッション共有を記録
   */
  recordSharedSession(friendId: string, hadPeakMoment: boolean): void {
    const f = this.friends.get(friendId);
    if (!f) return;
    f.sharedSessions++;
    if (hadPeakMoment) f.sharedPeakMoments++;
    f.lastSeenAt = Date.now();

    // Recalculate strength
    const daysSince = (Date.now() - f.lastSeenAt) / (86400000);
    const recency = Math.exp(-daysSince / 14);
    const freq = Math.min(1, f.sharedSessions / 20);
    const peaks = Math.min(1, f.sharedPeakMoments / 5);
    f.connectionStrength = Math.min(1, recency * 0.4 + freq * 0.35 + peaks * 0.25);

    this.saveToStorage();
    this.notifyUpdate();
  }

  /**
   * オンラインのフレンド一覧
   */
  getOnlineFriends(): Friend[] {
    return Array.from(this.friends.values()).filter(f => f.isOnline);
  }

  /**
   * 全フレンド（強度順）
   */
  getAllFriends(): Friend[] {
    return Array.from(this.friends.values()).sort((a, b) => b.connectionStrength - a.connectionStrength);
  }

  /**
   * 未処理のフレンド申請
   */
  getPendingRequests(): FriendRequest[] {
    return this.pendingRequests.filter(r => r.status === 'pending');
  }

  isFriend(id: string): boolean { return this.friends.has(id); }
  getFriend(id: string): Friend | undefined { return this.friends.get(id); }

  /**
   * 更新通知
   */
  onUpdate(fn: () => void): () => void {
    this.onUpdateCallbacks.push(fn);
    return () => { this.onUpdateCallbacks = this.onUpdateCallbacks.filter(f => f !== fn); };
  }

  private notifyUpdate(): void {
    for (const fn of this.onUpdateCallbacks) fn();
  }
}
