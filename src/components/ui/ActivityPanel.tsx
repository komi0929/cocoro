/**
 * cocoro — ActivityPanel
 * Conversation games & shared activities UI
 */

import { useState } from 'react';
import { useEngineStore, GAME_TOPICS, type GameType } from '@/store/useEngineStore';

const GAME_TYPES: GameType[] = ['shiritori', 'topic_talk', 'two_choices', 'word_chain', 'emoji_quiz'];

export function ActivityPanel({ onClose }: { onClose: () => void }) {
  const startGame = useEngineStore(s => s.startGame);
  const endGame = useEngineStore(s => s.endGame);
  const currentGame = useEngineStore(s => s.currentGame);
  const nextRound = useEngineStore(s => s.nextRound);
  const [tab, setTab] = useState<'games' | 'active'>('games');

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
            ゲーム選択
          </button>
          <button
            className={`panel-tab ${tab === 'active' ? 'active' : ''}`}
            onClick={() => setTab('active')}
            disabled={!currentGame}
          >
            プレイ中 {currentGame ? '🟢' : ''}
          </button>
        </div>

        {tab === 'games' && (
          <div className="activity-grid">
            {GAME_TYPES.map(type => {
              const game = GAME_TOPICS[type];
              return (
                <button
                  key={type}
                  className="activity-card"
                  onClick={() => { startGame(type); setTab('active'); }}
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
              <button className="btn btn-primary" onClick={nextRound} style={{ flex: 1 }}>
                🔄 次のお題
              </button>
              <button className="btn btn-danger" onClick={endGame} style={{ flex: 1 }}>
                ⏹️ 終了
              </button>
            </div>
          </div>
        )}

        {tab === 'active' && !currentGame && (
          <div className="no-game">
            <p>アクティビティが選択されていません</p>
            <button className="btn btn-ghost" onClick={() => setTab('games')}>ゲームを選ぶ →</button>
          </div>
        )}
      </div>
    </div>
  );
}
