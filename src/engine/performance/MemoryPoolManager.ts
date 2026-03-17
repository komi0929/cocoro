/**
 * cocoro — MemoryPoolManager + FrameBudgetController
 * メモリプール + フレーム予算制御
 *
 * コミュニケーション = GCスパイクによるカクつき = 信頼喪失
 * - TypedArrayプールで音声バッファ再利用
 * - GC頻度を大幅削減
 * - メモリ使用量監視 + 自動縮退
 */

// ========================================
// 1. MemoryPoolManager
// ========================================

export interface PoolStats {
  totalAllocated: number;
  inUse: number;
  available: number;
  hitRate: number;         // プールヒット率
  totalRequests: number;
  gcPrevented: number;     // GC回避回数
  memoryEstimateMB: number;
}

export class MemoryPoolManager {
  // Float32Array pools (for audio processing)
  private float32Pools: Map<number, Float32Array[]> = new Map();
  // Generic object pool
  private objectPools: Map<string, unknown[]> = new Map();

  private stats: PoolStats = {
    totalAllocated: 0, inUse: 0, available: 0,
    hitRate: 0, totalRequests: 0, gcPrevented: 0,
    memoryEstimateMB: 0,
  };
  private hits = 0;

  /** Float32Array取得(音声バッファ向け) */
  acquireFloat32(size: number): Float32Array {
    this.stats.totalRequests++;
    const pool = this.float32Pools.get(size);

    if (pool && pool.length > 0) {
      this.hits++;
      this.stats.gcPrevented++;
      const buf = pool.pop()!;
      buf.fill(0);
      this.updateHitRate();
      return buf;
    }

    // New allocation
    this.stats.totalAllocated++;
    this.updateHitRate();
    return new Float32Array(size);
  }

  /** Float32Array返却(再利用のため) */
  releaseFloat32(buffer: Float32Array): void {
    const size = buffer.length;
    if (!this.float32Pools.has(size)) this.float32Pools.set(size, []);
    const pool = this.float32Pools.get(size)!;

    // Pool size limit (memory leak prevention)
    if (pool.length < 20) {
      pool.push(buffer);
    }
  }

  /** 汎用オブジェクトプール */
  acquireObject<T>(type: string, factory: () => T): T {
    this.stats.totalRequests++;
    const pool = this.objectPools.get(type);

    if (pool && pool.length > 0) {
      this.hits++;
      this.stats.gcPrevented++;
      this.updateHitRate();
      return pool.pop() as T;
    }

    this.stats.totalAllocated++;
    this.updateHitRate();
    return factory();
  }

  /** 汎用オブジェクト返却 */
  releaseObject(type: string, obj: unknown): void {
    if (!this.objectPools.has(type)) this.objectPools.set(type, []);
    const pool = this.objectPools.get(type)!;
    if (pool.length < 50) pool.push(obj);
  }

  /** メモリ使用量チェック + 自動縮退 */
  checkMemoryPressure(): boolean {
    // performance.memory (Chrome only)
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
    if (perf.memory) {
      const usedMB = perf.memory.usedJSHeapSize / 1048576;
      const limitMB = perf.memory.jsHeapSizeLimit / 1048576;
      this.stats.memoryEstimateMB = Math.round(usedMB);

      // 80%以上使用 → プール縮小
      if (usedMB / limitMB > 0.8) {
        this.shrinkPools();
        return true; // memory pressure
      }
    }
    return false;
  }

  /** プール縮小(メモリ圧迫時) */
  shrinkPools(): void {
    this.float32Pools.forEach(pool => {
      while (pool.length > 5) pool.pop();
    });
    this.objectPools.forEach(pool => {
      while (pool.length > 10) pool.pop();
    });
  }

  getStats(): PoolStats {
    this.stats.available = 0;
    this.float32Pools.forEach(p => { this.stats.available += p.length; });
    this.objectPools.forEach(p => { this.stats.available += p.length; });
    return { ...this.stats };
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? this.hits / this.stats.totalRequests
      : 0;
  }
}

// ========================================
// 2. FrameBudgetController
// ========================================

export interface BudgetAllocation {
  audio: number;     // ms
  render: number;    // ms
  engine: number;    // ms
  network: number;   // ms
  buffer: number;    // ms (余裕)
}

export interface FrameReport {
  totalMs: number;
  audioMs: number;
  renderMs: number;
  engineMs: number;
  networkMs: number;
  isOverBudget: boolean;
  jankDetected: boolean;
  fps: number;
}

export class FrameBudgetController {
  private targetFPS = 60;
  private budget: BudgetAllocation;
  private currentPhase: keyof BudgetAllocation = 'buffer';
  private phaseStart = 0;
  private frameStart = 0;
  private report: FrameReport;
  private jankThreshold = 33; // 2フレーム分以上 = jank
  private jankCount = 0;
  private frameCount = 0;

  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    const total = 1000 / targetFPS;
    this.budget = {
      audio: total * 0.25,     // 25%
      render: total * 0.45,    // 45%
      engine: total * 0.2,     // 20%
      network: total * 0.05,   // 5%
      buffer: total * 0.05,    // 5% buffer
    };
    this.report = this.createEmptyReport();
  }

  /** フレーム開始 */
  beginFrame(): void {
    this.frameStart = performance.now();
    this.report = this.createEmptyReport();
  }

  /** フェーズ開始 */
  beginPhase(phase: keyof BudgetAllocation): void {
    this.currentPhase = phase;
    this.phaseStart = performance.now();
  }

  /** フェーズ終了 → 予算チェック */
  endPhase(phase: keyof BudgetAllocation): boolean {
    const elapsed = performance.now() - this.phaseStart;
    const key = `${phase}Ms` as keyof FrameReport;
    (this.report as unknown as Record<string, number>)[key] = elapsed;

    // 予算超過？
    return elapsed > this.budget[phase];
  }

  /** フレーム終了 → レポート生成 */
  endFrame(): FrameReport {
    const totalMs = performance.now() - this.frameStart;
    this.report.totalMs = totalMs;
    this.report.fps = totalMs > 0 ? 1000 / totalMs : this.targetFPS;
    this.report.isOverBudget = totalMs > 1000 / this.targetFPS;
    this.report.jankDetected = totalMs > this.jankThreshold;

    if (this.report.jankDetected) this.jankCount++;
    this.frameCount++;

    return { ...this.report };
  }

  /** 残り予算確認 */
  getRemainingBudget(): number {
    return Math.max(0, (1000 / this.targetFPS) - (performance.now() - this.frameStart));
  }

  /** 特定フェーズの余裕確認 */
  canExecuteInPhase(phase: keyof BudgetAllocation, estimatedMs: number): boolean {
    const elapsed = performance.now() - this.phaseStart;
    return (elapsed + estimatedMs) <= this.budget[phase];
  }

  /** Jank率 */
  getJankRate(): number {
    return this.frameCount > 0 ? this.jankCount / this.frameCount : 0;
  }

  /** ターゲットFPS変更 */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    const total = 1000 / fps;
    this.budget = {
      audio: total * 0.25,
      render: total * 0.45,
      engine: total * 0.2,
      network: total * 0.05,
      buffer: total * 0.05,
    };
  }

  private createEmptyReport(): FrameReport {
    return { totalMs: 0, audioMs: 0, renderMs: 0, engineMs: 0, networkMs: 0, isOverBudget: false, jankDetected: false, fps: this.targetFPS };
  }
}
