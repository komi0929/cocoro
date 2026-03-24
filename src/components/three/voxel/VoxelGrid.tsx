/**
 * VoxelGrid — InstancedMesh ベースの高品質ボクセルレンダラー
 *
 * 参考画像（Honey Island Defense）レベルの品質を実現するため：
 * - 面カリング: 隣接ブロックに隠されている面を省略
 * - アンビエントオクルージョン: 頂点ごとのAO計算で陰影を強調
 * - マルチマテリアル: roughness/metalness/emissive をブロックごとに設定
 * - 高効率: merged geometry（面ごとにクワッドを生成し、BufferGeometryに統合）
 */

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ==============================================================
// Types
// ==============================================================

/** ブロックの色文字列、null = 空気 */
export type VoxelCell = string | null;

/** 拡張ブロック定義: 色 + マテリアルプロパティ */
export interface VoxelBlock {
  color: string;
  roughness?: number;   // 0-1, default 0.75
  metalness?: number;   // 0-1, default 0.05
  emissive?: string;    // hex color or null
  emissiveIntensity?: number; // default 0
  transparent?: boolean;
  opacity?: number;
}

/** VoxelData: [y][z][x] — 文字列 or VoxelBlock or null */
export type VoxelData = (VoxelCell | VoxelBlock)[][][];

interface VoxelGridProps {
  data: VoxelData;
  voxelSize?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  enableAO?: boolean;
  aoIntensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ==============================================================
// Helpers
// ==============================================================

function isBlock(cell: VoxelCell | VoxelBlock | null): cell is string | VoxelBlock {
  return cell !== null;
}

function getColor(cell: string | VoxelBlock): string {
  return typeof cell === 'string' ? cell : cell.color;
}

function getRoughness(cell: string | VoxelBlock): number {
  return typeof cell === 'string' ? 0.45 : (cell.roughness ?? 0.45);
}

function getMetalness(cell: string | VoxelBlock): number {
  return typeof cell === 'string' ? 0.1 : (cell.metalness ?? 0.1);
}

function getEmissive(cell: string | VoxelBlock): string {
  return typeof cell === 'string' ? '#000000' : (cell.emissive ?? '#000000');
}

function getEmissiveIntensity(cell: string | VoxelBlock): number {
  return typeof cell === 'string' ? 0 : (cell.emissiveIntensity ?? 0);
}

function getVoxel(data: VoxelData, x: number, y: number, z: number): VoxelCell | VoxelBlock | null {
  if (y < 0 || y >= data.length) return null;
  const layer = data[y];
  if (!layer || z < 0 || z >= layer.length) return null;
  const row = layer[z];
  if (!row || x < 0 || x >= row.length) return null;
  return row[x] ?? null;
}

// 6方向: +X, -X, +Y, -Y, +Z, -Z
const FACES = [
  { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,1],[1,1,0]], normal: [1,0,0] },   // +X
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,0],[0,1,1]], normal: [-1,0,0] },  // -X
  { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[0,1,0],[1,1,0]], normal: [0,1,0] },    // +Y
  { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[0,0,1],[1,0,1]], normal: [0,-1,0] },  // -Y
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[0,1,1],[1,1,1]], normal: [0,0,1] },    // +Z
  { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[1,1,0],[0,1,0]], normal: [0,0,-1] },  // -Z
] as const;

