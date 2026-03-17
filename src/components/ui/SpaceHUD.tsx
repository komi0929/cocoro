/**
 * cocoro — Space HUD (Head-Up Display)
 * 小学生向けシンプルUI
 * マイクボタン + リアクション + ルームコード表示
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useCocoroStore } from '@/store/useCocoroStore';

// リアクション絵文字
const REACTIONS = [
  { emoji: '😊', label: 'うれしい' },
  { emoji: '🤣', label: 'わらう' },
  { emoji: '🤩', label: 'すごい' },
  { emoji: '😲', label: 'びっくり' },
  { emoji: '💪', label: 'がんばれ' },
  { emoji: '❤️', label: 'すき' },
];

// スタンプ定型文
const STAMPS = [
  'それな！',
  'まじ？',
  'いいね！',
  'すごーい！',
  'わかる〜',
  'おもしろい！',
];

interface SpaceHUDProps {
  roomId?: string;
  roomCode?: string;
  onLeave?: () => void;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

interface FloatingStamp {
  id: number;
  text: string;
}

export function SpaceHUD({ roomId, roomCode, onLeave }: SpaceHUDProps) {
  const phase = useCocoroStore((s) => s.phase);
  const participants = useCocoroStore((s) => s.participants);
  const [micOn, setMicOn] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [floatingStamps, setFloatingStamps] = useState<FloatingStamp[]>([]);
  const reactionIdRef = useRef(0);

  const participantCount = participants.size;

  // マイクトグル
  const toggleMic = useCallback(() => {
    setMicOn(prev => !prev);
    // ハプティクス
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  // リアクション送信
  const sendReaction = useCallback((emoji: string) => {
    const id = ++reactionIdRef.current;
    const x = 30 + Math.random() * 40; // 30-70% horizontal
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);

    // ハプティクス
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  // スタンプ送信
  const sendStamp = useCallback((text: string) => {
    const id = ++reactionIdRef.current;
    setFloatingStamps(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setFloatingStamps(prev => prev.filter(s => s.id !== id));
    }, 3000);
    setShowStamps(false);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* === トップバー === */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ルーム情報 */}
          <div className="flex items-center gap-2">
            {roomCode && (
              <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm
                border border-white/50 text-sm font-bold text-purple-500">
                🔑 {roomCode}
              </div>
            )}
            <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm
              border border-white/50 text-sm text-gray-500">
              👥 {participantCount}にん
            </div>
          </div>
        </div>
      </div>

      {/* === フローティングリアクション === */}
      {floatingReactions.map(r => (
        <div
          key={r.id}
          className="absolute animate-float-up pointer-events-none"
          style={{
            left: `${r.x}%`,
            bottom: '20%',
            fontSize: '3rem',
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* === フローティングスタンプ === */}
      {floatingStamps.map(s => (
        <div
          key={s.id}
          className="absolute left-1/2 -translate-x-1/2 bottom-1/3 pointer-events-none
            animate-fade-in-up"
        >
          <div className="px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg
            border border-white/50 text-lg font-bold text-gray-700">
            {s.text}
          </div>
        </div>
      ))}

      {/* === 下部コントロール === */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto pb-8">
        {/* リアクションパネル */}
        {showReactions && (
          <div className="flex justify-center gap-3 mb-4 animate-scale-in px-4">
            {REACTIONS.map(r => (
              <button
                key={r.emoji}
                onClick={() => sendReaction(r.emoji)}
                className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md
                  border border-white/50
                  flex items-center justify-center text-2xl
                  hover:scale-110 active:scale-90 transition-transform"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        {/* スタンプパネル */}
        {showStamps && (
          <div className="flex flex-wrap justify-center gap-2 mb-4 animate-scale-in px-4">
            {STAMPS.map(text => (
              <button
                key={text}
                onClick={() => sendStamp(text)}
                className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm
                  border border-white/50
                  text-sm font-bold text-gray-600
                  hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200
                  active:scale-90 transition-all"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* メインコントロール */}
        <div className="flex items-center justify-center gap-4">
          {/* スタンプボタン */}
          <button
            onClick={() => { setShowStamps(!showStamps); setShowReactions(false); }}
            className={`w-12 h-12 rounded-full shadow-md
              flex items-center justify-center text-xl
              transition-all active:scale-90
              ${showStamps
                ? 'bg-purple-500 text-white'
                : 'bg-white/80 backdrop-blur-sm border border-white/50 text-gray-500'
              }`}
          >
            💬
          </button>

          {/* マイクボタン（中央・大きい） */}
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full shadow-lg
              flex items-center justify-center text-2xl
              transition-all active:scale-90
              ${micOn
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white animate-mic-pulse'
                : 'bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-400'
              }`}
          >
            {micOn ? '🎤' : '🔇'}
          </button>

          {/* リアクションボタン */}
          <button
            onClick={() => { setShowReactions(!showReactions); setShowStamps(false); }}
            className={`w-12 h-12 rounded-full shadow-md
              flex items-center justify-center text-xl
              transition-all active:scale-90
              ${showReactions
                ? 'bg-pink-500 text-white'
                : 'bg-white/80 backdrop-blur-sm border border-white/50 text-gray-500'
              }`}
          >
            😊
          </button>
        </div>
      </div>
    </div>
  );
}
