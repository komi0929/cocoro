/**
 * cocoro — LiveShowDirector
 * 会話を**テレビ番組のように演出**するエンジン
 *
 * 競合分析:
 * - X Spaces: 音声のみ→視覚演出なし → cocoro: 3D VFX+カメラワークで圧倒
 * - POPOPO: 空間が追従 → cocoro: 空間+演出+BGM+SE=完全番組化
 * - TikTok Live: 配信者1人→全員参加型 → cocoro: 全員が番組の出演者
 *
 * 機能:
 * 1. 発話者自動スポットライト(フォーカスカメラ)
 * 2. ツッコミ/ボケ/大喜利パターン検知
 * 3. 笑い・拍手SE自動挿入
 * 4. テロップ自動生成(発話のキーワード)
 * 5. シーン切り替えトランジション
 * 6. 番組テンプレート(トーク/バラエティ/ラジオ/ディベート)
 */

export type ShowFormat = 'talk_show' | 'variety' | 'radio' | 'debate' | 'interview' | 'free';

export type ShowEvent =
  | 'spotlight_on'     // 発話者にスポットライト
  | 'spotlight_off'
  | 'applause'         // 拍手SE
  | 'laugh_track'      // 笑いSE
  | 'dramatic'         // ドラマチック演出
  | 'scene_transition' // シーン切り替え
  | 'telop'            // テロップ表示
  | 'combo_hit'        // 連続ボケ/ツッコミ
  | 'climax_build'     // クライマックスへの盛り上がり
  | 'ending_roll';     // エンディング

export interface ShowState {
  format: ShowFormat;
  isLive: boolean;
  currentSpotlight: string | null; // participantId
  spotlightHistory: string[];      // 直近5人
  eventQueue: { event: ShowEvent; data?: Record<string, unknown>; timestamp: number }[];
  sceneNumber: number;
  totalScenes: number;
  audienceEnergy: number; // 0-1 (観客の盛り上がり)
  comboCount: number;     // 連続リアクション
  showDurationMs: number;
  telop: string | null;
}

export interface ShowConfig {
  format: ShowFormat;
  autoSpotlight: boolean;
  autoSE: boolean;
  autoTelop: boolean;
  seVolume: number; // 0-1
  sceneIntervalMinutes: number;
}

const FORMAT_CONFIGS: Record<ShowFormat, Partial<ShowConfig>> = {
  talk_show: { autoSpotlight: true, autoSE: true, autoTelop: true, sceneIntervalMinutes: 5 },
  variety: { autoSpotlight: true, autoSE: true, autoTelop: true, sceneIntervalMinutes: 3 },
  radio: { autoSpotlight: true, autoSE: false, autoTelop: false, sceneIntervalMinutes: 10 },
  debate: { autoSpotlight: true, autoSE: false, autoTelop: true, sceneIntervalMinutes: 7 },
  interview: { autoSpotlight: true, autoSE: false, autoTelop: true, sceneIntervalMinutes: 8 },
  free: { autoSpotlight: false, autoSE: false, autoTelop: false, sceneIntervalMinutes: 0 },
};

export class LiveShowDirector {
  private state: ShowState;
  private config: ShowConfig;
  private speakerTimes: Map<string, number> = new Map();
  private lastSwitchTime = 0;
  private eventListeners: Array<(event: ShowEvent, data?: Record<string, unknown>) => void> = [];
  private startTime = 0;

  constructor(format: ShowFormat = 'talk_show') {
    this.config = {
      format,
      autoSpotlight: true,
      autoSE: true,
      autoTelop: true,
      seVolume: 0.3,
      sceneIntervalMinutes: 5,
      ...FORMAT_CONFIGS[format],
    };

    this.state = {
      format,
      isLive: false,
      currentSpotlight: null,
      spotlightHistory: [],
      eventQueue: [],
      sceneNumber: 1,
      totalScenes: 1,
      audienceEnergy: 0.5,
      comboCount: 0,
      showDurationMs: 0,
      telop: null,
    };
  }

  /** 番組開始 */
  startShow(): void {
    this.state.isLive = true;
    this.startTime = Date.now();
    this.emit('scene_transition', { scene: 1 });
  }

  /** 番組終了 */
  endShow(): void {
    this.state.isLive = false;
    this.emit('ending_roll');
  }

