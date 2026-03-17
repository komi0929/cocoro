/**
 * cocoro — Voice Gesture Engine
 * 声で自動的にジェスチャーする — アバターに命を吹き込む
 *
 * サイクル21: 声のトーン/リズムからアバターのジェスチャーを自動生成
 * - ピッチ上昇 → 手を上げるジェスチャー
 * - 声量増加 → 前のめりになる
 * - 笑い声 → 体を揺らす + 表情変化
 * - 質問の口調(ピッチ末尾上昇) → 首を傾げる
 * - 早口 → 手振りが増える
 * = VRChatの「表現力」をスマホでカメラなしで実現
 */

export interface VoiceGestureOutput {
  headTilt: number;        // -30 to 30 degrees
  headNod: number;         // 0-1
  bodyLean: number;        // -0.3 to 0.3
  handRaise: number;       // 0-1
  bodyShake: number;       // 0-1 (laugh)
  gestureSpeed: number;    // 0.5-2.0
  expressionIntensity: number; // 0-1
}

interface VoiceFeatures {
  pitch: number;
  prevPitch: number;
  volume: number;
  isSpeaking: boolean;
  speakingRate: number;   // syllables per sec estimate
  isLaughing: boolean;
}

export class VoiceGestureEngine {
  private smoothOutput: VoiceGestureOutput = {
    headTilt: 0, headNod: 0, bodyLean: 0,
    handRaise: 0, bodyShake: 0,
    gestureSpeed: 1, expressionIntensity: 0,
  };
  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private readonly smoothFactor = 0.1;

  /**
   * フレーム更新 — 音声特徴からジェスチャー出力を生成
   */
  update(features: VoiceFeatures): VoiceGestureOutput {
    const { pitch, prevPitch, volume, isSpeaking, speakingRate, isLaughing } = features;

    this.pitchHistory.push(pitch);
    if (this.pitchHistory.length > 30) this.pitchHistory.shift();
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > 30) this.volumeHistory.shift();

    const target: VoiceGestureOutput = {
      headTilt: 0, headNod: 0, bodyLean: 0,
      handRaise: 0, bodyShake: 0,
      gestureSpeed: 1, expressionIntensity: 0,
    };

    if (!isSpeaking) {
      // Idle/listening pose
      target.headNod = 0;
      target.expressionIntensity = 0.2;
    } else {
      // === Pitch-based gestures ===
      const pitchDelta = pitch - prevPitch;

      // Question detection: pitch rises at end
      if (pitchDelta > 20) {
        target.headTilt = 15; // 首を傾げる
      } else if (pitchDelta < -20) {
        target.headTilt = -5; // 断定的に
      }

      // Pitch rise → hand raise
      if (pitch > 250 && pitchDelta > 10) {
        target.handRaise = Math.min(1, (pitch - 250) / 200);
      }

      // === Volume-based gestures ===
      target.bodyLean = Math.min(0.3, volume * 0.5); // 声が大きい → 前のめり
      target.expressionIntensity = Math.min(1, volume * 1.5);

      // === Speaking rate ===
      target.gestureSpeed = Math.max(0.5, Math.min(2.0, speakingRate / 4));

      // === Laugh detection ===
      if (isLaughing) {
        target.bodyShake = 0.8;
        target.expressionIntensity = 1;
        target.handRaise = 0.3;
      }

      // === Head nod (speaking rhythm) ===
      const rhythmPhase = Date.now() % 1000;
      if (rhythmPhase < 300) target.headNod = 0.3;
    }

    // Smoothing
    const s = this.smoothFactor;
    this.smoothOutput.headTilt += (target.headTilt - this.smoothOutput.headTilt) * s;
    this.smoothOutput.headNod += (target.headNod - this.smoothOutput.headNod) * s;
    this.smoothOutput.bodyLean += (target.bodyLean - this.smoothOutput.bodyLean) * s;
    this.smoothOutput.handRaise += (target.handRaise - this.smoothOutput.handRaise) * s;
    this.smoothOutput.bodyShake += (target.bodyShake - this.smoothOutput.bodyShake) * (isLaughing ? 0.3 : s);
    this.smoothOutput.gestureSpeed += (target.gestureSpeed - this.smoothOutput.gestureSpeed) * s;
    this.smoothOutput.expressionIntensity += (target.expressionIntensity - this.smoothOutput.expressionIntensity) * s;

    return { ...this.smoothOutput };
  }

  getOutput(): VoiceGestureOutput { return { ...this.smoothOutput }; }
}
