/**
 * cocoro — AgenticShowRunner
 * Razer AVA相当のエージェンティックAI — 番組を自律運営
 *
 * 2026年メタバースレポート:
 * - Razer AVA: 意図→計画→実行の自律エージェント
 * - Companion-to-Companion Coordination
 * - cocoro: LiveShowDirector/GameShow/DynamicBGMを**AI自律制御**
 *
 * 機能:
 * 1. 会話品質のリアルタイム監視
 * 2. 盛り上がり低下→自動でゲーム/トピック提案
 * 3. 沈黙→BGMジャンル切替+アイスブレイク
 * 4. メンバー退出リスク検知→介入
 * 5. 番組フォーマット自動切替
 */

export type AgentAction =
  | 'suggest_topic'
  | 'start_game'
  | 'change_bgm'
  | 'show_telop'
  | 'switch_format'
  | 'invite_to_stage'
  | 'encourage_speaker'
  | 'trigger_reaction'
  | 'play_se'
  | 'announce'
  | 'split_groups'
  | 'topic_shift';

export interface AgentDecision {
  action: AgentAction;
  reason: string;
  params: Record<string, unknown>;
  confidence: number; // 0-1
  timestamp: number;
}

export interface ShowRunnerState {
  isActive: boolean;
  currentPriority: 'entertainment' | 'engagement' | 'balance' | 'recovery';
  energyLevel: number;          // 0-1 (room energy)
  engagementLevel: number;      // 0-1 (participant engagement)
  silenceDurationSec: number;
  conversationQuality: number;  // 0-100
  pendingActions: AgentDecision[];
  executedActions: AgentDecision[];
  autoMode: boolean;
}

// トピックデータベース(サーバー不要)
const TOPIC_DATABASE = {
  icebreaker: [
    '最近ハマっていることは？', '子供の頃の夢は何だった？',
    '3つ願いが叶うなら何をお願いする？', '無人島に1つだけ持っていくなら？',
    '人生で一番笑った出来事は？', 'タイムマシンがあったらいつに行く？',
    '自分の取扱説明書を書くなら？', '来世の職業は何がいい？',
  ],
  deep: [
    'AIと人間の境界はどこにある？', '幸福の定義って何だろう？',
    '10年後の自分に何を伝えたい？', '一番影響を受けた言葉は？',
    '人生のターニングポイントは？', '理想の社会って？',
  ],
  fun: [
    '好きな寿司ネタは？', '朝型？夜型？', 'カレー何辛にする？',
    '犬派？猫派？', 'インドア？アウトドア？', '夏と冬どっち？',
  ],
  trending: [
    'メタバースの未来ってどうなる？', 'AI時代に必要なスキルって？',
    '次に流行りそうなものは？', 'スマートフォンの次のデバイスは？',
  ],
};

export class AgenticShowRunner {
  private state: ShowRunnerState;
  private decisionInterval: ReturnType<typeof setInterval> | null = null;
  private lastActionTime: Map<AgentAction, number> = new Map();
  private actionListeners: Array<(decision: AgentDecision) => void> = [];

  // Cooldowns (ms)
  private readonly COOLDOWNS: Record<AgentAction, number> = {
    suggest_topic: 60000,    // 1分
    start_game: 300000,      // 5分
    change_bgm: 120000,      // 2分
    show_telop: 30000,       // 30秒
    switch_format: 300000,   // 5分
    invite_to_stage: 60000,  // 1分
    encourage_speaker: 45000,// 45秒
    trigger_reaction: 20000, // 20秒
    play_se: 15000,          // 15秒
    announce: 60000,         // 1分
    split_groups: 600000,    // 10分
    topic_shift: 120000,     // 2分
  };

  constructor() {
    this.state = {
      isActive: false,
      currentPriority: 'balance',
      energyLevel: 0.5,
      engagementLevel: 0.5,
      silenceDurationSec: 0,
      conversationQuality: 50,
      pendingActions: [],
      executedActions: [],
      autoMode: true,
    };
  }

  /** エージェント起動 */
  activate(): void {
    this.state.isActive = true;
  }

  /** エージェント停止 */
  deactivate(): void {
    this.state.isActive = false;
    if (this.decisionInterval) clearInterval(this.decisionInterval);
  }

