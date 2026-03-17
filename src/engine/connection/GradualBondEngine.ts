/**
 * kokoro — GradualBondEngine
 * 自然な関係漸進 — 時間と共有体験で**静かに**関係が深まる
 *
 * 設計思想:
 * - ポイント表示なし、ランキングなし、比較なし
 * - 変化は本人にのみ、穏やかに通知
 * - 「久しぶり」の再会が自然に嬉しい
 * - 関係は**決して失われない**(減衰はしても消えない)
 *
 * ❌ 禁止: 親密度スコア表示 / 「○○さんがあなたを追い越しました」
 */

export type BondStage =
  | 'first_meeting'    // 初めまして
  | 'recognized'       // 顔見知り
  | 'talk_buddy'       // 話し仲間
  | 'kindred_spirit'   // 気が合う仲間
  | 'comfortable'      // 心地いい人

export interface BondRecord {
  participantId: string;
  displayName: string;
  stage: BondStage;
  // Internal only (外部に見せない)
  sharedMinutes: number;
  sharedSessions: number;
  sharedLaughs: number;       // 笑い(同時笑い≒共感)
  sharedSilences: number;     // 共有した心地よい沈黙
  lastMet: number;
  firstMet: number;
}

export interface BondNotification {
  type: 'stage_up' | 'reunion' | 'milestone';
  message: string;
  warmth: number; // 0-1 (暖色度合い)
  sound: 'gentle_chime' | 'warm_glow' | 'soft_bell';
}

const STAGE_THRESHOLDS: Record<BondStage, number> = {
  first_meeting: 0,
  recognized: 15,        // 15分会話
  talk_buddy: 60,        // 1時間
  kindred_spirit: 180,   // 3時間
  comfortable: 600,      // 10時間
};

const STAGE_LABELS: Record<BondStage, string> = {
  first_meeting: '初めまして',
  recognized: '顔見知り',
  talk_buddy: '話し仲間',
  kindred_spirit: '気が合う仲間',
  comfortable: '心地いい人',
};

export class GradualBondEngine {
  private bonds: Map<string, BondRecord> = new Map();
  private listeners: Array<(notification: BondNotification) => void> = [];
  private readonly STORAGE_KEY = 'kokoro_bonds';

  constructor() {
    this.loadBonds();
  }

  /** 会話時間を静かに記録 */
  recordSharedTime(participantId: string, minutes: number, displayName?: string): void {
    const bond = this.getOrCreate(participantId);
    if (displayName) bond.displayName = displayName;
    bond.sharedMinutes += minutes;
    bond.lastMet = Date.now();

    // ステージアップのチェック(穏やかに)
    const newStage = this.determineStage(bond.sharedMinutes);
    if (newStage !== bond.stage && this.stageIndex(newStage) > this.stageIndex(bond.stage)) {
      bond.stage = newStage;
      this.notify({
        type: 'stage_up',
        message: `${bond.displayName}さんとの関係が「${STAGE_LABELS[newStage]}」に 🌱`,
        warmth: this.stageIndex(newStage) / 4,
        sound: 'gentle_chime',
      });
    }

    this.bonds.set(participantId, bond);
    this.saveBonds();
  }

  /** セッション共有を記録 */
  recordSharedSession(participantId: string): void {
    const bond = this.getOrCreate(participantId);
    bond.sharedSessions++;
    this.bonds.set(participantId, bond);
  }

  /** 同時笑いを記録(共感指標) */
  recordSharedLaugh(participantId: string): void {
    const bond = this.getOrCreate(participantId);
    bond.sharedLaughs++;
    this.bonds.set(participantId, bond);
  }

  /** 共有沈黙を記録(気まずくない沈黙=深い関係) */
  recordSharedSilence(participantId: string): void {
    const bond = this.getOrCreate(participantId);
    bond.sharedSilences++;
    this.bonds.set(participantId, bond);
  }

  /**
   * 再会チェック — 久しぶりの人がいたら暖かく通知
   */
  checkReunion(participantId: string): BondNotification | null {
    const bond = this.bonds.get(participantId);
    if (!bond) return null;

    const daysSinceLastMet = (Date.now() - bond.lastMet) / 86400000;

    if (daysSinceLastMet >= 7 && this.stageIndex(bond.stage) >= 1) {
      const msg = daysSinceLastMet >= 30
        ? `${bond.displayName}さん、久しぶり！ 🌸`
        : `${bond.displayName}さん、おかえり ☺️`;

      return {
        type: 'reunion',
        message: msg,
        warmth: Math.min(1, daysSinceLastMet / 30),
        sound: 'warm_glow',
      };
    }

    return null;
  }

  /** 全ての絆を取得(ステージ順、本人用) */
  getAllBonds(): BondRecord[] {
    return Array.from(this.bonds.values())
      .sort((a, b) => this.stageIndex(b.stage) - this.stageIndex(a.stage));
  }

  /** 特定の絆を取得 */
  getBond(participantId: string): BondRecord | null {
    return this.bonds.get(participantId) ?? null;
  }

  /** 通知リスナー */
  onNotification(fn: (n: BondNotification) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  // ========== Private ==========

  private determineStage(minutes: number): BondStage {
    if (minutes >= STAGE_THRESHOLDS.comfortable) return 'comfortable';
    if (minutes >= STAGE_THRESHOLDS.kindred_spirit) return 'kindred_spirit';
    if (minutes >= STAGE_THRESHOLDS.talk_buddy) return 'talk_buddy';
    if (minutes >= STAGE_THRESHOLDS.recognized) return 'recognized';
    return 'first_meeting';
  }

  private stageIndex(stage: BondStage): number {
    const stages: BondStage[] = ['first_meeting', 'recognized', 'talk_buddy', 'kindred_spirit', 'comfortable'];
    return stages.indexOf(stage);
  }

  private notify(n: BondNotification): void {
    for (const fn of this.listeners) fn(n);
  }

  private getOrCreate(participantId: string): BondRecord {
    if (!this.bonds.has(participantId)) {
      this.bonds.set(participantId, {
        participantId,
        displayName: participantId.slice(0, 8),
        stage: 'first_meeting',
        sharedMinutes: 0,
        sharedSessions: 0,
        sharedLaughs: 0,
        sharedSilences: 0,
        lastMet: Date.now(),
        firstMet: Date.now(),
      });
    }
    return this.bonds.get(participantId)!;
  }

  private loadBonds(): void {
    try {
      const d = localStorage.getItem(this.STORAGE_KEY);
      if (d) {
        const saved = JSON.parse(d) as BondRecord[];
        saved.forEach(b => this.bonds.set(b.participantId, b));
      }
    } catch { /* */ }
  }

  private saveBonds(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.bonds.values())));
    } catch { /* */ }
  }
}
