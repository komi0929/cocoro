/**
 * VoxelEngine — 3Dポリゴン量産エンジン（コア）
 *
 * 設定（JSON）からプロシージャルにボクセルモデルを生成するシステム。
 * 手打ちコードなしで新しいモデルを追加可能。
 *
 * ワークフロー:
 * 1. ModelConfig（JSON定義）でモデルの構成要素を記述
 * 2. VoxelEngine.build(config) で VoxelData を生成
 * 3. VoxelGrid でレンダリング
 * 4. /dev/voxel-audit でプレビュー＆承認
 */

import {
  VoxelData, createGrid, setVoxel, fillBox, fillSphere,
  fillCylinder, fillEllipsoid, drawLine,
} from './VoxelGrid';
import {
  fillRoundedBox, fillGradientEllipsoid, fillNoisySphere,
  fillOrganicRoots, drawKawaiiFace,
  adjustBrightness, noisyPick, seededRand as designSeededRand,
} from './VoxelDesign';

// ============================================================
// 設定型定義
// ============================================================

/** カラーパレット定義 */
export interface ColorPalette {
  name: string;
  colors: string[];
}

/** プリミティブ操作の種別 */
export type PrimitiveOp =
  | { type: 'box'; from: [number, number, number]; to: [number, number, number]; color: string | { palette: string; index?: number } }
  | { type: 'sphere'; center: [number, number, number]; radius: number; color: string | { palette: string; index?: number } }
  | { type: 'ellipsoid'; center: [number, number, number]; radii: [number, number, number]; color: string | { palette: string; index?: number } }
  | { type: 'cylinder'; center: [number, number]; y: [number, number]; radius: number; color: string | { palette: string; index?: number } }
  | { type: 'line'; from: [number, number, number]; to: [number, number, number]; color: string | { palette: string; index?: number }; thickness?: number }
  | { type: 'scatter'; area: { from: [number, number, number]; to: [number, number, number] }; density: number; color: string | { palette: string; index?: number } }
  | { type: 'repeat'; op: PrimitiveOp; count: number; offset: [number, number, number] }
  | { type: 'ring'; center: [number, number, number]; radius: number; height: number; color: string | { palette: string; index?: number } }
  | { type: 'taper'; base: [number, number, number]; baseRadius: number; topRadius: number; height: number; color: string | { palette: string; index?: number } }
  // === High-quality primitives (VoxelDesign integration) ===
  | { type: 'rounded_box'; from: [number, number, number]; to: [number, number, number]; color: string | { palette: string; index?: number }; cornerCut?: number }
  | { type: 'gradient_ellipsoid'; center: [number, number, number]; radii: [number, number, number]; bottomColor: string; topColor: string }
  | { type: 'noisy_sphere'; center: [number, number, number]; radius: number; palette: string[]; noiseAmount?: number }
  | { type: 'organic_roots'; center: [number, number, number]; count: number; length: number; palette: string[] }
  | { type: 'kawaii_face'; center: [number, number]; faceZ: number; eyeColor?: string; noseColor?: string; blushColor?: string; eyeSize?: 'small' | 'medium' | 'large' }
  | { type: 'noisy_fill'; from: [number, number, number]; to: [number, number, number]; palette: string[]; variance?: number }
  | { type: 'highlight'; positions: [number, number, number][]; color: string }
  | { type: 'shade_gradient'; from: [number, number, number]; to: [number, number, number]; baseColor: string; direction: 'y' | 'x' | 'z'; factor?: number };

