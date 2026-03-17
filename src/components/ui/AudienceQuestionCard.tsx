/**
 * kokoro — Audience Question Card
 * リスナーが話者に「お題」を投げる — ラジオのお便り文化
 *
 * サイクル4: 聞いてる人が会話に「参加」する第2の方法
 * - ROM専がカードをプールから選んで「投げる」
 * - 話者の画面に質問が表示される
 * - 話者が答えると投げた人のアバターが拍手
 * = 声を出さなくても会話を「操縦」できる
 */
'use client';

import { useState, useCallback } from 'react';

interface QuestionCard {
  id: string;
  text: string;
  emoji: string;
  category: 'light' | 'deep' | 'funny';
}

const QUESTION_POOL: QuestionCard[] = [
  { id: 'q1', text: 'それのきっかけは？', emoji: '🔑', category: 'light' },
  { id: 'q2', text: '逆の立場だったらどうする？', emoji: '🔄', category: 'deep' },
  { id: 'q3', text: '今までで一番の失敗は？', emoji: '😅', category: 'funny' },
  { id: 'q4', text: 'もっと詳しく！', emoji: '🔍', category: 'light' },
  { id: 'q5', text: 'それ、いつの話？', emoji: '📅', category: 'light' },
  { id: 'q6', text: '正直、今でもそう思う？', emoji: '🤔', category: 'deep' },
  { id: 'q7', text: 'あるある！他にもある？', emoji: '✋', category: 'light' },
  { id: 'q8', text: 'もし○○だったら？', emoji: '💭', category: 'deep' },
  { id: 'q9', text: 'そのとき一番ヤバかったことは？', emoji: '😱', category: 'funny' },
  { id: 'q10', text: 'それを人生のベスト3に入れる？', emoji: '🏆', category: 'funny' },
];

interface AudienceQuestionCardProps {
  visible: boolean;
  onSendQuestion: (card: QuestionCard) => void;
}

export function AudienceQuestionCardPanel({ visible, onSendQuestion }: AudienceQuestionCardProps) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const handleSend = useCallback((card: QuestionCard) => {
    if (sentIds.has(card.id)) return;
    setSentIds(prev => new Set(prev).add(card.id));
    onSendQuestion(card);
    setShowFeedback(card.emoji);
    if (navigator.vibrate) navigator.vibrate([10, 15, 10]);
    setTimeout(() => setShowFeedback(null), 1200);
  }, [sentIds, onSendQuestion]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-[90vw] max-w-sm">
      {/* Send feedback */}
      {showFeedback && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl"
          style={{ animation: 'gesture-burst 1.2s ease-out forwards' }}>
          {showFeedback}
        </div>
      )}

      <div className="bg-[#1a1225]/85 backdrop-blur-xl rounded-2xl border border-white/8 p-3">
        <p className="text-[9px] text-white/30 text-center mb-2 uppercase tracking-widest">
          質問カードを投げよう
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {QUESTION_POOL.slice(0, 6).map(card => (
            <button
              key={card.id}
              onClick={() => handleSend(card)}
              disabled={sentIds.has(card.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs transition-all active:scale-95
                ${sentIds.has(card.id)
                  ? 'bg-white/3 text-white/15 cursor-not-allowed'
                  : 'bg-white/5 border border-white/8 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
            >
              {card.emoji} {card.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Received question display (for speakers) ===
interface ReceivedQuestionProps {
  question: QuestionCard | null;
  onDismiss: () => void;
}

export function ReceivedQuestion({ question, onDismiss }: ReceivedQuestionProps) {
  if (!question) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[80vw] max-w-xs"
      style={{ animation: 'topic-card-enter 0.4s ease-out' }}>
      <div className="bg-amber-500/10 backdrop-blur-2xl rounded-2xl border border-amber-400/20 p-4
        shadow-lg" onClick={onDismiss}>
        <p className="text-[9px] text-amber-300/50 uppercase tracking-widest mb-1">リスナーからの質問</p>
        <div className="flex items-center gap-2">
          <span className="text-xl">{question.emoji}</span>
          <p className="text-sm text-amber-100/80 font-medium">{question.text}</p>
        </div>
        <p className="text-[8px] text-amber-200/20 mt-2 text-right">タップで閉じる</p>
      </div>
    </div>
  );
}
