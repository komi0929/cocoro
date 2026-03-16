/**
 * kokoro — Space HUD (Head-Up Display)
 * 空間に溶け込むGlassmorphism UI
 * フェーズインジケーター、参加者数、マイクコントロール
 */
'use client';

import { useState } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpacePhase } from '@/types/kokoro';

const PHASE_LABELS: Record<
  SpacePhase,
  { label: string; icon: string; glowColor: string }
> = {
  [SpacePhase.SILENCE]: {
    label: '静寂',
    icon: '🌙',
    glowColor: 'shadow-blue-500/20',
  },
  [SpacePhase.TRIGGER]: {
    label: '発話',
    icon: '💫',
    glowColor: 'shadow-amber-500/20',
  },
  [SpacePhase.GRAVITY]: {
    label: '熱狂',
    icon: '🔥',
    glowColor: 'shadow-orange-500/30',
  },
};

interface SpaceHUDProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  onLeave: () => void;
}

export function SpaceHUD({
  isMicActive,
  onToggleMic,
  onLeave,
}: SpaceHUDProps) {
  const phase = useKokoroStore((s) => s.phase);
  const density = useKokoroStore((s) => s.density);
  const participants = useKokoroStore((s) => s.participants);
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const [showParticipants, setShowParticipants] = useState(false);

  const phaseInfo = PHASE_LABELS[phase];
  const participantCount = participants.size;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between max-w-3xl mx-auto pointer-events-auto">
          {/* Phase indicator — glassmorphism pill */}
          <div
            className={`flex items-center gap-2.5 
              bg-white/4 backdrop-blur-2xl backdrop-saturate-150
              rounded-full px-4 py-2 
              border border-white/8
              shadow-lg ${phaseInfo.glowColor}
              transition-all duration-700`}
          >
            <span className="text-base">{phaseInfo.icon}</span>
            <span className="text-[13px] font-medium text-white/70 tracking-wide">
              {phaseInfo.label}
            </span>
            {/* Density bar — elegant thin line */}
            <div className="w-12 h-[3px] bg-white/6 rounded-full overflow-hidden ml-1">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(5, density * 100)}%`,
                  background:
                    'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(245,158,11,0.8), rgba(239,68,68,0.8))',
                }}
              />
            </div>
          </div>

          {/* Participants count */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 
              bg-white/4 backdrop-blur-2xl backdrop-saturate-150
              rounded-full px-3.5 py-2 
              border border-white/8
              hover:bg-white/8 transition-all duration-300"
          >
            <div className="flex -space-x-1">
              {Array.from({ length: Math.min(participantCount, 3) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-linear-to-br from-violet-400/80 to-fuchsia-400/80 border border-white/10"
                  />
                )
              )}
            </div>
            <span className="text-[13px] text-white/60 font-medium">
              {participantCount}
            </span>
          </button>

          {/* Leave button — subtle danger */}
          <button
            onClick={onLeave}
            className="bg-white/4 backdrop-blur-2xl backdrop-saturate-150
              rounded-full px-4 py-2 
              border border-red-500/20
              text-red-400/70 text-[13px] font-medium 
              hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30
              transition-all duration-300"
          >
            退出
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-4">
          {/* Mic toggle — glass orb */}
          <button
            onClick={onToggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-500 active:scale-90 touch-manipulation
              ${
                isMicActive
                  ? 'bg-linear-to-br from-emerald-500/80 to-cyan-500/80 shadow-lg shadow-emerald-500/30 border border-white/20'
                  : 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-lg shadow-black/20'
              }`}
          >
            {isMicActive ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-40"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .8-.13 1.56-.38 2.27" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Active speakers indicator — minimal */}
      {activeSpeakers.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <div
            className="flex items-center gap-2 
            bg-white/3 backdrop-blur-xl 
            rounded-full px-3 py-1.5 
            border border-white/6"
          >
            <div className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-[2px] bg-emerald-400/60 rounded-full animate-pulse"
                  style={{
                    height: `${10 + i * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-white/40">
              {activeSpeakers.length}人が発話中
            </span>
          </div>
        </div>
      )}

      {/* Participants panel — glassmorphism */}
      {showParticipants && (
        <div
          className="fixed top-16 right-4 z-50 w-56
          bg-white/3 backdrop-blur-2xl backdrop-saturate-150
          rounded-2xl border border-white/8 
          p-4 shadow-2xl shadow-black/20 animate-scale-in"
        >
          <h3 className="text-[12px] font-medium text-white/50 mb-3 tracking-wider uppercase">
            参加者
          </h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {Array.from(participants.values()).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/4 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full bg-linear-to-br from-violet-400/70 to-fuchsia-400/70 flex items-center justify-center text-[10px] font-bold text-white/90 ${
                    p.speakingState.isSpeaking
                      ? 'ring-[1.5px] ring-emerald-400/60 ring-offset-1 ring-offset-transparent'
                      : ''
                  }`}
                >
                  {p.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80 truncate">
                    {p.displayName}
                  </p>
                  <p className="text-[9px] text-white/30">
                    {p.isGuest ? 'ゲスト' : 'メンバー'}
                  </p>
                </div>
                {p.speakingState.isSpeaking && (
                  <div className="flex gap-[2px]">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-[2px] bg-emerald-400/50 rounded-full animate-pulse"
                        style={{
                          height: `${6 + i * 2}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
