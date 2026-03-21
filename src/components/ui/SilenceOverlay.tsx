/**
 * cocoro — Silence Overlay
 * 沈黙を「気まずさ」から「演出」に変える可視化レイヤー
 * 
 * Phase: ambient(BGMフェードイン) → thinking(考え中) → suggest(トピック提案) → encourage(励まし)
 */

import { useEffect } from 'react';
import { useEngineStore } from '@/store/useEngineStore';

const TOPICS = [
  '好きな食べ物は？ 🍕',
  '最近見たアニメは？ 📺',
  '得意なことは？ ⭐',
  '行ってみたい場所は？ ✈️',
  '好きな動物は？ 🐱',
  '将来の夢は？ ✨',
  '好きなゲームは？ 🎮',
  '最近嬉しかったことは？ 😊',
];

export function SilenceOverlay() {
  const silenceState = useEngineStore(s => s.silenceState);
  const updateSilence = useEngineStore(s => s.updateSilence);

  // Poll silence state every second (simulated — no real voice detection yet, just demo)
  useEffect(() => {
    // In production, this would be called from the voice pipeline
    // For now, update with "nobody speaking" when component mounts
    const interval = setInterval(() => {
      // TODO: Connect to real voice activity detection
      // For now, assume silence when no users are speaking
      updateSilence(false, 2);
    }, 1000);
    return () => clearInterval(interval);
  }, [updateSilence]);

  if (silenceState.phase === 'none') return null;

  const topicIndex = Math.floor(Date.now() / 30000) % TOPICS.length;

  return (
    <div style={{
      position: 'fixed',
      bottom: 120,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 800,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Phase: thinking */}
      {silenceState.showThinking && (
        <div style={{
          padding: '8px 20px',
          borderRadius: 20,
          background: 'rgba(139,92,246,0.15)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          💭 考え中...
        </div>
      )}

      {/* Phase: suggest topic */}
      {silenceState.showTopicSuggestion && (
        <div style={{
          padding: '10px 24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
        }}>
          🃏 話のタネ: {TOPICS[topicIndex]}
        </div>
      )}

      {/* Phase: encouragement */}
      {silenceState.showEncouragement && (
        <div style={{
          padding: '6px 16px',
          borderRadius: 12,
          background: 'rgba(34,197,94,0.15)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
        }}>
          {silenceState.encouragementText}
        </div>
      )}
    </div>
  );
}
