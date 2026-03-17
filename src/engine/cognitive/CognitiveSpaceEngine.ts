/**
 * cocoro — CognitiveSpaceEngine + RegenerativeConversation
 * NEOM XVRS相当の認知的空間適応 + 再生型AI
 *
 * 2026年メタバースレポート:
 * - NEOM XVRS: 環境データをリアルタイムに仮想空間へ反映
 * - 再生型AI: フィードバック→修復→記憶→ループ
 * - cocoro: 会話キーワード→空間テーマ変更 + 品質自動修復
 *
 * 運用コスト: ¥0 (全てクライアントサイド)
 */

// ========================================
// 1. CognitiveSpaceEngine — 認知的空間適応
// ========================================

export type SpaceTheme = 'default' | 'ocean' | 'forest' | 'city' | 'space' | 'cafe' | 'sunset' | 'festival' | 'library' | 'mountain' | 'cherry_blossom' | 'neon_city';

export interface SpaceEnvironment {
  theme: SpaceTheme;
  lighting: { hue: number; saturation: number; brightness: number };
  particles: { type: string; density: number; speed: number };
  fog: { color: string; density: number };
  ambientSound: string;
  skyColor: string;
  groundColor: string;
  transitionProgress: number; // 0-1
}

// キーワード→テーマ マッピング (サーバー不要)
const KEYWORD_THEMES: { keywords: string[]; theme: SpaceTheme }[] = [
  { keywords: ['海', 'ビーチ', 'サーフィン', '泳ぐ', '波', '魚', '水族館'], theme: 'ocean' },
  { keywords: ['山', '登山', 'キャンプ', '自然', '森', '木', 'ハイキング'], theme: 'forest' },
  { keywords: ['都会', '東京', '渋谷', 'ビル', '電車', '通勤'], theme: 'city' },
  { keywords: ['宇宙', '星', '月', 'ロケット', 'NASA', '銀河', 'SF'], theme: 'space' },
  { keywords: ['カフェ', 'コーヒー', '紅茶', 'ケーキ', 'チョコ', 'スイーツ'], theme: 'cafe' },
  { keywords: ['夕日', '夕焼け', '黄昏', 'ロマンチック', 'デート'], theme: 'sunset' },
  { keywords: ['祭り', 'パーティ', 'お祝い', '誕生日', '花火', 'ダンス'], theme: 'festival' },
  { keywords: ['本', '読書', '勉強', '図書館', '知識', '学校'], theme: 'library' },
  { keywords: ['雪', 'スキー', '冬', 'クリスマス', '温泉'], theme: 'mountain' },
  { keywords: ['桜', '春', 'お花見', '入学', '新生活'], theme: 'cherry_blossom' },
  { keywords: ['ゲーム', 'ネオン', 'サイバーパンク', 'アニメ', 'VR'], theme: 'neon_city' },
];

