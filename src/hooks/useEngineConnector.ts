'use client';
/**
 * cocoro — useEngineConnector (スリム版)
 * 小学生向けアプリで必要なエンジン状態のみ
 */

import { useEffect, useRef, useState } from 'react';
import type { SpaceEngines } from './useSpaceEngines';

export interface EngineStatus {
  fps: number;
  phase: string;
}

const DEFAULT_STATUS: EngineStatus = {
  fps: 60,
  phase: 'SILENCE',
};

export function useEngineConnector(_engines: SpaceEngines): EngineStatus {
  const statusRef = useRef<EngineStatus>({ ...DEFAULT_STATUS });
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return statusRef.current;
}