/** モデル設定（1つのアセットを定義） */
export interface ModelConfig {
  /** 一意な識別子 */
  id: string;
  /** 表示名（日本語） */
  name: string;
  /** カテゴリ */
  category: 'decoration' | 'furniture' | 'avatar' | 'environment' | 'item';
  /** 対象テーマ（空=汎用） */
  themes?: string[];
  /** グリッドサイズ */
  gridSize: [number, number, number];
  /** デフォルトレンダリング設定 */
  renderDefaults?: {
    voxelSize?: number;
    scale?: number;
    enableAO?: boolean;
    aoIntensity?: number;
    emissive?: boolean;
    emissiveColor?: string;
    emissiveIntensity?: number;
  };
  /** 使用するカラーパレット */
  palettes?: ColorPalette[];
  /** 構築手順（上から順に実行） */
  operations: PrimitiveOp[];
  /** シード依存のランダム操作 */
  randomOperations?: RandomOp[];
  /** 品質メタ情報（監査用） */
  quality?: {
    /** 推定ブロック数（目安） */
    estimatedVoxels?: number;
    /** 最終承認日 */
    approvedDate?: string;
    /** 承認者 */
    approvedBy?: string;
    /** 品質ランク: A=最高 B=良好 C=要改善 */
    rank?: 'A' | 'B' | 'C';
    /** メモ */
    notes?: string;
  };
}

/** シードベースのランダム操作 */
export interface RandomOp {
  type: 'scatter_random';
  area: { from: [number, number, number]; to: [number, number, number] };
  density: number;
  colors: string[];
  /** yを固定（地面配置など） */
  fixedY?: number;
}

// ============================================================
// エンジン本体
// ============================================================

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function resolveColor(
  colorSpec: string | { palette: string; index?: number },
  palettes: Map<string, string[]>,
  seed: number,
): string {
  if (typeof colorSpec === 'string') return colorSpec;
  const pal = palettes.get(colorSpec.palette);
  if (!pal || pal.length === 0) return '#FF00FF'; // エラー色
  if (colorSpec.index !== undefined) return pal[colorSpec.index % pal.length]!;
  return pal[Math.abs(seed) % pal.length]!;
}

export function buildModel(config: ModelConfig, seed: number = 42): VoxelData {
  const [sx, sy, sz] = config.gridSize;
  const grid = createGrid(sx, sy, sz);
  const rand = seededRand(seed);

  // パレットマップ構築
  const palettes = new Map<string, string[]>();
  if (config.palettes) {
    for (const p of config.palettes) {
      palettes.set(p.name, p.colors);
    }
  }

  // 操作を順番に実行
  for (const op of config.operations) {
    executeOp(grid, op, palettes, seed, rand);
  }

  // ランダム操作
  if (config.randomOperations) {
    for (const rop of config.randomOperations) {
      executeRandomOp(grid, rop, rand);
    }
  }

  return grid;
}

