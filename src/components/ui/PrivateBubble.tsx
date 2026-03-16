/**
 * cocoro — Private Bubble (安全機構)
 * ワンタップで即座にプライベートバブルに隔離
 * 
 * 思想: ハラスメントゼロ保証 = 物理的な安全空間
 * 嫌な人から即座に離脱でき、相手からは見えなくなる
 * 
 * 機能:
 *   - ワンタップで透明シールド発動
 *   - バブル中は他者アバターが半透明+遠距離表示
 *   - 相手の音声がミュート
 *   - 5秒後に自動解除 or タップで解除
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const BUBBLE_DURATION = 5000; // ms

export interface PrivateBubbleState {
  active: boolean;
  blockedIds: Set<string>;
  opacity: number; // 0-1 shield visual intensity
}

export function usePrivateBubble() {
  const [state, setState] = useState<PrivateBubbleState>({
    active: false,
    blockedIds: new Set(),
    opacity: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fadeRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const activate = useCallback((targetId?: string) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    const blocked = new Set(state.blockedIds);
    if (targetId) blocked.add(targetId);

    setState({ active: true, blockedIds: blocked, opacity: 1 });

    // Auto-deactivate
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      deactivate();
    }, BUBBLE_DURATION);
  }, [state.blockedIds]);

  const deactivate = useCallback(() => {
    // Fade out
    let opacity = 1;
    if (fadeRef.current) clearInterval(fadeRef.current);
    fadeRef.current = setInterval(() => {
      opacity -= 0.1;
      if (opacity <= 0) {
        clearInterval(fadeRef.current);
        setState({ active: false, blockedIds: new Set(), opacity: 0 });
      } else {
        setState(prev => ({ ...prev, opacity }));
      }
    }, 50);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  return { state, activate, deactivate };
}

/** Private Bubble visual overlay */
export function PrivateBubbleOverlay({ state }: { state: PrivateBubbleState }) {
  if (!state.active) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-45 transition-opacity duration-300"
      style={{ opacity: state.opacity * 0.6 }}
    >
      {/* Shield border effect */}
      <div
        className="absolute inset-0"
        style={{
          border: '2px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '50%',
          margin: '10%',
          boxShadow: `
            inset 0 0 60px rgba(99, 102, 241, 0.1),
            0 0 40px rgba(99, 102, 241, 0.05)
          `,
        }}
      />

      {/* Status indicator */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2
        bg-indigo-500/10 backdrop-blur-xl border border-indigo-400/20
        rounded-full px-4 py-2 animate-scale-in">
        <span className="text-xs text-indigo-300/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          プライベートバブル
        </span>
      </div>
    </div>
  );
}

/** Bubble activation button (integrated into SpaceHUD) */
export function BubbleButton({ onActivate }: { onActivate: () => void }) {
  return (
    <button
      onClick={onActivate}
      className="w-10 h-10 rounded-full flex items-center justify-center
        bg-white/4 backdrop-blur-xl border border-white/8
        hover:bg-indigo-500/10 hover:border-indigo-400/20
        active:scale-90 transition-all duration-200
        touch-manipulation"
      title="プライベートバブル"
    >
      <span className="text-sm">🛡️</span>
    </button>
  );
}
