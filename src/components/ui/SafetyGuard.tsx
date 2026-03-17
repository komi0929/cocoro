/**
 * cocoro — SafetyGuard
 * 安全機能:
 * - 利用時間トラッカー
 * - 「ぬける」ボタン（退出）
 * - 保護者パスコード
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SafetyGuardProps {
  timeLimitMinutes?: number;
  onEscape?: () => void;
  children: React.ReactNode;
}

export function SafetyGuard({
  timeLimitMinutes = 30,
  onEscape,
  children,
}: SafetyGuardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - startTimeRef.current) / 60000);
      setElapsedMinutes(mins);

      if (timeLimitMinutes > 0) {
        if (mins === timeLimitMinutes - 5 && !showTimeWarning) {
          setShowTimeWarning(true);
          setTimeout(() => setShowTimeWarning(false), 5000);
        }
        if (mins >= timeLimitMinutes) {
          setShowTimeUp(true);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timeLimitMinutes, showTimeWarning]);

  const handleEscape = useCallback(() => {
    if (onEscape) {
      onEscape();
    } else {
      window.location.href = '/';
    }
  }, [onEscape]);

  return (
    <div className="relative w-full h-full">
      {children}

      {/* ぬけるボタン */}
      <button
        onClick={handleEscape}
        className="fixed top-4 right-4 z-100 px-4 py-2.5 rounded-full
          bg-white/80 hover:bg-white active:scale-90
          border border-gray-200 shadow-md
          text-gray-500 text-sm font-bold
          transition-all touch-manipulation
          flex items-center gap-1.5 backdrop-blur-sm"
        aria-label="退出"
      >
        ← ぬける
      </button>

      {/* 利用時間（5分ごと） */}
      {elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-90
          px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md
          text-sm text-gray-500 font-medium animate-fade-in-up">
          ⏰ {elapsedMinutes}分経過
        </div>
      )}

      {/* 残り5分 */}
      {showTimeWarning && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-scale-in">
          <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm text-center">
            <div className="text-5xl mb-4">⏰</div>
            <p className="text-lg font-bold text-gray-700 mb-2">
              あと5分だよ
            </p>
            <p className="text-sm text-gray-400 mb-4">
              もうすぐ利用時間の上限です
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold
                hover:bg-purple-600 active:scale-95 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 時間切れ */}
      {showTimeUp && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm text-center animate-bounce-in">
            <div className="text-5xl mb-4">🌙</div>
            <p className="text-lg font-bold text-gray-700 mb-2">
              利用時間の上限だよ
            </p>
            <p className="text-sm text-gray-400 mb-4">
              今日も楽しかったね！またね 👋
            </p>
            <button
              onClick={handleEscape}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold
                hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              おわる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 保護者パスコード
 */
interface ParentalPasscodeProps {
  onUnlock: () => void;
  onCancel: () => void;
}

export function ParentalPasscode({ onUnlock, onCancel }: ParentalPasscodeProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const savedCode = typeof window !== 'undefined' ? localStorage.getItem('cocoro_parental_code') : null;

  const handleSubmit = () => {
    if (!savedCode || code === savedCode) {
      onUnlock();
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm w-full text-center animate-scale-in">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-base font-bold text-gray-700 mb-1">
          保護者用設定
        </p>
        <p className="text-xs text-gray-400 mb-4">
          パスコードを入力してください
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className={`w-40 mx-auto block text-center text-2xl tracking-[0.5em] font-bold
            px-4 py-3 rounded-xl border-2 focus:outline-none
            ${error ? 'border-red-400 bg-red-50 animate-wiggle' : 'border-gray-200 focus:border-purple-400'}
          `}
          placeholder="••••"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-xs mt-2 font-medium">パスコードが違います</p>
        )}
        <div className="flex gap-3 mt-5 justify-center">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-xl text-gray-400 text-sm font-medium hover:bg-gray-100 transition-colors">
            キャンセル
          </button>
          <button onClick={handleSubmit}
            disabled={code.length < 4}
            className="px-5 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold
              hover:bg-purple-600 disabled:opacity-40 transition-all">
            解除
          </button>
        </div>
      </div>
    </div>
  );
}