function executeOp(
  grid: VoxelData,
  op: PrimitiveOp,
  palettes: Map<string, string[]>,
  seed: number,
  rand: () => number,
): void {
  switch (op.type) {
    case 'box': {
      const color = resolveColor(op.color, palettes, seed);
      fillBox(grid, op.from[0], op.from[1], op.from[2], op.to[0], op.to[1], op.to[2], color);
      break;
    }
    case 'sphere': {
      const color = resolveColor(op.color, palettes, seed);
      fillSphere(grid, op.center[0], op.center[1], op.center[2], op.radius, color);
      break;
    }
    case 'ellipsoid': {
      const color = resolveColor(op.color, palettes, seed);
      fillEllipsoid(grid, op.center[0], op.center[1], op.center[2], op.radii[0], op.radii[1], op.radii[2], color);
      break;
    }
    case 'cylinder': {
      const color = resolveColor(op.color, palettes, seed);
      fillCylinder(grid, op.center[0], op.center[1], op.y[0], op.y[1], op.radius, color);
      break;
    }
    case 'line': {
      const color = resolveColor(op.color, palettes, seed);
      drawLine(grid, op.from[0], op.from[1], op.from[2], op.to[0], op.to[1], op.to[2], color, op.thickness);
      break;
    }
    case 'scatter': {
      const color = resolveColor(op.color, palettes, seed);
      const [x1, y1, z1] = op.area.from;
      const [x2, y2, z2] = op.area.to;
      for (let y = y1; y <= y2; y++) {
        for (let z = z1; z <= z2; z++) {
          for (let x = x1; x <= x2; x++) {
            if (rand() < op.density) {
              setVoxel(grid, x, y, z, color);
            }
          }
        }
      }
      break;
    }
    case 'repeat': {
      for (let i = 0; i < op.count; i++) {
        const shifted = shiftOp(op.op, [
          op.offset[0] * i, op.offset[1] * i, op.offset[2] * i,
        ]);
        executeOp(grid, shifted, palettes, seed + i, rand);
      }
      break;
    }
    case 'ring': {
      const color = resolveColor(op.color, palettes, seed);
      const [cx, cy, cz] = op.center;
      const r = op.radius;
      for (let dy = 0; dy < op.height; dy++) {
        for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
          for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
            const d2 = dx * dx + dz * dz;
            if (d2 >= (r - 1) * (r - 1) && d2 <= r * r) {
              setVoxel(grid, cx + dx, cy + dy, cz + dz, color);
            }
          }
        }
      }
      break;
    }
    case 'taper': {
      const color = resolveColor(op.color, palettes, seed);
      const [bx, by, bz] = op.base;
      for (let y = 0; y < op.height; y++) {
        const t = y / op.height;
        const r = op.baseRadius + (op.topRadius - op.baseRadius) * t;
        for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
          for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
            if (dx * dx + dz * dz <= r * r) {
              setVoxel(grid, bx + dx, by + y, bz + dz, color);
            }
          }
        }
      }
      break;
    }
    // === High-quality primitives ===
    case 'rounded_box': {
      const color = resolveColor(op.color, palettes, seed);
      fillRoundedBox(grid, op.from[0], op.from[1], op.from[2], op.to[0], op.to[1], op.to[2], color, op.cornerCut ?? 1);
      break;
    }
    case 'gradient_ellipsoid': {
      fillGradientEllipsoid(grid, op.center[0], op.center[1], op.center[2], op.radii[0], op.radii[1], op.radii[2], op.bottomColor, op.topColor);
      break;
    }
    case 'noisy_sphere': {
      fillNoisySphere(grid, op.center[0], op.center[1], op.center[2], op.radius, op.palette, seed, op.noiseAmount ?? 0.15);
      break;
    }
    case 'organic_roots': {
      fillOrganicRoots(grid, op.center[0], op.center[1], op.center[2], op.count, op.length, op.palette, seed);
      break;
    }
    case 'kawaii_face': {
      drawKawaiiFace(grid, op.center[0], op.center[1], op.faceZ, op.eyeColor ?? '#111111', op.noseColor ?? '#FF8C00', op.blushColor ?? '#FFB6C1', op.eyeSize ?? 'medium');
      break;
    }
    case 'noisy_fill': {
      const variance = op.variance ?? 0.1;
      for (let y = op.from[1]; y <= op.to[1]; y++) {
        for (let z = op.from[2]; z <= op.to[2]; z++) {
          for (let x = op.from[0]; x <= op.to[0]; x++) {
            const voxelSeed = seed + x * 7 + y * 13 + z * 19;
            setVoxel(grid, x, y, z, noisyPick(op.palette, voxelSeed, variance));
          }
        }
      }
      break;
    }
    case 'highlight': {
      for (const [hx, hy, hz] of op.positions) {
        setVoxel(grid, hx, hy, hz, op.color);
      }
      break;
    }
    case 'shade_gradient': {
      const dir = op.direction;
      const f = op.factor ?? 0.3;
      const [gx1, gy1, gz1] = op.from;
      const [gx2, gy2, gz2] = op.to;
      const maxDim = dir === 'y' ? gy2 - gy1 : dir === 'x' ? gx2 - gx1 : gz2 - gz1;
      for (let y = gy1; y <= gy2; y++) {
        for (let z = gz1; z <= gz2; z++) {
          for (let x = gx1; x <= gx2; x++) {
            const pos = dir === 'y' ? y - gy1 : dir === 'x' ? x - gx1 : z - gz1;
            const t = maxDim > 0 ? pos / maxDim : 0;
            setVoxel(grid, x, y, z, adjustBrightness(op.baseColor, 1 - f + f * t));
          }
        }
      }
      break;
    }
  }
}

function executeRandomOp(grid: VoxelData, rop: RandomOp, rand: () => number): void {
  const [x1, y1, z1] = rop.area.from;
  const [x2, y2, z2] = rop.area.to;

  for (let z = z1; z <= z2; z++) {
    for (let x = x1; x <= x2; x++) {
      if (rand() < rop.density) {
        const y = rop.fixedY ?? (y1 + Math.floor(rand() * (y2 - y1 + 1)));
        const color = rop.colors[Math.floor(rand() * rop.colors.length)]!;
        setVoxel(grid, x, y, z, color);
      }
    }
  }
}

