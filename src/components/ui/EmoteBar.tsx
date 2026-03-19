/**
 * cocoro - EmoteBar
 * Quick gesture picker UI
 */

import { EMOTE_LIST, useEmoteStore } from '@/store/useEmoteStore';
import { useState, useCallback } from 'react';

export function EmoteBar() {
  const [isOpen, setIsOpen] = useState(false);
  const currentEmote = useEmoteStore(s => s.currentEmote);
  const triggerEmote = useEmoteStore(s => s.triggerEmote);

  const handleEmote = useCallback((id: typeof EMOTE_LIST[number]['id']) => {
    triggerEmote(id);
    setIsOpen(false);
  }, [triggerEmote]);

  return (
    <div className="emote-bar">
      <button
        className={`emote-trigger ${currentEmote ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentEmote
          ? EMOTE_LIST.find(e => e.id === currentEmote)?.emoji ?? '\u{1F60A}'
          : '\u{1F3AD}'}
      </button>
      {isOpen && (
        <div className="emote-picker">
          {EMOTE_LIST.map(e => (
            <button
              key={e.id}
              className={`emote-emoji-btn ${currentEmote === e.id ? 'active' : ''}`}
              onClick={() => handleEmote(e.id)}
              title={e.label}
            >
              <span className="emote-emoji">{e.emoji}</span>
              <span className="emote-label">{e.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
