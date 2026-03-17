/**
 * cocoro — Avatar Expression Engine
 * 声の感情・抑揚・テンポからアバターの表情パラメータを生成
 * 
 * 反復136-140:
 * - 感情 → 表情ブレンドシェイプのターゲット値
 * - 声量 → 口の開き具合
 * - ピッチ → 目の開き具合
 * - 沈黙時 → ゆっくり瞬きアニメーション
 * = VRMのBlendShapeに直接マッピング可能な値を生成
 */

export interface ExpressionState {
  // 口
  mouthOpen: number;         // 0-1 声量に連動
  mouthSmile: number;        // -1 to 1 (negative = frown)
  
  // 目
  eyeWide: number;           // 0-1 驚き時
  eyeSquint: number;         // 0-1 笑い時
  eyeBlinkLeft: number;      // 0-1
  eyeBlinkRight: number;     // 0-1
  
  // 眉
  browRaise: number;         // 0-1 驚き/疑問時
  browFurrow: number;        // 0-1 怒り/集中時
  
  // 頭の動き
  headNodAmount: number;     // 相槌のうなずき量
  headTiltAmount: number;    // 傾き量
}

const BLINK_INTERVAL_MIN = 2000; // ms
const BLINK_INTERVAL_MAX = 6000;
const BLINK_DURATION = 150; // ms

export class AvatarExpressionEngine {
  private currentState: ExpressionState;
  private targetState: ExpressionState;
  private nextBlinkTime: number;
  private blinkPhase: 'none' | 'closing' | 'opening' = 'none';
  private blinkStartTime = 0;
  private lastUpdateTime = 0;

  constructor() {
    const neutral: ExpressionState = {
      mouthOpen: 0, mouthSmile: 0,
      eyeWide: 0, eyeSquint: 0, eyeBlinkLeft: 0, eyeBlinkRight: 0,
      browRaise: 0, browFurrow: 0,
      headNodAmount: 0, headTiltAmount: 0,
    };
    this.currentState = { ...neutral };
    this.targetState = { ...neutral };
    this.nextBlinkTime = Date.now() + this.randomBlinkDelay();
  }

  private randomBlinkDelay(): number {
    return BLINK_INTERVAL_MIN + Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN);
  }

  /**
   * 声の分析結果から表情ターゲットを計算
   */
  processVoice(params: {
    volume: number;          // 0-1
    isSpeaking: boolean;
    emotion: { joy: number; anger: number; sorrow: number; surprise: number };
    pitch?: number;          // Hz (optional, for eye width)
  }): void {
    const { volume, isSpeaking, emotion, pitch } = params;

    // === 口 ===
    this.targetState.mouthOpen = isSpeaking ? Math.min(1, volume * 1.5) : 0;
    
    // 笑顔: joyで上がる、angerで下がる
    this.targetState.mouthSmile = emotion.joy * 0.8 - emotion.anger * 0.3 - emotion.sorrow * 0.5;

    // === 目 ===
    // 驚き = 目を見開く
    this.targetState.eyeWide = emotion.surprise * 0.8;
    
    // 笑い = 目を細める
    this.targetState.eyeSquint = emotion.joy > 0.5 ? (emotion.joy - 0.5) * 2 * 0.6 : 0;

    // ピッチが高い = 目が開く（興奮）
    if (pitch && pitch > 300) {
      this.targetState.eyeWide = Math.max(this.targetState.eyeWide, Math.min(1, (pitch - 300) / 200 * 0.4));
    }

    // === 眉 ===
    this.targetState.browRaise = emotion.surprise * 0.7 + (emotion.joy > 0.7 ? 0.3 : 0);
    this.targetState.browFurrow = emotion.anger * 0.6 + (emotion.sorrow > 0.5 ? 0.3 : 0);

    // === 頭 ===
    // 聞いている時はゆっくりうなずき
    if (!isSpeaking && volume === 0) {
      this.targetState.headNodAmount = Math.sin(Date.now() / 2000) * 0.1;
    } else {
      this.targetState.headNodAmount = 0;
    }
    this.targetState.headTiltAmount = (emotion.joy - emotion.sorrow) * 0.1;
  }

  /**
   * フレーム更新: スムージング + 瞬き
   */
  update(): ExpressionState {
    const now = Date.now();
    const dt = Math.min(0.05, (now - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = now;

    // Smooth interpolation
    const smoothSpeed = 8; // higher = faster tracking
    const keys = Object.keys(this.currentState) as (keyof ExpressionState)[];
    for (const key of keys) {
      if (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') continue; // Blink handled separately
      const curr = this.currentState[key];
      const target = this.targetState[key];
      this.currentState[key] = curr + (target - curr) * Math.min(1, smoothSpeed * dt);
    }

    // === 瞬きシステム ===
    if (this.blinkPhase === 'none' && now >= this.nextBlinkTime) {
      this.blinkPhase = 'closing';
      this.blinkStartTime = now;
    }

    if (this.blinkPhase === 'closing') {
      const progress = (now - this.blinkStartTime) / (BLINK_DURATION / 2);
      if (progress >= 1) {
        this.blinkPhase = 'opening';
        this.blinkStartTime = now;
        this.currentState.eyeBlinkLeft = 1;
        this.currentState.eyeBlinkRight = 1;
      } else {
        this.currentState.eyeBlinkLeft = progress;
        this.currentState.eyeBlinkRight = progress;
      }
    } else if (this.blinkPhase === 'opening') {
      const progress = (now - this.blinkStartTime) / (BLINK_DURATION / 2);
      if (progress >= 1) {
        this.blinkPhase = 'none';
        this.nextBlinkTime = now + this.randomBlinkDelay();
        this.currentState.eyeBlinkLeft = 0;
        this.currentState.eyeBlinkRight = 0;
      } else {
        this.currentState.eyeBlinkLeft = 1 - progress;
        this.currentState.eyeBlinkRight = 1 - progress;
      }
    }

    return { ...this.currentState };
  }

  /**
   * リセット
   */
  reset(): void {
    const neutral: ExpressionState = {
      mouthOpen: 0, mouthSmile: 0,
      eyeWide: 0, eyeSquint: 0, eyeBlinkLeft: 0, eyeBlinkRight: 0,
      browRaise: 0, browFurrow: 0,
      headNodAmount: 0, headTiltAmount: 0,
    };
    this.currentState = { ...neutral };
    this.targetState = { ...neutral };
  }
}
