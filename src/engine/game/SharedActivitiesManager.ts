/**
 * cocoro — Shared Activities Manager
 * 会話以外の「一緒にやること」— エンタメ化の本丸
 *
 * リサーチ結果:
 * - 「ただ話す」だけでは15分で沈黙が来る
 * - VRChat成功 = 共有アクティビティ(ゲーム/音楽/お絵描き)
 * - 「一緒に何かをした結果、会話が生まれる」が自然
 * 
 * 5つのアクティビティ:
 * 1. ワードウルフ(言葉当て)
 * 2. 連想ゲーム
 * 3. BGMジュークボックス(みんなで選曲)
 * 4. お絵描きリレー
 * 5. 2択バトル
 */

export type ActivityType = 'word_wolf' | 'association_game' | 'jukebox' | 'drawing_relay' | 'this_or_that';

export interface Activity {
  type: ActivityType;
  name: string;
  emoji: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
}

const ACTIVITIES: Activity[] = [
  {
    type: 'word_wolf', name: 'ワードウルフ', emoji: '🐺',
    description: '全員に同じお題が配られるけど、1人だけ違うお題！ 誰がウルフ？',
    minPlayers: 3, maxPlayers: 8, durationMinutes: 5,
  },
  {
    type: 'association_game', name: '連想ゲーム', emoji: '💭',
    description: '前の人の言葉から連想して次の言葉を！ テンポよく回そう',
    minPlayers: 2, maxPlayers: 12, durationMinutes: 3,
  },
  {
    type: 'jukebox', name: 'みんなのジュークボックス', emoji: '🎵',
    description: 'テーマに合う曲をみんなで選んで投票！ 1位の曲がBGMに',
    minPlayers: 2, maxPlayers: 16, durationMinutes: 5,
  },
  {
    type: 'drawing_relay', name: 'お絵描きリレー', emoji: '🎨',
    description: '前の人の絵に10秒だけ描き足す！ 最後にどんな絵ができる？',
    minPlayers: 3, maxPlayers: 8, durationMinutes: 5,
  },
  {
    type: 'this_or_that', name: '2択バトル', emoji: '⚡',
    description: '犬派 vs 猫派！ みんなの答えを見ながらワイワイ議論',
    minPlayers: 2, maxPlayers: 16, durationMinutes: 3,
  },
];

// ワードウルフのお題セット
const WORD_WOLF_TOPICS = [
  { majority: 'ラーメン', minority: 'うどん' },
  { majority: '犬', minority: '猫' },
  { majority: '夏', minority: '冬' },
  { majority: 'Twitter', minority: 'Instagram' },
  { majority: '東京', minority: '大阪' },
  { majority: 'コーヒー', minority: '紅茶' },
  { majority: '映画', minority: 'ドラマ' },
  { majority: 'ディズニーランド', minority: 'USJ' },
];

// 2択バトルのお題
const THIS_OR_THAT_TOPICS = [
  { a: '朝型', b: '夜型' },
  { a: '海', b: '山' },
  { a: '甘党', b: '辛党' },
  { a: '都会', b: '田舎' },
  { a: 'インドア', b: 'アウトドア' },
  { a: 'Android', b: 'iPhone' },
  { a: '電話', b: 'テキスト' },
  { a: '漫画', b: 'アニメ' },
];

export interface ActiveActivity {
  activity: Activity;
  state: 'preparing' | 'playing' | 'finished';
  startedAt: number;
  participants: string[];
  data: Record<string, unknown>;
}

export class SharedActivitiesManager {
  private current: ActiveActivity | null = null;

  /**
   * アクティビティカタログ
   */
  static getAvailable(playerCount: number): Activity[] {
    return ACTIVITIES.filter(a => playerCount >= a.minPlayers && playerCount <= a.maxPlayers);
  }

  /**
   * アクティビティ開始
   */
  start(type: ActivityType, participants: string[]): ActiveActivity | null {
    const activity = ACTIVITIES.find(a => a.type === type);
    if (!activity) return null;
    if (participants.length < activity.minPlayers) return null;

    const data: Record<string, unknown> = {};

    if (type === 'word_wolf') {
      const topic = WORD_WOLF_TOPICS[Math.floor(Math.random() * WORD_WOLF_TOPICS.length)];
      const wolfIndex = Math.floor(Math.random() * participants.length);
      data.topic = topic;
      data.wolfIndex = wolfIndex;
      data.assignments = participants.map((_, i) => i === wolfIndex ? topic.minority : topic.majority);
    }

    if (type === 'this_or_that') {
      data.topic = THIS_OR_THAT_TOPICS[Math.floor(Math.random() * THIS_OR_THAT_TOPICS.length)];
      data.votes = {};
    }

    if (type === 'association_game') {
      data.words = [];
      data.currentTurn = 0;
    }

    this.current = {
      activity, state: 'playing',
      startedAt: Date.now(), participants,
      data,
    };

    return this.current;
  }

  /**
   * ワードウルフ: 投票
   */
  voteWolf(voterId: string, suspectId: string): void {
    if (!this.current || this.current.activity.type !== 'word_wolf') return;
    const votes = (this.current.data.votes || {}) as Record<string, string>;
    votes[voterId] = suspectId;
    this.current.data.votes = votes;
  }

  /**
   * 連想ゲーム: 回答
   */
  addAssociationWord(word: string): void {
    if (!this.current || this.current.activity.type !== 'association_game') return;
    (this.current.data.words as string[]).push(word);
    this.current.data.currentTurn = ((this.current.data.currentTurn as number) + 1) % this.current.participants.length;
  }

  /**
   * 2択バトル: 投票
   */
  voteThisOrThat(participantId: string, choice: 'a' | 'b'): void {
    if (!this.current || this.current.activity.type !== 'this_or_that') return;
    (this.current.data.votes as Record<string, string>)[participantId] = choice;
  }

  finish(): ActiveActivity | null {
    if (!this.current) return null;
    this.current.state = 'finished';
    const result = this.current;
    this.current = null;
    return result;
  }

  getCurrent(): ActiveActivity | null { return this.current; }
  isPlaying(): boolean { return this.current?.state === 'playing'; }
}
