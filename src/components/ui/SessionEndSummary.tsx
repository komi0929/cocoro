/**
 * kokoro — Session End Summary
 * セッション終了時の「振り返り」画面
 * 
 * 反復91-100: セッションハイライト + 統計 + ピークモーメント
 * = 「また来たい」と思わせるエンドロール体験
 */
'use client';

import { useState, useEffect } from 'react';
import type { PeakMoment } from '@/engine/choreography/PeakMomentDetector';

interface SessionSummaryData {
  durationMinutes: number;
  totalSpeechSeconds: number;
  participantCount: number;
  peakMoments: PeakMoment[];
  dominantEmotion: string;
  roomName: string;
}

interface SessionEndSummaryProps {
  data: SessionSummaryData;
  onClose: () => void;
}

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  anger: '😤',
  sorrow: '😢',
  surprise: '😲',
  neutral: '😌',
};

export function SessionEndSummary({ data, onClose }: SessionEndSummaryProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(t);
  }, []);

  const speechMinutes = Math.floor(data.totalSpeechSeconds / 60);
  const speechRatio = data.durationMinutes > 0
    ? Math.round((data.totalSpeechSeconds / 60 / data.durationMinutes) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-100 bg-[#0f0a1a]/95 backdrop-blur-xl
      flex items-center justify-center p-6"
      style={{ animation: 'fade-in-up 0.8s ease-out' }}
    >
      <div className="max-w-md w-full">
        {showContent && (
          <div style={{ animation: 'fade-in-up 0.6s ease-out' }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🫧</div>
              <h2 className="text-xl font-bold text-white/90 mb-1">セッション終了</h2>
              <p className="text-sm text-white/40">{data.roomName}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/3 border border-white/5 text-center">
                <p className="text-2xl font-bold text-white/90">{data.durationMinutes}</p>
                <p className="text-[10px] text-white/35 mt-1">分間</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/3 border border-white/5 text-center">
                <p className="text-2xl font-bold text-white/90">{speechMinutes}</p>
                <p className="text-[10px] text-white/35 mt-1">分発話</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/3 border border-white/5 text-center">
                <p className="text-2xl font-bold text-white/90">{data.participantCount}</p>
                <p className="text-[10px] text-white/35 mt-1">人と会話</p>
              </div>
            </div>

            {/* Speech ratio */}
            <div className="mb-6 p-4 rounded-2xl bg-white/3 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">発話率</span>
                <span className="text-xs text-white/60 font-medium">{speechRatio}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                  style={{ width: `${speechRatio}%` }}
                />
              </div>
            </div>

            {/* Dominant emotion */}
            <div className="mb-6 p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center gap-3">
              <span className="text-2xl">{EMOTION_EMOJI[data.dominantEmotion] ?? '😌'}</span>
              <div>
                <p className="text-xs text-white/40">このセッションの空気</p>
                <p className="text-sm text-white/70 font-medium">
                  {data.dominantEmotion === 'joy' ? '楽しい会話' :
                   data.dominantEmotion === 'surprise' ? '驚きの連続' :
                   data.dominantEmotion === 'sorrow' ? '深い共感' : '穏やかなひととき'}
                </p>
              </div>
            </div>

            {/* Peak moments */}
            {data.peakMoments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs text-white/40 font-medium tracking-wider uppercase mb-3 ml-1">
                  ✨ ハイライト
                </h3>
                <div className="space-y-2">
                  {data.peakMoments.slice(0, 3).map((moment) => (
                    <div
                      key={moment.id}
                      className="px-4 py-3 rounded-xl bg-white/3 border border-white/5
                        flex items-center gap-3"
                    >
                      <span className="text-lg">{moment.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs text-white/70">{moment.label}</p>
                        <p className="text-[10px] text-white/30">
                          {Math.floor(moment.timestamp / 60)}:{String(Math.floor(moment.timestamp % 60)).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-semibold text-base
                bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                shadow-lg shadow-violet-500/25 transition-all duration-300 active:scale-95"
            >
              ロビーに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
