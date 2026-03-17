/**
 * kokoro — Lobby Page — 究極版
 * 「究極メタバース空間SNSの入口」
 * Supabase永続化対応
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_CATALOG, type AvatarDefinition, DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';
import { recordRoomVisit } from '@/data/roomHistory';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRooms, type RoomWithCount } from '@/hooks/useRooms';
import { RoomCreator, type RoomConfig } from '@/components/ui/RoomCreator';

// Fallback demo rooms（Supabase未接続時）
const FALLBACK_ROOMS: RoomWithCount[] = [
  { id: 'demo-1', name: 'コグニティブ・ラウンジ', participantCount: 4, max_participants: 20, vibe: '今朝の夢の話で盛り上がり中', emoji: '☕', is_active: true, theme: 'cosmos', host_id: null, created_at: '', phase: 'TRIGGER', density: 0.3 },
  { id: 'demo-2', name: 'エモーション・フィールド', participantCount: 2, max_participants: 20, vibe: '静かなひととき', emoji: '🌿', is_active: true, theme: 'nature', host_id: null, created_at: '', phase: 'SILENCE', density: 0 },
  { id: 'demo-3', name: 'グラビティ・コア', participantCount: 7, max_participants: 20, vibe: '大爆笑中！', emoji: '🎉', is_active: true, theme: 'neon', host_id: null, created_at: '', phase: 'GRAVITY', density: 0.6 },
  { id: 'demo-4', name: 'リジェネラティブ・スペース', participantCount: 1, max_participants: 20, vibe: '一人で佇み中', emoji: '🌙', is_active: true, theme: 'sunset', host_id: null, created_at: '', phase: 'SILENCE', density: 0 },
];

const PHASE_DISPLAY: Record<string, { label: string; icon: string; color: string; bg: string; pulse: string }> = {
  SILENCE: { label: '静寂', icon: '🌙', color: 'text-blue-300', bg: 'from-blue-500/15 to-indigo-500/8', pulse: 'rgba(99, 102, 241, 0.3)' },
  TRIGGER: { label: '発話', icon: '💫', color: 'text-amber-300', bg: 'from-amber-500/15 to-orange-500/8', pulse: 'rgba(245, 158, 11, 0.3)' },
  GRAVITY: { label: '熱狂', icon: '🔥', color: 'text-orange-400', bg: 'from-orange-500/15 to-red-500/10', pulse: 'rgba(239, 68, 68, 0.3)' },
};

export default function LobbyPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { profile, updateProfile } = useProfile(user?.id);
  const { rooms: supabaseRooms, loading: roomsLoading } = useRooms();
  const rooms = supabaseRooms.length > 0 ? supabaseRooms : FALLBACK_ROOMS;
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [step, setStep] = useState<'avatar' | 'room'>('avatar');
  const [joinProgress, setJoinProgress] = useState(0);
  const [showRoomCreator, setShowRoomCreator] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('kokoro_display_name');
    const savedAvatar = localStorage.getItem('kokoro_avatar_id');
    if (savedName) setDisplayName(savedName);
    if (savedAvatar) setSelectedAvatarId(savedAvatar);
    if (!savedName) {
      const adjectives = ['静かな', '元気な', '優しい', '面白い', '不思議な', '光る', '夢見る'];
      const nouns = ['猫', '犬', '鳥', 'うさぎ', 'パンダ', 'きつね', 'くじら'];
      setDisplayName(
        `${adjectives[Math.floor(Date.now() % adjectives.length)]}${nouns[Math.floor((Date.now() / 7) % nouns.length)]}`
      );
    }
  }, []);

  const handleSelectAvatar = useCallback((avatar: AvatarDefinition) => {
    setSelectedAvatarId(avatar.id);
    localStorage.setItem('kokoro_avatar_id', avatar.id);
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

  const handleAvatarConfirm = useCallback(() => {
    localStorage.setItem('kokoro_display_name', displayName);
    setStep('room');
  }, [displayName]);

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      setIsJoining(roomId);
      if (navigator.vibrate) navigator.vibrate([20, 50, 30]);
      localStorage.setItem('kokoro_display_name', displayName);
      const room = rooms.find((r) => r.id === roomId);
      recordRoomVisit(roomId, room?.name ?? roomId, 'cosmos');
      const params = new URLSearchParams(window.location.search);
      const isGuest = params.get('guest') === 'true';
      const guestParam = isGuest ? '&guest=true' : '';

      // Animated join progress
      let p = 0;
      const interval = setInterval(() => {
        p += 0.03 + Math.random() * 0.02;
        setJoinProgress(Math.min(p, 0.95));
        if (p >= 0.95) clearInterval(interval);
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        setJoinProgress(1);
        router.push(`/space?room=${roomId}&name=${encodeURIComponent(displayName)}${guestParam}`);
      }, 800);
    },
    [router, displayName, rooms]
  );

  const handleAutoJoin = useCallback(() => {
    const best = [...rooms]
      .filter((r) => r.participantCount < r.max_participants)
      .sort((a, b) => b.participantCount - a.participantCount)[0];
    if (best) handleJoinRoom(best.id);
  }, [rooms, handleJoinRoom]);

  const selectedAvatar = AVATAR_CATALOG.find((a) => a.id === selectedAvatarId) ?? AVATAR_CATALOG[0];

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white overflow-hidden">
      {/* Background ambient — dynamic based on selection */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] transition-all duration-1000"
          style={{ backgroundColor: selectedAvatar.accentColor + '12' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/6 rounded-full blur-[150px]" />
        {/* Animated grid dots */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between safe-top">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 
            flex items-center justify-center shadow-lg shadow-violet-500/20
            group-hover:shadow-xl group-hover:shadow-violet-500/30 transition-all">
            <span className="text-sm">🫧</span>
          </div>
          <span className="text-lg font-bold bg-linear-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            kokoro
          </span>
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('avatar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${step === 'avatar' ? 'bg-violet-500/15 text-violet-300 border border-violet-400/20' : 'text-white/30 hover:text-white/50'}`}
          >
            <span className="text-[10px]">1</span> アバター
          </button>
          <div className="w-4 h-px bg-white/10" />
          <button
            onClick={() => step === 'room' || displayName.trim() ? setStep('room') : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${step === 'room' ? 'bg-violet-500/15 text-violet-300 border border-violet-400/20' : 'text-white/30 hover:text-white/50'}`}
          >
            <span className="text-[10px]">2</span> 空間
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-20">
        {step === 'avatar' ? (
          /* ===== Step 1: Avatar Selection ===== */
          <div style={{ animation: 'fade-in-up 0.5s ease-out' }}>
            <div className="text-center mb-8 mt-2">
              <h1 className="text-2xl font-bold mb-2">アバターを選ぶ</h1>
              <p className="text-sm text-white/40">空間でのあなたの「姿」を決めよう</p>
            </div>

            {/* Selected avatar hero preview */}
            <div className="mb-8 flex items-center justify-center">
              <div
                className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl
                  border-2 shadow-2xl transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, ${selectedAvatar.gradient[0]}30, ${selectedAvatar.gradient[1]}15)`,
                  borderColor: selectedAvatar.accentColor + '40',
                  boxShadow: `0 12px 40px ${selectedAvatar.accentColor}25, 0 0 0 6px ${selectedAvatar.accentColor}08`,
                }}
              >
                {selectedAvatar.personality.charAt(0)}
              </div>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-8">
              {AVATAR_CATALOG.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`
                      relative rounded-2xl p-3 pt-4 border transition-all duration-300
                      active:scale-90 touch-manipulation text-center
                      ${isSelected
                        ? 'border-violet-400/40 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                        : 'border-white/5 bg-white/3 hover:bg-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 
                        flex items-center justify-center shadow-md">
                        <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    <div
                      className="w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center border transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${avatar.gradient[0]}30, ${avatar.gradient[1]}15)`,
                        borderColor: isSelected ? avatar.accentColor + '50' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-xl">{avatar.personality.split(' ')[0]}</span>
                    </div>

                    <h3 className="font-semibold text-xs text-white/90">{avatar.name}</h3>
                    <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{avatar.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Name input */}
            <div className="mb-6">
              <label className="block text-xs text-white/40 mb-2 ml-1 font-medium">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="あなたの名前"
                maxLength={16}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white/80
                  focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10
                  placeholder:text-white/20 transition-all"
              />
              <p className="text-[10px] text-white/20 mt-1.5 ml-1">{displayName.length}/16文字</p>
            </div>

            {/* Continue button */}
            <button
              onClick={handleAvatarConfirm}
              disabled={!displayName.trim()}
              className="w-full py-4 rounded-2xl font-semibold text-lg
                bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40
                transition-all duration-300 active:scale-95 touch-manipulation
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              このアバターで入る →
            </button>
          </div>
        ) : (
          /* ===== Step 2: Room Selection ===== */
          <div style={{ animation: 'fade-in-up 0.5s ease-out' }}>
            {/* Header with avatar badge */}
            <div className="flex items-center justify-between mb-6 mt-2">
              <div>
                <h1 className="text-2xl font-bold mb-1">空間を選ぶ</h1>
                <p className="text-sm text-white/40">声とアバターで繋がる場所</p>
              </div>
              <button
                onClick={() => setStep('avatar')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10
                  hover:bg-white/8 active:scale-95 transition-all text-sm"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${selectedAvatar.gradient[0]}50, ${selectedAvatar.gradient[1]}30)` }}
                >
                  {selectedAvatar.personality.split(' ')[0]}
                </div>
                <span className="text-white/60">{displayName}</span>
              </button>
            </div>

            {/* Quick-join hero */}
            <button
              onClick={handleAutoJoin}
              className="w-full mb-3 py-5 rounded-2xl font-semibold text-lg
                bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40
                transition-all duration-300 active:scale-95 touch-manipulation
                flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <span className="relative z-10">🚀 おすすめ空間にダイブ</span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent
                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            {/* Create Room Button */}
            <button
              onClick={() => setShowRoomCreator(true)}
              className="w-full mb-6 py-3.5 rounded-2xl font-medium text-sm
                bg-white/5 border border-white/10 text-white/50
                hover:bg-white/8 hover:text-white/70
                transition-all duration-300 active:scale-95 touch-manipulation
                flex items-center justify-center gap-2"
            >
              ✨ ルームを作る
            </button>

            {/* Room cards */}
            <div className="space-y-3">
              {rooms.map((room, index) => {
                const roomPhase = room.phase ?? 'SILENCE';
                const phaseInfo = PHASE_DISPLAY[roomPhase] ?? PHASE_DISPLAY.SILENCE;
                const isJoiningThis = isJoining === room.id;
                const isFull = room.participantCount >= room.max_participants;
                const occupancyPercent = (room.participantCount / room.max_participants) * 100;
                const isActive = roomPhase !== 'SILENCE';

                return (
                  <button
                    key={room.id}
                    onClick={() => !isFull && handleJoinRoom(room.id)}
                    disabled={isFull || isJoining !== null}
                    className={`w-full text-left rounded-2xl p-5 border transition-all duration-300
                      active:scale-[0.97] touch-manipulation group backdrop-blur-sm relative overflow-hidden
                      ${isFull ? 'opacity-40 cursor-not-allowed' : ''}
                      ${isJoiningThis ? 'scale-[0.97] opacity-60' : ''}
                      bg-white/3 hover:bg-white/5 border-white/6 hover:border-white/12
                    `}
                    style={{ animationDelay: `${index * 80}ms`, animation: 'fade-in-up 0.5s ease-out both' }}
                  >
                    {/* Live pulse background for active rooms */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 20% 50%, ${phaseInfo.pulse}, transparent 70%)`,
                          animation: 'pulse 3s ease-in-out infinite',
                        }}
                      />
                    )}

                    <div className="relative flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Room emoji with gradient background */}
                        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${phaseInfo.bg} 
                          flex items-center justify-center border border-white/5`}>
                          <span className="text-xl">{room.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white/90 text-[15px]">{room.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs ${phaseInfo.color} font-medium`}>{phaseInfo.icon} {phaseInfo.label}</span>
                            {isActive && (
                              <span className="text-[10px] text-white/30 italic">{room.vibe}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Stacked avatar circles */}
                        <div className="flex -space-x-1.5">
                          {Array.from({ length: Math.min(room.participantCount, 4) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border-2 border-[#0f0a1a] flex items-center justify-center text-[8px] font-bold text-white/80"
                              style={{
                                background: `linear-gradient(135deg, ${AVATAR_CATALOG[i % AVATAR_CATALOG.length].gradient[0]}90, ${AVATAR_CATALOG[i % AVATAR_CATALOG.length].gradient[1]}70)`,
                              }}
                            >
                              {AVATAR_CATALOG[i % AVATAR_CATALOG.length].name.charAt(0)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-white/40 font-medium tabular-nums">
                          {room.participantCount}/{room.max_participants}
                        </span>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${occupancyPercent}%`,
                          background: occupancyPercent > 60
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : occupancyPercent > 30
                              ? 'linear-gradient(90deg, #8b5cf6, #f59e0b)'
                              : 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
                        }}
                      />
                    </div>

                    {/* Join progress */}
                    {isJoiningThis && (
                      <div className="mt-3 relative">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-100"
                            style={{ width: `${joinProgress * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-violet-300 mt-1.5 text-center">空間に接続中...</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create room */}
            <div className="mt-8 text-center">
              <button
                onClick={() => handleJoinRoom(`new-${Date.now()}`)}
                className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 
                  transition-all px-4 py-2 rounded-xl hover:bg-white/3 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="7" y1="2" x2="7" y2="12" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                </svg>
                新しい空間を作る
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Joining transition overlay — cinematic */}
      {isJoining && joinProgress > 0.5 && (
        <div
          className="fixed inset-0 z-50 bg-[#0f0a1a] flex items-center justify-center"
          style={{ animation: 'fade-in-up 0.5s ease-out' }}
        >
          <div className="text-center">
            <div className="relative w-28 h-28 mx-auto mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-violet-500/20"
                  style={{
                    animation: `cinematic-ring 2s ease-out ${i * 0.3}s infinite`,
                    opacity: 0,
                  }}
                />
              ))}
              <div className="absolute inset-4 rounded-full bg-linear-to-br from-violet-500/30 to-fuchsia-500/20 blur-lg animate-pulse" />
              <div className="absolute inset-8 rounded-full bg-linear-to-br from-violet-400/40 to-fuchsia-400/30 blur-md animate-pulse" 
                style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-white/50 text-sm font-medium tracking-wider">空間に接続中</p>
            <div className="w-32 h-1 bg-white/5 rounded-full mx-auto mt-3 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-100"
                style={{ width: `${joinProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Room Creator Overlay */}
      {showRoomCreator && (
        <RoomCreator
          onCreateRoom={(_config: RoomConfig) => {
            setShowRoomCreator(false);
            handleJoinRoom('custom-' + Date.now());
          }}
          onClose={() => setShowRoomCreator(false)}
        />
      )}
    </div>
  );
}
