/**
 * kokoro — Sound Design
 * UI効果音統一システム — ブランドの聴覚要素
 *
 * サイクル72: 音でブランドを伝える
 * - Web Audio APIでのサウンド生成(ファイル不要)
 * - UIアクション毎の効果音
 * - ボリューム設定
 * - 会話の邪魔にならない控えめな音量
 * = 「心地よさ」を音で演出
 */

export type SoundType =
  | 'tap'        // UI操作
  | 'join'       // ルーム参加
  | 'leave'      // ルーム退出
  | 'message'    // 通知/メッセージ
  | 'gift'       // ギフト受信
  | 'levelup'    // レベルアップ
  | 'vote'       // 投票
  | 'reaction'   // リアクション
  | 'whisper'    // ささやき開始
  | 'achievement'; // 実績解除

const SOUND_CONFIGS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; gain: number, rampTo?: number }> = {
  tap:        { frequency: 800, duration: 0.05, type: 'sine', gain: 0.05 },
  join:       { frequency: 440, duration: 0.3, type: 'sine', gain: 0.1, rampTo: 880 },
  leave:      { frequency: 660, duration: 0.2, type: 'sine', gain: 0.08, rampTo: 330 },
  message:    { frequency: 523, duration: 0.15, type: 'sine', gain: 0.08 },
  gift:       { frequency: 1047, duration: 0.4, type: 'triangle', gain: 0.12 },
  levelup:    { frequency: 523, duration: 0.6, type: 'sine', gain: 0.15, rampTo: 1047 },
  vote:       { frequency: 700, duration: 0.08, type: 'square', gain: 0.04 },
  reaction:   { frequency: 600, duration: 0.06, type: 'sine', gain: 0.04 },
  whisper:    { frequency: 200, duration: 0.2, type: 'sine', gain: 0.06 },
  achievement: { frequency: 660, duration: 0.8, type: 'sine', gain: 0.15, rampTo: 1320 },
};

export class SoundDesign {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.5;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * 効果音を再生
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const config = SOUND_CONFIGS[type];

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      if (config.rampTo) {
        oscillator.frequency.linearRampToValueAtTime(config.rampTo, ctx.currentTime + config.duration);
      }

      gainNode.gain.setValueAtTime(config.gain * this.masterVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration + 0.01);
    } catch { /* audio not available */ }
  }

  setVolume(volume: number): void { this.masterVolume = Math.max(0, Math.min(1, volume)); }
  setEnabled(enabled: boolean): void { this.enabled = enabled; }
  isEnabled(): boolean { return this.enabled; }
  getVolume(): number { return this.masterVolume; }
}
