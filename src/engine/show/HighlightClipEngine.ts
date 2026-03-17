/**
 * kokoro — HighlightClipEngine
 * 会話の盛り上がりを**自動検出して切り抜きクリップ化**
 *
 * Clubhouseの教訓: ライブ限定=コンテンツが死蔵
 * X Spacesから学ぶ: 録音→再利用→ポッドキャスト化
 * TikTokから学ぶ: 短尺動画の拡散力
 * kokoro独自: 3D空間ごとキャプチャ→SNS共有
 *
 * 自動検出ロジック:
 * - 笑いピーク(感情joy複数人同時)
 * - 大音量ピーク
 * - リアクション集中
 * - コンボ(連続ボケ/ツッコミ)
 */

export interface HighlightMoment {
  id: string;
  timestamp: number;
  durationMs: number;
  type: 'laugh_peak' | 'volume_peak' | 'reaction_burst' | 'combo' | 'dramatic' | 'custom';
  intensity: number;  // 0-1
  participantIds: string[];
  label: string;
  thumbnail?: string; // base64 snapshot
}

export interface ClipData {
  momentId: string;
  startTime: number;
  endTime: number;
  participants: string[];
  label: string;
  shareUrl?: string;
}

export class HighlightClipEngine {
  private moments: HighlightMoment[] = [];
  private clipHistory: ClipData[] = [];
  private sessionStart = Date.now();

  // Detection buffers
  private joyBuffer: { ts: number; count: number }[] = [];
  private volumeBuffer: { ts: number; avgVolume: number }[] = [];
  private reactionBuffer: { ts: number; count: number }[] = [];
  private lastHighlightTime = 0;

  /**
   * フレーム更新 — 盛り上がりピークの自動検出
   */
  detectHighlight(params: {
    speakers: Map<string, { isSpeaking: boolean; volume: number; emotion: string }>;
    reactionCount: number;
    comboCount: number;
  }): HighlightMoment | null {
    const now = Date.now();
    const { speakers, reactionCount, comboCount } = params;

    // Cooldown: 最低15秒間隔
    if (now - this.lastHighlightTime < 15000) return null;

    // Joy count
    let joyCount = 0;
    let totalVolume = 0;
    let speakerCount = 0;
    const participantIds: string[] = [];

    speakers.forEach((s, id) => {
      if (s.emotion === 'joy') joyCount++;
      if (s.isSpeaking) {
        totalVolume += s.volume;
        speakerCount++;
        participantIds.push(id);
      }
    });

    this.joyBuffer.push({ ts: now, count: joyCount });
    this.volumeBuffer.push({ ts: now, avgVolume: speakerCount > 0 ? totalVolume / speakerCount : 0 });
    this.reactionBuffer.push({ ts: now, count: reactionCount });

    // Trim buffers (last 30s)
    const cutoff = now - 30000;
    this.joyBuffer = this.joyBuffer.filter(b => b.ts > cutoff);
    this.volumeBuffer = this.volumeBuffer.filter(b => b.ts > cutoff);
    this.reactionBuffer = this.reactionBuffer.filter(b => b.ts > cutoff);

    // --- Detection ---

    // 1. Laugh peak: 3+ people showing joy simultaneously
    if (joyCount >= 3) {
      return this.createMoment('laugh_peak', joyCount / speakers.size, participantIds, '🤣 大爆笑！');
    }

    // 2. Volume peak: average volume > 0.7
    const avgVol = speakerCount > 0 ? totalVolume / speakerCount : 0;
    if (avgVol > 0.7 && speakerCount >= 2) {
      return this.createMoment('volume_peak', avgVol, participantIds, '🔥 ボルテージMAX！');
    }

    // 3. Reaction burst: 10+ reactions in last 5 seconds
    const recent5s = this.reactionBuffer.filter(b => b.ts > now - 5000);
    const totalReactions = recent5s.reduce((sum, b) => sum + b.count, 0);
    if (totalReactions >= 10) {
      return this.createMoment('reaction_burst', Math.min(1, totalReactions / 20), participantIds, '✨ リアクションの嵐！');
    }

    // 4. Combo: 10+ consecutive combos
    if (comboCount >= 10) {
      return this.createMoment('combo', Math.min(1, comboCount / 20), participantIds, '🎯 コンボ継続中！');
    }

    return null;
  }

  /** カスタムハイライト(手動マーキング) */
  markCustomHighlight(participantIds: string[], label: string): HighlightMoment {
    return this.createMoment('custom', 0.8, participantIds, label);
  }

  /** クリップ生成(前後15秒) */
  createClip(momentId: string): ClipData | null {
    const moment = this.moments.find(m => m.id === momentId);
    if (!moment) return null;

    const clip: ClipData = {
      momentId,
      startTime: moment.timestamp - 15000,
      endTime: moment.timestamp + 15000,
      participants: moment.participantIds,
      label: moment.label,
    };
    this.clipHistory.push(clip);
    return clip;
  }

  /** SNSシェア用URL生成 */
  generateShareUrl(clipData: ClipData): string {
    const params = new URLSearchParams({
      clip: clipData.momentId,
      label: clipData.label,
      t: String(Math.round((clipData.startTime - this.sessionStart) / 1000)),
    });
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/clip?${params.toString()}`;
  }

  /** 全ハイライト取得 */
  getMoments(): HighlightMoment[] { return [...this.moments]; }

  /** ベストモーメント(intensity順) */
  getBestMoments(count = 5): HighlightMoment[] {
    return [...this.moments].sort((a, b) => b.intensity - a.intensity).slice(0, count);
  }

  /** セッション統計 */
  getSessionStats(): { totalHighlights: number; bestMoment: HighlightMoment | null; sessionDurationMs: number } {
    return {
      totalHighlights: this.moments.length,
      bestMoment: this.moments.length > 0 ? this.getBestMoments(1)[0] : null,
      sessionDurationMs: Date.now() - this.sessionStart,
    };
  }

  private createMoment(
    type: HighlightMoment['type'],
    intensity: number,
    participantIds: string[],
    label: string,
  ): HighlightMoment {
    const moment: HighlightMoment = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      durationMs: 30000,
      type,
      intensity,
      participantIds,
      label,
    };
    this.moments.push(moment);
    this.lastHighlightTime = Date.now();
    return moment;
  }
}
