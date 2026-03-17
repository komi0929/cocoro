/**
 * kokoro — Emotion Contagion Engine
 * 感情の伝染シミュレーション
 *
 * 反復216-220:
 * - 複数話者の感情が「伝染」して空間全体の雰囲気を形成
 * - 笑いの伝染: 一人が笑うと周囲のjoyスコアが自然に上昇
 * - 緊張の伝染: 沈黙が長いとanxietyスコアが上昇
 * - カリスマ効果: 声量が大きい人の感情は伝染力が強い
 * = 「空気」が生まれるメカニズムを数理モデル化
 */

export interface EmotionField {
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  tension: number;      // 緊張度（沈黙時に上昇）
  warmth: number;       // 温かさ（笑いで上昇）
}

interface ParticipantEmotion {
  id: string;
  joy: number;
  anger: number;
  sorrow: number;
  surprise: number;
  volume: number;
  isSpeaking: boolean;
}

export class EmotionContagionEngine {
  private field: EmotionField = {
    joy: 0, anger: 0, sorrow: 0, surprise: 0,
    tension: 0, warmth: 0,
  };

  private silenceStartTime: number | null = null;
  private readonly CONTAGION_RATE = 0.08;
  private readonly DECAY_RATE = 0.02;
  private readonly CHARISMA_MULTIPLIER = 2.0;

  /**
   * フレーム更新: 全参加者の感情から場の感情を計算
   */
  update(participants: ParticipantEmotion[]): EmotionField {
    const speakingCount = participants.filter(p => p.isSpeaking).length;

    // === Silence tension ===
    if (speakingCount === 0) {
      if (!this.silenceStartTime) this.silenceStartTime = Date.now();
      const silenceDuration = (Date.now() - this.silenceStartTime) / 1000;
      this.field.tension = Math.min(1, silenceDuration / 15); // 15秒で最大緊張
    } else {
      this.silenceStartTime = null;
      this.field.tension *= 0.95; // 話し始めると緊張が緩和
    }

    // === Emotion aggregation with charisma weighting ===
    let totalJoy = 0, totalAnger = 0, totalSorrow = 0, totalSurprise = 0;
    let totalWeight = 0;

    for (const p of participants) {
      // Charisma: louder voice = more influence
      const charisma = 1 + (p.volume * this.CHARISMA_MULTIPLIER);
      const weight = p.isSpeaking ? charisma : 0.3; // Non-speakers have low influence

      totalJoy += p.joy * weight;
      totalAnger += p.anger * weight;
      totalSorrow += p.sorrow * weight;
      totalSurprise += p.surprise * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      const avgJoy = totalJoy / totalWeight;
      const avgAnger = totalAnger / totalWeight;
      const avgSorrow = totalSorrow / totalWeight;
      const avgSurprise = totalSurprise / totalWeight;

      // Contagion: field slowly converges to weighted average
      this.field.joy += (avgJoy - this.field.joy) * this.CONTAGION_RATE;
      this.field.anger += (avgAnger - this.field.anger) * this.CONTAGION_RATE;
      this.field.sorrow += (avgSorrow - this.field.sorrow) * this.CONTAGION_RATE;
      this.field.surprise += (avgSurprise - this.field.surprise) * this.CONTAGION_RATE;
    } else {
      // No participants: decay to neutral
      this.field.joy *= (1 - this.DECAY_RATE);
      this.field.anger *= (1 - this.DECAY_RATE);
      this.field.sorrow *= (1 - this.DECAY_RATE);
      this.field.surprise *= (1 - this.DECAY_RATE);
    }

    // === Warmth: derived from joy + low tension ===
    const targetWarmth = this.field.joy * (1 - this.field.tension * 0.5);
    this.field.warmth += (targetWarmth - this.field.warmth) * 0.05;

    return { ...this.field };
  }

  /**
   * 支配的な感情を返す
   */
  getDominant(): string {
    const { joy, anger, sorrow, surprise, tension } = this.field;
    const emotions = [
      ['joy', joy], ['anger', anger], ['sorrow', sorrow],
      ['surprise', surprise], ['tension', tension],
    ] as const;
    return emotions.reduce((best, curr) => curr[1] > best[1] ? curr : best)[0];
  }

  /**
   * 場の感情の「温度」(0-1): 感情が高ぶっているほど高い
   */
  getTemperature(): number {
    const { joy, anger, sorrow, surprise } = this.field;
    return Math.min(1, (joy + anger + sorrow + surprise) / 2);
  }

  getField(): EmotionField { return { ...this.field }; }

  reset(): void {
    this.field = { joy: 0, anger: 0, sorrow: 0, surprise: 0, tension: 0, warmth: 0 };
    this.silenceStartTime = null;
  }
}