// AO サンプリング近傍（各頂点に対する3ブロック）
// 各面の4頂点それぞれについて、side1, side2, corner のオフセット
const AO_OFFSETS: Record<number, number[][][]> = {
  // +X face
  0: [
    [[1,-1,0],[1,0,1],[1,-1,1]],   // corner 0: (1,0,1)
    [[1,-1,0],[1,0,-1],[1,-1,-1]], // corner 1: (1,0,0)
    [[1,1,0],[1,0,1],[1,1,1]],    // corner 2: (1,1,1)
    [[1,1,0],[1,0,-1],[1,1,-1]],  // corner 3: (1,1,0)
  ],
  // -X face
  1: [
    [[- 1,-1,0],[-1,0,-1],[-1,-1,-1]],
    [[-1,-1,0],[-1,0,1],[-1,-1,1]],
    [[-1,1,0],[-1,0,-1],[-1,1,-1]],
    [[-1,1,0],[-1,0,1],[-1,1,1]],
  ],
  // +Y face
  2: [
    [[0,1,1],[-1,1,0],[-1,1,1]],
    [[0,1,1],[1,1,0],[1,1,1]],
    [[0,1,-1],[-1,1,0],[-1,1,-1]],
    [[0,1,-1],[1,1,0],[1,1,-1]],
  ],
  // -Y face
  3: [
    [[0,-1,-1],[-1,-1,0],[-1,-1,-1]],
    [[0,-1,-1],[1,-1,0],[1,-1,-1]],
    [[0,-1,1],[-1,-1,0],[-1,-1,1]],
    [[0,-1,1],[1,-1,0],[1,-1,1]],
  ],
  // +Z face
  4: [
    [[-1,0,1],[0,-1,1],[-1,-1,1]],
    [[1,0,1],[0,-1,1],[1,-1,1]],
    [[-1,0,1],[0,1,1],[-1,1,1]],
    [[1,0,1],[0,1,1],[1,1,1]],
  ],
  // -Z face
  5: [
    [[1,0,-1],[0,-1,-1],[1,-1,-1]],
    [[-1,0,-1],[0,-1,-1],[-1,-1,-1]],
    [[1,0,-1],[0,1,-1],[1,1,-1]],
    [[-1,0,-1],[0,1,-1],[-1,1,-1]],
  ],
};

/**
 * 頂点AO値を計算（Minecraft方式）
 * side1, side2, corner の3ブロックが存在するかで 0〜3 の値を返す
 */
function computeVertexAO(
  data: VoxelData, x: number, y: number, z: number,
  faceIdx: number, vertIdx: number,
): number {
  const offsets = AO_OFFSETS[faceIdx]?.[vertIdx];
  if (!offsets) return 3;

  const s1 = isBlock(getVoxel(data, x + offsets[0]![0]!, y + offsets[0]![1]!, z + offsets[0]![2]!)) ? 1 : 0;
  const s2 = isBlock(getVoxel(data, x + offsets[1]![0]!, y + offsets[1]![1]!, z + offsets[1]![2]!)) ? 1 : 0;
  const c  = isBlock(getVoxel(data, x + offsets[2]![0]!, y + offsets[2]![1]!, z + offsets[2]![2]!)) ? 1 : 0;

  if (s1 && s2) return 0; // 両サイドが塞がれていればコーナー問わず最暗
  return 3 - (s1 + s2 + c);
}

// ==============================================================
// Mesh Builder (面カリング + AO 付き BufferGeometry)
// ==============================================================

interface MeshData {
  positions: number[];
  normals: number[];
  colors: number[];
  aos: number[];
  indices: number[];
}

