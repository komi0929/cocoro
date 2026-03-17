/**
 * cocoro — ConversationGameShow
 * 音声ベースの**本格ゲームショー**モード
 *
 * SharedActivitiesの上位版 — ボイスで遊べる本格ゲーム
 * TikTok Liveにない: 音声ベースのインタラクティブゲーム
 * VTuberから学ぶ: 参加型企画が最も盛り上がる
 *
 * ゲーム:
 * 1. 早押しクイズ — 最初に声を出した人が回答権
 * 2. インプロ(即興演劇) — お題→30秒で演じる→投票
 * 3. ディベートバトル — 賛成vs反対→観客ジャッジ
 * 4. 大喜利 — お題→回答→投票
 * 5. 声マネチャレンジ — お題→モノマネ→投票
 * 6. ストーリーリレー — 一人ずつ物語を繋ぐ
 */

export type GameType = 'quiz' | 'improv' | 'debate' | 'ohgiri' | 'voice_mimic' | 'story_relay';

export type GamePhase = 'lobby' | 'intro' | 'playing' | 'judging' | 'result' | 'ended';

export interface GamePlayer {
  id: string;
  displayName: string;
  score: number;
  isReady: boolean;
  currentAnswer?: string;
}

export interface GameState {
  type: GameType;
  phase: GamePhase;
  players: GamePlayer[];
  currentRound: number;
  totalRounds: number;
  currentPrompt: string;
  timeRemainingMs: number;
  winnerId: string | null;
  votes: Map<string, string>; // voterId → targetId
  roundResults: { round: number; winnerId: string; prompt: string }[];
}

// --- お題データ ---
const QUIZ_QUESTIONS = [
  { q: '日本で一番高い山は？', a: '富士山' },
  { q: '「ドラえもん」の好物は？', a: 'どら焼き' },
  { q: '一年で最も日が長い日は？', a: '夏至' },
  { q: 'サッカーで1チームの人数は？', a: '11人' },
  { q: '月は地球の何？', a: '衛星' },
];

const IMPROV_PROMPTS = [
  '初めてのデートで大失敗する人',
  '宇宙人と初めて会話する地球代表',
  'AIに仕事を取られて怒る社長',
  'タイムスリップして江戸時代に来た現代人',
  '動物園の動物が逃げ出した時のアナウンス',
];

const OHGIRI_PROMPTS = [
  'こんなコンビニは嫌だ',
  '全然怖くないお化け屋敷',
  '世界一つまらない遊園地のアトラクション',
  '絶対に売れない新商品',
  'AIが書いた卒業式のスピーチ',
];

const DEBATE_TOPICS = [
  'タケノコの里 vs きのこの山',
  '犬派 vs 猫派',
  '夏 vs 冬',
  '朝型 vs 夜型',
  '都会暮らし vs 田舎暮らし',
];

const VOICE_MIMIC_TARGETS = [
  'ドラえもん', 'ルフィ', '悟空', 'コナン', 'サザエさん',
  'アンパンマン', 'ナルト', 'のび太', 'ちびまる子',
];

const STORY_STARTERS = [
  'ある日、突然スマホが喋り出した',
  '目が覚めると、そこは異世界だった',
  '犬が「おはよう」と人の言葉を話した',
  '明日、地球に巨大な隕石が来るらしい',
  '100年後の日本から手紙が届いた',
];

export class ConversationGameShow {
  private state: GameState;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onPhaseChange: Array<(phase: GamePhase) => void> = [];

  constructor() {
    this.state = this.createInitialState('quiz');
  }

  /** ゲーム開始 */
  startGame(type: GameType, playerIds: string[]): GameState {
    this.state = this.createInitialState(type);
    playerIds.forEach(id => {
      this.state.players.push({ id, displayName: id, score: 0, isReady: false });
    });
    this.state.phase = 'intro';
    this.emitPhaseChange('intro');

    setTimeout(() => {
      this.nextRound();
    }, 3000);

    return { ...this.state };
  }

