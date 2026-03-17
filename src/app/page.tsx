/**
 * cocoro — ランディングページ
 * 小学生が見て「やりたい！」と思うUI
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);

  const handleStart = () => {
    setIsEntering(true);
    setTimeout(() => router.push('/lobby'), 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4fd] via-[#f0f7ff] to-[#fef3f2] relative overflow-hidden">
      {/* --- 背景デコレーション --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-300/20 rounded-full blur-2xl" />
        <div className="absolute top-32 right-8 w-16 h-16 bg-pink-300/20 rounded-full blur-2xl" />
        <div className="absolute bottom-40 left-6 w-24 h-24 bg-mint-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-12 w-20 h-20 bg-sky-300/20 rounded-full blur-2xl" />
        {/* 浮かぶ絵文字 */}
        <div className="absolute top-20 right-16 text-3xl animate-float-particle" style={{ animationDelay: '0s' }}>⭐</div>
        <div className="absolute top-48 left-12 text-2xl animate-float-particle" style={{ animationDelay: '1s' }}>🌈</div>
        <div className="absolute bottom-60 right-20 text-3xl animate-float-particle" style={{ animationDelay: '2s' }}>🫧</div>
        <div className="absolute bottom-32 left-16 text-2xl animate-float-particle" style={{ animationDelay: '3s' }}>✨</div>
      </div>

      {/* --- メインコンテンツ --- */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* ロゴ */}
        <div className="animate-bounce-in mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center shadow-xl shadow-purple-300/30">
            <span className="text-4xl">🫧</span>
          </div>
        </div>

        {/* アプリ名 */}
        <h1 className="animate-fade-in-up text-3xl md:text-5xl font-extrabold text-center leading-tight">
          <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            cocoro
          </span>
        </h1>

        {/* サブタイトル */}
        <p className="animate-fade-in-up-delay text-center text-base md:text-lg text-gray-500 mt-3 max-w-xs">
          ともだちと<br />
          アバターでおはなししよう！
        </p>

        {/* かわいいイラスト的な説明 */}
        <div className="animate-fade-in-up-delay-2 mt-8 flex gap-4 md:gap-6">
          {[
            { emoji: '🎤', label: 'こえで\nはなす' },
            { emoji: '🧸', label: 'アバターが\nうごく' },
            { emoji: '🛡️', label: 'あんしん\nあんぜん' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-3xl md:text-4xl
                border border-white/50 hover:scale-110 transition-transform">
                {item.emoji}
              </div>
              <span className="text-[11px] md:text-xs text-gray-400 text-center leading-tight whitespace-pre-line font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTAボタン */}
        <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            disabled={isEntering}
            className={`
              px-10 py-4 rounded-2xl text-lg font-bold text-white
              transition-all duration-300 touch-manipulation
              ${isEntering
                ? 'scale-95 opacity-60'
                : 'hover:scale-105 active:scale-95 hover:shadow-xl'
              }
              bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400
              shadow-lg shadow-purple-400/30
            `}
          >
            {isEntering ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                つなげているよ...
              </span>
            ) : (
              'ともだちとおはなしする 🎤'
            )}
          </button>
        </div>

        {/* 安全メッセージ */}
        <div className="animate-fade-in-up-delay-3 mt-8 max-w-xs">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/50 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold text-gray-600">おうちのかたへ</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  カメラは使いません。おこさまのお顔は映りません。
                  声とアバターだけで安心しておはなしできます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* トランジション */}
      {isEntering && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl animate-warp-in flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce-in">🫧</div>
            <p className="text-gray-400 text-sm font-medium">
              おへやを さがしているよ...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