function buildVoxelMesh(data: VoxelData, voxelSize: number, enableAO: boolean, aoIntensity: number): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const aos: number[] = [];
  const indices: number[] = [];

  const sizeY = data.length;
  if (sizeY === 0) return { positions, normals, colors, aos, indices };

  const sizeZ = data[0]!.length;
  const sizeX = data[0]![0]!.length;

  const color = new THREE.Color();
  let vertIdx = 0;

  for (let y = 0; y < sizeY; y++) {
    for (let z = 0; z < sizeZ; z++) {
      for (let x = 0; x < sizeX; x++) {
        const cell = getVoxel(data, x, y, z);
        if (!isBlock(cell)) continue;

        color.set(getColor(cell));

        // 中心をオフセット
        const ox = (x - sizeX / 2) * voxelSize;
        const oy = y * voxelSize;
        const oz = (z - sizeZ / 2) * voxelSize;

        for (let fi = 0; fi < 6; fi++) {
          const face = FACES[fi]!;
          // 面カリング: 隣接ブロックがあればスキップ
          const nx = x + face.dir[0];
          const ny = y + face.dir[1];
          const nz = z + face.dir[2];
          if (isBlock(getVoxel(data, nx, ny, nz))) continue;

          // 4頂点追加 (with inset for bevel/nanoblock effect)
          const inset = voxelSize * 0.06; // 6% inset → subtle gap between blocks
          for (let vi = 0; vi < 4; vi++) {
            const corner = face.corners[vi]!;
            // Apply inset: push each vertex slightly toward the center of the voxel
            const cx = corner[0]! * voxelSize;
            const cy = corner[1]! * voxelSize;
            const cz = corner[2]! * voxelSize;
            // Inset toward center (0.5 * voxelSize, 0.5 * voxelSize, 0.5 * voxelSize)
            const centerX = 0.5 * voxelSize;
            const centerY = 0.5 * voxelSize;
            const centerZ = 0.5 * voxelSize;
            const ix = cx + (centerX - cx) * (inset / (voxelSize * 0.5));
            const iy = cy + (centerY - cy) * (inset / (voxelSize * 0.5));
            const iz = cz + (centerZ - cz) * (inset / (voxelSize * 0.5));
            positions.push(
              ox + ix,
              oy + iy,
              oz + iz,
            );
            normals.push(face.normal[0], face.normal[1], face.normal[2]);

            // AO (Minecraft-style per-vertex occlusion)
            let ao = 1.0;
            if (enableAO) {
              const aoLevel = computeVertexAO(data, x, y, z, fi, vi);
              // 0=最暗(完全遮蔽), 3=最明(遮蔽なし)
              // 二次関数カーブでより自然なAOグラデーション
              const aoNorm = aoLevel / 3;
              ao = 1.0 - (1.0 - aoNorm * aoNorm) * aoIntensity;
            }
            aos.push(ao);

            // 面シェーディング: 各面に異なるブライトネスで立体感を強調
            // 参考画像のナノブロックは上面が明確に明るく、底面が暗い
            let faceBrightness = 1.0;
            if (face.normal[1] > 0.5) faceBrightness = 1.18;       // 上面: 明るく光沢
            else if (face.normal[1] < -0.5) faceBrightness = 0.62; // 底面: かなり暗く
            else if (face.normal[2] > 0.5) faceBrightness = 1.06;  // 正面: やや明るく
            else if (face.normal[2] < -0.5) faceBrightness = 0.82; // 背面: 暗め
            else if (face.normal[0] > 0.5) faceBrightness = 0.90;  // 右面
            else if (face.normal[0] < -0.5) faceBrightness = 0.86; // 左面

            const fb = faceBrightness * ao;
            // Color with AO + face shading baked into vertex color
            colors.push(
              Math.min(1, color.r * fb),
              Math.min(1, color.g * fb),
              Math.min(1, color.b * fb),
            );
          }

          // 2 triangles per face（スムーズなAOのため対角フリップ判定）
          const a0 = enableAO ? computeVertexAO(data, x, y, z, fi, 0) : 3;
          const a1 = enableAO ? computeVertexAO(data, x, y, z, fi, 1) : 3;
          const a2 = enableAO ? computeVertexAO(data, x, y, z, fi, 2) : 3;
          const a3 = enableAO ? computeVertexAO(data, x, y, z, fi, 3) : 3;

          // 対角フリップ: AOが滑らかになるように三角形の分割方向を選択
          if (a0 + a3 > a1 + a2) {
            indices.push(vertIdx, vertIdx + 1, vertIdx + 2);
            indices.push(vertIdx + 2, vertIdx + 1, vertIdx + 3);
          } else {
            indices.push(vertIdx, vertIdx + 1, vertIdx + 3);
            indices.push(vertIdx, vertIdx + 3, vertIdx + 2);
          }
          vertIdx += 4;
        }
      }
    }
  }

  return { positions, normals, colors, aos, indices };
}

// ==============================================================
// React Component
// ==============================================================

