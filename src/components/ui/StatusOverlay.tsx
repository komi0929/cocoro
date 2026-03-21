/**
 * cocoro — StatusOverlay
 * HUD overlay showing trust badge, conversation level, daily challenge, streak
 */

import { useEngineStore } from '@/store/useEngineStore';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';

export function StatusOverlay() {
  const trustProfile = useEngineStore(s => s.trustProfile);
  const level = useEngineStore(s => s.conversationLevel);
  const dailyState = useEngineStore(s => s.dailyState);
  const weeklyTheme = useEngineStore(s => s.weeklyTheme);

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

      {/* Level Progress */}
      <div className="level-progress">
        <div className="level-info">
          <span className="level-number">Lv.{level.level}</span>
          <span className="level-title">{level.title}</span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <span className="xp-text">{level.xp}/{level.xpToNext} XP</span>
      </div>

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
