/**
 * cocoro - TextChat
 * Lightweight bubble chat overlay
 * Messages appear as speech bubbles, auto-fade after 10s
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  timestamp: number;
}

let msgId = 0;

export function TextChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for incoming messages (from other peers via custom events)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { sender: string; text: string };
      const msg: ChatMessage = {
        id: ++msgId,
        sender: detail.sender,
        text: detail.text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev.slice(-50), msg]);
      // Auto-open on new message
      setIsOpen(true);
    };
    window.addEventListener('cocoro-chat', handler);
    return () => window.removeEventListener('cocoro-chat', handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-fade old messages
  useEffect(() => {
    const iv = setInterval(() => {
      const cutoff = Date.now() - 30000;
      setMessages(prev => prev.filter(m => m.timestamp > cutoff));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    // Add locally
    const msg: ChatMessage = {
      id: ++msgId,
      sender: '\u{1F464}',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev.slice(-50), msg]);

    // Dispatch for peers
    window.dispatchEvent(new CustomEvent('cocoro-chat-send', {
      detail: { text },
    }));
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat toggle */}
      <button
        className={`chat-toggle ${messages.length > 0 ? 'has-messages' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        {'\u{1F4AC}'}{messages.length > 0 && <span className="chat-badge">{messages.length}</span>}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <p className="chat-empty">{'\u30E1\u30C3\u30BB\u30FC\u30B8\u306F\u307E\u3060\u306A\u3044\u3088'}</p>
            )}
            {messages.map(m => (
              <div key={m.id} className="chat-bubble">
                <span className="chat-sender">{m.sender}</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B...'}
              maxLength={200}
            />
            <button className="chat-send-btn" onClick={handleSend}>
              {'\u{1F4E8}'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