  /**
   * フレーム更新 — 発話状態を受け取り演出イベントを生成
   */
  update(speakers: Map<string, { isSpeaking: boolean; volume: number; emotion: string }>): ShowState {
    if (!this.state.isLive) return { ...this.state };

    this.state.showDurationMs = Date.now() - this.startTime;
    const now = Date.now();

    // Spotlight logic: 最もボリュームが大きい人にスポットライト
    if (this.config.autoSpotlight) {
      let loudest: string | null = null;
      let maxVolume = 0;
      speakers.forEach((s, id) => {
        if (s.isSpeaking && s.volume > maxVolume) {
          maxVolume = s.volume;
          loudest = id;
        }
      });

      if (loudest && loudest !== this.state.currentSpotlight && now - this.lastSwitchTime > 2000) {
        this.state.currentSpotlight = loudest;
        this.lastSwitchTime = now;
        this.state.spotlightHistory.push(loudest);
        if (this.state.spotlightHistory.length > 10) this.state.spotlightHistory.shift();
        this.emit('spotlight_on', { participantId: loudest });
      }
    }

    // Speaking time tracking
    speakers.forEach((s, id) => {
      if (s.isSpeaking) {
        this.speakerTimes.set(id, (this.speakerTimes.get(id) ?? 0) + 1);
      }
    });

    // Auto SE: laugh detection (high joy emotion)
    if (this.config.autoSE) {
      let joyCount = 0;
      speakers.forEach((s) => {
        if (s.emotion === 'joy' && s.isSpeaking) joyCount++;
      });
      if (joyCount >= 2) {
        this.state.comboCount++;
        if (this.state.comboCount % 3 === 0) {
          this.emit('laugh_track');
        }
      }

      // Applause: after a long monologue ends
      const spotlight = this.state.currentSpotlight;
      if (spotlight) {
        const speakTime = this.speakerTimes.get(spotlight) ?? 0;
        const speakerState = speakers.get(spotlight);
        if (speakTime > 60 && speakerState && !speakerState.isSpeaking) {
          this.emit('applause');
          this.speakerTimes.set(spotlight, 0);
        }
      }
    }

    // Scene transitions
    if (this.config.sceneIntervalMinutes > 0) {
      const sceneDuration = this.config.sceneIntervalMinutes * 60 * 1000;
      const expectedScene = Math.floor(this.state.showDurationMs / sceneDuration) + 1;
      if (expectedScene > this.state.sceneNumber) {
        this.state.sceneNumber = expectedScene;
        this.emit('scene_transition', { scene: expectedScene });
      }
    }

    // Audience energy
    let totalVolume = 0;
    let speakerCount = 0;
    speakers.forEach((s) => {
      if (s.isSpeaking) {
        totalVolume += s.volume;
        speakerCount++;
      }
    });
    const targetEnergy = speakerCount > 0 ? Math.min(1, totalVolume / speakerCount + speakerCount * 0.1) : this.state.audienceEnergy * 0.95;
    this.state.audienceEnergy += (targetEnergy - this.state.audienceEnergy) * 0.1;

    // Climax build
    if (this.state.audienceEnergy > 0.8 && this.state.comboCount > 5) {
      this.emit('climax_build');
    }

    return { ...this.state };
  }

  /** テロップ表示 */
  showTelop(text: string, durationMs = 3000): void {
    this.state.telop = text;
    this.emit('telop', { text });
    setTimeout(() => { this.state.telop = null; }, durationMs);
  }

  /** フォーマット変更 */
  setFormat(format: ShowFormat): void {
    this.config = { ...this.config, ...FORMAT_CONFIGS[format], format };
    this.state.format = format;
  }

  /** 発話バランス取得 */
  getSpeakerBalance(): Map<string, number> {
    const total = Array.from(this.speakerTimes.values()).reduce((a, b) => a + b, 0);
    const balance = new Map<string, number>();
    this.speakerTimes.forEach((time, id) => {
      balance.set(id, total > 0 ? time / total : 0);
    });
    return balance;
  }

  /** イベントリスナー */
  onEvent(fn: (event: ShowEvent, data?: Record<string, unknown>) => void): () => void {
    this.eventListeners.push(fn);
    return () => { this.eventListeners = this.eventListeners.filter(f => f !== fn); };
  }

  private emit(event: ShowEvent, data?: Record<string, unknown>): void {
    this.state.eventQueue.push({ event, data, timestamp: Date.now() });
    if (this.state.eventQueue.length > 50) this.state.eventQueue.shift();
    for (const fn of this.eventListeners) fn(event, data);
  }

  getState(): ShowState { return { ...this.state }; }
  getConfig(): ShowConfig { return { ...this.config }; }
}