export function VoxelGrid({
  data,
  voxelSize = 0.1,
  position,
  rotation,
  scale = 1,
  enableAO = true,
  aoIntensity = 0.55,
  castShadow = true,
  receiveShadow = true,
}: VoxelGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // ボクセルデータを展開: 位置と色の配列
  const { count, positions: voxPositions, colors: voxColors } = useMemo(() => {
    const positions: [number, number, number][] = [];
    const colors: THREE.Color[] = [];
    const sizeY = data.length;
    if (sizeY === 0) return { count: 0, positions: [] as [number, number, number][], colors: [] as THREE.Color[] };
    const sizeZ = data[0]!.length;
    const sizeX = data[0]![0]!.length;

    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        for (let x = 0; x < sizeX; x++) {
          const cell = getVoxel(data, x, y, z);
          if (!isBlock(cell)) continue;

          const col = new THREE.Color(getColor(cell));

          // 面シェーディング + AO を近似的にvertex colorにbake
          if (enableAO) {
            // 周囲のブロック数をカウントしてAOを計算
            let occluders = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz2 = -1; dz2 <= 1; dz2++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0 && dz2 === 0) continue;
                  if (isBlock(getVoxel(data, x + dx, y + dy, z + dz2))) occluders++;
                }
              }
            }
            const aoFactor = 1.0 - (occluders / 26) * aoIntensity * 0.6;
            col.multiplyScalar(aoFactor);
          }

          positions.push([
            (x - sizeX / 2) * voxelSize,
            y * voxelSize,
            (z - sizeZ / 2) * voxelSize,
          ]);
          colors.push(col);
        }
      }
    }

    return { count: positions.length, positions, colors };
  }, [data, voxelSize, enableAO, aoIntensity]);

  // InstancedMeshの行列と色を設定
  useEffect(() => {
    if (!meshRef.current || count === 0) return;

    const dummy = new THREE.Object3D();
    const blockScale = 0.93; // 93%スケールで微細な隙間を作り、ナノブロック感を演出

    for (let i = 0; i < count; i++) {
      const [px, py, pz] = voxPositions[i]!;
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(blockScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, voxColors[i]!);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, voxPositions, voxColors]);

  // RoundedBox geometry (角丸キューブ)
  const geometry = useMemo(() => {
    const s = voxelSize;
    const radius = s * 0.12; // 12%の角丸
    const geo = new THREE.BoxGeometry(s, s, s, 2, 2, 2);
    // 各頂点を球面方向にわずかに膨らませてbevel効果を近似
    const posAttr = geo.attributes.position!;
    const center = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      // 各頂点を中心(0,0,0)からの方向に沿って正規化し、s/2とradiusの間でlerp
      center.set(vx, vy, vz);
      const maxComponent = Math.max(Math.abs(vx), Math.abs(vy), Math.abs(vz));
      if (maxComponent > 0) {
        // 角を丸める: 各軸で半径を超える分を削る
        const nx = Math.min(Math.abs(vx), s / 2 - radius) * Math.sign(vx);
        const ny = Math.min(Math.abs(vy), s / 2 - radius) * Math.sign(vy);
        const nz = Math.min(Math.abs(vz), s / 2 - radius) * Math.sign(vz);
        // 削った分を球面方向に移動
        const dx = vx - nx;
        const dy = vy - ny;
        const dz = vz - nz;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len > 0.0001) {
          const scale2 = radius / len;
          posAttr.setXYZ(i, nx + dx * scale2, ny + dy * scale2, nz + dz * scale2);
        }
      }
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [voxelSize]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.35,    // ナノブロック風の光沢感
      metalness: 0.08,    // わずかな金属感
      flatShading: false,  // スムーズシェーディングで角丸を活かす
    });
  }, []);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

// ==============================================================
// 発光ブロック専用VoxelGrid（半透明・ワイヤーフレーム等にも対応）
// ==============================================================

interface EmissiveVoxelGridProps {
  data: VoxelData;
  voxelSize?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
}

