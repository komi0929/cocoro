/**
 * kokoro — Share Room Link
 * ルーム共有機能
 * URLコピー or Web Share API でルームリンクを共有
 */
'use client';

import { useState, useCallback } from 'react';

interface ShareRoomProps {
  roomId: string;
  roomName: string;
}

export function ShareRoom({ roomId, roomName }: ShareRoomProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/space?room=${roomId}`
    : '';

  const handleShare = useCallback(async () => {
    // Try Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `kokoro — ${roomName}`,
          text: `「${roomName}」に来ない？\nアバターで話そう 🫧`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or not supported
      }
    }

    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt
      window.prompt('リンクをコピー:', shareUrl);
    }
  }, [shareUrl, roomName]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl
        bg-white/5 border border-white/10 backdrop-blur-md
        hover:bg-white/8 active:scale-95 transition-all touch-manipulation
        text-sm text-white/60 hover:text-white/80"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 10.5L12 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-emerald-400">コピーしました</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 1.5H12.5V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.5 1.5L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M5.5 2.5H2.5C1.9 2.5 1.5 2.9 1.5 3.5V11.5C1.5 12.1 1.9 12.5 2.5 12.5H10.5C11.1 12.5 11.5 12.1 11.5 11.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>共有</span>
        </>
      )}
    </button>
  );
}
