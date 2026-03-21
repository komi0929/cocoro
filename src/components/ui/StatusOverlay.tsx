/**
 * cocoro — StatusOverlay
 * HUD overlay: trust badge, level, daily challenge, streak, voice metrics
 */

import { useEffect } from 'react';
import { useEngineStore } from '@/store/useEngineStore';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';

export function StatusOverlay() {
  const trustProfile = useEngineStore(s => s.trustProfile);
  const level = useEngineStore(s => s.conversationLevel);
  const dailyState = useEngineStore(s => s.dailyState);
  const weeklyTheme = useEngineStore(s => s.weeklyTheme);
  const detailedLevel = useEngineStore(s => s.detailedLevel);
  const voiceMetrics = useEngineStore(s => s.voiceMetrics);
  const updateVoiceMetrics = useEngineStore(s => s.updateVoiceMetrics);
  const tickExpression = useEngineStore(s => s.tickExpression);

  // Update voice metrics + expression every frame via rAF
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = performance.now() / 1000;
      updateVoiceMetrics(t);
      tickExpression();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [updateVoiceMetrics, tickExpression]);

  if (!trustProfile) return null;

  const trustInfo = TrustScoreSystem.getLevelInfo(trustProfile.level);
  const xpPercent = level.xpToNext > 0 ? (level.xp / level.xpToNext) * 100 : 0;

  return (
    <div className="status-overlay">
      {/* Trust Badge */}
      <div className="trust-badge">
        <span className="trust-emoji">{trustInfo.emoji}</span>
        <span className="trust-label">{trustInfo.label}</span>
      </div>

      {/* Level Progress with detailed title */}
      <div className="level-progress">
        <div className="level-info">
          <span className="level-number">{detailedLevel.titleEmoji} Lv.{detailedLevel.level}</span>
          <span className="level-title">{detailedLevel.title}</span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <span className="xp-text">{level.xp}/{level.xpToNext} XP</span>
      </div>

      {/* Voice Activity Indicator */}
      {voiceMetrics && voiceMetrics.isSpeaking && (
        <div className="voice-indicator">
          <span>🎤</span>
          <div className="voice-bar-track">
            <div className="voice-bar-fill" style={{ width: `${voiceMetrics.volume * 100}%`, transition: 'width 0.1s' }} />
          </div>
        </div>
      )}

      {/* Daily Challenge */}
      {dailyState && (
        <div className="daily-challenge-badge">
          <span>{dailyState.todayChallenge.emoji}</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>{dailyState.todayChallenge.title}</span>
        </div>
      )}

      {/* Streak */}
      {dailyState && dailyState.currentStreak > 0 && (
        <div className="streak-badge">
          🔥 {dailyState.currentStreak}日
        </div>
      )}

      {/* Weekly Theme */}
      {weeklyTheme && (
        <div className="weekly-theme-badge">
          {weeklyTheme.emoji} {weeklyTheme.name}
        </div>
      )}
    </div>
  );
}
