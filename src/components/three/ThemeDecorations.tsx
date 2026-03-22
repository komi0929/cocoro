/**
 * cocoro — Theme Decorations (Phase 8 — VoxelGrid Engine)
 * 8テーマ固有の3D装飾 — プロシージャル生成VoxelGridモデル使用
 * 参考画像（Honey Island Defense）レベルの高密度ボクセルアート
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomTheme } from '@/types/cocoro';
import {
  VoxelPalmTreeModel, VoxelRockModel, VoxelCrystalModel,
  VoxelCoralModel, VoxelMushroomModel, VoxelLavaModel,
  VoxelSeaweedModel, VoxelBuildingModel, VoxelWaterTowerModel,
  VoxelSpaceConsoleModel, VoxelTreasureChestModel, VoxelJellyfishModel,
  VoxelGrassModel,
} from './voxel/VoxelAssets';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './furniture/VoxelBuilder';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// =================================================================
// Underground (地下室) — VoxelGrid クリスタル + NoisyBox 混合
// =================================================================
function UndergroundDecorations() {
  const crystalRef = useRef<THREE.Group>(null);
  const mossRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 2 + Math.sin(t * 0.8 + i * 1.5) * 1;
        }
      });
    }
    if (mossRef.current && mossRef.current.material instanceof THREE.MeshStandardMaterial) {
      mossRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group>
      {/* === VoxelGrid クリスタル群 === */}
      <VoxelCrystalModel position={[-3.5, 0, -3.5]} scale={0.8} seed={4001} voxelSize={0.05} />
      <VoxelCrystalModel position={[3.2, 0, -3.2]} scale={0.6} seed={4002} voxelSize={0.04} />
      <VoxelCrystalModel position={[-2, 0, 2.5]} scale={0.5} seed={4003} voxelSize={0.035} />
      <VoxelCrystalModel position={[2.8, 0, 1.5]} scale={0.7} seed={4004} voxelSize={0.045} />

      {/* === VoxelGrid 岩 === */}
      <VoxelRockModel position={[-1, 0, 3]} scale={0.6} seed={4010} size={8} />
      <VoxelRockModel position={[2, 0, -1]} scale={0.5} seed={4011} size={6} />
      <VoxelRockModel position={[3, 0, 2.5]} scale={0.4} seed={4012} size={7} />

      {/* === Pipes along ceiling === */}
      {[0.8, -0.8].map((z, i) => (
        <group key={`pipe-${i}`}>
          <NoisyCylinder args={[0.07, 0.07, ROOM_W - 1]} position={[0, ROOM_H - 0.3, z * 3]}
            rotation={[0, 0, Math.PI / 2]} color="#555" roughness={0.2} metalness={0.9} seed={3070 + i} />
          {[-2, 0, 2].map((x, j) => (
            <group key={`joint-${i}-${j}`}>
              <NoisyCylinder args={[0.1, 0.1, 0.08]} position={[x, ROOM_H - 0.3, z * 3]}
                rotation={[0, 0, Math.PI / 2]} color="#666" metalness={0.85} roughness={0.25} seed={3080 + i * 3 + j} />
              {j === 1 && (
                <NoisyBox size={[0.06, 0.06, 0.02]} position={[x, ROOM_H - 0.15, z * 3]}
                  color="#FF4444" roughness={0.3} metalness={0.7} seed={3090 + i} bevel={0.005} />
              )}
            </group>
          ))}
        </group>
      ))}

      {/* === Glow moss clusters === */}
      {[
        [-ROOM_W / 2 + 0.12, 0.8, -1.5], [-ROOM_W / 2 + 0.14, 1.5, 1.0],
        [ROOM_W / 2 - 0.14, 0.6, -2.0], [-ROOM_W / 2 + 0.12, 2.0, 0],
      ].map(([x, y, z], i) => (
        <group key={`moss-cluster-${i}`} position={[x!, y!, z!]}>
          <mesh ref={i === 0 ? mossRef : undefined}>
            <sphereGeometry args={[0.15 + i * 0.02, 16, 12]} />
            <meshStandardMaterial color="#2d6a4f" emissive="#4ade80" emissiveIntensity={0.3}
              roughness={1} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* === Stalactites === */}
      {[
        [-1.5, -2, 0.5], [0.5, -1, 0.4], [2, -3, 0.6], [-2.5, 0.5, 0.35],
        [1.5, 2.5, 0.45], [-0.5, -2.5, 0.3], [3, 1, 0.5], [-3, -1.5, 0.55],
      ].map(([x, z, h], i) => (
        <group key={`stalactite-${i}`} position={[x!, ROOM_H - 0.1, z!]}>
          <NoisyBox size={[0.06 + i * 0.005, (h as number), 0.06 + i * 0.005]}
            position={[0, -(h as number) / 2, 0]}
            color="#4a3728" roughness={0.85} seed={3120 + i} bevel={0.008} lightnessSpread={0.12} />
        </group>
      ))}

      <pointLight position={[-3.5, 0.8, -3.5]} color="#7c3aed" intensity={1.5} distance={3} decay={2} />
      <pointLight position={[3.2, 0.6, -3.2]} color="#a855f7" intensity={1} distance={2.5} decay={2} />
    </group>
  );
}

