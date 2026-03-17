/**
 * cocoro — Onboarding Flow
 * 初回体験 — 最初の3分で価値を体験させる
 *
 * 反復396-410:
 * - Step 1: ウェルカム画面 → アプリの説明
 * - Step 2: アバター選択（カタログから）
 * - Step 3: 声のテスト — 「こんにちは」と言ってみよう
 * - Step 4: 最初のトピックカード体験
 * - Step 5: ルーム参加(自動マッチ)
 * = 「何をすればいいかわからない」を完全排除
 */
'use client';

import { useState, useCallback, useEffect } from 'react';

type OnboardingStep = 'welcome' | 'avatar' | 'voice_test' | 'topic_demo' | 'ready';

interface OnboardingFlowProps {
  onComplete: (avatarId: string) => void;
  onSkip: () => void;
  isVoiceActive: boolean;
  volume: number;
}

const AVATAR_OPTIONS = [
  { id: 'avatar_01', name: 'ほのか', emoji: '🧑‍🦰', color: '#e879a8' },
  { id: 'avatar_02', name: 'りく', emoji: '🧑', color: '#6da0f7' },
  { id: 'avatar_03', name: 'みう', emoji: '👩', color: '#f7b96d' },
  { id: 'avatar_04', name: 'そうた', emoji: '🧑‍🦱', color: '#6df7a0' },
  { id: 'avatar_05', name: 'あかり', emoji: '👧', color: '#c46df7' },
  { id: 'avatar_06', name: 'はると', emoji: '👦', color: '#6df7e5' },
];

const STORAGE_KEY = 'cocoro_onboarding_done';

export function OnboardingFlow({ onComplete, onSkip, isVoiceActive, volume }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [voiceDetected, setVoiceDetected] = useState(false);

  // Check if already done
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      onSkip();
    }
  }, [onSkip]);

  // Detect voice for voice_test step
  useEffect(() => {
    if (step === 'voice_test' && isVoiceActive && volume > 0.2) {
      setVoiceDetected(true);
    }
  }, [step, isVoiceActive, volume]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete(selectedAvatar || 'avatar_01');
  }, [selectedAvatar, onComplete]);

  const nextStep = useCallback(() => {
    const steps: OnboardingStep[] = ['welcome', 'avatar', 'voice_test', 'topic_demo', 'ready'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-100 bg-[#0f0a1a] flex items-center justify-center p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.08), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {(['welcome', 'avatar', 'voice_test', 'topic_demo', 'ready'] as OnboardingStep[]).map((s, i) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300
              ${step === s ? 'bg-violet-400 w-6' : i < ['welcome', 'avatar', 'voice_test', 'topic_demo', 'ready'].indexOf(step) ? 'bg-violet-400/50' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
            <p className="text-4xl mb-6">✨</p>
            <h1 className="text-2xl font-bold text-white/90 mb-3">cocoro へようこそ</h1>
            <p className="text-sm text-white/50 leading-relaxed mb-2">
              声とアバターで、
            </p>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              ゆるく繋がる空間SNS
            </p>
            <button onClick={nextStep}
              className="w-full py-3.5 rounded-2xl bg-violet-500/20 border border-violet-400/30
                text-violet-200 font-medium text-sm hover:bg-violet-500/30
                active:scale-98 transition-all">
              はじめる
            </button>
            <button onClick={() => { localStorage.setItem(STORAGE_KEY, 'true'); onSkip(); }}
              className="mt-3 text-xs text-white/20 hover:text-white/40 transition-colors">
              スキップ
            </button>
          </div>
        )}

        {/* Step: Avatar */}
        {step === 'avatar' && (
          <div className="text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <h2 className="text-lg font-bold text-white/90 mb-2">あなたのアバターを選ぼう</h2>
            <p className="text-xs text-white/40 mb-6">声だけで繋がるから、好きな姿で</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {AVATAR_OPTIONS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-4 rounded-2xl transition-all active:scale-95 flex flex-col items-center gap-2
                    ${selectedAvatar === av.id
                      ? 'bg-violet-500/20 border-2 border-violet-400/40 scale-105'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/8'}`}
                >
                  <span className="text-3xl">{av.emoji}</span>
                  <span className="text-[10px] text-white/40">{av.name}</span>
                </button>
              ))}
            </div>

            <button onClick={nextStep} disabled={!selectedAvatar}
              className={`w-full py-3.5 rounded-2xl font-medium text-sm
                active:scale-98 transition-all
                ${selectedAvatar
                  ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200'
                  : 'bg-white/5 border border-white/8 text-white/20 cursor-not-allowed'}`}>
              次へ
            </button>
          </div>
        )}

        {/* Step: Voice Test */}
        {step === 'voice_test' && (
          <div className="text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <h2 className="text-lg font-bold text-white/90 mb-2">声を試してみよう</h2>
            <p className="text-xs text-white/40 mb-8">「こんにちは」と言ってみてください</p>

            {/* Mic visualizer */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full transition-all duration-200
                ${voiceDetected ? 'bg-emerald-500/20 border-2 border-emerald-400/40' : 'bg-white/5 border-2 border-white/10'}`}
                style={{
                  transform: `scale(${1 + volume * 0.3})`,
                  boxShadow: isVoiceActive ? `0 0 ${40 + volume * 60}px rgba(16,185,129,0.2)` : 'none',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">{voiceDetected ? '✅' : '🎤'}</span>
              </div>
            </div>

            {voiceDetected ? (
              <div style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                <p className="text-sm text-emerald-300 mb-4">声をキャッチしました！🎉</p>
                <button onClick={nextStep}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30
                    text-emerald-200 font-medium text-sm active:scale-98 transition-all">
                  次へ
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/30">マイクボタンをONにして話してみてください</p>
            )}

            <button onClick={nextStep} className="mt-3 text-[10px] text-white/15 hover:text-white/30">
              スキップ
            </button>
          </div>
        )}

        {/* Step: Topic Demo */}
        {step === 'topic_demo' && (
          <div className="text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <h2 className="text-lg font-bold text-white/90 mb-2">トピックカード</h2>
            <p className="text-xs text-white/40 mb-6">部屋に入ると「話のきっかけ」が自動で表示されます</p>

            {/* Demo topic card */}
            <div className="bg-gradient-to-br from-sky-500/15 to-blue-500/8 rounded-3xl border border-white/10 p-5 mb-6 text-left">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/8 text-white/50 font-medium">アイスブレイク</span>
              <div className="flex items-start gap-3 mt-3">
                <span className="text-2xl">🎤</span>
                <p className="text-white/80 text-sm leading-relaxed">カラオケの十八番は？</p>
              </div>
            </div>

            <button onClick={nextStep}
              className="w-full py-3.5 rounded-2xl bg-violet-500/20 border border-violet-400/30
                text-violet-200 font-medium text-sm active:scale-98 transition-all">
              次へ
            </button>
          </div>
        )}

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <p className="text-5xl mb-6">🚀</p>
            <h2 className="text-xl font-bold text-white/90 mb-2">準備完了！</h2>
            <p className="text-sm text-white/50 mb-8">部屋に入って、声で繋がろう</p>

            <button onClick={handleComplete}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500/30 to-pink-500/20
                border border-violet-400/30 text-white/90 font-bold text-base
                hover:from-violet-500/40 hover:to-pink-500/30
                active:scale-98 transition-all">
              部屋に入る ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
