'use client';
/**
 * cocoro — useSpaceEngines
 * 全113エンジン統合フック
 *
 * 全エンジンを以下のループで分類して接続:
 *  - RAF (16ms): performance / rendering / audio metering
 *  - 1s loop:    aha moment / session achievements
 *  - 3s loop:    social analysis / choreography / interaction
 *  - 5s loop:    group dynamics / emotion / conversation flow
 *  - 10s loop:   show / game / economy / governance
 *  - 30s loop:   anti-churn / analytics / serendipity
 *  - 60s loop:   persistence / privacy / memory / cleanup
 *  - session:    habit / trust / session start/end
 */

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useCocoroStore } from '@/store/useCocoroStore';

// ===== social (11) =====
import { GroupDynamicsManager } from '@/engine/social/GroupDynamicsManager';
import { AhaMomentEngine } from '@/engine/social/AhaMomentEngine';
import { CreatorToolkit } from '@/engine/social/CreatorToolkit';
import { HabitLoopEngine } from '@/engine/social/HabitLoopEngine';
import { AntiChurnSystem } from '@/engine/social/AntiChurnSystem';
import { TrustScoreSystem } from '@/engine/social/TrustScoreSystem';
import { SerendipityEngine } from '@/engine/social/SerendipityEngine';
import { SeasonalContentEngine } from '@/engine/social/SeasonalContentEngine';
import { AnalyticsEngine } from '@/engine/social/AnalyticsEngine';
import { AICompanion } from '@/engine/social/AICompanion';
import { SmartJoinEngine } from '@/engine/social/SmartJoinEngine';
import { GuestMode } from '@/engine/social/GuestMode';
// C-rank social (5)
import { CollectiveInsightEngine } from '@/engine/social/CollectiveInsightEngine';
import { ConversationLevelSystem } from '@/engine/social/ConversationLevelSystem';
import { DailyChallengeSystem } from '@/engine/social/DailyChallengeSystem';
import { EventScheduler } from '@/engine/social/EventScheduler';
import { FavoriteRoomsManager } from '@/engine/social/FavoriteRoomsManager';
import { SocialGraph } from '@/engine/social/SocialGraph';
import { NotificationEngine } from '@/engine/social/NotificationEngine';
import { SmartNotificationEngine } from '@/engine/social/SmartNotificationEngine';
import { InviteLinkSystem } from '@/engine/social/InviteLinkSystem';

// ===== interaction (14) =====
import { EmotionPulseEngine } from '@/engine/interaction/EmotionPulseEngine';
import { PresenceAuraSystem } from '@/engine/interaction/PresenceAuraSystem';
import { AvatarExpressionEngine } from '@/engine/interaction/AvatarExpressionEngine';
import { AvatarPhysicsEngine } from '@/engine/interaction/AvatarPhysicsEngine';
import { AutoComfortEngine } from '@/engine/interaction/AutoComfortEngine';
import { AdaptiveUIEngine } from '@/engine/interaction/AdaptiveUIEngine';
import { ConversationTopicEngine } from '@/engine/interaction/ConversationTopicEngine';
import { ListenerEngagementSystem } from '@/engine/interaction/ListenerEngagementSystem';
import { ProximityInteractionSystem } from '@/engine/interaction/ProximityInteractionSystem';
import { SessionAchievements } from '@/engine/interaction/SessionAchievements';
import { TouchGestureSystem } from '@/engine/interaction/TouchGestureSystem';
import { VoiceGestureEngine } from '@/engine/interaction/VoiceGestureEngine';
import { VoiceIdentityEngine } from '@/engine/interaction/VoiceIdentityEngine';
import { WhisperMode } from '@/engine/interaction/WhisperMode';

// ===== audio (12 - non-duplicates) =====
import { VoiceEffectProcessor } from '@/engine/audio/VoiceEffectProcessor';
import { SoundDesign } from '@/engine/audio/SoundDesign';
import { AudioOptimizer } from '@/engine/audio/AudioOptimizer';
import { AudioRouter } from '@/engine/audio/AudioRouter';
import { DynamicBGM } from '@/engine/audio/DynamicBGM';
import { SpatialAudioEngine } from '@/engine/audio/SpatialAudioEngine';
import { SpatialAudioMixer } from '@/engine/audio/SpatialAudioMixer';
import { SpatialSoundscapeGenerator } from '@/engine/audio/SpatialSoundscapeGenerator';
import { VoiceFFTAnalyzer } from '@/engine/audio/VoiceFFTAnalyzer';
import { VoiceSignatureEngine } from '@/engine/audio/VoiceSignatureEngine';
import { VoiceToneAnalyzer } from '@/engine/audio/VoiceToneAnalyzer';
import { VoiceEffectsEngine } from '@/engine/audio/VoiceEffectsEngine';
import { RoomAmbienceEngine } from '@/engine/audio/RoomAmbienceEngine';

// ===== choreography (14) =====
import { AttentionDirector } from '@/engine/choreography/AttentionDirector';
import { ConversationArcDirector } from '@/engine/choreography/ConversationArcDirector';
import { ConversationFlowAnalyzer } from '@/engine/choreography/ConversationFlowAnalyzer';
import { ConversationHeatmap } from '@/engine/choreography/ConversationHeatmap';
import { DynamicRoomThemeEngine } from '@/engine/choreography/DynamicRoomThemeEngine';
import { EmotionContagionEngine } from '@/engine/choreography/EmotionContagionEngine';
import { EmotionTimeline } from '@/engine/choreography/EmotionTimeline';
import { GravityFormation } from '@/engine/choreography/GravityFormation';
import { MoodLightingEngine } from '@/engine/choreography/MoodLightingEngine';
import { PeakMomentDetector } from '@/engine/choreography/PeakMomentDetector';
import { PhaseStateMachine } from '@/engine/choreography/PhaseStateMachine';
import { RoomMemorySystem } from '@/engine/choreography/RoomMemorySystem';
import { SilenceDirector } from '@/engine/choreography/SilenceDirector';
import { SpeechRhythmAnalyzer } from '@/engine/choreography/SpeechRhythmAnalyzer';