// =================================================================
// Loft (ロフト) — NoisyBox 家具（既に高品質、維持）
// =================================================================
function LoftDecorations() {
  const fireRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireRef.current) {
      const t = clock.getElapsedTime();
      fireRef.current.intensity = 3 + Math.sin(t * 8) * 0.5 + Math.sin(t * 13) * 0.3;
    }
  });

  return (
    <group>
      {/* Window */}
      <group position={[1.5, 1.8, -ROOM_D / 2 + 0.12]}>
        <mesh><planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#FFF8DC" emissiveIntensity={0.5} />
        </mesh>
        {[
          { pos: [0, 0.75, 0.01] as [number,number,number], size: [1.35, 0.08, 0.06] as [number,number,number] },
          { pos: [0, -0.75, 0.01] as [number,number,number], size: [1.35, 0.08, 0.06] as [number,number,number] },
          { pos: [-0.63, 0, 0.01] as [number,number,number], size: [0.08, 1.6, 0.06] as [number,number,number] },
          { pos: [0.63, 0, 0.01] as [number,number,number], size: [0.08, 1.6, 0.06] as [number,number,number] },
        ].map((f, i) => (
          <NoisyBox key={`wf-${i}`} size={f.size} position={f.pos} color="#8B6914" roughness={0.55} seed={3100 + i} bevel={0.012} />
        ))}
        <NoisyCylinder args={[0.015, 0.015, 1.8]} position={[0, 0.82, 0.03]} rotation={[0, 0, Math.PI / 2]} color="#DAA520" metalness={0.5} roughness={0.3} seed={3108} />
      </group>

      {/* Bookshelf */}
      <group position={[-ROOM_W / 2 + 0.25, 0, -1]}>
        <NoisyBox size={[0.03, 2.3, 1.08]} position={[-0.08, 1.35, 0]} color="#4A2F15" roughness={0.85} seed={3109} bevel={0.004} />
        {[0.3, 1.0, 1.7, 2.4].map((y, i) => (
          <NoisyBox key={`shelf-${i}`} size={[0.27, 0.06, 1.05]} position={[0, y, 0]} color="#654321" roughness={0.7} seed={3110 + i} bevel={0.01} />
        ))}
        {[0.3, 1.0, 1.7].map((y, si) => (
          <group key={`books-${si}`} position={[0, y + 0.03, 0]}>
            {Array.from({ length: 8 }).map((_, bi) => (
              <NoisyBox key={`b-${si}-${bi}`}
                size={[0.14, 0.18 + (bi % 3) * 0.015, 0.06 + bi * 0.005]}
                position={[0.03, 0.1, -0.38 + bi * 0.1]}
                color={['#8B0000', '#00008B', '#006400', '#8B4513', '#4B0082', '#B8860B', '#2F4F4F', '#800020'][bi]!}
                roughness={0.85} seed={3120 + si * 8 + bi} bevel={0.005} />
            ))}
          </group>
        ))}
      </group>

      {/* Fireplace */}
      <group position={[0, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[1.3, 0.75, 0.55]} position={[0, 0.375, 0]} color="#8B4513" roughness={0.88} seed={3150} bevel={0.02} />
        <NoisyBox size={[0.75, 0.5, 0.35]} position={[0, 0.3, 0.12]} color="#1a0a00" roughness={0.95} seed={3151} bevel={0.015} />
        <NoisyCylinder args={[0.04, 0.04, 0.5]} position={[-0.1, 0.12, 0.2]} rotation={[0, 0.3, Math.PI / 2]} color="#5C3D1E" roughness={0.9} seed={3160} />
        <EmissiveBox size={[0.08, 0.12, 0.05]} position={[-0.05, 0.2, 0.2]} color="#FF6B35" emissiveIntensity={2} />
        <EmissiveBox size={[0.06, 0.1, 0.04]} position={[0.05, 0.22, 0.18]} color="#FF4500" emissiveIntensity={2.5} />
        <EmissiveBox size={[0.04, 0.08, 0.03]} position={[0, 0.25, 0.2]} color="#FFD700" emissiveIntensity={1.8} />
        <NoisyBox size={[1.5, 0.08, 0.6]} position={[0, 0.77, 0]} color="#654321" roughness={0.6} seed={3152} bevel={0.015} />
        <pointLight ref={fireRef} position={[0, 0.3, 0.2]} color="#FF6B35" intensity={3} distance={4} decay={2} />
      </group>

      {/* Rug */}
      <NoisyBox size={[2, 0.015, 1.5]} position={[0, 0.008, 1]} color="#8B0000" roughness={0.95} seed={3210} bevel={0.005} />
    </group>
  );
}

