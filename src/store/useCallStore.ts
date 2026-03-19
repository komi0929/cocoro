/**
 * cocoro - Call Store (Enhanced)
 * Voice call state management + VoiceService integration
 * Includes: push-to-talk, per-peer volume, connection quality, SFX
 */

import { create } from 'zustand';
import { voiceService } from '@/engine/voice/VoiceService';
import { playJoinSound, playLeaveSound } from '@/engine/voice/CallSFX';

export type TalkMode = 'open' | 'ptt';

export interface CallParticipant {
  id: string;
  displayName: string;
  isSpeaking: boolean;
  volume: number;
  userVolume: number; // 0-1 user-set volume
}

export interface CallState {
  isInCall: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  talkMode: TalkMode;
  isPTTActive: boolean;
  participants: CallParticipant[];
  localVolume: number;
  localIsSpeaking: boolean;
  roomId: string | null;
  error: string | null;
  showParticipantPanel: boolean;
  callDuration: number;

  // Actions
  joinCall: (roomId: string, displayName: string) => Promise<void>;
  leaveCall: () => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setTalkMode: (mode: TalkMode) => void;
  setPTTActive: (active: boolean) => void;
  setPeerVolume: (peerId: string, volume: number) => void;
  setShowParticipantPanel: (show: boolean) => void;
  setCallDuration: (d: number) => void;
}

export const useCallStore = create<CallState>((set, get) => {
  // Wire up VoiceService callbacks
  voiceService.onPeerJoined = (peer) => {
    playJoinSound();
    set(s => ({
      participants: [
        ...s.participants.filter(p => p.id !== peer.peerId),
        {
          id: peer.peerId,
          displayName: peer.displayName,
          isSpeaking: false,
          volume: 0,
          userVolume: 1,
        },
      ],
    }));
  };

  voiceService.onPeerLeft = (peerId) => {
    playLeaveSound();
    set(s => ({
      participants: s.participants.filter(p => p.id !== peerId),
    }));
  };

  voiceService.onVolumeUpdate = (peerId, volume, isSpeaking) => {
    set(s => ({
      participants: s.participants.map(p =>
        p.id === peerId ? { ...p, volume, isSpeaking } : p
      ),
    }));
  };

  voiceService.onLocalVolumeUpdate = (volume, isSpeaking) => {
    set({ localVolume: volume, localIsSpeaking: isSpeaking });
  };

  voiceService.onConnectionStateChange = (state) => {
    if (state === 'connecting') set({ isConnecting: true });
    if (state === 'connected') set({ isConnecting: false, isInCall: true });
    if (state === 'disconnected') set({ isConnecting: false, isInCall: false });
  };

  return {
    isInCall: false,
    isMuted: false,
    isConnecting: false,
    talkMode: 'open' as TalkMode,
    isPTTActive: false,
    participants: [],
    localVolume: 0,
    localIsSpeaking: false,
    roomId: null,
    error: null,
    showParticipantPanel: false,
    callDuration: 0,

    joinCall: async (roomId, displayName) => {
      try {
        set({ isConnecting: true, error: null, roomId });
        await voiceService.joinRoom(roomId, displayName);
        await voiceService.discoverPeers();
        playJoinSound();
        set({ isInCall: true, isConnecting: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ isConnecting: false, error: msg });
      }
    },

    leaveCall: () => {
      playLeaveSound();
      voiceService.leaveRoom();
      set({
        isInCall: false,
        isMuted: false,
        isConnecting: false,
        isPTTActive: false,
        participants: [],
        localVolume: 0,
        localIsSpeaking: false,
        roomId: null,
        error: null,
        callDuration: 0,
      });
    },

    toggleMute: () => {
      const next = !get().isMuted;
      voiceService.setMuted(next);
      set({ isMuted: next });
    },

    setMuted: (muted) => {
      voiceService.setMuted(muted);
      set({ isMuted: muted });
    },

    setTalkMode: (mode) => {
      set({ talkMode: mode });
      if (mode === 'ptt') {
        // Start muted in PTT mode
        voiceService.setMuted(true);
        set({ isMuted: true, isPTTActive: false });
      } else {
        voiceService.setMuted(false);
        set({ isMuted: false });
      }
    },

    setPTTActive: (active) => {
      if (get().talkMode !== 'ptt') return;
      set({ isPTTActive: active });
      voiceService.setMuted(!active);
      set({ isMuted: !active });
    },

    setPeerVolume: (peerId, volume) => {
      // Update peer's audio element volume
      const peer = voiceService.connectedPeers.find(p => p.peerId === peerId);
      if (peer?.audioElement) {
        peer.audioElement.volume = Math.max(0, Math.min(1, volume));
      }
      set(s => ({
        participants: s.participants.map(p =>
          p.id === peerId ? { ...p, userVolume: volume } : p
        ),
      }));
    },

    setShowParticipantPanel: (show) => set({ showParticipantPanel: show }),
    setCallDuration: (d) => set({ callDuration: d }),
  };
});
