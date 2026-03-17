/**
 * cocoro — Proximity Interaction System
 * アバター間の距離に応じたインタラクション
 * 
 * 反復101-110:
 * - 近づくとプロフィールプレビューが浮かぶ
 * - 2人が近いと「会話バブル」が生まれる
 * - 離れると自然にフェードアウト
 * = 空間的な「距離」がソーシャルインタラクションに直結
 */

export interface ProximityState {
  peerId: string;
  distance: number;
  isInRange: boolean;       // 5m以内
  isIntimate: boolean;      // 2m以内（PrivateBubble候補）
  isAdjacent: boolean;      // 1m以内（プロフィール表示）
  angle: number;            // 自分から見た角度（ラジアン）
}

const RANGE_THRESHOLD = 5;     // meters
const INTIMATE_THRESHOLD = 2;
const ADJACENT_THRESHOLD = 1;

export class ProximityInteractionSystem {
  private localPosition = { x: 0, z: 0 };
  private localRotation = 0;
  private proximityStates = new Map<string, ProximityState>();
  private callbacks: {
    onEnterRange?: (peerId: string) => void;
    onExitRange?: (peerId: string) => void;
    onEnterIntimate?: (peerId: string) => void;
    onExitIntimate?: (peerId: string) => void;
  } = {};

  /**
   * コールバックを設定
   */
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * ローカルプレイヤーの位置を更新
   */
  updateLocalPosition(x: number, z: number, rotationY: number): void {
    this.localPosition = { x, z };
    this.localRotation = rotationY;
  }

  /**
   * 他のアバターの位置を更新し、距離計算
   */
  updatePeerPosition(peerId: string, x: number, z: number): ProximityState {
    const dx = x - this.localPosition.x;
    const dz = z - this.localPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const prev = this.proximityStates.get(peerId);
    const isInRange = distance < RANGE_THRESHOLD;
    const isIntimate = distance < INTIMATE_THRESHOLD;
    const isAdjacent = distance < ADJACENT_THRESHOLD;

    // Trigger callbacks on state changes
    if (prev) {
      if (!prev.isInRange && isInRange) {
        this.callbacks.onEnterRange?.(peerId);
      } else if (prev.isInRange && !isInRange) {
        this.callbacks.onExitRange?.(peerId);
      }
      if (!prev.isIntimate && isIntimate) {
        this.callbacks.onEnterIntimate?.(peerId);
      } else if (prev.isIntimate && !isIntimate) {
        this.callbacks.onExitIntimate?.(peerId);
      }
    }

    const state: ProximityState = {
      peerId,
      distance,
      isInRange,
      isIntimate,
      isAdjacent,
      angle,
    };

    this.proximityStates.set(peerId, state);
    return state;
  }

  /**
   * 全ピアの距離データを返す
   */
  getAllStates(): ProximityState[] {
    return Array.from(this.proximityStates.values());
  }

  /**
   * 最も近いピアを返す
   */
  getClosestPeer(): ProximityState | null {
    let closest: ProximityState | null = null;
    for (const state of this.proximityStates.values()) {
      if (!closest || state.distance < closest.distance) {
        closest = state;
      }
    }
    return closest;
  }

  /**
   * PrivateBubble候補（intimate圏内のピアリスト）
   */
  getIntimatePeers(): string[] {
    return Array.from(this.proximityStates.values())
      .filter((s) => s.isIntimate)
      .map((s) => s.peerId);
  }

  /**
   * 特定ピアが視界前方にいるか
   */
  isPeerInFrontOf(peerId: string): boolean {
    const state = this.proximityStates.get(peerId);
    if (!state) return false;
    
    const angleDiff = Math.abs(state.angle - this.localRotation);
    const normalizedDiff = angleDiff > Math.PI ? 2 * Math.PI - angleDiff : angleDiff;
    return normalizedDiff < Math.PI / 3; // 60° field of view
  }

  /**
   * ピア削除（退出時）
   */
  removePeer(peerId: string): void {
    this.proximityStates.delete(peerId);
  }

  /**
   * リセット
   */
  clear(): void {
    this.proximityStates.clear();
  }
}
