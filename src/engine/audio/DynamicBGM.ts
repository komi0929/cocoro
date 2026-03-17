/**
 * kokoro — DynamicBGM
 * 会話のテンションに**自動追従するBGMシステム**
 *
 * POPOPOに対抗: 背景だけでなく**音楽も追従**
 * SilenceDirector + ConversationArcDirector と完全連動
 *
 * ジャンル:
 * - silence → Lo-Fi Chill (Web Audio API生成)
 * - trigger → Acoustic Pop
 * - gravity → EDM / Funk
 * - climax → Epic Orchestra
 * - calm → Ambient Piano
 */

export type BGMGenre = 'lofi' | 'acoustic' | 'edm' | 'epic' | 'ambient' | 'funk' | 'jazz' | 'none';

export interface BGMState {
  currentGenre: BGMGenre;
  volume: number;       // 0-1
  targetVolume: number;
  isPlaying: boolean;
  bpm: number;
  intensity: number;    // 0-1 (from conversation)
}

// Web Audio API で簡易BGM生成（ファイル不要）
const GENRE_CONFIGS: Record<BGMGenre, { baseNote: number; bpm: number; pattern: number[]; waveform: OscillatorType; filterFreq: number }> = {
  lofi: { baseNote: 261.63, bpm: 70, pattern: [0, 3, 7, 10, 12], waveform: 'sine', filterFreq: 800 },
  acoustic: { baseNote: 293.66, bpm: 100, pattern: [0, 4, 7, 12], waveform: 'triangle', filterFreq: 2000 },
  edm: { baseNote: 329.63, bpm: 128, pattern: [0, 5, 7, 12, 17], waveform: 'sawtooth', filterFreq: 4000 },
  epic: { baseNote: 196.00, bpm: 90, pattern: [0, 7, 12, 16, 19], waveform: 'sawtooth', filterFreq: 3000 },
  ambient: { baseNote: 220.00, bpm: 60, pattern: [0, 7, 12], waveform: 'sine', filterFreq: 600 },
  funk: { baseNote: 349.23, bpm: 110, pattern: [0, 3, 5, 7, 10], waveform: 'square', filterFreq: 2500 },
  jazz: { baseNote: 277.18, bpm: 85, pattern: [0, 4, 7, 10, 14], waveform: 'triangle', filterFreq: 1500 },
  none: { baseNote: 0, bpm: 0, pattern: [], waveform: 'sine', filterFreq: 0 },
};

export class DynamicBGM {
  private state: BGMState;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isAudioInit = false;
  private noteInterval: ReturnType<typeof setInterval> | null = null;
  private patternIndex = 0;
  private enabled = true;

  constructor() {
    this.state = {
      currentGenre: 'none',
      volume: 0,
      targetVolume: 0.1,
      isPlaying: false,
      bpm: 0,
      intensity: 0,
    };
  }

  /** 初期化(ユーザーインタラクション後) */
  init(): void {
    if (this.isAudioInit) return;
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 1000;
      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      this.isAudioInit = true;
    } catch { /* Web Audio not available */ }
  }

  /**
   * 会話状態から最適なジャンルを自動選択
   */
  updateFromConversation(params: {
    phase: string;           // SILENCE/TRIGGER/GRAVITY
    intensity: number;       // 0-1
    speakerCount: number;
    isSilent: boolean;
    silenceDurationSec: number;
  }): BGMState {
    this.state.intensity = params.intensity;

    // ジャンル自動切り替え
    let targetGenre: BGMGenre = 'none';
    let targetVolume = 0;

    if (params.isSilent && params.silenceDurationSec > 5) {
      // 沈黙 → Lo-Fi でリラックス
      targetGenre = 'lofi';
      targetVolume = Math.min(0.15, params.silenceDurationSec / 60);
    } else if (params.phase === 'GRAVITY' || params.intensity > 0.7) {
      // 盛り上がり → EDM/Funk
      targetGenre = params.intensity > 0.85 ? 'epic' : 'edm';
      targetVolume = 0.05; // 会話の邪魔にならない音量
    } else if (params.phase === 'TRIGGER') {
      // 普通の会話 → Acoustic
      targetGenre = params.speakerCount > 3 ? 'jazz' : 'acoustic';
      targetVolume = 0.03;
    } else {
      // 静か → Ambient
      targetGenre = 'ambient';
      targetVolume = 0.08;
    }

    // Genre switch
    if (targetGenre !== this.state.currentGenre) {
      this.crossfadeTo(targetGenre, targetVolume);
    }

    // Volume smooth
    this.state.targetVolume = targetVolume;
    this.state.volume += (targetVolume - this.state.volume) * 0.05;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? this.state.volume : 0;
    }

    return { ...this.state };
  }

  /** クロスフェードでジャンル切り替え */
  private crossfadeTo(genre: BGMGenre, volume: number): void {
    this.stop();
    this.state.currentGenre = genre;

    const config = GENRE_CONFIGS[genre];
    if (!config || !this.audioContext || !this.filterNode) return;

    this.state.bpm = config.bpm;
    this.filterNode.frequency.value = config.filterFreq;

    // Start pattern playback
    const beatMs = 60000 / config.bpm;
    this.patternIndex = 0;

    this.noteInterval = setInterval(() => {
      if (!this.audioContext || !this.filterNode) return;
      this.playNote(config);
    }, beatMs);

    this.state.isPlaying = true;
    this.state.volume = 0;
    this.state.targetVolume = volume;
  }

  /** 音符を1つ再生 */
  private playNote(config: typeof GENRE_CONFIGS['lofi']): void {
    if (!this.audioContext || !this.filterNode) return;

    const semitone = config.pattern[this.patternIndex % config.pattern.length];
    const freq = config.baseNote * Math.pow(2, semitone / 12);
    const beatDuration = 60 / config.bpm;

    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();

    osc.type = config.waveform;
    osc.frequency.value = freq;

    // Envelope: attack → sustain → release
    const now = this.audioContext.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.8);

    osc.connect(noteGain);
    noteGain.connect(this.filterNode);

    osc.start(now);
    osc.stop(now + beatDuration);

    this.patternIndex++;
  }

  /** 停止 */
  stop(): void {
    if (this.noteInterval) {
      clearInterval(this.noteInterval);
      this.noteInterval = null;
    }
    this.state.isPlaying = false;
  }

  /** 有効/無効切り替え */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  /** 音量設定 */
  setMaxVolume(volume: number): void {
    this.state.targetVolume = Math.max(0, Math.min(0.3, volume));
  }

  getState(): BGMState { return { ...this.state }; }
  isEnabled(): boolean { return this.enabled; }

  dispose(): void {
    this.stop();
    this.audioContext?.close();
  }
}