export function EmissiveVoxelGrid({
  data,
  voxelSize = 0.1,
  position,
  rotation,
  scale = 1,
  emissiveColor = '#ffffff',
  emissiveIntensity = 2,
  transparent = false,
  opacity = 1,
  wireframe = false,
}: EmissiveVoxelGridProps) {
  const geometry = useMemo(() => {
    const meshData = buildVoxelMesh(data, voxelSize, false, 0);
    if (meshData.positions.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(meshData.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(meshData.colors, 3));
    geo.setIndex(meshData.indices);
    geo.computeBoundingSphere();
    return geo;
  }, [data, voxelSize]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      emissive: new THREE.Color(emissiveColor),
      emissiveIntensity,
      transparent,
      opacity,
      wireframe,
      flatShading: true,
    });
  }, [emissiveColor, emissiveIntensity, transparent, opacity, wireframe]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// ==============================================================
// ボクセルデータ生成ヘルパー
// ==============================================================

export function createGrid(sizeX: number, sizeY: number, sizeZ: number): VoxelData {
  return Array.from({ length: sizeY }, () =>
    Array.from({ length: sizeZ }, () =>
      Array.from({ length: sizeX }, () => null as VoxelCell)
    )
  );
}

export function setVoxel(
  grid: VoxelData, x: number, y: number, z: number, color: string | VoxelBlock,
): void {
  const rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  if (ry >= 0 && ry < grid.length &&
      rz >= 0 && rz < grid[ry]!.length &&
      rx >= 0 && rx < grid[ry]![rz]!.length) {
    grid[ry]![rz]![rx] = color;
  }
}

export function fillBox(
  grid: VoxelData,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  color: string | VoxelBlock,
): void {
  for (let y = y1; y <= y2; y++) {
    for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) {
        setVoxel(grid, x, y, z, color);
      }
    }
  }
}

export function fillSphere(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  radius: number, color: string | VoxelBlock,
): void {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let z = Math.floor(cz - radius); z <= Math.ceil(cz + radius); z++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        if (dx * dx + dy * dy + dz * dz <= r2) {
          setVoxel(grid, x, y, z, color);
        }
      }
    }
  }
}

export function fillCylinder(
  grid: VoxelData,
  cx: number, cz: number,
  y1: number, y2: number,
  radius: number, color: string | VoxelBlock,
): void {
  const r2 = radius * radius;
  for (let y = y1; y <= y2; y++) {
    for (let z = Math.floor(cz - radius); z <= Math.ceil(cz + radius); z++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx, dz = z - cz;
        if (dx * dx + dz * dz <= r2) {
          setVoxel(grid, x, y, z, color);
        }
      }
    }
  }
}

/** 楕円体を塗りつぶす */
export function fillEllipsoid(
  grid: VoxelData,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  color: string | VoxelBlock,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1) {
          setVoxel(grid, x, y, z, color);
        }
      }
    }
  }
}

/** 線分を描画（Bresenham 3D） */
export function drawLine(
  grid: VoxelData,
  x0: number, y0: number, z0: number,
  x1: number, y1: number, z1: number,
  color: string | VoxelBlock,
  thickness: number = 1,
): void {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), dz = Math.abs(z1 - z0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, sz = z0 < z1 ? 1 : -1;
  const dm = Math.max(dx, dy, dz);
  let x = x0, y = y0, z = z0;

  for (let i = 0; i <= dm; i++) {
    // 太さ対応
    if (thickness <= 1) {
      setVoxel(grid, Math.round(x), Math.round(y), Math.round(z), color);
    } else {
      const r = Math.floor(thickness / 2);
      for (let tx = -r; tx <= r; tx++) {
        for (let tz = -r; tz <= r; tz++) {
          setVoxel(grid, Math.round(x) + tx, Math.round(y), Math.round(z) + tz, color);
        }
      }
    }
    x += (x1 - x0) / dm;
    y += (y1 - y0) / dm;
    z += (z1 - z0) / dm;
  }
}
