/**
 * cocoro — Performance Monitor
 * FPS/フレーム時間/メモリをリアルタイム表示
 * 
 * Executioner条件5: 60FPS維持を証明する
 */
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface PerfMetrics {
  fps: number;
  frameTime: number; // ms
  memory: number; // MB (if available)
  gpuTime: number; // ms estimate
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerfMetrics>({
    fps: 0, frameTime: 0, memory: 0, gpuTime: 0,
  });
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const rafRef = useRef(0);

  const measure = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > 60) frameTimesRef.current.shift();

    framesRef.current++;

    // Update every 500ms
    if (framesRef.current >= 30) {
      const avgFrameTime =
        frameTimesRef.current.reduce((a, b) => a + b, 0) /
        frameTimesRef.current.length;

      const fps = Math.round(1000 / avgFrameTime);

      // Memory (Chrome only)
      const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const memory = perfMemory
        ? Math.round(perfMemory.usedJSHeapSize / 1048576)
        : 0;

      setMetrics({
        fps,
        frameTime: Math.round(avgFrameTime * 10) / 10,
        memory,
        gpuTime: 0, // no direct GPU timing API in WebGL
      });

      framesRef.current = 0;
    }

    lastTimeRef.current = now;
    rafRef.current = requestAnimationFrame(measure);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafRef.current);
  }, [measure]);

  return metrics;
}

/** Debug overlay for performance stats */
export function PerformanceOverlay({ visible = false }: { visible?: boolean }) {
  const metrics = usePerformanceMonitor();

  if (!visible) return null;

  const fpsColor =
    metrics.fps >= 55 ? '#4ade80' : // green
    metrics.fps >= 30 ? '#fbbf24' : // yellow
    '#ef4444'; // red

  return (
    <div
      className="fixed top-2 right-2 z-200 pointer-events-none
        font-mono text-[10px] leading-tight
        bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5
        border border-white/10"
    >
      <div style={{ color: fpsColor }}>
        {metrics.fps} FPS
      </div>
      <div className="text-white/50">
        {metrics.frameTime}ms
      </div>
      {metrics.memory > 0 && (
        <div className="text-white/40">
          {metrics.memory} MB
        </div>
      )}
    </div>
  );
}
