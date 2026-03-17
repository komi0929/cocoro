/**
 * kokoro — Conversation Topic Engine
 * 「何を話せばいいかわからない」を完全排除する
 *
 * 反復311-320:
 * - 時間帯/参加者数/沈黙/フェーズに応じてトピックを自動提案
 * - 「今日のお題」機能 — 入室した瞬間テーマが表示される
 * - 「2択チャレンジ」— 声で答える簡単なお題
 * - カテゴリ: 日常/趣味/もしも/深い話/ゲーム
 * = 「会話のきっかけ」を空間が自動的に提供する
 */

export type TopicCategory = 'daily' | 'hobby' | 'icebreaker' | 'deep' | 'challenge' | 'game';

export interface Topic {
  id: string;
  category: TopicCategory;
  text: string;
  emoji: string;
  /** 2択の場合の選択肢 */
  choices?: [string, string];
  /** 何人以上で出すか */
  minParticipants: number;
  /** 時間帯制限 (null = 常時) */
  timeRestriction: 'morning' | 'afternoon' | 'evening' | 'night' | null;
}

// ===== Topic Database =====

const TOPICS: Topic[] = [
  // --- Daily (日常) ---
  { id: 'd1', category: 'daily', text: '今日あった一番いいことは？', emoji: '✨', minParticipants: 1, timeRestriction: 'evening' },
  { id: 'd2', category: 'daily', text: '最近ハマっている食べ物は？', emoji: '🍜', minParticipants: 1, timeRestriction: null },
  { id: 'd3', category: 'daily', text: '週末の予定は？', emoji: '📅', minParticipants: 1, timeRestriction: null },
  { id: 'd4', category: 'daily', text: '最近見た面白い動画は？', emoji: '📱', minParticipants: 1, timeRestriction: null },
  { id: 'd5', category: 'daily', text: '朝ごはん何食べた？', emoji: '🥐', minParticipants: 1, timeRestriction: 'morning' },
  { id: 'd6', category: 'daily', text: '最近買ってよかったものは？', emoji: '🛍️', minParticipants: 1, timeRestriction: null },
  { id: 'd7', category: 'daily', text: '今日のBGMにするなら何の曲？', emoji: '🎵', minParticipants: 1, timeRestriction: null },
  { id: 'd8', category: 'daily', text: '最近行った場所で一番よかったところは？', emoji: '🗺️', minParticipants: 1, timeRestriction: null },

  // --- Icebreaker (アイスブレイク) ---
  { id: 'i1', category: 'icebreaker', text: 'ペット飼ってる？飼うならどんな動物？', emoji: '🐱', minParticipants: 2, timeRestriction: null },
  { id: 'i2', category: 'icebreaker', text: '好きな季節は？', emoji: '🌸', minParticipants: 2, timeRestriction: null },
  { id: 'i3', category: 'icebreaker', text: 'カラオケの十八番は？', emoji: '🎤', minParticipants: 2, timeRestriction: null },
  { id: 'i4', category: 'icebreaker', text: '旅行するなら海と山どっち？', emoji: '⛰️', choices: ['海', '山'], minParticipants: 2, timeRestriction: null },
  { id: 'i5', category: 'icebreaker', text: '自分を動物に例えると？', emoji: '🦊', minParticipants: 2, timeRestriction: null },
  { id: 'i6', category: 'icebreaker', text: '子供の頃の夢は？', emoji: '👶', minParticipants: 2, timeRestriction: null },

  // --- 2択チャレンジ ---
  { id: 'c1', category: 'challenge', text: '朝型？夜型？', emoji: '🌅', choices: ['朝型', '夜型'], minParticipants: 2, timeRestriction: null },
  { id: 'c2', category: 'challenge', text: 'インドア派？アウトドア派？', emoji: '🏕️', choices: ['インドア', 'アウトドア'], minParticipants: 2, timeRestriction: null },
  { id: 'c3', category: 'challenge', text: '犬派？猫派？', emoji: '🐕', choices: ['犬', '猫'], minParticipants: 2, timeRestriction: null },
  { id: 'c4', category: 'challenge', text: '夏と冬、どっちが好き？', emoji: '☀️', choices: ['夏', '冬'], minParticipants: 2, timeRestriction: null },
  { id: 'c5', category: 'challenge', text: 'ご飯派？パン派？', emoji: '🍚', choices: ['ご飯', 'パン'], minParticipants: 2, timeRestriction: null },
  { id: 'c6', category: 'challenge', text: '映画は映画館派？家派？', emoji: '🎬', choices: ['映画館', '家'], minParticipants: 2, timeRestriction: null },

  // --- もしも/深い話 ---
  { id: 'dp1', category: 'deep', text: '100万円もらったら何に使う？', emoji: '💰', minParticipants: 2, timeRestriction: 'night' },
  { id: 'dp2', category: 'deep', text: '10年前の自分にアドバイスするなら？', emoji: '⏳', minParticipants: 2, timeRestriction: 'night' },
  { id: 'dp3', category: 'deep', text: 'どこでもドアがあったらどこに行く？', emoji: '🚪', minParticipants: 2, timeRestriction: null },
  { id: 'dp4', category: 'deep', text: '人生で一番影響を受けた作品は？', emoji: '📕', minParticipants: 2, timeRestriction: 'night' },
  { id: 'dp5', category: 'deep', text: '明日世界が終わるとしたら今日何する？', emoji: '🌍', minParticipants: 2, timeRestriction: 'night' },

  // --- ゲーム系 ---
  { id: 'g1', category: 'game', text: '連想ゲーム！最初のお題は「桜」→', emoji: '🎮', minParticipants: 3, timeRestriction: null },
  { id: 'g2', category: 'game', text: '「〇〇といえば？」ゲーム！お題: 日本', emoji: '🗾', minParticipants: 3, timeRestriction: null },
  { id: 'g3', category: 'game', text: 'NGワードゲーム！「でも」を禁止！', emoji: '🚫', minParticipants: 3, timeRestriction: null },
  { id: 'g4', category: 'game', text: '1分間スピーチ！お題: 「私の推し」', emoji: '⏱️', minParticipants: 2, timeRestriction: null },
];