function shiftOp(op: PrimitiveOp, offset: [number, number, number]): PrimitiveOp {
  const [dx, dy, dz] = offset;
  switch (op.type) {
    case 'box':
      return { ...op, from: [op.from[0] + dx, op.from[1] + dy, op.from[2] + dz], to: [op.to[0] + dx, op.to[1] + dy, op.to[2] + dz] };
    case 'sphere':
      return { ...op, center: [op.center[0] + dx, op.center[1] + dy, op.center[2] + dz] };
    case 'ellipsoid':
      return { ...op, center: [op.center[0] + dx, op.center[1] + dy, op.center[2] + dz] };
    case 'cylinder':
      return { ...op, center: [op.center[0] + dx, op.center[1] + dz], y: [op.y[0] + dy, op.y[1] + dy] };
    case 'line':
      return { ...op, from: [op.from[0] + dx, op.from[1] + dy, op.from[2] + dz], to: [op.to[0] + dx, op.to[1] + dy, op.to[2] + dz] };
    default:
      return op;
  }
}

// ============================================================
// モデルレジストリ（全モデルの中央管理）
// ============================================================

class VoxelModelRegistry {
  private models = new Map<string, ModelConfig>();
  private cache = new Map<string, VoxelData>(); // id:seed → data

  /** モデル設定を登録 */
  register(config: ModelConfig): void {
    this.models.set(config.id, config);
  }

  /** 複数モデルを一括登録 */
  registerAll(configs: ModelConfig[]): void {
    for (const c of configs) this.register(c);
  }

  /** モデル設定を取得 */
  get(id: string): ModelConfig | undefined {
    return this.models.get(id);
  }

