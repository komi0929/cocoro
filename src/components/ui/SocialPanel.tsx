/**
 * cocoro — SocialPanel
 * Friends list, recent players, social status
 */

import { useEngineStore, ACHIEVEMENTS } from '@/store/useEngineStore';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';

export function SocialPanel({ onClose }: { onClose: () => void }) {
  const friends = useEngineStore(s => s.friends);
  const trustProfile = useEngineStore(s => s.trustProfile);
  const conversationLevel = useEngineStore(s => s.conversationLevel);
  const unlockedAchievements = useEngineStore(s => s.unlockedAchievements);
  const stats = useEngineStore(s => s.stats);

  const online = friends.filter(f => f.isOnline);
  const offline = friends.filter(f => !f.isOnline);

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-card panel-social" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>👥 ソーシャル</h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        {/* My Status */}
        {trustProfile && (
          <div className="social-my-status">
            <div className="social-status-row">
              <span className="social-trust-badge">
                {TrustScoreSystem.getLevelInfo(trustProfile.level).emoji}
                {TrustScoreSystem.getLevelInfo(trustProfile.level).label}
              </span>
              <span className="social-level-badge">Lv.{conversationLevel.level}</span>
            </div>
            <div className="social-stats-grid">
              <div className="social-stat">
                <span className="stat-value">{stats.sessions}</span>
                <span className="stat-label">セッション</span>
              </div>
              <div className="social-stat">
                <span className="stat-value">{stats.messages}</span>
                <span className="stat-label">メッセージ</span>
              </div>
              <div className="social-stat">
                <span className="stat-value">{stats.reactions}</span>
                <span className="stat-label">リアクション</span>
              </div>
              <div className="social-stat">
                <span className="stat-value">{stats.furniture}</span>
                <span className="stat-label">家具</span>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="social-section">
          <h4>🏆 実績 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</h4>
          <div className="achievement-grid">
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} className={`achievement-item ${unlocked ? 'unlocked' : 'locked'}`}>
                  <span className="achievement-emoji">{unlocked ? a.emoji : '🔒'}</span>
                  <span className="achievement-name">{a.name}</span>
                  <span className="achievement-desc">{a.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Friends */}
        <div className="social-section">
          <h4>👫 フレンド ({friends.length})</h4>
          {friends.length === 0 ? (
            <p className="social-empty">部屋で一緒に遊んだ人がフレンドになります</p>
          ) : (
            <>
              {online.length > 0 && (
                <div className="friend-group">
                  <span className="friend-group-label">🟢 オンライン</span>
                  {online.map(f => (
                    <div key={f.userId} className="friend-row">
                      <span className="friend-name">{f.name}</span>
                      <span className="friend-trust">{TrustScoreSystem.getLevelInfo(f.trustLevel).emoji}</span>
                    </div>
                  ))}
                </div>
              )}
              {offline.length > 0 && (
                <div className="friend-group">
                  <span className="friend-group-label">⚫ オフライン</span>
                  {offline.map(f => (
                    <div key={f.userId} className="friend-row">
                      <span className="friend-name">{f.name}</span>
                      <span className="friend-last-seen">
                        {formatLastSeen(f.lastSeen)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatLastSeen(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'さっき';
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return `${Math.floor(days / 7)}週前`;
}