// ===== cognitive (9 classes) =====
import { EQVoiceEngine } from '@/engine/cognitive/EQVoiceEngine';
import { PersistentMemoryEngine } from '@/engine/cognitive/PersistentMemoryEngine';
import { AgenticShowRunner } from '@/engine/cognitive/AgenticShowRunner';
import { CognitiveSpaceEngine, RegenerativeConversation } from '@/engine/cognitive/CognitiveSpaceEngine';
import { CognitiveTrustGraph } from '@/engine/cognitive/CognitiveTrustGraph';
import { CreatorEconomy2Engine, DigitalProvenanceSystem, AdaptivePrivacyShield } from '@/engine/cognitive/CreatorEconomy2';

// ===== connection (5 classes) =====
import { ComfortDistanceEngine } from '@/engine/connection/ComfortDistanceEngine';
import { GradualBondEngine } from '@/engine/connection/GradualBondEngine';
import { SafeHavenAtmosphere, SocialCueReader, GentleExitFlow } from '@/engine/connection/SafeHavenEngine';

// ===== show (6) =====
import { LiveShowDirector } from '@/engine/show/LiveShowDirector';
import { AudienceDirector } from '@/engine/show/AudienceDirector';
import { HighlightClipEngine } from '@/engine/show/HighlightClipEngine';
import { ConversationGameShow } from '@/engine/show/ConversationGameShow';
import { CollabStageSystem } from '@/engine/show/CollabStageSystem';
import { MomentReaction } from '@/engine/show/MomentReaction';

// ===== game (3) =====
import { SharedActivitiesManager } from '@/engine/game/SharedActivitiesManager';
import { ConversationGameEngine } from '@/engine/game/ConversationGameEngine';
import { DebateBattle } from '@/engine/game/DebateBattle';

// ===== governance (8 classes) =====
import { RoomGovernance } from '@/engine/governance/RoomGovernance';
import { ReputationFederation } from '@/engine/governance/ReputationFederation';
import { MembershipTier, CommunityMilestone, AIAutoModerator, ContentArchive, CreatorDashboard } from '@/engine/governance/CommunityGovernance';

// ===== economy (2) =====
import { CoinEconomy } from '@/engine/economy/CoinEconomy';
import { VirtualGiftSystem } from '@/engine/economy/VirtualGiftSystem';

// ===== safety (5) =====
import { ConflictResolutionSystem } from '@/engine/safety/ConflictResolutionSystem';
import { PrivacyGuard } from '@/engine/safety/PrivacyGuard';
import { AutoModerator } from '@/engine/safety/AutoModerator';
import { ReportSystem } from '@/engine/safety/ReportSystem';
import { SafetyBoundarySystem } from '@/engine/safety/SafetyBoundarySystem';

// ===== memory (2 classes) =====
import { ConversationMemoryAI } from '@/engine/memory/ConversationMemoryAI';

// ===== performance (5 classes) =====
import { EngineScheduler } from '@/engine/performance/EngineScheduler';
import { MemoryPoolManager, FrameBudgetController } from '@/engine/performance/MemoryPoolManager';
import { InputLatencyOptimizer, NetworkQualityPredictor } from '@/engine/performance/InputLatencyOptimizer';

// ===== rendering (2) =====
import { AdaptiveRenderer } from '@/engine/rendering/AdaptiveRenderer';
import { LodManager } from '@/engine/rendering/LodManager';

// --------------------------------------------------------------------------
// SpaceEngines interface: all 113 engines
// --------------------------------------------------------------------------
export interface SpaceEngines {
  // social
  groupDynamics: GroupDynamicsManager;
  ahaMoment: AhaMomentEngine;
  creatorToolkit: CreatorToolkit;
  habitLoop: HabitLoopEngine;
  antiChurn: AntiChurnSystem;
  trustScore: TrustScoreSystem;
  serendipity: SerendipityEngine;
  seasonal: SeasonalContentEngine;
  analytics: AnalyticsEngine;
  aiCompanion: AICompanion;
  smartJoin: SmartJoinEngine;
  guestMode: GuestMode;
  collectiveInsight: CollectiveInsightEngine;
  conversationLevel: ConversationLevelSystem;
  dailyChallenge: DailyChallengeSystem;
  eventScheduler: EventScheduler;
  favoriteRooms: FavoriteRoomsManager;
  socialGraph: SocialGraph;
  notification: NotificationEngine;
  smartNotification: SmartNotificationEngine;
  inviteLink: InviteLinkSystem;

  // interaction
  emotionPulse: EmotionPulseEngine;
  presenceAura: PresenceAuraSystem;
  avatarExpression: AvatarExpressionEngine;
  avatarPhysics: AvatarPhysicsEngine;
  autoComfort: AutoComfortEngine;
  adaptiveUI: AdaptiveUIEngine;
  topicEngine: ConversationTopicEngine;
  listenerEngagement: ListenerEngagementSystem;
  proximityInteraction: ProximityInteractionSystem;
  sessionAchievements: SessionAchievements;
  touchGesture: TouchGestureSystem;
  voiceGesture: VoiceGestureEngine;
  voiceIdentity: VoiceIdentityEngine;
  whisperMode: WhisperMode;

