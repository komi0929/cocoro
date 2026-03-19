/**
 * cocoro  EAvatar Store (Phase 5)
 * ボクセル動物アバターのカスタマイズ状態管琁E * LocalStorage永続化付き
 */

import { create } from 'zustand';
import type { AvatarSpecies, AvatarItemType, AvatarConfig } from '@/types/cocoro';

const STORAGE_KEY = 'cocoro-avatar-config';

function loadFromStorage(): AvatarConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return null;
  }
}

function saveToStorage(config: AvatarConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* quota exceeded  Eignore */ }
}

const DEFAULT_CONFIG: AvatarConfig = {
  species: 'bear',
  color: '#8B6914',
  item: 'none',
};

export interface AvatarStoreState {
  config: AvatarConfig;
  setSpecies: (species: AvatarSpecies) => void;
  setColor: (color: string) => void;
  setItem: (item: AvatarItemType) => void;
  setConfig: (config: AvatarConfig) => void;
  save: () => void;
}

const stored = loadFromStorage();

export const useAvatarStore = create<AvatarStoreState>((set, get) => ({
  config: stored ?? DEFAULT_CONFIG,

  setSpecies: (species) => set(s => ({
    config: { ...s.config, species },
  })),

  setColor: (color) => set(s => ({
    config: { ...s.config, color },
  })),

  setItem: (item) => set(s => ({
    config: { ...s.config, item },
  })),

  setConfig: (config) => set({ config }),

  save: () => {
    saveToStorage(get().config);
  },
}));
