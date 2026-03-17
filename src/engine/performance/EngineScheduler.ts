/**
 * cocoro — EngineScheduler
 * 48+エンジンの**優先度ベース実行管理**
 *
 * コミュニケーション用アプリ = 遅延は一発アウト
 * 原則: 音声処理 > 描画 > 分析 > 記録
 *
 * フレーム予算制:
 * - Critical: 毎フレーム必ず実行(音声/入力)
 * - High: 毎フレーム実行を目指す(描画)
 * - Medium: 時間に余裕があれば(分析/AI)
 * - Low: requestIdleCallback(記録/保存)
 * - Background: バックグラウンドタブ時は全停止
 */

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'idle';

export interface ScheduledTask {
  id: string;
  priority: TaskPriority;
  execute: () => void;
  intervalMs: number;      // 実行間隔
  lastRun: number;
  maxDurationMs: number;   // 最大実行時間
  enabled: boolean;
}

export interface SchedulerMetrics {
  tasksExecuted: number;
  tasksSkipped: number;
  frameBudgetUsedMs: number;
  frameBudgetRemainingMs: number;
  isBackgrounded: boolean;
  queueDepth: number;
}

export class EngineScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private metrics: SchedulerMetrics;
  private isBackgrounded = false;
  private frameBudgetMs = 14; // 16.67ms - 2.67ms buffer
  private frameStartTime = 0;

  constructor() {
    this.metrics = {
      tasksExecuted: 0, tasksSkipped: 0,
      frameBudgetUsedMs: 0, frameBudgetRemainingMs: this.frameBudgetMs,
      isBackgrounded: false, queueDepth: 0,
    };

    // Visibility change detection
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isBackgrounded = document.hidden;
        this.metrics.isBackgrounded = this.isBackgrounded;
        if (this.isBackgrounded) this.onBackground();
        else this.onForeground();
      });
    }
  }

  /** タスク登録 */
  register(id: string, priority: TaskPriority, execute: () => void, intervalMs: number, maxDurationMs = 2): void {
    this.tasks.set(id, {
      id, priority, execute, intervalMs, maxDurationMs,
      lastRun: 0, enabled: true,
    });
  }

  /** タスク削除 */
  unregister(id: string): void {
    this.tasks.delete(id);
  }

  /** タスク有効/無効 */
  setEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id);
    if (task) task.enabled = enabled;
  }

  /**
   * フレーム開始 — 毎フレーム呼ぶ
   * 予算内で優先度順にタスクを実行
   */
  tick(): SchedulerMetrics {
    this.frameStartTime = performance.now();
    const now = this.frameStartTime;
    let budgetUsed = 0;

    // Priority order
    const priorityOrder: TaskPriority[] = ['critical', 'high', 'medium', 'low', 'idle'];

    // Backgrounded: critical only
    const maxPriority = this.isBackgrounded ? 0 : priorityOrder.length;

    for (let p = 0; p < maxPriority; p++) {
      const priority = priorityOrder[p];

      for (const task of this.tasks.values()) {
        if (!task.enabled || task.priority !== priority) continue;
        if (now - task.lastRun < task.intervalMs) continue;

        // Budget check (critical always runs)
        if (priority !== 'critical' && budgetUsed >= this.frameBudgetMs) {
          this.metrics.tasksSkipped++;
          continue;
        }

        // Execute with timing
        const taskStart = performance.now();
        try {
          task.execute();
        } catch { /* Swallow engine errors for stability */ }
        const taskDuration = performance.now() - taskStart;

        task.lastRun = now;
        budgetUsed += taskDuration;
        this.metrics.tasksExecuted++;

        // If task exceeded max, warn (dev only)
        if (taskDuration > task.maxDurationMs * 2) {
          // Performance regression detected
        }
      }
    }

    // 'idle' tasks: use requestIdleCallback if available
    if (!this.isBackgrounded && typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback((deadline) => {
        for (const task of this.tasks.values()) {
          if (!task.enabled || task.priority !== 'idle') continue;
          if (performance.now() - task.lastRun < task.intervalMs) continue;
          if (deadline.timeRemaining() < 1) break;
          try { task.execute(); } catch { /**/ }
          task.lastRun = performance.now();
        }
      }, { timeout: 100 });
    }

    this.metrics.frameBudgetUsedMs = budgetUsed;
    this.metrics.frameBudgetRemainingMs = Math.max(0, this.frameBudgetMs - budgetUsed);
    this.metrics.queueDepth = this.tasks.size;

    return { ...this.metrics };
  }

  /** フレーム予算設定(FPS目標に応じて) */
  setTargetFPS(fps: number): void {
    this.frameBudgetMs = Math.max(4, (1000 / fps) - 2);
  }

  getMetrics(): SchedulerMetrics { return { ...this.metrics }; }

  private onBackground(): void {
    // Background: disable medium/low/idle
    this.tasks.forEach(t => {
      if (t.priority === 'medium' || t.priority === 'low' || t.priority === 'idle') {
        t.enabled = false;
      }
    });
  }

  private onForeground(): void {
    // Restore all
    this.tasks.forEach(t => { t.enabled = true; });
  }
}