  // audio
  voiceEffects: VoiceEffectProcessor;
  soundDesign: SoundDesign;
  audioOptimizer: AudioOptimizer;
  audioRouter: AudioRouter;
  dynamicBGM: DynamicBGM;
  spatialAudio: SpatialAudioEngine;
  spatialMixer: SpatialAudioMixer;
  soundscapeGen: SpatialSoundscapeGenerator;
  voiceFFT: VoiceFFTAnalyzer;
  voiceSignatureEngine: VoiceSignatureEngine;
  voiceTone: VoiceToneAnalyzer;
  voiceEffectsEngine: VoiceEffectsEngine;
  roomAmbience: RoomAmbienceEngine;

  // choreography
  attention: AttentionDirector;
  conversationArc: ConversationArcDirector;
  flowAnalyzer: ConversationFlowAnalyzer;
  heatmap: ConversationHeatmap;
  roomTheme: DynamicRoomThemeEngine;
  emotionContagion: EmotionContagionEngine;
  emotionTimeline: EmotionTimeline;
  gravity: GravityFormation;
  moodLighting: MoodLightingEngine;
  peakDetector: PeakMomentDetector;
  phaseState: PhaseStateMachine;
  roomMemory: RoomMemorySystem;
  silenceDirector: SilenceDirector;
  speechRhythm: SpeechRhythmAnalyzer;

  // cognitive
  eqVoice: EQVoiceEngine;
  persistentMemory: PersistentMemoryEngine;
  agenticRunner: AgenticShowRunner;
  cognitiveSpace: CognitiveSpaceEngine;
  regenerative: RegenerativeConversation;
  trustGraph: CognitiveTrustGraph;
  creatorEconomy2: CreatorEconomy2Engine;
  provenance: DigitalProvenanceSystem;
  privacyShield: AdaptivePrivacyShield;

  // connection
  comfortDistance: ComfortDistanceEngine;
  gradualBond: GradualBondEngine;
  safeHaven: SafeHavenAtmosphere;
  socialCue: SocialCueReader;
  gentleExit: GentleExitFlow;

  // show
  liveShow: LiveShowDirector;
  audience: AudienceDirector;
  highlightClip: HighlightClipEngine;
  gameShow: ConversationGameShow;
  collabStage: CollabStageSystem;
  momentReaction: MomentReaction;

  // game
  activities: SharedActivitiesManager;
  gameEngine: ConversationGameEngine;
  debateBattle: DebateBattle;

  // governance
  governance: RoomGovernance;
  reputation: ReputationFederation;
  membership: MembershipTier;
  milestone: CommunityMilestone;
  autoMod: AIAutoModerator;
  archive: ContentArchive;
  creatorDash: CreatorDashboard;

  // economy
  coins: CoinEconomy;
  gifts: VirtualGiftSystem;

  // safety
  conflictResolution: ConflictResolutionSystem;
  privacy: PrivacyGuard;
  autoModerator: AutoModerator;
  reportSystem: ReportSystem;
  safetyBoundary: SafetyBoundarySystem;

  // memory
  conversationMemory: ConversationMemoryAI;

  // performance
  scheduler: EngineScheduler;
  memoryPool: MemoryPoolManager;
  frameBudget: FrameBudgetController;
  inputLatency: InputLatencyOptimizer;
  networkPredictor: NetworkQualityPredictor;

  // rendering
  adaptiveRenderer: AdaptiveRenderer;
  lodManager: LodManager;

