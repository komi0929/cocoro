/**
 * cocoro — MomentReaction
 * 画面全体にリアクションが降り注ぐ**拡張リアクションシステム**
 *
 * TikTok Liveから学ぶ: 視覚的快感=エンゲージメント
 * ReactionPanelの上位版
 *
 * 機能:
 * 1. 画面全体にリアクション降り注ぐ
 * 2. コンボリアクション(連打→巨大化)
 * 3. フルスクリーンリアクション(10+ 同時)
 * 4. リアクションウォール(全員の反応を壁面に)
 * 5. カスタムリアクション(テキスト/絵文字)
 * 6. チェーンリアクション(連鎖)
 */

export interface MomentReactionItem {
  id: string;
  emoji: string;
  userId: string;
  x: number;      // 0-1 screen position
  y: number;
  size: number;    // 1-5x
  opacity: number; // 0-1
  velocity: number;
  timestamp: number;
}

export interface ComboState {
  emoji: string;
  count: number;
  lastTime: number;
  level: number; // 1=normal, 2=big, 3=huge, 4=explosive
}

export interface MomentReactionState {
  activeReactions: MomentReactionItem[];
  combos: Map<string, ComboState>;  // emoji → combo
  totalReactions: number;
  fullScreenActive: boolean;
  fullScreenEmoji: string | null;
  chainActive: boolean;
  chainLength: number;
  reactionWall: { emoji: string; userId: string }[];
}

const COMBO_LEVELS = [
  { threshold: 1, level: 1, sizeMult: 1, label: '' },
  { threshold: 5, level: 2, sizeMult: 1.5, label: 'NICE!' },
  { threshold: 15, level: 3, sizeMult: 2.5, label: 'AMAZING!' },
  { threshold: 30, level: 4, sizeMult: 4, label: '🔥 EXPLOSION!' },
  { threshold: 50, level: 5, sizeMult: 6, label: '💥 LEGENDARY!' },
];

export class MomentReaction {
  private state: MomentReactionState;
  private nextId = 0;

  constructor() {
    this.state = {
      activeReactions: [],
      combos: new Map(),
      totalReactions: 0,
      fullScreenActive: false,
      fullScreenEmoji: null,
      chainActive: false,
      chainLength: 0,
      reactionWall: [],
    };
  }

  /** リアクション追加 */
  addReaction(userId: string, emoji: string): MomentReactionItem {
    this.state.totalReactions++;

    // Combo tracking
    const combo = this.state.combos.get(emoji) ?? { emoji, count: 0, lastTime: 0, level: 1 };
    const now = Date.now();

    if (now - combo.lastTime < 2000) {
      combo.count++;
    } else {
      combo.count = 1;
    }
    combo.lastTime = now;

    // Determine combo level
    const comboLevel = COMBO_LEVELS.reduce((best, cl) => combo.count >= cl.threshold ? cl : best, COMBO_LEVELS[0]);
    combo.level = comboLevel.level;
    this.state.combos.set(emoji, combo);

    // Create reaction item
    const item: MomentReactionItem = {
      id: `mr_${this.nextId++}`,
      emoji,
      userId,
      x: 0.1 + Math.random() * 0.8,
      y: 1.1, // Start below screen
      size: comboLevel.sizeMult,
      opacity: 1,
      velocity: 0.005 + Math.random() * 0.01,
      timestamp: now,
    };

    this.state.activeReactions.push(item);

    // Full screen check (10+ same emoji in 3 seconds)
    if (combo.count >= 10 && !this.state.fullScreenActive) {
      this.state.fullScreenActive = true;
      this.state.fullScreenEmoji = emoji;
      setTimeout(() => {
        this.state.fullScreenActive = false;
        this.state.fullScreenEmoji = null;
      }, 3000);
    }

    // Chain reaction
    if (this.state.activeReactions.length > 5) {
      this.state.chainActive = true;
      this.state.chainLength = this.state.activeReactions.length;
    }

    // Reaction wall (last 50)
    this.state.reactionWall.push({ emoji, userId });
    if (this.state.reactionWall.length > 50) this.state.reactionWall.shift();

    return item;
  }

  /** フレーム更新 — アニメーション */
  update(): MomentReactionState {
    const now = Date.now();

    // Move reactions upward + fade
    this.state.activeReactions = this.state.activeReactions.filter(r => {
      r.y -= r.velocity;
      r.opacity = Math.max(0, 1 - (now - r.timestamp) / 4000);
      return r.opacity > 0 && r.y > -0.2;
    });

    // Decay combos
    this.state.combos.forEach((combo, emoji) => {
      if (now - combo.lastTime > 3000) {
        combo.count = Math.max(0, combo.count - 1);
        if (combo.count === 0) this.state.combos.delete(emoji);
      }
    });

    // Chain decay
    if (this.state.activeReactions.length < 3) {
      this.state.chainActive = false;
      this.state.chainLength = 0;
    }

    return { ...this.state, combos: new Map(this.state.combos) };
  }

  /** コンボレベル取得 */
  getComboLevel(emoji: string): { level: number; label: string; count: number } {
    const combo = this.state.combos.get(emoji);
    if (!combo) return { level: 0, label: '', count: 0 };
    const cl = COMBO_LEVELS.reduce((best, c) => combo.count >= c.threshold ? c : best, COMBO_LEVELS[0]);
    return { level: cl.level, label: cl.label, count: combo.count };
  }

  /** 統計 */
  getStats(): { total: number; topEmojis: { emoji: string; count: number }[] } {
    const emojiCounts = new Map<string, number>();
    this.state.reactionWall.forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) ?? 0) + 1);
    });
    const topEmojis = Array.from(emojiCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));

    return { total: this.state.totalReactions, topEmojis };
  }

  getState(): MomentReactionState { return { ...this.state, combos: new Map(this.state.combos) }; }
}
