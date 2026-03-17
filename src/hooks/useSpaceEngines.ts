'use client';
/**
 * cocoro — useSpaceEngines (スリム版)
 * 小学生向けアプリに必要なエンジンのみ
 *
 * 残すもの:
 * - PhaseStateMachine: 会話フェーズ管理
 * - GravityFormation: アバター配置
 * - DynamicBGM: BGM自動切替
 * - SoundDesign: UI効果音
 * - ConversationGameEngine: ミニゲーム
 * - SafetyBoundarySystem: 安全管理
 * - EngineScheduler: スケジューリング
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useCocoroStore } from '@/store/useCocoroStore';

// 必要なエンジンのみ
import { PhaseStateMachine } from '@/engine/choreography/PhaseStateMachine';
import { GravityFormation } from '@/engine/choreography/GravityFormation';
import { DynamicBGM } from '@/engine/audio/DynamicBGM';
import { SoundDesign } from '@/engine/audio/SoundDesign';
import { ConversationGameEngine } from '@/engine/game/ConversationGameEngine';
import { SafetyBoundarySystem } from '@/engine/safety/SafetyBoundarySystem';
import { EngineScheduler } from '@/engine/performance/EngineScheduler';

export interface SpaceEngines {
  phaseState: PhaseStateMachine;
  gravity: GravityFormation;
  dynamicBGM: DynamicBGM;
  soundDesign: SoundDesign;
  gameEngine: ConversationGameEngine;
  safetyBoundary: SafetyBoundarySystem;
  scheduler: EngineScheduler;
}

export function useSpaceEngines(): SpaceEngines {
  const store = useCocoroStore;

  const phaseState = useMemo(() => new PhaseStateMachine(), []);
  const gravity = useMemo(() => new GravityFormation(), []);
  const dynamicBGM = useMemo(() => new DynamicBGM(), []);
  const soundDesign = useMemo(() => new SoundDesign(), []);
  const gameEngine = useMemo(() => new ConversationGameEngine(), []);
  const safetyBoundary = useMemo(() => new SafetyBoundarySystem(), []);
  const scheduler = useMemo(() => new EngineScheduler(), []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = useCallback((engine: any, method: string, ...args: any[]) => {
    if (engine && typeof engine[method] === 'function') {
      try { return engine[method](...args); } catch { /* no-op */ }
    }
    return undefined;
  }, []);

  // Session start
  useEffect(() => {
    soundDesign.play('join');
    return () => {
      soundDesign.play('leave');
    };
  }, [soundDesign]);

  // 3秒ループ: フェーズ管理 + 安全チェック
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      let speakerCount = 0;
      let totalVolume = 0;

      participants.forEach((p) => {
        if (p.speakingState.isSpeaking) {
          speakerCount++;
          totalVolume += p.speakingState.volume;
        }
        call(safetyBoundary, 'evaluateVolume', p.id, p.speakingState.volume);
      });

      const energyLevel = participants.size > 0 ? totalVolume / participants.size : 0;
      call(phaseState, 'transition', speakerCount, participants.size, energyLevel);
    }, 3000);

    return () => clearInterval(interval);
  }, [store, phaseState, safetyBoundary, call]);

  // 5秒ループ: BGM + アバター配置
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      const speakerCount = Array.from(participants.values()).filter(p => p.speakingState.isSpeaking).length;
      const energyLevel = speakerCount / Math.max(1, participants.size);

      call(gravity, 'calculateFormation', Array.from(participants.keys()));
      call(dynamicBGM, 'updateMood', energyLevel > 0.5 ? 'excited' : 'calm', energyLevel);
    }, 5000);

    return () => clearInterval(interval);
  }, [store, gravity, dynamicBGM, call]);

  return {
    phaseState,
    gravity,
    dynamicBGM,
    soundDesign,
    gameEngine,
    safetyBoundary,
    scheduler,
  };
}
