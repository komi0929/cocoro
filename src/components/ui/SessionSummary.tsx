/**
 * kokoro — Session Summary Card (UI)
 * セッション終了後のまとめ画面
 *
 * セッションの振り返り + シェア促進 + 次回への動機付け
 * = 「遊んで楽しかった」を形にして持ち帰れる
 */
'use client';

import { useMemo } from 'react';

interface SessionData {
  durationMinutes: number;
  participantCount: number;
  topKeywords: Array<{ word: string; count: number }>;
  myTalkTimePercent: number;
  reactionsReceived: number;
  levelBefore: number;
  levelAfter: number;
  xpGained: number;
  moodSummary: string;
  bestMoment: string | null;
  streakDays: number;
}

interface SessionSummaryProps {
  data: SessionData;
  onClose: () => void;
  onShare: () => void;
}

export function SessionSummary({ data, onClose, onShare }: SessionSummaryProps) {
  const leveledUp = data.levelAfter > data.levelBefore;

  const durationLabel = useMemo(() => {
    if (data.durationMinutes < 1) return '1分未満';
    if (data.durationMinutes < 60) return `${Math.floor(data.durationMinutes)}分`;
    return `${Math.floor(data.durationMinutes / 60)}時間${Math.floor(data.durationMinutes % 60)}分`;
  }, [data.durationMinutes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0a0612]/95">
      <div className="w-full max-w-sm bg-[#1a1225]/80 backdrop-blur-2xl rounded-3xl
        border border-white/10 overflow-hidden"
        style={{ animation: 'fade-in-up 0.5s ease-out' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-white/30 text-xs mb-1">セッション終了</p>
          <h2 className="text-lg font-bold text-white/90">おつかれさま！ ☕</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-0.5 px-5 mb-4">
          {[
            { label: '時間', value: durationLabel, emoji: '⏱️' },
            { label: '参加者', value: `${data.participantCount}人`, emoji: '👥' },
            { label: 'リアクション', value: `${data.reactionsReceived}`, emoji: '👏' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-sm">{stat.emoji}</p>
              <p className="text-sm font-bold text-white/80 mt-0.5">{stat.value}</p>
              <p className="text-[8px] text-white/25">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Talk time */}
        <div className="px-5 mb-3">
          <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
            <span>あなたの発話量</span>
            <span>{data.myTalkTimePercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-violet-400/40 transition-all duration-1000"
              style={{ width: `${data.myTalkTimePercent}%` }} />
          </div>
        </div>

        {/* Keywords */}
        {data.topKeywords.length > 0 && (
          <div className="px-5 mb-3">
            <p className="text-[9px] text-white/20 mb-1.5">今日のキーワード</p>
            <div className="flex flex-wrap gap-1">
              {data.topKeywords.slice(0, 5).map(k => (
                <span key={k.word} className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] text-white/30">
                  #{k.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* XP / Level */}
        <div className="mx-5 mb-4 p-3 rounded-2xl bg-violet-500/5 border border-violet-400/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">+{data.xpGained} XP</span>
            {leveledUp ? (
              <span className="text-xs text-amber-300 font-bold">
                🎉 Level {data.levelAfter}!
              </span>
            ) : (
              <span className="text-[10px] text-white/20">Lv.{data.levelAfter}</span>
            )}
          </div>
        </div>

        {/* Streak */}
        {data.streakDays > 1 && (
          <div className="mx-5 mb-4 text-center">
            <span className="text-xs text-orange-300/60">🔥 {data.streakDays}日連続！</span>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button onClick={onShare}
            className="w-full py-3 rounded-2xl bg-violet-500/15 border border-violet-400/20
              text-xs text-violet-200 font-medium active:scale-98 transition-all">
            シェアする ✨
          </button>
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/3 border border-white/5
              text-xs text-white/30 active:scale-98 transition-all">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
