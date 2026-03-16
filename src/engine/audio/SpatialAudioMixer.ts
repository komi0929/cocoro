/**
 * kokoro — Spatial Audio Mixer
 * Web Audio API PannerNode ベースの3D空間音響
 * アバター座標に基づいて音声を3D定位
 */

export interface SpatialSource {
  id: string;
  panner: PannerNode;
  gain: GainNode;
  source: MediaStreamAudioSourceNode;
}

export class SpatialAudioMixer {
  private audioContext: AudioContext;
  private listener: AudioListener;
  private sources: Map<string, SpatialSource> = new Map();
  private masterGain: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.listener = this.audioContext.listener;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * リスナー（自分）の位置を更新
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    if (this.listener.positionX) {
      this.listener.positionX.value = x;
      this.listener.positionY.value = y;
      this.listener.positionZ.value = z;
    }
  }

  /**
   * リスナーの向きを更新
   */
  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX: number, upY: number, upZ: number
  ): void {
    if (this.listener.forwardX) {
      this.listener.forwardX.value = forwardX;
      this.listener.forwardY.value = forwardY;
      this.listener.forwardZ.value = forwardZ;
      this.listener.upX.value = upX;
      this.listener.upY.value = upY;
      this.listener.upZ.value = upZ;
    }
  }

  /**
   * リモート参加者の音声ストリームを空間音源として追加
   */
  addSource(id: string, stream: MediaStream): void {
    if (this.sources.has(id)) {
      this.removeSource(id);
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1.5;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0.5;

    const gain = this.audioContext.createGain();
    gain.gain.value = 1.0;

    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    this.sources.set(id, { id, panner, gain, source });
  }

  /**
   * 音源の3D位置を更新
   */
  updateSourcePosition(id: string, x: number, y: number, z: number): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.panner.positionX.value = x;
    src.panner.positionY.value = y;
    src.panner.positionZ.value = z;
  }

  /**
   * 音源のボリュームを更新
   */
  updateSourceVolume(id: string, volume: number): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.gain.gain.value = Math.max(0, Math.min(2, volume));
  }

  /**
   * 音源を削除
   */
  removeSource(id: string): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.source.disconnect();
    src.gain.disconnect();
    src.panner.disconnect();
    this.sources.delete(id);
  }

  /**
   * 全音源をクリーンアップ
   */
  dispose(): void {
    this.sources.forEach((_, id) => this.removeSource(id));
    this.masterGain.disconnect();
  }
}
