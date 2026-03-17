/**
 * kokoro — AI Companion
 * 1人でも会話相手がいる — コールドスタート最大の武器
 *
 * サイクル22: AIが話し相手になる
 * - 空部屋に入った時、AIアバターが待っている
 * - 簡単な会話をしてくれる(挨拶、質問、リアクション)
 * - 他の人が来たらAIは静かになる
 * - 人が0人になったらまたAIが話しかける
 * = 「空部屋問題」の根本解決
 */

export type CompanionState = 'idle' | 'greeting' | 'conversing' | 'listening' | 'farewell' | 'dormant';

export interface CompanionResponse {
  text: string;
  emotion: 'neutral' | 'happy' | 'curious' | 'excited' | 'gentle';
  gesture: 'nod' | 'wave' | 'clap' | 'tilt' | 'none';
  delayMs: number;
}

const COMPANION_SCRIPTS: Record<string, CompanionResponse[]> = {
  greeting: [
    { text: 'こんにちは！ kokoro へようこそ 🌟', emotion: 'happy', gesture: 'wave', delayMs: 1000 },
    { text: 'はじめまして！ 待ってたよ ✨', emotion: 'excited', gesture: 'wave', delayMs: 1000 },
    { text: 'やっほー！ 誰か来てくれた！ 💫', emotion: 'happy', gesture: 'clap', delayMs: 800 },
  ],
  questions: [
    { text: '今日はどんな気分？', emotion: 'curious', gesture: 'tilt', delayMs: 3000 },
    { text: '何か面白いことあった？', emotion: 'curious', gesture: 'tilt', delayMs: 4000 },
    { text: '好きな音楽のジャンルは？', emotion: 'neutral', gesture: 'none', delayMs: 5000 },
    { text: '最近ハマってることある？', emotion: 'curious', gesture: 'tilt', delayMs: 4000 },
  ],
  reactions: [
    { text: 'なるほど〜！', emotion: 'happy', gesture: 'nod', delayMs: 800 },
    { text: 'それ面白いね！', emotion: 'excited', gesture: 'clap', delayMs: 800 },
    { text: 'へぇ〜！', emotion: 'curious', gesture: 'nod', delayMs: 600 },
    { text: 'わかる〜！', emotion: 'happy', gesture: 'nod', delayMs: 700 },
  ],
  farewell: [
    { text: '他の人が来たから、ここは任せるね！楽しんで 🎉', emotion: 'gentle', gesture: 'wave', delayMs: 1500 },
  ],
};

export class AICompanion {
  private state: CompanionState = 'idle';
  private scriptIndex = 0;
  private lastResponseTime = 0;
  private humanCount = 0;

  /**
   * 人数変化を通知
   */
  updateParticipantCount(humanCount: number): CompanionResponse | null {
    const prevCount = this.humanCount;
    this.humanCount = humanCount;

    if (humanCount === 1 && this.state === 'idle') {
      // 1人(自分だけ) → AI greeting
      this.state = 'greeting';
      return this.getResponse('greeting');
    }

    if (humanCount >= 2 && prevCount < 2 && this.state !== 'dormant') {
      // 他の人が来た → AI退場
      this.state = 'dormant';
      return this.getResponse('farewell');
    }

    if (humanCount <= 1 && prevCount >= 2) {
      // 人が去った → AI復活
      this.state = 'conversing';
      return this.getResponse('greeting');
    }

    return null;
  }

  /**
   * ユーザーが話した後のリアクション
   */
  onUserSpoke(): CompanionResponse | null {
    if (this.state === 'dormant') return null;

    const now = Date.now();
    if (now - this.lastResponseTime < 5000) return null; // 5秒クールダウン

    this.state = 'conversing';
    this.lastResponseTime = now;

    // 50%の確率でリアクション、50%で質問
    if (Math.random() > 0.5) {
      return this.getResponse('reactions');
    }
    return this.getResponse('questions');
  }

  /**
   * 沈黙時のアクション(SilenceDirectorと連携)
   */
  onSilence(silenceSeconds: number): CompanionResponse | null {
    if (this.state === 'dormant') return null;
    if (silenceSeconds > 15 && Date.now() - this.lastResponseTime > 10000) {
      this.lastResponseTime = Date.now();
      return this.getResponse('questions');
    }
    return null;
  }

  private getResponse(category: string): CompanionResponse {
    const scripts = COMPANION_SCRIPTS[category] || COMPANION_SCRIPTS.reactions;
    const response = scripts[this.scriptIndex % scripts.length];
    this.scriptIndex++;
    return { ...response };
  }

  getState(): CompanionState { return this.state; }
  isActive(): boolean { return this.state !== 'dormant' && this.state !== 'idle'; }
}
