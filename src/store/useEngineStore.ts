/**
 * cocoro - Engine Store
 * Zustand store that initializes and manages all engine singletons.
 * Bridges engine state → React components via reactive store.
 */

import { create } from 'zustand';
import { TrustScoreSystem, type TrustProfile, type TrustLevel } from '@/engine/social/TrustScoreSystem';
import { AnalyticsEngine } from '@/engine/social/AnalyticsEngine';
import { DailyChallengeSystem, type DailyState, type DailyChallenge } from '@/engine/social/DailyChallengeSystem';
import { SilenceDirector, type SilenceState } from '@/engine/choreography/SilenceDirector';
import { AutoModerator, type ModerationAction } from '@/engine/safety/AutoModerator';
import { initSoundFX, playReactionSound, playPeakMoment, playJoinSound, playLeaveSound, playMicOn, playMicOff, playErrorSound, playResonanceSound } from '@/engine/audio/SoundFX';
import { ConversationGameEngine, type GameState as ConvoGameState, type GameType as ConvoGameType } from '@/engine/game/ConversationGameEngine';
import { SharedActivitiesManager, type Activity, type ActiveActivity, type ActivityType } from '@/engine/game/SharedActivitiesManager';
import { SessionAchievements, type Achievement as SessionAchievement } from '@/engine/interaction/SessionAchievements';
import { AvatarExpressionEngine, type ExpressionState } from '@/engine/interaction/AvatarExpressionEngine';
import { PrivacyGuard, type PrivacySettings } from '@/engine/safety/PrivacyGuard';
import { ReportSystem, type ReportCategory } from '@/engine/safety/ReportSystem';
import { SafetyBoundarySystem } from '@/engine/safety/SafetyBoundarySystem';
import { ConversationLevelSystem, type LevelState } from '@/engine/social/ConversationLevelSystem';
import { InviteLinkSystem, type InviteLink } from '@/engine/social/InviteLinkSystem';
import { FavoriteRoomsManager, type FavoriteRoom } from '@/engine/social/FavoriteRoomsManager';
import { NotificationEngine, type cocoroNotification } from '@/engine/social/NotificationEngine';
import { GuestMode, type GuestProfile } from '@/engine/social/GuestMode';
import { VoiceFFTAnalyzer, type VoiceMetrics } from '@/engine/audio/VoiceFFTAnalyzer';
import { RoomAmbienceEngine } from '@/engine/audio/RoomAmbienceEngine';
import { MoodLightingEngine, type MoodColors } from '@/engine/choreography/MoodLightingEngine';
import type { FurnitureActionType } from '@/types/cocoro';

// ============================================================
// Conversation Level System (inline simplified)
// ============================================================

export interface ConversationLevel {
  level: number;
  xp: number;
  xpToNext: number;
  title: string;
}

const LEVEL_TITLES = [
  '聞き手見習い', 'おしゃべり初心者', 'トークの卵', '言葉の冒険者',
  '会話マスター', 'おしゃべり達人', 'トークの星', '言葉の魔法使い',
  '社交の王', 'レジェンド',
];

function calcLevel(totalXp: number): ConversationLevel {
  let level = 1;
  let xp = totalXp;
  let needed = 50;
  while (xp >= needed && level < 99) {
    xp -= needed;
    level++;
    needed = Math.floor(needed * 1.3);
  }
  return {
    level,
    xp,
    xpToNext: needed,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
  };
}

