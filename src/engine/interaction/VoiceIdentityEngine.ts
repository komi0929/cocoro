/**
 * kokoro — Voice Identity
 * 声紋から自動でアバターカラー/オーラを生成
 *
 * サイクル22: アバターの個性を声から自動生成
 * - 声の特徴(ピッチ/倍音/テンポ)から色を決定
 * - 高い声 → 暖色系 / 低い声 → 寒色系
 * - 話すテンポが速い → 鮮やかな色 / ゆったり → パステル
 * - 倍音が豊か → キラキラ / シンプル → マット
 * = 「カメラなしでも個性が出る」の最重要機能
 */

export interface VoiceIdentityProfile {
  primaryHue: number;          // 0-360
  secondaryHue: number;        // 0-360
  saturation: number;          // 0-1
  brightness: number;          // 0-1
  sparkleIntensity: number;    // 0-1 (倍音の豊かさ)
  auraSize: number;            // 0.5-2.0
  auraStyle: 'glow' | 'sparkle' | 'pulse' | 'wave';
  dominantTrait: 'warm' | 'cool' | 'bright' | 'deep' | 'calm';
}

export class VoiceIdentityEngine {
  private pitchSamples: number[] = [];
  private volumeSamples: number[] = [];
  private harmonicSamples: number[] = [];
  private speakingRateSamples: number[] = [];
  private profile: VoiceIdentityProfile | null = null;

  /**
   * 音声サンプルを蓄積(5-10秒分で安定する)
   */
  addSample(params: {
    pitch: number;
    volume: number;
    harmonicRichness: number; // 0-1
    speakingRate: number;     // syllables per sec
  }): void {
    this.pitchSamples.push(params.pitch);
    this.volumeSamples.push(params.volume);
    this.harmonicSamples.push(params.harmonicRichness);
    this.speakingRateSamples.push(params.speakingRate);

    // Keep last 60 samples (about 10 seconds at 6fps)
    if (this.pitchSamples.length > 60) this.pitchSamples.shift();
    if (this.volumeSamples.length > 60) this.volumeSamples.shift();
    if (this.harmonicSamples.length > 60) this.harmonicSamples.shift();
    if (this.speakingRateSamples.length > 60) this.speakingRateSamples.shift();
  }

  /**
   * 声紋からプロフィールを算出
   */
  computeProfile(): VoiceIdentityProfile {
    const avgPitch = this.average(this.pitchSamples);
    const avgVolume = this.average(this.volumeSamples);
    const avgHarmonic = this.average(this.harmonicSamples);
    const avgRate = this.average(this.speakingRateSamples);

    // Pitch → Hue mapping (低い声=青寒色 → 高い声=赤暖色)
    // Human voice range: ~80Hz (low male) to ~300Hz (high female)
    const pitchNorm = Math.max(0, Math.min(1, (avgPitch - 80) / 220));
    const primaryHue = pitchNorm * 360; // Full spectrum
    const secondaryHue = (primaryHue + 120) % 360; // Complementary-ish

    // Speaking rate → Saturation (速い=鮮やか, ゆっくり=パステル)
    const rateNorm = Math.max(0, Math.min(1, avgRate / 6));
    const saturation = 0.3 + rateNorm * 0.5;

    // Volume → Brightness
    const brightness = 0.5 + avgVolume * 0.4;

    // Harmonics → Sparkle
    const sparkleIntensity = avgHarmonic;

    // Aura size based on overall vocal presence
    const auraSize = 0.8 + avgVolume * 0.6 + avgHarmonic * 0.4;

    // Style determination
    const auraStyle: VoiceIdentityProfile['auraStyle'] =
      sparkleIntensity > 0.7 ? 'sparkle' :
      avgRate > 4 ? 'wave' :
      avgVolume > 0.6 ? 'pulse' : 'glow';

    // Dominant trait
    const dominantTrait: VoiceIdentityProfile['dominantTrait'] =
      pitchNorm > 0.6 ? 'warm' :
      pitchNorm < 0.3 ? 'deep' :
      rateNorm > 0.6 ? 'bright' :
      rateNorm < 0.3 ? 'calm' : 'cool';

    this.profile = {
      primaryHue, secondaryHue,
      saturation, brightness,
      sparkleIntensity, auraSize, auraStyle, dominantTrait,
    };

    return this.profile;
  }

  getProfile(): VoiceIdentityProfile | null { return this.profile; }
  isReady(): boolean { return this.pitchSamples.length >= 20; }

  /**
   * CSS color string生成
   */
  getPrimaryColor(): string {
    if (!this.profile) return 'hsl(270, 50%, 60%)';
    return `hsl(${this.profile.primaryHue}, ${this.profile.saturation * 100}%, ${this.profile.brightness * 100}%)`;
  }

  getSecondaryColor(): string {
    if (!this.profile) return 'hsl(300, 40%, 50%)';
    return `hsl(${this.profile.secondaryHue}, ${this.profile.saturation * 80}%, ${this.profile.brightness * 80}%)`;
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}
