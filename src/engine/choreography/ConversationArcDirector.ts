/**
 * cocoro — Conversation Arc Director
 * 会話の「起承転結」を自動検知 + 演出エスカレーション
 *
 * サイクル3: ピーク/山場を逃さない
 * - 序盤(0-3分): 穏やかな雰囲気 → アイスブレイク促進
 * - 中盤(3-10分): 盛り上がりを検知 → 演出強化
 * - クライマックス: 最高潮を検知 → 全エフェクト最大
 * - 余韻(減退期): しっとりした演出に切り替え
 * = バラエティ番組の「構成作家」をAIが担う
 */

export type ArcPhase = 'opening' | 'developing' | 'climax' | 'resolution' | 'ending';

export interface ArcState {
  phase: ArcPhase;
  intensity: number;       // 0-1: 現在の盛り上がり度
  peakIntensity: number;   // セッション中の最高値
  peakTime: number;        // ピークのタイムスタンプ
  effectMultiplier: number; // エフェクトの強度倍率
  suggestedAction: string | null;
}

export class ConversationArcDirector {
  private state: ArcState = {
    phase: 'opening', intensity: 0,
    peakIntensity: 0, peakTime: 0,
    effectMultiplier: 1, suggestedAction: null,
  };
  private sessionStartTime = Date.now();
  private smoothIntensity = 0;
  private postPeakTimer = 0;

  /**
   * フレーム更新
   */
  update(params: {
    speakingCount: number;
    totalParticipants: number;
    avgVolume: number;
    reactionRate: number;   // reactions per minute
    laughCount: number;     // 笑い検知回数
    flowScore: number;      // 0-1
  }): ArcState {
    const { speakingCount, totalParticipants, avgVolume, reactionRate, laughCount, flowScore } = params;
    const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;

    // === Intensity calculation ===
    const speakingRatio = totalParticipants > 0 ? speakingCount / totalParticipants : 0;
    const rawIntensity =
      speakingRatio * 0.25 +
      avgVolume * 0.2 +
      Math.min(1, reactionRate / 10) * 0.25 +
      Math.min(1, laughCount / 5) * 0.15 +
      flowScore * 0.15;

    this.smoothIntensity += (rawIntensity - this.smoothIntensity) * 0.05;
    this.state.intensity = Math.round(this.smoothIntensity * 100) / 100;

    // Track peak
    if (this.smoothIntensity > this.state.peakIntensity) {
      this.state.peakIntensity = this.smoothIntensity;
      this.state.peakTime = Date.now();
      this.postPeakTimer = 0;
    } else {
      this.postPeakTimer++;
    }

    // === Phase detection ===
    if (sessionMinutes < 2) {
      this.state.phase = 'opening';
      this.state.effectMultiplier = 0.5;
      this.state.suggestedAction = null;
    } else if (this.smoothIntensity > 0.7) {
      this.state.phase = 'climax';
      this.state.effectMultiplier = 2.0;
      this.state.suggestedAction = '🔥 最高潮！';
    } else if (this.smoothIntensity > 0.4) {
      this.state.phase = 'developing';
      this.state.effectMultiplier = 1.2;
      this.state.suggestedAction = null;
    } else if (this.postPeakTimer > 300 && this.state.peakIntensity > 0.5) {
      // Peak passed, winding down
      this.state.phase = 'resolution';
      this.state.effectMultiplier = 0.8;
      this.state.suggestedAction = null;
    } else if (sessionMinutes > 15 && this.smoothIntensity < 0.2) {
      this.state.phase = 'ending';
      this.state.effectMultiplier = 0.6;
      this.state.suggestedAction = 'そろそろお開きの時間かも 🌙';
    } else {
      this.state.phase = 'developing';
      this.state.effectMultiplier = 1.0;
    }

    return { ...this.state };
  }

  getState(): ArcState { return { ...this.state }; }
  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.smoothIntensity = 0;
    this.postPeakTimer = 0;
    this.state = {
      phase: 'opening', intensity: 0,
      peakIntensity: 0, peakTime: 0,
      effectMultiplier: 1, suggestedAction: null,
    };
  }
}
