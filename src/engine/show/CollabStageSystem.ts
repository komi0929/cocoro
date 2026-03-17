/**
 * kokoro — CollabStageSystem
 * 2-4人の発話者を**ステージ上**に配置する演出システム
 *
 * X Spacesから学ぶ: スピーカー/リスナーの明確な分離
 * VTuberから学ぶ: コラボ配信のレイアウト
 * kokoro独自: 3D空間でステージと客席を物理的に分離
 *
 * 機能:
 * 1. ステージ定員管理(2-4人)
 * 2. 挙手→承認でステージ入り
 * 3. ステージ配置レイアウト(対面/パネル/円形)
 * 4. ステージ交代(タイマー/手動)
 * 5. VIPスピーカー枠
 */

export type StageLayout = 'face_to_face' | 'panel' | 'circle' | 'interview' | 'debate';

export interface StageSlot {
  participantId: string;
  position: { x: number; y: number; z: number };
  role: 'host' | 'speaker' | 'guest';
  joinedAt: number;
}

export interface StageState {
  isActive: boolean;
  layout: StageLayout;
  maxSlots: number;
  slots: StageSlot[];
  waitingQueue: { participantId: string; requestedAt: number }[];
  audienceIds: string[];
  rotationIntervalMs: number;
  autoRotate: boolean;
}

const LAYOUT_POSITIONS: Record<StageLayout, { x: number; y: number; z: number }[]> = {
  face_to_face: [
    { x: -1.5, y: 0, z: 0 },
    { x: 1.5, y: 0, z: 0 },
  ],
  panel: [
    { x: -2, y: 0, z: -1 },
    { x: -0.7, y: 0, z: -1 },
    { x: 0.7, y: 0, z: -1 },
    { x: 2, y: 0, z: -1 },
  ],
  circle: [
    { x: 0, y: 0, z: -1.5 },
    { x: 1.3, y: 0, z: 0.75 },
    { x: -1.3, y: 0, z: 0.75 },
  ],
  interview: [
    { x: -1.2, y: 0, z: 0 },
    { x: 1.2, y: 0, z: 0 },
  ],
  debate: [
    { x: -2, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: -2 }, // moderator
  ],
};

export class CollabStageSystem {
  private state: StageState;
  private rotationTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = {
      isActive: false,
      layout: 'panel',
      maxSlots: 4,
      slots: [],
      waitingQueue: [],
      audienceIds: [],
      rotationIntervalMs: 300000, // 5 minutes
      autoRotate: false,
    };
  }

  /** ステージ開始 */
  activate(layout: StageLayout = 'panel', maxSlots = 4): void {
    this.state.isActive = true;
    this.state.layout = layout;
    this.state.maxSlots = Math.min(maxSlots, LAYOUT_POSITIONS[layout].length);

    if (this.state.autoRotate) {
      this.startRotation();
    }
  }

  /** ステージ終了 */
  deactivate(): void {
    this.state.isActive = false;
    this.state.slots = [];
    this.state.waitingQueue = [];
    if (this.rotationTimer) clearInterval(this.rotationTimer);
  }

  /** ステージに参加 */
  joinStage(participantId: string, role: StageSlot['role'] = 'speaker'): boolean {
    if (!this.state.isActive) return false;
    if (this.state.slots.length >= this.state.maxSlots) return false;
    if (this.state.slots.some(s => s.participantId === participantId)) return false;

    const positions = LAYOUT_POSITIONS[this.state.layout];
    const slotIndex = this.state.slots.length;
    if (slotIndex >= positions.length) return false;

    this.state.slots.push({
      participantId,
      position: { ...positions[slotIndex] },
      role,
      joinedAt: Date.now(),
    });

    // Remove from audience
    this.state.audienceIds = this.state.audienceIds.filter(id => id !== participantId);
    // Remove from queue
    this.state.waitingQueue = this.state.waitingQueue.filter(w => w.participantId !== participantId);

    return true;
  }

  /** ステージから降りる */
  leaveStage(participantId: string): boolean {
    const idx = this.state.slots.findIndex(s => s.participantId === participantId);
    if (idx === -1) return false;

    this.state.slots.splice(idx, 1);
    this.state.audienceIds.push(participantId);

    // Reposition remaining speakers
    this.repositionSlots();

    // Auto-promote from queue
    if (this.state.waitingQueue.length > 0) {
      const next = this.state.waitingQueue.shift()!;
      this.joinStage(next.participantId);
    }

    return true;
  }

  /** 挙手(ステージ参加リクエスト) */
  raiseHand(participantId: string): void {
    if (this.state.slots.some(s => s.participantId === participantId)) return;
    if (this.state.waitingQueue.some(w => w.participantId === participantId)) return;

    this.state.waitingQueue.push({ participantId, requestedAt: Date.now() });
  }

  /** 挙手承認(ホスト権限) */
  approveHandRaise(participantId: string): boolean {
    const idx = this.state.waitingQueue.findIndex(w => w.participantId === participantId);
    if (idx === -1) return false;

    this.state.waitingQueue.splice(idx, 1);
    return this.joinStage(participantId);
  }

  /** 観客を登録 */
  setAudience(audienceIds: string[]): void {
    const stageIds = new Set(this.state.slots.map(s => s.participantId));
    this.state.audienceIds = audienceIds.filter(id => !stageIds.has(id));
  }

  /** 自動ローテーション */
  setAutoRotate(enabled: boolean, intervalMs = 300000): void {
    this.state.autoRotate = enabled;
    this.state.rotationIntervalMs = intervalMs;
    if (enabled) this.startRotation();
    else if (this.rotationTimer) clearInterval(this.rotationTimer);
  }

  /** レイアウト変更 */
  setLayout(layout: StageLayout): void {
    this.state.layout = layout;
    this.state.maxSlots = LAYOUT_POSITIONS[layout].length;
    this.repositionSlots();
  }

  private repositionSlots(): void {
    const positions = LAYOUT_POSITIONS[this.state.layout];
    this.state.slots.forEach((slot, i) => {
      if (i < positions.length) {
        slot.position = { ...positions[i] };
      }
    });
  }

  private startRotation(): void {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    this.rotationTimer = setInterval(() => {
      if (this.state.waitingQueue.length > 0 && this.state.slots.length > 0) {
        // Remove oldest speaker
        const oldest = this.state.slots.reduce((a, b) => a.joinedAt < b.joinedAt ? a : b);
        this.leaveStage(oldest.participantId);
      }
    }, this.state.rotationIntervalMs);
  }

  getState(): StageState { return { ...this.state }; }
  isOnStage(participantId: string): boolean { return this.state.slots.some(s => s.participantId === participantId); }
  getQueuePosition(participantId: string): number { return this.state.waitingQueue.findIndex(w => w.participantId === participantId); }
}
