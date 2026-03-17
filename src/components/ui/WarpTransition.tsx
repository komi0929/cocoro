/**
 * kokoro — Warp Transition Effect
 * ルーム間移動時のワープ演出
 *
 * 反復181-190:
 * - 入室時: 暗闇から光の筋が収束しながら空間が形成される
 * - 退室時: 空間が光の粒子に分解されて消える
 * = 空間移動が「体験」になる
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

type TransitionType = 'enter' | 'exit';
type TransitionPhase = 'idle' | 'starting' | 'active' | 'ending';

interface WarpTransitionProps {
  type: TransitionType;
  active: boolean;
  onComplete?: () => void;
  roomName?: string;
}

function ExitParticles({ progress }: { progress: number }) {
  const positions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: 50 + (Math.sin(i * 7.3) * 0.5) * 100,
      y: 50 + (Math.cos(i * 3.7) * 0.5) * 100,
    }));
  }, []);

  return (
    <div className="absolute inset-0">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-violet-400/50"
          style={{
            left: `${pos.x * progress}%`,
            top: `${pos.y * progress}%`,
            opacity: 1 - progress,
            transform: `scale(${0.5 + progress * 2})`,
          }}
        />
      ))}
    </div>
  );
}

export function WarpTransition({ type, active, onComplete, roomName }: WarpTransitionProps) {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [progress, setProgress] = useState(0);

  const startTransition = useCallback(() => {
    setPhase('starting');
    setProgress(0);

    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);

    // Animate progress
    let p = 0;
    const interval = setInterval(() => {
      p += 0.02;
      setProgress(Math.min(1, p));
      if (p >= 0.4) setPhase('active');
      if (p >= 0.9) setPhase('ending');
      if (p >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('idle');
          onComplete?.();
        }, 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (active && phase === 'idle') {
      const cleanup = startTransition();
      return cleanup;
    }
  }, [active, phase, startTransition]);

  if (!active && phase === 'idle') return null;

  const isEntering = type === 'enter';

  return (
    <div className="fixed inset-0 z-200 pointer-events-none overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-[#0f0a1a] transition-opacity duration-300"
        style={{ opacity: isEntering ? 1 - progress : progress }}
      />

      {/* Light streaks */}
      {phase !== 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const length = isEntering
              ? 200 + progress * 600
              : 800 - progress * 600;
            const opacity = phase === 'ending' ? 1 - (progress - 0.9) * 10 : Math.min(1, progress * 3);

            return (
              <div
                key={i}
                className="absolute"
                style={{
                  width: `${Math.max(1, 2 - progress)}px`,
                  height: `${length}px`,
                  background: `linear-gradient(180deg, transparent, ${
                    isEntering ? 'rgba(139,92,246,0.6)' : 'rgba(99,102,241,0.4)'
                  }, transparent)`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center center',
                  opacity,
                  transition: 'all 0.05s linear',
                }}
              />
            );
          })}

          {/* Central flash */}
          {progress > 0.3 && progress < 0.8 && (
            <div
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(139,92,246,0.3), transparent)',
                transform: `scale(${1 + (progress - 0.3) * 4})`,
                opacity: 1 - Math.abs(progress - 0.55) * 4,
              }}
            />
          )}
        </div>
      )}

      {/* Room name */}
      {roomName && phase === 'active' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ animation: 'fade-in-up 0.5s ease-out' }}>
            <p className="text-white/60 text-lg font-light tracking-widest text-center">
              {roomName}
            </p>
          </div>
        </div>
      )}

      {type === 'exit' && progress > 0.3 && (
        <ExitParticles progress={progress} />
      )}
    </div>
  );
}
