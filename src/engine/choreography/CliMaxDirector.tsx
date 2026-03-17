/**
 * kokoro — CliMax Director
 * 会話の最高潮を「映画のクライマックスシーン」として演出
 * 
 * 設計思想（手塚眞「映像の文法」に対抗）:
 *   - 盛り上がりの「前兆」→「爆発」→「余韻」の3幕構成
 *   - スクリーンショットを撮りたくなる視覚的ご褒美
 *   - 光の爆発 + 放射状パルス + ビネット強化 + 色温度シフト
 *   - 「また盛り上がりたい」= retention
 */
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';

const CLIMAX_THRESHOLD = 0.55;
const CLIMAX_COOLDOWN = 12000;
const CLIMAX_DURATION = 3500; // 3.5 seconds of spectacle

export interface CliMaxState {
  active: boolean;
  intensity: number; // 0-1
  phase: 'idle' | 'buildup' | 'peak' | 'afterglow';
}

export function useCliMaxDirector(): CliMaxState {
  const density = useKokoroStore((s) => s.density);
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const [state, setState] = useState<CliMaxState>({
    active: false,
    intensity: 0,
    phase: 'idle',
  });
  const lastClimaxRef = useRef(0);
  const buildupRef = useRef(0);

  const triggerClimax = useCallback(() => {
    const now = Date.now();
    if (now - lastClimaxRef.current < CLIMAX_COOLDOWN) return;
    lastClimaxRef.current = now;

    // Haptic: crescendo pattern
    if (navigator.vibrate) navigator.vibrate([30, 20, 50, 20, 80, 30, 120]);

    // Act 1: Buildup (前兆) — 600ms
    setState({ active: true, intensity: 0.4, phase: 'buildup' });

    // Act 2: Peak (爆発) — at 600ms
    setTimeout(() => {
      setState({ active: true, intensity: 1, phase: 'peak' });
      if (navigator.vibrate) navigator.vibrate([200]);
    }, 600);

    // Act 3: Afterglow (余韻) — at 1800ms
    setTimeout(() => {
      setState({ active: true, intensity: 0.3, phase: 'afterglow' });
    }, 1800);

    // End
    setTimeout(() => {
      setState({ active: false, intensity: 0, phase: 'idle' });
    }, CLIMAX_DURATION);
  }, []);

  useEffect(() => {
    if (
      density >= CLIMAX_THRESHOLD &&
      activeSpeakers.length >= 2 &&
      !state.active
    ) {
      buildupRef.current += 1;
      if (buildupRef.current >= 3) {
        triggerClimax();
        buildupRef.current = 0;
      }
    } else {
      buildupRef.current = Math.max(0, buildupRef.current - 0.5);
    }
  }, [density, activeSpeakers.length, state.active, triggerClimax]);

  return state;
}

/** CliMax visual overlay — 映画のクライマックスシーン */
export function CliMaxOverlay({ state }: { state: CliMaxState }) {
  if (!state.active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-55">
      {/* === Act 1: Buildup — 中心から拡がる微かな光 === */}
      {state.phase === 'buildup' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 60%, rgba(139,92,246,0.08) 0%, transparent 50%)',
              animation: 'climax-pulse 0.6s ease-out',
            }}
          />
          {/* Rising particles effect */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/3"
            style={{
              background: 'linear-gradient(to top, rgba(139,92,246,0.06), transparent)',
              animation: 'climax-rise 0.8s ease-out forwards',
            }}
          />
        </>
      )}

      {/* === Act 2: Peak — 光の爆発 + 放射状パルス === */}
      {state.phase === 'peak' && (
        <>
          {/* Central light explosion */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, 
                rgba(255,255,255,${0.12 * state.intensity}) 0%, 
                rgba(139,92,246,${0.1 * state.intensity}) 20%, 
                rgba(236,72,153,${0.06 * state.intensity}) 40%, 
                transparent 70%)`,
              animation: 'climax-explode 1.2s ease-out forwards',
            }}
          />

          {/* Radial pulse rings */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: '10px',
                height: '10px',
                borderColor: `rgba(139,92,246,${0.3 - i * 0.06})`,
                animation: `climax-ring ${1.0 + i * 0.15}s ease-out ${i * 0.1}s forwards`,
              }}
            />
          ))}

          {/* Screen edge flash */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 150px 40px rgba(139,92,246,${0.15 * state.intensity}), 
                           inset 0 0 60px 20px rgba(236,72,153,${0.08 * state.intensity})`,
            }}
          />

          {/* Top and bottom cinematic bars (subtle) */}
          <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/20 to-transparent" />
        </>
      )}

      {/* === Act 3: Afterglow — 温かい余韻 === */}
      {state.phase === 'afterglow' && (
        <>
          {/* Warm vignette fade */}
          <div
            className="absolute inset-0 transition-opacity duration-1500"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.04) 0%, transparent 60%)',
              opacity: state.intensity,
            }}
          />
          {/* Subtle glow at center */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent)',
              animation: 'climax-afterglow 2s ease-out forwards',
            }}
          />
        </>
      )}

    </div>
  );
}