// ============================================================
// Achievement definitions
// ============================================================

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalSessions: number;
  totalMessages: number;
  totalReactions: number;
  trustLevel: TrustLevel;
  conversationLevel: number;
  furnitureCount: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_room', name: '初めてのアジト', emoji: '🏠', description: '初めて部屋に入った', condition: (c) => c.totalSessions >= 1 },
  { id: 'chatty', name: 'おしゃべり好き', emoji: '💬', description: '10回メッセージを送った', condition: (c) => c.totalMessages >= 10 },
  { id: 'reactor', name: 'リアクション王', emoji: '🎉', description: 'リアクションを20回使った', condition: (c) => c.totalReactions >= 20 },
  { id: 'trusted', name: '信頼の証', emoji: '⭐', description: '信頼レベル「信頼者」に到達', condition: (c) => ['trusted', 'veteran', 'guardian'].includes(c.trustLevel) },
  { id: 'veteran', name: 'ベテラン', emoji: '🏅', description: '会話レベル5に到達', condition: (c) => c.conversationLevel >= 5 },
  { id: 'decorator', name: 'インテリアデザイナー', emoji: '🎨', description: '家具を10個配置した', condition: (c) => c.furnitureCount >= 10 },
  { id: 'regular', name: '常連', emoji: '☕', description: '5セッション参加した', condition: (c) => c.totalSessions >= 5 },
  { id: 'social', name: 'ソーシャルバタフライ', emoji: '🦋', description: '会話レベル8に到達', condition: (c) => c.conversationLevel >= 8 },
];

// ============================================================
// Notification types
// ============================================================

export interface Notification {
  id: string;
  type: 'achievement' | 'trust' | 'level' | 'social' | 'info';
  emoji: string;
  title: string;
  message: string;
  timestamp: number;
}

// ============================================================
// Social friend entries
// ============================================================

export interface FriendEntry {
  userId: string;
  name: string;
  lastSeen: number;
  isOnline: boolean;
  trustLevel: TrustLevel;
}

// ============================================================
// Activity game state
// ============================================================

export type GameType = 'shiritori' | 'topic_talk' | 'two_choices' | 'word_chain' | 'emoji_quiz';

export interface GameState {
  type: GameType;
  isActive: boolean;
  topic?: string;
  round: number;
  participants: string[];
}

const GAME_TOPICS: Record<GameType, { name: string; emoji: string; topics: string[] }> = {
  shiritori: {
    name: 'しりとり',
    emoji: '🔤',
    topics: ['ノーマル', '食べ物しばり', '動物しばり'],
  },
  topic_talk: {
    name: 'お題トーク',
    emoji: '🎤',
    topics: [
      '子どもの頃の夢は？', '最近ハマっていること', '無人島に持っていくもの3つ',
      '超能力が使えるとしたら？', '最後の晩餐は何食べる？', 'タイムマシンで行きたい時代',
      '生まれ変わるなら何になる？', '自分を動物に例えると？',
    ],
  },
  two_choices: {
    name: '二択ゲーム',
    emoji: '⚡',
    topics: [
      '犬派 vs 猫派', '朝型 vs 夜型', '海 vs 山',
      '夏 vs 冬', 'インドア vs アウトドア', 'ラーメン vs カレー',
    ],
  },
  word_chain: {
    name: 'ワードチェーン',
    emoji: '🔗',
    topics: ['連想ゲーム'],
  },
  emoji_quiz: {
    name: '絵文字クイズ',
    emoji: '🧩',
    topics: ['映画当て', 'アニメ当て', '食べ物当て'],
  },
};

// ============================================================
// Store
// ============================================================

const XP_STORAGE_KEY = 'cocoro_xp';
const ACHIEVEMENT_STORAGE_KEY = 'cocoro_achievements';
const FRIENDS_STORAGE_KEY = 'cocoro_friends';
const STATS_STORAGE_KEY = 'cocoro_stats';

interface EngineState {
  // Systems
  trust: TrustScoreSystem;
  analytics: AnalyticsEngine;
  dailyChallenge: DailyChallengeSystem;
  silenceDirector: SilenceDirector;
  autoModerator: AutoModerator;
  gameEngine: ConversationGameEngine;
  activities: SharedActivitiesManager;
  sessionAchievements: SessionAchievements;
  avatarExpression: AvatarExpressionEngine;
  privacyGuard: PrivacyGuard;
  reportSystem: ReportSystem;
  safetyBoundary: SafetyBoundarySystem;
  levelSystem: ConversationLevelSystem;
  inviteLinks: InviteLinkSystem;
  favoriteRooms: FavoriteRoomsManager;
  notificationEngine: NotificationEngine;
  guestMode: GuestMode;
  voiceFFT: VoiceFFTAnalyzer;
  roomAmbience: RoomAmbienceEngine;
  moodLighting: MoodLightingEngine;

