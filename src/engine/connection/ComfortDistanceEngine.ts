/**
 * cocoro — ComfortDistanceEngine
 * 安心距離感制御 — パーソナルスペースの概念を3D空間に実装
 *
 * 設計思想: 「近すぎず、遠すぎず、ちょうどいい距離感」
 * - 初対面は自然に広い距離
 * - 関係が深まると自然に近くなる
 * - ユーザーが自分の心地よい距離を選べる
 * - 無理に近づけない安心感
 *
 * ❌ 禁止: 強制的な距離操作、プレッシャーを与える演出
 */

export type ComfortZone = 'close' | 'normal' | 'distant' | 'observing';

export interface DistanceProfile {
  participantId: string;
  preferredZone: ComfortZone;
  currentDistance: number;        // 3D world units
  comfortRadius: number;          // 心地よいと感じる半径
  isApproachable: boolean;        // 今話しかけられてOK？
  approachHistory: number[];      // 直近の接近回数
}

export interface ProximityEvent {
  type: 'approach' | 'retreat' | 'comfortable' | 'too_close';
  fromId: string;
  toId: string;
  distance: number;
  timestamp: number;
}

const ZONE_RADII: Record<ComfortZone, { min: number; ideal: number; max: number }> = {
  close:     { min: 0.3, ideal: 0.8, max: 1.5 },
  normal:    { min: 1.0, ideal: 2.0, max: 3.5 },
  distant:   { min: 2.5, ideal: 4.0, max: 6.0 },
  observing: { min: 5.0, ideal: 8.0, max: 15.0 },
};

export class ComfortDistanceEngine {
  private profiles: Map<string, DistanceProfile> = new Map();
  private eventLog: ProximityEvent[] = [];
  private relationshipLevel: Map<string, number> = new Map(); // 0-1 how well they know each other

  /** ユーザーの好み設定 */
  setPreferredZone(participantId: string, zone: ComfortZone): void {
    const profile = this.getOrCreate(participantId);
    profile.preferredZone = zone;
    profile.comfortRadius = ZONE_RADII[zone].ideal;
  }

  /** 話しかけOK状態の切り替え */
  setApproachable(participantId: string, approachable: boolean): void {
    const profile = this.getOrCreate(participantId);
    profile.isApproachable = approachable;
  }

  /**
   * 2者間の**推奨距離**を計算
   * 関係性の深さで自然に近づく
   */
  getRecommendedDistance(fromId: string, toId: string): number {
    const fromProfile = this.getOrCreate(fromId);
    const toProfile = this.getOrCreate(toId);

    // 両者のゾーンの広い方を尊重(安心保証)
    const fromZone = ZONE_RADII[fromProfile.preferredZone];
    const toZone = ZONE_RADII[toProfile.preferredZone];
    const baseDistance = Math.max(fromZone.ideal, toZone.ideal);

    // 関係の深さで自然に近づく(最大50%まで)
    const relationKey = [fromId, toId].sort().join('_');
    const relationship = this.relationshipLevel.get(relationKey) ?? 0;
    const closeness = relationship * 0.5; // 50% max reduction

    return baseDistance * (1 - closeness);
  }

  /**
   * 距離更新: 近づきすぎチェック
   * 返り値: 空間に反映すべきアバター調整
   */
  updateDistance(fromId: string, toId: string, actualDistance: number): ProximityEvent | null {
    const fromProfile = this.getOrCreate(fromId);
    const toProfile = this.getOrCreate(toId);
    const recommended = this.getRecommendedDistance(fromId, toId);

    fromProfile.currentDistance = actualDistance;

    // 相手のmin以下に入った場合 → 穏やかなバウンダリ通知
    const toMin = ZONE_RADII[toProfile.preferredZone].min;
    if (actualDistance < toMin && toProfile.isApproachable === false) {
      const event: ProximityEvent = {
        type: 'too_close', fromId, toId,
        distance: actualDistance, timestamp: Date.now(),
      };
      this.eventLog.push(event);
      return event;
    }

    // 快適範囲内
    if (Math.abs(actualDistance - recommended) < recommended * 0.3) {
      return { type: 'comfortable', fromId, toId, distance: actualDistance, timestamp: Date.now() };
    }

    return null;
  }

  /** 関係の深さを更新(PersistentMemoryと連携) */
  updateRelationship(id1: string, id2: string, level: number): void {
    const key = [id1, id2].sort().join('_');
    this.relationshipLevel.set(key, Math.max(0, Math.min(1, level)));
  }

  getProfile(participantId: string): DistanceProfile {
    return { ...this.getOrCreate(participantId) };
  }

  private getOrCreate(participantId: string): DistanceProfile {
    if (!this.profiles.has(participantId)) {
      this.profiles.set(participantId, {
        participantId,
        preferredZone: 'normal',
        currentDistance: ZONE_RADII.normal.ideal,
        comfortRadius: ZONE_RADII.normal.ideal,
        isApproachable: true,
        approachHistory: [],
      });
    }
    return this.profiles.get(participantId)!;
  }
}
