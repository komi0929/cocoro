/**
 * kokoro — Reaction Panel (究極版)
 * リアクションが「エンターテインメント」になる演出システム
 *
 * 思想: 拍手が紙吹雪になり、笑いが虹になり、🔥が炎になる
 * = 会話のテンションが視覚的な「ご褒美」になる
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';
import { ReactionType } from '@/types/kokoro';

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string; burst: string[] }[] = [
  { type: ReactionType.NOD, emoji: '👍', label: 'うなずき', color: '#60a5fa', burst: ['👍', '✓', '○'] },
  { type: ReactionType.CLAP, emoji: '👏', label: '拍手', color: '#fbbf24', burst: ['🎊', '✨', '🎉', '👏', '⭐'] },
  { type: ReactionType.LAUGH, emoji: '😂', label: '笑い', color: '#34d399', burst: ['😂', '🤣', '😆', '💚', '🌈'] },
  { type: ReactionType.SURPRISE, emoji: '😲', label: '驚き', color: '#a78bfa', burst: ['😲', '❗', '⚡', '💜'] },
  { type: ReactionType.WAVE, emoji: '👋', label: '手振り', color: '#fb923c', burst: ['👋', '🤚', '✋'] },
  { type: ReactionType.HEART, emoji: '❤️', label: 'ハート', color: '#f472b6', burst: ['❤️', '💕', '💗', '💖', '💝', '💓'] },
  { type: ReactionType.FIRE, emoji: '🔥', label: '盛り上げ', color: '#ef4444', burst: ['🔥', '💥', '⚡', '🌟', '💫'] },
  { type: ReactionType.SPARKLE, emoji: '✨', label: 'キラキラ', color: '#c084fc', burst: ['✨', '🌟', '⭐', '💫', '🪄'] },
];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'emoji' | 'dot' | 'ring';
}

/** Screen flash overlay for big reactions */
function ScreenFlash({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 pointer-events-none z-60 animate-flash-out"
      style={{ backgroundColor: color + '15' }}
    />
  );
}

export function ReactionPanel() {
  const localId = useKokoroStore((s) => s.localParticipantId);
  const addReaction = useKokoroStore((s) => s.addReaction);
  const [isExpanded, setIsExpanded] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState<{ color: string; active: boolean }>({ color: '', active: false });
  const particleIdRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // Particle physics loop
  useEffect(() => {
    let lastTime = performance.now();

    const update = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      setParticles((prev) => {
        if (prev.length === 0) return prev;
        const next: Particle[] = [];
        for (const p of prev) {
          const newLife = p.life - dt;
          if (newLife <= 0) continue;
          next.push({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            vy: p.vy + 300 * dt, // gravity
            rotation: p.rotation + p.rotationSpeed * dt,
            life: newLife,
          });
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const spawnBurst = useCallback(
    (reaction: (typeof REACTIONS)[number], originX: number, originY: number) => {
      const count = 8 + Math.floor(Math.random() * 8); // 8-15 particles
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = 200 + Math.random() * 400;
        const isEmoji = Math.random() > 0.3;

        newParticles.push({
          id: particleIdRef.current++,
          emoji: reaction.burst[Math.floor(Math.random() * reaction.burst.length)],
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 200 - Math.random() * 200,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720,
          scale: isEmoji ? 0.6 + Math.random() * 0.8 : 0.2 + Math.random() * 0.3,
          life: 1.2 + Math.random() * 0.8,
          maxLife: 2.0,
          color: reaction.color,
          type: isEmoji ? 'emoji' : Math.random() > 0.5 ? 'dot' : 'ring',
        });
      }

      setParticles((prev) => [...prev.slice(-50), ...newParticles]); // cap at ~65

      // Screen flash
      setFlash({ color: reaction.color, active: true });
      setTimeout(() => setFlash({ color: '', active: false }), 300);

      // Haptic
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    },
    []
  );

  const handleReaction = useCallback(
    (r: (typeof REACTIONS)[number], e: React.MouseEvent | React.TouchEvent) => {
      if (!localId) return;

      addReaction({ participantId: localId, type: r.type, timestamp: Date.now() });

      // Get origin point from the button
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      spawnBurst(r, originX, originY);
    },
    [localId, addReaction, spawnBurst]
  );

  return (
    <>
      {/* Screen flash overlay */}
      <ScreenFlash color={flash.color} active={flash.active} />

      {/* Particle system */}
      <div className="fixed inset-0 pointer-events-none z-55 overflow-hidden">
        {particles.map((p) => {
          const opacity = Math.min(1, p.life / (p.maxLife * 0.3));
          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                opacity,
                transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                willChange: 'transform, opacity',
              }}
            >
              {p.type === 'emoji' ? (
                <span className="text-2xl select-none">{p.emoji}</span>
              ) : p.type === 'dot' ? (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              ) : (
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: p.color }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Reaction button panel */}
      <div
        className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Expanded reaction grid */}
        {isExpanded && (
          <div className="bg-white/4 backdrop-blur-2xl backdrop-saturate-150
            rounded-2xl p-3 border border-white/8
            shadow-2xl shadow-black/30 animate-scale-in">
            <div className="grid grid-cols-4 gap-1.5">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={(e) => handleReaction(r, e)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl
                    hover:bg-white/6 active:scale-75 transition-all duration-150
                    touch-manipulation group"
                  title={r.label}
                >
                  <span className="text-xl group-hover:scale-125 group-active:scale-150 transition-transform duration-200">
                    {r.emoji}
                  </span>
                  <span className="text-[9px] text-white/30 group-hover:text-white/50 transition-colors">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center
            shadow-lg transition-all duration-300
            touch-manipulation active:scale-90
            ${isExpanded
              ? 'bg-white/8 backdrop-blur-2xl border border-white/12 rotate-45'
              : 'bg-white/4 backdrop-blur-2xl border border-white/8 hover:bg-white/8 shadow-violet-500/10'
            }`}
        >
          <span className="text-lg">{isExpanded ? '✕' : '💬'}</span>
        </button>
      </div>
    </>
  );
}
