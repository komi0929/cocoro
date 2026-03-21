/**
 * cocoro — ActivityPanel
 * Conversation games, shared activities, session achievements
 */

import { useState } from 'react';
import { useEngineStore, GAME_TOPICS, type GameType } from '@/store/useEngineStore';

const GAME_TYPES: GameType[] = ['shiritori', 'topic_talk', 'two_choices', 'word_chain', 'emoji_quiz'];

const CONVO_GAME_LABELS = [
  { type: 'word_wolf' as const, emoji: '🐺', name: 'ワードウルフ', desc: '仲間外れを探せ' },
  { type: 'association' as const, emoji: '🔗', name: '連想ゲーム', desc: '言葉をつなげよう' },
  { type: 'ng_word' as const, emoji: '🚫', name: 'NGワード', desc: '禁止ワードに注意' },
  { type: 'one_minute_speech' as const, emoji: '⏱️', name: '1分スピーチ', desc: 'テーマで1分間' },
];

const ACTIVITY_LABELS = [
  { type: 'word_wolf' as const, emoji: '🐺', name: 'ワードウルフ', desc: '仲間外れは誰？' },
  { type: 'association_game' as const, emoji: '🔗', name: '連想ゲーム', desc: '言葉のリレー' },
  { type: 'jukebox' as const, emoji: '🎵', name: 'ジュークボックス', desc: '一緒に音楽' },
  { type: 'drawing_relay' as const, emoji: '🎨', name: 'お絵かきリレー', desc: '絵でつなげよう' },
  { type: 'this_or_that' as const, emoji: '❓', name: 'あれかこれか', desc: '二択で盛り上がれ' },
];

export function ActivityPanel({ onClose }: { onClose: () => void }) {
  const startGame = useEngineStore(s => s.startGame);
  const endGame = useEngineStore(s => s.endGame);
  const currentGame = useEngineStore(s => s.currentGame);
  const nextRound = useEngineStore(s => s.nextRound);
  const startConvoGame = useEngineStore(s => s.startConvoGame);
  const convoGame = useEngineStore(s => s.convoGame);
  const startActivity = useEngineStore(s => s.startActivity);
  const endActivity = useEngineStore(s => s.endActivity);
  const activeActivity = useEngineStore(s => s.activeActivity);
  const sessionAchievements = useEngineStore(s => s.sessionAchievements);
  const sessionAchievementsList = useEngineStore(s => s.sessionAchievementsList);
  const playSFX = useEngineStore(s => s.playSFX);

  const [tab, setTab] = useState<'games' | 'active' | 'convo' | 'activities' | 'achievements'>('games');

  const achievements = sessionAchievements.getSessionAchievements();

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-card panel-activity" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>🎮 アクティビティ</h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          <button className={`panel-tab ${tab === 'games' ? 'active' : ''}`} onClick={() => setTab('games')}>
            お題ゲーム
          </button>
          <button className={`panel-tab ${tab === 'convo' ? 'active' : ''}`} onClick={() => setTab('convo')}>
            会話ゲーム
          </button>
          <button className={`panel-tab ${tab === 'activities' ? 'active' : ''}`} onClick={() => setTab('activities')}>
            みんなで遊ぶ
          </button>
          <button className={`panel-tab ${tab === 'achievements' ? 'active' : ''}`} onClick={() => setTab('achievements')}>
            🏅 {achievements.length}
          </button>
          {(currentGame || convoGame || activeActivity) && (
            <button className={`panel-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
              プレイ中 🟢
            </button>
          )}
        </div>

        {/* Simple topic games */}
        {tab === 'games' && (
          <div className="activity-grid">
            {GAME_TYPES.map(type => {
              const game = GAME_TOPICS[type];
              return (
                <button
                  key={type}
                  className="activity-card"
                  onClick={() => { startGame(type); playSFX('peak'); setTab('active'); }}
                  disabled={!!currentGame}
                >
                  <span className="activity-emoji">{game.emoji}</span>
                  <span className="activity-name">{game.name}</span>
                  <span className="activity-desc">{game.topics.length}パターン</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Conversation games (ConversationGameEngine) */}
        {tab === 'convo' && (
          <div className="activity-grid">
            {CONVO_GAME_LABELS.map(g => (
              <button
                key={g.type}
                className="activity-card"
                onClick={() => {
                  startConvoGame(g.type, [{ id: 'local', displayName: 'あなた' }]);
                  setTab('active');
                }}
                disabled={!!convoGame}
              >
                <span className="activity-emoji">{g.emoji}</span>
                <span className="activity-name">{g.name}</span>
                <span className="activity-desc">{g.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Shared activities (SharedActivitiesManager) */}
        {tab === 'activities' && (
          <div className="activity-grid">
            {ACTIVITY_LABELS.map(a => (
              <button
                key={a.type}
                className="activity-card"
                onClick={() => {
                  startActivity(a.type, ['local']);
                  playSFX('peak');
                  setTab('active');
                }}
                disabled={!!activeActivity}
              >
                <span className="activity-emoji">{a.emoji}</span>
                <span className="activity-name">{a.name}</span>
                <span className="activity-desc">{a.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Session achievements */}
        {tab === 'achievements' && (
          <div className="social-section">
            <h4>🏅 今回の実績</h4>
            {achievements.length === 0 ? (
              <p className="social-empty">まだ実績がありません。通話を楽しもう！</p>
            ) : (
              <div className="achievement-grid">
                {achievements.map(a => (
                  <div key={a.id} className="achievement-item unlocked">
                    <span className="achievement-emoji">{a.icon}</span>
                    <span className="achievement-name">{a.title}</span>
                    <span className="achievement-desc">{a.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active game display */}
        {tab === 'active' && currentGame && (
          <div className="active-game">
            <div className="game-header">
              <span className="game-type-emoji">{GAME_TOPICS[currentGame.type].emoji}</span>
              <span className="game-type-name">{GAME_TOPICS[currentGame.type].name}</span>
              <span className="game-round">R{currentGame.round}</span>
            </div>
            <div className="game-topic">
              <span className="game-topic-label">お題</span>
              <span className="game-topic-text">{currentGame.topic}</span>
            </div>
            <div className="game-actions">
              <button className="btn btn-primary" onClick={() => { nextRound(); playSFX('reaction'); }} style={{ flex: 1 }}>
                🔄 次のお題
              </button>
              <button className="btn btn-danger" onClick={endGame} style={{ flex: 1 }}>
                ⏹️ 終了
              </button>
            </div>
          </div>
        )}

        {tab === 'active' && activeActivity && (
          <div className="active-game">
            <div className="game-header">
              <span className="game-type-emoji">{activeActivity.activity.emoji}</span>
              <span className="game-type-name">{activeActivity.activity.name}</span>
            </div>
            <div className="game-topic">
              <span className="game-topic-label">説明</span>
              <span className="game-topic-text">{activeActivity.activity.description}</span>
            </div>
            <div className="game-actions">
              <button className="btn btn-danger" onClick={endActivity} style={{ flex: 1 }}>
                ⏹️ 終了
              </button>
            </div>
          </div>
        )}

        {tab === 'active' && !currentGame && !convoGame && !activeActivity && (
          <div className="no-game">
            <p>アクティビティが選択されていません</p>
            <button className="btn btn-ghost" onClick={() => setTab('games')}>ゲームを選ぶ →</button>
          </div>
        )}
      </div>
    </div>
  );
}
