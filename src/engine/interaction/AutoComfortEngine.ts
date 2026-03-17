/**
 * kokoro — Auto Comfort Engine
 * 参加者の快適さを自動管理するエンジン
 *
 * 反復261-270:
 * - 長時間無言の参加者にやさしいナッジ
 * - 一人が独占的に話している場合のバランス調整シグナル
 * - 新規参加者への歓迎演出の自動トリガー
 * - 不快な沈黙が長引いた場合のアイスブレイク提案
 * - 深夜の低エネルギー対応（穏やかなモード自動切替）
 * = 「場のファシリテーター」をAIが担う
 */

export type ComfortAction =
  | { type: 'nudge_silent_user'; targetId: string; message: string }
  | { type: 'balance_warning'; dominantId: string; ratio: number }
  | { type: 'welcome_newcomer'; participantId: string; name: string }
  | { type: 'icebreaker'; suggestion: string }
  | { type: 'night_mode'; enabled: boolean }
  | { type: 'energy_boost'; reason: string };

const ICEBREAKERS = [
  '🎵 好きな音楽のジャンルは？',
  '🌏 最近行った面白い場所は？',
  '🍕 今日何食べた？',
  '📺 最近ハマってるコンテンツは？',
  '✨ 最近あった良いことは？',
  '🎮 最近やってるゲームは？',
  '📚 おすすめの本ある？',
  '🐱 ペット飼ってる？',
];

interface ParticipantActivity {
  id: string;
  displayName: string;
  lastSpokeAt: number;
  totalSpeakingTime: number;
  joinedAt: number;
  isSpeaking: boolean;
}

export class AutoComfortEngine {
  private lastActionTime = 0;
  private welcomedIds = new Set<string>();
  private nudgedIds = new Map<string, number>(); // id → last nudge time
  private sessionStartTime = Date.now();
  private icebreakerIndex = 0;

  private readonly ACTION_COOLDOWN = 30000; // 30s between actions
  private readonly SILENCE_NUDGE_THRESHOLD = 120000; // 2 min
  private readonly DOMINANCE_THRESHOLD = 0.6; // 60% speaking time
  private readonly ICEBREAKER_SILENCE_THRESHOLD = 45000; // 45s of total silence

  /**
   * フレーム更新: アクションが必要か判定
   */
  evaluate(
    participants: ParticipantActivity[],
    totalSilenceDuration: number, // seconds of current silence streak
  ): ComfortAction | null {
    const now = Date.now();
    if (now - this.lastActionTime < this.ACTION_COOLDOWN) return null;

    // === 1. Welcome newcomers ===
    for (const p of participants) {
      if (!this.welcomedIds.has(p.id) && now - p.joinedAt > 2000) {
        this.welcomedIds.add(p.id);
        this.lastActionTime = now;
        return {
          type: 'welcome_newcomer',
          participantId: p.id,
          name: p.displayName,
        };
      }
    }

    // === 2. Night mode (23:00-05:00) ===
    const hour = new Date().getHours();
    const isNight = hour >= 23 || hour < 5;
    if (isNight && now - this.sessionStartTime > 60000) {
      // Only trigger once
      this.sessionStartTime = now + 3600000;
      return { type: 'night_mode', enabled: true };
    }

    // === 3. Icebreaker for long silence ===
    if (totalSilenceDuration > this.ICEBREAKER_SILENCE_THRESHOLD / 1000 && participants.length >= 2) {
      this.lastActionTime = now;
      const suggestion = ICEBREAKERS[this.icebreakerIndex % ICEBREAKERS.length];
      this.icebreakerIndex++;
      return { type: 'icebreaker', suggestion };
    }

    // === 4. Nudge silent participants ===
    for (const p of participants) {
      if (p.isSpeaking) continue;
      const silenceTime = now - p.lastSpokeAt;
      const lastNudge = this.nudgedIds.get(p.id) ?? 0;

      if (silenceTime > this.SILENCE_NUDGE_THRESHOLD && now - lastNudge > 300000) {
        this.nudgedIds.set(p.id, now);
        this.lastActionTime = now;
        return {
          type: 'nudge_silent_user',
          targetId: p.id,
          message: `${p.displayName}さん、何か話したいことある？`,
        };
      }
    }

    // === 5. Dominance warning ===
    const totalSpeaking = participants.reduce((s, p) => s + p.totalSpeakingTime, 0);
    if (totalSpeaking > 60) { // Only after 1 min of total speaking
      for (const p of participants) {
        const ratio = p.totalSpeakingTime / totalSpeaking;
        if (ratio > this.DOMINANCE_THRESHOLD && participants.length >= 3) {
          this.lastActionTime = now;
          return {
            type: 'balance_warning',
            dominantId: p.id,
            ratio: Math.round(ratio * 100) / 100,
          };
        }
      }
    }

    return null;
  }

  /**
   * アクションのUI表示テキストを生成
   */
  static formatAction(action: ComfortAction): string {
    switch (action.type) {
      case 'welcome_newcomer':
        return `👋 ${action.name}さんが参加しました！`;
      case 'icebreaker':
        return `💡 話題: ${action.suggestion}`;
      case 'nudge_silent_user':
        return action.message;
      case 'balance_warning':
        return '💬 みんなで話しましょう！';
      case 'night_mode':
        return '🌙 深夜モードに切り替わりました';
      case 'energy_boost':
        return `⚡ ${action.reason}`;
    }
  }
}
