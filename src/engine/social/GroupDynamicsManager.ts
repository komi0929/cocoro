/**
 * kokoro — Group Dynamics Manager
 * 最適会話人数を自動管理 — グループ心理学の知見
 *
 * リサーチ結果: 
 * - 最適会話人数は3-4人、最大5人
 * - 5人超で「会話オーバーロード」が発生 → 一部が黙る
 * - Social Loafing(社会的手抜き): グループが大きいほど個人の貢献が減る
 * - 対策: サブグループ自動分割 + 役割付与 + 貢献可視化
 */

export interface GroupState {
  totalParticipants: number;
  activeSpeakers: number;
  silentDuration: Map<string, number>;  // participantId → 沈黙秒数
  talkTimeDistribution: Map<string, number>; // participantId → 発話割合
  subgroups: string[][];
  isOverloaded: boolean;
  suggestedAction: string | null;
}

export interface GroupRecommendation {
  shouldSplit: boolean;
  suggestedGroupSize: number;
  splitReason: string | null;
  roles: Map<string, 'host' | 'speaker' | 'reactor' | 'observer'>;
  engagementAlert: { participantId: string; silentMinutes: number }[];
}

export class GroupDynamicsManager {
  private talkTime: Map<string, number> = new Map();
  private silenceTime: Map<string, number> = new Map();
  private lastActivity: Map<string, number> = new Map();
  private participantCount = 0;

  // 心理学研究に基づく定数
  private readonly OPTIMAL_SIZE = 4;
  private readonly MAX_EFFECTIVE_SIZE = 6;
  private readonly SPLIT_THRESHOLD = 8;
  private readonly SILENCE_ALERT_SECONDS = 120;

  /**
   * 参加者の発話状態を更新
   */
  updateParticipant(participantId: string, isSpeaking: boolean, deltaSeconds: number): void {
    if (isSpeaking) {
      this.talkTime.set(participantId, (this.talkTime.get(participantId) || 0) + deltaSeconds);
      this.silenceTime.set(participantId, 0);
      this.lastActivity.set(participantId, Date.now());
    } else {
      this.silenceTime.set(participantId, (this.silenceTime.get(participantId) || 0) + deltaSeconds);
    }
  }

  setParticipantCount(count: number): void { this.participantCount = count; }

  /**
   * グループ状態を分析
   */
  analyze(): GroupRecommendation {
    const roles = new Map<string, 'host' | 'speaker' | 'reactor' | 'observer'>();
    const engagementAlert: GroupRecommendation['engagementAlert'] = [];

    // 発話量トップ2 = speaker、沈黙2分以上 = observer
    const sorted = Array.from(this.talkTime.entries())
      .sort(([, a], [, b]) => b - a);

    sorted.forEach(([id], i) => {
      if (i === 0) roles.set(id, 'host');
      else if (i < 2) roles.set(id, 'speaker');
      else roles.set(id, 'reactor');
    });

    // 沈黙アラート
    for (const [id, seconds] of this.silenceTime.entries()) {
      if (seconds > this.SILENCE_ALERT_SECONDS) {
        roles.set(id, 'observer');
        engagementAlert.push({ participantId: id, silentMinutes: Math.floor(seconds / 60) });
      }
    }

    // サブグループ分割判定
    const shouldSplit = this.participantCount > this.MAX_EFFECTIVE_SIZE;
    let splitReason: string | null = null;

    if (this.participantCount > this.SPLIT_THRESHOLD) {
      splitReason = `${this.participantCount}人は会話が分散しやすいです。${this.OPTIMAL_SIZE}人ずつのグループに分けますか？`;
    } else if (shouldSplit) {
      splitReason = '人数が多くなってきました。小グループに分けると全員が話しやすくなります';
    }

    return {
      shouldSplit,
      suggestedGroupSize: this.OPTIMAL_SIZE,
      splitReason,
      roles,
      engagementAlert,
    };
  }

  /**
   * 会話の均等性スコア (0=完全不均等, 1=完全均等)
   */
  getEqualityScore(): number {
    const values = Array.from(this.talkTime.values());
    if (values.length < 2) return 1;
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return 1;
    const ideal = total / values.length;
    const deviation = values.reduce((sum, v) => sum + Math.abs(v - ideal), 0) / total;
    return Math.max(0, 1 - deviation);
  }

  /**
   * 黙っている人に話を振る提案
   */
  getSilentParticipantPrompt(): { participantId: string; suggestion: string } | null {
    for (const [id, seconds] of this.silenceTime.entries()) {
      if (seconds > 60 && seconds < 180) {
        return {
          participantId: id,
          suggestion: '話を振ってみましょう 💬',
        };
      }
    }
    return null;
  }

  removeParticipant(id: string): void {
    this.talkTime.delete(id);
    this.silenceTime.delete(id);
    this.lastActivity.delete(id);
  }
}
