/**
 * cocoro — SafetyGuard
 * 小学生向け安全機能:
 * - 利用時間トラッカー（○分たったよ！通知）
 * - 「にげる🏃」ボタン（即退出）
 * - 保護者パスコード（設定変更時）
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SafetyGuardProps {
  /** 利用時間上限(分) 0=無制限 */
  timeLimitMinutes?: number;
  /** 退出時コールバック */
  onEscape?: () => void;
  /** 子要素 */
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

  // 利用時間トラッカー
  useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - startTimeRef.current) / 60000);
      setElapsedMinutes(mins);

      if (timeLimitMinutes > 0) {
        // 残り5分で警告
        if (mins === timeLimitMinutes - 5 && !showTimeWarning) {
          setShowTimeWarning(true);
          setTimeout(() => setShowTimeWarning(false), 5000);
        }
        // 時間切れ
        if (mins >= timeLimitMinutes) {
          setShowTimeUp(true);
        }
      }
    }, 30000); // 30秒ごとにチェック

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

      {/* === にげる🏃ボタン（常時表示） === */}
      <button
        onClick={handleEscape}
        className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-full
          bg-red-100 hover:bg-red-200 active:scale-90
          border border-red-200 shadow-md
          text-red-600 text-sm font-bold
          transition-all touch-manipulation
          flex items-center gap-1.5"
        aria-label="退出"
      >
        <span className="text-lg">🏃</span>
        にげる
      </button>

      {/* === 利用時間表示（5分ごとに表示） === */}
      {elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90]
          px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md
          text-sm text-gray-500 font-medium
          animate-fade-in-up">
          ⏰ {elapsedMinutes}ぷん たったよ
        </div>
      )}

      {/* === 残り5分警告 === */}
      {showTimeWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-scale-in">
          <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm text-center">
            <div className="text-5xl mb-4">⏰</div>
            <p className="text-lg font-bold text-gray-700 mb-2">
              あと5ふんだよ！
            </p>
            <p className="text-sm text-gray-400 mb-4">
              もうすこしでじかんだよ
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold
                hover:bg-purple-600 active:scale-95 transition-all"
            >
              わかった！
            </button>
          </div>
        </div>
      )}

      {/* === 時間切れ === */}
      {showTimeUp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm text-center animate-bounce-in">
            <div className="text-5xl mb-4">🌙</div>
            <p className="text-lg font-bold text-gray-700 mb-2">
              おしまいのじかんだよ！
            </p>
            <p className="text-sm text-gray-400 mb-4">
              きょうもたのしかったね。<br />
              またあそぼうね！
            </p>
            <button
              onClick={handleEscape}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold
                hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              バイバイ 👋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 保護者パスコード入力ダイアログ
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl max-w-sm w-full text-center animate-scale-in">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-base font-bold text-gray-700 mb-1">
          おうちのかた よう
        </p>
        <p className="text-xs text-gray-400 mb-4">
          パスコードをいれてください
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
          <p className="text-red-400 text-xs mt-2 font-medium">ちがうよ！もういちど</p>
        )}
        <div className="flex gap-3 mt-5 justify-center">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-xl text-gray-400 text-sm font-medium hover:bg-gray-100 transition-colors">
            やめる
          </button>
          <button onClick={handleSubmit}
            disabled={code.length < 4}
            className="px-5 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold
              hover:bg-purple-600 disabled:opacity-40 transition-all">
            ひらく
          </button>
        </div>
      </div>
    </div>
  );
}
