/**
 * cocoro — Topic Card UI
 * 会話トピックを美しいカードとして画面中央に表示
 *
 * 反復321-325:
 * - 入室時 or 沈黙15秒後に自動表示
 * - 声で反応するとカードが光る
 * - スワイプ/タップで次のトピックへ
 * - 2択チャレンジ: 2つのボタンで簡単に参加
 * = 「何を話せばいい？」がゼロになる
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Topic, TopicCategory } from '@/engine/interaction/ConversationTopicEngine';

interface TopicCardProps {
  topic: Topic | null;
  onNext: () => void;
  onChoose?: (choice: string) => void;
  isVoiceActive: boolean;
  volume: number;
}

export function TopicCard({ topic, onNext, onChoose, isVoiceActive, volume }: TopicCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (topic) {
      setIsVisible(true);
      setIsExpanding(true);
      setSelectedChoice(null);
      const timer = setTimeout(() => setIsExpanding(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [topic]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    setIsVisible(false);
    setTimeout(() => {
      onNext();
      if (navigator.vibrate) navigator.vibrate(15);
    }, 200);
    void direction; // both directions → next topic
  }, [onNext]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 60) {
      handleSwipe(dx > 0 ? 'right' : 'left');
    }
    touchStartRef.current = null;
  }, [handleSwipe]);

  const handleChoiceSelect = useCallback((choice: string) => {
    setSelectedChoice(choice);
    onChoose?.(choice);
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
  }, [onChoose]);

  if (!topic || !isVisible) return null;

  const glowIntensity = isVoiceActive ? Math.min(1, volume * 2) : 0;
  const categoryColors: Record<TopicCategory, string> = {
    daily: 'from-amber-500/20 to-orange-500/10',
    hobby: 'from-emerald-500/20 to-teal-500/10',
    icebreaker: 'from-sky-500/20 to-blue-500/10',
    challenge: 'from-violet-500/20 to-purple-500/10',
    deep: 'from-indigo-500/20 to-blue-800/10',
    game: 'from-pink-500/20 to-rose-500/10',
  };

  const categoryLabels: Record<TopicCategory, string> = {
    daily: '日常', hobby: '趣味', icebreaker: 'アイスブレイク',
    challenge: '2択チャレンジ', deep: '深い話', game: 'ゲーム',
  };

  return (
    <div
      className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40
        w-[85vw] max-w-sm pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        animation: isExpanding ? 'topic-card-enter 0.3s ease-out' : undefined,
      }}
    >
      {/* Card */}
      <div
        className={`relative rounded-3xl border border-white/10 backdrop-blur-2xl
          bg-gradient-to-br ${categoryColors[topic.category]}
          shadow-2xl overflow-hidden transition-all duration-300`}
        style={{
          boxShadow: glowIntensity > 0
            ? `0 0 ${30 + glowIntensity * 40}px rgba(139,92,246,${0.1 + glowIntensity * 0.2})`
            : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Category badge */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/8 text-white/50 font-medium">
            {categoryLabels[topic.category]}
          </span>
        </div>

        {/* Topic */}
        <div className="px-5 pb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5 shrink-0">{topic.emoji}</span>
            <p className="text-white/90 text-base leading-relaxed font-medium">
              {topic.text}
            </p>
          </div>
        </div>

        {/* 2択チャレンジ */}
        {topic.choices && (
          <div className="px-5 pb-4 flex gap-3">
            {topic.choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceSelect(choice)}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium
                  transition-all active:scale-95
                  ${selectedChoice === choice
                    ? 'bg-violet-500/30 border border-violet-400/40 text-violet-200'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <p className="text-[10px] text-white/20">スワイプで次のお題</p>
          <button
            onClick={onNext}
            className="text-xs text-white/30 hover:text-white/50 transition-colors
              px-3 py-1 rounded-full bg-white/5 active:scale-95"
          >
            スキップ →
          </button>
        </div>

        {/* Voice glow overlay */}
        {glowIntensity > 0 && (
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 80%, rgba(139,92,246,${glowIntensity * 0.15}), transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
