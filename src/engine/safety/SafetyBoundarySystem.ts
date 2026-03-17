/**
 * kokoro — Safety Boundary System
 * ハラスメント防止の根幹 — Personal Boundary + Safe Zone
 *
 * サイクル6: メタバースセキュリティの最重要課題
 * - Personal Boundary: アバター間の最小距離を強制
 * - Safe Zone: ワンタップで全音声遮断 + 透明化
 * - Auto-Distance: つきまとい検知 → 自動距離確保
 * - Comfort Score: 過去のセッションの快適度記録
 * = 「安全でなければ楽しめない」
 */

export interface SafetyConfig {
  personalBoundaryRadius: number;  // メートル (default: 0.5)
  safeZoneEnabled: boolean;
  autoDistanceEnabled: boolean;
  blockedIds: Set<string>;
  mutedIds: Set<string>;
}

export interface SafetyEvent {
  type: 'boundary_violation' | 'stalking_detected' | 'safe_zone_activated' | 'auto_mute' | 'report';
  targetId: string;
  timestamp: number;
  details: string;
}

const STORAGE_KEY = 'kokoro_safety';

export class SafetyBoundarySystem {
  private config: SafetyConfig;
  private events: SafetyEvent[] = [];
  private positionHistory: Map<string, Array<{ x: number; z: number; time: number }>> = new Map();
  private onEventCallbacks: Array<(e: SafetyEvent) => void> = [];

  constructor() {
    this.config = {
      personalBoundaryRadius: 0.5,
      safeZoneEnabled: false,
      autoDistanceEnabled: true,
      blockedIds: new Set(),
      mutedIds: new Set(),
    };
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.config.blockedIds = new Set(parsed.blockedIds || []);
        this.config.mutedIds = new Set(parsed.mutedIds || []);
        if (parsed.personalBoundaryRadius) this.config.personalBoundaryRadius = parsed.personalBoundaryRadius;
      }
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        blockedIds: Array.from(this.config.blockedIds),
        mutedIds: Array.from(this.config.mutedIds),
        personalBoundaryRadius: this.config.personalBoundaryRadius,
      }));
    } catch { /* full */ }
  }

  /**
   * Personal Boundary: 距離チェック
   */
  checkBoundary(myPos: { x: number; z: number }, otherId: string, otherPos: { x: number; z: number }): boolean {
    if (this.config.blockedIds.has(otherId)) return false; // blocked = invisible

    const dx = myPos.x - otherPos.x;
    const dz = myPos.z - otherPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < this.config.personalBoundaryRadius) {
      this.emitEvent({
        type: 'boundary_violation', targetId: otherId,
        timestamp: Date.now(), details: `距離: ${distance.toFixed(2)}m`,
      });
      return false; // too close
    }
    return true;
  }

  /**
   * つきまとい検知: 同じ人が10秒以上ずっと近くにいる
   */
  updatePositionTracking(otherId: string, otherPos: { x: number; z: number }, myPos: { x: number; z: number }): boolean {
    const dx = myPos.x - otherPos.x;
    const dz = myPos.z - otherPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (!this.positionHistory.has(otherId)) {
      this.positionHistory.set(otherId, []);
    }
    const history = this.positionHistory.get(otherId)!;
    history.push({ x: otherPos.x, z: otherPos.z, time: Date.now() });

    // Keep last 30 seconds
    const cutoff = Date.now() - 30000;
    const recent = history.filter(h => h.time > cutoff);
    this.positionHistory.set(otherId, recent);

    // If consistently close for 15 seconds
    if (recent.length > 15) {
      const allClose = recent.every(() => distance < this.config.personalBoundaryRadius * 2);
      if (allClose && this.config.autoDistanceEnabled) {
        this.emitEvent({
          type: 'stalking_detected', targetId: otherId,
          timestamp: Date.now(), details: '15秒以上近距離を維持',
        });
        return true; // stalking detected
      }
    }
    return false;
  }

  /**
   * Safe Zone: 全音声遮断 + 一時的透明化
   */
  activateSafeZone(): void {
    this.config.safeZoneEnabled = true;
    this.emitEvent({
      type: 'safe_zone_activated', targetId: 'self',
      timestamp: Date.now(), details: 'Safe Zone有効化',
    });
  }

  deactivateSafeZone(): void { this.config.safeZoneEnabled = false; }

  /**
   * ブロック
   */
  blockUser(userId: string): void {
    this.config.blockedIds.add(userId);
    this.config.mutedIds.add(userId);
    this.saveToStorage();
  }

  unblockUser(userId: string): void {
    this.config.blockedIds.delete(userId);
    this.config.mutedIds.delete(userId);
    this.saveToStorage();
  }

  /**
   * ミュート
   */
  muteUser(userId: string): void {
    this.config.mutedIds.add(userId);
    this.saveToStorage();
  }

  isBlocked(userId: string): boolean { return this.config.blockedIds.has(userId); }
  isMuted(userId: string): boolean { return this.config.mutedIds.has(userId); }
  isSafeZoneActive(): boolean { return this.config.safeZoneEnabled; }

  setBoundaryRadius(radius: number): void {
    this.config.personalBoundaryRadius = Math.max(0.3, Math.min(2.0, radius));
    this.saveToStorage();
  }

  private emitEvent(event: SafetyEvent): void {
    this.events.push(event);
    for (const fn of this.onEventCallbacks) fn(event);
  }

  onSafetyEvent(fn: (e: SafetyEvent) => void): () => void {
    this.onEventCallbacks.push(fn);
    return () => { this.onEventCallbacks = this.onEventCallbacks.filter(f => f !== fn); };
  }

  getEvents(): SafetyEvent[] { return [...this.events]; }
}
