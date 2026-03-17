/**
 * cocoro — Space Page
 * メインの空間ページ（3D描画 + 音声 + UI）
 * シネマティックローディング + アンビエントプレゼンス + CliMax演出
 */
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCocoroStore } from '@/store/useCocoroStore';
import { SpaceHUD } from '@/components/ui/SpaceHUD';
import { ReactionPanel } from '@/components/ui/ReactionPanel';

import { ProfileCard } from '@/components/ui/ProfileCard';
import { ShareRoom } from '@/components/ui/ShareRoom';
import { DemoOrchestrator } from '@/engine/demo/DemoOrchestrator';
import { ReactionType } from '@/types/cocoro';
import { VoiceAnalyzer } from '@/engine/audio/VoiceAnalyzer';
import { VoiceEmotionClassifier } from '@/engine/audio/VoiceEmotionClassifier';
import { VoiceSignature } from '@/engine/audio/VoiceSignature';
import { spatialMemory } from '@/engine/memory/SpatialMemory';
import { cognitiveContext } from '@/engine/memory/CognitiveContext';
import { useAmbientPresence } from '@/engine/audio/AmbientPresence';
import { useCliMaxDirector, CliMaxOverlay } from '@/engine/choreography/CliMaxDirector';
import { usePrivateBubble, PrivateBubbleOverlay, BubbleButton } from '@/components/ui/PrivateBubble';
import { PerformanceOverlay } from '@/components/ui/PerformanceMonitor';
import { WelcomeToast } from '@/components/ui/WelcomeToast';
import { StateSyncEngine, type StateSyncCallbacks } from '@/engine/network/StateSyncEngine';
import { VoiceChannel } from '@/engine/network/VoiceChannel';
import { SupabaseRealtimeAdapter } from '@/engine/network/SupabaseRealtimeAdapter';
import { v4 as uuidv4 } from 'uuid';
import { useSpaceEngines } from '@/hooks/useSpaceEngines';
import { useEngineConnector } from '@/hooks/useEngineConnector';
import { ConversationHUD } from '@/components/ui/ConversationHUD';
import { LiveCaption } from '@/components/ui/LiveCaption';
import { ConnectionQuality } from '@/components/ui/ConnectionQuality';
import { GameOverlay } from '@/components/ui/GameOverlay';
import { FriendPanel } from '@/components/ui/FriendPanel';
import { SafetyPanel } from '@/components/ui/SafetyPanel';
import { SessionEndSummary } from '@/components/ui/SessionEndSummary';
import { TopicCard } from '@/components/ui/TopicCard';
import { SpaceMoodIndicator } from '@/components/ui/SpaceMoodIndicator';
import { ListenerGestureBar } from '@/components/ui/ListenerGestureBar';
import { SessionSummary } from '@/components/ui/SessionSummary';
import { HighlightReel } from '@/components/ui/HighlightReel';
import { AudienceQuestionCardPanel } from '@/components/ui/AudienceQuestionCard';
import { ConnectionGraph } from '@/components/ui/ConnectionGraph';
import { LivePoll } from '@/components/ui/LivePoll';
import { WarpTransition } from '@/components/ui/WarpTransition';
import { FriendRequestButton } from '@/components/ui/FriendRequestButton';

// Dynamic import for CocoroCanvas (SSR disabled for Three.js)
const CocoroCanvas = dynamic(
  () =>
    import('@/components/three/CocoroCanvas').then((m) => ({
      default: m.CocoroCanvas,
    })),
  { ssr: false }
);

