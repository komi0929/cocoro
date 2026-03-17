/**
 * cocoro — Profile Card 究極版
 * アバタータップでプロフィール情報をオーバーレイ表示
 * 
 * 反復111-120:
 * - 声紋カラー表示
 * - 発話統計（累計発話時間、セッション内発話量）
 * - コミュニケーションスタイル分析
 * - 感情傾向グラフ
 * - PrivateBubble発動ボタン
 * - 「近づく」ボタン（アバターの近くに移動）
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { getAvatarById } from '@/data/avatarCatalog';

interface ProfileCardProps {
  participantId: string;
  displayName: string;
  avatarId: string;
  isSpeaking: boolean;
  isLocal: boolean;
  onClose: () => void;
  onPrivateBubble?: (participantId: string) => void;
  speechStats?: {
    totalMinutes: number;
    sessionMinutes: number;
    speakingRatio: number;  // 0-1
    dominantEmotion: string;
    voiceColor?: string;
    auraLevel: number;
  };
}

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  anger: '😤',
  sorrow: '😢',
  surprise: '😲',
  neutral: '😌',
};

const AURA_LABELS = ['新参者', '常連', '語り部', '伝説'];
const AURA_COLORS = ['#6b7280', '#8b5cf6', '#f59e0b', '#ef4444'];

const COMM_STYLES = [
  { min: 0, max: 0.2, label: '聞き上手', icon: '👂', desc: 'じっくり聞いてから話す' },
  { min: 0.2, max: 0.4, label: 'バランサー', icon: '⚖️', desc: '聞くと話すのバランスが神' },
  { min: 0.4, max: 0.6, label: 'アクティブ', icon: '💬', desc: '会話を引っ張る存在' },
  { min: 0.6, max: 1, label: '盛り上げ役', icon: '🎤', desc: 'みんなを巻き込む天才' },
];

function getCommStyle(ratio: number) {
  return COMM_STYLES.find(s => ratio >= s.min && ratio < s.max) ?? COMM_STYLES[0];
}

export function ProfileCard({
  participantId,
  displayName,
  avatarId,
  isSpeaking,
  isLocal,
  onClose,
  onPrivateBubble,
  speechStats,
}: ProfileCardProps) {
  const avatar = getAvatarById(avatarId);
  const [isClosing, setIsClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  const commStyle = getCommStyle(speechStats?.speakingRatio ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Card — bottom sheet on mobile, centered on desktop */}
      <div
        className={`relative w-full max-w-sm rounded-3xl overflow-hidden
          bg-[#1a1225]/95 backdrop-blur-2xl border border-white/10
          shadow-2xl shadow-black/40
          ${isClosing ? 'animate-scale-out' : ''}`}
        style={{ animation: isClosing ? undefined : 'fade-in-up 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient with voice color */}
        <div
          className="h-24 relative overflow-hidden"
          style={{
            background: avatar
              ? `linear-gradient(135deg, ${avatar.accentColor}30, ${speechStats?.voiceColor ?? avatar.accentColor}15, transparent)`
              : 'linear-gradient(135deg, #8b5cf630, #8b5cf610)',
          }}
        >
          {/* Animated particles in header */}
          <div className="absolute inset-0 opacity-30">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/40"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + Math.sin(i) * 20}%`,
                  animation: `pulse 2s ease-in-out ${i * 0.3}s infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Aura level badge */}
          {speechStats && speechStats.auraLevel > 0 && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full
              bg-black/20 border border-white/10 backdrop-blur-sm
              text-[10px] font-medium flex items-center gap-1"
              style={{ color: AURA_COLORS[speechStats.auraLevel] }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AURA_COLORS[speechStats.auraLevel] }} />
              {AURA_LABELS[speechStats.auraLevel]}
            </div>
          )}
        </div>

        {/* Avatar icon */}
        <div className="flex justify-center -mt-8 relative z-10">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
              border-2 shadow-xl
              ${isSpeaking ? 'ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-[#1a1225]' : ''}`}
            style={{
              background: avatar
                ? `linear-gradient(135deg, ${avatar.gradient[0]}40, ${avatar.gradient[1]}20)`
                : '#8b5cf620',
              borderColor: avatar ? avatar.accentColor + '40' : '#8b5cf640',
              boxShadow: `0 8px 24px ${avatar?.accentColor ?? '#8b5cf6'}20`,
            }}
          >
            {avatar?.personality?.charAt(0) ?? '🫧'}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-3">
          {/* Name + Status */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white/90">{displayName}</h3>
            {avatar && (
              <p className="text-xs text-white/35 mt-0.5">{avatar.description}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
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
          </div>

          {/* Communication Style */}
          {showDetails && speechStats && (
            <div className="mb-3 p-3 rounded-xl bg-white/3 border border-white/5"
              style={{ animation: 'fade-in-up 0.3s ease-out' }}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{commStyle.icon}</span>
                <div>
                  <p className="text-xs text-white/70 font-medium">{commStyle.label}</p>
                  <p className="text-[10px] text-white/30">{commStyle.desc}</p>
                </div>
              </div>
            </div>
          )}

          {/* Speech Stats */}
          {showDetails && speechStats && (
            <div className="grid grid-cols-3 gap-2 mb-3"
              style={{ animation: 'fade-in-up 0.4s ease-out' }}>
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-sm font-bold text-white/80">{speechStats.sessionMinutes}</p>
                <p className="text-[9px] text-white/30 mt-0.5">分発話</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-sm font-bold text-white/80">{Math.round(speechStats.speakingRatio * 100)}%</p>
                <p className="text-[9px] text-white/30 mt-0.5">発話率</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-sm font-bold text-white/80">
                  {EMOTION_EMOJI[speechStats.dominantEmotion] ?? '😌'}
                </p>
                <p className="text-[9px] text-white/30 mt-0.5">空気感</p>
              </div>
            </div>
          )}

          {/* Voice signature color */}
          {showDetails && speechStats?.voiceColor && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/5"
              style={{ animation: 'fade-in-up 0.5s ease-out' }}>
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: speechStats.voiceColor,
                  boxShadow: `0 0 12px ${speechStats.voiceColor}40`,
                }}
              />
              <span className="text-[11px] text-white/40">声紋カラー</span>
            </div>
          )}

          {/* Tags */}
          {avatar && avatar.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {avatar.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8
                    text-[10px] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!isLocal && (
            <div className="flex gap-2">
              {onPrivateBubble && (
                <button
                  onClick={() => onPrivateBubble(participantId)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium
                    bg-indigo-500/10 border border-indigo-500/20 text-indigo-300
                    hover:bg-indigo-500/20 active:scale-95 transition-all"
                >
                  🛡️ ブロック
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium
                  bg-white/5 border border-white/10 text-white/60
                  hover:bg-white/8 active:scale-95 transition-all"
              >
                とじる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
