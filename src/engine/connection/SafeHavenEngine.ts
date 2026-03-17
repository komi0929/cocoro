/**
 * kokoro — SafeHavenAtmosphere + SocialCueReader + GentleExitFlow
 * 居場所の安全感 / 空気読み / 穏やかな離脱
 *
 * ❌ 禁止: ソーシャルプレッシャー / 離脱妨害 / 「もう行くの？」演出
 * ✅ 設計: 話さなくてもいい安心感 / 自然な離脱 / 暖かい再会
 */

// ========================================
// 1. SafeHavenAtmosphere — 居場所の安全感
// ========================================

export interface AtmosphereState {
  warmth: number;          // 0-1 (暖色度)
  safety: number;          // 0-1 (安全感)
  inclusion: number;       // 0-1 (包容力)
  welcomeActive: boolean;  // 新参者ウェルカムオーラ
  mood: 'cozy' | 'lively' | 'focused' | 'relaxed';
  colorTemperature: number; // 2700K(暖色)~6500K(寒色)
}

export interface WelcomeEvent {
  participantId: string;
  isFirstTime: boolean;
  message: string;
  color: string;
}

export class SafeHavenAtmosphere {
  private state: AtmosphereState;
  private newcomers: Set<string> = new Set();
  private knownParticipants: Set<string> = new Set();
  private welcomeListeners: Array<(e: WelcomeEvent) => void> = [];

  constructor() {
    this.state = {
      warmth: 0.7,
      safety: 0.8,
      inclusion: 0.7,
      welcomeActive: false,
      mood: 'cozy',
      colorTemperature: 3200, // 暖かめデフォルト
    };
  }

  /** 参加者入室 → ウェルカム判定 */
  onParticipantJoin(participantId: string, displayName?: string): WelcomeEvent | null {
    const isFirstTime = !this.knownParticipants.has(participantId);
    this.knownParticipants.add(participantId);

    if (isFirstTime) {
      this.newcomers.add(participantId);
      this.state.welcomeActive = true;

      const event: WelcomeEvent = {
        participantId,
        isFirstTime: true,
        message: `${displayName ?? 'どなたか'}さん、ようこそ 🌿`,
        color: '#f0e6d3', // warm welcome glow
      };

      for (const fn of this.welcomeListeners) fn(event);

      // 30秒後にウェルカムオーラ解除(自然に)
      setTimeout(() => {
        this.newcomers.delete(participantId);
        if (this.newcomers.size === 0) this.state.welcomeActive = false;
      }, 30000);

      return event;
    }

    return {
      participantId,
      isFirstTime: false,
      message: `${displayName ?? 'どなたか'}さん、おかえりなさい ☺️`,
      color: '#e8d5c4',
    };
  }

  /** 空気の更新(感情データから) */
  updateFromEmotion(roomEmotion: {
    anger: number; joy: number; sadness: number; tension: number; calmness: number;
  }): AtmosphereState {
    // 攻撃的空気を検知 → 自動で暖色化
    if (roomEmotion.anger > 0.5 || roomEmotion.tension > 0.6) {
      this.state.warmth = Math.min(1, this.state.warmth + 0.05);
      this.state.colorTemperature = Math.max(2700, this.state.colorTemperature - 50);
      this.state.safety = Math.max(0.3, this.state.safety - 0.05);
    } else if (roomEmotion.joy > 0.5 && roomEmotion.calmness > 0.3) {
      this.state.warmth = 0.7 + roomEmotion.joy * 0.2;
      this.state.safety = Math.min(1, this.state.safety + 0.02);
      this.state.colorTemperature = 3200;
    }

    // Mood determination
    if (roomEmotion.calmness > 0.6) this.state.mood = 'relaxed';
    else if (roomEmotion.joy > 0.6) this.state.mood = 'lively';
    else this.state.mood = 'cozy';

    this.state.inclusion = Math.min(1, 0.5 + this.state.safety * 0.3 + this.state.warmth * 0.2);

    return { ...this.state };
  }

  onWelcome(fn: (e: WelcomeEvent) => void): () => void {
    this.welcomeListeners.push(fn);
    return () => { this.welcomeListeners = this.welcomeListeners.filter(l => l !== fn); };
  }

  getState(): AtmosphereState { return { ...this.state }; }
}

// ========================================
// 2. SocialCueReader — 繋がりの空気読み
// ========================================

export type SocialSignal = 'wants_to_talk' | 'listening' | 'thinking' | 'ready_to_leave' | 'comfortable_silence';

export interface ParticipantCue {
  participantId: string;
  signal: SocialSignal;
  confidence: number;     // 0-1
  suggestedAction: string;
}

export class SocialCueReader {
  private cueHistory: Map<string, SocialSignal[]> = new Map();

