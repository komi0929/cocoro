/**
 * kokoro — Profile Card
 * アバタータップでプロフィール情報をオーバーレイ表示
 * 
 * 思想: 空間内でアイデンティティを「知る」= 緩い繋がりの第一歩
 * 名前・性格・参加歴 → 「この人面白そう」→ 会話が生まれる
 */
'use client';

import { useState, useCallback } from 'react';
import { getAvatarById } from '@/data/avatarCatalog';

interface ProfileCardProps {
  participantId: string;
  displayName: string;
  avatarId: string;
  isSpeaking: boolean;
  isLocal: boolean;
  onClose: () => void;
}

export function ProfileCard({
  displayName,
  avatarId,
  isSpeaking,
  isLocal,
  onClose,
}: ProfileCardProps) {
  const avatar = getAvatarById(avatarId);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={`relative w-full max-w-xs rounded-3xl overflow-hidden
          bg-white/5 backdrop-blur-2xl border border-white/10
          shadow-2xl shadow-black/30
          ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div
          className="h-20 relative"
          style={{
            background: avatar
              ? `linear-gradient(135deg, ${avatar.accentColor}40, ${avatar.accentColor}10)`
              : 'linear-gradient(135deg, #8b5cf640, #8b5cf610)',
          }}
        >
          {/* Avatar icon */}
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl
              flex items-center justify-center text-2xl
              bg-white/10 backdrop-blur-md border border-white/15
              shadow-lg"
            style={{
              borderColor: avatar ? avatar.accentColor + '40' : '#8b5cf640',
            }}
          >
            {avatar?.personality?.charAt(0) ?? '🫧'}
          </div>
        </div>

        {/* Body */}
        <div className="pt-10 pb-6 px-6 text-center">
          <h3 className="text-lg font-bold text-white/90">{displayName}</h3>

          {avatar && (
            <p className="text-xs text-white/40 mt-1">{avatar.description}</p>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {isSpeaking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                発話中
              </span>
            )}
            {isLocal && (
              <span className="inline-flex px-2 py-0.5 rounded-full
                bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px]">
                あなた
              </span>
            )}
          </div>

          {/* Tags */}
          {avatar && avatar.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {avatar.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8
                    text-[10px] text-white/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Personality */}
          {avatar && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
              <p className="text-[11px] text-white/30 leading-relaxed">
                {avatar.personality}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
