'use client';
/**
 * kokoro — useEngineConnector
 * 全113エンジンの出力をZustand storeとUIに接続するブリッジフック
 *
 * エンジンAPIはクラスごとに異なるため、ダイナミック呼び出し (as any) で
 * 安全に各メソッドを呼ぶ。存在しないメソッドは try-catch で黙殺。
 */

import { useEffect, useRef, useCallback } from 'react';
import { useKokoroStore } from '@/store/useKokoroStore';
import type { SpaceEngines } from './useSpaceEngines';

export interface EngineStatus {
  // Choreography
  flowScore: number;
  flowLevel: string;
  conversationArc: string;
  silenceDuration: number;

  // Emotion
  dominantEmotion: string;
  emotionIntensity: number;
  roomMoodLabel: string;

  // Social
  trustLevel: number;
  bondLevel: number;
  groupEnergy: number;
  activeParticipantRatio: number;

  // Audio
  bgmGenre: string;
  voiceEffectActive: string;

  // Game/Show
  activeGame: string | null;
  showState: string;
  debateActive: boolean;

  // Economy/Governance
  coinBalance: number;
  memberTier: string;
  reputationScore: number;

  // Performance
  fps: number;
  memoryUsageMB: number;
  networkQuality: string;

  // Safety
  safetyLevel: string;
  moderationActive: boolean;

  // Cognitive
  eqScore: number;
  cognitiveLoad: number;
}

const DEFAULT_STATUS: EngineStatus = {
  flowScore: 0,
  flowLevel: 'idle',
  conversationArc: 'opening',
  silenceDuration: 0,
  dominantEmotion: 'neutral',
  emotionIntensity: 0,
  roomMoodLabel: '静寂',
  trustLevel: 0,
  bondLevel: 0,
  groupEnergy: 0,
  activeParticipantRatio: 0,
  bgmGenre: 'ambient',
  voiceEffectActive: 'none',
  activeGame: null,
  showState: 'idle',
  debateActive: false,
  coinBalance: 0,
  memberTier: 'free',
  reputationScore: 0,
  fps: 60,
  memoryUsageMB: 0,
  networkQuality: 'good',
  safetyLevel: 'green',
  moderationActive: false,
  eqScore: 0,
  cognitiveLoad: 0,
};

// Safe dynamic method call helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeCall(engine: any, method: string, ...args: unknown[]): any {
  try {
    if (engine && typeof engine[method] === 'function') {
      return engine[method](...args);
    }
  } catch { /* silently ignore */ }
  return undefined;
}

// Safe dynamic property read
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeProp(engine: any, prop: string): any {
  try {
    if (engine && engine[prop] !== undefined) {
      return engine[prop];
    }
  } catch { /* silently ignore */ }
  return undefined;
}

/**
 * エンジン出力をUI向けステータスに集約 + Zustand storeに書き込み。
 * 3秒間隔でポーリング。
 */
