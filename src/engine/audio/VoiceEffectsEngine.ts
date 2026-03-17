/**
 * kokoro — Voice Effects Engine
 * 空間に合わせた音声エフェクト（リバーブ・ディレイ）
 * 
 * 反復41-50: 空間の広がりを声で感じる
 * ルームの密度が低い → 広いリバーブ（広い空間にいる感覚）
 * ルームの密度が高い → ショートリバーブ（近い距離の親密感）
 * 
 * PopopoにはないKokoro独自の「声が空間を生む」体験
 */

export interface VoiceEffectPreset {
  name: string;
  reverbDecay: number;     // 残響時間 (秒)
  reverbMix: number;       // Wet/Dry比率 0-1
  delayTime: number;       // ディレイタイム (秒)
  delayFeedback: number;   // ディレイフィードバック 0-1
  highpassFreq: number;    // ハイパスフィルター周波数
  lowpassFreq: number;     // ローパスフィルター周波数
}

const PRESETS: Record<string, VoiceEffectPreset> = {
  // 静寂の広い空間: 長いリバーブ、柔らかい
  silence: {
    name: '静寂の間',
    reverbDecay: 3.0,
    reverbMix: 0.25,
    delayTime: 0,
    delayFeedback: 0,
    highpassFreq: 100,
    lowpassFreq: 8000,
  },
  // 発話中: 適度なリバーブ
  trigger: {
    name: '会話の間',
    reverbDecay: 1.5,
    reverbMix: 0.15,
    delayTime: 0.05,
    delayFeedback: 0.1,
    highpassFreq: 150,
    lowpassFreq: 10000,
  },
  // 熱狂: 短いリバーブ、明瞭な声
  gravity: {
    name: '熱狂の間',
    reverbDecay: 0.8,
    reverbMix: 0.08,
    delayTime: 0,
    delayFeedback: 0,
    highpassFreq: 200,
    lowpassFreq: 12000,
  },
};

/**
 * VoiceEffectsEngine: WebAudio ConvolverNodeを使ったリバーブエフェクト
 */
export class VoiceEffectsEngine {
  private ctx: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private dryNode: GainNode | null = null;
  private wetNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private highpassNode: BiquadFilterNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private currentPreset: string = 'trigger';

  constructor() {}

  /**
   * AudioContextを受け取って初期化
   */
  async initialize(audioContext: AudioContext): Promise<void> {
    this.ctx = audioContext;

    // Create nodes
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.dryNode = this.ctx.createGain();
    this.wetNode = this.ctx.createGain();

    // Convolver for reverb
    this.convolverNode = this.ctx.createConvolver();
    this.convolverNode.buffer = this.generateImpulseResponse(1.5, 2.0);

    // Delay
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.05;
    this.feedbackNode = this.ctx.createGain();
    this.feedbackNode.gain.value = 0.1;

    // Filters
    this.highpassNode = this.ctx.createBiquadFilter();
    this.highpassNode.type = 'highpass';
    this.highpassNode.frequency.value = 150;

    this.lowpassNode = this.ctx.createBiquadFilter();
    this.lowpassNode.type = 'lowpass';
    this.lowpassNode.frequency.value = 10000;

    // Signal chain:
    // input → highpass → lowpass → dry → output
    //                             → convolver → wet → output
    //                             → delay → feedback → delay (loop)
    //                                      → wet → output

    this.inputNode.connect(this.highpassNode);
    this.highpassNode.connect(this.lowpassNode);

    // Dry path
    this.lowpassNode.connect(this.dryNode);
    this.dryNode.connect(this.outputNode);

    // Wet (reverb) path
    this.lowpassNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetNode);
    this.wetNode.connect(this.outputNode);

    // Delay path  
    this.lowpassNode.connect(this.delayNode);
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode); // Feedback loop
    this.delayNode.connect(this.wetNode);

    // Set initial mix
    this.dryNode.gain.value = 0.85;
    this.wetNode.gain.value = 0.15;
  }

  /**
   * インパルスレスポンスを生成（合成リバーブ）
   */
  private generateImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const length = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with noise
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  /**
   * フェーズに応じてプリセットを切り替え
   */
  setPhase(phase: 'SILENCE' | 'TRIGGER' | 'GRAVITY'): void {
    const presetKey = phase.toLowerCase();
    const preset = PRESETS[presetKey];
    if (!preset || !this.ctx) return;

    this.currentPreset = presetKey;
    const now = this.ctx.currentTime;
    const rampTime = 2.0; // Smooth 2-second transition

    // Update reverb
    if (this.convolverNode) {
      this.convolverNode.buffer = this.generateImpulseResponse(
        preset.reverbDecay,
        2.0
      );
    }

    // Update mix
    if (this.dryNode && this.wetNode) {
      this.dryNode.gain.setTargetAtTime(1 - preset.reverbMix, now, rampTime / 3);
      this.wetNode.gain.setTargetAtTime(preset.reverbMix, now, rampTime / 3);
    }

    // Update delay
    if (this.delayNode && this.feedbackNode) {
      this.delayNode.delayTime.setTargetAtTime(preset.delayTime, now, rampTime / 3);
      this.feedbackNode.gain.setTargetAtTime(preset.delayFeedback, now, rampTime / 3);
    }

    // Update filters
    if (this.highpassNode) {
      this.highpassNode.frequency.setTargetAtTime(preset.highpassFreq, now, rampTime / 3);
    }
    if (this.lowpassNode) {
      this.lowpassNode.frequency.setTargetAtTime(preset.lowpassFreq, now, rampTime / 3);
    }
  }

  /**
   * 入力ノードを返す（MediaStreamSourceを接続する先）
   */
  getInputNode(): GainNode | null {
    return this.inputNode;
  }

  /**
   * 出力ノードを返す（destinationに接続する先）
   */
  getOutputNode(): GainNode | null {
    return this.outputNode;
  }

  /**
   * 現在のプリセット名
   */
  getCurrentPreset(): string {
    return PRESETS[this.currentPreset]?.name ?? '不明';
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.inputNode?.disconnect();
    this.outputNode?.disconnect();
    this.dryNode?.disconnect();
    this.wetNode?.disconnect();
    this.convolverNode?.disconnect();
    this.delayNode?.disconnect();
    this.feedbackNode?.disconnect();
    this.highpassNode?.disconnect();
    this.lowpassNode?.disconnect();
    this.ctx = null;
  }
}
