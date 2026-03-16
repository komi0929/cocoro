/**
 * kokoro — Phase State Machine
 * 空間の3フェーズ自動遷移エンジン
 * 
 * Phase 01 / 静寂 (Silence): 誰も喋っていない
 * Phase 02 / 発話 (Trigger): ひとりが声を出す
 * Phase 03 / 引力 (Gravity): 会話ラリーが始まる
 */

import { SpacePhase } from '@/types/kokoro';

export interface PhaseTransitionEvent {
  from: SpacePhase;
  to: SpacePhase;
  activeSpeakers: string[];
  density: number;
}

type PhaseListener = (event: PhaseTransitionEvent) => void;

export class PhaseStateMachine {
  private currentPhase: SpacePhase = SpacePhase.SILENCE;
  private activeSpeakers: Set<string> = new Set();
  private listeners: PhaseListener[] = [];

  // Timers for hysteresis (prevent flickering)
  private triggerToSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private triggerToGravityTimer: ReturnType<typeof setTimeout> | null = null;

  // Configuration
  private readonly SILENCE_DELAY_MS = 3000;     // 3秒誰も喋らないとSILENCEへ
  private readonly GRAVITY_TRIGGER_MS = 1500;    // 1.5秒会話が続けばGRAVITYへ
  private readonly MIN_SPEAKERS_FOR_GRAVITY = 2; // GRAVITY遷移に必要な最少話者数

  /**
   * 話者の発話状態を更新
   */
  updateSpeaker(speakerId: string, isSpeaking: boolean): void {
    if (isSpeaking) {
      this.activeSpeakers.add(speakerId);
    } else {
      this.activeSpeakers.delete(speakerId);
    }
    this.evaluate();
  }

  /**
   * フェーズ遷移の評価
   */
  private evaluate(): void {
    const speakerCount = this.activeSpeakers.size;

    switch (this.currentPhase) {
      case SpacePhase.SILENCE:
        if (speakerCount >= 1) {
          this.transition(SpacePhase.TRIGGER);
        }
        break;

      case SpacePhase.TRIGGER:
        if (speakerCount === 0) {
          // 誰もいなくなった → SILENCE への遅延遷移
          this.scheduleSilence();
        } else if (speakerCount >= this.MIN_SPEAKERS_FOR_GRAVITY) {
          // 2人以上が喋っている → GRAVITY への遅延遷移
          this.scheduleGravity();
        } else {
          // 1人だけ → タイマーをクリア
          this.clearTimers();
        }
        break;

      case SpacePhase.GRAVITY:
        if (speakerCount === 0) {
          this.scheduleSilence();
        } else if (speakerCount < this.MIN_SPEAKERS_FOR_GRAVITY) {
          // 話者が減った → TRIGGER に戻す
          this.transition(SpacePhase.TRIGGER);
        }
        break;
    }
  }

  /**
   * フェーズ遷移の実行
   */
  private transition(to: SpacePhase): void {
    if (this.currentPhase === to) return;
    this.clearTimers();

    const event: PhaseTransitionEvent = {
      from: this.currentPhase,
      to,
      activeSpeakers: Array.from(this.activeSpeakers),
      density: this.calculateDensity(),
    };

    this.currentPhase = to;
    this.listeners.forEach((fn) => fn(event));
  }

  /**
   * 密度パラメータの計算
   * アクティブスピーカー数と発話頻度に基づく 0-1 の値
   */
  private calculateDensity(): number {
    const speakerCount = this.activeSpeakers.size;
    // Simple density: normalized speaker count (max 8 considered full heat)
    return Math.min(1, speakerCount / 8);
  }

  /**
   * SILENCE への遅延遷移をスケジュール
   */
  private scheduleSilence(): void {
    if (this.triggerToSilenceTimer) return;
    this.triggerToSilenceTimer = setTimeout(() => {
      if (this.activeSpeakers.size === 0) {
        this.transition(SpacePhase.SILENCE);
      }
      this.triggerToSilenceTimer = null;
    }, this.SILENCE_DELAY_MS);
  }

  /**
   * GRAVITY への遅延遷移をスケジュール
   */
  private scheduleGravity(): void {
    if (this.triggerToGravityTimer) return;
    this.triggerToGravityTimer = setTimeout(() => {
      if (this.activeSpeakers.size >= this.MIN_SPEAKERS_FOR_GRAVITY) {
        this.transition(SpacePhase.GRAVITY);
      }
      this.triggerToGravityTimer = null;
    }, this.GRAVITY_TRIGGER_MS);
  }

  /**
   * タイマーをクリア
   */
  private clearTimers(): void {
    if (this.triggerToSilenceTimer) {
      clearTimeout(this.triggerToSilenceTimer);
      this.triggerToSilenceTimer = null;
    }
    if (this.triggerToGravityTimer) {
      clearTimeout(this.triggerToGravityTimer);
      this.triggerToGravityTimer = null;
    }
  }

  /**
   * 現在のフェーズを取得
   */
  getPhase(): SpacePhase {
    return this.currentPhase;
  }

  /**
   * アクティブスピーカーIDの配列を取得
   */
  getActiveSpeakers(): string[] {
    return Array.from(this.activeSpeakers);
  }

  /**
   * リスナーを登録
   */
  onTransition(listener: PhaseListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    this.clearTimers();
    this.listeners = [];
    this.activeSpeakers.clear();
  }
}
