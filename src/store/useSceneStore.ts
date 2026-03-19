/**
 * cocoro  EScene Director Store
 * シーン全体�E演�E状態を管琁E
 * - アバターの行動状慁E(idle / wander / playing / conversation)
 * - カメラモーチE(overview / speaker-focus)
 * - 発話老E��ラチE��ング
 */

import { create } from 'zustand';
import type { FurnitureActionType } from '@/types/cocoro';

// ============================================================
// Types
// ============================================================

export type AvatarBehavior = 'idle' | 'wander' | 'playing' | 'conversation';
export type CameraMode = 'overview' | 'speaker-focus';

export interface AvatarRuntimeState {
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  rotationY: number;
  behavior: AvatarBehavior;
  /** 遊び中の家具ID */
  playTargetId: string | null;
  /** 会話相手を見つめるための注視点 */
  lookAtTarget: [number, number, number] | null;
  /** 現在実行中のアクション */
  currentAction: FurnitureActionType | null;
}

export interface SceneState {
  // Avatar
  localAvatar: AvatarRuntimeState;

  // Camera
  cameraMode: CameraMode;
  /** speaker-focus 時�Eフォーカス允E(localAvatarのposition) */
  focusTarget: [number, number, number] | null;

  // Conversation detection
  /** 誰かが喋ってぁE�� (local or remote) */
  anySpeaking: boolean;
  /** 会話が始まってからの秒数 */
  conversationStartTime: number | null;
  /** 無言が続いてぁE��秒数 */
  silenceDuration: number;

  // Actions
  setLocalAvatarPos: (pos: [number, number, number]) => void;
  setLocalAvatarTarget: (target: [number, number, number] | null) => void;
  setLocalAvatarRotation: (ry: number) => void;
  setLocalAvatarBehavior: (behavior: AvatarBehavior) => void;
  setPlayTarget: (id: string | null) => void;
  setCurrentAction: (action: FurnitureActionType | null) => void;
  setLookAtTarget: (target: [number, number, number] | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setFocusTarget: (target: [number, number, number] | null) => void;
  setAnySpeaking: (speaking: boolean) => void;
  setConversationStartTime: (time: number | null) => void;
  setSilenceDuration: (duration: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  localAvatar: {
    position: [1.5, 0, 1.5],
    targetPosition: null,
    rotationY: 0,
    behavior: 'idle',
    playTargetId: null,
    lookAtTarget: null,
    currentAction: null,
  },

  cameraMode: 'overview',
  focusTarget: null,
  anySpeaking: false,
  conversationStartTime: null,
  silenceDuration: 0,

  setLocalAvatarPos: (pos) => set(s => ({
    localAvatar: { ...s.localAvatar, position: pos },
  })),
  setLocalAvatarTarget: (target) => set(s => ({
    localAvatar: { ...s.localAvatar, targetPosition: target },
  })),
  setLocalAvatarRotation: (ry) => set(s => ({
    localAvatar: { ...s.localAvatar, rotationY: ry },
  })),
  setLocalAvatarBehavior: (behavior) => set(s => ({
    localAvatar: { ...s.localAvatar, behavior },
  })),
  setPlayTarget: (id) => set(s => ({
    localAvatar: { ...s.localAvatar, playTargetId: id },
  })),
  setCurrentAction: (action) => set(s => ({
    localAvatar: { ...s.localAvatar, currentAction: action },
  })),
  setLookAtTarget: (target) => set(s => ({
    localAvatar: { ...s.localAvatar, lookAtTarget: target },
  })),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setFocusTarget: (target) => set({ focusTarget: target }),
  setAnySpeaking: (speaking) => set({ anySpeaking: speaking }),
  setConversationStartTime: (time) => set({ conversationStartTime: time }),
  setSilenceDuration: (duration) => set({ silenceDuration: duration }),
}));
