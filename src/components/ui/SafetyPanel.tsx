/**
 * kokoro — Safety Panel
 * ハラスメント対策のUI — ワンタップで安全操作
 *
 * サイクル13: SafetyBoundary + ReportのUI
 * - Safe Zone ボタン
 * - 個別ユーザーのブロック/ミュート/通報
 * - Personal Boundary 設定
 * - 通報カテゴリ選択
 */
'use client';

import { useState, useCallback } from 'react';
import { ReportSystem, type ReportCategory } from '@/engine/safety/ReportSystem';

interface SafetyPanelProps {
  targetId: string;
  targetName: string;
  isBlocked: boolean;
  isMuted: boolean;
  isSafeZoneActive: boolean;
  onBlock: (id: string) => void;
  onMute: (id: string) => void;
  onToggleSafeZone: () => void;
  onReport: (targetId: string, category: ReportCategory, description: string) => void;
  onClose: () => void;
}

export function SafetyPanel({
  targetId, targetName, isBlocked, isMuted, isSafeZoneActive,
  onBlock, onMute, onToggleSafeZone, onReport, onClose,
}: SafetyPanelProps) {
  const [showReport, setShowReport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);

  const handleReport = useCallback(() => {
    if (!selectedCategory) return;
    onReport(targetId, selectedCategory, '');
    setShowReport(false);
    setSelectedCategory(null);
  }, [targetId, selectedCategory, onReport]);

  const categories = ReportSystem.getCategories();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ animation: 'fade-in-up 0.3s ease-out' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1a1225]/95 backdrop-blur-2xl
        rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold text-white/90">{targetName}</h2>
          <p className="text-[10px] text-white/30">安全管理</p>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {/* Quick actions */}
          <button onClick={() => onMute(targetId)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98
              ${isMuted ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/8'}`}>
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span className="text-sm text-white/60">{isMuted ? 'ミュート中' : 'ミュートする'}</span>
          </button>

          <button onClick={() => onBlock(targetId)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98
              ${isBlocked ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/8'}`}>
            <span>{isBlocked ? '🚫' : '⛔'}</span>
            <span className="text-sm text-white/60">{isBlocked ? 'ブロック中' : 'ブロックする'}</span>
          </button>

          {/* Safe Zone */}
          <button onClick={onToggleSafeZone}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98
              ${isSafeZoneActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/8'}`}>
            <span>🛡️</span>
            <div className="text-left">
              <span className="text-sm text-white/60 block">
                {isSafeZoneActive ? 'Safe Zone ON' : 'Safe Zoneに入る'}
              </span>
              <span className="text-[9px] text-white/20">全音声遮断 + 透明化</span>
            </div>
          </button>

          {/* Report */}
          {!showReport ? (
            <button onClick={() => setShowReport(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-500/5 border border-red-500/10
                transition-all active:scale-98">
              <span>🚨</span>
              <span className="text-sm text-red-300/60">通報する</span>
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3">
              <p className="text-[10px] text-red-300/40 mb-2">通報理由を選択</p>
              <div className="space-y-1.5">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all
                      ${selectedCategory === c.key
                        ? 'bg-red-500/15 border border-red-400/20 text-red-200'
                        : 'bg-white/3 text-white/30 hover:bg-white/5'}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              {selectedCategory && (
                <button onClick={handleReport}
                  className="w-full mt-3 py-2.5 rounded-xl bg-red-500/20 border border-red-400/30
                    text-xs text-red-200 font-medium active:scale-98 transition-all">
                  通報を送信
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={onClose}
          className="w-full py-3 text-center text-xs text-white/20 border-t border-white/5">
          閉じる
        </button>
      </div>
    </div>
  );
}