const THEME_CONFIGS: Record<SpaceTheme, Omit<SpaceEnvironment, 'theme' | 'transitionProgress'>> = {
  default: { lighting: { hue: 220, saturation: 30, brightness: 70 }, particles: { type: 'dust', density: 0.1, speed: 0.5 }, fog: { color: '#1a1a2e', density: 0.01 }, ambientSound: 'ambient', skyColor: '#0a0a1a', groundColor: '#1a1a2e' },
  ocean: { lighting: { hue: 200, saturation: 60, brightness: 60 }, particles: { type: 'bubbles', density: 0.3, speed: 0.3 }, fog: { color: '#0a3d5c', density: 0.02 }, ambientSound: 'waves', skyColor: '#1a6fa0', groundColor: '#0a3d5c' },
  forest: { lighting: { hue: 120, saturation: 50, brightness: 55 }, particles: { type: 'leaves', density: 0.2, speed: 0.4 }, fog: { color: '#2d4a22', density: 0.015 }, ambientSound: 'birds', skyColor: '#3a7d44', groundColor: '#1a3a12' },
  city: { lighting: { hue: 30, saturation: 20, brightness: 65 }, particles: { type: 'rain', density: 0.1, speed: 1.0 }, fog: { color: '#2a2a3a', density: 0.008 }, ambientSound: 'traffic', skyColor: '#1a1a2a', groundColor: '#3a3a4a' },
  space: { lighting: { hue: 270, saturation: 60, brightness: 40 }, particles: { type: 'stars', density: 0.5, speed: 0.1 }, fog: { color: '#0a0a2e', density: 0.005 }, ambientSound: 'cosmic', skyColor: '#000020', groundColor: '#0a0a1a' },
  cafe: { lighting: { hue: 35, saturation: 50, brightness: 70 }, particles: { type: 'steam', density: 0.15, speed: 0.2 }, fog: { color: '#4a3a2a', density: 0.01 }, ambientSound: 'cafe', skyColor: '#6a4a30', groundColor: '#3a2a1a' },
  sunset: { lighting: { hue: 20, saturation: 70, brightness: 65 }, particles: { type: 'fireflies', density: 0.2, speed: 0.3 }, fog: { color: '#5a2a1a', density: 0.012 }, ambientSound: 'evening', skyColor: '#c04020', groundColor: '#3a1a0a' },
  festival: { lighting: { hue: 0, saturation: 80, brightness: 75 }, particles: { type: 'confetti', density: 0.4, speed: 0.8 }, fog: { color: '#2a1a3a', density: 0.008 }, ambientSound: 'crowd', skyColor: '#1a0a2a', groundColor: '#2a1a3a' },
  library: { lighting: { hue: 40, saturation: 25, brightness: 50 }, particles: { type: 'dust', density: 0.05, speed: 0.1 }, fog: { color: '#3a3020', density: 0.005 }, ambientSound: 'pages', skyColor: '#2a2010', groundColor: '#3a3020' },
  mountain: { lighting: { hue: 200, saturation: 30, brightness: 80 }, particles: { type: 'snow', density: 0.3, speed: 0.6 }, fog: { color: '#c0d0e0', density: 0.02 }, ambientSound: 'wind', skyColor: '#e0e8f0', groundColor: '#f0f0f0' },
  cherry_blossom: { lighting: { hue: 340, saturation: 50, brightness: 70 }, particles: { type: 'petals', density: 0.3, speed: 0.4 }, fog: { color: '#e0b0c0', density: 0.01 }, ambientSound: 'spring', skyColor: '#ffc0cb', groundColor: '#c08090' },
  neon_city: { lighting: { hue: 280, saturation: 90, brightness: 60 }, particles: { type: 'neon_sparks', density: 0.25, speed: 0.7 }, fog: { color: '#1a0a2a', density: 0.015 }, ambientSound: 'synth', skyColor: '#0a0a1a', groundColor: '#1a0a2a' },
};

export class CognitiveSpaceEngine {
  private currentEnv: SpaceEnvironment;
  private targetTheme: SpaceTheme = 'default';
  private keywordScores: Map<SpaceTheme, number> = new Map();
  private emotionOverride: { hue: number; saturation: number; brightness: number } | null = null;

  constructor() {
    const cfg = THEME_CONFIGS['default'];
    this.currentEnv = { theme: 'default', ...cfg, transitionProgress: 1 };
  }

  /** 会話テキストからテーマを推論 */
  analyzeKeywords(text: string): SpaceTheme | null {
    let bestTheme: SpaceTheme | null = null;
    let bestScore = 0;

    KEYWORD_THEMES.forEach(({ keywords, theme }) => {
      let score = 0;
      keywords.forEach(kw => { if (text.includes(kw)) score += 1; });
      const prev = this.keywordScores.get(theme) ?? 0;
      const newScore = prev * 0.9 + score; // Exponential moving average
      this.keywordScores.set(theme, newScore);
      if (newScore > bestScore && newScore >= 2) { bestScore = newScore; bestTheme = theme; }
    });

    if (bestTheme && bestTheme !== this.currentEnv.theme) {
      this.transitionTo(bestTheme);
    }

    return bestTheme;
  }

