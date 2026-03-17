/**
 * cocoro — Conversation Game Engine
 * 会話そのものがゲームになる — エンタメ化の核心
 *
 * 反復356-365:
 * - ワードウルフ: 1人だけ違うお題 → 誰が違うか当てる
 * - 連想ゲーム: 前の人の言葉に関連する言葉を声で
 * - NGワード: 指定キーワードを使ったらアウト
 * - 1分間スピーチ: お題について1分間自由に話す
 * = 「会話がコンテンツ」の最も直接的な実装
 */

export type GameType = 'word_wolf' | 'association' | 'ng_word' | 'one_minute_speech';

export interface GameState {
  type: GameType;
  phase: 'lobby' | 'playing' | 'reveal' | 'result';
  config: GameConfig;
  participants: GameParticipant[];
  startedAt: number;
  roundTimeSeconds: number;
  /** ワードウルフ: 誰が狼か */
  wolfId?: string;
  /** NGワード: 禁止ワード */
  ngWord?: string;
  /** 連想: 現在のワード */
  currentWord?: string;
  /** 1分スピーチ: お題 */
  speechTopic?: string;
}

interface GameConfig {
  type: GameType;
  roundDuration: number; // seconds
}

export interface GameParticipant {
  id: string;
  displayName: string;
  /** ワードウルフ: この人に配られたお題 */
  assignedWord?: string;
  /** この人のスコア */
  score: number;
  isOut: boolean;
  hasVoted: boolean;
  votedForId?: string;
}

// ===== Word Pool =====

const WORD_WOLF_PAIRS: Array<[string, string]> = [
  ['コーヒー', '紅茶'],
  ['映画館', 'カラオケ'],
  ['パスタ', 'ラーメン'],
  ['犬', '猫'],
  ['夏', '冬'],
  ['東京', '大阪'],
  ['ディズニーランド', 'USJ'],
  ['Twitter', 'Instagram'],
  ['朝', '夜'],
  ['漫画', 'アニメ'],
];

const ASSOCIATION_STARTERS = ['桜', '海', '音楽', '旅行', '未来', '昔話', '宝物', '魔法', '月', '風'];
const NG_WORDS = ['でも', 'うーん', 'なるほど', 'ていうか', 'まあ', 'やっぱり', 'とりあえず', 'ちょっと'];
const SPEECH_TOPICS = ['私の推し', '感動した瞬間', '理想の休日', '子供時代の思い出', '10年後の自分', '最高の食べ物', '秘密の特技', '人生で一番笑った話'];

export class ConversationGameEngine {
  private state: GameState | null = null;

  /**
   * ゲームを作成
   */
  createGame(type: GameType, participantIds: Array<{ id: string; displayName: string }>): GameState {
    const participants: GameParticipant[] = participantIds.map(p => ({
      id: p.id, displayName: p.displayName,
      score: 0, isOut: false, hasVoted: false,
    }));

    const config: GameConfig = {
      type,
      roundDuration: type === 'one_minute_speech' ? 60
        : type === 'word_wolf' ? 180
        : type === 'association' ? 120
        : 120,
    };

    this.state = {
      type, phase: 'lobby', config, participants,
      startedAt: 0, roundTimeSeconds: config.roundDuration,
    };

    return this.state;
  }

  /**
   * ゲーム開始
   */
  start(): GameState | null {
    if (!this.state || this.state.phase !== 'lobby') return null;
    this.state.phase = 'playing';
    this.state.startedAt = Date.now();

    switch (this.state.type) {
      case 'word_wolf': {
        const pair = WORD_WOLF_PAIRS[Math.floor(Math.random() * WORD_WOLF_PAIRS.length)];
        const wolfIdx = Math.floor(Math.random() * this.state.participants.length);
        this.state.wolfId = this.state.participants[wolfIdx].id;
        for (let i = 0; i < this.state.participants.length; i++) {
          this.state.participants[i].assignedWord = i === wolfIdx ? pair[1] : pair[0];
        }
        break;
      }
      case 'association': {
        this.state.currentWord = ASSOCIATION_STARTERS[Math.floor(Math.random() * ASSOCIATION_STARTERS.length)];
        break;
      }
      case 'ng_word': {
        this.state.ngWord = NG_WORDS[Math.floor(Math.random() * NG_WORDS.length)];
        break;
      }
      case 'one_minute_speech': {
        this.state.speechTopic = SPEECH_TOPICS[Math.floor(Math.random() * SPEECH_TOPICS.length)];
        break;
      }
    }

    return this.state;
  }

  /**
   * ワードウルフ: 投票
   */
  vote(voterId: string, targetId: string): void {
    if (!this.state || this.state.type !== 'word_wolf') return;
    const voter = this.state.participants.find(p => p.id === voterId);
    if (voter) {
      voter.hasVoted = true;
      voter.votedForId = targetId;
    }

    // 全員投票済みなら結果発表
    if (this.state.participants.every(p => p.hasVoted)) {
      this.state.phase = 'reveal';
    }
  }

  /**
   * 連想ゲーム: 次のワードを設定
   */
  setNextWord(word: string): void {
    if (!this.state || this.state.type !== 'association') return;
    this.state.currentWord = word;
  }

  /**
   * 残り時間の確認
   */
  getRemainingSeconds(): number {
    if (!this.state || this.state.phase !== 'playing') return 0;
    const elapsed = (Date.now() - this.state.startedAt) / 1000;
    return Math.max(0, this.state.roundTimeSeconds - elapsed);
  }

  /**
   * 結果を取得
   */
  getResults(): { winnerId: string | null; wolfRevealed: boolean; scores: Array<{ id: string; score: number }> } | null {
    if (!this.state) return null;

    if (this.state.type === 'word_wolf' && this.state.wolfId) {
      // Count votes
      const votes = new Map<string, number>();
      for (const p of this.state.participants) {
        if (p.votedForId) {
          votes.set(p.votedForId, (votes.get(p.votedForId) || 0) + 1);
        }
      }
      const maxVotes = Math.max(...votes.values(), 0);
      const mostVoted = [...votes.entries()].find(([, v]) => v === maxVotes)?.[0] ?? null;
      const wolfCaught = mostVoted === this.state.wolfId;

      return {
        winnerId: wolfCaught ? null : this.state.wolfId,
        wolfRevealed: true,
        scores: this.state.participants.map(p => ({
          id: p.id,
          score: p.id === this.state!.wolfId
            ? (wolfCaught ? 0 : 3)
            : (wolfCaught ? 1 : 0),
        })),
      };
    }

    return {
      winnerId: null, wolfRevealed: false,
      scores: this.state.participants.map(p => ({ id: p.id, score: p.score })),
    };
  }

  getState(): GameState | null { return this.state; }
  isActive(): boolean { return this.state?.phase === 'playing'; }
  endGame(): void { if (this.state) this.state.phase = 'result'; }
}
