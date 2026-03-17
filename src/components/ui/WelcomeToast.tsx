/**
 * cocoro — Welcome Toast
 * 入室歓迎オーバーレイ
 * 
 * 他のユーザーが参加した時に温かい通知を表示
 * = 「空間に人がいる」実感を生む
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useCocoroStore } from '@/store/useCocoroStore';

interface ToastMessage {
  id: string;
  name: string;
  type: 'join' | 'leave';
  timestamp: number;
}

export function WelcomeToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const localId = useCocoroStore((s) => s.localParticipantId);
  const prevSizeRef = useRef(0);

  const addToast = useCallback((name: string, type: 'join' | 'leave') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, name, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Poll participant count changes
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useCocoroStore.getState();
      const currentSize = state.participants.size;
      if (currentSize > prevSizeRef.current && prevSizeRef.current > 0) {
        // New participant joined
        const allParticipants = Array.from(state.participants.values());
        const newest = allParticipants[allParticipants.length - 1];
        if (newest && newest.id !== localId) {
          addToast(newest.displayName, 'join');
        }
      }
      prevSizeRef.current = currentSize;
    }, 500);
    return () => clearInterval(interval);
  }, [localId, addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="px-5 py-3 rounded-2xl backdrop-blur-xl text-white text-sm font-medium
                     shadow-2xl"
          style={{
            background: toast.type === 'join'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(168, 85, 247, 0.85))'
              : 'linear-gradient(135deg, rgba(107, 114, 128, 0.75), rgba(75, 85, 99, 0.75))',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: `slideDown 0.4s ease-out ${i * 100}ms both`,
          }}
        >
          {toast.type === 'join' ? (
            <span>
              ✨ <strong>{toast.name}</strong> が参加しました
            </span>
          ) : (
            <span>
              👋 <strong>{toast.name}</strong> が退出しました
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
