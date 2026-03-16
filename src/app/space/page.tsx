/**
 * kokoro — Space Page
 * メインの空間ページ（3D描画 + 音声 + UI）
 * シネマティックローディング + アンビエントプレゼンス
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpaceHUD } from '@/components/ui/SpaceHUD';
import { ReactionPanel } from '@/components/ui/ReactionPanel';
import { TextChatOverlay } from '@/components/ui/TextChatOverlay';
import { DemoOrchestrator } from '@/engine/demo/DemoOrchestrator';
import { VoiceAnalyzer } from '@/engine/audio/VoiceAnalyzer';
import { useAmbientPresence } from '@/engine/audio/AmbientPresence';
import { v4 as uuidv4 } from 'uuid';

// Dynamic import for KokoroCanvas (SSR disabled for Three.js)
const KokoroCanvas = dynamic(
  () =>
    import('@/components/three/KokoroCanvas').then((m) => ({
      default: m.KokoroCanvas,
    })),
  { ssr: false }
);

export default function SpacePage() {
  const [isMicActive, setIsMicActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0); // 0-3 visual phases
  const demoRef = useRef<DemoOrchestrator | null>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const store = useKokoroStore;

  // Ambient presence (audio)
  useAmbientPresence();

  // Cinematic loading sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setLoadingPhase(1), 800),
      setTimeout(() => setLoadingPhase(2), 1600),
      setTimeout(() => setLoadingPhase(3), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Initialize demo on mount
  useEffect(() => {
    const localId = uuidv4();
    store.getState().setLocalParticipantId(localId);
    store.getState().setRoomId('demo-room');

    store.getState().addParticipant({
      id: localId,
      displayName: 'あなた',
      vrmUrl: null,
      avatarId: typeof window !== 'undefined'
        ? localStorage.getItem('kokoro_avatar_id') ?? 'seed-san'
        : 'seed-san',
      isGuest: false,
      transform: {
        position: { x: 0, y: 0, z: 5 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        lookAtTarget: null,
      },
      speakingState: {
        isSpeaking: false,
        volume: 0,
        pitch: 0,
        currentViseme: 'sil',
        visemeWeight: 0,
      },
      emotion: {
        joy: 0,
        anger: 0,
        sorrow: 0,
        surprise: 0,
        neutral: 1,
      },
    });

    const demo = new DemoOrchestrator(store);
    demo.start(5);
    demoRef.current = demo;

    setIsLoaded(true);

    return () => {
      demo.stop();
      voiceAnalyzerRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle microphone
  const handleToggleMic = useCallback(async () => {
    const localId = store.getState().localParticipantId;
    if (!localId) return;

    if (isMicActive) {
      voiceAnalyzerRef.current?.stop();
      voiceAnalyzerRef.current = null;
      setIsMicActive(false);

      store.getState().updateParticipant(localId, {
        speakingState: {
          isSpeaking: false,
          volume: 0,
          pitch: 0,
          currentViseme: 'sil',
          visemeWeight: 0,
        },
      });
    } else {
      try {
        const analyzer = new VoiceAnalyzer();
        await analyzer.start((result) => {
          store.getState().updateParticipant(localId, {
            speakingState: {
              isSpeaking: result.isSpeaking,
              volume: result.volume,
              pitch: result.pitch,
              currentViseme: result.viseme.viseme,
              visemeWeight: result.viseme.weight,
            },
          });
        });
        voiceAnalyzerRef.current = analyzer;
        setIsMicActive(true);
      } catch (err) {
        console.error('Failed to start microphone:', err);
      }
    }
  }, [isMicActive, store]);

  // Leave space
  const handleLeave = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f0a1a]">
      {/* 3D Canvas */}
      {isLoaded && <KokoroCanvas className="absolute inset-0" />}

      {/* HUD Overlay */}
      <SpaceHUD
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        onLeave={handleLeave}
      />

      {/* Reaction Panel (ROM専向け) */}
      <ReactionPanel />

      {/* Text Chat (ROM専 — 声なしでも参加) */}
      <TextChatOverlay />

      {/* Cinematic Loading Overlay (NOT a "Loading..." text) */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0a1a] z-50">
          {/* Expanding rings animation */}
          <div className="relative w-32 h-32 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-violet-500/20"
                style={{
                  animation: `cinematic-ring 2.5s ease-out ${i * 0.3}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Central glow */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-md animate-pulse" />
          </div>

          {/* Staggered text reveal */}
          <div className="text-center space-y-2">
            <p
              className="text-white/50 text-xs tracking-[0.3em] uppercase transition-all duration-1000"
              style={{
                opacity: loadingPhase >= 1 ? 1 : 0,
                transform: loadingPhase >= 1 ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              空間を構築中
            </p>
            <p
              className="text-white/30 text-[10px] tracking-widest transition-all duration-1000"
              style={{
                opacity: loadingPhase >= 2 ? 1 : 0,
                transform: loadingPhase >= 2 ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              kokoro
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
