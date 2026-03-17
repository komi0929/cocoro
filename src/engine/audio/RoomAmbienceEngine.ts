/**
 * cocoro — Room Ambient Sound Engine
 * ルームの環境音（静かなハム、風の音、会話の温もり）
 * 
 * 反復81-90: 「空間に音がある」ことで没入感が劇的に向上
 * 沈黙のフロア → 低いドローン音 + ソフトな風
 * 活性中 → 温かいハム + 柔らかい空気感
 * 熱狂 → 低音が増強 + エネルギッシュなパルス
 */

type PhaseType = 'SILENCE' | 'TRIGGER' | 'GRAVITY';

interface AmbienceConfig {
  droneFreq: number;
  droneVolume: number;
  noiseVolume: number;
  lfoRate: number;
  lfoDepth: number;
}

const AMBIENCE_PRESETS: Record<PhaseType, AmbienceConfig> = {
  SILENCE: {
    droneFreq: 55,        // Low A1
    droneVolume: 0.02,
    noiseVolume: 0.008,
    lfoRate: 0.1,
    lfoDepth: 5,
  },
  TRIGGER: {
    droneFreq: 65,
    droneVolume: 0.025,
    noiseVolume: 0.005,
    lfoRate: 0.2,
    lfoDepth: 8,
  },
  GRAVITY: {
    droneFreq: 80,
    droneVolume: 0.03,
    noiseVolume: 0.003,
    lfoRate: 0.4,
    lfoDepth: 12,
  },
};

export class RoomAmbienceEngine {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;

  constructor() {}

  /**
   * 初期化して環境音を開始
   */
  async start(audioContext?: AudioContext): Promise<void> {
    if (this.isRunning) return;

    this.ctx = audioContext ?? new AudioContext();
    const ctx = this.ctx;

    // Master gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(ctx.destination);

    // Drone oscillator (low hum)
    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 55;
    
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.02;

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    // LFO modulating drone frequency
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.1;
    
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 5;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.droneOsc.frequency);

    // Noise generator (wind/air)
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.008;

    const noiseBuffer = this.generateNoiseBuffer(ctx, 2);
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    // Lowpass filter for noise (make it soft)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.5;

    this.noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // Start everything
    this.droneOsc.start();
    this.lfo.start();
    this.noiseSource.start();
    this.isRunning = true;

    // Fade in
    this.masterGain.gain.setTargetAtTime(1, ctx.currentTime, 2);
  }

  /**
   * フェーズに応じて環境音を変更
   */
  setPhase(phase: PhaseType): void {
    if (!this.ctx || !this.isRunning) return;
    const config = AMBIENCE_PRESETS[phase];
    const now = this.ctx.currentTime;

    if (this.droneOsc) {
      this.droneOsc.frequency.setTargetAtTime(config.droneFreq, now, 3);
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(config.droneVolume, now, 2);
    }
    if (this.noiseGain) {
      this.noiseGain.gain.setTargetAtTime(config.noiseVolume, now, 2);
    }
    if (this.lfo) {
      this.lfo.frequency.setTargetAtTime(config.lfoRate, now, 2);
    }
    if (this.lfoGain) {
      this.lfoGain.gain.setTargetAtTime(config.lfoDepth, now, 2);
    }
  }

  /**
   * 密度に応じて音量を微調整
   */
  updateDensity(density: number): void {
    if (!this.ctx || !this.masterGain) return;
    // More people = slightly louder ambient
    const target = 0.8 + density * 0.4;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 1);
  }

  /**
   * ノイズバッファ生成
   */
  private generateNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Brown noise (low-frequency weighted)
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 3.5; // (roughly) compensate for gain
    }
    
    return buffer;
  }

  /**
   * 停止
   */
  stop(): void {
    if (!this.isRunning || !this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.5);
    }

    // Clean up after fade out
    setTimeout(() => {
      try {
        this.droneOsc?.stop();
        this.lfo?.stop();
        this.noiseSource?.stop();
      } catch {
        // Already stopped
      }
      this.isRunning = false;
    }, 2000);
  }

  /**
   * 完全リソース解放
   */
  dispose(): void {
    this.stop();
    this.ctx = null;
  }
}