  /** 次のラウンド */
  nextRound(): void {
    if (this.state.currentRound >= this.state.totalRounds) {
      this.endGame();
      return;
    }

    this.state.currentRound++;
    this.state.phase = 'playing';
    this.state.currentPrompt = this.getPrompt();
    this.state.votes = new Map();
    this.state.players.forEach(p => { p.currentAnswer = undefined; });

    // Timer
    const timeLimit = this.getTimeLimitMs();
    this.state.timeRemainingMs = timeLimit;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.state.timeRemainingMs -= 1000;
      if (this.state.timeRemainingMs <= 0) {
        clearInterval(this.timerInterval!);
        this.timerInterval = null;
        this.startJudging();
      }
    }, 1000);

    this.emitPhaseChange('playing');
  }

  /** 回答提出 */
  submitAnswer(playerId: string, answer: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.currentAnswer = answer;
    }

    // Quiz: 最初の正解者が勝ち
    if (this.state.type === 'quiz') {
      const q = QUIZ_QUESTIONS[(this.state.currentRound - 1) % QUIZ_QUESTIONS.length];
      if (answer.includes(q.a)) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.state.winnerId = playerId;
        if (player) player.score += 100;
        this.state.roundResults.push({
          round: this.state.currentRound,
          winnerId: playerId,
          prompt: this.state.currentPrompt,
        });
        this.state.phase = 'result';
        this.emitPhaseChange('result');
      }
    }
  }

  /** 投票 */
  vote(voterId: string, targetId: string): void {
    if (voterId !== targetId) {
      this.state.votes.set(voterId, targetId);
    }
  }

  /** ジャッジ開始 */
  startJudging(): void {
    this.state.phase = 'judging';
    this.emitPhaseChange('judging');

    // 10秒の投票時間
    setTimeout(() => {
      this.tallyVotes();
    }, 10000);
  }

  /** 集計 */
  private tallyVotes(): void {
    const voteCounts = new Map<string, number>();
    this.state.votes.forEach((targetId) => {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
    });

    let maxVotes = 0;
    let winnerId: string | null = null;
    voteCounts.forEach((count, id) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = id;
      }
    });

    if (winnerId) {
      this.state.winnerId = winnerId;
      const winner = this.state.players.find(p => p.id === winnerId);
      if (winner) winner.score += 100;
      this.state.roundResults.push({
        round: this.state.currentRound,
        winnerId,
        prompt: this.state.currentPrompt,
      });
    }

    this.state.phase = 'result';
    this.emitPhaseChange('result');
  }

  /** ゲーム終了 */
  endGame(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state.phase = 'ended';
    this.emitPhaseChange('ended');
  }

  /** フェーズリスナー */
  onPhase(fn: (phase: GamePhase) => void): () => void {
    this.onPhaseChange.push(fn);
    return () => { this.onPhaseChange = this.onPhaseChange.filter(f => f !== fn); };
  }

  getState(): GameState { return { ...this.state, votes: new Map(this.state.votes) }; }

  getLeaderboard(): GamePlayer[] {
    return [...this.state.players].sort((a, b) => b.score - a.score);
  }

  // --- Private ---

  private createInitialState(type: GameType): GameState {
    return {
      type,
      phase: 'lobby',
      players: [],
      currentRound: 0,
      totalRounds: type === 'story_relay' ? 1 : 5,
      currentPrompt: '',
      timeRemainingMs: 0,
      winnerId: null,
      votes: new Map(),
      roundResults: [],
    };
  }

  private getPrompt(): string {
    const round = this.state.currentRound - 1;
    switch (this.state.type) {
      case 'quiz': return QUIZ_QUESTIONS[round % QUIZ_QUESTIONS.length].q;
      case 'improv': return IMPROV_PROMPTS[round % IMPROV_PROMPTS.length];
      case 'ohgiri': return OHGIRI_PROMPTS[round % OHGIRI_PROMPTS.length];
      case 'debate': return DEBATE_TOPICS[round % DEBATE_TOPICS.length];
      case 'voice_mimic': return VOICE_MIMIC_TARGETS[round % VOICE_MIMIC_TARGETS.length];
      case 'story_relay': return STORY_STARTERS[round % STORY_STARTERS.length];
      default: return '';
    }
  }

  private getTimeLimitMs(): number {
    switch (this.state.type) {
      case 'quiz': return 15000;
      case 'improv': return 30000;
      case 'ohgiri': return 20000;
      case 'debate': return 60000;
      case 'voice_mimic': return 15000;
      case 'story_relay': return 20000;
      default: return 30000;
    }
  }

  private emitPhaseChange(phase: GamePhase): void {
    for (const fn of this.onPhaseChange) fn(phase);
  }
}
