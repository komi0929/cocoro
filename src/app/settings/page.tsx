/**
 * kokoro — Settings Page
 * ユーザー設定画面
 * 表示名変更、音声設定、データ管理
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomHistory } from '@/data/roomHistory';

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setDisplayName(localStorage.getItem('kokoro_display_name') ?? '');
    setVisitCount(getRoomHistory().reduce((sum, h) => sum + h.visitCount, 0));
    setHasAvatar(!!localStorage.getItem('kokoro_avatar_id'));
  }, []);

  const handleSaveName = useCallback(() => {
    if (!displayName.trim()) return;
    localStorage.setItem('kokoro_display_name', displayName.trim());
    setSavedToast(true);
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setSavedToast(false), 2000);
  }, [displayName]);

  const handleClearData = useCallback(() => {
    localStorage.removeItem('kokoro_display_name');
    localStorage.removeItem('kokoro_avatar_id');
    // Clear IndexedDB
    try {
      indexedDB.deleteDatabase('cocoro_spatial_memory');
    } catch { /* ignore */ }
    setShowClearConfirm(false);
    setDisplayName('');
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    window.location.href = '/';
  }, []);

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
          <h1 className="text-base font-semibold text-white/90">設定</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Display Name */}
        <section className="p-5 rounded-2xl bg-white/3 border border-white/5">
          <h2 className="text-sm font-medium text-white/70 mb-3">表示名</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              maxLength={20}
              placeholder="表示名を入力..."
              className="flex-1 bg-white/4 border border-white/8 rounded-xl
                px-4 py-2.5 text-sm text-white/80
                placeholder:text-white/20
                focus:outline-none focus:border-violet-500/30
                transition-colors"
            />
            <button
              onClick={handleSaveName}
              disabled={!displayName.trim()}
              className="px-4 py-2.5 rounded-xl
                bg-violet-500/15 border border-violet-500/20
                text-violet-300 text-sm font-medium
                hover:bg-violet-500/25
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all active:scale-95"
            >
              {savedToast ? '✓ 保存済み' : '保存'}
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="p-5 rounded-2xl bg-white/3 border border-white/5">
          <h2 className="text-sm font-medium text-white/70 mb-3">統計</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-2xl font-bold text-white/80">{visitCount}</p>
              <p className="text-[10px] text-white/35 mt-1">訪問回数</p>
            </div>
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-2xl font-bold text-white/80">
                {hasAvatar ? '✓' : '—'}
              </p>
              <p className="text-[10px] text-white/35 mt-1">アバター選択済み</p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="p-5 rounded-2xl bg-white/3 border border-white/5">
          <h2 className="text-sm font-medium text-white/70 mb-3">このアプリについて</h2>
          <div className="space-y-2 text-[12px] text-white/40 leading-relaxed">
            <p><span className="text-white/60 font-medium">kokoro</span> — カメラのいらないテレビ電話</p>
            <p>声とアバターだけで繋がる、プライバシーファーストの空間SNS。</p>
            <p className="text-white/25">v0.1.0 • Built with Next.js + Three.js + WebRTC</p>
          </div>
        </section>

        {/* Data Management */}
        <section className="p-5 rounded-2xl bg-white/3 border border-red-500/5">
          <h2 className="text-sm font-medium text-white/70 mb-3">データ管理</h2>
          <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
            すべてのデータはこのブラウザにのみ保存されています。サーバーには送信されていません。
          </p>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 rounded-xl
              bg-red-500/10 border border-red-500/15
              text-red-400/70 text-sm
              hover:bg-red-500/20 hover:text-red-400
              transition-all active:scale-95"
          >
            すべてのデータを削除
          </button>
        </section>
      </div>

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6"
          onClick={() => setShowClearConfirm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-[280px] p-6 rounded-3xl
            bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-white/80 text-sm mb-2 font-medium">
              データを削除しますか？
            </p>
            <p className="text-center text-white/40 text-[11px] mb-6">
              表示名、アバター選択、訪問履歴、声紋データがすべて削除されます。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10
                  text-white/60 text-sm hover:bg-white/10 transition-all active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/25
                  text-red-400 text-sm font-medium hover:bg-red-500/25 transition-all active:scale-95"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
