/**
 * kokoro — Zustand Global Store
 * アバター状態、フェーズ、ライティングを一元管理
 */

import { create } from 'zustand';
import {
  SpacePhase,
  type KokoroStore,
  type Participant,
  type ReactionEvent,
  type LightingState,
} from '@/types/kokoro';

export const useKokoroStore = create<KokoroStore>((set) => ({
  // --- Initial State ---
  roomId: null,
  phase: SpacePhase.SILENCE,
  density: 0,
  participants: new Map<string, Participant>(),
  localParticipantId: null,
  activeSpeakers: [],
  reactionQueue: [],
  lighting: {
    ambientIntensity: 0.3,
    spotlightIntensity: 0,
    bloomStrength: 0.4,
    colorTemperature: 4500,
  },

  // --- Actions ---
  setRoomId: (id) => set({ roomId: id }),

  setPhase: (phase) => set({ phase }),

  setDensity: (density) => set({ density: Math.max(0, Math.min(1, density)) }),

  addParticipant: (p) =>
    set((state) => {
      const next = new Map(state.participants);
      next.set(p.id, p);
      return { participants: next };
    }),

  removeParticipant: (id) =>
    set((state) => {
      const next = new Map(state.participants);
      next.delete(id);
      return { participants: next };
    }),

  updateParticipant: (id, delta) =>
    set((state) => {
      const next = new Map(state.participants);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, ...delta });
      }
      return { participants: next };
    }),

  setLocalParticipantId: (id) => set({ localParticipantId: id }),

  setActiveSpeakers: (ids) => set({ activeSpeakers: ids }),

  setLighting: (partial: Partial<LightingState>) =>
    set((state) => ({
      lighting: { ...state.lighting, ...partial },
    })),

  addReaction: (event: ReactionEvent) =>
    set((state) => ({
      reactionQueue: [...state.reactionQueue, event],
    })),

  clearReactionQueue: () => set({ reactionQueue: [] }),
}));
