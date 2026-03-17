/**
 * cocoro — Whisper Mode
 * 空間内で2人だけの声 — 親密さの演出
 *
 * サイクル28: 1対1の親密コミュニケーション
 * - ささやきモード: 特定の相手だけに声が聞こえる
 * - 空間音響: 他の人にはBGMに紛れて聞こえない
 * - ビジュアル: 2人のアバター間に細いラインが引かれる
 * - プライバシー: ささやき中は他参加者に「ささやき中」表示
 * = popopoにできない「空間ならでは」の体験
 */

export interface WhisperState {
  isActive: boolean;
  targetId: string | null;
  targetName: string | null;
  startedAt: number;
  durationSeconds: number;
}

export class WhisperMode {
  private state: WhisperState = {
    isActive: false, targetId: null, targetName: null,
    startedAt: 0, durationSeconds: 0,
  };
  private onChangeCallbacks: Array<(state: WhisperState) => void> = [];

  /**
   * ささやき開始
   */
  start(targetId: string, targetName: string): void {
    this.state = {
      isActive: true, targetId, targetName,
      startedAt: Date.now(), durationSeconds: 0,
    };
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([5, 10, 5]);
    }
    this.notifyChange();
  }

  /**
   * ささやき終了
   */
  stop(): void {
    this.state = {
      isActive: false, targetId: null, targetName: null,
      startedAt: 0, durationSeconds: 0,
    };
    this.notifyChange();
  }

  /**
   * フレーム更新
   */
  update(): WhisperState {
    if (this.state.isActive) {
      this.state.durationSeconds = (Date.now() - this.state.startedAt) / 1000;
    }
    return { ...this.state };
  }

  /**
   * 音声フィルタリング:
   * この関数がtrueを返す場合のみ、senderId→receiverIdの音声を通す
   */
  shouldPassAudio(senderId: string, receiverId: string, myId: string): boolean {
    if (!this.state.isActive) return true; // ささやきモードじゃなければ全通し

    // 自分がささやき中の場合
    if (this.state.targetId) {
      // 自分→ターゲット or ターゲット→自分 のみ通す
      const isWhisperPair =
        (senderId === myId && receiverId === this.state.targetId) ||
        (senderId === this.state.targetId && receiverId === myId);
      return isWhisperPair;
    }

    return true;
  }

  /**
   * 他参加者に表示するステータス
   */
  getPublicStatus(myId: string): { isWhispering: boolean; withName: string | null } {
    if (!this.state.isActive) return { isWhispering: false, withName: null };
    return { isWhispering: true, withName: this.state.targetName };
  }

  isActive(): boolean { return this.state.isActive; }
  getTargetId(): string | null { return this.state.targetId; }
  getState(): WhisperState { return { ...this.state }; }

  onChange(fn: (state: WhisperState) => void): () => void {
    this.onChangeCallbacks.push(fn);
    return () => { this.onChangeCallbacks = this.onChangeCallbacks.filter(f => f !== fn); };
  }

  private notifyChange(): void {
    for (const fn of this.onChangeCallbacks) fn({ ...this.state });
  }
}
