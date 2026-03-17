/**
 * kokoro — Adaptive UI Engine
 * 会話の状態に応じてUI要素の表示/非表示を最適化
 * 
 * 反復201-210:
 * - ゾーン中: UIを最小化して没入感最大化
 * - アイドル中: ヒントやナッジを表示
 * - 新規参加者: オンボーディングモード
 * - 長時間黙っている: 「話してみませんか？」ナッジ
 * = UIが「空気を読む」体験
 */

export type UIMode = 'full' | 'minimal' | 'immersive' | 'onboarding';

export interface AdaptiveUIState {
  mode: UIMode;
  showHUD: boolean;
  showReactions: boolean;
  showParticipants: boolean;
  showMoodIndicator: boolean;
  nudgeMessage: string | null;
  hudOpacity: number;        // 0-1
}

export class AdaptiveUIEngine {
  private mode: UIMode = 'full';
  private lastSpeechTime = Date.now();
  private sessionStartTime = Date.now();
  private hasEverSpoken = false;
  private nudgeShownAt = 0;
  private isFirstVisit: boolean;

  constructor() {
    this.isFirstVisit = !localStorage.getItem('kokoro_has_visited');
    if (this.isFirstVisit) {
      this.mode = 'onboarding';
    }
  }

  /**
   * フレームごとの更新
   */
  update(state: {
    flowLevel: string;
    isSpeaking: boolean;
    participantCount: number;
    activeSpeakerCount: number;
    sessionDurationSeconds: number;
  }): AdaptiveUIState {
    const now = Date.now();

    // Track speech
    if (state.isSpeaking) {
      this.lastSpeechTime = now;
      this.hasEverSpoken = true;
      if (this.isFirstVisit) {
        localStorage.setItem('kokoro_has_visited', 'true');
        this.isFirstVisit = false;
      }
    }

    const silenceSeconds = (now - this.lastSpeechTime) / 1000;
    const sessionSeconds = state.sessionDurationSeconds;

    // === Mode selection ===

    // Onboarding: first visit, hasn't spoken yet
    if (this.isFirstVisit && !this.hasEverSpoken) {
      this.mode = 'onboarding';
    }
    // Immersive: in zone or deep flowing
    else if (state.flowLevel === 'zone') {
      this.mode = 'immersive';
    }
    // Minimal: flowing conversation (don't distract)
    else if (state.flowLevel === 'flowing' && state.activeSpeakerCount >= 2) {
      this.mode = 'minimal';
    }
    // Full: everything else
    else {
      this.mode = 'full';
    }

    // === Nudge logic ===
    let nudge: string | null = null;
    const nudgeCooldown = now - this.nudgeShownAt > 60000; // 1 minute cooldown

    if (nudgeCooldown) {
      // Never spoken + 30 seconds
      if (!this.hasEverSpoken && sessionSeconds > 30) {
        nudge = '🎤 マイクボタンをタップして話してみましょう';
        this.nudgeShownAt = now;
      }
      // Long silence (2 minutes)
      else if (this.hasEverSpoken && silenceSeconds > 120 && state.activeSpeakerCount > 0) {
        nudge = '💬 会話に参加してみませんか？';
        this.nudgeShownAt = now;
      }
      // Alone in room
      else if (state.participantCount <= 1 && sessionSeconds > 60) {
        nudge = '🚪 他の部屋に行ってみましょう';
        this.nudgeShownAt = now;
      }
    }

    // === UI state ===
    const hudOpacity = this.mode === 'immersive' ? 0.3
      : this.mode === 'minimal' ? 0.7
      : 1.0;

    return {
      mode: this.mode,
      showHUD: this.mode !== 'immersive',
      showReactions: this.mode !== 'immersive',
      showParticipants: this.mode === 'full',
      showMoodIndicator: this.mode !== 'onboarding',
      nudgeMessage: nudge,
      hudOpacity,
    };
  }

  /**
   * 強制的にモードを設定
   */
  forceMode(mode: UIMode): void {
    this.mode = mode;
  }

  /**
   * 現在のモード
   */
  getMode(): UIMode {
    return this.mode;
  }
}
