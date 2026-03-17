/**
 * cocoro — ロビー
 * 「部屋をつくる」「部屋に入る」の2択
 * 小学校中〜高学年(10-12歳)向けUI
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_CATALOG, DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';

export default function LobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR_ID);
  const [isConnecting, setIsConnecting] = useState(false);

  const generateCode = useCallback(() => {
    return String(Math.floor(1000 + Math.random() * 9000));
  }, []);

  const handleCreate = () => {
    if (!nickname.trim()) return;
    setIsConnecting(true);
    const code = generateCode();
    const name = encodeURIComponent(nickname.trim());
    setTimeout(() => {
      router.push(`/space?room=room-${code}&name=${name}&avatar=${selectedAvatar}&code=${code}`);
    }, 500);
  };

  const handleJoin = () => {
    if (!nickname.trim() || !roomCode.trim()) return;
    setIsConnecting(true);
    const name = encodeURIComponent(nickname.trim());
    setTimeout(() => {
      router.push(`/space?room=room-${roomCode.trim()}&name=${name}&avatar=${selectedAvatar}`);
    }, 500);
  };

  // --- メインメニュー ---
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f4fd] via-[#f0f7ff] to-[#fef3f2] flex flex-col items-center justify-center px-6 py-12">
        <button onClick={() => router.push('/')}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
          ← もどる
        </button>

        <div className="text-5xl mb-6 animate-bounce-in">🫧</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">何する？</h1>
        <p className="text-sm text-gray-400 mb-10">友だちとの通話方法を選んでね</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            className="w-full py-5 px-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-md
              hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl shadow-sm">
              🏠
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-700 text-base">部屋をつくる</p>
              <p className="text-xs text-gray-400 mt-0.5">合言葉を友だちに教えよう</p>
            </div>
          </button>

          <button
            onClick={() => setMode('join')}
            className="w-full py-5 px-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-md
              hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-2xl shadow-sm">
              🚪
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-700 text-base">部屋に入る</p>
              <p className="text-xs text-gray-400 mt-0.5">友だちの合言葉を入力</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // --- 部屋をつくる / 部屋に入る ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4fd] via-[#f0f7ff] to-[#fef3f2] flex flex-col items-center px-6 py-12">
      <button onClick={() => setMode('menu')}
        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
        ← もどる
      </button>

      <div className="w-full max-w-sm mt-12">
        <h2 className="text-xl font-bold text-gray-700 text-center mb-8">
          {mode === 'create' ? '🏠 部屋をつくる' : '🚪 部屋に入る'}
        </h2>

        {/* ニックネーム */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-500 mb-2 block">ニックネーム</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="名前を入力"
            maxLength={10}
            className="w-full px-4 py-3.5 rounded-xl bg-white/80 border border-gray-200 text-gray-700
              placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-base"
          />
        </div>

        {/* 合言葉（参加時のみ） */}
        {mode === 'join' && (
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-500 mb-2 block">合言葉（4ケタ）</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              inputMode="numeric"
              className="w-full px-4 py-3.5 rounded-xl bg-white/80 border border-gray-200 text-gray-700
                placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent
                text-center text-2xl tracking-[0.5em] font-bold"
            />
          </div>
        )}

        {/* アバター選択 */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 mb-3 block">アバター</label>
          <div className="grid grid-cols-2 gap-3">
            {AVATAR_CATALOG.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center
                  ${selectedAvatar === avatar.id
                    ? 'border-purple-400 bg-purple-50/50 shadow-md scale-105'
                    : 'border-gray-100 bg-white/60 hover:border-gray-200'
                  }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg mb-2"
                  style={{ background: `linear-gradient(135deg, ${avatar.gradient[0]}, ${avatar.gradient[1]})` }}>
                  {avatar.name.charAt(0)}
                </div>
                <span className="text-xs text-gray-600 font-bold">{avatar.name}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">{avatar.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 開始ボタン */}
        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={isConnecting || !nickname.trim() || (mode === 'join' && roomCode.length < 4)}
          className={`w-full py-4 rounded-2xl text-white text-lg font-bold transition-all
            ${isConnecting ? 'opacity-60 scale-95' : 'hover:scale-[1.02] active:scale-95'}
            ${mode === 'create'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-300/30'
              : 'bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg shadow-sky-300/30'
            }
            disabled:opacity-40`}
        >
          {isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              接続中...
            </span>
          ) : mode === 'create' ? (
            '部屋をつくる 🎉'
          ) : (
            '入る 🚪'
          )}
        </button>
      </div>

      {/* トランジション */}
      {isConnecting && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl animate-warp-in flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce-in">🫧</div>
            <p className="text-gray-400 text-sm font-medium">
              {mode === 'create' ? '部屋を作成中...' : '部屋に接続中...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