  // Reactive state
  trustProfile: TrustProfile | null;
  conversationLevel: ConversationLevel;
  unlockedAchievements: string[];
  notifications: Notification[];
  friends: FriendEntry[];
  stats: { sessions: number; messages: number; reactions: number; furniture: number };
  dailyState: DailyState | null;
  weeklyTheme: { name: string; emoji: string } | null;
  silenceState: SilenceState;
  currentGame: GameState | null;
  convoGame: ConvoGameState | null;
  activeActivity: ActiveActivity | null;
  sessionAchievementsList: SessionAchievement[];
  expressionState: ExpressionState;
  privacySettings: PrivacySettings;
  detailedLevel: LevelState;
  favoriteRoomsList: FavoriteRoom[];
  voiceMetrics: VoiceMetrics | null;

  // Actions
  initForUser: (userId: string) => void;
  addXP: (amount: number) => void;
  recordAction: (action: 'joinSession' | 'completeSession' | 'receiveReaction' | 'receiveFriend' | 'hostSession' | 'streakDay') => void;
  checkAchievements: () => void;
  pushNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  addFriend: (friend: Omit<FriendEntry, 'lastSeen' | 'isOnline'>) => void;
  incrementStat: (stat: 'sessions' | 'messages' | 'reactions' | 'furniture') => void;
  startGame: (type: GameType) => void;
  endGame: () => void;
  nextRound: () => void;
  updateSilence: (anySpeaking: boolean, participantCount: number) => void;
  playSFX: (type: 'reaction' | 'join' | 'leave' | 'peak' | 'mic_on' | 'mic_off' | 'error' | 'resonance') => void;
  // Game engines
  startConvoGame: (type: ConvoGameType, participants: Array<{ id: string; displayName: string }>) => void;
  startActivity: (type: ActivityType, participants: string[]) => void;
  endActivity: () => void;
  // Expression
  updateExpression: (params: { volume: number; isSpeaking: boolean; emotion: { joy: number; anger: number; sorrow: number; surprise: number }; pitch?: number }) => void;
  tickExpression: () => ExpressionState;
  // Safety
  reportUser: (targetId: string, targetName: string, category: ReportCategory, description: string, roomId: string) => void;
  blockUser: (userId: string) => void;
  toggleSafeZone: () => void;
  // Social
  createInviteLink: (roomId: string, roomName: string, creatorName: string) => InviteLink;
  toggleFavoriteRoom: (roomId: string, roomName: string) => void;
  // Voice FFT
  startVoiceFFTDemo: () => void;
  updateVoiceMetrics: (time: number) => void;
  // Room ambience
  startRoomAmbience: () => void;
  stopRoomAmbience: () => void;
}

