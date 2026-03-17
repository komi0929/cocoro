/**
 * cocoro — Audio Optimizer
 * WebRTC音声のパフォーマンス最適化
 *
 * サイクル1: Opus最適化 + VAD(Voice Activity Detection)
 * - Opusコーデック: 低帯域でも高品質な音声
 * - VAD: 声がない時はデータ送信停止 → 帯域節約
 * - エコーキャンセリング + ノイズ抑制
 * - 自動ビットレート調整
 */

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  vadEnabled: boolean;
  vadThreshold: number;     // 0-1: この閾値以下は無音扱い
  targetBitrate: number;    // bps
}

export interface AudioStats {
  isTransmitting: boolean;
  currentBitrate: number;
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  vadState: 'speaking' | 'silence';
  bandwidthSaved: number;   // bytes saved by VAD
}

export class AudioOptimizer {
  private config: AudioConfig;
  private stats: AudioStats;
  private silenceFrames = 0;
  private totalBytesSaved = 0;

  constructor() {
    this.config = {
      sampleRate: 48000,
      channelCount: 1,       // mono = 帯域半分
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      vadEnabled: true,
      vadThreshold: 0.02,
      targetBitrate: 32000,  // 32kbps (Opus sweet spot)
    };
    this.stats = {
      isTransmitting: false, currentBitrate: 32000,
      packetsLost: 0, jitter: 0, roundTripTime: 0,
      vadState: 'silence', bandwidthSaved: 0,
    };
  }

  /**
   * getUserMedia制約を生成
   */
  getMediaConstraints(): MediaStreamConstraints {
    return {
      audio: {
        sampleRate: this.config.sampleRate,
        channelCount: this.config.channelCount,
        echoCancellation: this.config.echoCancellation,
        noiseSuppression: this.config.noiseSuppression,
        autoGainControl: this.config.autoGainControl,
      },
    };
  }

  /**
   * VAD判定: 音量がthreshold以下なら無音
   */
  processVAD(volume: number): boolean {
    if (!this.config.vadEnabled) {
      this.stats.vadState = 'speaking';
      return true; // always transmit
    }

    if (volume > this.config.vadThreshold) {
      this.silenceFrames = 0;
      this.stats.vadState = 'speaking';
      this.stats.isTransmitting = true;
      return true;
    }

    // Grace period: 沈黙後10フレーム(約160ms)はまだ送信
    this.silenceFrames++;
    if (this.silenceFrames < 10) {
      return true;
    }

    this.stats.vadState = 'silence';
    this.stats.isTransmitting = false;
    // 帯域節約カウント
    this.totalBytesSaved += this.config.targetBitrate / 8 / 60;
    this.stats.bandwidthSaved = this.totalBytesSaved;
    return false;
  }

  /**
   * ネットワーク品質に応じてビットレートを動的調整
   */
  adaptBitrate(packetLoss: number, rtt: number): number {
    this.stats.packetsLost = packetLoss;
    this.stats.roundTripTime = rtt;

    if (packetLoss > 10 || rtt > 300) {
      // 劣悪なネットワーク → 低ビットレート
      this.config.targetBitrate = Math.max(16000, this.config.targetBitrate * 0.8);
    } else if (packetLoss < 2 && rtt < 100) {
      // 良好なネットワーク → ビットレート回復
      this.config.targetBitrate = Math.min(64000, this.config.targetBitrate * 1.1);
    }

    this.stats.currentBitrate = Math.round(this.config.targetBitrate);
    return this.stats.currentBitrate;
  }

  getConfig(): AudioConfig { return { ...this.config }; }
  getStats(): AudioStats { return { ...this.stats }; }

  setVADThreshold(threshold: number): void {
    this.config.vadThreshold = Math.max(0.01, Math.min(0.1, threshold));
  }
}
