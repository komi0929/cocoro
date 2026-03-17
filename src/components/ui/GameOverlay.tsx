/**
 * cocoro — Game Overlay UI
 * 会話ゲームの進行をオーバーレイで表示
 *
 * 反復356-365 (UI部分):
 * - ゲーム選択画面
 * - プレイ中: タイマー + お題 + 参加者状態
 * - ワードウルフ: 投票画面
 * - 結果発表画面
 */
'use client';

import { useState } from 'react';
import type { GameState, GameType } from '@/engine/game/ConversationGameEngine';

interface GameOverlayProps {
  gameState: GameState | null;
  myId: string;
  onSelectGame: (type: GameType) => void;
  onVote?: (targetId: string) => void;
  onClose: () => void;
  remainingSeconds: number;
}

const GAME_INFO: Record<GameType, { emoji: string; name: string; description: string }> = {
  word_wolf: { emoji: '🐺', name: 'ワードウルフ', description: '1人だけ違うお題！誰が狼か当てよう' },
  association: { emoji: '🔗', name: '連想ゲーム', description: '前の人の言葉から連想する言葉を声で！' },
  ng_word: { emoji: '🚫', name: 'NGワード', description: '禁止ワードを使ったらアウト！' },
  one_minute_speech: { emoji: '⏱️', name: '1分間スピーチ', description: 'お題について1分間自由に語ろう！' },
};

export function GameOverlay({
  gameState, myId, onSelectGame, onVote, onClose, remainingSeconds,
}: GameOverlayProps) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  // Game selection
  if (!gameState || gameState.phase === 'lobby') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28">
        <div className="w-full max-w-sm bg-[#1a1225]/95 backdrop-blur-2xl rounded-3xl
          border border-white/10 shadow-2xl overflow-hidden"
          style={{ animation: 'fade-in-up 0.3s ease-out' }}>
          <div className="p-5 text-center">
            <p className="text-xs text-white/40 uppercase tracking-widest">みんなで遊ぼう</p>
            <h2 className="text-lg font-bold text-white/90 mt-1">会話ゲーム</h2>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {(Object.entries(GAME_INFO) as Array<[GameType, typeof GAME_INFO[GameType]]>).map(
              ([type, info]) => (
                <button
                  key={type}
                  onClick={() => onSelectGame(type)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl
                    bg-white/5 border border-white/8 hover:bg-white/10
                    active:scale-98 transition-all text-left"
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-white/80">{info.name}</p>
                    <p className="text-xs text-white/30">{info.description}</p>
                  </div>
                </button>
              ),
            )}
          </div>

          <div className="p-4 pt-0">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/5 text-sm text-white/40
                hover:bg-white/8 transition-all">
              やめる
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myParticipant = gameState.participants.find(p => p.id === myId);
  const gameInfo = GAME_INFO[gameState.type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm">
      <div className="bg-[#1a1225]/90 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{gameInfo.emoji}</span>
            <span className="text-sm font-medium text-white/80">{gameInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono tabular-nums ${remainingSeconds < 30 ? 'text-red-400' : 'text-white/60'}`}>
              {Math.floor(remainingSeconds / 60)}:{String(Math.floor(remainingSeconds % 60)).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Playing phase */}
        {gameState.phase === 'playing' && (
          <>
            {/* Word Wolf: show assigned word */}
            {gameState.type === 'word_wolf' && myParticipant?.assignedWord && (
              <div className="bg-white/5 rounded-xl p-3 text-center mb-3">
                <p className="text-[10px] text-white/30 mb-1">あなたのお題</p>
                <p className="text-xl font-bold text-violet-300">{myParticipant.assignedWord}</p>
                <p className="text-[10px] text-white/20 mt-1">他の人のお題と比べて…違う人を探せ！</p>
              </div>
            )}

            {/* Association: current word */}
            {gameState.type === 'association' && gameState.currentWord && (
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 mb-1">今のワード</p>
                <p className="text-2xl font-bold text-emerald-300">{gameState.currentWord}</p>
                <p className="text-[10px] text-white/20 mt-1">声で連想する言葉を言おう！</p>
              </div>
            )}

            {/* NG Word */}
            {gameState.type === 'ng_word' && gameState.ngWord && (
              <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
                <p className="text-[10px] text-white/30 mb-1">🚫 禁止ワード</p>
                <p className="text-xl font-bold text-red-300">「{gameState.ngWord}」</p>
                <p className="text-[10px] text-white/20 mt-1">この言葉を使ったらアウト！</p>
              </div>
            )}

            {/* 1 Minute Speech */}
            {gameState.type === 'one_minute_speech' && gameState.speechTopic && (
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 mb-1">お題</p>
                <p className="text-lg font-bold text-amber-300">「{gameState.speechTopic}」</p>
                <p className="text-[10px] text-white/20 mt-1">1分間自由に語りましょう！</p>
              </div>
            )}
          </>
        )}

        {/* Vote phase (Word Wolf) */}
        {gameState.phase === 'reveal' && gameState.type === 'word_wolf' && (
          <div className="space-y-2">
            <p className="text-xs text-white/40 text-center mb-2">誰が狼だと思う？</p>
            {gameState.participants.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedVote(p.id); onVote?.(p.id); }}
                disabled={p.id === myId}
                className={`w-full py-2.5 px-4 rounded-xl text-sm flex items-center justify-between
                  transition-all active:scale-98
                  ${selectedVote === p.id
                    ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200'
                    : p.id === myId
                      ? 'bg-white/3 text-white/20 cursor-not-allowed'
                      : 'bg-white/5 border border-white/8 text-white/60 hover:bg-white/10'
                  }`}
              >
                <span>{p.displayName} {p.id === myId ? '(自分)' : ''}</span>
                {selectedVote === p.id && <span>🐺</span>}
              </button>
            ))}
          </div>
        )}

        {/* Result */}
        {gameState.phase === 'result' && (
          <div className="text-center py-2">
            <p className="text-xl">🎉</p>
            <p className="text-sm text-white/80 font-medium mt-1">ゲーム終了！</p>
            <button onClick={onClose}
              className="mt-3 px-6 py-2 rounded-xl bg-white/10 text-sm text-white/60
                hover:bg-white/15 transition-all">
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