  /**
   * 状況を入力→AIが判断→アクションを返す
   * 毎秒or数秒ごとに呼ぶ
   */
  think(context: {
    speakerCount: number;
    totalParticipants: number;
    silenceDurationSec: number;
    energyLevel: number;     // from EQ or audience
    comboCount: number;
    currentFormat: string;
    activeGameType: string | null;
    dominantEmotion: string;
    minutesSinceStart: number;
  }): AgentDecision | null {
    if (!this.state.isActive || !this.state.autoMode) return null;

    this.state.energyLevel = context.energyLevel;
    this.state.silenceDurationSec = context.silenceDurationSec;

    // Engagement = speakers / total
    this.state.engagementLevel = context.totalParticipants > 0
      ? context.speakerCount / context.totalParticipants
      : 0;

    // Quality composite
    this.state.conversationQuality = Math.round(
      context.energyLevel * 40 +
      this.state.engagementLevel * 30 +
      Math.min(1, context.comboCount / 10) * 20 +
      (context.silenceDurationSec < 5 ? 10 : 0)
    );

    // Priority determination
    if (this.state.conversationQuality < 20) this.state.currentPriority = 'recovery';
    else if (this.state.conversationQuality < 40) this.state.currentPriority = 'engagement';
    else if (this.state.conversationQuality > 70) this.state.currentPriority = 'entertainment';
    else this.state.currentPriority = 'balance';

    // === Decision Engine ===
    const decision = this.makeDecision(context);
    if (decision) {
      this.state.pendingActions.push(decision);
      this.state.executedActions.push(decision);
      if (this.state.executedActions.length > 100) this.state.executedActions = this.state.executedActions.slice(-50);
      this.lastActionTime.set(decision.action, Date.now());
      for (const fn of this.actionListeners) fn(decision);
    }

    return decision;
  }

  /** アクションリスナー */
  onAction(fn: (decision: AgentDecision) => void): () => void {
    this.actionListeners.push(fn);
    return () => { this.actionListeners = this.actionListeners.filter(f => f !== fn); };
  }

  /** トピック生成(カテゴリ指定) */
  generateTopic(category: keyof typeof TOPIC_DATABASE = 'icebreaker'): string {
    const topics = TOPIC_DATABASE[category];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  getState(): ShowRunnerState { return { ...this.state }; }
  setAutoMode(auto: boolean): void { this.state.autoMode = auto; }

  // ========== Private ==========

  private makeDecision(ctx: {
    speakerCount: number;
    totalParticipants: number;
    silenceDurationSec: number;
    energyLevel: number;
    comboCount: number;
    currentFormat: string;
    activeGameType: string | null;
    dominantEmotion: string;
    minutesSinceStart: number;
  }): AgentDecision | null {

    // Rule 1: Long silence → suggest topic
    if (ctx.silenceDurationSec > 15 && this.canAct('suggest_topic')) {
      const category = ctx.minutesSinceStart < 5 ? 'icebreaker' : 'deep';
      return this.decide('suggest_topic', `${ctx.silenceDurationSec}秒の沈黙を検出`, {
        topic: this.generateTopic(category),
        category,
      }, 0.9);
    }

    // Rule 2: Very low energy for 30s+ → start game
    if (ctx.energyLevel < 0.2 && ctx.silenceDurationSec > 10 && !ctx.activeGameType && this.canAct('start_game')) {
      return this.decide('start_game', 'エネルギーが低下、ゲームで活性化', {
        gameType: 'ohgiri',
      }, 0.8);
    }

    // Rule 3: Dominant sadness/fear → change BGM to upbeat
    if ((ctx.dominantEmotion === 'sadness' || ctx.dominantEmotion === 'fear') && this.canAct('change_bgm')) {
      return this.decide('change_bgm', `支配的感情「${ctx.dominantEmotion}」→BGM変更`, {
        genre: 'acoustic',
      }, 0.7);
    }

    // Rule 4: High energy combo → encourage
    if (ctx.comboCount > 10 && ctx.energyLevel > 0.7 && this.canAct('show_telop')) {
      return this.decide('show_telop', '盛り上がりピーク検出', {
        text: '🔥 最高に盛り上がってます！',
      }, 0.85);
    }

    // Rule 5: Only 1 speaker for 60s+ → invite others
    if (ctx.speakerCount <= 1 && ctx.totalParticipants > 2 && ctx.minutesSinceStart > 2 && this.canAct('encourage_speaker')) {
      return this.decide('encourage_speaker', '独壇場が続いている',  {
        message: '他の皆さんも話してみませんか？',
      }, 0.6);
    }

    // Rule 6: 15min+ → suggest topic shift
    if (ctx.minutesSinceStart > 0 && ctx.minutesSinceStart % 15 < 0.1 && this.canAct('topic_shift')) {
      return this.decide('topic_shift', '15分経過→話題転換', {
        topic: this.generateTopic('trending'),
      }, 0.5);
    }

    // Rule 7: Large group → suggest split
    if (ctx.totalParticipants > 8 && ctx.speakerCount < 3 && this.canAct('split_groups')) {
      return this.decide('split_groups', '大人数で発言者が少ない', {
        suggestedGroupSize: 4,
      }, 0.6);
    }

    return null;
  }

  private decide(action: AgentAction, reason: string, params: Record<string, unknown>, confidence: number): AgentDecision {
    return { action, reason, params, confidence, timestamp: Date.now() };
  }

  private canAct(action: AgentAction): boolean {
    const lastTime = this.lastActionTime.get(action) ?? 0;
    return Date.now() - lastTime > this.COOLDOWNS[action];
  }
}
