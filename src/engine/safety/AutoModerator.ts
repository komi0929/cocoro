/**
 * cocoro — Auto Moderator (強化版)
 * 音声ベースの自動モデレーション
 *
 * サイクル10: 荒らし対策の自動化
 * - 音量爆音検知: 意図的な大音量 → 自動ミュート
 * - 連続発話独占: 60秒以上の独占 → 警告
 * - 高速マイクON/OFF: スパム的なON/OFF → 自動ミュート
 * - 聴覚攻撃検知: 突然の極端なピッチ変化 → ミュート
 * = AIが24時間見守る安全な空間
 */

export type ModerationAction =
  | { type: 'auto_mute'; reason: string; duration: number }
  | { type: 'warning'; message: string }
  | { type: 'kick'; reason: string }
  | { type: 'none' };

interface ParticipantBehavior {
  id: string;
  continuousSpeakingSeconds: number;
  recentVolumeHistory: number[];     // last 10 frames
  micToggleCount: number;            // ON/OFF count in last 10s
  lastMicToggleTime: number;
  warningCount: number;
}

export class AutoModerator {
  private behaviors: Map<string, ParticipantBehavior> = new Map();
  private mutedUntil: Map<string, number> = new Map(); // id → timestamp

  private readonly VOLUME_THRESHOLD = 0.95;      // 95% = 爆音
  private readonly SPEAKING_MONOPOLY_SEC = 60;    // 60秒独占
  private readonly MIC_TOGGLE_SPAM = 5;           // 10秒に5回ON/OFF
  private readonly PITCH_SPIKE_THRESHOLD = 2000;  // Hz

  /**
   * フレーム更新: 各参加者の行動を評価
   */
  evaluate(participantId: string, params: {
    isSpeaking: boolean;
    volume: number;
    pitch: number;
    micToggled: boolean;
    deltaTime: number;
  }): ModerationAction {
    const { isSpeaking, volume, pitch, micToggled, deltaTime } = params;

    // Get or create behavior
    let behavior = this.behaviors.get(participantId);
    if (!behavior) {
      behavior = {
        id: participantId,
        continuousSpeakingSeconds: 0,
        recentVolumeHistory: [],
        micToggleCount: 0,
        lastMicToggleTime: 0,
        warningCount: 0,
      };
      this.behaviors.set(participantId, behavior);
    }

    // Check if currently muted
    const muteEnd = this.mutedUntil.get(participantId);
    if (muteEnd && Date.now() < muteEnd) {
      return { type: 'none' };
    }

    // === 1. Volume check ===
    behavior.recentVolumeHistory.push(volume);
    if (behavior.recentVolumeHistory.length > 10) behavior.recentVolumeHistory.shift();

    const avgVolume = behavior.recentVolumeHistory.reduce((a, b) => a + b, 0) / behavior.recentVolumeHistory.length;
    if (avgVolume > this.VOLUME_THRESHOLD && behavior.recentVolumeHistory.length >= 5) {
      this.mutedUntil.set(participantId, Date.now() + 30000);
      return { type: 'auto_mute', reason: '音量が大きすぎます', duration: 30 };
    }

    // === 2. Speaking monopoly ===
    if (isSpeaking) {
      behavior.continuousSpeakingSeconds += deltaTime;
    } else {
      behavior.continuousSpeakingSeconds = 0;
    }

    if (behavior.continuousSpeakingSeconds > this.SPEAKING_MONOPOLY_SEC) {
      behavior.warningCount++;
      behavior.continuousSpeakingSeconds = 0;
      if (behavior.warningCount >= 3) {
        this.mutedUntil.set(participantId, Date.now() + 60000);
        return { type: 'auto_mute', reason: '発話時間が長すぎます', duration: 60 };
      }
      return { type: 'warning', message: '他の人にも話す機会を 💬' };
    }

    // === 3. Mic toggle spam ===
    if (micToggled) {
      const now = Date.now();
      if (now - behavior.lastMicToggleTime < 10000) {
        behavior.micToggleCount++;
      } else {
        behavior.micToggleCount = 1;
      }
      behavior.lastMicToggleTime = now;

      if (behavior.micToggleCount > this.MIC_TOGGLE_SPAM) {
        this.mutedUntil.set(participantId, Date.now() + 30000);
        behavior.micToggleCount = 0;
        return { type: 'auto_mute', reason: 'マイクの操作が頻繁すぎます', duration: 30 };
      }
    }

    // === 4. Pitch spike (auditory attack) ===
    if (isSpeaking && pitch > this.PITCH_SPIKE_THRESHOLD) {
      this.mutedUntil.set(participantId, Date.now() + 15000);
      return { type: 'auto_mute', reason: '異常な音声を検知しました', duration: 15 };
    }

    return { type: 'none' };
  }

  isAutoMuted(participantId: string): boolean {
    const muteEnd = this.mutedUntil.get(participantId);
    return !!muteEnd && Date.now() < muteEnd;
  }

  getWarningCount(participantId: string): number {
    return this.behaviors.get(participantId)?.warningCount ?? 0;
  }
}