export const useEngineStore = create<EngineState>((set, get) => {
  const trust = new TrustScoreSystem();
  const analytics = new AnalyticsEngine();
  const dailyChallenge = new DailyChallengeSystem();
  const silenceDirector = new SilenceDirector();
  const autoModerator = new AutoModerator();
  const gameEngine = new ConversationGameEngine();
  const activitiesMgr = new SharedActivitiesManager();
  const sessionAch = new SessionAchievements();
  const avatarExpr = new AvatarExpressionEngine();
  const privacyGuard = new PrivacyGuard();
  const reportSystem = new ReportSystem();
  const safetyBoundary = new SafetyBoundarySystem();
  const levelSystem = new ConversationLevelSystem();
  const inviteLinks = new InviteLinkSystem();
  const favoriteRooms = new FavoriteRoomsManager();
  const notificationEngine = new NotificationEngine();
  const guestModeEngine = new GuestMode();
  const voiceFFT = new VoiceFFTAnalyzer();
  const roomAmbience = new RoomAmbienceEngine();
  const moodLighting = new MoodLightingEngine();

  // Wire notification engine to store notifications
  notificationEngine.onNotify((n) => {
    get().pushNotification({ type: 'info', emoji: n.emoji, title: n.title, message: n.body });
  });

  // Wire level-up to notifications
  levelSystem.onLevelUp((newLevel, title) => {
    get().pushNotification({ type: 'level', emoji: '⬆️', title: `Lv.${newLevel}にレベルアップ！`, message: `称号「${title}」を獲得` });
    get().playSFX('peak');
  });

  return {
    trust, analytics, dailyChallenge, silenceDirector, autoModerator,
    gameEngine, activities: activitiesMgr, sessionAchievements: sessionAch,
    avatarExpression: avatarExpr, privacyGuard, reportSystem, safetyBoundary,
    levelSystem, inviteLinks, favoriteRooms, notificationEngine: notificationEngine,
    guestMode: guestModeEngine, voiceFFT, roomAmbience, moodLighting,
    trustProfile: null,
    conversationLevel: calcLevel(0),
    unlockedAchievements: [],
    notifications: [],
    friends: [],
    stats: { sessions: 0, messages: 0, reactions: 0, furniture: 0 },
    dailyState: null,
    weeklyTheme: null,
    silenceState: { phase: 'none', durationSeconds: 0, bgmVolume: 0, showThinking: false, showTopicSuggestion: false, showEncouragement: false, encouragementText: '' },
    currentGame: null,
    convoGame: null,
    activeActivity: null,
    sessionAchievementsList: [],
    expressionState: avatarExpr.update(),
    privacySettings: privacyGuard.getSettings(),
    detailedLevel: levelSystem.getState(),
    favoriteRoomsList: favoriteRooms.getFavorites(),
    voiceMetrics: null,

    initForUser: (userId: string) => {
      const profile = trust.getOrCreate(userId);
      initSoundFX();
      sessionAch.resetSession();
      voiceFFT.startDemo();

      // Load persisted XP
      let totalXp = 0;
      try { totalXp = parseInt(localStorage.getItem(XP_STORAGE_KEY) || '0', 10); } catch { /* */ }

      // Load unlocked achievements
      let unlocked: string[] = [];
      try { unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || '[]'); } catch { /* */ }

      // Load friends
      let friends: FriendEntry[] = [];
      try { friends = JSON.parse(localStorage.getItem(FRIENDS_STORAGE_KEY) || '[]'); } catch { /* */ }

      // Load stats
      let stats = { sessions: 0, messages: 0, reactions: 0, furniture: 0 };
      try { stats = { ...stats, ...JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '{}') }; } catch { /* */ }

      // Daily challenge check-in
      dailyChallenge.checkIn();
      const ds = dailyChallenge.getState();
      const wt = dailyChallenge.getWeeklyTheme();

      set({
        trustProfile: profile,
        conversationLevel: calcLevel(totalXp),
        unlockedAchievements: unlocked,
        friends,
        stats,
        dailyState: ds,
        weeklyTheme: wt,
        detailedLevel: levelSystem.getState(),
        favoriteRoomsList: favoriteRooms.getFavorites(),
        privacySettings: privacyGuard.getSettings(),
      });

      // Show daily challenge notification
      get().pushNotification({
        type: 'info',
        emoji: ds.todayChallenge.emoji,
        title: `今日のチャレンジ`,
        message: `${ds.todayChallenge.title} — ${ds.todayChallenge.description}`,
      });

      // Show streak if active
      if (ds.currentStreak > 1) {
        get().pushNotification({
          type: 'achievement',
          emoji: '🔥',
          title: `${ds.currentStreak}日連続ログイン！`,
          message: `${wt.emoji} ${wt.name}`,
        });
      }

      analytics.track('app_opened', { userId });
    },

    addXP: (amount: number) => {
      let totalXp = 0;
      try { totalXp = parseInt(localStorage.getItem(XP_STORAGE_KEY) || '0', 10); } catch { /* */ }
      totalXp += amount;
      localStorage.setItem(XP_STORAGE_KEY, String(totalXp));
      const newLevel = calcLevel(totalXp);
      const oldLevel = get().conversationLevel;

      set({ conversationLevel: newLevel });

      if (newLevel.level > oldLevel.level) {
        get().pushNotification({
          type: 'level',
          emoji: '⬆️',
          title: 'レベルアップ！',
          message: `Lv.${newLevel.level} 「${newLevel.title}」になりました`,
        });
      }

      get().checkAchievements();
    },

    recordAction: (action) => {
      const profile = get().trustProfile;
      if (!profile) return;
      const updated = trust.modifyScore(profile.userId, action);
      set({ trustProfile: { ...updated } });

      if (action === 'joinSession') get().incrementStat('sessions');
      get().addXP(action === 'completeSession' ? 15 : action === 'hostSession' ? 20 : 5);
    },

    checkAchievements: () => {
      const { trustProfile, conversationLevel, unlockedAchievements, stats } = get();
      if (!trustProfile) return;

      const ctx: AchievementContext = {
        totalSessions: stats.sessions,
        totalMessages: stats.messages,
        totalReactions: stats.reactions,
        trustLevel: trustProfile.level,
        conversationLevel: conversationLevel.level,
        furnitureCount: stats.furniture,
      };

      const newUnlocks: string[] = [];
      for (const a of ACHIEVEMENTS) {
        if (!unlockedAchievements.includes(a.id) && a.condition(ctx)) {
          newUnlocks.push(a.id);
          get().pushNotification({
            type: 'achievement',
            emoji: a.emoji,
            title: '実績解除！',
            message: `${a.name} — ${a.description}`,
          });
        }
      }

      if (newUnlocks.length > 0) {
        const all = [...unlockedAchievements, ...newUnlocks];
        localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(all));
        set({ unlockedAchievements: all });
      }
    },

    pushNotification: (n) => {
      const notif: Notification = {
        ...n,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      set(s => ({ notifications: [...s.notifications, notif] }));

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        get().dismissNotification(notif.id);
      }, 5000);
    },

    dismissNotification: (id) => {
      set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
    },

    addFriend: (friend) => {
      const entry: FriendEntry = { ...friend, lastSeen: Date.now(), isOnline: false };
      set(s => {
        const updated = [...s.friends.filter(f => f.userId !== friend.userId), entry];
        localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(updated));
        return { friends: updated };
      });
    },

    incrementStat: (stat) => {
      set(s => {
        const updated = { ...s.stats, [stat]: s.stats[stat] + 1 };
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
        return { stats: updated };
      });
    },

    startGame: (type) => {
      const game = GAME_TOPICS[type];
      const topic = game.topics[Math.floor(Math.random() * game.topics.length)];
      set({
        currentGame: {
          type,
          isActive: true,
          topic,
          round: 1,
          participants: [],
        },
      });
      get().pushNotification({
        type: 'info',
        emoji: game.emoji,
        title: `${game.name}開始！`,
        message: `お題: ${topic}`,
      });
    },

    endGame: () => {
      set({ currentGame: null });
    },

    nextRound: () => {
      set(s => {
        if (!s.currentGame) return {};
        return { currentGame: { ...s.currentGame, round: s.currentGame.round + 1 } };
      });
    },

    updateSilence: (anySpeaking: boolean, participantCount: number) => {
      const newState = silenceDirector.update(anySpeaking, participantCount);
      set({ silenceState: newState });
    },

    playSFX: (type) => {
      switch (type) {
        case 'reaction': playReactionSound(); break;
        case 'join': playJoinSound(); break;
        case 'leave': playLeaveSound(); break;
        case 'peak': playPeakMoment(); break;
        case 'mic_on': playMicOn(); break;
        case 'mic_off': playMicOff(); break;
        case 'error': playErrorSound(); break;
        case 'resonance': playResonanceSound(); break;
      }
    },

    // === Conversation Game ===
    startConvoGame: (type, participants) => {
      const state = gameEngine.createGame(type, participants);
      gameEngine.start();
      set({ convoGame: state });
      get().pushNotification({ type: 'info', emoji: '🎮', title: 'ゲーム開始！', message: `${type}がスタート` });
      get().playSFX('peak');
    },

    startActivity: (type, participants) => {
      const result = activitiesMgr.start(type, participants);
      set({ activeActivity: result });
      if (result) {
        get().pushNotification({ type: 'info', emoji: result.activity.emoji, title: `${result.activity.name}開始！`, message: result.activity.description });
      }
    },

    endActivity: () => {
      activitiesMgr.finish();
      set({ activeActivity: null });
    },

    // === Avatar Expression ===
    updateExpression: (params) => {
      avatarExpr.processVoice(params);
    },

    tickExpression: () => {
      const expr = avatarExpr.update();
      set({ expressionState: expr });
      return expr;
    },

    // === Safety ===
    reportUser: (targetId, targetName, category, description, roomId) => {
      reportSystem.submit({
        reporterId: get().trustProfile?.userId ?? 'unknown',
        targetId, targetName, category, description, roomId,
        evidenceMetadata: { targetSpeakingSeconds: 0, targetVolume: 0, proximityDistance: 0, recentActions: [] },
      });
      get().pushNotification({ type: 'info', emoji: '📢', title: '通報を受け付けました', message: `${targetName}について確認します` });
    },

    blockUser: (userId) => {
      safetyBoundary.blockUser(userId);
      get().pushNotification({ type: 'info', emoji: '🚫', title: 'ブロックしました', message: 'このユーザーの音声とアバターが非表示になります' });
    },

    toggleSafeZone: () => {
      if (safetyBoundary.isSafeZoneActive()) {
        safetyBoundary.deactivateSafeZone();
      } else {
        safetyBoundary.activateSafeZone();
        get().pushNotification({ type: 'info', emoji: '🛡️', title: 'セーフゾーンON', message: '全音声を遮断しました' });
      }
    },

    // === Social ===
    createInviteLink: (roomId, roomName, creatorName) => {
      return inviteLinks.create({
        roomId, roomName, category: 'general', creatorName,
        participantCount: 1, maxParticipants: 8, expiresIn: 24 * 60 * 60 * 1000,
      });
    },

    toggleFavoriteRoom: (roomId, roomName) => {
      if (favoriteRooms.isFavorite(roomId)) {
        favoriteRooms.removeFavorite(roomId);
      } else {
        favoriteRooms.addFavorite(roomId, roomName, 'general');
        get().pushNotification({ type: 'info', emoji: '⭐', title: 'お気に入り追加', message: `「${roomName}」をお気に入りに追加しました` });
      }
      set({ favoriteRoomsList: favoriteRooms.getFavorites() });
    },

    // === Voice FFT ===
    startVoiceFFTDemo: () => { voiceFFT.startDemo(); },
    updateVoiceMetrics: (time) => {
      const metrics = voiceFFT.getMetrics(time);
      set({ voiceMetrics: metrics });
      // Feed into expression engine
      avatarExpr.processVoice({
        volume: metrics.volume,
        isSpeaking: metrics.isSpeaking,
        emotion: { joy: 0.2, anger: 0, sorrow: 0, surprise: metrics.energy * 0.3 },
      });
    },

    // === Room Ambience ===
    startRoomAmbience: () => { roomAmbience.start(); },
    stopRoomAmbience: () => { roomAmbience.stop(); },
  };
});

export { ACHIEVEMENTS, GAME_TOPICS };
export type { GameType as ActivityGameType };
export type { DailyState, DailyChallenge, SilenceState, ModerationAction };
export type { ConvoGameState, ConvoGameType, Activity, ActiveActivity, ActivityType };
export type { SessionAchievement, ExpressionState, PrivacySettings, ReportCategory };
export type { LevelState, InviteLink, FavoriteRoom, cocoroNotification, GuestProfile };
export type { VoiceMetrics, MoodColors };
