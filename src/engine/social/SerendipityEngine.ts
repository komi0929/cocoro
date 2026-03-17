/**
 * cocoro — Serendipity Engine
 * 社会的発見 — 「フィルターバブルを破る偶然の出会い」
 *
 * リサーチ結果:
 * - Facebook「People You May Know」= mutual connections + shared attributes
 * - セレンディピティ設計: 予測可能性を意図的に壊す
 * - TikTok成功 = 「知らない人のコンテンツが流れる」AI駆動のセレンディピティ
 * - 対策: 「おまかせ入室」を超えた「出会いのアルゴリズム」
 */

export interface UserNode {
  id: string;
  interests: string[];
  recentTopics: string[];
  friendIds: string[];
  visitedRoomIds: string[];
  personalityTraits: ('introvert' | 'extrovert' | 'creative' | 'analytical' | 'social')[];
  activeHours: number[];
  language: string;
}

export interface MatchResult {
  userId: string;
  score: number;
  reason: string;
  isSerendipitous: boolean;   // 意図的な「偶然」
}

export class SerendipityEngine {
  /**
   * フレンド推薦(Graph + Serendipity)
   */
  recommendConnections(user: UserNode, candidates: UserNode[]): MatchResult[] {
    const results: MatchResult[] = [];

    for (const candidate of candidates) {
      if (candidate.id === user.id) continue;
      if (user.friendIds.includes(candidate.id)) continue;

      let score = 0;
      let reason = '';
      let isSerendipitous = false;

      // 1. Mutual Friends (30%)
      const mutualFriends = user.friendIds.filter(f => candidate.friendIds.includes(f));
      if (mutualFriends.length > 0) {
        score += Math.min(30, mutualFriends.length * 10);
        reason = `共通のフレンドが${mutualFriends.length}人`;
      }

      // 2. Shared Interests (25%)
      const sharedInterests = user.interests.filter(i => candidate.interests.includes(i));
      if (sharedInterests.length > 0) {
        score += Math.min(25, sharedInterests.length * 8);
        if (!reason) reason = `${sharedInterests[0]}が共通`;
      }

      // 3. Same Room History (20%)
      const sharedRooms = user.visitedRoomIds.filter(r => candidate.visitedRoomIds.includes(r));
      if (sharedRooms.length > 0) {
        score += Math.min(20, sharedRooms.length * 5);
        if (!reason) reason = '同じルームにいたことがある';
      }

      // 4. Similar Active Hours (15%)
      const sharedHours = user.activeHours.filter(h => candidate.activeHours.includes(h));
      if (sharedHours.length > 0) {
        score += Math.min(15, sharedHours.length * 3);
      }

      // 5. Serendipity Factor (10%) — 意図的に「全く違う人」を混ぜる
      // 「自分と全く違うが、面白そうな人」を20%の確率で推薦
      if (Math.random() < 0.2 && score < 30) {
        const oppositeTrait = this.findOppositeTrait(user, candidate);
        if (oppositeTrait) {
          score = 50; // 強制的に高スコア
          reason = oppositeTrait;
          isSerendipitous = true;
        }
      }

      if (score > 15) {
        results.push({
          userId: candidate.id, score,
          reason: reason || 'おすすめ', isSerendipitous,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * ルーム推薦(セレンディピティ付き)
   */
  recommendRooms(user: UserNode, rooms: Array<{ id: string; category: string; tags: string[]; participantCount: number }>): Array<{ roomId: string; score: number; reason: string; isSerendipitous: boolean }> {
    return rooms.map(room => {
      let score = 0;
      let reason = '';
      let isSerendipitous = false;

      // Interest match
      const tagMatch = room.tags.filter(t => user.interests.includes(t));
      if (tagMatch.length > 0) {
        score += tagMatch.length * 15;
        reason = `${tagMatch[0]}に興味があるあなたへ`;
      }

      // Participant count sweet spot
      if (room.participantCount >= 3 && room.participantCount <= 6) {
        score += 20;
      }

      // Serendipity: 15%の確率で全く新しいジャンルを推薦
      if (Math.random() < 0.15 && !user.visitedRoomIds.includes(room.id)) {
        score += 40;
        reason = '🎲 新しい出会いがあるかも';
        isSerendipitous = true;
      }

      return { roomId: room.id, score, reason: reason || 'おすすめ', isSerendipitous };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * 「正反対な魅力」を見つける
   */
  private findOppositeTrait(user: UserNode, candidate: UserNode): string | null {
    if (user.personalityTraits.includes('introvert') && candidate.personalityTraits.includes('extrovert')) {
      return '🔀 あなたと違うタイプの人と話してみない？';
    }
    if (user.personalityTraits.includes('creative') && candidate.personalityTraits.includes('analytical')) {
      return '🔀 異なる視点を持つ人との出会い';
    }
    // Topic-based serendipity
    const newTopics = candidate.recentTopics.filter(t => !user.recentTopics.includes(t));
    if (newTopics.length > 0) {
      return `🔀 「${newTopics[0]}」について詳しい人`;
    }
    return null;
  }
}