  /** 感情によるライティング調整 */
  applyEmotionLighting(emotion: { joy: number; sadness: number; excitement: number; calmness: number }): void {
    let hue = this.currentEnv.lighting.hue;
    let sat = this.currentEnv.lighting.saturation;
    let bright = this.currentEnv.lighting.brightness;

    hue += (emotion.joy - emotion.sadness) * 30;
    sat += emotion.excitement * 20 - emotion.calmness * 10;
    bright += emotion.joy * 15 - emotion.sadness * 15;

    this.emotionOverride = {
      hue: Math.max(0, Math.min(360, hue)) % 360,
      saturation: Math.max(10, Math.min(100, sat)),
      brightness: Math.max(20, Math.min(90, bright)),
    };
  }

  /** テーマ遷移 */
  transitionTo(theme: SpaceTheme): void {
    this.targetTheme = theme;
    this.currentEnv.transitionProgress = 0;
  }

  /** フレーム更新 (smooth transition) */
  update(): SpaceEnvironment {
    if (this.currentEnv.theme !== this.targetTheme && this.currentEnv.transitionProgress < 1) {
      this.currentEnv.transitionProgress += 0.01; // ~100 frames to complete
      if (this.currentEnv.transitionProgress >= 1) {
        this.currentEnv.transitionProgress = 1;
        const cfg = THEME_CONFIGS[this.targetTheme];
        this.currentEnv = { theme: this.targetTheme, ...cfg, transitionProgress: 1 };
      }
    }

    // Apply emotion override
    if (this.emotionOverride) {
      this.currentEnv.lighting = { ...this.emotionOverride };
    }

    return { ...this.currentEnv };
  }

  getCurrentTheme(): SpaceTheme { return this.currentEnv.theme; }
  getEnvironment(): SpaceEnvironment { return { ...this.currentEnv }; }
}

// ========================================
// 2. RegenerativeConversation — 自己修復型会話
// ========================================

export type ConversationIssue = 'topic_loop' | 'energy_decline' | 'monopoly' | 'silence_spiral' | 'emotional_drift' | 'engagement_drop';

export interface RepairAction {
  issue: ConversationIssue;
  action: string;
  description: string;
  appliedAt: number;
  effectiveness: number; // 0-1 (measured after)
}

export class RegenerativeConversation {
  // Feedback-repair-memory loop (再生型AIの3層)
  private issueHistory: { issue: ConversationIssue; timestamp: number }[] = [];
  private repairHistory: RepairAction[] = [];
  private effectivenessMemory: Map<string, { success: number; fail: number }> = new Map();
  private topicHistory: string[] = [];
  private energyHistory: number[] = [];

  /**
   * 環境入力を受けて問題を検出(Generation Layer)
   */
  detectIssues(context: {
    currentTopic: string;
    energyLevel: number;
    speakerDistribution: Map<string, number>; // participantId → speakingSeconds
    dominantEmotion: string;
    engagementRate: number;
  }): ConversationIssue[] {
    const issues: ConversationIssue[] = [];

    // Topic loop: same topic appearing 3+ times
    this.topicHistory.push(context.currentTopic);
    if (this.topicHistory.length > 20) this.topicHistory = this.topicHistory.slice(-15);
    const topicFreq = this.topicHistory.filter(t => t === context.currentTopic).length;
    if (topicFreq >= 3) issues.push('topic_loop');

    // Energy decline: 5+ consecutive decreases
    this.energyHistory.push(context.energyLevel);
    if (this.energyHistory.length > 10) this.energyHistory = this.energyHistory.slice(-10);
    if (this.energyHistory.length >= 5) {
      const recent5 = this.energyHistory.slice(-5);
      const isDecline = recent5.every((v, i) => i === 0 || v <= recent5[i - 1]);
      if (isDecline) issues.push('energy_decline');
    }

    // Monopoly: 1 person > 60% of speaking time
    const totalSpeaking = Array.from(context.speakerDistribution.values()).reduce((a, b) => a + b, 0);
    if (totalSpeaking > 0) {
      context.speakerDistribution.forEach(seconds => {
        if (seconds / totalSpeaking > 0.6) issues.push('monopoly');
      });
    }

    // Silence spiral: energy < 0.15
    if (context.energyLevel < 0.15) issues.push('silence_spiral');

    // Emotional drift: negative emotion > 50%
    if (['anger', 'sadness', 'fear', 'disgust'].includes(context.dominantEmotion)) {
      issues.push('emotional_drift');
    }

    // Engagement drop
    if (context.engagementRate < 0.2) issues.push('engagement_drop');

    issues.forEach(issue => {
      this.issueHistory.push({ issue, timestamp: Date.now() });
    });

    return issues;
  }

