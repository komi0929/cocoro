/**
 * kokoro — Space HUD (Head-Up Display)
 * 空間に溶け込むGlassmorphism UI — 究極版
 * 
 * 反復11-20: 声量ビジュアライザー、話者名リアルタイム表示、
 * ハプティクスフィードバック、マイクリング脈動
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpacePhase } from '@/types/kokoro';
import type { EngineStatus } from '@/hooks/useEngineConnector';

const PHASE_LABELS: Record<
  SpacePhase,
  { label: string; icon: string; glowColor: string; gradient: string }
> = {
  [SpacePhase.SILENCE]: {
    label: '静寂',
    icon: '🌙',
    glowColor: 'shadow-blue-500/20',
    gradient: 'from-blue-500/15 to-indigo-500/5',
  },
  [SpacePhase.TRIGGER]: {
    label: '発話',
    icon: '💫',
    glowColor: 'shadow-amber-500/20',
    gradient: 'from-amber-500/15 to-orange-500/5',
  },
  [SpacePhase.GRAVITY]: {
    label: '熱狂',
    icon: '🔥',
    glowColor: 'shadow-orange-500/30',
    gradient: 'from-orange-500/15 to-red-500/8',
  },
};

interface SpaceHUDProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  onLeave: () => void;
  onShowProfile?: (participantId: string) => void;
  onShareRoom?: () => void;
  onShowGame?: () => void;
  onShowFriends?: () => void;
  onShowSafety?: () => void;
  onShowSession?: () => void;
  onShowHighlight?: () => void;
  engineStatus?: EngineStatus;
}

export function SpaceHUD({
  isMicActive,
  onToggleMic,
  onLeave,
  onShowProfile,
  onShareRoom,
  onShowGame,
  onShowFriends,
  onShowSafety,
  onShowSession,
  onShowHighlight,
  engineStatus,
}: SpaceHUDProps) {
  const phase = useKokoroStore((s) => s.phase);
  const density = useKokoroStore((s) => s.density);
  const participants = useKokoroStore((s) => s.participants);
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const localId = useKokoroStore((s) => s.localParticipantId);
  const [showParticipants, setShowParticipants] = useState(false);
  const micButtonRef = useRef<HTMLButtonElement>(null);

  // Haptic feedback on mic toggle
  const handleMicToggle = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(isMicActive ? [20] : [10, 30, 10]);
    }
    onToggleMic();
  }, [isMicActive, onToggleMic]);

  // Get local participant volume for visualizer
  const localParticipant = localId ? participants.get(localId) : undefined;
  const localVolume = localParticipant?.speakingState.volume ?? 0;
  const isSpeaking = localParticipant?.speakingState.isSpeaking ?? false;

  // Active speaker names (up to 2)
  const speakerNames = activeSpeakers
    .filter((id) => id !== localId)
    .slice(0, 2)
    .map((id) => participants.get(id)?.displayName ?? '不明')
    .join('、');

  const phaseInfo = PHASE_LABELS[phase];
  const participantCount = participants.size;

  // Mic button scale based on volume
  const micScale = isMicActive && isSpeaking ? 1 + localVolume * 0.15 : 1;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between max-w-3xl mx-auto pointer-events-auto">
          {/* Phase indicator — glassmorphism pill */}
          <div
            className={`flex items-center gap-2.5 
              bg-white/4 backdrop-blur-2xl backdrop-saturate-150
              rounded-full px-4 py-2.5 
              border border-white/8
              shadow-lg ${phaseInfo.glowColor}
              transition-all duration-700`}
          >
            <span className="text-base">{phaseInfo.icon}</span>
            <span className="text-[13px] font-medium text-white/70 tracking-wide">
              {phaseInfo.label}
            </span>
            {/* Density bar */}
            <div className="w-14 h-[3px] bg-white/6 rounded-full overflow-hidden ml-1">
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

          <div className="flex items-center gap-2">
            {/* Share button */}
            {onShareRoom && (
              <button
                onClick={onShareRoom}
                className="bg-white/4 backdrop-blur-2xl backdrop-saturate-150
                  rounded-full p-2.5
                  border border-white/8
                  hover:bg-white/8 active:scale-90 transition-all duration-300"
                title="共有"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                  <path d="M10 2H14V6" />
                  <path d="M14 2L8 8" />
                  <path d="M6 3H3C2.4 3 2 3.4 2 4V13C2 13.6 2.4 14 3 14H12C12.6 14 13 13.6 13 13V10" />
                </svg>
              </button>
            )}

            {/* Participants count */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 
                bg-white/4 backdrop-blur-2xl backdrop-saturate-150
                rounded-full px-3.5 py-2.5 
                border border-white/8
                hover:bg-white/8 active:scale-95 transition-all duration-300"
            >
              <div className="flex -space-x-1.5">
                {Array.from(participants.values()).slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold
                      border border-[#0f0a1a]/50
                      ${p.speakingState.isSpeaking ? 'ring-1 ring-emerald-400/60' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${['#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#10b981'][i % 5]}90, ${['#6366f1', '#d97706', '#db2777', '#0891b2', '#059669'][i % 5]}70)`,
                    }}
                  >
                    {p.displayName.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-white/60 font-medium">
                {participantCount}
              </span>
            </button>

            {/* Leave button */}
            <button
              onClick={onLeave}
              className="bg-white/4 backdrop-blur-2xl backdrop-saturate-150
                rounded-full px-4 py-2.5 
                border border-red-500/20
                text-red-400/70 text-[13px] font-medium 
                hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30
                active:scale-90 transition-all duration-300"
            >
              退出
            </button>
          </div>
        </div>
      </div>

      {/* Bottom controls — mic with voice visualizer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-4">
          {/* Voice level ring (behind mic button) */}
          <div className="relative">
            {/* Pulsing rings when speaking */}
            {isMicActive && isSpeaking && (
              <>
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    transform: `scale(${1.3 + localVolume * 0.5})`,
                    border: `2px solid rgba(16, 185, 129, ${0.15 + localVolume * 0.2})`,
                    transition: 'transform 0.1s ease-out',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    transform: `scale(${1.6 + localVolume * 0.8})`,
                    border: `1px solid rgba(16, 185, 129, ${0.05 + localVolume * 0.1})`,
                    transition: 'transform 0.15s ease-out',
                  }}
                />
              </>
            )}

            {/* Mic toggle button */}
            <button
              ref={micButtonRef}
              onClick={handleMicToggle}
              className={`w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 active:scale-85 touch-manipulation relative
                ${
                  isMicActive
                    ? 'bg-linear-to-br from-emerald-500/80 to-cyan-500/80 shadow-xl shadow-emerald-500/30 border-2 border-white/20'
                    : 'bg-white/5 backdrop-blur-2xl border-2 border-white/10 shadow-lg shadow-black/20'
                }`}
              style={{ transform: `scale(${micScale})`, transition: 'transform 0.08s ease-out' }}
            >
              {isMicActive ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .8-.13 1.56-.38 2.27" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}

              {/* Volume level indicator dots */}
              {isMicActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-75"
                      style={{
                        width: '3px',
                        height: `${3 + (localVolume > i * 0.2 ? localVolume * 8 : 0)}px`,
                        maxHeight: '10px',
                        backgroundColor: localVolume > i * 0.2
                          ? `rgba(16, 185, 129, ${0.5 + localVolume * 0.5})`
                          : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Bar — bottom right */}
      <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-2">
        {onShowGame && (
          <button onClick={onShowGame} title="ゲーム"
            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-xl hover:bg-white/10 active:scale-90 transition-all">
            🎲
          </button>
        )}
        {onShowFriends && (
          <button onClick={onShowFriends} title="フレンド"
            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-xl hover:bg-white/10 active:scale-90 transition-all">
            👥
          </button>
        )}
        {onShowSafety && (
          <button onClick={onShowSafety} title="安全管理"
            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-xl hover:bg-white/10 active:scale-90 transition-all">
            🛡️
          </button>
        )}
        {onShowSession && (
          <button onClick={onShowSession} title="セッション"
            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-xl hover:bg-white/10 active:scale-90 transition-all">
            📊
          </button>
        )}
        {onShowHighlight && (
          <button onClick={onShowHighlight} title="ハイライト"
            className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-xl hover:bg-white/10 active:scale-90 transition-all">
            ✨
          </button>
        )}
      </div>

      {/* Engine Status Dashboard — 全エンジン出力を可視化 */}
      {engineStatus && (
        <div className="fixed top-4 left-4 z-40 flex flex-col gap-1 pointer-events-auto max-w-[280px]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="bg-black/40 backdrop-blur-2xl rounded-xl px-3 py-2 border border-white/8 shadow-lg">
            {/* Row 1: Core state */}
            <div className="flex items-center gap-2.5 text-[10px] flex-wrap">
              <span className={`${engineStatus.flowLevel === 'zone' ? 'text-amber-400' : engineStatus.flowLevel === 'flowing' ? 'text-green-400' : 'text-white/30'}`}>
                🌊 {engineStatus.flowLevel}
              </span>
              <span className="text-white/40">
                💜 {engineStatus.dominantEmotion}
              </span>
              <span className="text-white/30">
                🤝 {Math.round(engineStatus.trustLevel * 100)}%
              </span>
              <span className={`${engineStatus.safetyLevel === 'green' ? 'text-green-400/50' : 'text-red-400'}`}>
                🛡 {engineStatus.safetyLevel}
              </span>
            </div>

            {/* Row 2: Conversation */}
            <div className="flex items-center gap-2.5 text-[10px] mt-1 flex-wrap">
              <span className="text-white/35">
                📖 {engineStatus.conversationArc}
              </span>
              <span className="text-white/25">
                🤫 {engineStatus.silenceDuration.toFixed(0)}s
              </span>
              <span className="text-white/30">
                🎭 {Math.round(engineStatus.emotionIntensity * 100)}%
              </span>
              <span className="text-white/25">
                🌈 {engineStatus.roomMoodLabel}
              </span>
            </div>

            {/* Row 3: Social */}
            <div className="flex items-center gap-2.5 text-[10px] mt-1 flex-wrap">
              <span className="text-white/30">
                💞 絆{Math.round(engineStatus.bondLevel * 100)}%
              </span>
              <span className="text-white/30">
                ⚡ エナジー{Math.round(engineStatus.groupEnergy * 100)}%
              </span>
              <span className="text-white/25">
                👥 {Math.round(engineStatus.activeParticipantRatio * 100)}%活動
              </span>
            </div>

            {/* Row 4: Audio + Game */}
            <div className="flex items-center gap-2.5 text-[10px] mt-1 flex-wrap">
              <span className="text-white/25">
                🎵 {engineStatus.bgmGenre}
              </span>
              {engineStatus.voiceEffectActive !== 'none' && (
                <span className="text-cyan-300/40">
                  🎤 {engineStatus.voiceEffectActive}
                </span>
              )}
              {engineStatus.activeGame && (
                <span className="text-amber-300/60">
                  🎮 {engineStatus.activeGame}
                </span>
              )}
              {engineStatus.debateActive && (
                <span className="text-red-300/50">
                  ⚔️ ディベート中
                </span>
              )}
              <span className="text-white/20">
                🎪 {engineStatus.showState}
              </span>
            </div>

            {/* Row 5: Economy + Governance */}
            <div className="flex items-center gap-2.5 text-[10px] mt-1 flex-wrap">
              {engineStatus.coinBalance > 0 && (
                <span className="text-yellow-300/50">
                  🪙 {engineStatus.coinBalance}
                </span>
              )}
              <span className="text-white/20">
                👑 {engineStatus.memberTier}
              </span>
              {engineStatus.reputationScore > 0 && (
                <span className="text-white/25">
                  ⭐ rep.{engineStatus.reputationScore}
                </span>
              )}
              {engineStatus.moderationActive && (
                <span className="text-orange-300/40">
                  🔒 モデレーション中
                </span>
              )}
            </div>

            {/* Row 6: Cognitive + Performance */}
            <div className="flex items-center gap-2.5 text-[10px] mt-1 flex-wrap">
              <span className="text-white/25">
                🧠 EQ:{Math.round(engineStatus.eqScore * 100)}
              </span>
              <span className="text-white/20">
                📊 負荷:{Math.round(engineStatus.cognitiveLoad * 100)}%
              </span>
              <span className="text-white/20">
                ⚡ {engineStatus.fps}fps
              </span>
              {engineStatus.memoryUsageMB > 0 && (
                <span className="text-white/15">
                  💾 {engineStatus.memoryUsageMB}MB
                </span>
              )}
              <span className={`${engineStatus.networkQuality === 'good' ? 'text-green-400/30' : 'text-red-400/50'}`}>
                📶 {engineStatus.networkQuality}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active speakers overlay — shows who's talking */}
      {activeSpeakers.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="flex items-center gap-2 
            bg-white/3 backdrop-blur-xl 
            rounded-full px-3.5 py-2 
            border border-white/6"
          >
            {/* Animated waveform */}
            <div className="flex gap-[3px] items-end">
              {[0, 1, 2, 3].map((i) => {
                // Get real volume from first active speaker
                const speakerId = activeSpeakers[0];
                const speaker = speakerId ? participants.get(speakerId) : undefined;
                const vol = speaker?.speakingState.volume ?? 0;
                const barHeight = 6 + (vol * 10) * Math.sin(Date.now() / 100 + i * 1.5);
                return (
                  <div
                    key={i}
                    className="w-[2.5px] bg-emerald-400/60 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, Math.min(16, barHeight))}px`,
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[11px] text-white/50">
              {speakerNames ? `${speakerNames}が話し中` : `${activeSpeakers.length}人が発話中`}
            </span>
          </div>
        </div>
      )}

      {/* Participants panel — glassmorphism */}
      {showParticipants && (
        <div
          className="fixed top-16 right-4 z-50 w-64
          bg-white/4 backdrop-blur-2xl backdrop-saturate-150
          rounded-2xl border border-white/8 
          p-4 shadow-2xl shadow-black/30"
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-medium text-white/50 tracking-wider uppercase">
              参加者
            </h3>
            <span className="text-[11px] text-white/30">{participantCount}人</span>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-none">
            {Array.from(participants.values()).map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  onShowProfile?.(p.id);
                  setShowParticipants(false);
                }}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl 
                  hover:bg-white/5 transition-all text-left group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white/90 
                    ${p.speakingState.isSpeaking ? 'ring-2 ring-emerald-400/50 ring-offset-1 ring-offset-transparent' : ''}`}
                  style={{
                    background: `linear-gradient(135deg, ${['#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#10b981'][i % 5]}80, ${['#6366f1', '#d97706', '#db2777', '#0891b2', '#059669'][i % 5]}60)`,
                  }}
                >
                  {p.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/80 truncate font-medium">
                    {p.displayName}
                    {p.id === localId && <span className="text-[10px] text-white/30 ml-1">(あなた)</span>}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {p.speakingState.isSpeaking ? '🟢 話し中' : p.isGuest ? 'ゲスト' : 'メンバー'}
                  </p>
                </div>
                {p.speakingState.isSpeaking && (
                  <div className="flex gap-[2px] items-end">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="w-[2px] bg-emerald-400/50 rounded-full"
                        style={{
                          height: `${6 + p.speakingState.volume * 8 + j * 2}px`,
                          maxHeight: '14px',
                          animation: `pulse 0.6s ease-in-out ${j * 0.1}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
