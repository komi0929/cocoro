/**
 * cocoro — Listener Engagement System
 * ROM専(声を出さない参加者)が100%参加できるシステム
 *
 * 反復326-335:
 * - ワンタップジェスチャー: タップだけでアバターがリアクション
 * - 「もっと聞きたい」シグナル → 話者にそっと通知
 * - 「うんうん」連打 → うなずきの強度が上がる
 * - リスナースコア: 聞いている時間もアクティビティとしてカウント
 * = 声を出さなくても「そこにいる意味」が生まれる
 */

export type ListenerGesture =
  | 'nod'       // うんうん
  | 'clap'      // 拍手
  | 'laugh'     // 笑い
  | 'wow'       // すごい！
  | 'more'      // もっと聞きたい
  | 'agree';    // 同意

export interface ListenerSignal {
  participantId: string;
  gesture: ListenerGesture;
  intensity: number;  // 0-1 (連打で上がる)
  timestamp: number;
}

interface GestureAccumulator {
  count: number;
  lastTime: number;
  intensity: number;
}

const GESTURE_CONFIG: Record<ListenerGesture, {
  emoji: string;
  label: string;
  cooldownMs: number;
  maxIntensity: number;
  hapticPattern: number[];
}> = {
  nod:   { emoji: '😊', label: 'うんうん', cooldownMs: 300, maxIntensity: 3, hapticPattern: [10] },
  clap:  { emoji: '👏', label: '拍手',     cooldownMs: 200, maxIntensity: 5, hapticPattern: [15, 10, 15] },
  laugh: { emoji: '😂', label: '笑い',     cooldownMs: 300, maxIntensity: 4, hapticPattern: [10, 5, 10, 5, 10] },
  wow:   { emoji: '😮', label: 'すごい！', cooldownMs: 500, maxIntensity: 2, hapticPattern: [20, 10, 30] },
  more:  { emoji: '🙏', label: 'もっと',   cooldownMs: 2000, maxIntensity: 1, hapticPattern: [15, 15] },
  agree: { emoji: '✋', label: '同意',     cooldownMs: 400, maxIntensity: 3, hapticPattern: [10, 5, 10] },
};

export class ListenerEngagementSystem {
  private accumulators: Map<ListenerGesture, GestureAccumulator> = new Map();
  private listeners: Array<(signal: ListenerSignal) => void> = [];
  private participantId: string;
  private listenerScore = 0;
  private listeningStartTime: number | null = null;

  constructor(participantId: string = 'local') {
    this.participantId = participantId;
  }

  /**
   * ジェスチャーを発動
   */
  sendGesture(gesture: ListenerGesture): ListenerSignal | null {
    const config = GESTURE_CONFIG[gesture];
    const now = Date.now();
    const acc = this.accumulators.get(gesture) || { count: 0, lastTime: 0, intensity: 0 };

    // Cooldown check
    if (now - acc.lastTime < config.cooldownMs) return null;

    // Intensity: 連打で上がる (2秒以内のタップが連続するとintensityが上がる)
    if (now - acc.lastTime < 2000) {
      acc.count++;
      acc.intensity = Math.min(config.maxIntensity, acc.count);
    } else {
      acc.count = 1;
      acc.intensity = 1;
    }
    acc.lastTime = now;
    this.accumulators.set(gesture, acc);

    // Haptics
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(config.hapticPattern);
    }

    // Score
    this.listenerScore += gesture === 'more' ? 3 : 1;

    const signal: ListenerSignal = {
      participantId: this.participantId,
      gesture,
      intensity: acc.intensity / config.maxIntensity,
      timestamp: now,
    };

    // Notify
    for (const fn of this.listeners) fn(signal);

    return signal;
  }

  /**
   * リスニング開始/停止追跡
   */
  startListening(): void {
    if (!this.listeningStartTime) {
      this.listeningStartTime = Date.now();
    }
  }

  stopListening(): void {
    if (this.listeningStartTime) {
      const duration = (Date.now() - this.listeningStartTime) / 1000;
      this.listenerScore += Math.floor(duration / 30); // 30秒ごとに1ポイント
      this.listeningStartTime = null;
    }
  }

  /**
   * シグナル受信コールバック登録
   */
  onSignal(fn: (signal: ListenerSignal) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  /**
   * ジェスチャー設定を取得（UI用）
   */
  static getGestureConfig(): typeof GESTURE_CONFIG {
    return GESTURE_CONFIG;
  }

  getScore(): number { return this.listenerScore; }
}
