/**
 * cocoro — Avatar Page
 * アバター管理・カスタマイズ画面
 * 所持アバターの確認、選択、進化データの表示
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_CATALOG, type AvatarDefinition, DEFAULT_AVATAR_ID, getAvatarById } from '@/data/avatarCatalog';
import { spatialMemory, type AvatarEvolution } from '@/engine/memory/SpatialMemory';

const LEVEL_THRESHOLDS = [0, 300, 900, 1800]; // seconds of speech
function getAuraLevel(seconds: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (seconds >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

const LEVEL_LABELS = ['新参者', '常連', '語り部', '伝説'];

export default function AvatarPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(DEFAULT_AVATAR_ID);
  const [evolutionData, setEvolutionData] = useState<Record<string, AvatarEvolution>>({});

  useEffect(() => {
    const saved = localStorage.getItem('cocoro_avatar_id');
    if (saved) setSelectedId(saved);
    // Load evolution data for all avatars
    (async () => {
      try {
        await spatialMemory.open();
        const data: Record<string, AvatarEvolution> = {};
        for (const avatar of AVATAR_CATALOG) {
          const evo = await spatialMemory.loadAvatarEvolution(avatar.id);
          if (evo) data[avatar.id] = evo;
        }
        setEvolutionData(data);
      } catch {
        // IndexedDB not available
      }
    })();
  }, []);

  const handleSelect = useCallback((avatar: AvatarDefinition) => {
    setSelectedId(avatar.id);
    localStorage.setItem('cocoro_avatar_id', avatar.id);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const selectedAvatar = getAvatarById(selectedId) ?? AVATAR_CATALOG[0];

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3
        bg-[#0f0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white/80 transition-colors p-2 -ml-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M13 4L7 10L13 16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-white/90">アバター</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Selected avatar hero */}
        <div className="mb-8 text-center">
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl
              border-2 shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${selectedAvatar.gradient[0]}30, ${selectedAvatar.gradient[1]}15)`,
              borderColor: selectedAvatar.accentColor + '40',
              boxShadow: `0 8px 32px ${selectedAvatar.accentColor}20`,
            }}
          >
            {selectedAvatar.personality.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white/90">{selectedAvatar.name}</h2>
          <p className="text-sm text-white/40 mt-1">{selectedAvatar.description}</p>

          {/* Evolution info */}
          {evolutionData[selectedId] && (() => {
            const evo = evolutionData[selectedId];
            const level = getAuraLevel(evo.totalSpeechSeconds);
            const mins = Math.floor(evo.totalSpeechSeconds / 60);
            return (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-white/3 border border-white/5 inline-block">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/50">
                    発話時間: <span className="text-white/80 font-medium">{mins}分</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="text-xs">
                    <span className="text-white/50">オーラLv.</span>
                    <span className="text-white/80 font-medium ml-1">{level}</span>
                    <span className="text-white/40 ml-1">({LEVEL_LABELS[level]})</span>
                  </div>
                </div>
                {evo.voiceSignatureHex && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: evo.voiceSignatureHex }} />
                    <span className="text-[10px] text-white/30">声紋カラー</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Avatar grid */}
        <h3 className="text-xs text-white/40 font-medium tracking-wider uppercase mb-3">
          アバター一覧
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {AVATAR_CATALOG.map((avatar) => {
            const isSelected = avatar.id === selectedId;
            const evo = evolutionData[avatar.id];
            const level = evo ? getAuraLevel(evo.totalSpeechSeconds) : 0;

            return (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar)}
                className={`relative p-4 rounded-2xl border text-left transition-all active:scale-95
                  ${isSelected
                    ? 'bg-white/8 border-white/20 shadow-lg'
                    : 'bg-white/3 border-white/5 hover:bg-white/5'
                  }`}
                style={isSelected ? {
                  borderColor: avatar.accentColor + '40',
                  boxShadow: `0 4px 20px ${avatar.accentColor}15`,
                } : undefined}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full
                    bg-emerald-500/80 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 5L4.5 7.5L8 3" />
                    </svg>
                  </div>
                )}

                <div
                  className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${avatar.gradient[0]}40, ${avatar.gradient[1]}20)`,
                  }}
                >
                  {avatar.personality.charAt(0)}
                </div>
                <p className="text-sm font-medium text-white/80">{avatar.name}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{avatar.personality}</p>

                {/* Aura level badge */}
                {level > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-white/5 border border-white/8 text-[9px] text-white/40">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: avatar.accentColor }} />
                    Lv.{level}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
