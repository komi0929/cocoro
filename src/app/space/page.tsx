/**
 * cocoro — Space Page
 * メインの空間ページ（3D描画 + 音声 + UI）
 * シネマティックローディング + アンビエントプレゼンス + CliMax演出
 */
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpaceHUD } from '@/components/ui/SpaceHUD';
import { ReactionPanel } from '@/components/ui/ReactionPanel';
import { TextChatOverlay } from '@/components/ui/TextChatOverlay';
import { DemoOrchestrator } from '@/engine/demo/DemoOrchestrator';
import { VoiceAnalyzer } from '@/engine/audio/VoiceAnalyzer';
import { VoiceEmotionClassifier } from '@/engine/audio/VoiceEmotionClassifier';
import { VoiceSignature } from '@/engine/audio/VoiceSignature';
import { spatialMemory } from '@/engine/memory/SpatialMemory';
import { useAmbientPresence } from '@/engine/audio/AmbientPresence';
import { useCliMaxDirector, CliMaxOverlay } from '@/engine/choreography/CliMaxDirector';
import { usePrivateBubble, PrivateBubbleOverlay, BubbleButton } from '@/components/ui/PrivateBubble';
import { PerformanceOverlay } from '@/components/ui/PerformanceMonitor';
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
  const climaxState = useCliMaxDirector();
  const { state: bubbleState, activate: activateBubble } = usePrivateBubble();

  // Persistent instances for emotion + signature (no AI runtime)
  const emotionClassifier = useMemo(() => new VoiceEmotionClassifier(), []);
  const voiceSignature = useMemo(() => new VoiceSignature(), []);
  const angerFramesRef = useRef(0);  // Consecutive anger frames for auto-bubble
  const speechSecondsRef = useRef(0); // Accumulated speech time
  const heatmapTimerRef = useRef(0);  // Throttle heatmap writes

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
        ? localStorage.getItem('cocoro_avatar_id') ?? 'seed-san'
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
          // === 1. Update speaking state in store ===
          store.getState().updateParticipant(localId, {
            speakingState: {
              isSpeaking: result.isSpeaking,
              volume: result.volume,
              pitch: result.pitch,
              currentViseme: result.viseme.viseme,
              visemeWeight: result.viseme.weight,
            },
          });

          // === 2. Emotion classification (REAL FFT data) ===
          const freqData = analyzer.getFrequencyDataNormalized();
          if (freqData.length > 0) {
            const emotion = emotionClassifier.classify(
              freqData,
              result.volume,
              result.pitchNormalized,
              result.isSpeaking,
            );

            // Write emotion to store
            store.getState().updateParticipant(localId, {
              emotion: {
                joy: emotion.joy,
                anger: emotion.anger,
                sorrow: emotion.sorrow,
                surprise: emotion.surprise,
                neutral: emotion.neutral,
              },
            });

            // === 3. Anger auto-bubble (safety mechanism) ===
            if (emotion.anger > 0.6) {
              angerFramesRef.current++;
              if (angerFramesRef.current > 90) { // ~1.5 sec sustained anger
                activateBubble();
                angerFramesRef.current = 0;
              }
            } else {
              angerFramesRef.current = Math.max(0, angerFramesRef.current - 2);
            }

            // === 4. Voice Signature calibration (REAL FFT) ===
            if (!voiceSignature.isCalibrated) {
              voiceSignature.feed(freqData, result.volume);
            }

            // === 5. Spatial Memory heatmap (throttled to 1/sec) ===
            if (result.isSpeaking) {
              speechSecondsRef.current += 1 / 60;
              heatmapTimerRef.current++;
              if (heatmapTimerRef.current >= 60) { // once per second
                heatmapTimerRef.current = 0;
                const pos = store.getState().participants.get(localId)?.transform.position;
                if (pos) {
                  spatialMemory.updateHeatmap(
                    pos.x, pos.z,
                    result.volume,
                    emotion.dominant,
                  ).catch(() => {}); // fire-and-forget IndexedDB write
                }
              }
            }
          }
        });
        voiceAnalyzerRef.current = analyzer;
        setIsMicActive(true);
      } catch (err) {
        console.error('Failed to start microphone:', err);
      }
    }
  }, [isMicActive, store, emotionClassifier, voiceSignature, activateBubble]);

  // Leave space
  const handleLeave = useCallback(() => {
    // Save avatar evolution to IndexedDB on leave
    const localId = store.getState().localParticipantId;
    const avatarId = localId
      ? store.getState().participants.get(localId)?.avatarId ?? 'seed-san'
      : 'seed-san';
    spatialMemory.saveAvatarEvolution({
      avatarId,
      totalSpeechSeconds: speechSecondsRef.current,
      emotionCounts: {},
      voiceSignatureHex: voiceSignature.signature?.hexColor ?? null,
      lastSeen: Date.now(),
    }).catch(() => {});

    // Record visit
    spatialMemory.recordVisit({
      roomId: store.getState().roomId ?? 'demo-room',
      timestamp: Date.now(),
      durationSeconds: Math.round(performance.now() / 1000),
      dominantEmotion: 'neutral',
      participantCount: store.getState().participants.size,
    }).catch(() => {});

    window.location.href = '/';
  }, [store, voiceSignature]);

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

      {/* Text Chat */}
      <TextChatOverlay />

      {/* CliMax Overlay */}
      <CliMaxOverlay state={climaxState} />

      {/* Private Bubble */}
      <PrivateBubbleOverlay state={bubbleState} />

      {/* Bubble Button (bottom-left) */}
      <div className="fixed bottom-6 left-4 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <BubbleButton onActivate={() => activateBubble()} />
      </div>

      {/* Performance Monitor (debug) */}
      <PerformanceOverlay visible={process.env.NODE_ENV === 'development'} />

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
              cocoro
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
