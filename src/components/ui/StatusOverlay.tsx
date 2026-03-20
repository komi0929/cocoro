/**
 * cocoro — StatusOverlay
 * HUD overlay showing trust badge, conversation level, achievements
 */

import { useEngineStore } from '@/store/useEngineStore';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';

export function StatusOverlay() {
  const trustProfile = useEngineStore(s => s.trustProfile);
  const level = useEngineStore(s => s.conversationLevel);

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
    </div>
  );
}
