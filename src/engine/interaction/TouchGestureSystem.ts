/**
 * kokoro — Touch Gesture Recognition System
 * スマホのタッチジェスチャーでリアクションを発動
 * 
 * 反復156-160:
 * - ダブルタップ → 拍手リアクション
 * - 長押し → プライベートバブル
 * - 上スワイプ → 手を振る
 * - 画面シェイク → 盛り上げ🔥
 * = タッチインタラクションで声以外の表現手段を提供
 */

export type GestureType = 'double_tap' | 'long_press' | 'swipe_up' | 'shake';

interface GestureCallback {
  (type: GestureType, data?: { x: number; y: number }): void;
}

export class TouchGestureSystem {
  private callbacks: GestureCallback[] = [];
  private lastTapTime = 0;
  private touchStartTime = 0;
  private touchStartY = 0;
  private touchStartX = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive = false;

  // Shake detection
  private lastAccelX = 0;
  private lastAccelY = 0;
  private lastAccelZ = 0;
  private shakeThreshold = 15;
  private lastShakeTime = 0;
  private shakeCount = 0;

  /**
   * コールバック登録
   */
  onGesture(callback: GestureCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private emit(type: GestureType, data?: { x: number; y: number }): void {
    for (const cb of this.callbacks) {
      cb(type, data);
    }
  }

  /**
   * タッチイベントリスナーを設定
   */
  attach(element: HTMLElement): () => void {
    if (this.isActive) return () => {};
    this.isActive = true;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      this.touchStartTime = Date.now();
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;

      // Long press detection
      this.longPressTimer = setTimeout(() => {
        this.emit('long_press', { x: touch.clientX, y: touch.clientY });
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      }, 600);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      const touch = e.changedTouches[0];
      const elapsed = Date.now() - this.touchStartTime;
      const dy = this.touchStartY - touch.clientY;
      const dx = Math.abs(this.touchStartX - touch.clientX);

      // Swipe up detection (min 80px, max 300ms, more vertical than horizontal)
      if (dy > 80 && dx < 60 && elapsed < 300) {
        this.emit('swipe_up', { x: touch.clientX, y: touch.clientY });
        if (navigator.vibrate) navigator.vibrate(20);
        return;
      }

      // Double tap detection (within 300ms)
      if (elapsed < 200) {
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          this.emit('double_tap', { x: touch.clientX, y: touch.clientY });
          if (navigator.vibrate) navigator.vibrate([15, 15]);
          this.lastTapTime = 0;
        } else {
          this.lastTapTime = now;
        }
      }
    };

    const onTouchMove = () => {
      // Cancel long press if finger moves
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });

    // Device shake detection
    const onDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const deltaX = Math.abs(acc.x - this.lastAccelX);
      const deltaY = Math.abs(acc.y - this.lastAccelY);
      const deltaZ = Math.abs(acc.z - this.lastAccelZ);

      if (deltaX + deltaY + deltaZ > this.shakeThreshold) {
        const now = Date.now();
        if (now - this.lastShakeTime > 500) {
          this.shakeCount++;
          this.lastShakeTime = now;

          if (this.shakeCount >= 3) {
            this.emit('shake');
            if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 30]);
            this.shakeCount = 0;
          }
        }
      }

      // Reset shake count after 2 seconds of stillness
      if (Date.now() - this.lastShakeTime > 2000) {
        this.shakeCount = 0;
      }

      this.lastAccelX = acc.x;
      this.lastAccelY = acc.y;
      this.lastAccelZ = acc.z;
    };

    window.addEventListener('devicemotion', onDeviceMotion);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('devicemotion', onDeviceMotion);
      this.isActive = false;
    };
  }
}
