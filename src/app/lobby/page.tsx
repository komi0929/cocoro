/**
 * kokoro — Lobby Page
 * 「究極メタバース空間SNSの入口」
 * アバター選択 + ルーム選択 + プロフィール設定
 * 
 * 思想: 「空間に入る前のわくわく感」を演出する
 * - アバターを選ぶ = 自分のアイデンティティを選ぶ
 * - ルームを選ぶ = 居場所を選ぶ
 * - 名前を決める = 自分を名乗る
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RoomInfo } from '@/engine/network/SyncProtocol';
import { AVATAR_CATALOG, type AvatarDefinition, DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';
import { recordRoomVisit } from '@/data/roomHistory';

// Demo rooms
const DEMO_ROOMS: RoomInfo[] = [
  { id: 'demo-1', name: '焚き火のそば', participantCount: 4, maxParticipants: 20, phase: 'TRIGGER', density: 0.3 },
  { id: 'demo-2', name: '月明かりの広場', participantCount: 2, maxParticipants: 20, phase: 'SILENCE', density: 0 },
  { id: 'demo-3', name: '星降る丘', participantCount: 7, maxParticipants: 20, phase: 'GRAVITY', density: 0.6 },
  { id: 'demo-4', name: '深海のラウンジ', participantCount: 1, maxParticipants: 20, phase: 'SILENCE', density: 0 },
];

const PHASE_DISPLAY: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  SILENCE: { label: '静寂', icon: '🌙', color: 'text-blue-300', bg: 'from-blue-500/10 to-indigo-500/5' },
  TRIGGER: { label: '発話', icon: '💫', color: 'text-amber-300', bg: 'from-amber-500/10 to-orange-500/5' },
  GRAVITY: { label: '熱狂', icon: '🔥', color: 'text-orange-400', bg: 'from-orange-500/10 to-red-500/5' },
};

export default function LobbyPage() {
  const router = useRouter();
  const [rooms] = useState<RoomInfo[]>(DEMO_ROOMS);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [step, setStep] = useState<'avatar' | 'room'>('avatar');

  // Load saved preferences
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

  // Save avatar selection
  const handleSelectAvatar = useCallback((avatar: AvatarDefinition) => {
    setSelectedAvatarId(avatar.id);
    localStorage.setItem('kokoro_avatar_id', avatar.id);
  }, []);

  // Continue to room selection
  const handleAvatarConfirm = useCallback(() => {
    localStorage.setItem('kokoro_display_name', displayName);
    setStep('room');
  }, [displayName]);

  // Join room
  const handleJoinRoom = useCallback(
    (roomId: string) => {
      setIsJoining(roomId);
      localStorage.setItem('kokoro_display_name', displayName);
      // Record visit history
      const room = rooms.find((r) => r.id === roomId);
      recordRoomVisit(roomId, room?.name ?? roomId, 'cosmos');
      setTimeout(() => {
        router.push(`/space?room=${roomId}&name=${encodeURIComponent(displayName)}`);
      }, 600);
    },
    [router, displayName, rooms]
  );

  // Auto-join best room
  const handleAutoJoin = useCallback(() => {
    const best = [...rooms]
      .filter((r) => r.participantCount < r.maxParticipants)
      .sort((a, b) => b.participantCount - a.participantCount)[0];
    if (best) handleJoinRoom(best.id);
  }, [rooms, handleJoinRoom]);

  const selectedAvatar = AVATAR_CATALOG.find((a) => a.id === selectedAvatarId) ?? AVATAR_CATALOG[0];

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white overflow-hidden">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[150px] transition-colors duration-1000"
          style={{ backgroundColor: selectedAvatar.accentColor + '15' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/8 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-sm">🫧</span>
          </div>
          <span className="text-lg font-bold bg-linear-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            kokoro
          </span>
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 'avatar' ? 'bg-violet-400' : 'bg-white/20'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 'room' ? 'bg-violet-400' : 'bg-white/20'}`} />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-16">
        {step === 'avatar' ? (
          /* ===== Step 1: Avatar Selection ===== */
          <div className="animate-fade-in-up">
            <div className="text-center mb-8 mt-4">
              <h1 className="text-2xl font-bold mb-2">アバターを選ぶ</h1>
              <p className="text-sm text-white/40">空間でのあなたの「姿」を決めよう</p>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {AVATAR_CATALOG.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`
                      relative rounded-2xl p-4 pt-6 border transition-all duration-300
                      active:scale-95 touch-manipulation text-center
                      ${isSelected
                        ? 'border-violet-400/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                        : 'border-white/5 bg-white/3 hover:bg-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    {/* Avatar preview circle */}
                    <div
                      className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center border"
                      style={{
                        background: `linear-gradient(135deg, ${avatar.gradient[0]}30, ${avatar.gradient[1]}15)`,
                        borderColor: isSelected ? avatar.accentColor + '50' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-2xl">{avatar.personality.split(' ')[0]}</span>
                    </div>

                    <h3 className="font-semibold text-sm text-white/90">{avatar.name}</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">{avatar.description}</p>

                    {/* Tags */}
                    <div className="flex gap-1 mt-2 justify-center flex-wrap">
                      {avatar.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Name input */}
            <div className="mb-6">
              <label className="block text-xs text-white/40 mb-2 ml-1">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="あなたの名前"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80
                  focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                  placeholder:text-white/20"
              />
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
          <div className="animate-fade-in-up">
            {/* Selected avatar badge */}
            <div className="flex items-center justify-between mb-8 mt-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">空間を選ぶ</h1>
                <p className="text-sm text-white/40">声とアバターで繋がる場所</p>
              </div>
              <button
                onClick={() => setStep('avatar')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                  hover:bg-white/8 transition-all text-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: `linear-gradient(135deg, ${selectedAvatar.gradient[0]}50, ${selectedAvatar.gradient[1]}30)` }}
                >
                  {selectedAvatar.personality.split(' ')[0]}
                </div>
                <span className="text-white/60">{displayName}</span>
              </button>
            </div>

            {/* Auto-join hero */}
            <button
              onClick={handleAutoJoin}
              className="w-full mb-6 py-4 rounded-2xl font-semibold text-lg
                bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40
                transition-all duration-300 active:scale-95 touch-manipulation
                flex items-center justify-center gap-2"
            >
              🚀 おすすめ空間にダイブ
            </button>

            {/* Room cards */}
            <div className="space-y-3">
              {rooms.map((room) => {
                const phaseInfo = PHASE_DISPLAY[room.phase] ?? PHASE_DISPLAY.SILENCE;
                const isJoiningThis = isJoining === room.id;
                const isFull = room.participantCount >= room.maxParticipants;
                const occupancyPercent = (room.participantCount / room.maxParticipants) * 100;

                return (
                  <button
                    key={room.id}
                    onClick={() => !isFull && handleJoinRoom(room.id)}
                    disabled={isFull || isJoining !== null}
                    className={`w-full text-left rounded-2xl p-5 border transition-all duration-300
                      active:scale-[0.98] touch-manipulation group backdrop-blur-sm
                      ${isFull ? 'opacity-40 cursor-not-allowed' : ''}
                      ${isJoiningThis ? 'scale-[0.98] opacity-60' : ''}
                      bg-white/3 hover:bg-white/5 border-white/5 hover:border-white/10
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Phase icon with gradient background */}
                        <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${phaseInfo.bg} flex items-center justify-center`}>
                          <span className="text-lg">{phaseInfo.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white/90">{room.name}</h3>
                          <span className={`text-xs ${phaseInfo.color}`}>{phaseInfo.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Avatar stack */}
                        <div className="flex -space-x-1.5">
                          {Array.from({ length: Math.min(room.participantCount, 4) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border-2 border-[#0f0a1a]"
                              style={{
                                background: `linear-gradient(135deg, ${AVATAR_CATALOG[i % AVATAR_CATALOG.length].gradient[0]}, ${AVATAR_CATALOG[i % AVATAR_CATALOG.length].gradient[1]})`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-white/50">
                          {room.participantCount}/{room.maxParticipants}
                        </span>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
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

                    {/* Density indicator */}
                    {room.density > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: Math.ceil(room.density * 5) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-amber-400/60 rounded-full"
                              style={{ height: `${6 + i * 2}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-white/30">盛り上がり中</span>
                      </div>
                    )}

                    {isJoiningThis && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                        <span className="text-xs text-violet-300">接続中...</span>
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
                className="text-sm text-white/30 hover:text-white/60 transition-colors
                  underline decoration-dotted underline-offset-4"
              >
                + 新しい空間を作る
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Joining transition overlay */}
      {isJoining && (
        <div className="fixed inset-0 z-50 bg-[#0f0a1a] animate-warp-in flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-violet-500/20"
                  style={{
                    animation: `cinematic-ring 2s ease-out ${i * 0.2}s infinite`,
                    opacity: 0,
                  }}
                />
              ))}
              <div className="absolute inset-4 rounded-full bg-linear-to-br from-violet-500/30 to-fuchsia-500/20 blur-md animate-pulse" />
            </div>
            <p className="text-white/40 text-xs tracking-[0.2em] uppercase">空間に接続中</p>
          </div>
        </div>
      )}
    </div>
  );
}
