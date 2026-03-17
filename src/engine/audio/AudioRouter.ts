/**
 * cocoro — Audio Router (SFU Logic)
 * 上位N人のみ音声転送 — 帯域とCPU節約
 *
 * サイクル4: SFU(Selective Forwarding Unit)ロジック
 * - 16人の部屋でも、受信するのは声が大きい上位3人のみ
 * - 残りは「話していない」として帯域を使わない
 * - 話者が切り替わると即座にルーティング更新
 * - CPU負荷: 16人全員のデコード → 3人だけ
 */

export interface AudioSource {
  participantId: string;
  volume: number;
  isSpeaking: boolean;
  lastSpokeAt: number;
  priority: number;   // 0=最高, higher=lower
}

export interface RoutingDecision {
  activeSourceIds: string[];
  mutedSourceIds: string[];
  totalSources: number;
  bandwidthSavedPercent: number;
}

export class AudioRouter {
  private sources: Map<string, AudioSource> = new Map();
  private maxActiveSources = 3;
  private hysteresisMs = 500; // チャタリング防止

  constructor(maxActive: number = 3) {
    this.maxActiveSources = maxActive;
  }

  /**
   * 音声ソースを更新
   */
  updateSource(participantId: string, volume: number, isSpeaking: boolean): void {
    const existing = this.sources.get(participantId);
    this.sources.set(participantId, {
      participantId, volume, isSpeaking,
      lastSpokeAt: isSpeaking ? Date.now() : (existing?.lastSpokeAt ?? 0),
      priority: existing?.priority ?? 999,
    });
  }

  /**
   * ルーティング決定: 上位N人を選別
   */
  computeRouting(): RoutingDecision {
    const now = Date.now();
    const allSources = Array.from(this.sources.values());

    // Score: 現在の音量 + 最近話した人にボーナス
    const scored = allSources.map(s => {
      const recencyBonus = s.isSpeaking ? 1.0 :
        Math.max(0, 1 - (now - s.lastSpokeAt) / (this.hysteresisMs * 4));
      return {
        ...s,
        score: s.volume + recencyBonus * 0.5,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Top N are active
    const active = scored.slice(0, this.maxActiveSources);
    const muted = scored.slice(this.maxActiveSources);

    // Update priorities
    active.forEach((s, i) => {
      const src = this.sources.get(s.participantId);
      if (src) src.priority = i;
    });

    const total = allSources.length;
    const savedPercent = total > 0 ? Math.round((muted.length / total) * 100) : 0;

    return {
      activeSourceIds: active.map(s => s.participantId),
      mutedSourceIds: muted.map(s => s.participantId),
      totalSources: total,
      bandwidthSavedPercent: savedPercent,
    };
  }

  removeSource(participantId: string): void {
    this.sources.delete(participantId);
  }

  setMaxActive(n: number): void {
    this.maxActiveSources = Math.max(1, Math.min(8, n));
  }

  getMaxActive(): number { return this.maxActiveSources; }
}
