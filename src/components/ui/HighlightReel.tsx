/**
 * kokoro — Highlight Reel
 * セッション後のベストモーメント自動編集
 *
 * 反復366-375:
 * - セッションのピーク瞬間をカード化
 * - 感情グラフの可視化
 * - 参加者の貢献度サマリー
 * - SNSシェア可能なカード生成
 * = 「あの時楽しかった」を思い出す → リテンション
 */
'use client';

import { useMemo } from 'react';

interface HighlightMoment {
  type: string;
  description: string;
  emoji: string;
  timestamp: number;
  intensity: number;
}

interface ParticipantSummary {
  id: string;
  name: string;
  speakingMinutes: number;
  reactionsGiven: number;
  dominantEmotion: string;
  role: 'speaker' | 'listener' | 'entertainer' | 'connector';
}

interface HighlightReelProps {
  sessionDuration: number;    // minutes
  moments: HighlightMoment[];
  participants: ParticipantSummary[];
  flowPeakMinute: number;    // フローが最高だった分
  roomName: string;
  onClose: () => void;
  onShare: () => void;
}

const ROLE_LABELS: Record<ParticipantSummary['role'], { emoji: string; label: string }> = {
  speaker: { emoji: '🎤', label: 'スピーカー' },
  listener: { emoji: '👂', label: 'リスナー' },
  entertainer: { emoji: '🎉', label: '盛り上げ役' },
  connector: { emoji: '🤝', label: 'つなぎ役' },
};

export function HighlightReel({
  sessionDuration, moments, participants, flowPeakMinute,
  roomName, onClose, onShare,
}: HighlightReelProps) {
  const topMoments = useMemo(() =>
    moments.sort((a, b) => b.intensity - a.intensity).slice(0, 5),
    [moments]
  );

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto bg-[#0f0a1a]"
      style={{ animation: 'fade-in-up 0.5s ease-out' }}>

      {/* Header gradient */}
      <div className="absolute top-0 left-0 right-0 h-60 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.1), transparent)' }} />

      <div className="relative max-w-md mx-auto px-5 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-xs text-white/40 uppercase tracking-[0.3em]">session highlight</p>
          <h1 className="text-2xl font-bold text-white/90 mt-2">{roomName}</h1>
          <p className="text-sm text-white/40 mt-1">{sessionDuration}分のセッション</p>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-300">{participants.length}</p>
            <p className="text-[10px] text-white/30">参加者</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-300">{moments.length}</p>
            <p className="text-[10px] text-white/30">ハイライト</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">{flowPeakMinute}分</p>
            <p className="text-[10px] text-white/30">ピーク</p>
          </div>
        </div>

        {/* Top Moments */}
        {topMoments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs text-white/40 uppercase tracking-widest mb-4">ベストモーメント</h2>
            <div className="space-y-3">
              {topMoments.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/8">
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/80">{m.description}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{m.type}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <span className="text-xs text-violet-300 font-medium">#{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="mb-8">
          <h2 className="text-xs text-white/40 uppercase tracking-widest mb-4">参加者</h2>
          <div className="grid grid-cols-2 gap-3">
            {participants.map(p => {
              const role = ROLE_LABELS[p.role];
              return (
                <div key={p.id} className="p-3 rounded-2xl bg-white/5 border border-white/8 text-center">
                  <p className="text-lg">{role.emoji}</p>
                  <p className="text-sm text-white/80 font-medium mt-1 truncate">{p.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{role.label}</p>
                  <p className="text-[9px] text-white/20 mt-1">{p.speakingMinutes}分発話</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={onShare}
            className="flex-1 py-3 rounded-2xl bg-violet-500/15 border border-violet-400/20
              text-sm text-violet-300 font-medium hover:bg-violet-500/25
              active:scale-98 transition-all">
            📤 シェア
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/8
              text-sm text-white/50 hover:bg-white/10
              active:scale-98 transition-all">
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