export function useEngineConnector(engines: SpaceEngines): EngineStatus {
  const statusRef = useRef<EngineStatus>({ ...DEFAULT_STATUS });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = useKokoroStore as any;

  const collectStatus = useCallback(() => {
    const s = store.getState();
    const participants = s.participants as Map<string, { speakingState: { isSpeaking: boolean; volume: number } }>; // eslint-disable-line
    const speakingCount = Array.from(participants.values()).filter(p => p.speakingState.isSpeaking).length;
    const participantCount = participants.size;

    // ─── Choreography (14 engines) ───
    // flowAnalyzer
    const flowState = safeCall(engines.flowAnalyzer, 'getState') ?? safeCall(engines.flowAnalyzer, 'analyze');
    if (flowState) {
      statusRef.current.flowScore = flowState.score ?? flowState.flowScore ?? 0;
      statusRef.current.flowLevel = flowState.level ?? flowState.flowLevel ?? 'idle';
    }

    // conversationArc
    const arc = safeCall(engines.conversationArc, 'getCurrentArc') ?? safeCall(engines.conversationArc, 'getArc') ?? safeProp(engines.conversationArc, 'currentArc');
    if (arc) statusRef.current.conversationArc = typeof arc === 'string' ? arc : arc.phase ?? 'opening';

    // heatmap
    // heatmap → safeCall only (no UI binding needed)
    safeCall(engines.heatmap, 'getData') ?? safeCall(engines.heatmap, 'getHeatmap');

    // silenceDirector
    const silence = safeCall(engines.silenceDirector, 'getSilenceDuration') ?? safeCall(engines.silenceDirector, 'getDuration') ?? safeProp(engines.silenceDirector, 'duration');
    if (typeof silence === 'number') statusRef.current.silenceDuration = silence;

    // speechRhythm
    // speechRhythm → tick/analyze
    safeCall(engines.speechRhythm, 'getState') ?? safeCall(engines.speechRhythm, 'analyze');

    // attention → store
    const focus = safeCall(engines.attention, 'getFocusTarget') ?? safeCall(engines.attention, 'getTarget');
    if (focus !== undefined) store.setState({ attentionTarget: focus });

    // gravity → store
    const gravityState = safeCall(engines.gravity, 'getState') ?? safeCall(engines.gravity, 'getDensity');
    if (gravityState) {
      const density = typeof gravityState === 'number' ? gravityState : gravityState.density;
      if (typeof density === 'number') store.setState({ density });
    }

    // moodLighting → store
    const lighting = safeCall(engines.moodLighting, 'getColors') ?? safeCall(engines.moodLighting, 'getState');
    if (lighting) store.setState({ moodColors: lighting });

    // roomTheme → store
    const theme = safeCall(engines.roomTheme, 'getCurrentTheme') ?? safeCall(engines.roomTheme, 'getTheme');
    if (theme) store.setState({ roomTheme: theme });

    // phaseState → store
    const phase = safeCall(engines.phaseState, 'getCurrentPhase') ?? safeCall(engines.phaseState, 'getPhase') ?? safeProp(engines.phaseState, 'currentPhase');
    if (phase !== undefined) store.setState({ phase });

    // emotionContagion
    // emotionContagion → tick
    safeCall(engines.emotionContagion, 'getContagionLevel') ?? safeCall(engines.emotionContagion, 'getLevel') ?? safeProp(engines.emotionContagion, 'level');

    // emotionTimeline → store
    const timeline = safeCall(engines.emotionTimeline, 'getTimeline') ?? safeCall(engines.emotionTimeline, 'getData');
    if (timeline) store.setState({ emotionTimeline: timeline });

    // roomMemory → store
    const rmData = safeCall(engines.roomMemory, 'getData') ?? safeCall(engines.roomMemory, 'getMemory');
    if (rmData) store.setState({ roomMemoryData: rmData });

    // peakDetector → store
    const peaks = safeCall(engines.peakDetector, 'getAllMoments') ?? safeCall(engines.peakDetector, 'getMoments') ?? safeCall(engines.peakDetector, 'getAll');
    if (peaks) store.setState({ peakMoments: peaks });

    // ─── Emotion (via emotionPulse) ───
    const mood = safeCall(engines.emotionPulse, 'computeRoomMood', Array.from(participants.values()))
      ?? safeCall(engines.emotionPulse, 'computeRoomMood');
    if (mood) {
      statusRef.current.dominantEmotion = mood.dominant ?? mood.emotion ?? 'neutral';
      statusRef.current.emotionIntensity = mood.intensity ?? 0;
      statusRef.current.roomMoodLabel = mood.label ?? mood.name ?? '静寂';
    }

    // ─── Interaction (14 engines) ───
    // presenceAura → store
    const presenceState = safeCall(engines.presenceAura, 'getState');
    if (presenceState) store.setState({ presenceAuraState: presenceState });

    // avatarExpression → store
    const expr = safeCall(engines.avatarExpression, 'getExpressions') ?? safeCall(engines.avatarExpression, 'getState');
    if (expr) store.setState({ localExpression: expr });

    // avatarPhysics → store
    const physState = safeCall(engines.avatarPhysics, 'getState');
    if (physState) store.setState({ avatarPhysicsState: physState });

    // autoComfort → store
    const comfortActive = safeCall(engines.autoComfort, 'isActive') ?? safeProp(engines.autoComfort, 'active');
    store.setState({ autoComfortActive: !!comfortActive });

    // adaptiveUI → store
    const uiState = safeCall(engines.adaptiveUI, 'getState');
    if (uiState) store.setState({ adaptiveUIState: uiState });

    // proximityInteraction → store
    const proxState = safeCall(engines.proximityInteraction, 'getState');
    if (proxState) store.setState({ proximityState: proxState });

    // sessionAchievements → store
    const achievements = safeCall(engines.sessionAchievements, 'getAll') ?? safeCall(engines.sessionAchievements, 'getAchievements');
    if (achievements) store.setState({ sessionAchievements: achievements });

    // touchGesture → store
    const tgActive = safeCall(engines.touchGesture, 'isActive') ?? safeProp(engines.touchGesture, 'active');
    store.setState({ touchGestureActive: !!tgActive });

    // voiceGesture → store
    const gesture = safeCall(engines.voiceGesture, 'getLastGesture') ?? safeCall(engines.voiceGesture, 'getGesture');
    if (gesture) store.setState({ lastVoiceGesture: gesture });

    // voiceIdentity → store
    const identity = safeCall(engines.voiceIdentity, 'getIdentity') ?? safeCall(engines.voiceIdentity, 'getState');
    if (identity) store.setState({ voiceIdentity: identity });

    // whisperMode → store
    const wmActive = safeCall(engines.whisperMode, 'isActive') ?? safeProp(engines.whisperMode, 'active');
    store.setState({ whisperModeActive: !!wmActive });

    // ─── Social (19 engines) ───
    // trustScore
    const trust = safeCall(engines.trustScore, 'getScore') ?? safeCall(engines.trustScore, 'getGlobalScore') ?? safeProp(engines.trustScore, 'score');
    if (typeof trust === 'number') statusRef.current.trustLevel = trust;

    // gradualBond
    const bond = safeCall(engines.gradualBond, 'getLevel') ?? safeCall(engines.gradualBond, 'getBondLevel') ?? safeProp(engines.gradualBond, 'level');
    if (typeof bond === 'number') statusRef.current.bondLevel = bond;

    // groupDynamics
    const gd = safeCall(engines.groupDynamics, 'analyze', Array.from(participants.values()))
      ?? safeCall(engines.groupDynamics, 'analyze');
    if (gd) statusRef.current.groupEnergy = gd.energy ?? gd.groupEnergy ?? 0;

    // activeParticipantRatio
    statusRef.current.activeParticipantRatio = participantCount > 0 ? speakingCount / participantCount : 0;

    // antiChurn
    // antiChurn → tick
    safeCall(engines.antiChurn, 'getRiskLevel') ?? safeCall(engines.antiChurn, 'getRisk') ?? safeProp(engines.antiChurn, 'riskLevel');

    // socialGraph → store (already connected)

    // notification → store
    const notifs = safeCall(engines.notification, 'getPending') ?? safeCall(engines.notification, 'getAll');
    if (notifs) store.setState({ pendingNotifications: notifs });

    // smartNotification → store
    const smartNotifs = safeCall(engines.smartNotification, 'getPending') ?? safeCall(engines.smartNotification, 'getAll');
    if (smartNotifs) store.setState({ smartNotifications: smartNotifs });

    // inviteLink → store
    const link = safeCall(engines.inviteLink, 'getActiveLink') ?? safeCall(engines.inviteLink, 'getLink');
    if (link) store.setState({ activeInviteLink: link });

    // serendipity → store
    const matches = safeCall(engines.serendipity, 'getMatches') ?? safeCall(engines.serendipity, 'getSuggestions');
    if (matches) store.setState({ serendipityMatches: matches });

    // habitLoop → store
    const streak = safeCall(engines.habitLoop, 'getStreak') ?? safeProp(engines.habitLoop, 'streak');
    if (typeof streak === 'number') store.setState({ habitStreak: streak });

    // dailyChallenge → store
    const dcProgress = safeCall(engines.dailyChallenge, 'getProgress') ?? safeCall(engines.dailyChallenge, 'getState');
    if (dcProgress) store.setState({ dailyChallengeProgress: dcProgress });

    // eventScheduler → store
    const events = safeCall(engines.eventScheduler, 'getUpcoming') ?? safeCall(engines.eventScheduler, 'getEvents');
    if (events) store.setState({ upcomingEvents: events });

    // favoriteRooms → store
    const favs = safeCall(engines.favoriteRooms, 'getFavorites') ?? safeCall(engines.favoriteRooms, 'getAll');
    if (favs) store.setState({ favoriteRoomIds: favs });

    // conversationLevel → store
    const xp = safeCall(engines.conversationLevel, 'getXP') ?? safeCall(engines.conversationLevel, 'getLevel') ?? safeProp(engines.conversationLevel, 'xp');
    if (typeof xp === 'number') store.setState({ conversationXP: xp });

    // collectiveInsight → store
    const insight = safeCall(engines.collectiveInsight, 'getInsight') ?? safeCall(engines.collectiveInsight, 'getState');
    if (insight) store.setState({ collectiveInsight: insight });

    // aiCompanion → store
    const compMsg = safeCall(engines.aiCompanion, 'getMessage') ?? safeCall(engines.aiCompanion, 'getResponse');
    if (compMsg) store.setState({ companionMessage: compMsg });

    // smartJoin → store
    const sjSuggestion = safeCall(engines.smartJoin, 'getSuggestion') ?? safeCall(engines.smartJoin, 'getRecommendation');
    if (sjSuggestion) store.setState({ smartJoinSuggestion: sjSuggestion });

    // guestMode → store
    const guestRestrictions = safeCall(engines.guestMode, 'getRestrictions') ?? safeCall(engines.guestMode, 'getState');
    if (guestRestrictions) store.setState({ guestRestrictions: guestRestrictions });

    // creatorToolkit → store
    const tools = safeCall(engines.creatorToolkit, 'getTools') ?? safeCall(engines.creatorToolkit, 'getState');
    if (tools) store.setState({ creatorTools: tools });

    // ─── Audio (13 engines) ───
    // dynamicBGM
    const bgm = safeCall(engines.dynamicBGM, 'getCurrentGenre') ?? safeCall(engines.dynamicBGM, 'getGenre') ?? safeProp(engines.dynamicBGM, 'genre');
    if (typeof bgm === 'string') statusRef.current.bgmGenre = bgm;

    // voiceEffects
    const effect = safeCall(engines.voiceEffects, 'getActiveEffect') ?? safeCall(engines.voiceEffects, 'getState');
    if (typeof effect === 'string') statusRef.current.voiceEffectActive = effect;

    // voiceFFT → store
    const fftData = safeCall(engines.voiceFFT, 'getFrequencyData') ?? safeCall(engines.voiceFFT, 'getData');
    if (fftData) store.setState({ voiceFFTData: fftData });

    // voiceTone → store
    const tone = safeCall(engines.voiceTone, 'getTone') ?? safeCall(engines.voiceTone, 'analyze');
    if (tone) store.setState({ voiceTone: tone });

    // soundDesign → store
    const soundTheme = safeCall(engines.soundDesign, 'getCurrentTheme') ?? safeCall(engines.soundDesign, 'getTheme');
    if (soundTheme) store.setState({ soundTheme: typeof soundTheme === 'string' ? soundTheme : 'default' });

    // roomAmbience → store
    const ambience = safeCall(engines.roomAmbience, 'getLevel') ?? safeCall(engines.roomAmbience, 'getState');
    if (typeof ambience === 'number') store.setState({ ambienceLevel: ambience });

    // spatialMixer → store
    const mixerState = safeCall(engines.spatialMixer, 'getState');
    if (mixerState) store.setState({ spatialMixerState: mixerState });

    // soundscapeGen → store
    const scActive = safeCall(engines.soundscapeGen, 'isActive') ?? safeProp(engines.soundscapeGen, 'active');
    store.setState({ soundscapeActive: !!scActive });

    // audioOptimizer → store
    const aq = safeCall(engines.audioOptimizer, 'getQuality') ?? safeCall(engines.audioOptimizer, 'getState');
    if (aq) store.setState({ audioQuality: typeof aq === 'string' ? aq : 'high' });

    // audioRouter → store
    const route = safeCall(engines.audioRouter, 'getRoute') ?? safeCall(engines.audioRouter, 'getState');
    if (route) store.setState({ audioRoute: typeof route === 'string' ? route : 'default' });

    // voiceSignatureEngine (already connected in space/page.tsx)
    // voiceEffectsEngine → store
    const veState = safeCall(engines.voiceEffectsEngine, 'getState');
    if (veState) store.setState({ voiceEffectsState: veState });

    // spatialAudio → store
    const saState = safeCall(engines.spatialAudio, 'getState');
    if (saState) store.setState({ spatialAudioState: saState });

    // ─── Cognitive (9 engines) ───
    // eqVoice
    const eq = safeCall(engines.eqVoice, 'getScore') ?? safeCall(engines.eqVoice, 'getEQScore') ?? safeProp(engines.eqVoice, 'score');
    if (typeof eq === 'number') statusRef.current.eqScore = eq;

    // persistentMemory → store
    const pmCount = safeCall(engines.persistentMemory, 'getCount') ?? safeProp(engines.persistentMemory, 'count');
    if (typeof pmCount === 'number') store.setState({ memoryCount: pmCount });

    // agenticRunner → store
    const agState = safeCall(engines.agenticRunner, 'getState');
    if (agState) store.setState({ agenticState: agState });

    // cognitiveSpace
    const cogLoad = safeCall(engines.cognitiveSpace, 'getLoad') ?? safeCall(engines.cognitiveSpace, 'getState');
    if (typeof cogLoad === 'number') statusRef.current.cognitiveLoad = cogLoad;

    // regenerative → store
    const regScore = safeCall(engines.regenerative, 'getScore') ?? safeCall(engines.regenerative, 'getState');
    if (typeof regScore === 'number') store.setState({ regenerativeScore: regScore });

    // trustGraph → store
    const tgData = safeCall(engines.trustGraph, 'getGraph') ?? safeCall(engines.trustGraph, 'getState');
    if (tgData) store.setState({ trustGraphData: tgData });

    // creatorEconomy2 → store
    const revenue = safeCall(engines.creatorEconomy2, 'getRevenue') ?? safeCall(engines.creatorEconomy2, 'getState');
    if (typeof revenue === 'number') store.setState({ creatorRevenue: revenue });

    // provenance → store
    const provActive = safeCall(engines.provenance, 'isActive') ?? safeProp(engines.provenance, 'active');
    store.setState({ provenanceActive: !!provActive });

    // privacyShield → store
    const privLevel = safeCall(engines.privacyShield, 'getLevel') ?? safeCall(engines.privacyShield, 'getState');
    if (privLevel) store.setState({ privacyLevel: typeof privLevel === 'string' ? privLevel : 'standard' });

    // ─── Connection (5 engines) ───
    // comfortDistance → store
    const comfort = safeCall(engines.comfortDistance, 'getComfortRadius') ?? safeCall(engines.comfortDistance, 'getRadius');
    if (typeof comfort === 'number') store.setState({ comfortRadius: comfort });

    // gradualBond (already in Social)
    // safeHaven (already connected)
    // socialCue → store
    const cues = safeCall(engines.socialCue, 'getCues') ?? safeCall(engines.socialCue, 'getState');
    if (cues) store.setState({ socialCues: cues });

    // gentleExit (already connected)

    // ─── Show (6 engines) ───
    // liveShow → store
    const lsState = safeCall(engines.liveShow, 'getState');
    if (lsState) {
      store.setState({ liveShowState: lsState });
      statusRef.current.showState = lsState.phase ?? lsState.state ?? 'idle';
    }

    // audience → store
    const audSize = safeCall(engines.audience, 'getSize') ?? safeCall(engines.audience, 'getCount') ?? safeProp(engines.audience, 'size');
    if (typeof audSize === 'number') store.setState({ audienceSize: audSize });

    // highlightClip → store
    const clips = safeCall(engines.highlightClip, 'getClips') ?? safeCall(engines.highlightClip, 'getAll');
    if (clips) store.setState({ highlightClips: clips });

    // gameShow → store
    const gsState = safeCall(engines.gameShow, 'getState');
    if (gsState) store.setState({ gameShowState: gsState });

    // collabStage → store
    const csActive = safeCall(engines.collabStage, 'isActive') ?? safeProp(engines.collabStage, 'active');
    store.setState({ collabStageActive: !!csActive });

    // momentReaction → store
    const reaction = safeCall(engines.momentReaction, 'getLastReaction') ?? safeCall(engines.momentReaction, 'getLast');
    if (reaction) store.setState({ lastMomentReaction: reaction });

    // ─── Game (3 engines) ───
    // gameEngine
    const geState = safeCall(engines.gameEngine, 'getState');
    if (geState) statusRef.current.activeGame = geState.currentGame ?? geState.gameName ?? null;

    // debateBattle
    const dbActive = safeCall(engines.debateBattle, 'isActive') ?? safeProp(engines.debateBattle, 'active');
    statusRef.current.debateActive = !!dbActive;

    // activities → store
    const activities = safeCall(engines.activities, 'getActive') ?? safeCall(engines.activities, 'getAll');
    if (activities) store.setState({ activeActivities: activities });

    // ─── Governance (7 engines) ───
    // governance → store
    const rules = safeCall(engines.governance, 'getRules') ?? safeCall(engines.governance, 'getState');
    if (rules) store.setState({ governanceRules: rules });

    // reputation
    const rep = safeCall(engines.reputation, 'getScore') ?? safeCall(engines.reputation, 'getReputation') ?? safeProp(engines.reputation, 'score');
    if (typeof rep === 'number') statusRef.current.reputationScore = rep;

    // membership
    const tier = safeCall(engines.membership, 'getTier') ?? safeCall(engines.membership, 'getLevel') ?? safeProp(engines.membership, 'tier');
    if (typeof tier === 'string') statusRef.current.memberTier = tier;

    // milestone → store
    const msProgress = safeCall(engines.milestone, 'getProgress') ?? safeCall(engines.milestone, 'getState');
    if (msProgress) store.setState({ milestoneProgress: typeof msProgress === 'number' ? msProgress : 0 });

    // autoMod → store
    const amActions = safeCall(engines.autoMod, 'getRecentActions') ?? safeCall(engines.autoMod, 'getActions');
    if (amActions) store.setState({ autoModActions: amActions });

    // archive → store
    const archCount = safeCall(engines.archive, 'getCount') ?? safeProp(engines.archive, 'count');
    if (typeof archCount === 'number') store.setState({ archiveCount: archCount });

    // creatorDash → store
    const dashData = safeCall(engines.creatorDash, 'getData') ?? safeCall(engines.creatorDash, 'getState');
    if (dashData) store.setState({ creatorDashData: dashData });

    // ─── Economy (2 engines) ───
    // coins
    const balance = safeCall(engines.coins, 'getBalance') ?? safeProp(engines.coins, 'balance');
    if (typeof balance === 'number') statusRef.current.coinBalance = balance;

    // gifts → store
    const giftHist = safeCall(engines.gifts, 'getHistory') ?? safeCall(engines.gifts, 'getAll');
    if (giftHist) store.setState({ giftHistory: giftHist });

    // ─── Safety (5 engines) ───
    // conflictResolution → store
    const crActive = safeCall(engines.conflictResolution, 'isActive') ?? safeProp(engines.conflictResolution, 'active');
    store.setState({ conflictActive: !!crActive });

    // privacy → store
    const pgActive = safeCall(engines.privacy, 'isActive') ?? safeProp(engines.privacy, 'active');
    store.setState({ privacyGuardActive: !!pgActive });

    // autoModerator
    const amActive = safeCall(engines.autoModerator, 'isActive') ?? safeProp(engines.autoModerator, 'active');
    statusRef.current.moderationActive = !!amActive;

    // reportSystem (already connected)
    // safetyBoundary
    const safeLevel = safeCall(engines.safetyBoundary, 'getLevel') ?? safeCall(engines.safetyBoundary, 'getState') ?? safeProp(engines.safetyBoundary, 'level');
    if (typeof safeLevel === 'string') statusRef.current.safetyLevel = safeLevel;

    // ─── Memory (1 engine) ───
    const summary = safeCall(engines.conversationMemory, 'getSummary') ?? safeCall(engines.conversationMemory, 'getState');
    if (summary) store.setState({ conversationSummary: summary });

    // ─── Performance (5 engines) ───
    // frameBudget
    const fps = safeCall(engines.frameBudget, 'getFps') ?? safeCall(engines.frameBudget, 'getState');
    if (typeof fps === 'number') statusRef.current.fps = fps;

    // memoryPool
    const memUsage = safeCall(engines.memoryPool, 'getUsageMB') ?? safeCall(engines.memoryPool, 'getUsage');
    if (typeof memUsage === 'number') statusRef.current.memoryUsageMB = memUsage;

    // networkPredictor
    const netQ = safeCall(engines.networkPredictor, 'getQuality') ?? safeCall(engines.networkPredictor, 'getState');
    if (typeof netQ === 'string') statusRef.current.networkQuality = netQ;

    // inputLatency → store
    const latency = safeCall(engines.inputLatency, 'getLatency') ?? safeCall(engines.inputLatency, 'getState');
    if (typeof latency === 'number') store.setState({ inputLatencyMs: latency });

    // scheduler → store
    const schLoad = safeCall(engines.scheduler, 'getLoad') ?? safeCall(engines.scheduler, 'getState');
    if (typeof schLoad === 'number') store.setState({ schedulerLoad: schLoad });

    // ─── Rendering (2 engines) ───
    // adaptiveRenderer → store
    const rq = safeCall(engines.adaptiveRenderer, 'getQuality') ?? safeCall(engines.adaptiveRenderer, 'getState');
    if (rq) store.setState({ renderQuality: typeof rq === 'string' ? rq : 'high' });

    // lodManager → store
    const lod = safeCall(engines.lodManager, 'getLevel') ?? safeCall(engines.lodManager, 'getState');
    if (typeof lod === 'number') store.setState({ lodLevel: lod });

    // ─── Analytics → store ───
    const sessionId = safeCall(engines.analytics, 'getSessionId') ?? safeProp(engines.analytics, 'sessionId');
    if (sessionId) store.setState({ analyticsSessionId: sessionId });

    return statusRef.current;
  }, [engines, store]);

  // Poll every 3 seconds
  useEffect(() => {
    collectStatus();
    const interval = setInterval(collectStatus, 3000);
    return () => clearInterval(interval);
  }, [collectStatus]);

  return statusRef.current;
}
