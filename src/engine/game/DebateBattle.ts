/**
 * kokoro — Debate Battle
 * 会話に「対立構造」を作る — ラジオバラエティの核心
 *
 * サイクル1: 2択バトルモード
 * - 参加者が2陣営に分かれる
 * - 各陣営が声で主張 → 声量/反応で勝敗判定
 * - 構造的な面白さ: 「意見が分かれる」から会話が生まれる
 */

export interface DebateConfig {
  topicA: string;
  topicB: string;
  emoji: string;
  durationSeconds: number;
}

export interface DebateState {
  config: DebateConfig;
  phase: 'choosing' | 'debating' | 'judging' | 'result';
  teamA: Set<string>;  // participant IDs
  teamB: Set<string>;
  scoreA: number;
  scoreB: number;
  startedAt: number;
  winner: 'A' | 'B' | 'draw' | null;
}

const DEBATE_TOPICS: DebateConfig[] = [
  { topicA: '朝型', topicB: '夜型', emoji: '🌅🌙', durationSeconds: 120 },
  { topicA: '犬派', topicB: '猫派', emoji: '🐕🐱', durationSeconds: 120 },
  { topicA: '夏が好き', topicB: '冬が好き', emoji: '☀️❄️', durationSeconds: 120 },
  { topicA: 'マンガ派', topicB: 'アニメ派', emoji: '📖📺', durationSeconds: 120 },
  { topicA: 'ご飯派', topicB: 'パン派', emoji: '🍚🍞', durationSeconds: 120 },
  { topicA: '都会暮らし', topicB: '田舎暮らし', emoji: '🏙️🌾', durationSeconds: 120 },
  { topicA: '電話派', topicB: 'テキスト派', emoji: '📞💬', durationSeconds: 120 },
  { topicA: '映画館', topicB: '家で配信', emoji: '🎬🛋️', durationSeconds: 120 },
];

export class DebateBattle {
  private state: DebateState | null = null;

  create(topicIndex?: number): DebateState {
    const idx = topicIndex ?? Math.floor(Math.random() * DEBATE_TOPICS.length);
    const config = DEBATE_TOPICS[idx % DEBATE_TOPICS.length];
    this.state = {
      config, phase: 'choosing',
      teamA: new Set(), teamB: new Set(),
      scoreA: 0, scoreB: 0, startedAt: 0, winner: null,
    };
    return this.state;
  }

  joinTeam(participantId: string, team: 'A' | 'B'): void {
    if (!this.state) return;
    this.state.teamA.delete(participantId);
    this.state.teamB.delete(participantId);
    if (team === 'A') this.state.teamA.add(participantId);
    else this.state.teamB.add(participantId);
  }

  start(): void {
    if (!this.state) return;
    this.state.phase = 'debating';
    this.state.startedAt = Date.now();
  }

  /** 話している人のチームにスコアを加算(声量に応じて) */
  addSpeechScore(participantId: string, volume: number): void {
    if (!this.state || this.state.phase !== 'debating') return;
    const points = Math.min(1, volume * 2);
    if (this.state.teamA.has(participantId)) this.state.scoreA += points;
    else if (this.state.teamB.has(participantId)) this.state.scoreB += points;
  }

  /** リアクションスコア(リスナーの支持) */
  addReactionScore(team: 'A' | 'B', points: number = 1): void {
    if (!this.state || this.state.phase !== 'debating') return;
    if (team === 'A') this.state.scoreA += points;
    else this.state.scoreB += points;
  }

  getRemainingSeconds(): number {
    if (!this.state || this.state.phase !== 'debating') return 0;
    const elapsed = (Date.now() - this.state.startedAt) / 1000;
    return Math.max(0, this.state.config.durationSeconds - elapsed);
  }

  judge(): 'A' | 'B' | 'draw' {
    if (!this.state) return 'draw';
    this.state.phase = 'result';
    if (this.state.scoreA > this.state.scoreB) this.state.winner = 'A';
    else if (this.state.scoreB > this.state.scoreA) this.state.winner = 'B';
    else this.state.winner = 'draw';
    return this.state.winner;
  }

  getState(): DebateState | null { return this.state; }
  static getTopics(): DebateConfig[] { return [...DEBATE_TOPICS]; }
}