// =================================================================
// Treehouse (ツリーハウス) — VoxelGrid キノコ混合
// =================================================================
function TreehouseDecorations() {
  const lanternRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lanternRef.current) lanternRef.current.intensity = 2 + Math.sin(t * 3) * 0.3;
  });

  return (
    <group>
      {/* Branches (NoisyBox — 複雑な形状は維持) */}
      {[
        { start: [-ROOM_W / 2, 2.5, -2] as [number,number,number], rot: [0.2, 0, 0.6] as [number,number,number], segs: 6, w: 0.14 },
        { start: [ROOM_W / 2, 1.8, 1] as [number,number,number], rot: [-0.1, Math.PI, -0.5] as [number,number,number], segs: 5, w: 0.12 },
        { start: [-ROOM_W / 2, 1, 2] as [number,number,number], rot: [0, 0, 0.4] as [number,number,number], segs: 4, w: 0.1 },
      ].map((b, bi) => (
        <group key={`branch-${bi}`} position={b.start} rotation={b.rot}>
          {Array.from({ length: b.segs }).map((_, si) => {
            const t = si / b.segs;
            const w = b.w * (1 - t * 0.3);
            return (
              <NoisyBox key={`bs-${si}`} size={[w, 0.35, w]} position={[si * 0.06, si * 0.35, si * 0.03]}
                rotation={[0, si * 0.15, 0]}
                color={si % 2 === 0 ? '#5C3D1E' : '#6B4E32'} roughness={0.9} seed={3200 + bi * 10 + si}
                bevel={0.012} lightnessSpread={0.15} />
            );
          })}
        </group>
      ))}

      {/* Leaf clusters (NoisyBox) */}
      {[
        [-2, 2.8, -2, 0.25], [1, 3, 0, 0.3], [-1, ROOM_H - 0.2, 2, 0.22],
        [3, 2.5, -1, 0.2], [-3, 2.2, 1.5, 0.28], [0, ROOM_H, -3, 0.18],
        [2, 2.6, 2.5, 0.2], [-1.5, 2.5, -3, 0.15], [3.5, 2.8, 0.5, 0.22],
      ].map(([x, y, z, size], i) => (
        <group key={`leaf-cluster-${i}`} position={[x!, y!, z!]}>
          <NoisyBox size={[size!, size! * 0.8, size!]} position={[0, 0, 0]}
            color={['#228B22', '#2E8B57', '#32CD32', '#1B5E20', '#4CAF50', '#388E3C'][i % 6]!}
            roughness={0.88} seed={3210 + i} bevel={0.02} lightnessSpread={0.2} />
          {[0, 1, 2, 3].map(j => {
            const a = j * Math.PI / 2;
            return (
              <NoisyBox key={`lsub-${j}`}
                size={[size! * 0.5, size! * 0.4, size! * 0.5]}
                position={[Math.cos(a) * size! * 0.5, (j % 2 === 0 ? 0.03 : -0.03), Math.sin(a) * size! * 0.5]}
                color={j % 2 === 0 ? '#2E7D32' : '#43A047'}
                roughness={0.85} seed={3210 + i * 4 + j + 50} bevel={0.015} />
            );
          })}
        </group>
      ))}

      {/* VoxelGrid Mushrooms */}
      <VoxelMushroomModel position={[-2, 0, 1]} scale={0.5} seed={6001} />
      <VoxelMushroomModel position={[1, 0, 3]} scale={0.6} seed={6002} />
      <VoxelMushroomModel position={[-3, 0, -2]} scale={0.4} seed={6003} />
      <VoxelMushroomModel position={[0.5, 0, -1.5]} scale={0.35} seed={6004} />
      <VoxelMushroomModel position={[3, 0, -0.5]} scale={0.45} seed={6005} />

      {/* Lantern */}
      <group position={[0, 2.2, 0]}>
        <NoisyBox size={[0.12, 0.16, 0.12]} position={[0, 0, 0]} color="#B8860B" roughness={0.4} metalness={0.3} seed={3280} bevel={0.012} />
        <EmissiveBox size={[0.08, 0.1, 0.08]} position={[0, 0, 0]} color="#FFAA00" emissiveIntensity={1.5} />
        <pointLight ref={lanternRef} position={[0, 0, 0]} color="#FFAA00" intensity={2} distance={4} decay={2} />
      </group>

      <pointLight position={[-2, 1.5, 1]} color="#90EE90" intensity={0.5} distance={3} decay={2} />
    </group>
  );
}

