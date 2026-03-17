/**
 * kokoro — Friend Panel
 * フレンド一覧 + オンライン状態表示
 *
 * 反復346-355 (UI部分):
 * - オンラインのフレンド → 部屋に参加ボタン
 * - オフラインフレンド → 最後に見た時間
 * - フレンド申請受信
 */
'use client';

import { useMemo } from 'react';
import type { Friend, FriendRequest } from '@/engine/social/SocialGraph';

interface FriendPanelProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onJoinRoom: (roomId: string) => void;
  onAcceptRequest: (fromId: string) => void;
  onClose: () => void;
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const text = useMemo(() => {
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
  }, [timestamp]);
  return <>{text}</>;
}

export function FriendPanel({ friends, pendingRequests, onJoinRoom, onAcceptRequest, onClose }: FriendPanelProps) {
  const online = friends.filter(f => f.isOnline);
  const offline = friends.filter(f => !f.isOnline);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ animation: 'fade-in-up 0.3s ease-out' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm max-h-[70vh] bg-[#1a1225]/95 backdrop-blur-2xl
        rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white/90">フレンド</h2>
            <p className="text-xs text-white/30">{online.length}人オンライン</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">フレンド申請</p>
              {pendingRequests.map(req => (
                <div key={req.fromId} className="flex items-center justify-between p-3 rounded-2xl bg-violet-500/8 border border-violet-500/15 mb-2">
                  <span className="text-sm text-white/70">{req.fromName}</span>
                  <button onClick={() => onAcceptRequest(req.fromId)}
                    className="px-3 py-1 rounded-xl bg-violet-500/20 text-xs text-violet-300 font-medium
                      hover:bg-violet-500/30 active:scale-95 transition-all">
                    承認
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Online */}
          {online.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">🟢 オンライン</p>
              {online.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/8 mb-2">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                      {f.displayName.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1a1225]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{f.displayName}</p>
                    {f.currentRoomName && (
                      <p className="text-[10px] text-white/30 truncate">🏠 {f.currentRoomName}</p>
                    )}
                  </div>
                  {f.currentRoomId && (
                    <button onClick={() => onJoinRoom(f.currentRoomId!)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-xs text-emerald-300
                        hover:bg-emerald-500/25 active:scale-95 transition-all">
                      参加
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Offline */}
          {offline.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">オフライン</p>
              {offline.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg text-white/20">
                    {f.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/40 truncate">{f.displayName}</p>
                    <p className="text-[10px] text-white/15"><TimeAgo timestamp={f.lastSeenAt} /></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friends.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-3">👋</p>
              <p className="text-sm text-white/40">まだフレンドがいません</p>
              <p className="text-xs text-white/20 mt-1">部屋で話した後にフレンド申請してみよう！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
