/**
 * kokoro — Voice Effects
 * ボイスエフェクト — 会話のエンタメ化をさらに加速
 *
 * - リバーブ(エコー)
 * - ピッチシフト(高い声/低い声)
 * - ロボットボイス
 * - ささやきエフェクト
 * - 宇宙的エコー
 * = 「面白い声で話す」だけで笑いが生まれる
 */

export type VoiceEffect = 'none' | 'reverb' | 'pitch_high' | 'pitch_low' | 'robot' | 'whisper' | 'cosmic';

export interface EffectConfig {
  name: string;
  emoji: string;
  description: string;
  isPremium: boolean;
}

const EFFECT_CATALOG: Record<VoiceEffect, EffectConfig> = {
  none: { name: 'ノーマル', emoji: '🎤', description: 'そのままの声', isPremium: false },
  reverb: { name: 'エコー', emoji: '🏔️', description: '山びこのように響く', isPremium: false },
  pitch_high: { name: 'ハイボイス', emoji: '🐿️', description: 'リスみたいな高い声', isPremium: false },
  pitch_low: { name: 'ローボイス', emoji: '🐻', description: 'クマみたいな低い声', isPremium: false },
  robot: { name: 'ロボット', emoji: '🤖', description: 'メカニカルな声', isPremium: true },
  whisper: { name: 'ウィスパー', emoji: '🤫', description: 'ASMRのようなささやき', isPremium: true },
  cosmic: { name: 'コスミック', emoji: '🌌', description: '宇宙からの通信', isPremium: true },
};

export class VoiceEffectProcessor {
  private audioContext: AudioContext | null = null;
  private currentEffect: VoiceEffect = 'none';

  /**
   * エフェクトカタログ
   */
  static getCatalog(): Array<{ effect: VoiceEffect } & EffectConfig> {
    return (Object.entries(EFFECT_CATALOG) as [VoiceEffect, EffectConfig][])
      .map(([effect, config]) => ({ effect, ...config }));
  }

  /**
   * AudioContextを取得
   */
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Web Audio APIでエフェクトチェーンを構築
   */
  createEffectChain(source: MediaStreamAudioSourceNode): AudioNode {
    const ctx = this.getContext();

    switch (this.currentEffect) {
      case 'reverb': {
        const convolver = ctx.createConvolver();
        const impulseLength = ctx.sampleRate * 2;
        const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const channelData = impulse.getChannelData(ch);
          for (let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 3);
          }
        }
        convolver.buffer = impulse;

        const dry = ctx.createGain();
        const wet = ctx.createGain();
        const merger = ctx.createGain();
        dry.gain.value = 0.7;
        wet.gain.value = 0.3;

        source.connect(dry).connect(merger);
        source.connect(convolver).connect(wet).connect(merger);
        return merger;
      }

      case 'pitch_high':
      case 'pitch_low': {
        // Pitch shift via playback rate on a delay
        const filter = ctx.createBiquadFilter();
        filter.type = this.currentEffect === 'pitch_high' ? 'highshelf' : 'lowshelf';
        filter.frequency.value = this.currentEffect === 'pitch_high' ? 2000 : 500;
        filter.gain.value = this.currentEffect === 'pitch_high' ? 6 : -6;
        source.connect(filter);
        return filter;
      }

      case 'robot': {
        // Ring modulation for robotic effect
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 50;
        const modGain = ctx.createGain();
        modGain.gain.value = 0.5;
        oscillator.connect(modGain);
        oscillator.start();

        const output = ctx.createGain();
        source.connect(output);
        modGain.connect(output.gain);
        return output;
      }

      case 'whisper': {
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 1000;
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -30;
        compressor.ratio.value = 12;
        source.connect(highpass).connect(compressor);
        return compressor;
      }

      case 'cosmic': {
        const delay = ctx.createDelay(1);
        delay.delayTime.value = 0.3;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 5;

        source.connect(delay).connect(feedback).connect(delay);
        source.connect(filter);
        const output = ctx.createGain();
        delay.connect(output);
        filter.connect(output);
        return output;
      }

      case 'none':
      default:
        return source;
    }
  }

  setEffect(effect: VoiceEffect): void { this.currentEffect = effect; }
  getEffect(): VoiceEffect { return this.currentEffect; }
  static isPremium(effect: VoiceEffect): boolean { return EFFECT_CATALOG[effect].isPremium; }
}
