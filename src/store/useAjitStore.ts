/**
 * cocoro - Ajit Store
 * Room furniture + passphrase management
 */

import { create } from 'zustand';
import type { FurnitureItem } from '@/types/cocoro';

const PASSPHRASE_WORDS = [
  '\u30B3\u30E1\u30C3\u30C8', '\u30B7\u30E3\u30C9\u30A6', '\u30BF\u30A4\u30D5\u30FC\u30F3',
  '\u30A2\u30A4\u30B9', '\u30AD\u30E3\u30E9\u30E1\u30EB', '\u30B9\u30BF\u30FC\u30E9\u30A4\u30C8',
  '\u30B9\u30AB\u30A4', '\u30AF\u30EA\u30B9\u30BF\u30EB', '\u30EC\u30A4\u30F3\u30DC\u30FC',
  '\u30E0\u30FC\u30F3', '\u30B5\u30F3\u30C0\u30FC', '\u30D5\u30E9\u30EF\u30FC',
  '\u30AA\u30FC\u30ED\u30E9', '\u30B5\u30F3\u30B4', '\u30DF\u30E9\u30FC\u30B8\u30E5',
  '\u30D5\u30A9\u30EC\u30B9\u30C8', '\u30A4\u30F3\u30C7\u30A3\u30B4', '\u30E9\u30D9\u30F3\u30C0\u30FC',
];

interface AjitState {
  // Room
  passphrase: string[] | null;
  isHost: boolean;

  // Furniture
  placedFurniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  placingType: string | null;
  placingColorVariant: string | undefined;
  isDragging: boolean;
  roomCapacity: number;
  isDrawerOpen: boolean;

  // Actions - Room
  setPassphrase: (pw: string[]) => void;
  setIsHost: (h: boolean) => void;
  generatePassphrase: () => string[];

  // Actions - Furniture
  addFurniture: (item: FurnitureItem) => void;
  removeFurniture: (id: string) => void;
  updateFurniturePosition: (id: string, position: [number, number, number]) => void;
  updateFurnitureRotation: (id: string, rotationY: number) => void;
  selectFurniture: (id: string) => void;
  deselectFurniture: () => void;
  setPlacingType: (type: string | null) => void;
  setPlacingColorVariant: (color: string | undefined) => void;
  setIsDragging: (d: boolean) => void;
  setDragging: (d: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  moveFurniture: (id: string, position: [number, number, number]) => void;
  rotateFurniture: (id: string, rotationY: number) => void;
  rotateSelected90: () => void;
  removeSelected: () => void;
}

export const useAjitStore = create<AjitState>((set, get) => ({
  passphrase: null,
  isHost: false,
  placedFurniture: [],
  selectedFurnitureId: null,
  placingType: null,
  placingColorVariant: undefined,
  isDragging: false,
  roomCapacity: 200,
  isDrawerOpen: false,

  setPassphrase: (pw) => set({ passphrase: pw }),
  setIsHost: (h) => set({ isHost: h }),

  generatePassphrase: () => {
    const words: string[] = [];
    const pool = [...PASSPHRASE_WORDS];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      words.push(pool.splice(idx, 1)[0]);
    }
    return words;
  },

  addFurniture: (item) => set(s => ({
    placedFurniture: [...s.placedFurniture, item],
  })),

  removeFurniture: (id) => set(s => ({
    placedFurniture: s.placedFurniture.filter(f => f.id !== id),
    selectedFurnitureId: s.selectedFurnitureId === id ? null : s.selectedFurnitureId,
  })),

  updateFurniturePosition: (id, position) => set(s => ({
    placedFurniture: s.placedFurniture.map(f =>
      f.id === id ? { ...f, position } : f
    ),
  })),

  updateFurnitureRotation: (id, rotationY) => set(s => ({
    placedFurniture: s.placedFurniture.map(f =>
      f.id === id ? { ...f, rotationY } : f
    ),
  })),

  selectFurniture: (id) => set({ selectedFurnitureId: id }),
  deselectFurniture: () => set({ selectedFurnitureId: null }),
  setPlacingType: (type) => set({ placingType: type }),
  setPlacingColorVariant: (color) => set({ placingColorVariant: color }),
  setIsDragging: (d) => set({ isDragging: d }),
  setDragging: (d) => set({ isDragging: d }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  moveFurniture: (id, position) => set(s => ({
    placedFurniture: s.placedFurniture.map(f =>
      f.id === id ? { ...f, position } : f
    ),
  })),
  rotateFurniture: (id, rotationY) => set(s => ({
    placedFurniture: s.placedFurniture.map(f =>
      f.id === id ? { ...f, rotationY } : f
    ),
  })),

  rotateSelected90: () => {
    const id = get().selectedFurnitureId;
    if (!id) return;
    set(s => ({
      placedFurniture: s.placedFurniture.map(f =>
        f.id === id ? { ...f, rotationY: (f.rotationY ?? 0) + Math.PI / 2 } : f
      ),
    }));
  },

  removeSelected: () => {
    const id = get().selectedFurnitureId;
    if (!id) return;
    set(s => ({
      placedFurniture: s.placedFurniture.filter(f => f.id !== id),
      selectedFurnitureId: null,
    }));
  },
}));
