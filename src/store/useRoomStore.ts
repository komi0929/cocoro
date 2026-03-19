/**
 * cocoro - Room Store
 * Room creation, management, invitation, access control
 * Stores rooms in localStorage for demo purposes
 */

import { create } from 'zustand';
import type { RoomDef, RoomTheme, AccessMode, FurnitureItem } from '@/types/cocoro';

const ROOMS_KEY = 'cocoro-rooms';
const CURRENT_ROOM_KEY = 'cocoro-current-room';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadRooms(): RoomDef[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms: RoomDef[]) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

interface RoomState {
  rooms: RoomDef[];
  currentRoom: RoomDef | null;

  createRoom: (ownerId: string, ownerName: string, theme: RoomTheme) => RoomDef;
  joinRoom: (roomId: string) => RoomDef | null;
  joinByInviteCode: (code: string) => RoomDef | null;
  leaveRoom: () => void;

  setTheme: (roomId: string, theme: RoomTheme) => void;
  setAccessMode: (roomId: string, mode: AccessMode) => void;
  addAllowedUser: (roomId: string, userId: string) => void;
  removeAllowedUser: (roomId: string, userId: string) => void;

  addFurnitureToRoom: (roomId: string, item: FurnitureItem) => void;
  removeFurnitureFromRoom: (roomId: string, furnitureId: string) => void;
  updateFurnitureInRoom: (roomId: string, furnitureId: string, updates: Partial<FurnitureItem>) => void;

  canAccess: (roomId: string, userId: string) => boolean;
  getRoomsByOwner: (ownerId: string) => RoomDef[];
  getInviteUrl: (roomId: string) => string;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: loadRooms(),
  currentRoom: null,

  createRoom: (ownerId, ownerName, theme) => {
    const room: RoomDef = {
      id: crypto.randomUUID(),
      ownerId,
      ownerName,
      theme,
      accessMode: 'open',
      allowedUsers: [],
      inviteCode: generateInviteCode(),
      furniture: [],
      createdAt: Date.now(),
    };
    const rooms = [...get().rooms, room];
    saveRooms(rooms);
    set({ rooms, currentRoom: room });
    return room;
  },

  joinRoom: (roomId) => {
    const room = get().rooms.find(r => r.id === roomId) ?? null;
    if (room) {
      set({ currentRoom: room });
      localStorage.setItem(CURRENT_ROOM_KEY, roomId);
    }
    return room;
  },

  joinByInviteCode: (code) => {
    const room = get().rooms.find(r => r.inviteCode === code.toUpperCase()) ?? null;
    if (room) {
      set({ currentRoom: room });
      localStorage.setItem(CURRENT_ROOM_KEY, room.id);
    }
    return room;
  },

  leaveRoom: () => {
    set({ currentRoom: null });
    localStorage.removeItem(CURRENT_ROOM_KEY);
  },

  setTheme: (roomId, theme) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId ? { ...r, theme } : r
    );
    saveRooms(rooms);
    const current = get().currentRoom;
    set({
      rooms,
      currentRoom: current?.id === roomId ? { ...current, theme } : current,
    });
  },

  setAccessMode: (roomId, mode) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId ? { ...r, accessMode: mode } : r
    );
    saveRooms(rooms);
    const current = get().currentRoom;
    set({
      rooms,
      currentRoom: current?.id === roomId ? { ...current, accessMode: mode } : current,
    });
  },

  addAllowedUser: (roomId, userId) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId
        ? { ...r, allowedUsers: [...new Set([...r.allowedUsers, userId])] }
        : r
    );
    saveRooms(rooms);
    set({ rooms });
  },

  removeAllowedUser: (roomId, userId) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId
        ? { ...r, allowedUsers: r.allowedUsers.filter(u => u !== userId) }
        : r
    );
    saveRooms(rooms);
    set({ rooms });
  },

  addFurnitureToRoom: (roomId, item) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId ? { ...r, furniture: [...r.furniture, item] } : r
    );
    saveRooms(rooms);
    const current = get().currentRoom;
    if (current?.id === roomId) {
      set({ rooms, currentRoom: { ...current, furniture: [...current.furniture, item] } });
    } else {
      set({ rooms });
    }
  },

  removeFurnitureFromRoom: (roomId, furnitureId) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId
        ? { ...r, furniture: r.furniture.filter(f => f.id !== furnitureId) }
        : r
    );
    saveRooms(rooms);
    set({ rooms });
  },

  updateFurnitureInRoom: (roomId, furnitureId, updates) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId
        ? { ...r, furniture: r.furniture.map(f => f.id === furnitureId ? { ...f, ...updates } : f) }
        : r
    );
    saveRooms(rooms);
    set({ rooms });
  },

  canAccess: (roomId, userId) => {
    const room = get().rooms.find(r => r.id === roomId);
    if (!room) return false;
    if (room.ownerId === userId) return true;
    if (room.accessMode === 'open') return true;
    if (room.accessMode === 'key') return room.allowedUsers.includes(userId);
    // 'permission' mode — for now, treated as needing explicit allowance
    return room.allowedUsers.includes(userId);
  },

  getRoomsByOwner: (ownerId) => {
    return get().rooms.filter(r => r.ownerId === ownerId);
  },

  getInviteUrl: (roomId) => {
    const room = get().rooms.find(r => r.id === roomId);
    if (!room) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?invite=${room.inviteCode}`;
  },
}));