  /** 全モデル一覧 */
  list(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /** カテゴリでフィルタ */
  listByCategory(category: ModelConfig['category']): ModelConfig[] {
    return this.list().filter(m => m.category === category);
  }

  /** テーマでフィルタ */
  listByTheme(theme: string): ModelConfig[] {
    return this.list().filter(m => !m.themes || m.themes.includes(theme));
  }

  /** モデルをビルド（キャッシュ付き） */
  build(id: string, seed: number = 42): VoxelData | null {
    const cacheKey = `${id}:${seed}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const config = this.models.get(id);
    if (!config) return null;

    const data = buildModel(config, seed);
    this.cache.set(cacheKey, data);
    return data;
  }

  /** キャッシュクリア */
  clearCache(): void {
    this.cache.clear();
  }

  /** 監査用: 全モデルの品質情報 */
  auditReport(): Array<{
    id: string; name: string; category: string;
    gridSize: [number, number, number]; quality?: ModelConfig['quality'];
    gateResult: QualityGateResult;
  }> {
    return this.list().map(m => ({
      id: m.id, name: m.name, category: m.category,
      gridSize: m.gridSize, quality: m.quality,
      gateResult: qualityGate(m),
    }));
  }
}

/** シングルトンレジストリ */
export const voxelRegistry = new VoxelModelRegistry();

// ============================================================
// 品質ゲート（自動品質チェック）
// ============================================================

/** 高品質プリミティブの一覧 */
const HIGH_QUALITY_OPS = new Set([
  'rounded_box', 'gradient_ellipsoid', 'noisy_sphere',
  'organic_roots', 'kawaii_face', 'noisy_fill',
  'highlight', 'shade_gradient',
]);

/** カテゴリ別の最小グリッド密度 */
const MIN_GRID_VOLUME: Record<string, number> = {
  avatar: 16 * 14 * 8,      // 1792
  decoration: 14 * 14 * 14,  // 2744
  furniture: 10 * 6 * 6,     // 360
  environment: 20 * 20 * 20, // 8000
  item: 8 * 8 * 8,           // 512
};

/** カテゴリ別に推奨される高品質プリミティブの最低使用数 */
const MIN_HQ_OPS: Record<string, number> = {
  avatar: 2,      // kawaii_face + noisy_fill or gradient
  decoration: 1,  // noisy_sphere or gradient
  furniture: 1,   // rounded_box or noisy_fill
  environment: 2, // noisy_sphere + organic_roots or gradient
  item: 1,        // rounded_box or highlight
};

export interface QualityGateResult {
  passed: boolean;
  score: number;           // 0-100
  suggestedRank: 'S' | 'A' | 'B' | 'C';
  checks: QualityCheck[];
}

interface QualityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

/** ModelConfigの品質を自動チェック */
export function qualityGate(config: ModelConfig): QualityGateResult {
  const checks: QualityCheck[] = [];
  let score = 0;

  // 1. グリッドサイズチェック
  const [sx, sy, sz] = config.gridSize;
  const volume = sx * sy * sz;
  const minVol = MIN_GRID_VOLUME[config.category] ?? 512;
  const gridPass = volume >= minVol;
  checks.push({
    name: 'グリッド密度',
    passed: gridPass,
    detail: gridPass
      ? `${volume.toLocaleString()} voxels (最小: ${minVol.toLocaleString()})`
      : `不足: ${volume.toLocaleString()} < ${minVol.toLocaleString()}`,
  });
  if (gridPass) score += 20;

  // 2. 高品質プリミティブ使用チェック
  function countHQOps(ops: PrimitiveOp[]): number {
    let c = 0;
    for (const op of ops) {
      if (HIGH_QUALITY_OPS.has(op.type)) c++;
      if (op.type === 'repeat') c += countHQOps([op.op]);
    }
    return c;
  }
  const hqCount = countHQOps(config.operations);
  const minHQ = MIN_HQ_OPS[config.category] ?? 1;
  const hqPass = hqCount >= minHQ;
  checks.push({
    name: '高品質プリミティブ',
    passed: hqPass,
    detail: hqPass
      ? `${hqCount}種使用 (最小: ${minHQ})`
      : `不足: ${hqCount} < ${minHQ} — rounded_box/gradient_ellipsoid/noisy_sphere等を使用してください`,
  });
  if (hqPass) score += 30;

  // 3. パレット数チェック（色の豊富さ）
  const palCount = config.palettes?.length ?? 0;
  const palPass = palCount >= 2;
  checks.push({
    name: 'カラーパレット',
    passed: palPass,
    detail: palPass
      ? `${palCount}パレット定義`
      : `不足: ${palCount} — 最低2パレット必要（ベース色+ディテール色）`,
  });
  if (palPass) score += 15;

  // 4. 操作数チェック（ディテールの量）
  const opCount = config.operations.length;
  const opPass = opCount >= 5;
  checks.push({
    name: 'ディテール量',
    passed: opPass,
    detail: opPass
      ? `${opCount}操作 — 十分なディテール`
      : `不足: ${opCount} < 5 — 操作を追加してディテールを増やしてください`,
  });
  if (opPass) score += 15;

  // 5. ランダム操作チェック（自然な変化の有無）
  const hasRandom = (config.randomOperations?.length ?? 0) > 0 ||
    config.operations.some(op => op.type === 'scatter' || op.type === 'noisy_sphere' || op.type === 'noisy_fill');
  checks.push({
    name: 'ランダム変化',
    passed: hasRandom,
    detail: hasRandom
      ? 'ノイズ/散布操作あり — 自然な変化'
      : 'なし — scatter/noisy_sphere/noisy_fill等を追加して自然な表面を',
  });
  if (hasRandom) score += 10;

  // 6. レンダリング設定チェック
  const hasAO = config.renderDefaults?.enableAO === true;
  checks.push({
    name: 'AO (アンビエントオクルージョン)',
    passed: hasAO,
    detail: hasAO ? 'AO有効' : 'AO無効 — enableAO: true にして奥行き感を',
  });
  if (hasAO) score += 10;

  // ランク判定
  let suggestedRank: 'S' | 'A' | 'B' | 'C';
  if (score >= 90) suggestedRank = 'S';
  else if (score >= 70) suggestedRank = 'A';
  else if (score >= 40) suggestedRank = 'B';
  else suggestedRank = 'C';

  return {
    passed: score >= 70,
    score,
    suggestedRank,
    checks,
  };
}
