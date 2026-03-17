/**
 * cocoro — Spatial Soundscape Generator
 * 空間の「音の風景」を感情/密度に応じて動的生成
 *
 * 反復281-290:
 * - 低密度空間: 深い残響の水滴音＋遠くの風
 * - 高密度空間: 温かい低音のハム＋きらめく高音
 * - ゾーン状態: 荘厳なパッドサウンド
 * - テンション高: 深い低音のうねり
 * = RoomAmbienceEngineの発展形: より緻密な音響設計
 */

export class SpatialSoundscapeGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Layers
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private shimmerOsc: OscillatorNode | null = null;
  private shimmerGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  private isRunning = false;

  /**
   * 初期化＆開始
   */
  async start(audioContext?: AudioContext): Promise<void> {
    if (this.isRunning) return;
    this.ctx = audioContext ?? new AudioContext();
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.08; // Very subtle
    this.masterGain.connect(ctx.destination);

    // === Reverb ===
    this.reverbNode = ctx.createConvolver();
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.3;
    this.reverbGain.connect(this.masterGain);
    // Generate impulse response
    const impulse = this.generateImpulseResponse(ctx, 3, 2);
    this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.reverbGain);

    // === Drone (deep pad) ===
    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 55; // A1
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.15;
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneGain.connect(this.reverbNode);
    this.droneOsc.start();

    // === Shimmer (high sparkle) ===
    this.shimmerOsc = ctx.createOscillator();
    this.shimmerOsc.type = 'sine';
    this.shimmerOsc.frequency.value = 2200;
    this.shimmerGain = ctx.createGain();
    this.shimmerGain.gain.value = 0;
    this.shimmerOsc.connect(this.shimmerGain);
    this.shimmerGain.connect(this.masterGain);
    this.shimmerGain.connect(this.reverbNode);
    this.shimmerOsc.start();

    // === Sub bass ===
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = 30;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.masterGain);
    this.subOsc.start();

    // === LFO (modulate drone pitch for organic feel) ===
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.1; // 0.1 Hz
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 2; // ±2Hz
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.droneOsc.frequency);
    this.lfo.start();

    this.isRunning = true;
  }

  /**
   * 空間状態に応じてパラメータを更新
   */
  setAtmosphere(params: {
    density: number;     // 0-1
    tension: number;     // 0-1
    warmth: number;      // 0-1
    flowScore: number;   // 0-1
    isInZone: boolean;
  }): void {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;

    // Drone: pitch rises with density
    if (this.droneOsc) {
      const basePitch = 55 + params.density * 30;
      this.droneOsc.frequency.setTargetAtTime(basePitch, t, 2);
    }

    // Drone volume: louder in zone
    if (this.droneGain) {
      const vol = 0.1 + (params.isInZone ? 0.15 : params.density * 0.05);
      this.droneGain.gain.setTargetAtTime(vol, t, 1);
    }

    // Shimmer: more in zone/warm states
    if (this.shimmerGain) {
      const shimVol = params.isInZone ? 0.03 : params.warmth * 0.015;
      this.shimmerGain.gain.setTargetAtTime(shimVol, t, 1);
    }
    if (this.shimmerOsc) {
      // Shimmer frequency varies with warmth
      const freq = 1800 + params.warmth * 800;
      this.shimmerOsc.frequency.setTargetAtTime(freq, t, 2);
    }

    // Sub bass: tension increases sub
    if (this.subGain) {
      const subVol = params.tension * 0.05;
      this.subGain.gain.setTargetAtTime(subVol, t, 1);
    }

    // LFO speed: faster when tense
    if (this.lfo) {
      const lfoFreq = 0.08 + params.tension * 0.15;
      this.lfo.frequency.setTargetAtTime(lfoFreq, t, 2);
    }

    // Master volume: slightly louder in zone
    if (this.masterGain) {
      const master = 0.06 + (params.isInZone ? 0.04 : 0);
      this.masterGain.gain.setTargetAtTime(master, t, 1);
    }
  }

  /**
   * 合成インパルスレスポンス
   */
  private generateImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay / 3));
      }
    }
    return buffer;
  }

  /**
   * 停止
   */
  stop(): void {
    if (!this.isRunning) return;
    try {
      this.droneOsc?.stop();
      this.shimmerOsc?.stop();
      this.subOsc?.stop();
      this.lfo?.stop();
    } catch { /* already stopped */ }
    this.isRunning = false;
  }
}
