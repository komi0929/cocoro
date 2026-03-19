/**
 * cocoro - User Store
 * Browser-locked authentication with name + 4-digit PIN
 * Uses localStorage for persistence, crypto.randomUUID for browser token
 */

import { create } from 'zustand';
import type { UserAccount, AvatarConfig } from '@/types/cocoro';

const STORAGE_KEY = 'cocoro-user';
const TOKEN_KEY = 'cocoro-browser-token';

function hashPin(pin: string): string {
  // Simple hash for demo (production would use bcrypt/argon2)
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  }
  return 'ph_' + Math.abs(h).toString(36);
}

function getBrowserToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function loadUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserAccount;
    // Verify browser token matches
    if (user.browserToken !== getBrowserToken()) return null;
    return user;
  } catch {
    return null;
  }
}

interface UserState {
  user: UserAccount | null;
  isLoggedIn: boolean;

  register: (name: string, pin: string) => UserAccount;
  login: (name: string, pin: string) => boolean;
  logout: () => void;
  updateAvatar: (config: AvatarConfig) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: loadUser(),
  isLoggedIn: loadUser() !== null,

  register: (name, pin) => {
    const user: UserAccount = {
      id: crypto.randomUUID(),
      name,
      pinHash: hashPin(pin),
      browserToken: getBrowserToken(),
      avatarConfig: {
        species: 'cat',
        color: '#A0D8F0',
        item: 'none',
      },
      createdAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isLoggedIn: true });
    return user;
  },

  login: (name, pin) => {
    const saved = loadUser();
    if (!saved) return false;
    if (saved.name !== name) return false;
    if (saved.pinHash !== hashPin(pin)) return false;
    if (saved.browserToken !== getBrowserToken()) return false;
    set({ user: saved, isLoggedIn: true });
    return true;
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },

  updateAvatar: (config) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, avatarConfig: config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ user: updated });
  },
}));
