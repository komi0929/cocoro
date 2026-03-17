/**
 * kokoro — Session Achievements
 * セッション中の達成事項をゲーミフィケーション的に表示
 *
 * 反復271-280:
 * - 初声: セッションで最初に声を出した
 * - ムードメーカー: 最も多くのリアクションを発生させた
 * - 共鳴マスター: CollectiveResonanceを3回発生
 * - フローキーパー: フロー状態を5分以上維持
 * - ブリッジビルダー: 沈黙を3回以上破った
 * - ヒーラー: 場のtensionを最も緩和した
 * = 参加者に「居場所感」と「貢献実感」を与える
 */

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: number;
}

interface AchievementTracker {
  firstVoice: boolean;
  resonanceCount: number;
  flowMinutes: number;
  silenceBreaks: number;
  reactionsTriggered: number;
  tensionReductions: number;
}

const ACHIEVEMENT_DEFS: Array<{
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity: Achievement['rarity'];
  check: (t: AchievementTracker) => boolean;
}> = [
  {
    id: 'first_voice',    icon: '🎤', title: '初声',
    description: 'セッションで最初に声を出した',
    rarity: 'common',
    check: (t) => t.firstVoice,
  },
  {
    id: 'mood_maker',     icon: '🎉', title: 'ムードメーカー',
    description: '10回以上のリアクションを引き出した',
    rarity: 'rare',
    check: (t) => t.reactionsTriggered >= 10,
  },
  {
    id: 'resonance_3',    icon: '🌟', title: '共鳴マスター',
    description: 'CollectiveResonanceを3回発生',
    rarity: 'epic',
    check: (t) => t.resonanceCount >= 3,
  },
  {
    id: 'flow_keeper',    icon: '🌊', title: 'フローキーパー',
    description: 'フロー状態を5分以上維持',
    rarity: 'epic',
    check: (t) => t.flowMinutes >= 5,
  },
  {
    id: 'bridge_builder', icon: '🌉', title: 'ブリッジビルダー',
    description: '沈黙を3回以上破った',
    rarity: 'rare',
    check: (t) => t.silenceBreaks >= 3,
  },
  {
    id: 'healer',         icon: '💚', title: 'ヒーラー',
    description: '場のテンションを最も緩和した',
    rarity: 'rare',
    check: (t) => t.tensionReductions >= 3,
  },
  {
    id: 'legend',         icon: '👑', title: 'レジェンド',
    description: '1セッションで4つ以上のアチーブメント',
    rarity: 'legendary',
    check: () => false, // Special: checked separately
  },
];

const STORAGE_KEY = 'kokoro_achievements';

export class SessionAchievements {
  private tracker: AchievementTracker = {
    firstVoice: false,
    resonanceCount: 0,
    flowMinutes: 0,
    silenceBreaks: 0,
    reactionsTriggered: 0,
    tensionReductions: 0,
  };
  private unlocked: Achievement[] = [];
  private totalUnlocked: Achievement[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) this.totalUnlocked = JSON.parse(data);
    } catch { /* ignore */ }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.totalUnlocked.slice(-100)));
    } catch { /* ignore */ }
  }

  // === Tracking methods ===

  recordFirstVoice(): void { this.tracker.firstVoice = true; this.check(); }
  recordResonance(): void { this.tracker.resonanceCount++; this.check(); }
  recordFlowMinute(): void { this.tracker.flowMinutes++; this.check(); }
  recordSilenceBreak(): void { this.tracker.silenceBreaks++; this.check(); }
  recordReaction(): void { this.tracker.reactionsTriggered++; this.check(); }
  recordTensionReduction(): void { this.tracker.tensionReductions++; this.check(); }

  private check(): void {
    const alreadyUnlocked = new Set(this.unlocked.map(a => a.id));

    for (const def of ACHIEVEMENT_DEFS) {
      if (alreadyUnlocked.has(def.id)) continue;
      if (def.id === 'legend') {
        if (this.unlocked.length >= 4) {
          this.unlock(def);
        }
        continue;
      }
      if (def.check(this.tracker)) {
        this.unlock(def);
      }
    }
  }

  private unlock(def: typeof ACHIEVEMENT_DEFS[number]): void {
    const achievement: Achievement = {
      id: def.id,
      icon: def.icon,
      title: def.title,
      description: def.description,
      rarity: def.rarity,
      unlockedAt: Date.now(),
    };
    this.unlocked.push(achievement);
    this.totalUnlocked.push(achievement);
    this.saveHistory();

    // Haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const pattern = def.rarity === 'legendary' ? [50, 30, 50, 30, 100]
        : def.rarity === 'epic' ? [50, 30, 50]
        : [30];
      navigator.vibrate(pattern);
    }
  }

  /**
   * このセッションで解除されたアチーブメント
   */
  getSessionAchievements(): Achievement[] { return [...this.unlocked]; }

  /**
   * 累計アチーブメント
   */
  getTotalAchievements(): Achievement[] { return [...this.totalUnlocked]; }

  /**
   * 新しく解除されたアチーブメントがあるか
   */
  hasNew(): boolean { return this.unlocked.length > 0; }

  /**
   * リセット（セッション開始時）
   */
  resetSession(): void {
    this.tracker = {
      firstVoice: false, resonanceCount: 0, flowMinutes: 0,
      silenceBreaks: 0, reactionsTriggered: 0, tensionReductions: 0,
    };
    this.unlocked = [];
  }
}
