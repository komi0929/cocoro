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
  }> {
    return this.list().map(m => ({
      id: m.id, name: m.name, category: m.category,
      gridSize: m.gridSize, quality: m.quality,
    }));
  }
}

/** シングルトンレジストリ */
export const voxelRegistry = new VoxelModelRegistry();
