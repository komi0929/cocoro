/**
 * kokoro — Landing Page
 * 
 * 思想:
 *   popopoが「人間がアプリを作る最後の時代」なら、
 *   kokoroは「AIが心を理解する最初の空間」。
 * 
 *   テクノロジーではなく、「思想」で勝つ。
 *   洗練されたタイポグラフィ、贅沢な余白、明確なビジョン表明。
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterSpace = () => {
    setIsEntering(true);
    setTimeout(() => router.push('/lobby'), 800);
  };

  const handleGuestEntry = () => {
    setIsEntering(true);
    const guestNames = ['光る猫', '夢見る鳥', '静かなパンダ', '不思議なうさぎ', '優しいきつね'];
    const name = guestNames[Math.floor(Math.random() * guestNames.length)];
    setTimeout(() => router.push(`/space?guest=true&name=${encodeURIComponent(name)}`), 800);
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-white selection:bg-violet-500/20">
      {/* ===== Ambient background layer ===== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-600/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[160px]" />
      </div>

      {/* ===== SECTION 1: Hero — ビジョン表明 ===== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* Brand mark */}
          <div className="mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-lg">🫧</span>
              </div>
              <span className="text-lg font-light tracking-[0.3em] text-white/40" style={{ fontFamily: 'var(--font-noto)' }}>
                KOKORO
              </span>
            </div>
          </div>

          {/* Main vision statement */}
          <h1 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-noto)' }}>
            <span className="block text-[2.5rem] md:text-[4rem] leading-[1.1] font-black tracking-tight">
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                感情が空間を動かす
              </span>
            </span>
            <span className="block text-[2.5rem] md:text-[4rem] leading-[1.1] font-black tracking-tight mt-1">
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                声だけの世界
              </span>
            </span>
          </h1>

          {/* Vision subtitle */}
          <p className="mt-8 text-base md:text-lg text-white/35 font-light leading-relaxed max-w-md mx-auto animate-fade-in-up-delay"
            style={{ fontFamily: 'var(--font-noto)' }}>
            カメラもAIクラウドも要らない。
            <br />
            あなたの声が、オーラを纏い、空間を記憶する。
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in-up-delay-2">
            <button
              onClick={handleEnterSpace}
              disabled={isEntering}
              className={`
                px-10 py-4 rounded-full text-base font-medium tracking-wider
                transition-all duration-500 touch-manipulation
                ${isEntering
                  ? 'scale-95 opacity-50'
                  : 'hover:scale-[1.02] active:scale-95'
                }
                bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500
                bg-[length:200%_100%] animate-gradient-shift
                shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/35
              `}
              style={{ fontFamily: 'var(--font-noto)' }}
            >
              {isEntering ? (
                <span className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  接続中
                </span>
              ) : (
                '空間に入る'
              )}
            </button>
            <button
              onClick={handleGuestEntry}
              className="text-sm text-white/25 hover:text-white/50 transition-colors touch-manipulation"
              style={{ fontFamily: 'var(--font-noto)' }}
            >
              ゲストとして体験する →
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in-up-delay-2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] text-white/15 tracking-widest uppercase" style={{ fontFamily: 'var(--font-noto)' }}>思想</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/15 to-transparent" />
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: 思想 — The Philosophy ===== */}
      <section className="relative z-10 py-32 md:py-48 px-6">
        <div className="max-w-xl mx-auto text-center"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 400) / 300)),
            transform: `translateY(${Math.max(0, 30 - (scrollY - 400) * 0.08)}px)`,
          }}>
          <p className="text-xs text-violet-400/40 tracking-[0.4em] uppercase mb-8" style={{ fontFamily: 'var(--font-noto)' }}>
            Philosophy
          </p>
          <blockquote className="text-xl md:text-2xl font-light text-white/60 leading-relaxed" style={{ fontFamily: 'var(--font-noto)' }}>
            &ldquo;会話が起きたとき、空間がそれを最大限に見せるよう動く&rdquo;
          </blockquote>
          <p className="mt-8 text-sm text-white/20 leading-relaxed max-w-sm mx-auto" style={{ fontFamily: 'var(--font-noto)' }}>
            従来のメタバースは「人が集まった場所で会話が生まれる」。
            kokoroは逆転する。声が引力を生み、空間が人を引き寄せる。
          </p>
        </div>
      </section>

      {/* ===== SECTION 3: 技術 — Core Technology ===== */}
      <section className="relative z-10 py-24 md:py-40 px-6">
        <div className="max-w-3xl mx-auto"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 900) / 300)),
            transform: `translateY(${Math.max(0, 30 - (scrollY - 900) * 0.08)}px)`,
          }}>
          <p className="text-xs text-violet-400/40 tracking-[0.4em] uppercase mb-16 text-center" style={{ fontFamily: 'var(--font-noto)' }}>
            Technology
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: '🧠',
                title: '感情知能',
                body: '声のトーンからリアルタイムに感情を推定。アバターのオーラが喜び、怒り、悲しみに応じて変化する。',
                detail: 'Hume AI EVI inspired',
              },
              {
                icon: '🌌',
                title: '空間記憶',
                body: '訪問するたびに空間があなたを覚える。よく話す場所は温かく光り、再訪時にはウェルカムメッセージが現れる。',
                detail: 'Google Titans memory',
              },
              {
                icon: '⚡',
                title: '引力物理',
                body: '会話が始まると、アバターが自然に引き寄せられる。Spring-dampedアルゴリズムが有機的な群衆運動を生む。',
                detail: 'Gravity Formation',
              },
            ].map((item) => (
              <div key={item.title} className="text-center md:text-left">
                <span className="text-3xl block mb-4">{item.icon}</span>
                <h3 className="text-base font-medium text-white/80 mb-3" style={{ fontFamily: 'var(--font-noto)' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-white/30 leading-relaxed" style={{ fontFamily: 'var(--font-noto)' }}>
                  {item.body}
                </p>
                <p className="text-[10px] text-violet-400/20 mt-3 tracking-wider uppercase">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: 差別化 — What makes kokoro different ===== */}
      <section className="relative z-10 py-24 md:py-40 px-6">
        <div className="max-w-2xl mx-auto"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 1500) / 300)),
            transform: `translateY(${Math.max(0, 30 - (scrollY - 1500) * 0.08)}px)`,
          }}>
          <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {[
              { label: 'カメラ', value: '不要', sub: '声だけで存在を表現' },
              { label: 'AIクラウド', value: 'ゼロ', sub: 'すべてブラウザ内で完結' },
              { label: 'アバター', value: '6体', sub: 'CC0 VRM + カスタム対応' },
              { label: '空間記憶', value: '∞', sub: 'IndexedDB永続化' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] p-6 md:p-8 text-center">
                <p className="text-2xl md:text-3xl font-bold text-white/70" style={{ fontFamily: 'var(--font-noto)' }}>
                  {stat.value}
                </p>
                <p className="text-xs text-white/30 mt-1 font-medium" style={{ fontFamily: 'var(--font-noto)' }}>
                  {stat.label}
                </p>
                <p className="text-[10px] text-white/15 mt-0.5">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: 安全性 — Privacy & Safety ===== */}
      <section className="relative z-10 py-24 md:py-40 px-6">
        <div className="max-w-xl mx-auto text-center"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 2100) / 300)),
            transform: `translateY(${Math.max(0, 30 - (scrollY - 2100) * 0.08)}px)`,
          }}>
          <p className="text-xs text-violet-400/40 tracking-[0.4em] uppercase mb-8" style={{ fontFamily: 'var(--font-noto)' }}>
            Safety
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white/70 mb-6" style={{ fontFamily: 'var(--font-noto)' }}>
            プライバシーは設計思想
          </h2>
          <p className="text-sm text-white/25 leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-noto)' }}>
            カメラ不要。音声データはサーバーに保存しない。
            感情分析もブラウザ内で完結する。
            怒りの声が続いたら、自動でプロテクトバブルが起動する。
            <br />
            安全は、機能ではなく哲学。
          </p>
        </div>
      </section>

      {/* ===== SECTION 6: CTA — Final ===== */}
      <section className="relative z-10 py-32 md:py-48 px-6">
        <div className="max-w-md mx-auto text-center"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 2600) / 300)),
          }}>
          <h2 className="text-3xl md:text-4xl font-black text-white/80 mb-4" style={{ fontFamily: 'var(--font-noto)' }}>
            声で、繋がる。
          </h2>
          <p className="text-sm text-white/25 mb-10" style={{ fontFamily: 'var(--font-noto)' }}>
            ブラウザを開くだけで、すぐに体験できます。
          </p>
          <button
            onClick={handleEnterSpace}
            disabled={isEntering}
            className="px-12 py-4 rounded-full text-base font-medium
              bg-gradient-to-r from-violet-500 to-fuchsia-500
              shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/35
              transition-all duration-300 hover:scale-[1.02] active:scale-95
              touch-manipulation"
            style={{ fontFamily: 'var(--font-noto)' }}
          >
            空間に入る
          </button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-[8px]">🫧</span>
            </div>
            <span className="text-[10px] text-white/20 tracking-wider">kokoro</span>
          </div>
          <p className="text-[10px] text-white/10">
            AIランタイムゼロ — すべてブラウザ内で完結
          </p>
        </div>
      </footer>

      {/* Transition overlay */}
      {isEntering && (
        <div className="fixed inset-0 z-50 bg-[#0f0a1a] animate-warp-in flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white/30 text-xs tracking-widest" style={{ fontFamily: 'var(--font-noto)' }}>
              空間に接続中
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
