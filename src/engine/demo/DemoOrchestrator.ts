/**
 * cocoro — Demo Orchestrator  
 * ローカルデモ用のシミュレーション  
 * NPCアバターが自動で会話をシミュレートし、3フェーズの遷移をデモする
 */

import { v4 as uuidv4 } from 'uuid';
import { type Participant, type SpeakingState, type EmotionState } from '@/types/cocoro';
import { PhaseStateMachine } from '@/engine/choreography/PhaseStateMachine';
import { GravityFormation } from '@/engine/choreography/GravityFormation';
import { getRandomAvatarId, getAvatarById } from '@/data/avatarCatalog';
import type { useCocoroStore } from '@/store/useCocoroStore';



const NPC_NAMES = ['あかり', 'ゆうき', 'はるか', 'そうた', 'みく', 'りん'];

const DEFAULT_SPEAKING: SpeakingState = {
  isSpeaking: false,
  volume: 0,
  pitch: 0,
  currentViseme: 'sil',
  visemeWeight: 0,
};

const DEFAULT_EMOTION: EmotionState = {
  joy: 0,
  anger: 0,
  sorrow: 0,
  surprise: 0,
  neutral: 1,
};

/**
 * デモオーケストレーター
 * NPCアバターを生成し、自動で発話・感情変化をシミュレート
 */
export class DemoOrchestrator {
  private store: typeof useCocoroStore;
  private phaseStateMachine: PhaseStateMachine;
  private gravityFormation: GravityFormation;
  private npcIds: string[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private animFrameId: number = 0;
  private isRunning = false;
  private time = 0;

  // Conversation simulation state
  private conversationPhase = 0; // cycles through: silence -> one talks -> conversation -> heated

  constructor(store: typeof useCocoroStore) {
    this.store = store;
    this.phaseStateMachine = new PhaseStateMachine();
    this.gravityFormation = new GravityFormation();
  }

  /**
   * デモを開始
   */
  start(npcCount: number = 5): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Create NPCs with diverse avatars
    const assignedAvatarIds: string[] = [];
    for (let i = 0; i < npcCount; i++) {
      const id = uuidv4();
      this.npcIds.push(id);

      const angle = (i / npcCount) * Math.PI * 2;
      const radius = 4 + Math.random() * 2;

      // Assign a unique avatar from catalog
      const avatarId = getRandomAvatarId(assignedAvatarIds);
      assignedAvatarIds.push(avatarId);
      const avatarDef = getAvatarById(avatarId);

      const participant: Participant = {
        id,
        displayName: NPC_NAMES[i % NPC_NAMES.length],
        vrmUrl: avatarDef?.vrmUrl ?? null,
        avatarId,
        isGuest: false,
        transform: {
          position: {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius,
          },
          rotation: { x: 0, y: angle + Math.PI, z: 0 },
          lookAtTarget: null,
        },
        speakingState: { ...DEFAULT_SPEAKING },
        emotion: { ...DEFAULT_EMOTION },
      };

      this.store.getState().addParticipant(participant);
    }

    // Phase state machine listener
    this.phaseStateMachine.onTransition((event) => {
      this.store.getState().setPhase(event.to);
      this.store.getState().setDensity(event.density);
    });

    // Start conversation simulation cycle
    this.startConversationCycle();

    // Start choreography update loop
    this.startChoreographyLoop();
  }

  /**
   * 会話シミュレーション（周期的に発話パターンを変更）
   */
  private startConversationCycle(): void {
    const cycle = () => {
      if (!this.isRunning) return;

      this.conversationPhase = (this.conversationPhase + 1) % 4;

      switch (this.conversationPhase) {
        case 0: // 静寂: 全員黙る
          this.setAllSpeaking(false);
          break;

        case 1: // 一人の発話
          this.setAllSpeaking(false);
          if (this.npcIds.length > 0) {
            this.simulateSpeaking(this.npcIds[0], true);
          }
          break;

        case 2: // 会話: 2人が話す
          this.setAllSpeaking(false);
          if (this.npcIds.length >= 2) {
            this.simulateSpeaking(this.npcIds[0], true);
            this.simulateSpeaking(this.npcIds[1], true);
          }
          break;

        case 3: // 熱狂: 3-4人が話す
          this.setAllSpeaking(false);
          const speakerCount = Math.min(this.npcIds.length, 3 + Math.floor(Math.random() * 2));
          for (let i = 0; i < speakerCount; i++) {
            this.simulateSpeaking(this.npcIds[i], true);
          }
          break;
      }

      // Next phase in 4-8 seconds
      const delay = 4000 + Math.random() * 4000;
      this.intervalId = setTimeout(cycle, delay);
    };

    // Start after initial silence
    this.intervalId = setTimeout(cycle, 2000);
  }