export default function SpacePage() {
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0); // 0-3 visual phases
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showShareRoom, setShowShareRoom] = useState(false);
  const [profileTarget, setProfileTarget] = useState<string | null>(null);
  const [cognitiveMessage, setCognitiveMessage] = useState<string | null>(null);
  const demoRef = useRef<DemoOrchestrator | null>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const syncEngineRef = useRef<StateSyncEngine | null>(null);
  const voiceChannelRef = useRef<VoiceChannel | null>(null);
  const realtimeRef = useRef<SupabaseRealtimeAdapter | null>(null);
  const store = useCocoroStore;
  const climaxState = useCliMaxDirector();
  const { state: bubbleState, activate: activateBubble } = usePrivateBubble();
  const engines = useSpaceEngines();
  const engineStatus = useEngineConnector(engines);
  const router = useRouter();
  const [showSafety, setShowSafety] = useState(false);
  const [captionEnabled, setCaptionEnabled] = useState(false);
  const [showSessionEnd, setShowSessionEnd] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [bondNotice, setBondNotice] = useState<string | null>(null);
  const [showFriendPanel, setShowFriendPanel] = useState(false);
  const [showGameOverlay, setShowGameOverlay] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showHighlightReel, setShowHighlightReel] = useState(false);
  const [showConnectionGraph, setShowConnectionGraph] = useState(false);
  const [showLivePoll, setShowLivePoll] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

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

    // Get room from URL params
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room') ?? 'demo-room';
    const displayName = params.get('name')
      ?? localStorage.getItem('cocoro_display_name')
      ?? 'あなた';
    const isGuest = params.get('guest') === 'true';
    const serverUrl = params.get('server') ?? (window.location.hostname === 'localhost' ? window.location.origin : null);

    store.getState().setRoomId(roomId);

    // --- Supabase Realtime Mode (no separate server required) ---
    const initSupabaseRealtime = async () => {
      try {
        const adapter = new SupabaseRealtimeAdapter(
          roomId,
          localId,
          {
            onParticipantJoined: (p) => store.getState().addParticipant(p),
            onParticipantLeft: (id) => store.getState().removeParticipant(id),
            onAvatarStateUpdate: (id, partial) => store.getState().updateParticipant(id, partial),
            onPhaseChange: (phase, speakers, density) => {
              store.getState().setPhase(phase);
              store.getState().setActiveSpeakers(speakers);
              store.getState().setDensity(density);
            },
            onReaction: (pid, type, ts) => {
              store.getState().addReaction({ participantId: pid, type: type as ReactionType, timestamp: ts });
            },
            // WebRTC signaling via Supabase Realtime
            onWebRTCOffer: async (fromId, sdp) => {
              const vc = voiceChannelRef.current;
              if (!vc) return;
              // Auto-create peer and answer
              const pc = (vc as unknown as { createPeerConnection: (id: string) => { pc: RTCPeerConnection } }).createPeerConnection?.(fromId);
              if (pc) {
                await pc.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.pc.createAnswer();
                await pc.pc.setLocalDescription(answer);
                adapter.sendAnswer(fromId, pc.pc.localDescription!);
              }
            },
            onWebRTCAnswer: async (fromId, sdp) => {
              const vc = voiceChannelRef.current;
              if (!vc) return;
              const peers = (vc as unknown as { peers: Map<string, { pc: RTCPeerConnection }> }).peers;
              const peer = peers?.get(fromId);
              if (peer) {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
              }
            },
            onWebRTCIceCandidate: async (fromId, candidate) => {
              const vc = voiceChannelRef.current;
              if (!vc) return;
              const peers = (vc as unknown as { peers: Map<string, { pc: RTCPeerConnection }> }).peers;
              const peer = peers?.get(fromId);
              if (peer) {
                try {
                  await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                  console.warn('[WebRTC] Failed to add ICE candidate:', e);
                }
              }
            },
          }
        );

        await adapter.join(
          displayName,
          localStorage.getItem('cocoro_avatar_id') ?? 'seed-san'
        );

        realtimeRef.current = adapter;

        // Setup VoiceChannel for P2P audio (using adapter for signaling)
        const vc = new VoiceChannel({
          onPeerSpeaking: (peerId, volume) => {
            const p = store.getState().participants.get(peerId);
            if (p) {
              store.getState().updateParticipant(peerId, {
                speakingState: {
                  ...p.speakingState,
                  isSpeaking: volume > 0.02,
                  volume,
                },
              });
            }
          },
          onPeerConnected: (peerId) => {
            console.log(`[VoiceChannel] Peer connected: ${peerId}`);
          },
          onPeerDisconnected: (peerId) => {
            console.log(`[VoiceChannel] Peer disconnected: ${peerId}`);
          },
        });
        vc.setLocalParticipantId(localId);
        voiceChannelRef.current = vc;

        console.log(`[SpacePage] Supabase Realtime mode: room ${roomId}`);
        return true;
      } catch (e) {
        console.warn('[SpacePage] Supabase Realtime unavailable, falling back to demo:', e);
        return false;
      }
    };

    // --- Socket.IO Mode (legacy, requires separate server) ---
    const initOnline = async () => {
      if (!serverUrl) return false;
      try {
        const syncCallbacks: StateSyncCallbacks = {
          onParticipantJoined: (p) => store.getState().addParticipant(p),
          onParticipantLeft: (id) => store.getState().removeParticipant(id),
          onAvatarStateUpdate: (id, partial) => store.getState().updateParticipant(id, partial),
          onPhaseChange: (phase, speakers, density) => {
            store.getState().setPhase(phase);
            store.getState().setActiveSpeakers(speakers);
            store.getState().setDensity(density);
          },
          onReaction: (pid, type, ts) => {
            store.getState().addReaction({ participantId: pid, type: type as ReactionType, timestamp: ts });
          },
          onRoomsList: () => {},
          onError: (code, msg) => console.error(`[StateSyncEngine] ${code}: ${msg}`),
        };

        const syncEngine = new StateSyncEngine(syncCallbacks);
        await syncEngine.connect(serverUrl);

        const result = await syncEngine.joinRoom({
          roomId,
          displayName,
          vrmUrl: null,
          isGuest,
        });

        store.getState().setLocalParticipantId(result.participantId);
        result.participants.forEach((p) => store.getState().addParticipant(p));

        const vc = new VoiceChannel({
          onPeerSpeaking: (peerId, volume) => {
            const p = store.getState().participants.get(peerId);
            if (p) {
              store.getState().updateParticipant(peerId, {
                speakingState: {
                  ...p.speakingState,
                  isSpeaking: volume > 0.02,
                  volume,
                },
              });
            }
          },
          onPeerConnected: (peerId) => {
            console.log(`[VoiceChannel] Peer connected: ${peerId}`);
          },
          onPeerDisconnected: (peerId) => {
            console.log(`[VoiceChannel] Peer disconnected: ${peerId}`);
          },
        });
        vc.setSocket(syncEngine.getSocket()!);
        vc.setLocalParticipantId(result.participantId);
        result.participants.forEach((p) => {
          if (p.id !== result.participantId) vc.connectToPeer(p.id);
        });

        syncEngineRef.current = syncEngine;
        voiceChannelRef.current = vc;
        return true;
      } catch (e) {
        console.warn('[SpacePage] Server unavailable:', e);
        return false;
      }
    };

    const initDemo = () => {
      store.getState().setLocalParticipantId(localId);
      store.getState().addParticipant({
        id: localId,
        displayName,
        vrmUrl: null,
        avatarId: localStorage.getItem('cocoro_avatar_id') ?? 'seed-san',
        isGuest,
        transform: {
          position: { x: 0, y: 0, z: 5 },
          rotation: { x: 0, y: Math.PI, z: 0 },
          lookAtTarget: null,
        },
        speakingState: { isSpeaking: false, volume: 0, pitch: 0, currentViseme: 'sil', visemeWeight: 0 },
        emotion: { joy: 0, anger: 0, sorrow: 0, surprise: 0, neutral: 1 },
      });

      const demo = new DemoOrchestrator(store);
      demo.start(5);
      demoRef.current = demo;
    };

    // Try Supabase Realtime first, then Socket.IO, then demo
    initSupabaseRealtime().then((connected) => {
      if (connected) {
        setIsLoaded(true);
        return;
      }
      return initOnline().then((online) => {
        if (!online) initDemo();
        setIsLoaded(true);
      });
    });

    // Load cognitive context
    const avatarId = localStorage.getItem('cocoro_avatar_id') ?? 'seed-san';
    cognitiveContext.buildSnapshot(roomId, avatarId).then((snapshot) => {
      if (snapshot.welcomeMessage) {
        setCognitiveMessage(snapshot.welcomeMessage);
        setTimeout(() => setCognitiveMessage(null), 6000); // auto-dismiss
      }
      // Apply cognitive color temperature to lighting
      store.getState().setLighting({
        colorTemperature: snapshot.suggestedColorTemp,
      });
    }).catch(() => {});

    // === Phase M: SafeHaven ウェルカム通知リスナー ===
    const unsafeHaven = engines.safeHaven.onWelcome((e) => {
      setWelcomeMsg(e.message);
      setTimeout(() => setWelcomeMsg(null), 4000);
    });

    // === Phase M: GradualBond 絆通知リスナー ===
    const unBond = engines.gradualBond.onNotification((n) => {
      setBondNotice(n.message);
      setTimeout(() => setBondNotice(null), 5000);
    });

    return () => {
      demoRef.current?.stop();
      voiceAnalyzerRef.current?.stop();
      syncEngineRef.current?.disconnect();
      voiceChannelRef.current?.dispose();
      realtimeRef.current?.leave();
      unsafeHaven();
      unBond();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle microphone
  const handleToggleMic = useCallback(async () => {
    const localId = store.getState().localParticipantId;
    if (!localId) return;

    setMicError(null);

    if (isMicActive) {
      voiceAnalyzerRef.current?.stop();
      voiceAnalyzerRef.current = null;
      setIsMicActive(false);
      voiceChannelRef.current?.setMuted(true);

      store.getState().updateParticipant(localId, {
        speakingState: {
          isSpeaking: false,
          volume: 0,
          pitch: 0,
          currentViseme: 'sil',
          visemeWeight: 0,
        },
      });
      // Sync mute state to network
      syncEngineRef.current?.bufferLocalState(
        undefined,
        { isSpeaking: false, volume: 0, pitch: 0, currentViseme: 'sil', visemeWeight: 0 },
      );
      realtimeRef.current?.bufferLocalState(
        undefined,
        { isSpeaking: false, volume: 0, pitch: 0, currentViseme: 'sil', visemeWeight: 0 },
      );
    } else {
      try {
        const analyzer = new VoiceAnalyzer();
        await analyzer.start((result) => {
          const currentLocalId = store.getState().localParticipantId;
          if (!currentLocalId) return;

          const speakingState = {
            isSpeaking: result.isSpeaking,
            volume: result.volume,
            pitch: result.pitch,
            currentViseme: result.viseme.viseme,
            visemeWeight: result.viseme.weight,
          };

          // === 1. Update speaking state in store ===
          store.getState().updateParticipant(currentLocalId, { speakingState });

          // === 2. Buffer to network (StateSyncEngine or SupabaseRealtime sends at 30fps) ===
          syncEngineRef.current?.bufferLocalState(
            store.getState().participants.get(currentLocalId)?.transform,
            speakingState,
          );
          realtimeRef.current?.bufferLocalState(
            store.getState().participants.get(currentLocalId)?.transform,
            speakingState,
          );

          // === 3. Emotion classification (REAL FFT data) ===
          const freqData = analyzer.getFrequencyDataNormalized();
          if (freqData.length > 0) {
            const emotion = emotionClassifier.classify(
              freqData,
              result.volume,
              result.pitchNormalized,
              result.isSpeaking,
            );

            const emotionState = {
              joy: emotion.joy,
              anger: emotion.anger,
              sorrow: emotion.sorrow,
              surprise: emotion.surprise,
              neutral: emotion.neutral,
            };

            // Write emotion to store + network
            store.getState().updateParticipant(currentLocalId, { emotion: emotionState });
            syncEngineRef.current?.bufferLocalState(undefined, undefined, emotionState);
            realtimeRef.current?.bufferLocalState(undefined, undefined, emotionState);

            // === 4. Anger auto-bubble (safety mechanism) ===
            if (emotion.anger > 0.6) {
              angerFramesRef.current++;
              if (angerFramesRef.current > 90) {
                activateBubble();
                angerFramesRef.current = 0;
              }
            } else {
              angerFramesRef.current = Math.max(0, angerFramesRef.current - 2);
            }

            // === 5. Voice Signature calibration (REAL FFT) ===
            if (!voiceSignature.isCalibrated) {
              voiceSignature.feed(freqData, result.volume);
            }

            // === 6. Spatial Memory heatmap (throttled to 1/sec) ===
            if (result.isSpeaking) {
              speechSecondsRef.current += 1 / 60;
              heatmapTimerRef.current++;
              if (heatmapTimerRef.current >= 60) {
                heatmapTimerRef.current = 0;
                const pos = store.getState().participants.get(currentLocalId)?.transform.position;
                if (pos) {
                  spatialMemory.updateHeatmap(
                    pos.x, pos.z,
                    result.volume,
                    emotion.dominant,
                  ).catch(() => {});
                }
              }
            }
          }
        });
        voiceAnalyzerRef.current = analyzer;
        setIsMicActive(true);
        localStorage.setItem('cocoro_mic_used', 'true'); // 初回マイク使用を記録

        // Share MediaStream with VoiceChannel for WebRTC P2P audio
        const stream = analyzer.getMediaStream();
        if (stream && voiceChannelRef.current) {
          voiceChannelRef.current.setLocalStream(stream);
          voiceChannelRef.current.setMuted(false);
        }
      } catch (err) {
        console.error('Failed to start microphone:', err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setMicError('マイクのアクセスが拒否されました。ブラウザの設定からマイクを許可してください。');
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setMicError('マイクが見つかりません。デバイスを確認してください。');
        } else {
          setMicError('マイクの起動に失敗しました。');
        }
        setTimeout(() => setMicError(null), 5000);
      }
    }
  }, [isMicActive, store, emotionClassifier, voiceSignature, activateBubble]);

  // Leave space — with confirmation + data save
  const handleLeaveRequest = useCallback(() => {
    setShowLeaveConfirm(true);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    // GentleExit: 穏やかなフェードアウト離脱
    const localId = store.getState().localParticipantId;
    const displayName = localId
      ? store.getState().participants.get(localId)?.displayName
      : undefined;
    if (localId) {
      engines.gentleExit.initiateExit(localId, displayName);
    }

    // Save avatar evolution to IndexedDB on leave
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

    // Session End Summary表示 → その後リダイレクト
    setShowSessionEnd(true);
  }, [store, voiceSignature, engines.gentleExit]);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  // Profile card handler
  const handleShowProfile = useCallback((participantId: string) => {
    setProfileTarget(participantId);
  }, []);

  const roomId = store.getState().roomId ?? 'demo-room';

  return (
    <div className="fixed inset-0 bg-[#0f0a1a]">
      {/* 3D Canvas */}
      {isLoaded && <CocoroCanvas className="absolute inset-0" />}

      {/* HUD Overlay */}
      <SpaceHUD
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        onLeave={handleLeaveRequest}
        onShowProfile={handleShowProfile}
        onShareRoom={() => setShowShareRoom((s) => !s)}
        onShowGame={() => setShowGameOverlay(true)}
        onShowFriends={() => setShowFriendPanel(true)}
        onShowSafety={() => setShowSafety(true)}
        onShowSession={() => setShowSessionSummary(true)}
        onShowHighlight={() => setShowHighlightReel(true)}
        engineStatus={engineStatus}
      />

      {/* Mic Onboarding Hint (反復10: 初回体験ガイド) */}
      {isLoaded && !isMicActive && !localStorage.getItem('cocoro_mic_used') && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up pointer-events-none">
          <div className="px-4 py-2.5 rounded-2xl bg-violet-500/20 backdrop-blur-xl
                          border border-violet-400/20 text-violet-200 text-sm
                          shadow-lg shadow-violet-500/10 animate-mic-pulse">
            🎤 マイクをタップして声を出してみよう
          </div>
        </div>
      )}

      {/* Reaction Panel (ROM専向け) */}
      <ReactionPanel />

      {/* Welcome Toast (入退室通知) */}
      <WelcomeToast />

      {/* CliMax Overlay */}
      <CliMaxOverlay state={climaxState} />

      {/* Private Bubble */}
      <PrivateBubbleOverlay state={bubbleState} />

      {/* === 統合エンジン UI === */}

      {/* Conversation HUD (発話バランス + フェーズ表示) */}
      <ConversationHUD
        silenceState={{ phase: 'none', durationSeconds: 0, bgmVolume: 0, showThinking: false, showTopicSuggestion: false, showEncouragement: false, encouragementText: '' }}
        arcState={{ phase: 'opening', intensity: 0.3, peakIntensity: 0, peakTime: 0, effectMultiplier: 1, suggestedAction: null }}
        sessionMinutes={Math.round(performance.now() / 60000)}
        participantCount={store.getState().participants.size}
      />

      {/* Live Caption (字幕) */}
      <LiveCaption enabled={captionEnabled} onToggle={() => setCaptionEnabled(c => !c)} />

      {/* Connection Quality (右上) */}
      <div className="fixed top-4 right-4 z-30">
        <ConnectionQuality latencyMs={50} packetLoss={0.5} jitter={5} />
      </div>

      {/* Aha Moment 祝福トースト */}
      {engines.ahaCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="px-5 py-3 rounded-2xl bg-amber-500/15 backdrop-blur-2xl
            border border-amber-400/20 shadow-lg shadow-amber-500/10 text-center">
            <p className="text-amber-200 text-sm font-medium">
              {engines.ahaCelebration.emoji} {engines.ahaCelebration.label}
            </p>
            <p className="text-amber-300/50 text-[10px] mt-0.5">
              +{engines.ahaCelebration.reward} コイン
            </p>
          </div>
        </div>
      )}

      {/* Room Mood (ルーム全体の雰囲気) */}
      {engines.roomMood && engines.roomMood.intensity > 0.2 && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-xl border border-white/5">
            <p className="text-[9px] text-white/30">{engines.roomMood.suggestion}</p>
          </div>
        </div>
      )}

      {/* Group Split Suggestion (6人超で表示) */}
      {engines.groupRecommendation?.shouldSplit && engines.groupRecommendation.splitReason && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up pointer-events-none">
          <div className="px-4 py-2 rounded-2xl bg-blue-500/10 backdrop-blur-xl
            border border-blue-400/15 text-center max-w-[260px]">
            <p className="text-[10px] text-blue-200/60">
              👥 {engines.groupRecommendation.splitReason}
            </p>
          </div>
        </div>
      )}

      {/* Silent Prompt (沈黙者への話振り提案) */}
      {engines.silentPrompt && (
        <div className="fixed bottom-40 right-4 z-30 animate-fade-in-up pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/8">
            <p className="text-[9px] text-white/25">{engines.silentPrompt.suggestion}</p>
          </div>
        </div>
      )}

      {/* Visit Streak (連続訪問ボーナス) */}
      {engines.visitInfo?.isNewDay && engines.visitInfo.streak > 1 && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
          <div className="px-4 py-2 rounded-2xl bg-orange-500/10 backdrop-blur-xl border border-orange-400/15">
            <p className="text-orange-200/60 text-xs">
              🔥 {engines.visitInfo.streak}日連続！ {engines.visitInfo.reward}
            </p>
          </div>
        </div>
      )}

      {/* Cognitive Welcome Message (認知的ウェルカム) */}
      {cognitiveMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="px-5 py-3 rounded-2xl
            bg-violet-500/8 backdrop-blur-2xl border border-violet-500/15
            shadow-lg shadow-violet-500/5 max-w-xs text-center">
            <p className="text-[11px] text-violet-300/70 leading-relaxed">
              🧠 {cognitiveMessage}
            </p>
          </div>
        </div>
      )}

      {/* SafeHaven ウェルカム通知 */}
      {welcomeMsg && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up pointer-events-none">
          <div className="px-5 py-3 rounded-2xl
            bg-amber-500/8 backdrop-blur-2xl border border-amber-400/15
            shadow-lg shadow-amber-500/5 max-w-xs text-center">
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              {welcomeMsg}
            </p>
          </div>
        </div>
      )}

      {/* GradualBond 絆通知 */}
      {bondNotice && (
        <div className="fixed top-44 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up pointer-events-none">
          <div className="px-5 py-3 rounded-2xl
            bg-emerald-500/8 backdrop-blur-2xl border border-emerald-400/15
            shadow-lg shadow-emerald-500/5 max-w-xs text-center">
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              {bondNotice}
            </p>
          </div>
        </div>
      )}

      {/* Seasonal Background Tint */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${engines.seasonalTheme.bgColor.replace('from-', '').split(' ')[0]}10, transparent 70%)` }} />

      {/* Conversation HUD (沈黙+会話アーク+セッション時間) */}
      <ConversationHUD
        silenceState={{
          phase: engineStatus.silenceDuration > 30 ? 'encourage'
            : engineStatus.silenceDuration > 15 ? 'suggest'
            : engineStatus.silenceDuration > 10 ? 'thinking'
            : engineStatus.silenceDuration > 5 ? 'ambient'
            : 'none',
          durationSeconds: engineStatus.silenceDuration,
          bgmVolume: Math.min(0.5, engineStatus.silenceDuration / 60),
          showThinking: engineStatus.silenceDuration > 10 && engineStatus.silenceDuration < 15,
          showTopicSuggestion: engineStatus.silenceDuration > 15,
          showEncouragement: engineStatus.silenceDuration > 30,
          encouragementText: engineStatus.silenceDuration > 30 ? '何か話してみましょう 🌟' : engineStatus.silenceDuration > 20 ? '静かなひとときですね… 🌙' : '',
        }}
        arcState={{
          phase: (engineStatus.conversationArc as 'opening' | 'developing' | 'climax' | 'resolution' | 'ending') || 'opening',
          intensity: engineStatus.emotionIntensity,
          peakIntensity: engineStatus.emotionIntensity,
          peakTime: Date.now(),
          effectMultiplier: engineStatus.conversationArc === 'climax' ? 2.0 : 1.0,
          suggestedAction: engineStatus.conversationArc === 'ending' ? 'そろそろ振り返りの時間かも' : null,
        }}
        sessionMinutes={Math.round(performance.now() / 60000)}
        participantCount={store.getState().participants.size}
      />

      {/* === P0統合: 未マウントだった主要UIコンポーネント === */}

      {/* Game Overlay (ワードウルフ等の会話ゲーム) */}
      {showGameOverlay && (
        <GameOverlay
          gameState={engines.gameEngine.getState()}
          myId={store.getState().localParticipantId ?? 'local'}
          onSelectGame={(type) => {
            const pIds = Array.from(store.getState().participants.values()).map(p => ({ id: p.id, displayName: p.displayName }));
            engines.gameEngine.createGame(type, pIds);
            engines.gameEngine.start();
          }}
          onVote={(targetId) => engines.gameEngine.vote(store.getState().localParticipantId ?? 'local', targetId)}
          onClose={() => setShowGameOverlay(false)}
          remainingSeconds={engines.gameEngine.getRemainingSeconds()}
        />
      )}

      {/* Friend Panel (フレンド一覧・管理) */}
      {showFriendPanel && (
        <FriendPanel
          friends={engines.socialGraph.getAllFriends?.() ?? []}
          pendingRequests={engines.socialGraph.getPendingRequests?.() ?? []}
          onJoinRoom={() => {}}
          onAcceptRequest={(fromId) => engines.socialGraph.acceptRequest?.(fromId, 'user', 'default')}
          onClose={() => setShowFriendPanel(false)}
        />
      )}

      {/* Friend Request Button (プロフィール表示時) */}
      {profileTarget && (() => {
        const p = store.getState().participants.get(profileTarget);
        const friends = engines.socialGraph.getAllFriends?.() ?? [];
        const isFriend = friends.some((f: { id: string }) => f.id === profileTarget);
        return p ? (
          <div className="fixed bottom-24 right-4 z-50">
            <FriendRequestButton
              targetId={p.id}
              targetName={p.displayName}
              isFriend={isFriend}
              onSendRequest={() => {}}
            />
          </div>
        ) : null;
      })()}

      {/* Safety Panel (安全管理・通報) */}
      {showSafety && profileTarget && (() => {
        const p = store.getState().participants.get(profileTarget);
        return p ? (
          <SafetyPanel
            targetId={p.id}
            targetName={p.displayName}
            isBlocked={false}
            isMuted={false}
            isSafeZoneActive={false}
            onBlock={() => {}}
            onMute={() => {}}
            onToggleSafeZone={() => {}}
            onReport={() => {}}
            onClose={() => setShowSafety(false)}
          />
        ) : null;
      })()}

      {/* Session End Summary (退出時振り返り) */}
      {showSessionEnd && (
        <SessionEndSummary
          data={{
            durationMinutes: Math.round(performance.now() / 60000),
            totalSpeechSeconds: speechSecondsRef.current,
            participantCount: store.getState().participants.size,
            peakMoments: engines.peakDetector.getAllMoments?.() ?? [],
            dominantEmotion: engines.emotionPulse.computeRoomMood()?.dominant ?? 'neutral',
            roomName: 'cocoro space',
          }}
          onClose={() => { setShowSessionEnd(false); router.push('/lobby'); }}
        />
      )}

      {/* Topic Card (トピック提案) */}
      {engines.topicEngine && (() => {
        const topic = engines.topicEngine.getCurrent?.();
        return topic ? (
          <div className="fixed top-36 right-4 z-30 animate-fade-in-up">
            <TopicCard
              topic={topic}
              onNext={() => {}}
              onChoose={() => {}}
              isVoiceActive={isMicActive}
              volume={(() => {
                const lp = store.getState().participants.get(store.getState().localParticipantId ?? '');
                return lp?.speakingState?.volume ?? 0;
              })()}
            />
          </div>
        ) : null;
      })()}

      {/* Space Mood Indicator */}
      {engines.roomMood && engines.roomMood.intensity > 0.1 && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20">
          <SpaceMoodIndicator
            flowLevel={engines.roomMood.intensity > 0.7 ? 'zone' : engines.roomMood.intensity > 0.4 ? 'flowing' : 'warming'}
            flowScore={engines.roomMood.intensity}
            streakSeconds={0}
            turnsPerMinute={0}
          />
        </div>
      )}

      {/* Listener Gesture Bar (リスナー向けジェスチャーバー) */}
      {!isMicActive && isLoaded && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <ListenerGestureBar
            system={engines.listenerEngagement}
            visible={true}
          />
        </div>
      )}

      {/* Session Summary (セッション統計) */}
      {showSessionSummary && (
        <SessionSummary
          data={{
            durationMinutes: Math.round(performance.now() / 60000),
            participantCount: store.getState().participants.size,
            topKeywords: [],
            myTalkTimePercent: Math.round(engineStatus.activeParticipantRatio * 100),
            reactionsReceived: Math.round(engineStatus.bondLevel * 10),
            levelBefore: 1,
            levelAfter: 1 + Math.floor(engineStatus.eqScore * 3),
            xpGained: Math.round(engineStatus.eqScore * 200 + engineStatus.groupEnergy * 100),
            moodSummary: engineStatus.roomMoodLabel,
            bestMoment: engineStatus.conversationArc === 'climax' ? '🔥 最高潮の瞬間' : null,
            streakDays: 0,
          }}
          onClose={() => setShowSessionSummary(false)}
          onShare={() => {}}
        />
      )}

      {/* Highlight Reel (ハイライト再生) */}
      {showHighlightReel && (
        <HighlightReel
          sessionDuration={Math.round(performance.now() / 60000)}
          moments={[]}
          participants={Array.from(store.getState().participants.values()).map(p => ({
            id: p.id,
            name: p.displayName,
            speakingMinutes: p.speakingState.isSpeaking ? 1 : 0,
            reactionsGiven: 0,
            dominantEmotion: Object.entries(p.emotion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral',
            role: p.speakingState.isSpeaking ? 'speaker' as const : 'listener' as const,
          }))}
          flowPeakMinute={Math.round(performance.now() / 120000)}
          roomName="cocoro space"
          onClose={() => setShowHighlightReel(false)}
          onShare={() => {}}
        />
      )}

      {/* === P1統合: 追加UIコンポーネント === */}

      {/* Audience Question Card (聴衆質問カード) */}
      <AudienceQuestionCardPanel
        visible={!isMicActive && isLoaded}
        onSendQuestion={() => {}}
      />

      {/* Connection Graph (ソーシャルグラフ視覚化) */}
      {showConnectionGraph && (
        <ConnectionGraph
          nodes={Array.from(store.getState().participants.values()).map(p => {
            const speaking = p.speakingState;
            return {
              id: p.id,
              name: p.displayName,
              avatar: p.avatarId ?? '',
              isSelf: p.id === store.getState().localParticipantId,
              speechMinutes: speaking.isSpeaking ? 1 : 0,
            };
          })}
          edges={(() => {
            const ps = Array.from(store.getState().participants.values());
            const result: { from: string; to: string; strength: number; sharedPeaks: number }[] = [];
            for (let i = 0; i < ps.length; i++) {
              for (let j = i + 1; j < ps.length; j++) {
                result.push({
                  from: ps[i].id,
                  to: ps[j].id,
                  strength: Math.min(1, (engineStatus.trustLevel + engineStatus.bondLevel) / 2),
                  sharedPeaks: 0,
                });
              }
            }
            return result;
          })()}
          onClose={() => setShowConnectionGraph(false)}
        />
      )}

      {/* Live Poll (リアルタイム投票) */}
      {showLivePoll && (
        <LivePoll
          poll={{
            question: engineStatus.conversationArc === 'opening'
              ? '何について話しましょう？'
              : engineStatus.conversationArc === 'climax'
                ? '今の話題をもっと深掘りする？'
                : '次のトピックは？',
            options: [
              { id: 'a', text: '趣味の話', votes: Math.floor(engineStatus.groupEnergy * 3), emoji: '🎮' },
              { id: 'b', text: '最近のニュース', votes: Math.floor(engineStatus.activeParticipantRatio * 5), emoji: '📰' },
              { id: 'c', text: 'おすすめの音楽', votes: Math.floor(engineStatus.emotionIntensity * 4), emoji: '🎵' },
            ],
            totalVotes: Math.floor(engineStatus.groupEnergy * 3 + engineStatus.activeParticipantRatio * 5 + engineStatus.emotionIntensity * 4),
            myVote: null,
            isOpen: true,
            createdAt: Date.now(),
          }}
          onVote={() => {}}
          onClose={() => setShowLivePoll(false)}
        />
      )}

      {/* Warp Transition (ルーム間ワープエフェクト) */}
      <WarpTransition
        type="enter"
        active={isWarping}
        onComplete={() => setIsWarping(false)}
        roomName="cocoro space"
      />

      {/* Bubble Button (bottom-left) */}
      <div className="fixed bottom-6 left-4 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <BubbleButton onActivate={() => activateBubble()} />
      </div>

      {/* Share Room (toggled from HUD) */}
      {showShareRoom && (
        <div className="fixed top-16 left-4 z-50 animate-scale-in">
          <ShareRoom roomId={roomId} roomName="cocoro space" />
        </div>
      )}

      {/* Profile Card Overlay */}
      {profileTarget && (() => {
        const p = store.getState().participants.get(profileTarget);
        if (!p) return null;
        return (
          <ProfileCard
            participantId={p.id}
            displayName={p.displayName}
            avatarId={p.avatarId}
            isSpeaking={p.speakingState.isSpeaking}
            isLocal={p.id === store.getState().localParticipantId}
            onClose={() => setProfileTarget(null)}
          />
        );
      })()}

      {/* Mic Error Toast */}
      {micError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl
            bg-red-500/10 backdrop-blur-2xl border border-red-500/20
            shadow-lg shadow-red-500/10 max-w-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-[12px] text-red-300/90 leading-relaxed">{micError}</p>
          </div>
        </div>
      )}

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6"
          onClick={handleLeaveCancel}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-[280px] p-6 rounded-3xl
            bg-white/5 backdrop-blur-2xl border border-white/10
            shadow-2xl shadow-black/40 animate-scale-in"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-white/80 text-sm mb-6">
              空間を退出しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLeaveCancel}
                className="flex-1 py-2.5 rounded-xl
                  bg-white/5 border border-white/10
                  text-white/60 text-sm
                  hover:bg-white/10 transition-all active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 py-2.5 rounded-xl
                  bg-red-500/15 border border-red-500/25
                  text-red-400 text-sm font-medium
                  hover:bg-red-500/25 transition-all active:scale-95"
              >
                退出する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Monitor (debug) */}
      <PerformanceOverlay visible={process.env.NODE_ENV === 'development'} />

      {/* Cinematic Entrance — 映画の冒頭のように空間へ沈んでいく */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
          style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(139,92,246,0.08), #0f0a1a 70%)` }}>
          
          {/* Depth rings — 空間の奥行きを暗示 */}
          <div className="relative w-48 h-48 mb-12">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: `rgba(139,92,246,${0.15 - i * 0.025})`,
                  animation: `cinematic-ring ${2.5 + i * 0.2}s ease-out ${i * 0.25}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Central breath — 生命感のある光 */}
            <div 
              className="absolute inset-12 rounded-full blur-xl"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.3), rgba(236,72,153,0.15), transparent)',
                animation: 'breath-glow 3s ease-in-out infinite',
              }}
            />
            {/* Inner core */}
            <div className="absolute inset-16 rounded-full bg-white/5 blur-sm" 
              style={{ animation: 'breath-glow 3s ease-in-out 0.5s infinite' }}
            />
          </div>

          {/* Staggered poetic text reveal */}
          <div className="text-center space-y-3">
            <p
              className="text-white/40 text-[11px] tracking-[0.4em] uppercase transition-all duration-1500 ease-out"
              style={{
                opacity: loadingPhase >= 1 ? 1 : 0,
                transform: loadingPhase >= 1 ? 'translateY(0)' : 'translateY(15px)',
                letterSpacing: loadingPhase >= 1 ? '0.4em' : '0.6em',
              }}
            >
              声が空間を紡ぐ
            </p>
            <p
              className="text-white/20 text-[10px] tracking-[0.5em] transition-all duration-1500 ease-out"
              style={{
                opacity: loadingPhase >= 2 ? 0.6 : 0,
                transform: loadingPhase >= 2 ? 'translateY(0)' : 'translateY(15px)',
              }}
            >
              cocoro
            </p>
          </div>

          {/* Bottom rising light — 下から立ち上る光 */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/4 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(139,92,246,0.03), transparent)',
              animation: 'entrance-rise 4s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
