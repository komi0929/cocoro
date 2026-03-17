/**
 * cocoro — UI Sound Effects System
 * マイクロインタラクションの気持ちよさを音で演出
 * 
 * 反復71-80: ボタン操作、マイクON/OFF、入退室にSEを紐付け
 * WebAudio OscillatorNodeで軽量な合成音
 * = 外部ファイル不要、バンドルサイズゼロ
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * 軽量ビープ音（ボタン操作用）
 */
function playTone(frequency: number, duration: number, volume: number = 0.1, type: OscillatorType = 'sine'): void {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext not available
  }
}

/**
 * マイクON音: 上昇チャイム
 */
export function playMicOn(): void {
  playTone(440, 0.15, 0.08);
  setTimeout(() => playTone(660, 0.15, 0.06), 80);
  setTimeout(() => playTone(880, 0.2, 0.04), 160);
}

/**
 * マイクOFF音: 下降チャイム
 */
export function playMicOff(): void {
  playTone(660, 0.12, 0.06);
  setTimeout(() => playTone(440, 0.15, 0.05), 80);
}

/**
 * 入室通知音: 柔らかいベル
 */
export function playJoinSound(): void {
  playTone(523, 0.2, 0.05, 'triangle'); // C5
  setTimeout(() => playTone(659, 0.25, 0.04, 'triangle'), 100); // E5
  setTimeout(() => playTone(784, 0.3, 0.03, 'triangle'), 200); // G5
}

/**
 * 退室通知音: フェードアウトベル
 */
export function playLeaveSound(): void {
  playTone(784, 0.15, 0.04, 'triangle');
  setTimeout(() => playTone(523, 0.25, 0.03, 'triangle'), 100);
}

/**
 * ピークモーメント検出音: 祝福ファンファーレ
 */
export function playPeakMoment(): void {
  playTone(523, 0.15, 0.06, 'triangle'); // C5
  setTimeout(() => playTone(659, 0.15, 0.05, 'triangle'), 80); // E5
  setTimeout(() => playTone(784, 0.15, 0.05, 'triangle'), 160); // G5
  setTimeout(() => playTone(1047, 0.3, 0.04, 'triangle'), 240); // C6
}

/**
 * リアクション音: 軽いポップ
 */
export function playReactionSound(): void {
  playTone(800, 0.08, 0.04);
  setTimeout(() => playTone(1200, 0.1, 0.03), 40);
}

/**
 * エラー音: 低い二音
 */
export function playErrorSound(): void {
  playTone(200, 0.15, 0.06, 'square');
  setTimeout(() => playTone(150, 0.2, 0.05, 'square'), 100);
}

/**
 * 共鳴検出音: ハーモニーチャイム
 */
export function playResonanceSound(): void {
  // Play a chord
  playTone(523, 0.4, 0.04, 'triangle'); // C
  playTone(659, 0.4, 0.03, 'triangle'); // E
  playTone(784, 0.5, 0.03, 'triangle'); // G
  setTimeout(() => {
    playTone(1047, 0.5, 0.02, 'triangle'); // C high
  }, 200);
}

/**
 * AudioContextを明示的に初期化（ユーザーインタラクション時に呼ぶ）
 */
export function initSoundFX(): void {
  getContext();
}
