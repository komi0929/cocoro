/**
 * cocoro — Aha Moment Engine
 * 最初の30秒でユーザーを掴む — オンボーディング心理学
 *
 * リサーチ結果:
 * - 30秒以内に「何ができるか」「なぜ自分に価値があるか」「操作方法」を伝える
 * - Facebook: 10日以内に7人フレンド → Aha Moment
 * - cocoro: 「声を出したらアバターが動いた」がAha Moment
 * - Progressive Onboarding: 一度に全部教えない
 */

export type AhaMomentType =
  | 'avatar_moved'          // アバターが声に反応した
  | 'someone_replied'       // 誰かが返事をしてくれた
  | 'first_reaction'        // 初めてリアクションを使った
  | 'first_friend'          // 初めてフレンドになった
  | 'joined_conversation'   // 会話に参加して2分以上続いた
  | 'received_gift'         // ギフトを受け取った
  | 'room_discovered';      // 面白いルームを見つけた

interface AhaProgress {
  achieved: Set<AhaMomentType>;
  firstSessionComplete: boolean;
  secondsInApp: number;
  conversationSeconds: number;
  friendCount: number;
}

const AHA_DESCRIPTIONS: Record<AhaMomentType, { label: string; emoji: string; reward: number }> = {
  avatar_moved:        { label: '声でアバターが動いた！', emoji: '✨', reward: 10 },
  someone_replied:     { label: '誰かが話しかけてくれた！', emoji: '💬', reward: 15 },
  first_reaction:      { label: 'リアクションを使った！', emoji: '👏', reward: 5 },
  first_friend:        { label: 'フレンドができた！', emoji: '🤝', reward: 20 },
  joined_conversation: { label: '会話を楽しめた！', emoji: '🎉', reward: 15 },
  received_gift:       { label: 'ギフトをもらった！', emoji: '🎁', reward: 10 },
  room_discovered:     { label: '面白い部屋を見つけた！', emoji: '🏠', reward: 10 },
};

const STORAGE_KEY = 'cocoro_aha';

export class AhaMomentEngine {
  private progress: AhaProgress;
  private onAhaCallbacks: Array<(type: AhaMomentType, label: string, reward: number) => void> = [];

  constructor() {
    this.progress = this.loadProgress();
  }

  private loadProgress(): AhaProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...parsed, achieved: new Set(parsed.achieved) };
      }
    } catch { /* ignore */ }
    return {
      achieved: new Set(), firstSessionComplete: false,
      secondsInApp: 0, conversationSeconds: 0, friendCount: 0,
    };
  }

  private saveProgress(): void {
    try {
      const serializable = {
        ...this.progress,
        achieved: Array.from(this.progress.achieved),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch { /* full */ }
  }

  /**
   * Aha Momentの達成を記録
   */
  achieve(type: AhaMomentType): boolean {
    if (this.progress.achieved.has(type)) return false;

    this.progress.achieved.add(type);
    const desc = AHA_DESCRIPTIONS[type];
    this.saveProgress();

    for (const fn of this.onAhaCallbacks) {
      fn(type, desc.label, desc.reward);
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 30, 20, 30, 20]);
    }

    return true;
  }

  /**
   * セッション時間を更新(自動Aha判定)
   */
  updateSessionTime(deltaSeconds: number, isInConversation: boolean): void {
    this.progress.secondsInApp += deltaSeconds;
    if (isInConversation) {
      this.progress.conversationSeconds += deltaSeconds;
      if (this.progress.conversationSeconds >= 120) {
        this.achieve('joined_conversation');
      }
    }
    this.saveProgress();
  }

  /**
   * 進捗メッセージ(最初の30秒用)
   */
  getNextSuggestedAction(): { action: string; emoji: string } | null {
    if (!this.progress.achieved.has('avatar_moved')) {
      return { action: '声を出してみよう！アバターが動くよ', emoji: '🎤' };
    }
    if (!this.progress.achieved.has('first_reaction')) {
      return { action: 'リアクションボタンを押してみよう', emoji: '👍' };
    }
    if (!this.progress.achieved.has('someone_replied')) {
      return { action: '誰かに話しかけてみよう', emoji: '💬' };
    }
    return null;
  }

  /**
   * 全Aha Moment一覧と完了状態
   */
  getAllMoments(): Array<{ type: AhaMomentType; label: string; emoji: string; achieved: boolean; reward: number }> {
    return (Object.entries(AHA_DESCRIPTIONS) as [AhaMomentType, typeof AHA_DESCRIPTIONS[AhaMomentType]][]).map(([type, desc]) => ({
      type, label: desc.label, emoji: desc.emoji,
      achieved: this.progress.achieved.has(type),
      reward: desc.reward,
    }));
  }

  getCompletionPercent(): number {
    return Math.round((this.progress.achieved.size / Object.keys(AHA_DESCRIPTIONS).length) * 100);
  }

  onAha(fn: (type: AhaMomentType, label: string, reward: number) => void): () => void {
    this.onAhaCallbacks.push(fn);
    return () => { this.onAhaCallbacks = this.onAhaCallbacks.filter(f => f !== fn); };
  }
}