  /**
   * 問題に対する修復アクションを提案(Regeneration Layer)
   * 過去の成功/失敗記憶に基づいて最適なアクションを選択
   */
  suggestRepair(issue: ConversationIssue): RepairAction {
    const candidates = this.getRepairCandidates(issue);

    // Choose best based on historical effectiveness
    let bestAction = candidates[0];
    let bestScore = -1;
    candidates.forEach(candidate => {
      const key = `${issue}_${candidate.action}`;
      const mem = this.effectivenessMemory.get(key);
      const score = mem ? mem.success / (mem.success + mem.fail + 1) : 0.5;
      if (score > bestScore) { bestScore = score; bestAction = candidate; }
    });

    this.repairHistory.push(bestAction);
    return bestAction;
  }

  /**
   * 修復の効果を記録(Memory Layer)
   * — フィードバックループ完成
   */
  recordEffectiveness(issue: ConversationIssue, action: string, wasEffective: boolean): void {
    const key = `${issue}_${action}`;
    const mem = this.effectivenessMemory.get(key) ?? { success: 0, fail: 0 };
    if (wasEffective) mem.success++;
    else mem.fail++;
    this.effectivenessMemory.set(key, mem);
  }

  /** 健全性スコア */
  getHealthScore(): number {
    const recentIssues = this.issueHistory.filter(i => Date.now() - i.timestamp < 60000).length;
    return Math.max(0, 100 - recentIssues * 15);
  }

  // ========== Private ==========

  private getRepairCandidates(issue: ConversationIssue): RepairAction[] {
    const now = Date.now();
    switch (issue) {
      case 'topic_loop': return [
        { issue, action: 'new_topic', description: '新しいトピックを提案', appliedAt: now, effectiveness: 0 },
        { issue, action: 'game_break', description: 'ミニゲームで気分転換', appliedAt: now, effectiveness: 0 },
        { issue, action: 'format_change', description: '番組フォーマットを変更', appliedAt: now, effectiveness: 0 },
      ];
      case 'energy_decline': return [
        { issue, action: 'upbeat_bgm', description: 'アップテンポBGMに切替', appliedAt: now, effectiveness: 0 },
        { issue, action: 'surprise_se', description: 'サプライズSE再生', appliedAt: now, effectiveness: 0 },
        { issue, action: 'audience_wave', description: '観客ウェーブ発動', appliedAt: now, effectiveness: 0 },
      ];
      case 'monopoly': return [
        { issue, action: 'encourage_others', description: '他の参加者を促す', appliedAt: now, effectiveness: 0 },
        { issue, action: 'rotation', description: 'ステージローテーション', appliedAt: now, effectiveness: 0 },
      ];
      case 'silence_spiral': return [
        { issue, action: 'icebreaker', description: 'アイスブレイクお題', appliedAt: now, effectiveness: 0 },
        { issue, action: 'bgm_lofi', description: 'Lo-Fi BGMで安心感', appliedAt: now, effectiveness: 0 },
      ];
      case 'emotional_drift': return [
        { issue, action: 'mood_reset', description: 'ポジティブテーマに転換', appliedAt: now, effectiveness: 0 },
        { issue, action: 'lightstick_call', description: 'ライトスティック投票', appliedAt: now, effectiveness: 0 },
      ];
      case 'engagement_drop': return [
        { issue, action: 'game_start', description: 'インタラクティブゲーム開始', appliedAt: now, effectiveness: 0 },
        { issue, action: 'reaction_prompt', description: 'リアクション促進', appliedAt: now, effectiveness: 0 },
      ];
    }
  }
}
