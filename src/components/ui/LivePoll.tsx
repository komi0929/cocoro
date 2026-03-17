/**
 * cocoro — Live Poll
 * 全員参加型リアルタイム投票
 *
 * サイクル53: 会話中に全員が参加できるインタラクション
 * - クイック投票(2-4択)
 * - 結果がリアルタイムで3D空間に表示
 * - 票が入るたびに棒グラフが伸びるアニメーション
 * = リスナーを「ただ聞いている人」から「参加者」に
 */
'use client';

import { useState, useCallback } from 'react';

export interface PollOption {
  id: string;
  text: string;
  emoji: string;
  votes: number;
}

export interface PollState {
  question: string;
  options: PollOption[];
  totalVotes: number;
  myVote: string | null;
  isOpen: boolean;
  createdAt: number;
}

interface LivePollProps {
  poll: PollState;
  onVote: (optionId: string) => void;
  onClose: () => void;
}

export function LivePoll({ poll, onVote, onClose }: LivePollProps) {
  const [voted, setVoted] = useState(!!poll.myVote);

  const handleVote = useCallback((optionId: string) => {
    if (voted) return;
    setVoted(true);
    onVote(optionId);
    if (navigator.vibrate) navigator.vibrate([10, 15, 10]);
  }, [voted, onVote]);

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-[90vw] max-w-sm"
      style={{ animation: 'topic-card-enter 0.4s ease-out' }}>
      <div className="bg-[#1a1225]/90 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-xl">
        {/* Question */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/80 font-medium">{poll.question}</p>
          <button onClick={onClose} className="text-white/20 text-xs">✕</button>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map(opt => {
            const percent = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
            const isMyVote = poll.myVote === opt.id;

            return (
              <button key={opt.id} onClick={() => handleVote(opt.id)}
                disabled={voted}
                className={`w-full relative overflow-hidden rounded-xl transition-all active:scale-98
                  ${isMyVote
                    ? 'border border-violet-400/30'
                    : 'border border-white/8'
                  } ${voted ? '' : 'hover:bg-white/5'}`}>
                {/* Progress bar */}
                {voted && (
                  <div className="absolute inset-0 bg-violet-500/10 transition-all duration-700"
                    style={{ width: `${percent}%` }} />
                )}
                <div className="relative flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-white/60">
                    {opt.emoji} {opt.text}
                  </span>
                  {voted && (
                    <span className="text-[10px] text-white/30">{Math.round(percent)}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[9px] text-white/15 text-center mt-2">
          {poll.totalVotes}票
        </p>
      </div>
    </div>
  );
}

/**
 * クイック投票作成エンジン
 */
export class PollEngine {
  private activePoll: PollState | null = null;

  create(question: string, options: Array<{ text: string; emoji: string }>): PollState {
    this.activePoll = {
      question,
      options: options.map((o, i) => ({ id: `opt_${i}`, text: o.text, emoji: o.emoji, votes: 0 })),
      totalVotes: 0, myVote: null,
      isOpen: true, createdAt: Date.now(),
    };
    return this.activePoll;
  }

  vote(optionId: string): PollState | null {
    if (!this.activePoll || this.activePoll.myVote) return null;
    const opt = this.activePoll.options.find(o => o.id === optionId);
    if (!opt) return null;
    opt.votes++;
    this.activePoll.totalVotes++;
    this.activePoll.myVote = optionId;
    return { ...this.activePoll };
  }

  receiveVote(optionId: string): void {
    if (!this.activePoll) return;
    const opt = this.activePoll.options.find(o => o.id === optionId);
    if (opt) {
      opt.votes++;
      this.activePoll.totalVotes++;
    }
  }

  getPoll(): PollState | null { return this.activePoll; }
  closePoll(): void { if (this.activePoll) this.activePoll.isOpen = false; }
}
