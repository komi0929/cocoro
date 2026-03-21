/**
 * cocoro — SocialPanel
 * Friends list, safety, invite, favorites, privacy
 */

import { useState } from 'react';
import { useEngineStore, ACHIEVEMENTS } from '@/store/useEngineStore';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';
import { useRoomStore } from '@/store/useRoomStore';
import { useUserStore } from '@/store/useUserStore';

export function SocialPanel({ onClose }: { onClose: () => void }) {
  const friends = useEngineStore(s => s.friends);
  const trustProfile = useEngineStore(s => s.trustProfile);
  const conversationLevel = useEngineStore(s => s.conversationLevel);
  const unlockedAchievements = useEngineStore(s => s.unlockedAchievements);
  const stats = useEngineStore(s => s.stats);
  const detailedLevel = useEngineStore(s => s.detailedLevel);
  const favoriteRoomsList = useEngineStore(s => s.favoriteRoomsList);
  const privacySettings = useEngineStore(s => s.privacySettings);
  const toggleSafeZone = useEngineStore(s => s.toggleSafeZone);
  const createInviteLink = useEngineStore(s => s.createInviteLink);
  const toggleFavoriteRoom = useEngineStore(s => s.toggleFavoriteRoom);
  const playSFX = useEngineStore(s => s.playSFX);
  const safetyBoundary = useEngineStore(s => s.safetyBoundary);

  const currentRoom = useRoomStore(s => s.currentRoom);
  const user = useUserStore(s => s.user);

  const [tab, setTab] = useState<'social' | 'safety' | 'privacy'>('social');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const online = friends.filter(f => f.isOnline);
  const offline = friends.filter(f => !f.isOnline);
  const isSafeZone = safetyBoundary.isSafeZoneActive();

  const handleCreateInvite = () => {
    if (!currentRoom || !user) return;
    const link = createInviteLink(currentRoom.id, currentRoom.theme, user.name);
    setInviteUrl(link.url);
    playSFX('reaction');
    if (navigator.clipboard) navigator.clipboard.writeText(link.url);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-card panel-social" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>👥 ソーシャル</h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          <button className={`panel-tab ${tab === 'social' ? 'active' : ''}`} onClick={() => setTab('social')}>フレンド</button>
          <button className={`panel-tab ${tab === 'safety' ? 'active' : ''}`} onClick={() => setTab('safety')}>🛡️ 安全</button>
          <button className={`panel-tab ${tab === 'privacy' ? 'active' : ''}`} onClick={() => setTab('privacy')}>🔒 設定</button>
        </div>

        {tab === 'social' && (
          <>
            {/* My Status with detailed level */}
            {trustProfile && (
              <div className="social-my-status">
                <div className="social-status-row">
                  <span className="social-trust-badge">
                    {TrustScoreSystem.getLevelInfo(trustProfile.level).emoji}
                    {TrustScoreSystem.getLevelInfo(trustProfile.level).label}
                  </span>
                  <span className="social-level-badge">
                    {detailedLevel.titleEmoji} Lv.{detailedLevel.level} {detailedLevel.title}
                  </span>
                </div>
                <div className="social-stats-grid">
                  <div className="social-stat"><span className="stat-value">{stats.sessions}</span><span className="stat-label">セッション</span></div>
                  <div className="social-stat"><span className="stat-value">{stats.reactions}</span><span className="stat-label">リアクション</span></div>
                  <div className="social-stat"><span className="stat-value">{friends.length}</span><span className="stat-label">フレンド</span></div>
                  <div className="social-stat"><span className="stat-value">{stats.furniture}</span><span className="stat-label">家具</span></div>
                </div>
              </div>
            )}

            {/* Invite Link */}
            {currentRoom && (
              <div className="social-section">
                <h4>📨 友達を招待</h4>
                <button className="btn btn-primary" onClick={handleCreateInvite} style={{ width: '100%' }}>
                  🔗 招待リンクを作成
                </button>
                {inviteUrl && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, wordBreak: 'break-all' }}>
                    ✅ コピー済み: {inviteUrl}
                  </p>
                )}
              </div>
            )}

            {/* Favorite Rooms */}
            {currentRoom && (
              <div className="social-section">
                <h4>⭐ お気に入り部屋</h4>
                <button
                  className="btn btn-ghost"
                  onClick={() => toggleFavoriteRoom(currentRoom.id, currentRoom.theme)}
                  style={{ width: '100%' }}
                >
                  {favoriteRoomsList.some(r => r.roomId === currentRoom.id) ? '⭐ お気に入りから削除' : '☆ この部屋をお気に入り'}
                </button>
                {favoriteRoomsList.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {favoriteRoomsList.map(r => (
                      <div key={r.roomId}>⭐ {r.roomName} ({r.visitCount}回訪問)</div>
                    ))}
                  </div>
                )}
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
                          <span className="friend-last-seen">{formatLastSeen(f.lastSeen)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {tab === 'safety' && (
          <>
            <div className="social-section">
              <h4>🛡️ 安全機能</h4>
              <button
                className={`btn ${isSafeZone ? 'btn-danger' : 'btn-primary'}`}
                onClick={toggleSafeZone}
                style={{ width: '100%', marginBottom: 8 }}
              >
                {isSafeZone ? '🛡️ セーフゾーン解除' : '🛡️ セーフゾーンON（全音声遮断）'}
              </button>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                セーフゾーンONで、全ての音声を即座に遮断。安心して休憩できます。
              </p>
            </div>
            <div className="social-section">
              <h4>📢 通報について</h4>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                不快な行為を受けた場合は、相手のアバターをタップして通報できます。
                音声データは保存されません。
              </p>
            </div>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <div className="social-section">
              <h4>🔒 プライバシー設定</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>オンライン状態を公開</span>
                  <span>{privacySettings.showOnlineStatus ? '✅ ON' : '❌ OFF'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>フレンド申請を受付</span>
                  <span>{privacySettings.allowFriendRequests ? '✅ ON' : '❌ OFF'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>ルーム検索に表示</span>
                  <span>{privacySettings.showInDiscovery ? '✅ ON' : '❌ OFF'}</span>
                </div>
              </div>
            </div>
            <div className="social-section">
              <h4>📊 データ管理</h4>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                🔒 音声はリアルタイム処理のみ、録音しません
                <br />📍 位置情報・連絡先にアクセスしません
                <br />👤 アカウントなしでも参加できます
                <br />🗑️ いつでもデータを完全削除できます
              </p>
            </div>
          </>
        )}
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
