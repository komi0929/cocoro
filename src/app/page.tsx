/**
 * cocoro — Landing Page
 * 「カメラのいらないテレビ電話」ランディング
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterSpace = () => {
    setIsEntering(true);
    setTimeout(() => {
      router.push('/lobby');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white overflow-hidden relative">
      {/* ===== Background ambient effects ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px] animate-pulse-slow-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float-particle"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.25) % 5}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* ===== Main content ===== */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo / Title */}
        <div className="text-center mb-12 animate-fade-in-up">
          {/* Brand mark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-amber-500 mb-8 shadow-lg shadow-violet-500/25">
            <span className="text-4xl">🫧</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-linear-to-r from-violet-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              cocoro
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 font-medium mb-2">
            カメラのいらないテレビ電話
          </p>

          <p className="text-sm text-white/30 max-w-md mx-auto leading-relaxed">
            声とアバターだけで繋がる、スマホのメタバース。
            <br />
            普通の会話が、エンタメになる。
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-sm animate-fade-in-up-delay">
          <button
            onClick={handleEnterSpace}
            disabled={isEntering}
            className={`
              relative w-full py-4 px-8 rounded-2xl text-lg font-semibold
              transition-all duration-500 touch-manipulation
              ${isEntering
                ? 'scale-95 opacity-50'
                : 'hover:scale-[1.02] active:scale-95'
              }
              bg-linear-to-r from-violet-600 via-fuchsia-600 to-violet-600
              bg-size-[200%_100%] animate-gradient-shift
              shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40
            `}
          >
            {isEntering ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ダイブ中...
              </span>
            ) : (
              '空間にダイブ 🚀'
            )}
          </button>

          <button
            onClick={handleEnterSpace}
            className="w-full py-3 px-8 rounded-2xl text-sm font-medium
              bg-white/5 backdrop-blur-sm border border-white/10
              hover:bg-white/10 hover:border-white/20
              transition-all duration-300 touch-manipulation active:scale-95
              text-white/60 hover:text-white/80"
          >
            ゲストとして参加（アカウント不要）
          </button>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full animate-fade-in-up-delay-2">
          {[
            { icon: '🎙️', label: '声だけで繋がる', sub: 'カメラ不要' },
            { icon: '🧑‍🎤', label: 'VRMアバター', sub: '自動で動く' },
            { icon: '🔥', label: '自動演出', sub: '会話がエンタメに' },
            { icon: '👀', label: '聞き専OK', sub: 'ROM参加歓迎' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 
                hover:bg-white/8 hover:border-white/10 transition-all duration-300
                text-center group"
            >
              <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                {feature.icon}
              </span>
              <p className="text-sm font-medium text-white/80">{feature.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{feature.sub}</p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p className="mt-16 text-[11px] text-white/20 text-center">
          AI時代を前に人間が作る最後のSNS — プロじゃなくても発信できる
        </p>
      </div>

      {/* Transition overlay */}
      {isEntering && (
        <div className="fixed inset-0 z-50 bg-[#0f0a1a] animate-warp-in flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm animate-pulse">空間に接続中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
