/**
 * kokoro — Conflict Resolution System
 * 対立を「エンタメ」に昇華 — ブロック以外の選択肢
 *
 * リサーチ結果:
 * - VRChat: モデレーターが介入するが、コミュニティ自治が理想
 * - 「ブロック」は最終手段。その前に「距離を取る」「第三者の仲介」
 * - 対立自体を会話のネタにする(ディベートモード切替)
 * 
 * 段階:
 * 1. クールダウン(双方ミュート30秒)
 * 2. 仲介AI(「お互いの意見をまとめると…」)
 * 3. ディベートモード切替(対立をゲーム化)
 * 4. ルーム分離(サブルームに別れる)
 */

export type ConflictStage = 'detected' | 'cooldown' | 'mediation' | 'debate_mode' | 'separation' | 'resolved';

export interface ConflictState {
  id: string;
  stage: ConflictStage;
  participantA: string;
  participantB: string;
  detectedAt: number;
  reason: string;
  resolution: string | null;
}

const MEDIATION_PROMPTS = [
  'お二人の意見、どちらも面白いですね。もう少し聞いてみましょう',
  'ちょっとだけ息抜きして、別の角度から考えてみませんか？',
  '「なるほど」って思ったポイントを教えてください',
  'この話題、ディベートバトルにしてみる？ 🎭',
];

export class ConflictResolutionSystem {
  private activeConflicts: Map<string, ConflictState> = new Map();

  /**
   * 対立を検知(声量の急増 + 声の被り)
   */
  detectConflict(participantA: string, participantB: string, signals: {
    volumeSpike: boolean;
    simultaneousSpeaking: boolean;
    durationSeconds: number;
  }): ConflictState | null {
    // 10秒以上、両者が同時に大きな声で話している
    if (!signals.volumeSpike || !signals.simultaneousSpeaking || signals.durationSeconds < 10) {
      return null;
    }

    const id = `conflict_${Date.now()}`;
    const conflict: ConflictState = {
      id, stage: 'detected',
      participantA, participantB,
      detectedAt: Date.now(),
      reason: '会話が白熱しています',
      resolution: null,
    };

    this.activeConflicts.set(id, conflict);
    return conflict;
  }

  /**
   * クールダウン: 双方を30秒ミュート
   */
  initiateCooldown(conflictId: string): { muteTargets: string[]; durationMs: number; message: string } | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    conflict.stage = 'cooldown';
    return {
      muteTargets: [conflict.participantA, conflict.participantB],
      durationMs: 30000,
      message: '💨 30秒だけクールダウンしましょう',
    };
  }

  /**
   * 仲介: AI mediator
   */
  mediate(conflictId: string): { message: string; options: string[] } | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    conflict.stage = 'mediation';
    const prompt = MEDIATION_PROMPTS[Math.floor(Math.random() * MEDIATION_PROMPTS.length)];

    return {
      message: prompt,
      options: [
        '🎭 ディベートモードに切り替える',
        '🤝 お互いの意見を聞く',
        '👋 そろそろ別の話題にする',
      ],
    };
  }

  /**
   * ディベートモード切替: 対立をゲーム化
   */
  switchToDebate(conflictId: string): { debateTopicFrom: string; teamA: string; teamB: string } | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    conflict.stage = 'debate_mode';
    conflict.resolution = 'ディベートに昇華';

    return {
      debateTopicFrom: conflict.reason,
      teamA: conflict.participantA,
      teamB: conflict.participantB,
    };
  }

  /**
   * ルーム分離
   */
  separate(conflictId: string): { subRoomA: string[]; subRoomB: string[] } | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    conflict.stage = 'separation';
    conflict.resolution = 'サブルームに分離';

    return {
      subRoomA: [conflict.participantA],
      subRoomB: [conflict.participantB],
    };
  }

  resolve(conflictId: string): void {
    const conflict = this.activeConflicts.get(conflictId);
    if (conflict) {
      conflict.stage = 'resolved';
      this.activeConflicts.delete(conflictId);
    }
  }

  getActiveConflicts(): ConflictState[] { return Array.from(this.activeConflicts.values()); }
}
