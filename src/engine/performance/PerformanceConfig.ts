/**
 * kokoro — Performance Config
 * モバイル/デスクトップ判定と品質設定の一元管理
 * 
 * スマホでも60fps安定動作を実現するための動的品質調整
 */

export type QualityTier = 'low' | 'medium' | 'high';

export interface PerformanceProfile {
  tier: QualityTier;
  /** VRMアバターの最大同時描画数 */
  maxAvatars: number;
  /** パーティクル粒子数の倍率 (1.0 = デフォルト) */
  particleMultiplier: number;
  /** 影の有無 */
  enableShadows: boolean;
  /** Post-processing (bloom等) */
  enablePostProcessing: boolean;
  /** VRM LOD距離 (この距離以上ではboundingBoxのみ描画) */
  lodDistance: number;
  /** テクスチャ解像度スケール */
  textureScale: number;
  /** Analyser FFTサイズ */
  fftSize: number;
  /** 最大ポイントライト数 */
  maxPointLights: number;
  /** デバイスピクセル比の上限 */
  maxDpr: number;
}

const PROFILES: Record<QualityTier, PerformanceProfile> = {
  low: {
    tier: 'low',
    maxAvatars: 4,
    particleMultiplier: 0.3,
    enableShadows: false,
    enablePostProcessing: false,
    lodDistance: 6,
    textureScale: 0.5,
    fftSize: 1024,
    maxPointLights: 2,
    maxDpr: 1,
  },
  medium: {
    tier: 'medium',
    maxAvatars: 8,
    particleMultiplier: 0.6,
    enableShadows: false,
    enablePostProcessing: true,
    lodDistance: 10,
    textureScale: 0.75,
    fftSize: 2048,
    maxPointLights: 4,
    maxDpr: 1.5,
  },
  high: {
    tier: 'high',
    maxAvatars: 12,
    particleMultiplier: 1.0,
    enableShadows: true,
    enablePostProcessing: true,
    lodDistance: 20,
    textureScale: 1.0,
    fftSize: 2048,
    maxPointLights: 8,
    maxDpr: 2,
  },
};

/**
 * デバイス・ブラウザの性能を判定して最適なProfileを返す
 */
function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // GPU性能判定
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  let gpuTier: 'low' | 'mid' | 'high' = 'mid';

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      // ローエンドGPU検出
      if (
        renderer.includes('mali-4') ||
        renderer.includes('mali-t') ||
        renderer.includes('adreno 3') ||
        renderer.includes('adreno 4') ||
        renderer.includes('powervr') ||
        renderer.includes('sgx') ||
        renderer.includes('swiftshader')
      ) {
        gpuTier = 'low';
      } else if (
        renderer.includes('adreno 7') ||
        renderer.includes('mali-g7') ||
        renderer.includes('apple gpu') ||
        renderer.includes('nvidia') ||
        renderer.includes('radeon')
      ) {
        gpuTier = 'high';
      }
    }
  }
  canvas.remove();

  // メモリ判定
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const isLowMemory = memory && memory < 4;

  // 論理コア数
  const cores = navigator.hardwareConcurrency ?? 4;
  const isLowCPU = cores <= 4;

  // 総合判定
  if (isMobile && (gpuTier === 'low' || isLowMemory)) return 'low';
  if (isMobile) return 'medium';
  if (gpuTier === 'low' || (isLowCPU && isLowMemory)) return 'low';
  if (gpuTier === 'high' && !isLowMemory) return 'high';
  return 'medium';
}

/** シングルトン: 起動時に1回だけ判定 */
let cachedProfile: PerformanceProfile | null = null;

export function getPerformanceProfile(): PerformanceProfile {
  if (!cachedProfile) {
    const tier = detectTier();
    cachedProfile = PROFILES[tier];
    console.log(`[PerformanceConfig] Detected tier: ${tier}`, cachedProfile);
  }
  return cachedProfile;
}

/**
 * isMobile判定（UI用の簡易版）
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}
