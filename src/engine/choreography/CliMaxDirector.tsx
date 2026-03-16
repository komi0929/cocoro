/**
 * cocoro — CliMax Director
 * 複数人の声量が閾値を超えた瞬間のシネマティック演出
 * 
 * 思想: 「盛り上がりモーメント」= 会話の最高潮が視覚的ご褒美になる
 * → 「また盛り上がりたい」= retention
 * 
 * 演出:
 *   - 全画面フラッシュ
 *   - カメラシェイク
 *   - パーティクル爆発
 *   - 環境色シフト
 */
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';

const CLIMAX_THRESHOLD = 0.6; // density threshold
const CLIMAX_COOLDOWN = 10000; // ms between climaxes
const CLIMAX_DURATION = 2000; // ms

export interface CliMaxState {
  active: boolean;
  intensity: number; // 0-1
  phase: 'idle' | 'buildup' | 'peak' | 'fade';
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

    // Haptic burst
    if (navigator.vibrate) navigator.vibrate([50, 30, 100, 30, 50]);

    // Buildup
    setState({ active: true, intensity: 0.3, phase: 'buildup' });

    // Peak
    setTimeout(() => {
      setState({ active: true, intensity: 1, phase: 'peak' });
    }, 300);

    // Fade
    setTimeout(() => {
      setState({ active: true, intensity: 0.5, phase: 'fade' });
    }, 1000);

    // End
    setTimeout(() => {
      setState({ active: false, intensity: 0, phase: 'idle' });
    }, CLIMAX_DURATION);
  }, []);

  useEffect(() => {
    // Check climax conditions
    if (
      density >= CLIMAX_THRESHOLD &&
      activeSpeakers.length >= 2 &&
      !state.active
    ) {
      buildupRef.current += 1;
      if (buildupRef.current >= 3) { // Sustained excitement
        triggerClimax();
        buildupRef.current = 0;
      }
    } else {
      buildupRef.current = Math.max(0, buildupRef.current - 0.5);
    }
  }, [density, activeSpeakers.length, state.active, triggerClimax]);

  return state;
}

/** CliMax visual overlay */
export function CliMaxOverlay({ state }: { state: CliMaxState }) {
  if (!state.active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-55">
      {/* Screen flash */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: state.phase === 'peak'
            ? 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.1) 50%, transparent 100%)'
            : 'transparent',
          opacity: state.intensity * 0.8,
        }}
      />

      {/* Edge vignette enhancement */}
      {state.phase === 'peak' && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 100px 20px rgba(139,92,246,0.15)',
          }}
        />
      )}

      {/* "盛り上がってる！" indicator */}
      {state.phase === 'peak' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          animate-scale-in">
          <div className="text-4xl filter drop-shadow-lg select-none">🔥</div>
        </div>
      )}
    </div>
  );
}
