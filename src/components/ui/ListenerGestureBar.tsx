/**
 * kokoro — Listener Gesture Bar UI
 * ROM専がワンタップで参加できるジェスチャーバー
 *
 * 反復326-335 (UI部分):
 * - 画面下部に常時表示のジェスチャーアイコン列
 * - タップすると即座にアバターがリアクション
 * - 連打するとリアクションの強度が上がる
 * - 「もっと聞きたい」は特別なハートエフェクト付き
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { ListenerEngagementSystem, type ListenerGesture, type ListenerSignal } from '@/engine/interaction/ListenerEngagementSystem';

interface ListenerGestureBarProps {
  system: ListenerEngagementSystem;
  onSignal?: (signal: ListenerSignal) => void;
  /** マイクがOFFの時だけ表示 */
  visible: boolean;
}

const GESTURES: Array<{ key: ListenerGesture; emoji: string; label: string }> = [
  { key: 'nod',   emoji: '😊', label: 'うんうん' },
  { key: 'clap',  emoji: '👏', label: '拍手' },
  { key: 'laugh', emoji: '😂', label: '笑い' },
  { key: 'wow',   emoji: '😮', label: 'すごい' },
  { key: 'agree', emoji: '✋', label: '同意' },
  { key: 'more',  emoji: '🙏', label: 'もっと' },
];

export function ListenerGestureBar({ system, onSignal, visible }: ListenerGestureBarProps) {
  const [activeGesture, setActiveGesture] = useState<ListenerGesture | null>(null);
  const [burstEffects, setBurstEffects] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const nextBurstId = useRef(0);

  const handleTap = useCallback((gesture: ListenerGesture, emoji: string) => {
    const signal = system.sendGesture(gesture);
    if (!signal) return; // Cooldown

    setActiveGesture(gesture);
    setTimeout(() => setActiveGesture(null), 200);

    onSignal?.(signal);

    // Burst effect
    const id = nextBurstId.current++;
    const x = GESTURES.findIndex(g => g.key === gesture);
    setBurstEffects(prev => [...prev.slice(-5), { id, emoji, x: x * (100 / 6) + 8 }]);
    setTimeout(() => {
      setBurstEffects(prev => prev.filter(e => e.id !== id));
    }, 800);
  }, [system, onSignal]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
      {/* Burst effects */}
      {burstEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${effect.x}%`,
            bottom: '100%',
            animation: 'gesture-burst 0.8s ease-out forwards',
          }}
        >
          {effect.emoji}
        </div>
      ))}

      {/* Gesture bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl
        bg-[#1a1225]/80 backdrop-blur-xl border border-white/8 shadow-lg">
        {GESTURES.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => handleTap(key, emoji)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl
              transition-all active:scale-90
              ${activeGesture === key ? 'bg-white/15 scale-110' : 'bg-transparent hover:bg-white/5'}`}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-[8px] text-white/30">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
