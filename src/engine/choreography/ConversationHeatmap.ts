/**
 * cocoro — Conversation Heatmap
 * 会話の「熱量」をフロアにヒートマップとして可視化
 * 
 * 反復61-70: 誰がどこで声を出したかがフロアの色で残る
 * = 「会話の足跡」がリアルタイムで空間に刻まれる
 * = セッション後に「どこが一番盛り上がったか」が一目でわかる
 */

export interface HeatSpot {
  x: number;
  z: number;
  energy: number;
  timestamp: number;
  peakEnergy: number;
}

const MAX_SPOTS = 16;
const DECAY_RATE = 0.005; // energy/frame

export class ConversationHeatmap {
  private spots: HeatSpot[] = [];
  private sessionHeatHistory: { x: number; z: number; energy: number; time: number }[] = [];

  /**
   * 話者の位置に熱を追加
   */
  addHeat(x: number, z: number, energy: number): void {
    // Find existing nearby spot
    const mergeRadius = 1.5;
    const existing = this.spots.find(
      (s) => Math.sqrt((s.x - x) ** 2 + (s.z - z) ** 2) < mergeRadius
    );

    if (existing) {
      // Merge
      existing.energy = Math.min(1, existing.energy + energy * 0.3);
      existing.peakEnergy = Math.max(existing.peakEnergy, existing.energy);
      existing.timestamp = Date.now();
    } else if (this.spots.length < MAX_SPOTS) {
      // New spot
      this.spots.push({
        x, z,
        energy: Math.min(1, energy),
        timestamp: Date.now(),
        peakEnergy: energy,
      });
    } else {
      // Replace lowest energy spot
      const lowest = this.spots.reduce((min, s) => (s.energy < min.energy ? s : min));
      lowest.x = x;
      lowest.z = z;
      lowest.energy = Math.min(1, energy);
      lowest.timestamp = Date.now();
      lowest.peakEnergy = energy;
    }

    // Record for session history
    this.sessionHeatHistory.push({ x, z, energy, time: Date.now() });
  }

  /**
   * フレーム更新: エネルギーの減衰
   */
  update(): void {
    for (const spot of this.spots) {
      spot.energy = Math.max(0, spot.energy - DECAY_RATE);
    }
    // Remove dead spots
    this.spots = this.spots.filter((s) => s.energy > 0.01);
  }

  /**
   * シェーダー用のヒートスポットデータを返す (VoiceReactiveFloor用)
   * Format: [x, z, energy] × 16
   */
  getShaderData(): { spots: Float32Array; count: number } {
    const data = new Float32Array(MAX_SPOTS * 3);
    const count = Math.min(this.spots.length, MAX_SPOTS);

    for (let i = 0; i < count; i++) {
      const s = this.spots[i];
      data[i * 3] = s.x;
      data[i * 3 + 1] = s.z;
      data[i * 3 + 2] = s.energy;
    }

    return { spots: data, count };
  }

  /**
   * セッション全体のヒートマップデータ（振り返り用）
   */
  getSessionHeatmap(): { center: { x: number; z: number }; totalEnergy: number } {
    if (this.sessionHeatHistory.length === 0) {
      return { center: { x: 0, z: 0 }, totalEnergy: 0 };
    }

    let totalX = 0, totalZ = 0, totalEnergy = 0;
    for (const h of this.sessionHeatHistory) {
      totalX += h.x * h.energy;
      totalZ += h.z * h.energy;
      totalEnergy += h.energy;
    }

    return {
      center: {
        x: totalEnergy > 0 ? totalX / totalEnergy : 0,
        z: totalEnergy > 0 ? totalZ / totalEnergy : 0,
      },
      totalEnergy,
    };
  }

  /**
   * 現在のアクティブスポット数
   */
  getActiveSpotCount(): number {
    return this.spots.length;
  }
}