  // UI state
  ahaCelebration: { label: string; emoji: string; reward: number } | null;
  roomMood: ReturnType<EmotionPulseEngine['computeRoomMood']> | null;
  seasonalTheme: ReturnType<SeasonalContentEngine['getCurrentSeason']>;
  timeTheme: ReturnType<SeasonalContentEngine['getCurrentTimeTheme']>;
  groupRecommendation: ReturnType<GroupDynamicsManager['analyze']> | null;
  silentPrompt: ReturnType<GroupDynamicsManager['getSilentParticipantPrompt']>;
  visitInfo: { isNewDay: boolean; streak: number; reward: string } | null;
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------
export function useSpaceEngines(): SpaceEngines {
  const store = useCocoroStore;

  // ===== Instantiate all engines =====

  // social
  const groupDynamics = useMemo(() => new GroupDynamicsManager(), []);
  const ahaMoment = useMemo(() => new AhaMomentEngine(), []);
  const creatorToolkit = useMemo(() => new CreatorToolkit(), []);
  const habitLoop = useMemo(() => new HabitLoopEngine(), []);
  const antiChurn = useMemo(() => new AntiChurnSystem(), []);
  const trustScore = useMemo(() => new TrustScoreSystem(), []);
  const serendipity = useMemo(() => new SerendipityEngine(), []);
  const seasonal = useMemo(() => new SeasonalContentEngine(), []);
  const analytics = useMemo(() => new AnalyticsEngine(), []);
  const aiCompanion = useMemo(() => new AICompanion(), []);
  const smartJoin = useMemo(() => new SmartJoinEngine(), []);
  const guestMode = useMemo(() => new GuestMode(), []);
  const collectiveInsight = useMemo(() => new CollectiveInsightEngine(), []);
  const conversationLevel = useMemo(() => new ConversationLevelSystem(), []);
  const dailyChallenge = useMemo(() => new DailyChallengeSystem(), []);
  const eventScheduler = useMemo(() => new EventScheduler(), []);
  const favoriteRooms = useMemo(() => new FavoriteRoomsManager(), []);
  const socialGraph = useMemo(() => new SocialGraph(), []);
  const notification = useMemo(() => new NotificationEngine(), []);
  const smartNotification = useMemo(() => new SmartNotificationEngine(), []);
  const inviteLink = useMemo(() => new InviteLinkSystem(), []);

  // interaction
  const emotionPulse = useMemo(() => new EmotionPulseEngine(), []);
  const presenceAura = useMemo(() => new PresenceAuraSystem(), []);
  const avatarExpression = useMemo(() => new AvatarExpressionEngine(), []);
  const avatarPhysics = useMemo(() => new AvatarPhysicsEngine(), []);
  const autoComfort = useMemo(() => new AutoComfortEngine(), []);
  const adaptiveUI = useMemo(() => new AdaptiveUIEngine(), []);
  const topicEngine = useMemo(() => new ConversationTopicEngine(), []);
  const listenerEngagement = useMemo(() => new ListenerEngagementSystem(), []);
  const proximityInteraction = useMemo(() => new ProximityInteractionSystem(), []);
  const sessionAchievements = useMemo(() => new SessionAchievements(), []);
  const touchGesture = useMemo(() => new TouchGestureSystem(), []);
  const voiceGesture = useMemo(() => new VoiceGestureEngine(), []);
  const voiceIdentity = useMemo(() => new VoiceIdentityEngine(), []);
  const whisperMode = useMemo(() => new WhisperMode(), []);

  // audio
  const voiceEffects = useMemo(() => new VoiceEffectProcessor(), []);
  const soundDesign = useMemo(() => new SoundDesign(), []);
  const audioOptimizer = useMemo(() => new AudioOptimizer(), []);
  const audioRouter = useMemo(() => new AudioRouter(), []);
  const dynamicBGM = useMemo(() => new DynamicBGM(), []);
  const spatialAudio = useMemo(() => new SpatialAudioEngine(), []);
  const spatialMixer = useMemo(() => new SpatialAudioMixer(), []);
  const soundscapeGen = useMemo(() => new SpatialSoundscapeGenerator(), []);
  const voiceFFT = useMemo(() => new VoiceFFTAnalyzer(), []);
  const voiceSignatureEngine = useMemo(() => new VoiceSignatureEngine(), []);
  const voiceTone = useMemo(() => new VoiceToneAnalyzer(), []);
  const voiceEffectsEngine = useMemo(() => new VoiceEffectsEngine(), []);
  const roomAmbience = useMemo(() => new RoomAmbienceEngine(), []);

  // choreography
  const attention = useMemo(() => new AttentionDirector(), []);
  const conversationArc = useMemo(() => new ConversationArcDirector(), []);
  const flowAnalyzer = useMemo(() => new ConversationFlowAnalyzer(), []);
  const heatmap = useMemo(() => new ConversationHeatmap(), []);
  const roomTheme = useMemo(() => new DynamicRoomThemeEngine(), []);
  const emotionContagion = useMemo(() => new EmotionContagionEngine(), []);
  const emotionTimeline = useMemo(() => new EmotionTimeline(), []);
  const gravity = useMemo(() => new GravityFormation(), []);
  const moodLighting = useMemo(() => new MoodLightingEngine(), []);
  const peakDetector = useMemo(() => new PeakMomentDetector(), []);
  const phaseState = useMemo(() => new PhaseStateMachine(), []);
  const roomMemory = useMemo(() => new RoomMemorySystem(), []);
  const silenceDirector = useMemo(() => new SilenceDirector(), []);
  const speechRhythm = useMemo(() => new SpeechRhythmAnalyzer(), []);

  // cognitive
  const eqVoice = useMemo(() => new EQVoiceEngine(), []);
  const persistentMemory = useMemo(() => new PersistentMemoryEngine(), []);
  const agenticRunner = useMemo(() => new AgenticShowRunner(), []);
  const cognitiveSpace = useMemo(() => new CognitiveSpaceEngine(), []);
  const regenerative = useMemo(() => new RegenerativeConversation(), []);
  const trustGraph = useMemo(() => new CognitiveTrustGraph(), []);
  const creatorEconomy2 = useMemo(() => new CreatorEconomy2Engine(), []);
  const provenance = useMemo(() => new DigitalProvenanceSystem(), []);
  const privacyShield = useMemo(() => new AdaptivePrivacyShield(), []);

  // connection
  const comfortDistance = useMemo(() => new ComfortDistanceEngine(), []);
  const gradualBond = useMemo(() => new GradualBondEngine(), []);
  const safeHaven = useMemo(() => new SafeHavenAtmosphere(), []);
  const socialCue = useMemo(() => new SocialCueReader(), []);
  const gentleExit = useMemo(() => new GentleExitFlow(), []);

  // show
  const liveShow = useMemo(() => new LiveShowDirector(), []);
  const audience = useMemo(() => new AudienceDirector(), []);
  const highlightClip = useMemo(() => new HighlightClipEngine(), []);
  const gameShow = useMemo(() => new ConversationGameShow(), []);
  const collabStage = useMemo(() => new CollabStageSystem(), []);
  const momentReaction = useMemo(() => new MomentReaction(), []);

  // game
  const activities = useMemo(() => new SharedActivitiesManager(), []);
  const gameEngine = useMemo(() => new ConversationGameEngine(), []);
  const debateBattle = useMemo(() => new DebateBattle(), []);

  // governance
  const governance = useMemo(() => new RoomGovernance('system'), []);
  const reputation = useMemo(() => new ReputationFederation(), []);
  const membership = useMemo(() => new MembershipTier(), []);
  const milestone = useMemo(() => new CommunityMilestone(), []);
  const autoMod = useMemo(() => new AIAutoModerator(), []);
  const archive = useMemo(() => new ContentArchive(), []);
  const creatorDash = useMemo(() => new CreatorDashboard(), []);

  // economy
  const coins = useMemo(() => new CoinEconomy(), []);
  const gifts = useMemo(() => new VirtualGiftSystem(), []);

  // safety
  const conflictResolution = useMemo(() => new ConflictResolutionSystem(), []);
  const privacy = useMemo(() => new PrivacyGuard(), []);
  const autoModerator = useMemo(() => new AutoModerator(), []);
  const reportSystem = useMemo(() => new ReportSystem(), []);
  const safetyBoundary = useMemo(() => new SafetyBoundarySystem(), []);

  // memory
  const conversationMemory = useMemo(() => new ConversationMemoryAI(), []);

  // performance
  const scheduler = useMemo(() => new EngineScheduler(), []);
  const memoryPool = useMemo(() => new MemoryPoolManager(), []);
  const frameBudget = useMemo(() => new FrameBudgetController(), []);
  const inputLatency = useMemo(() => new InputLatencyOptimizer(), []);
  const networkPredictor = useMemo(() => new NetworkQualityPredictor(), []);

  // rendering
  const adaptiveRenderer = useMemo(() => new AdaptiveRenderer(), []);
  const lodManager = useMemo(() => new LodManager(), []);

  // ===== UI State =====
  const [ahaCelebration, setAhaCelebration] = useState<SpaceEngines['ahaCelebration']>(null);
  const [roomMood, setRoomMood] = useState<SpaceEngines['roomMood']>(null);
  const [groupRecommendation, setGroupRecommendation] = useState<SpaceEngines['groupRecommendation']>(null);
  const [silentPrompt, setSilentPrompt] = useState<SpaceEngines['silentPrompt']>(null);
  const [visitInfo, setVisitInfo] = useState<SpaceEngines['visitInfo']>(null);

  const seasonalTheme = useMemo(() => seasonal.getCurrentSeason(), [seasonal]);
  const timeTheme = useMemo(() => seasonal.getCurrentTimeTheme(), [seasonal]);

  // =========================================================================
  // Helper: safely call a method that may or may not exist on an engine
  // =========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = useCallback((engine: any, method: string, ...args: any[]) => {
    if (engine && typeof engine[method] === 'function') {
      try { return engine[method](...args); } catch { /* no-op */ }
    }
    return undefined;
  }, []);

  // =========================================================================
  // LOOP 0: Session Start/End (once)
  // =========================================================================
  useEffect(() => {
    const vInfo = habitLoop.recordVisit();
    setVisitInfo(vInfo);

    const localId = store.getState().localParticipantId;
    if (localId) {
      trustScore.modifyScore(localId, 'joinSession');
      reputation.recordAction(localId, 'system', 'welcomed_newbie');
      call(socialGraph, 'recordSharedSession', localId, false);
    }

    analytics.track('app_opened');
    analytics.track('room_joined');
    soundDesign.play('join');
    call(guestMode, 'checkGuestStatus');
    call(coins, 'getBalance');
    call(dailyChallenge, 'getTodayChallenge');
    call(eventScheduler, 'getScheduledEvents');
    call(smartNotification, 'getUnread');
    call(smartJoin, 'evaluateRooms');

    // Aha listener
    const unsub = ahaMoment.onAha((_type, label, reward) => {
      setAhaCelebration({ label, emoji: '✨', reward });
      soundDesign.play('levelup');
      setTimeout(() => setAhaCelebration(null), 3000);
    });

    return () => {
      unsub();
      if (localId) {
        trustScore.modifyScore(localId, 'completeSession');
        reputation.recordAction(localId, 'system', 'helpful_comment');
      }
      soundDesign.play('leave');
      analytics.track('room_left');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================================
  // LOOP 1: RAF — Performance / Rendering (every frame ~16ms)
  // =========================================================================
  useEffect(() => {
    let lastTime = performance.now();
    let rafId: number;

    scheduler.register('perf_monitor', 'critical', () => {
      call(audioOptimizer, 'adjustQuality');
    }, 16);

    scheduler.register('memory_check', 'idle', () => {
      memoryPool.checkMemoryPressure();
    }, 10000);

    scheduler.register('network_quality', 'medium', () => {
      call(networkPredictor, 'addSample', 0, 0);
    }, 1000);

    scheduler.register('input_perf', 'critical', () => {
      call(inputLatency, 'recordInteraction', 'tick', performance.now());
    }, 100);

    scheduler.register('avatar_step', 'medium', () => {
      const pList = store.getState().participants;
      pList.forEach((_p, id) => {
        call(avatarPhysics, 'applyBreathing', id, 16);
      });
    }, 16);

    scheduler.register('lod_step', 'medium', () => {
      const pList = store.getState().participants;
      call(lodManager, 'updateForParticipantCount', pList.size);
    }, 500);

    const tick = () => {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;
      frameBudget.beginFrame();
      adaptiveRenderer.onFrameComplete(dt);
      scheduler.tick();
      frameBudget.endFrame();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      scheduler.unregister('perf_monitor');
      scheduler.unregister('memory_check');
      scheduler.unregister('network_quality');
      scheduler.unregister('input_perf');
      scheduler.unregister('avatar_step');
      scheduler.unregister('lod_step');
    };
  }, [scheduler, frameBudget, adaptiveRenderer, audioOptimizer, memoryPool,
      networkPredictor, inputLatency, avatarPhysics, lodManager, store, call]);

  // =========================================================================
  // LOOP 2: 1-second — Fine-grained tracking
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const localId = store.getState().localParticipantId;
      const local = localId ? store.getState().participants.get(localId) : null;
      const isSpeaking = local?.speakingState.isSpeaking ?? false;

      ahaMoment.updateSessionTime(1, isSpeaking);
      if (isSpeaking) {
        ahaMoment.achieve('avatar_moved');
        call(conversationLevel, 'addXP', localId ?? '', 1);
        call(voiceGesture, 'detectFromVolume', local?.speakingState.volume ?? 0);
      }

      call(sessionAchievements, 'checkAll');

      const participants = store.getState().participants;
      participants.forEach((p, id) => {
        call(speechRhythm, 'recordSpeakingState', id, p.speakingState.isSpeaking, p.speakingState.volume);
        if (!p.speakingState.isSpeaking) {
          listenerEngagement.startListening();
        } else {
          listenerEngagement.stopListening();
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [store, ahaMoment, sessionAchievements, conversationLevel,
      voiceGesture, speechRhythm, listenerEngagement, call]);

  // =========================================================================
  // LOOP 3: 3-second — Social / Choreography / Interaction
  // =========================================================================
  useEffect(() => {
    agenticRunner.activate();

    const interval = setInterval(() => {
      const participants = store.getState().participants;
      let speakerCount = 0;
      let totalVolume = 0;
      let dominantEmotion = 'calmness';
      const speakerIds: string[] = [];
      const speakerDistribution = new Map<string, number>();

      participants.forEach((p, id) => {
        if (p.speakingState.isSpeaking) {
          speakerCount++;
          totalVolume += p.speakingState.volume;
          speakerIds.push(id);
        }
        speakerDistribution.set(id, p.speakingState.isSpeaking ? 3 : 0);

        const emotions = Object.entries(p.emotion).sort(([, a], [, b]) => (b as number) - (a as number));
        if (emotions.length > 0) dominantEmotion = emotions[0][0];

        // Choreography engines
        call(emotionContagion, 'spreadEmotion', id, p.emotion);
        call(attention, 'update', id, p.speakingState.isSpeaking, p.speakingState.volume);
        call(heatmap, 'record', id, p.speakingState.isSpeaking);
        call(flowAnalyzer, 'analyze', id, p.speakingState.isSpeaking);
        call(voiceTone, 'processVolume', id, p.speakingState.volume);
        call(topicEngine, 'trackSpeaker', id, p.speakingState.isSpeaking);

        if (p.speakingState.isSpeaking) {
          presenceAura.setState('speaking');
        } else if (Object.values(p.emotion).some((v: number) => v > 0.6)) {
          presenceAura.setState('reacting');
        }

        call(proximityInteraction, 'updatePeerPosition', id, { x: 0, y: 0, z: 0 });
        call(voiceIdentity, 'updateSpeaker', id, p.speakingState.volume);
        call(autoComfort, 'evaluateParticipant', id, p.speakingState.isSpeaking);

        socialCue.readCue(id, {
          volumeRMS: p.speakingState.volume,
          isSpeaking: p.speakingState.isSpeaking,
          silenceDurationSec: p.speakingState.isSpeaking ? 0 : 10,
          reactionCount: 0,
          sessionMinutes: Math.round(performance.now() / 60000),
        });

        call(safetyBoundary, 'evaluateVolume', id, p.speakingState.volume);
        call(autoModerator, 'evaluateParticipant', id, p.speakingState.volume);
      });

      const energyLevel = participants.size > 0 ? totalVolume / participants.size : 0;
      aiCompanion.updateParticipantCount(participants.size);

      call(phaseState, 'transition', speakerCount, participants.size, energyLevel);
      call(silenceDirector, 'evaluateSilence', speakerCount === 0 ? 3 : 0, participants.size);
      call(whisperMode, 'updateState', participants.size);

      adaptiveUI.update({
        flowLevel: energyLevel > 0.5 ? 'high' : 'low',
        isSpeaking: speakerCount > 0,
        participantCount: participants.size,
        activeSpeakerCount: speakerCount,
        sessionDurationSeconds: Math.round(performance.now() / 1000),
      });

      agenticRunner.think({
        speakerCount,
        totalParticipants: participants.size,
        silenceDurationSec: speakerCount === 0 ? 3 : 0,
        energyLevel,
        comboCount: 0,
        currentFormat: 'talk_show',
        activeGameType: null,
        dominantEmotion,
        minutesSinceStart: Math.round(performance.now() / 60000),
      });

      cognitiveSpace.update();
      const roomEq = eqVoice.getRoomEmotion();
      cognitiveSpace.applyEmotionLighting({
        joy: roomEq.joy,
        sadness: roomEq.sadness,
        excitement: roomEq.excitement,
        calmness: roomEq.calmness,
      });

      regenerative.detectIssues({
        currentTopic: 'general',
        energyLevel,
        speakerDistribution,
        dominantEmotion,
        engagementRate: participants.size > 0 ? speakerCount / participants.size : 0,
      });

      for (let i = 0; i < speakerIds.length; i++) {
        for (let j = i + 1; j < speakerIds.length; j++) {
          trustGraph.recordInteraction(speakerIds[i], speakerIds[j], 'conversation', 0.05);
          call(socialGraph, 'recordSharedSession', speakerIds[i], true);
        }
      }
      trustGraph.decayTrust(0.0001);

      call(conflictResolution, 'assessTension', energyLevel, participants.size);

      participants.forEach((p) => {
        const emotionMap: Record<string, 'excited' | 'happy' | 'calm' | 'curious' | 'bored' | 'tense'> = {
          joy: 'happy', anger: 'tense', sorrow: 'calm', surprise: 'excited', neutral: 'calm',
        };
        const dominant = Object.entries(p.emotion).sort(([, a], [, b]) => b - a)[0];
        if (dominant) {
          emotionPulse.addSample(p.id, emotionMap[dominant[0]] ?? 'calm', dominant[1] as number);
          call(emotionTimeline, 'addEntry', p.id, dominant[0], dominant[1]);
        }
      });
    }, 3000);

    return () => {
      agenticRunner.deactivate();
      clearInterval(interval);
    };
  }, [store, aiCompanion, emotionContagion, attention, heatmap, flowAnalyzer,
      voiceTone, topicEngine, presenceAura, proximityInteraction, voiceIdentity,
      autoComfort, socialCue, safetyBoundary, autoModerator, phaseState,
      silenceDirector, whisperMode, adaptiveUI, agenticRunner, cognitiveSpace,
      eqVoice, regenerative, trustGraph, socialGraph, conflictResolution,
      emotionPulse, emotionTimeline, call]);

  // =========================================================================
  // LOOP 4: 5-second — Group dynamics / Emotion / Show
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      groupDynamics.setParticipantCount(participants.size);

      participants.forEach((p, id) => {
        groupDynamics.updateParticipant(id, p.speakingState.isSpeaking, 5);
      });

      const rec = groupDynamics.analyze();
      setGroupRecommendation(rec);
      setSilentPrompt(groupDynamics.getSilentParticipantPrompt());

      const mood = emotionPulse.computeRoomMood();
      setRoomMood(mood);

      if (mood) {
        call(moodLighting, 'applyMood', mood.dominant, mood.intensity);
      }

      call(gravity, 'calculateFormation', Array.from(participants.keys()));

      const speakerCount = Array.from(participants.values()).filter(p => p.speakingState.isSpeaking).length;
      call(conversationArc, 'analyze', speakerCount, participants.size);
      call(peakDetector, 'detect', speakerCount, mood?.intensity ?? 0, participants.size);
      call(roomTheme, 'applyTheme', mood?.dominant ?? 'calm', participants.size);
      call(liveShow, 'updateState', participants.size, speakerCount);
      call(audience, 'updateEngagement', participants.size - speakerCount);
      call(dynamicBGM, 'updateMood', mood?.dominant ?? 'calm', mood?.intensity ?? 0.3);
      call(collectiveInsight, 'analyze', Array.from(participants.keys()));

      participants.forEach((p, id) => {
        call(spatialAudio, 'updatePeerPosition', id, { x: 0, y: 0, z: 0 });
        spatialMixer.setVolume(id, p.speakingState.volume);
      });

      call(audioRouter, 'updateActiveCount', participants.size);
    }, 5000);

    return () => clearInterval(interval);
  }, [store, groupDynamics, emotionPulse, moodLighting, gravity,
      conversationArc, peakDetector, roomTheme, liveShow, audience,
      dynamicBGM, collectiveInsight, spatialAudio,
      spatialMixer, audioRouter, soundDesign, call]);

  // =========================================================================
  // LOOP 5: 10-second — Show / Game / Economy / Governance
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      const localId = store.getState().localParticipantId;
      const speakerCount = Array.from(participants.values()).filter(p => p.speakingState.isSpeaking).length;

      call(gameShow, 'updateState', participants.size);
      call(gameEngine, 'updateState', participants.size);
      if (participants.size >= 2) call(debateBattle, 'updateState', participants.size);
      call(collabStage, 'updateParticipants', participants.size, Array.from(participants.keys()));
      call(activities, 'updateState', participants.size);

      call(governance, 'enforceRules', participants.size);
      call(autoMod, 'evaluate', participants.size);
      if (localId) call(membership, 'updateActivity', localId);
      call(milestone, 'trackProgress', participants.size);
      call(creatorToolkit, 'recordMetrics', { participantCount: participants.size, speakerCount, duration: Math.round(performance.now() / 60000) });
      call(creatorDash, 'updateStats', { participants: participants.size, engagement: speakerCount / Math.max(1, participants.size) });
      call(creatorEconomy2, 'processTransactions');
      call(provenance, 'recordEvent', 'session_tick');
      call(roomMemory, 'recordSnapshot', { participantCount: participants.size, timestamp: Date.now() });
      call(soundscapeGen, 'generate', participants.size);
      call(voiceEffects, 'getActiveEffects');
      call(voiceEffectsEngine, 'processQueue');
    }, 10000);

    return () => clearInterval(interval);
  }, [store, gameShow, gameEngine, debateBattle, collabStage, activities,
      governance, autoMod, membership, milestone, creatorToolkit, creatorDash,
      creatorEconomy2, provenance, roomMemory, soundscapeGen, voiceEffects,
      voiceEffectsEngine, call]);

  // =========================================================================
  // LOOP 6: 30-second — Anti-churn / Analytics / Serendipity
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      const localId = store.getState().localParticipantId;
      const speakerCount = Array.from(participants.values()).filter(p => p.speakingState.isSpeaking).length;

      call(antiChurn, 'evaluateRisk', { sessionDuration: Math.round(performance.now() / 60000), participantCount: participants.size, speakerCount });
      call(serendipity, 'suggest', Array.from(participants.keys()));

      analytics.track('heartbeat', {
        participants: participants.size,
        duration: Math.round(performance.now() / 60000),
      });

      call(privacy, 'audit');
      if (localId) call(favoriteRooms, 'recordVisit', localId);
      call(roomAmbience, 'adjustAmbience', participants.size);
      call(voiceFFT, 'processBuffer');
      if (localId) call(voiceSignatureEngine, 'processSignature', localId);
    }, 30000);

    return () => clearInterval(interval);
  }, [store, antiChurn, serendipity, analytics, privacy, favoriteRooms,
      roomAmbience, voiceFFT, voiceSignatureEngine, call]);

  // =========================================================================
  // LOOP 7: 60-second — Persistence / Memory / Cleanup
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const participants = store.getState().participants;
      const localId = store.getState().localParticipantId;
      if (!localId) return;

      participants.forEach((p, id) => {
        if (id !== localId) {
          gradualBond.recordSharedTime(id, 1, p.displayName);
        }
      });

      participants.forEach((_, id) => {
        if (id !== localId) {
          const bond = gradualBond.getBond(id);
          if (bond) {
            const levels = ['first_meeting', 'recognized', 'talk_buddy', 'kindred_spirit', 'comfortable'];
            const level = levels.indexOf(bond.stage) / (levels.length - 1);
            comfortDistance.updateRelationship(localId, id, level);
          }
        }
      });

      privacyShield.enforceRetention();
      call(conversationMemory, 'processMemory');
      call(archive, 'archiveOldContent');
      call(inviteLink, 'pruneExpiredLinks');
      call(reportSystem, 'processReports');
    }, 60000);

    return () => clearInterval(interval);
  }, [store, gradualBond, comfortDistance, privacyShield, conversationMemory,
      archive, inviteLink, reportSystem, call]);

  // =========================================================================
  // LOOP 8: SafeHaven participant join/leave (3s)
  // =========================================================================
  useEffect(() => {
    let prevIds = new Set<string>();

    const interval = setInterval(() => {
      const participants = store.getState().participants;
      const currentIds = new Set(participants.keys());

      currentIds.forEach(id => {
        if (!prevIds.has(id)) {
          const p = participants.get(id);
          safeHaven.onParticipantJoin(id, p?.displayName);
          gradualBond.checkReunion(id);
          call(notification, 'notify', 'join', id);
        }
      });

      prevIds.forEach(id => {
        if (!currentIds.has(id)) {
          call(safeHaven, 'onParticipantLeave', id);
        }
      });

      prevIds = currentIds;
    }, 3000);

    return () => clearInterval(interval);
  }, [store, safeHaven, gradualBond, notification, call]);

  // =========================================================================
  // LOOP 9: Session end — persistent memory
  // =========================================================================
  useEffect(() => {
    const sessionStart = Date.now();
    return () => {
      const participants = store.getState().participants;
      const pIds = Array.from(participants.keys());
      persistentMemory.recordConversation({
        sessionId: `session_${sessionStart}`,
        timestamp: sessionStart,
        duration: Math.round((Date.now() - sessionStart) / 60000),
        participantIds: pIds,
        highlights: [],
        dominantTopics: [],
        peakEmotion: emotionPulse.computeRoomMood()?.dominant ?? 'neutral',
        qualityScore: regenerative.getHealthScore(),
      });
    };
  }, [store, persistentMemory, emotionPulse, regenerative]);

  // =========================================================================
  // Touch gesture initialization (mobile)
  // =========================================================================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('space-canvas');
      if (el) call(touchGesture, 'attach', el);
    }
  }, [touchGesture, call]);

  // =========================================================================
  // Return all 113 engines + UI state
  // =========================================================================
  return {
    // social (21)
    groupDynamics, ahaMoment, creatorToolkit, habitLoop, antiChurn,
    trustScore, serendipity, seasonal, analytics, aiCompanion, smartJoin,
    guestMode, collectiveInsight, conversationLevel, dailyChallenge,
    eventScheduler, favoriteRooms, socialGraph, notification,
    smartNotification, inviteLink,

    // interaction (14)
    emotionPulse, presenceAura, avatarExpression, avatarPhysics,
    autoComfort, adaptiveUI, topicEngine, listenerEngagement,
    proximityInteraction, sessionAchievements, touchGesture,
    voiceGesture, voiceIdentity, whisperMode,

    // audio (13)
    voiceEffects, soundDesign, audioOptimizer, audioRouter, dynamicBGM,
    spatialAudio, spatialMixer, soundscapeGen, voiceFFT,
    voiceSignatureEngine, voiceTone, voiceEffectsEngine, roomAmbience,

    // choreography (14)
    attention, conversationArc, flowAnalyzer, heatmap, roomTheme,
    emotionContagion, emotionTimeline, gravity, moodLighting,
    peakDetector, phaseState, roomMemory, silenceDirector, speechRhythm,

    // cognitive (9)
    eqVoice, persistentMemory, agenticRunner, cognitiveSpace,
    regenerative, trustGraph, creatorEconomy2, provenance, privacyShield,

    // connection (5)
    comfortDistance, gradualBond, safeHaven, socialCue, gentleExit,

    // show (6)
    liveShow, audience, highlightClip, gameShow, collabStage, momentReaction,

    // game (3)
    activities, gameEngine, debateBattle,

    // governance (7)
    governance, reputation, membership, milestone, autoMod, archive, creatorDash,

    // economy (2)
    coins, gifts,

    // safety (5)
    conflictResolution, privacy, autoModerator, reportSystem, safetyBoundary,

    // memory (1)
    conversationMemory,

    // performance (5)
    scheduler, memoryPool, frameBudget, inputLatency, networkPredictor,

    // rendering (2)
    adaptiveRenderer, lodManager,

    // UI state
    ahaCelebration, roomMood, seasonalTheme, timeTheme,
    groupRecommendation, silentPrompt, visitInfo,
  };
}