// ===== Engine =====

export class ConversationTopicEngine {
  private usedTopicIds: Set<string> = new Set();
  private currentTopic: Topic | null = null;
  private lastTopicTime = 0;
  private readonly TOPIC_INTERVAL = 180000; // 3分

  /**
   * 現在の状況に最適なトピックを取得
   */
  suggest(params: {
    participantCount: number;
    silenceDurationSeconds: number;
    sessionDurationSeconds: number;
    category?: TopicCategory;
  }): Topic | null {
    const now = Date.now();
    const { participantCount, silenceDurationSeconds, sessionDurationSeconds, category } = params;

    // 前のトピックからの間隔チェック
    if (this.currentTopic && now - this.lastTopicTime < this.TOPIC_INTERVAL
        && silenceDurationSeconds < 30) {
      return this.currentTopic;
    }

    // 沈黙が15秒以上 or セッション開始直後(10秒以内)
    const shouldSuggest = silenceDurationSeconds >= 15 || sessionDurationSeconds < 10;
    if (!shouldSuggest && this.currentTopic) return this.currentTopic;

    // 時間帯
    const hour = new Date().getHours();
    const timeOfDay: Topic['timeRestriction'] =
      hour >= 5 && hour < 12 ? 'morning' :
      hour >= 12 && hour < 17 ? 'afternoon' :
      hour >= 17 && hour < 21 ? 'evening' : 'night';

    // フィルタリング
    const candidates = TOPICS.filter(t => {
      if (this.usedTopicIds.has(t.id)) return false;
      if (t.minParticipants > participantCount) return false;
      if (t.timeRestriction && t.timeRestriction !== timeOfDay) return false;
      if (category && t.category !== category) return false;
      return true;
    });

    if (candidates.length === 0) {
      // リセットして再開
      this.usedTopicIds.clear();
      return this.suggest(params);
    }

    // セッション序盤はアイスブレイク/2択チャレンジ優先
    let pool = candidates;
    if (sessionDurationSeconds < 120) {
      const easy = candidates.filter(t => t.category === 'icebreaker' || t.category === 'challenge');
      if (easy.length > 0) pool = easy;
    }

    // ランダム選択
    const topic = pool[Math.floor(Math.random() * pool.length)];
    this.currentTopic = topic;
    this.usedTopicIds.add(topic.id);
    this.lastTopicTime = now;

    return topic;
  }

  /**
   * 次のトピックに進む
   */
  next(params: Parameters<ConversationTopicEngine['suggest']>[0]): Topic | null {
    this.currentTopic = null;
    return this.suggest(params);
  }

  /**
   * 特定カテゴリのトピックを取得
   */
  getByCategory(category: TopicCategory): Topic[] {
    return TOPICS.filter(t => t.category === category);
  }

  getCurrent(): Topic | null { return this.currentTopic; }
}
