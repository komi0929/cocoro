/**
 * cocoro — Space Mood Indicator
 * 画面上部に会話フロー状態を繊細に表示するHUD要素
 * 
 * 反復171-180:
 * - フロー状態のリアルタイム表示
 * - ゾーン突入時のお祝いバナー
 * - 会話テンポのリズム表示
 * = 「今、良い会話してるな」と直感的にわかる
 */
'use client';

import { useState, useEffect, useRef } from 'react';

type FlowLevel = 'idle' | 'warming' | 'flowing' | 'zone';

const FLOW_UI: Record<FlowLevel, { label: string; icon: string; color: string; bgColor: string }> = {
  idle: { label: '', icon: '', color: '', bgColor: '' },
  warming: { label: 'ウォームアップ中', icon: '🌱', color: 'text-emerald-300/60', bgColor: 'bg-emerald-500/5' },
  flowing: { label: '会話フロー中', icon: '🌊', color: 'text-blue-300/80', bgColor: 'bg-blue-500/8' },
  zone: { label: '✨ ゾーン突入！', icon: '⚡', color: 'text-amber-300', bgColor: 'bg-amber-500/10' },
};

interface SpaceMoodIndicatorProps {
  flowLevel: FlowLevel;
  flowScore: number;          // 0-1
  streakSeconds: number;
  turnsPerMinute: number;
}

export function SpaceMoodIndicator({ 
  flowLevel, 
  flowScore, 
  streakSeconds,
  turnsPerMinute,
}: SpaceMoodIndicatorProps) {
  const [showZoneBanner, setShowZoneBanner] = useState(false);
  const prevLevelRef = useRef<FlowLevel>('idle');

  // Zone entry celebration
  useEffect(() => {
    if (flowLevel === 'zone' && prevLevelRef.current !== 'zone') {
      setShowZoneBanner(true);
      if (navigator.vibrate) navigator.vibrate([30, 30, 30, 30, 60]);
      setTimeout(() => setShowZoneBanner(false), 3000);
    }
    prevLevelRef.current = flowLevel;
  }, [flowLevel]);

  if (flowLevel === 'idle') return null;

  const ui = FLOW_UI[flowLevel];

  return (
    <>
      {/* Zone entry banner */}
      {showZoneBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fade-in-up 0.5s ease-out' }}>
          <div className="px-6 py-3 rounded-2xl bg-amber-500/15 backdrop-blur-xl
            border border-amber-400/20 shadow-lg shadow-amber-500/10">
            <p className="text-amber-200 text-sm font-medium text-center">
              ⚡ ゾーン突入！最高の会話が生まれています
            </p>
          </div>
        </div>
      )}

      {/* Flow indicator pill */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full
          ${ui.bgColor} backdrop-blur-xl border border-white/5`}>
          <span className="text-xs">{ui.icon}</span>
          <span className={`text-[11px] font-medium ${ui.color}`}>
            {ui.label}
          </span>
          
          {/* Flow score bar */}
          <div className="w-10 h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${flowScore * 100}%`,
                backgroundColor: flowLevel === 'zone' ? '#fbbf24' : flowLevel === 'flowing' ? '#60a5fa' : '#34d399',
              }}
            />
          </div>

          {/* Streak time */}
          {streakSeconds > 10 && (
            <span className="text-[10px] text-white/30 tabular-nums">
              {Math.floor(streakSeconds / 60)}:{String(Math.floor(streakSeconds % 60)).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {/* Tempo pulse dots (bottom of screen) */}
      {turnsPerMinute > 2 && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, Math.round(turnsPerMinute)) }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-white/20"
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.2}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