  /**
   * 発話シミュレーション（音量・ビゼームをアニメーション）
   */
  private simulateSpeaking(id: string, isSpeaking: boolean): void {
    this.phaseStateMachine.updateSpeaker(id, isSpeaking);
    this.store.getState().setActiveSpeakers(this.phaseStateMachine.getActiveSpeakers());

    const participant = this.store.getState().participants.get(id);
    if (!participant) return;

    this.store.getState().updateParticipant(id, {
      speakingState: {
        ...participant.speakingState,
        isSpeaking,
        volume: isSpeaking ? 0.3 + Math.random() * 0.5 : 0,
        currentViseme: isSpeaking ? ['aa', 'ih', 'ou', 'ee', 'oh'][Math.floor(Math.random() * 5)] : 'sil',
        visemeWeight: isSpeaking ? 0.5 + Math.random() * 0.5 : 0,
      },
      emotion: isSpeaking
        ? {
            joy: Math.random() * 0.6,
            anger: 0,
            sorrow: 0,
            surprise: Math.random() * 0.2,
            neutral: 0.3 + Math.random() * 0.3,
          }
        : DEFAULT_EMOTION,
    });
  }

  private setAllSpeaking(isSpeaking: boolean): void {
    this.npcIds.forEach((id) => {
      this.phaseStateMachine.updateSpeaker(id, isSpeaking);
      const p = this.store.getState().participants.get(id);
      if (p) {
        this.store.getState().updateParticipant(id, {
          speakingState: { ...DEFAULT_SPEAKING },
          emotion: { ...DEFAULT_EMOTION },
        });
      }
    });
    this.store.getState().setActiveSpeakers([]);
  }

  /**
   * 自動演出（座標計算）ループ
   */
  private startChoreographyLoop(): void {
    const update = () => {
      if (!this.isRunning) return;
      this.time += 0.016; // ~60fps

      const state = this.store.getState();
      const participantIds = Array.from(state.participants.keys());
      const currentTransforms = new Map<string, typeof state.participants extends Map<string, infer V> ? V extends { transform: infer T } ? T : never : never>();

      state.participants.forEach((p, id) => {
        currentTransforms.set(id, p.transform);
      });

      // Calculate new formation
      const result = this.gravityFormation.calculate(
        state.phase,
        participantIds,
        state.activeSpeakers,
        currentTransforms,
        state.density
      );

      // Apply new transforms
      result.transforms.forEach((transform, id) => {
        state.updateParticipant(id, { transform });
      });

      // Apply lighting
      state.setLighting(result.lighting);

      // Animate speaking NPCs' visemes
      state.activeSpeakers.forEach((id) => {
        const p = state.participants.get(id);
        if (p && p.speakingState.isSpeaking) {
          state.updateParticipant(id, {
            speakingState: {
              ...p.speakingState,
              volume: 0.2 + Math.sin(this.time * 8 + this.hashId(id)) * 0.3 + Math.random() * 0.2,
              currentViseme: ['aa', 'ih', 'ou', 'ee', 'oh'][Math.floor((this.time * 3 + this.hashId(id)) % 5)],
              visemeWeight: 0.4 + Math.sin(this.time * 6) * 0.3,
            },
          });
        }
      });

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100) / 100;
  }

  /**
   * デモを停止
   */
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    this.phaseStateMachine.dispose();
    this.npcIds.forEach((id) => {
      this.store.getState().removeParticipant(id);
    });
    this.npcIds = [];
  }
}
