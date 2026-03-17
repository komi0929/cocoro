/**
 * cocoro — Friend Request Button
 * 会話後のワンタップフレンド申請
 *
 * 反復346-355 (UI部分2):
 * - プロフィールカード上に配置
 * - タップすると送信 + 確認演出
 */
'use client';

import { useState, useCallback } from 'react';

interface FriendRequestButtonProps {
  targetId: string;
  targetName: string;
  isFriend: boolean;
  onSendRequest: (targetId: string) => void;
}

export function FriendRequestButton({ targetId, targetName, isFriend, onSendRequest }: FriendRequestButtonProps) {
  const [sent, setSent] = useState(false);

  const handleTap = useCallback(() => {
    if (isFriend || sent) return;
    onSendRequest(targetId);
    setSent(true);
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
  }, [targetId, isFriend, sent, onSendRequest]);

  if (isFriend) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
        <span className="text-xs">✅</span>
        <span className="text-xs text-emerald-300/70">フレンド</span>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/15"
        style={{ animation: 'fade-in-up 0.3s ease-out' }}>
        <span className="text-xs">💌</span>
        <span className="text-xs text-violet-300/70">申請済み</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleTap}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl
        bg-violet-500/15 border border-violet-400/20 text-violet-200
        text-xs font-medium hover:bg-violet-500/25
        active:scale-95 transition-all"
    >
      <span>👋</span>
      <span>フレンド申請</span>
    </button>
  );
}
