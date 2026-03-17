/**
 * cocoro — Spatial Audio Engine
 * WebAudio PannerNode による3D音声定位
 * 
 * 他の人の声が「どこから聞こえるか」を感じる
 * = 空間に「奥行き」が生まれ、没入感が劇的に向上
 */

export interface SpatialAudioConfig {
  /** リスナー座標 (ローカルプレイヤーの位置) */
  listenerPosition: { x: number; y: number; z: number };
  /** リスナーの向き (ラジアン) */
  listenerRotationY: number;
}

interface SpatialPeer {
  peerId: string;
  pannerNode: PannerNode;
  gainNode: GainNode;
  sourceNode: MediaStreamAudioSourceNode;
  position: { x: number; y: number; z: number };
}

/**
 * 空間オーディオエンジン
 * 各ピアの音声をWebAudio PannerNodeで3D定位させる
 */
export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null;
  private peers = new Map<string, SpatialPeer>();
  
  // Audio rolloff parameters
  private readonly REF_DISTANCE = 2;     // 2mで最大音量
  private readonly MAX_DISTANCE = 20;    // 20mで聞こえなくなる
  private readonly ROLLOFF_FACTOR = 1.5; // 距離減衰の強さ

  constructor() {}

  /**
   * AudioContextを初期化（ユーザーインタラクション後に呼出し）
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
  }

  /**
   * リスナー（自分）の位置と向きを更新
   */
  updateListener(config: SpatialAudioConfig): void {
    if (!this.audioContext) return;
    const listener = this.audioContext.listener;

    if (listener.positionX) {
      // Modern API
      listener.positionX.value = config.listenerPosition.x;
      listener.positionY.value = config.listenerPosition.y;
      listener.positionZ.value = config.listenerPosition.z;

      // Forward direction from rotation
      const fx = Math.sin(config.listenerRotationY);
      const fz = Math.cos(config.listenerRotationY);
      listener.forwardX.value = fx;
      listener.forwardY.value = 0;
      listener.forwardZ.value = fz;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      // Legacy API fallback
      listener.setPosition(
        config.listenerPosition.x,
        config.listenerPosition.y,
        config.listenerPosition.z
      );
      const fx = Math.sin(config.listenerRotationY);
      const fz = Math.cos(config.listenerRotationY);
      listener.setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }

  /**
   * ピアの音声ストリームを空間オーディオに接続
   */
  addPeer(peerId: string, stream: MediaStream, position: { x: number; y: number; z: number }): void {
    if (!this.audioContext) return;
    if (this.peers.has(peerId)) return;

    const sourceNode = this.audioContext.createMediaStreamSource(stream);
    
    // PannerNode: HRTF for realistic spatial audio
    const pannerNode = this.audioContext.createPanner();
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = this.REF_DISTANCE;
    pannerNode.maxDistance = this.MAX_DISTANCE;
    pannerNode.rolloffFactor = this.ROLLOFF_FACTOR;
    pannerNode.coneInnerAngle = 360;
    pannerNode.coneOuterAngle = 360;
    pannerNode.coneOuterGain = 0;
    
    // Set initial position
    if (pannerNode.positionX) {
      pannerNode.positionX.value = position.x;
      pannerNode.positionY.value = position.y;
      pannerNode.positionZ.value = position.z;
    } else {
      pannerNode.setPosition(position.x, position.y, position.z);
    }

    // GainNode for proximity fade
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;

    // Connect: source → panner → gain → destination
    sourceNode.connect(pannerNode);
    pannerNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    this.peers.set(peerId, {
      peerId,
      pannerNode,
      gainNode,
      sourceNode,
      position,
    });
  }

  /**
   * ピアの位置を更新
   */
  updatePeerPosition(peerId: string, position: { x: number; y: number; z: number }): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.position = position;
    if (peer.pannerNode.positionX) {
      peer.pannerNode.positionX.value = position.x;
      peer.pannerNode.positionY.value = position.y;
      peer.pannerNode.positionZ.value = position.z;
    } else {
      peer.pannerNode.setPosition(position.x, position.y, position.z);
    }
  }

  /**
   * PrivateBubble: 特定ピアの音量を減衰（プライベートモード）
   */
  muteOutsideBubble(includedPeerIds: Set<string>): void {
    this.peers.forEach((peer) => {
      const targetGain = includedPeerIds.has(peer.peerId) ? 1 : 0.05;
      peer.gainNode.gain.setTargetAtTime(
        targetGain,
        this.audioContext?.currentTime ?? 0,
        0.3 // Smooth transition
      );
    });
  }

  /**
   * PrivateBubble解除: 全ピアの音量を復元
   */
  restoreAllVolumes(): void {
    this.peers.forEach((peer) => {
      peer.gainNode.gain.setTargetAtTime(
        1,
        this.audioContext?.currentTime ?? 0,
        0.3
      );
    });
  }

  /**
   * ピアを削除
   */
  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.sourceNode.disconnect();
    peer.pannerNode.disconnect();
    peer.gainNode.disconnect();
    this.peers.delete(peerId);
  }

  /**
   * 全リソースを解放
   */
  dispose(): void {
    this.peers.forEach((_, id) => this.removePeer(id));
    this.audioContext?.close().catch(() => {});
    this.audioContext = null;
  }
}
