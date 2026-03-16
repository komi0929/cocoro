/**
 * kokoro — Text Chat Overlay
 * ROM（聞き専）ユーザーも会話に参加できるテキストチャット
 * 3D空間に溶け込むフローティングバブル表示
 * 
 * 思想: 声を出せない/出したくないユーザーも「存在感」を持てる
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  avatarColor: string;
}

const MAX_VISIBLE_MESSAGES = 30;
const MESSAGE_LIFETIME_MS = 60000; // 1 minute

// Avatar colors for visual diversity
const CHAT_COLORS = [
  '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#a855f7', '#10b981',
  '#ef4444', '#3b82f6', '#14b8a6', '#f97316',
];

function hashToColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return CHAT_COLORS[Math.abs(h) % CHAT_COLORS.length];
}

export function TextChatOverlay() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localId = useKokoroStore((s) => s.localParticipantId);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup old messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => now - m.timestamp < MESSAGE_LIFETIME_MS));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !localId) return;

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: localId,
      senderName: localStorage.getItem('kokoro_display_name') ?? 'ゲスト',
      text: inputText.trim(),
      timestamp: Date.now(),
      avatarColor: hashToColor(localId),
    };

    setMessages((prev) => [...prev.slice(-MAX_VISIBLE_MESSAGES + 1), msg]);
    setInputText('');
  }, [inputText, localId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      className={`fixed bottom-20 left-0 right-0 z-30 transition-all duration-500 ease-out
        ${isExpanded ? 'h-72' : 'h-auto'}
        pointer-events-none`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto px-3 pointer-events-auto">
        {/* Messages area (visible only when expanded or has recent messages) */}
        {(isExpanded || messages.length > 0) && (
          <div
            ref={scrollRef}
            className={`overflow-y-auto mb-2 space-y-1.5 transition-all duration-300
              scrollbar-none
              ${isExpanded ? 'max-h-52 opacity-100' : 'max-h-20 opacity-70'}`}
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, black 20%, black)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black)',
            }}
          >
            {messages.map((msg) => {
              const isLocal = msg.senderId === localId;
              const age = msg.timestamp;
              const opacity = Math.max(0.3, age / MESSAGE_LIFETIME_MS);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isLocal ? 'flex-row-reverse' : ''}`}
                  style={{ opacity }}
                >
                  {/* Avatar dot */}
                  <div
                    className="w-5 h-5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: msg.avatarColor + '40', border: `1.5px solid ${msg.avatarColor}60` }}
                  />
                  {/* Bubble */}
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-xs max-w-[75%] backdrop-blur-md
                      ${isLocal
                        ? 'bg-violet-500/20 text-white/90 rounded-tr-sm'
                        : 'bg-white/8 text-white/80 rounded-tl-sm'
                      }`}
                  >
                    {!isLocal && (
                      <span className="text-[10px] font-medium block mb-0.5" style={{ color: msg.avatarColor }}>
                        {msg.senderName}
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2">
          {/* Expand/collapse toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-md border border-white/10
              flex items-center justify-center text-white/40 hover:text-white/60
              transition-all active:scale-90 touch-manipulation shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 5L7 10L12 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s',
                }}
              />
            </svg>
          </button>

          <div className="flex-1 flex items-center bg-white/5 backdrop-blur-md border border-white/10
            rounded-full px-4 py-2 focus-within:border-violet-500/30 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder="メッセージを送る..."
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25
                focus:outline-none min-w-0"
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="ml-2 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center
                disabled:opacity-20 disabled:cursor-default
                hover:bg-violet-400 active:scale-90 transition-all touch-manipulation shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 11L11 6L1 1V5L7 6L1 7V11Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