  /**
   * 音声特徴から「今の状態」を推定
   * — 無理に話させない。聞くだけでもOK。
   */
  readCue(participantId: string, features: {
    volumeRMS: number;
    isSpeaking: boolean;
    silenceDurationSec: number;
    reactionCount: number;     // 直近のリアクション数
    sessionMinutes: number;
  }): ParticipantCue {
    let signal: SocialSignal;
    let confidence: number;
    let suggestedAction: string;

    if (features.isSpeaking && features.volumeRMS > 0.05) {
      signal = 'wants_to_talk';
      confidence = Math.min(1, features.volumeRMS * 5);
      suggestedAction = '話に集中しています';
    } else if (features.reactionCount > 0 && !features.isSpeaking) {
      signal = 'listening';
      confidence = 0.8;
      suggestedAction = '楽しんで聞いています';
    } else if (features.silenceDurationSec > 30 && features.sessionMinutes > 15) {
      signal = 'ready_to_leave';
      confidence = Math.min(0.7, features.silenceDurationSec / 120);
      suggestedAction = 'そろそろ休憩かも？';
    } else if (features.silenceDurationSec > 5 && features.silenceDurationSec < 30) {
      signal = 'thinking';
      confidence = 0.5;
      suggestedAction = '考え中かもしれません';
    } else {
      signal = 'comfortable_silence';
      confidence = 0.6;
      suggestedAction = 'リラックスしています';
    }

    // History tracking
    const history = this.cueHistory.get(participantId) ?? [];
    history.push(signal);
    if (history.length > 20) history.shift();
    this.cueHistory.set(participantId, history);

    return { participantId, signal, confidence, suggestedAction };
  }

  /** 「聞き専」と「話したい人」をマッチング */
  suggestPairs(cues: ParticipantCue[]): Array<{ talker: string; listener: string }> {
    const talkers = cues.filter(c => c.signal === 'wants_to_talk');
    const listeners = cues.filter(c => c.signal === 'listening' || c.signal === 'comfortable_silence');

    const pairs: Array<{ talker: string; listener: string }> = [];
    talkers.forEach((t, i) => {
      if (i < listeners.length) {
        pairs.push({ talker: t.participantId, listener: listeners[i].participantId });
      }
    });

    return pairs;
  }

  /** ルーム全体の空気 */
  getRoomAtmosphere(cues: ParticipantCue[]): {
    talkRatio: number;       // 話したい人率
    silenceComfort: number;  // 沈黙の心地よさ
    exitRisk: number;        // 離脱リスク
  } {
    const total = cues.length || 1;
    return {
      talkRatio: cues.filter(c => c.signal === 'wants_to_talk').length / total,
      silenceComfort: cues.filter(c => c.signal === 'comfortable_silence' || c.signal === 'listening').length / total,
      exitRisk: cues.filter(c => c.signal === 'ready_to_leave').length / total,
    };
  }
}

// ========================================
// 3. GentleExitFlow — 穏やかな離脱
// ========================================

export interface ExitState {
  phase: 'active' | 'preparing' | 'fading' | 'gone';
  fadeProgress: number;  // 0-1 (0=active, 1=completely faded)
  farewell: string;
  shouldPlaySound: boolean;
}

export class GentleExitFlow {
  private exitStates: Map<string, ExitState> = new Map();
  private exitListeners: Array<(participantId: string, state: ExitState) => void> = [];

  /**
   * 穏やかな離脱を開始
   * — 突然消えるのではなく、ゆっくりフェードアウト
   */
  initiateExit(participantId: string, displayName?: string): ExitState {
    const farewell = this.generateFarewell(displayName);
    const state: ExitState = {
      phase: 'preparing',
      fadeProgress: 0,
      farewell,
      shouldPlaySound: true,
    };
    this.exitStates.set(participantId, state);
    for (const fn of this.exitListeners) fn(participantId, state);
    return state;
  }

  /**
   * フェードアウト進行(アニメーション用)
   * 約3秒かけて透明に
   */
  updateFade(participantId: string, deltaSeconds: number): ExitState | null {
    const state = this.exitStates.get(participantId);
    if (!state || state.phase === 'gone') return null;

    state.fadeProgress = Math.min(1, state.fadeProgress + deltaSeconds / 3.0);

    if (state.fadeProgress < 0.3) state.phase = 'preparing';
    else if (state.fadeProgress < 1.0) state.phase = 'fading';
    else state.phase = 'gone';

    return { ...state };
  }

  /** 再入室(フェードイン) */
  initiateReturn(participantId: string, displayName?: string): ExitState {
    const state: ExitState = {
      phase: 'active',
      fadeProgress: 0,
      farewell: '',
      shouldPlaySound: true,
    };
    this.exitStates.set(participantId, state);
    return state;
  }

  /** 離脱リスナー */
  onExit(fn: (participantId: string, state: ExitState) => void): () => void {
    this.exitListeners.push(fn);
    return () => { this.exitListeners = this.exitListeners.filter(l => l !== fn); };
  }

  isExiting(participantId: string): boolean {
    const state = this.exitStates.get(participantId);
    return state?.phase === 'preparing' || state?.phase === 'fading' || false;
  }

  private generateFarewell(displayName?: string): string {
    const farewells = [
      'おつかれさまでした 🌙',
      'また会おうね ☺️',
      '楽しかったです 🌿',
      'お先に失礼します 🍵',
      'ゆっくり休んでね 🌸',
    ];
    const farewell = farewells[Math.floor(Math.random() * farewells.length)];
    return displayName ? `${displayName}さん、${farewell}` : farewell;
  }
}
