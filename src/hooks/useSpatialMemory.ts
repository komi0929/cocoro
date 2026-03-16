/**
 * cocoro — useSpatialMemory Hook
 * SpatialMemory (IndexedDB) からアバター進化データとheatmapを読み込む
 * 
 * 接続先:
 *   - AvatarEntity → speechSeconds (AuraSystem進化レベル)
 *   - VoiceReactiveFloor → heatmap overlay (未来)
 *   - VoiceSignature → 保存された声紋色
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { spatialMemory, type AvatarEvolution, type HeatmapCell } from '@/engine/memory/SpatialMemory';

interface SpatialMemoryState {
  avatarEvolution: AvatarEvolution | null;
  heatmap: HeatmapCell[];
  isLoaded: boolean;
}

/**
 * IndexedDBからアバター進化データを読み込むhook
 */
export function useSpatialMemoryAvatar(avatarId: string) {
  const [data, setData] = useState<SpatialMemoryState>({
    avatarEvolution: null,
    heatmap: [],
    isLoaded: false,
  });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        await spatialMemory.open();
        const [evolution, heatmap] = await Promise.all([
          spatialMemory.loadAvatarEvolution(avatarId),
          spatialMemory.getHeatmap(),
        ]);
        setData({
          avatarEvolution: evolution,
          heatmap,
          isLoaded: true,
        });
      } catch {
        setData(prev => ({ ...prev, isLoaded: true }));
      }
    })();
  }, [avatarId]);

  const updateSpeechSeconds = useCallback((seconds: number) => {
    setData(prev => {
      if (!prev.avatarEvolution) return prev;
      return {
        ...prev,
        avatarEvolution: {
          ...prev.avatarEvolution,
          totalSpeechSeconds: seconds,
        },
      };
    });
  }, []);

  return { ...data, updateSpeechSeconds };
}
