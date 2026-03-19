/**
 * cocoro - AvatarEmotes
 * Quick gesture/emote system for avatars
 * Emotes trigger animation states on the VoxelAvatar
 */

import { create } from 'zustand';

export type EmoteType = 'wave' | 'dance' | 'jump' | 'spin' | 'sit' | 'clap' | 'sleep' | 'think';

export interface EmoteState {
  currentEmote: EmoteType | null;
  emoteStartTime: number;

  triggerEmote: (emote: EmoteType) => void;
  clearEmote: () => void;
}

export const EMOTE_LIST: { id: EmoteType; emoji: string; label: string }[] = [
  { id: 'wave', emoji: '\u{1F44B}', label: '\u624B\u3092\u632F\u308B' },
  { id: 'dance', emoji: '\u{1F57A}', label: '\u30C0\u30F3\u30B9' },
  { id: 'jump', emoji: '\u2B50', label: '\u30B8\u30E3\u30F3\u30D7' },
  { id: 'spin', emoji: '\u{1F300}', label: '\u30B9\u30D4\u30F3' },
  { id: 'sit', emoji: '\u{1FA91}', label: '\u5EA7\u308B' },
  { id: 'clap', emoji: '\u{1F44F}', label: '\u62CD\u624B' },
  { id: 'sleep', emoji: '\u{1F4A4}', label: '\u5C45\u7720\u308A' },
  { id: 'think', emoji: '\u{1F914}', label: '\u8003\u3048\u4E2D' },
];

// Emote durations (ms)
export const EMOTE_DURATIONS: Record<EmoteType, number> = {
  wave: 2000,
  dance: 4000,
  jump: 1500,
  spin: 2000,
  sit: 10000,
  clap: 2500,
  sleep: 8000,
  think: 5000,
};

export const useEmoteStore = create<EmoteState>((set) => ({
  currentEmote: null,
  emoteStartTime: 0,

  triggerEmote: (emote) => {
    set({ currentEmote: emote, emoteStartTime: Date.now() });
    // Auto-clear after duration
    const duration = EMOTE_DURATIONS[emote];
    setTimeout(() => {
      set(s => s.currentEmote === emote ? { currentEmote: null } : s);
    }, duration);
  },

  clearEmote: () => set({ currentEmote: null }),
}));
