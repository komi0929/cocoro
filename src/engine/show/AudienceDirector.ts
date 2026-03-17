/**
 * cocoro — AudienceDirector
 * ROM(聴き専)を**観客として番組に参加**させるエンジン
 *
 * Clubhouseの教訓: 聴き専が何もできない→離脱
 * TikTok Liveから学ぶ: ギフト/コメント/投票で参加感
 * cocoro独自: アバターが観客席でライトスティック振る
 *
 * 機能:
 * 1. ライトスティック(色でムード投票)
 * 2. ウェーブ(全員同時にアバター動作)
 * 3. 「もっと聞きたい！」投票
 * 4. 拍手メーター(タップ連打→盛り上がり)
 * 5. 「退場/入場」演出
 * 6. 観客席からのステージ指名
 */

export type LightstickColor = 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'white' | 'rainbow';

export type AudienceAction =
  | 'lightstick'     // ライトスティック振る
  | 'clap'           // 拍手
  | 'wave'           // ウェーブ
  | 'cheer'          // 歓声
  | 'boo'            // ブーイング(ユーモア)
  | 'encore'         // アンコール
  | 'nominate';      // ステージ指名

export interface AudienceState {
  // ライトスティック集計
  lightstickCounts: Record<LightstickColor, number>;
  dominantColor: LightstickColor;
  // 拍手メーター
  clapIntensity: number; // 0-1
  clapCombo: number;
  // ウェーブ
  waveActive: boolean;
  wavePhase: number; // 0-1
  // 投票
  encoreVotes: Map<string, number>; // participantId → vote count
  // イベントログ
  recentActions: { userId: string; action: AudienceAction; data?: unknown; ts: number }[];
  // 全体
  totalAudienceCount: number;
  activeAudienceCount: number; // 直近30秒にアクション
  engagementRate: number; // active / total
}

export class AudienceDirector {
  private state: AudienceState;
  private clapTimestamps: number[] = [];
  private lastActivityMap: Map<string, number> = new Map();

  constructor() {
    this.state = {
      lightstickCounts: { red: 0, blue: 0, green: 0, yellow: 0, pink: 0, white: 0, rainbow: 0 },
      dominantColor: 'white',
      clapIntensity: 0,
      clapCombo: 0,
      waveActive: false,
      wavePhase: 0,
      encoreVotes: new Map(),
      recentActions: [],
      totalAudienceCount: 0,
      activeAudienceCount: 0,
      engagementRate: 0,
    };
  }

  /** 観客アクション受信 */
  receiveAction(userId: string, action: AudienceAction, data?: unknown): void {
    this.state.recentActions.push({ userId, action, data, ts: Date.now() });
    if (this.state.recentActions.length > 200) this.state.recentActions = this.state.recentActions.slice(-100);
    this.lastActivityMap.set(userId, Date.now());

    switch (action) {
      case 'lightstick': {
        const color = (data as LightstickColor) || 'white';
        this.state.lightstickCounts[color] = (this.state.lightstickCounts[color] ?? 0) + 1;
        this.updateDominantColor();
        break;
      }
      case 'clap':
        this.clapTimestamps.push(Date.now());
        this.state.clapCombo++;
        break;
      case 'wave':
        if (!this.state.waveActive) {
          this.state.waveActive = true;
          this.state.wavePhase = 0;
        }
        break;
      case 'encore': {
        const targetId = data as string;
        if (targetId) {
          this.state.encoreVotes.set(targetId, (this.state.encoreVotes.get(targetId) ?? 0) + 1);
        }
        break;
      }
    }
  }

  /** フレーム更新 */
  update(totalAudience: number): AudienceState {
    this.state.totalAudienceCount = totalAudience;

    // Clap intensity (RPS: reacts per second)
    const now = Date.now();
    this.clapTimestamps = this.clapTimestamps.filter(t => now - t < 3000);
    const clapsPerSec = this.clapTimestamps.length / 3;
    this.state.clapIntensity = Math.min(1, clapsPerSec / 10);

    // Combo decay
    if (this.clapTimestamps.length === 0) {
      this.state.clapCombo = Math.max(0, this.state.clapCombo - 1);
    }

    // Wave animation
    if (this.state.waveActive) {
      this.state.wavePhase += 0.02;
      if (this.state.wavePhase >= 1) {
        this.state.waveActive = false;
        this.state.wavePhase = 0;
      }
    }

    // Active audience
    let activeCount = 0;
    this.lastActivityMap.forEach((lastTs) => {
      if (now - lastTs < 30000) activeCount++;
    });
    this.state.activeAudienceCount = activeCount;
    this.state.engagementRate = totalAudience > 0 ? activeCount / totalAudience : 0;

    return { ...this.state };
  }

  /** ライトスティックリセット(新しい投票) */
  resetLightsticks(): void {
    Object.keys(this.state.lightstickCounts).forEach(k => {
      this.state.lightstickCounts[k as LightstickColor] = 0;
    });
  }

  /** アンコール最多得票者 */
  getEncoreWinner(): { participantId: string; votes: number } | null {
    let maxVotes = 0;
    let winner: string | null = null;
    this.state.encoreVotes.forEach((votes, pid) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = pid;
      }
    });
    return winner ? { participantId: winner, votes: maxVotes } : null;
  }

  private updateDominantColor(): void {
    const counts = this.state.lightstickCounts;
    let max = 0;
    let dominant: LightstickColor = 'white';
    (Object.entries(counts) as [LightstickColor, number][]).forEach(([color, count]) => {
      if (count > max) {
        max = count;
        dominant = color;
      }
    });
    this.state.dominantColor = dominant;
  }

  getState(): AudienceState { return { ...this.state }; }
}
