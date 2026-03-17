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
  private audioContext: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private sources: Map<string, SpatialSource> = new Map();
  private masterGain: GainNode | null = null;

  constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.init(audioContext);
    }
  }

  private init(ctx: AudioContext): void {
    this.audioContext = ctx;
    this.listener = ctx.listener;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(ctx.destination);
  }

  private ensureContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.init(new AudioContext());
      } catch { /* unsupported */ }
    }
    return this.audioContext;
  }

  updateListenerPosition(x: number, y: number, z: number): void {
    if (!this.listener) return;
    if (this.listener.positionX) {
      this.listener.positionX.value = x;
      this.listener.positionY.value = y;
      this.listener.positionZ.value = z;
    }
  }

  updateListenerOrientation(
    forwardX: number, forwardY: number, forwardZ: number,
    upX: number, upY: number, upZ: number
  ): void {
    if (!this.listener) return;
    if (this.listener.forwardX) {
      this.listener.forwardX.value = forwardX;
      this.listener.forwardY.value = forwardY;
      this.listener.forwardZ.value = forwardZ;
      this.listener.upX.value = upX;
      this.listener.upY.value = upY;
      this.listener.upZ.value = upZ;
    }
  }

  addSource(id: string, stream: MediaStream): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (this.sources.has(id)) {
      this.removeSource(id);
    }

    const source = ctx.createMediaStreamSource(stream);
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 50;
    panner.rolloffFactor = 1.5;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 1.0;

    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);

    this.sources.set(id, { id, panner, gain, source });
  }

  updateSourcePosition(id: string, x: number, y: number, z: number): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.panner.positionX.value = x;
    src.panner.positionY.value = y;
    src.panner.positionZ.value = z;
  }

  updateSourceVolume(id: string, volume: number): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.gain.gain.value = Math.max(0, Math.min(2, volume));
  }

  setVolume(id: string, volume: number): void {
    this.updateSourceVolume(id, volume);
  }

  removeSource(id: string): void {
    const src = this.sources.get(id);
    if (!src) return;
    src.source.disconnect();
    src.gain.disconnect();
    src.panner.disconnect();
    this.sources.delete(id);
  }

  dispose(): void {
    this.sources.forEach((_, id) => this.removeSource(id));
    if (this.masterGain) this.masterGain.disconnect();
  }
}