// =================================================================
// Beach (ビーチハウス) — VoxelGrid ヤシの木
// =================================================================
function BeachDecorations() {
  const waveRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waveRef.current) {
      const t = clock.getElapsedTime();
      waveRef.current.position.z = ROOM_D / 2 - 0.5 + Math.sin(t * 0.8) * 0.15;
      if (waveRef.current.material instanceof THREE.MeshStandardMaterial) {
        waveRef.current.material.opacity = 0.3 + Math.sin(t * 1.2) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* VoxelGrid Palm Trees */}
      <VoxelPalmTreeModel position={[-3, 0, 2]} scale={0.7} seed={5001} voxelSize={0.05} />
      <VoxelPalmTreeModel position={[2.5, 0, -2.5]} scale={0.55} seed={5002} voxelSize={0.045} />

      {/* Grass patches */}
      <VoxelGrassModel position={[-3, 0, 1.5]} scale={0.5} seed={5010} width={8} depth={8} voxelSize={0.06} />

      {/* VoxelGrid Rocks */}
      <VoxelRockModel position={[3, 0, 2]} scale={0.3} seed={5020} size={6} />
      <VoxelRockModel position={[-2, 0, -3]} scale={0.25} seed={5021} size={5} />

      {/* Surfboard */}
      <group position={[ROOM_W / 2 - 0.25, 0, -2]} rotation={[0, -0.3, 0.12]}>
        <NoisyBox size={[0.2, 1.6, 0.04]} position={[0, 0.85, 0]} color="#FF6347" roughness={0.3} seed={3300} bevel={0.015} />
        <NoisyBox size={[0.16, 1.4, 0.02]} position={[0.01, 0.85, 0.02]} color="#FFD700" roughness={0.3} seed={3301} bevel={0.01} />
      </group>

      {/* Shells */}
      {[[-2, 0.015, 1.5], [1, 0.015, 2.5], [-0.5, 0.015, -2], [3, 0.015, 0.5]].map(([x, y, z], i) => (
        <group key={`shell-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.1]}>
          <NoisyBox size={[0.04, 0.03, 0.015]}
            color={['#FFF5EE', '#FFE4C4', '#FFDAB9', '#FFE0B2'][i]!}
            roughness={0.25} metalness={0.2} seed={3310 + i} bevel={0.003} />
        </group>
      ))}

      {/* Wave */}
      <mesh ref={waveRef} position={[0, 0.01, ROOM_D / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, 1]} />
        <meshStandardMaterial color="#00BCD4" transparent opacity={0.3} emissive="#00E5FF" emissiveIntensity={0.3} />
      </mesh>

      <pointLight position={[2, ROOM_H, ROOM_D / 2]} color="#FFA726" intensity={4} distance={8} decay={2} />
      <pointLight position={[-2, 2, ROOM_D / 2]} color="#FFD54F" intensity={2} distance={6} decay={2} />
    </group>
  );
}

// =================================================================
// Rooftop (屋上) — VoxelGrid ビル＋水塔
// =================================================================
function RooftopDecorations() {
  const lightsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (lightsRef.current) {
      const t = clock.getElapsedTime();
      lightsRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 1.5 + Math.sin(t * 2 + i * 0.7) * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Fence */}
      {[
        { pos: [0, 0.5, -ROOM_D / 2 + 0.1] as [number,number,number], size: [ROOM_W, 1, 0.06] as [number,number,number] },
        { pos: [-ROOM_W / 2 + 0.1, 0.5, 0] as [number,number,number], size: [0.06, 1, ROOM_D] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.1, 0.5, 0] as [number,number,number], size: [0.06, 1, ROOM_D] as [number,number,number] },
      ].map((f, i) => (
        <NoisyBox key={`fence-${i}`} size={f.size} position={f.pos} color="#808080" roughness={0.6} metalness={0.65} seed={3400 + i} bevel={0.008} transparent opacity={0.5} />
      ))}

      {/* VoxelGrid Buildings (背景ビル群) */}
      <VoxelBuildingModel position={[-3, 0, -ROOM_D / 2 - 0.5]} scale={0.6} seed={7001} width={8} height={25} depth={6} voxelSize={0.06} />
      <VoxelBuildingModel position={[-0.5, 0, -ROOM_D / 2 - 0.5]} scale={0.6} seed={7002} width={6} height={35} depth={5} voxelSize={0.06} />
      <VoxelBuildingModel position={[2, 0, -ROOM_D / 2 - 0.5]} scale={0.6} seed={7003} width={7} height={20} depth={6} voxelSize={0.06} />

      {/* VoxelGrid Water Tower */}
      <VoxelWaterTowerModel position={[-3, 0, 2.5]} scale={0.8} seed={7010} />

      {/* Antenna */}
      <group position={[3, 0, -3]}>
        <NoisyCylinder args={[0.02, 0.02, 3]} position={[0, 1.5, 0]} color="#888" roughness={0.2} metalness={0.9} seed={3410} />
        <NoisyBox size={[0.8, 0.025, 0.025]} position={[0, 2.8, 0]} color="#888" roughness={0.2} metalness={0.9} seed={3411} bevel={0.004} />
        <EmissiveBox size={[0.04, 0.04, 0.04]} position={[0, 3.02, 0]} color="#FF0000" emissiveIntensity={2} />
      </group>

      {/* AC Unit (NoisyBox) */}
      <group position={[2, 0, 2]}>
        <NoisyBox size={[0.6, 0.4, 0.35]} position={[0, 0.2, 0]} color="#B0BEC5" roughness={0.5} metalness={0.4} seed={7020} bevel={0.01} />
        <NoisyBox size={[0.5, 0.03, 0.3]} position={[0, 0.42, 0]} color="#90A4AE" roughness={0.4} metalness={0.5} seed={7021} bevel={0.005} />
      </group>

      {/* String lights */}
      <group ref={lightsRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const t = i / 9;
          const x = -3 + t * 6;
          const sag = Math.sin(t * Math.PI) * 0.3;
          return (
            <mesh key={`slight-${i}`} position={[x, ROOM_H - 0.5 - sag, -1]}>
              <sphereGeometry args={[0.04, 12, 8]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, ROOM_H - 0.6, -1]} color="#FFD700" intensity={1.5} distance={5} decay={2} />
    </group>
  );
}

// =================================================================
// Space (宇宙ステーション) — VoxelGrid コンソール
// =================================================================
function SpaceDecorations() {
  const holoRef = useRef<THREE.Mesh>(null);
  const panelRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (holoRef.current) {
      holoRef.current.rotation.y = t * 0.3;
      holoRef.current.position.y = 1.5 + Math.sin(t * 0.5) * 0.1;
      if (holoRef.current.material instanceof THREE.MeshStandardMaterial) {
        holoRef.current.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
      }
    }
    if (panelRef.current) {
      panelRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = i % 3 === 0 ? 1 + Math.sin(t * 4 + i) * 0.5 : 0.5 + Math.sin(t * 2 + i * 0.5) * 0.3;
        }
      });
    }
  });

  return (
    <group>
      {/* Space window */}
      <group position={[0, 2, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[2.6, 1.6, 0.08]} color="#1A1A2E" roughness={0.2} metalness={0.85} seed={3500} bevel={0.015} />
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.4, 1.4]} />
          <meshStandardMaterial color="#000020" emissive="#1a1a4e" emissiveIntensity={0.5} />
        </mesh>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`wstar-${i}`} position={[(Math.random() - 0.5) * 2.3, (Math.random() - 0.5) * 1.3, 0.06]}>
            <sphereGeometry args={[0.01 + Math.random() * 0.01, 6, 4]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
          </mesh>
        ))}
      </group>

      {/* Hologram planet */}
      <mesh ref={holoRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.4, 24, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={0.4} wireframe />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#22d3ee" intensity={1} distance={3} decay={2} />

      {/* VoxelGrid Console */}
      <VoxelSpaceConsoleModel position={[-ROOM_W / 2 + 0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={1} seed={8001} />

      {/* Control panel indicators */}
      <group ref={panelRef} position={[-ROOM_W / 2 + 0.15, 1.5, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`indicator-${i}`} position={[0, 0.3 - i * 0.08, (i - 4) * 0.15]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
              emissive={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
              emissiveIntensity={1} />
          </mesh>
        ))}
      </group>

      {/* Antenna dish */}
      <group position={[2.5, ROOM_H - 0.1, -2]}>
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[0.4, 0.15, 24, 1, true]} />
          <meshStandardMaterial color="#555" roughness={0.15} metalness={0.92} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// =================================================================
// Aquarium (深海アクアリウム) — VoxelGrid サンゴ＋クラゲ＋海藻＋宝箱
// =================================================================
function AquariumDecorations() {
  const jellyRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (jellyRef.current) {
      jellyRef.current.children.forEach((child, i) => {
        child.position.y = 1.5 + Math.sin(t * 0.4 + i * 2) * 0.5;
        child.rotation.z = Math.sin(t * 0.3 + i) * 0.15;
      });
    }
  });

  return (
    <group>
      {/* VoxelGrid Coral */}
      <VoxelCoralModel position={[-3, 0, -3]} scale={0.6} seed={9001} />
      <VoxelCoralModel position={[2.5, 0, -2.5]} scale={0.5} seed={9002} />
      <VoxelCoralModel position={[-1, 0, 3]} scale={0.55} seed={9003} />
      <VoxelCoralModel position={[3, 0, 1.5]} scale={0.45} seed={9004} />

      {/* VoxelGrid Jellyfish (animated via group) */}
      <group ref={jellyRef}>
        <VoxelJellyfishModel position={[-1.5, 1.5, -1]} scale={0.5} seed={9010} />
        <VoxelJellyfishModel position={[1.5, 1.5, 1.5]} scale={0.4} seed={9011} />
        <VoxelJellyfishModel position={[0, 1.5, -2.5]} scale={0.45} seed={9012} />
      </group>

      {/* VoxelGrid Seaweed */}
      <VoxelSeaweedModel position={[-2.5, 0, -1.5]} scale={0.7} seed={9020} />
      <VoxelSeaweedModel position={[0.5, 0, 2.5]} scale={0.6} seed={9021} />
      <VoxelSeaweedModel position={[3, 0, -1]} scale={0.5} seed={9022} />
      <VoxelSeaweedModel position={[-1, 0, -3]} scale={0.65} seed={9023} />

      {/* VoxelGrid Treasure Chest */}
      <VoxelTreasureChestModel position={[2.5, 0, 2.5]} scale={0.8} seed={9030} />

      {/* Portholes */}
      {[
        { pos: [-ROOM_W / 2 + 0.12, 1.8, -1.5] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.12, 1.8, 1] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number] },
      ].map((p, i) => (
        <group key={`port-${i}`} position={p.pos} rotation={p.rot}>
          <NoisyCylinder args={[0.3, 0.3, 0.06]} color="#8B7355" roughness={0.35} metalness={0.7} seed={3680 + i} />
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[0.25, 32]} />
            <meshStandardMaterial color="#003366" emissive="#00CED1" emissiveIntensity={0.2} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      <pointLight position={[0, ROOM_H - 0.5, 0]} color="#40E0D0" intensity={1.5} distance={6} decay={2} />
    </group>
  );
}

// =================================================================
// Volcano (火山の洞窟) — VoxelGrid 溶岩＋岩
// =================================================================
function VolcanoDecorations() {
  const steamRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (steamRef.current) {
      steamRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.position.y = 0.1 + ((t * 0.3 + i * 0.2) % 1.5);
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.opacity = 0.3 - child.position.y * 0.15;
          }
        }
      });
    }
  });

  return (
    <group>
      {/* VoxelGrid Lava Flows */}
      <VoxelLavaModel position={[-2, 0, -1]} scale={0.5} seed={10001} />
      <VoxelLavaModel position={[1, 0, 1]} scale={0.4} seed={10002} />

      {/* VoxelGrid Rocks (obsidian pillars) */}
      <VoxelRockModel position={[-3, 0, -3.5]} scale={0.7} seed={10010} size={10} />
      <VoxelRockModel position={[3.5, 0, -2]} scale={0.8} seed={10011} size={12} />
      <VoxelRockModel position={[-2, 0, 2.5]} scale={0.6} seed={10012} size={9} />
      <VoxelRockModel position={[2.5, 0, 3]} scale={0.5} seed={10013} size={8} />

      {/* Magma cracks */}
      {[[-2, 0.005, 0], [1, 0.005, -2], [0, 0.005, 3], [-3, 0.005, -1]].map(([x, y, z], i) => (
        <mesh key={`crack-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.1]}>
          <planeGeometry args={[0.06, 1.5 + i * 0.3]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF6347" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Steam vents */}
      <group ref={steamRef}>
        {[[1.5, 0, -3] as const, [-2.5, 0, 1] as const].map(([x, y, z], i) => (
          <group key={`vent-${i}`} position={[x, y, z]}>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.15, 16]} />
              <meshStandardMaterial color="#2d1810" emissive="#FF4500" emissiveIntensity={0.5} />
            </mesh>
            {[0, 1, 2].map(j => (
              <mesh key={`steam-${j}`} position={[Math.sin(j) * 0.05, 0.1 + j * 0.3, Math.cos(j) * 0.05]}>
                <sphereGeometry args={[0.05 + j * 0.02, 12, 8]} />
                <meshStandardMaterial color="#aaa" transparent opacity={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      <pointLight position={[-2, 0.2, 0]} color="#FF4500" intensity={2} distance={3} decay={2} />
      <pointLight position={[1, 0.2, -2]} color="#FF6347" intensity={2} distance={3} decay={2} />
      <pointLight position={[0, 0.1, 2]} color="#FFD700" intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

// =================================================================
// Main ThemeDecorations mapper
// =================================================================
const DECORATION_MAP: Record<RoomTheme, React.FC> = {
  underground: UndergroundDecorations,
  loft: LoftDecorations,
  treehouse: TreehouseDecorations,
  beach: BeachDecorations,
  rooftop: RooftopDecorations,
  space: SpaceDecorations,
  aquarium: AquariumDecorations,
  volcano: VolcanoDecorations,
};

interface ThemeDecorationsProps {
  theme: RoomTheme;
}

export function ThemeDecorations({ theme }: ThemeDecorationsProps) {
  const Component = DECORATION_MAP[theme];
  return <Component />;
}
