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
  VoxelGrassModel, VoxelFireplaceModel,
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
      {/* === 1. 洞窟壁画 — 岩壁に彫られた原始壁画 === */}
      <group position={[-ROOM_W / 2 + 0.14, 1.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Rough stone frame (irregular) */}
        <NoisyBox size={[1.8, 1.3, 0.15]} color="#5C4033" roughness={0.95} seed={4100} bevel={0.02} lightnessSpread={0.2} />
        {/* Cave painting surface (darker stone) */}
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial color="#3a2518" roughness={0.95} />
        </mesh>
        {/* Primitive cave art — stick figures & animals */}
        {[[-0.4, 0.2, '#B8860B'], [0, 0.15, '#8B4513'], [0.3, 0.25, '#B8860B'], [-0.2, -0.1, '#A0522D']].map(([x, y, c], i) => (
          <NoisyBox key={`cave-art-${i}`} size={[0.15 + i * 0.02, 0.25, 0.01]}
            position={[x as number, y as number, 0.09]} color={c as string} roughness={0.9} seed={4110 + i} bevel={0.002} />
        ))}
      </group>

      {/* === 2. 岩棚（自然石の段差）+ 鉱石標本 + 光る瓶 === */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.3]}>
        {/* Rock ledge shelves (irregular stone, not flat boards) */}
        <NoisyBox size={[1.5, 0.1, 0.35]} position={[0, 1.0, 0]} color="#6B5B4A" roughness={0.92} seed={4200} bevel={0.02} lightnessSpread={0.18} />
        <NoisyBox size={[1.3, 0.08, 0.3]} position={[0.1, 1.8, 0]} color="#5C4E3C" roughness={0.9} seed={4201} bevel={0.025} lightnessSpread={0.2} />
        {/* Block letters carved in stone */}
        {['D', 'E', 'E', 'P'].map((_, i) => (
          <NoisyBox key={`rune-${i}`} size={[0.1, 0.13, 0.1]} position={[-0.35 + i * 0.22, 1.9, 0]}
            color={['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'][i]!} roughness={0.5} seed={4210 + i} bevel={0.01} />
        ))}
        {/* Glowing mineral specimens on lower shelf */}
        {[[-0.4, '#7c3aed'], [0, '#22d3ee'], [0.3, '#f472b6']].map(([x, c], i) => (
          <group key={`mineral-${i}`} position={[x as number, 1.08, 0]}>
            <NoisyBox size={[0.07, 0.14, 0.07]} position={[0, 0.07, 0]}
              color={c as string} roughness={0.15} metalness={0.4} seed={4220 + i} bevel={0.008} />
            <pointLight position={[0, 0.12, 0.05]} color={c as string} intensity={0.3} distance={0.8} decay={2} />
          </group>
        ))}
      </group>

      {/* === 3. 重い鉄扉（チェーン+錠前） === */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.2, 2.4, 0.15]} position={[0, 1.2, 0]} color="#4A3728" roughness={0.88} seed={4300} bevel={0.02} lightnessSpread={0.15} />
        <mesh position={[0, 1.2, 0.08]}><planeGeometry args={[0.8, 2.0]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.42, 1.2, 0.12]} rotation={[0, -0.5, 0]}>
          <NoisyBox size={[0.8, 2.0, 0.08]} color="#3a2518" roughness={0.85} seed={4301} bevel={0.015} lightnessSpread={0.15} />
          {/* Iron bands across door */}
          {[0.4, 0, -0.4, -0.8].map((y, i) => (
            <NoisyBox key={`band-${i}`} size={[0.82, 0.04, 0.02]} position={[0, y, 0.05]} color="#555" roughness={0.3} metalness={0.85} seed={4310 + i} bevel={0.003} />
          ))}
          {/* Iron ring handle */}
          <NoisyCylinder args={[0.06, 0.06, 0.025]} position={[-0.15, 0.1, 0.06]} color="#666" roughness={0.2} metalness={0.9} seed={4320} />
          {/* Lock plate */}
          <NoisyBox size={[0.08, 0.1, 0.03]} position={[-0.15, -0.1, 0.06]} color="#555" roughness={0.25} metalness={0.9} seed={4321} bevel={0.005} />
        </group>
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1} distance={2.5} decay={2} />
      </group>

      {/* === 4. 壁松明 x2 (暖色 — 洞窟の照明) === */}
      {[[-ROOM_W / 2 + 0.2, 2.2, -2.5], [-ROOM_W / 2 + 0.2, 2.2, 1.5]].map(([x, y, z], i) => (
        <group key={`torch-${i}`} position={[x!, y!, z!]}>
          <NoisyBox size={[0.06, 0.3, 0.06]} position={[0, 0, 0]} color="#5C3D1E" roughness={0.8} seed={4400 + i} bevel={0.008} />
          <EmissiveBox size={[0.08, 0.12, 0.08]} position={[0, 0.2, 0]} color="#FF6B35" emissiveIntensity={2.5} />
          <EmissiveBox size={[0.05, 0.08, 0.05]} position={[0.02, 0.28, 0]} color="#FFD700" emissiveIntensity={2} />
          <pointLight position={[0, 0.3, 0.1]} color="#FF6B35" intensity={2} distance={4} decay={2} />
        </group>
      ))}

      {/* === 5. 錬金術台 + フラスコ + スクロール === */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        {/* Rough stone table */}
        <NoisyBox size={[1.3, 0.08, 0.6]} position={[0, 0.65, 0]} color="#6B5B4A" roughness={0.9} seed={4500} bevel={0.015} lightnessSpread={0.15} />
        {/* Thick stone legs */}
        {[[-0.5, -0.2], [-0.5, 0.2], [0.5, -0.2], [0.5, 0.2]].map(([x, z], i) => (
          <NoisyBox key={`tleg-${i}`} size={[0.1, 0.65, 0.1]} position={[x!, 0.325, z!]}
            color="#5C4E3C" roughness={0.92} seed={4510 + i} bevel={0.01} lightnessSpread={0.2} />
        ))}
        {/* Bubbling flask (tall conical) */}
        <NoisyCylinder args={[0.04, 0.02, 0.2]} position={[-0.3, 0.8, 0]} color="#88ccaa" roughness={0.1} metalness={0.2} seed={4520} />
        <EmissiveBox size={[0.03, 0.03, 0.03]} position={[-0.3, 0.92, 0]} color="#22d3ee" emissiveIntensity={1.5} />
        {/* Round flask */}
        <NoisySphere args={[0.05, 10, 8]} position={[-0.1, 0.73, 0.1]} color="#aa88cc" roughness={0.1} metalness={0.2} seed={4521} />
        {/* Scroll (rolled parchment) */}
        <NoisyCylinder args={[0.03, 0.03, 0.3]} position={[0.2, 0.72, 0]} rotation={[0, 0.4, Math.PI / 2]} color="#FFF8DC" roughness={0.85} seed={4522} />
        {/* Stone stool */}
        <NoisyCylinder args={[0.15, 0.12, 0.35]} position={[0, 0.175, 0.6]} color="#6B5B4A" roughness={0.9} seed={4530} />
      </group>

      {/* === 6. 鉱石樽（木樽+発光クリスタル） === */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.35, 0.3, 0.6]} position={[0, 0.3, 0]} color="#5C4033" roughness={0.8} seed={4600} />
        <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.15, 0]} color="#555" roughness={0.3} metalness={0.7} seed={4601} />
        <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.45, 0]} color="#555" roughness={0.3} metalness={0.7} seed={4602} />
        {/* Crystals poking out */}
        <NoisyBox size={[0.06, 0.22, 0.06]} position={[-0.08, 0.72, 0]} color="#7c3aed" roughness={0.15} metalness={0.4} seed={4610} bevel={0.008} />
        <NoisyBox size={[0.05, 0.17, 0.05]} position={[0.1, 0.68, 0.06]} color="#22d3ee" roughness={0.15} metalness={0.4} seed={4611} bevel={0.008} />
        <NoisyBox size={[0.04, 0.13, 0.04]} position={[0, 0.65, -0.08]} color="#f472b6" roughness={0.15} metalness={0.4} seed={4612} bevel={0.006} />
        <pointLight position={[0, 0.75, 0]} color="#7c3aed" intensity={0.6} distance={1.5} decay={2} />
      </group>

      {/* === 7. 発光キノコ鉢 (地下室特有) === */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#4A3728" roughness={0.85} seed={4700} bevel={0.01} lightnessSpread={0.15} />
        <NoisyCylinder args={[0.02, 0.03, 0.2]} position={[0, 0.35, 0]} color="#8B7355" roughness={0.9} seed={4701} />
        <NoisySphere args={[0.08, 10, 8]} position={[0, 0.5, 0]} color="#7c3aed" roughness={0.3} seed={4702} />
        <NoisySphere args={[0.05, 8, 6]} position={[0.06, 0.42, 0.03]} color="#a78bfa" roughness={0.3} seed={4703} />
        <pointLight position={[0, 0.5, 0.05]} color="#7c3aed" intensity={0.4} distance={1.5} decay={2} />
      </group>
      <group position={[-ROOM_W / 2 + 0.6, 0, 2.5]}>
        <NoisyBox size={[0.2, 0.15, 0.2]} position={[0, 0.075, 0]} color="#4A3728" roughness={0.85} seed={4710} bevel={0.01} />
        <NoisyCylinder args={[0.015, 0.025, 0.15]} position={[0, 0.22, 0]} color="#6B5B4A" roughness={0.9} seed={4711} />
        <NoisySphere args={[0.06, 8, 6]} position={[0, 0.35, 0]} color="#22d3ee" roughness={0.3} seed={4712} />
        <pointLight position={[0, 0.35, 0]} color="#22d3ee" intensity={0.3} distance={1} decay={2} />
      </group>

      {/* === 8. カラフルブロック積み木 === */}
      <group position={[-2.5, 0, 2.5]}>
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.06, 0]} color="#E74C3C" roughness={0.5} seed={4800} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.06, 0]} color="#3498DB" roughness={0.5} seed={4801} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.18, 0]} color="#F1C40F" roughness={0.5} seed={4802} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.18, 0.05]} color="#2ECC71" roughness={0.5} seed={4803} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.4, 0.06, 0.15]} color="#9B59B6" roughness={0.5} seed={4804} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[-0.2, 0.06, 0.3]} color="#E74C3C" roughness={0.5} seed={4805} bevel={0.01} />
      </group>

      {/* === 9. 開いた本（古い革表紙） === */}
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={4900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={4901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#4A3728" roughness={0.85} seed={4902} bevel={0.002} />
      </group>
      <group position={[1.8, 0.01, 2.7]} rotation={[0, -0.5, 0]}>
        <NoisyBox size={[0.18, 0.04, 0.25]} position={[0, 0.02, 0]} color="#4B0082" roughness={0.7} seed={4910} bevel={0.005} />
      </group>

      {/* === 10. 小瓶（ポーション — 錬金術風） === */}
      <group position={[0, 0, 2]}>
        <group position={[-0.15, 0, 0]}>
          <NoisyCylinder args={[0.03, 0.02, 0.16]} position={[0, 0.08, 0]} color="#7c3aed" roughness={0.1} metalness={0.2} seed={19200} />
          <NoisyCylinder args={[0.015, 0.015, 0.03]} position={[0, 0.17, 0]} color="#DEB887" roughness={0.8} seed={19201} />
        </group>
        <group position={[0.15, 0, -0.05]}>
          <NoisyCylinder args={[0.025, 0.02, 0.12]} position={[0, 0.06, 0]} color="#22d3ee" roughness={0.1} metalness={0.2} seed={19202} />
          <NoisyCylinder args={[0.012, 0.012, 0.03]} position={[0, 0.13, 0]} color="#DEB887" roughness={0.8} seed={19203} />
        </group>
      </group>

      {/* === 11. 散乱キューブ === */}
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#3498DB" roughness={0.5} seed={19456} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#818cf8" roughness={0.5} seed={19457} bevel={0.008} />

      {/* === 12. 岩壁テクスチャ（不規則な石塊） === */}
      {[[-ROOM_W / 2 + 0.08, 0.5, -2.5], [-ROOM_W / 2 + 0.06, 1.3, 0.5], [-ROOM_W / 2 + 0.1, 0.3, 2]].map(([x, y, z], i) => (
        <NoisyBox key={`wallrock-${i}`} size={[0.08, 0.15 + i * 0.05, 0.2]} position={[x!, y!, z!]}
          color={['#5C4E3C', '#4A3728', '#6B5B4A'][i]!} roughness={0.95} seed={19712 + i} bevel={0.015} lightnessSpread={0.2} />
      ))}
      {/* Door-side shelf (natural rock ledge) */}
      <group position={[-0.5, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[0.9, 0.08, 0.3]} position={[0, 1.4, 0]} color="#5C4E3C" roughness={0.92} seed={19728} bevel={0.02} lightnessSpread={0.2} />
        {[[-0.25, '#a78bfa'], [0, '#22d3ee'], [0.2, '#f472b6']].map(([x, c], i) => (
          <NoisyBox key={`ledge-item-${i}`} size={[0.06, 0.1, 0.06]} position={[x as number, 1.5, 0]}
            color={c as string} roughness={0.2} metalness={0.3} seed={19744 + i} bevel={0.005} />
        ))}
      </group>
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

      {/* Fireplace — VoxelGrid高精細 */}
      <VoxelFireplaceModel position={[-0.7, 0, -ROOM_D / 2 + 0.3]} seed={3150} voxelSize={0.07} scale={1.2} />
      <pointLight ref={fireRef} position={[0, 0.3, -ROOM_D / 2 + 0.5]} color="#FF6B35" intensity={3} distance={4} decay={2} />

      {/* Rug */}
      <NoisyBox size={[2, 0.015, 1.5]} position={[0, 0.008, 1]} color="#8B0000" roughness={0.95} seed={3210} bevel={0.005} />
      {/* === 1. 大型額縁絵画（木枠+風景ピクセルアート）=== */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[1.8, 1.3, 0.08]} color="#8B6914" roughness={0.55} seed={5100} bevel={0.018} />
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[1.55, 1.05]} /><meshStandardMaterial color="#87CEEB" /></mesh>
        {/* Mountains */}
        {[[-0.5, -0.1, 0.35, '#2E7D32'], [-0.15, -0.15, 0.45, '#388E3C'], [0.2, -0.1, 0.4, '#1B5E20'], [0.5, -0.15, 0.3, '#4CAF50']].map(([x, y, h, c], i) => (
          <NoisyBox key={`mtn-${i}`} size={[0.3, h as number, 0.01]} position={[x as number, (y as number) + (h as number) / 2 - 0.15, 0.06]}
            color={c as string} roughness={0.8} seed={5110 + i} bevel={0.004} />
        ))}
        {/* Sun */}
        <mesh position={[0.55, 0.35, 0.06]}><sphereGeometry args={[0.08, 12, 8]} /><meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.5} /></mesh>
        {/* Ground */}
        <NoisyBox size={[1.5, 0.2, 0.01]} position={[0, -0.35, 0.06]} color="#8D6E63" roughness={0.85} seed={5115} bevel={0.003} />
      </group>

      {/* === 2. 木製棚+カラフルフィギュア+ブロック文字 === */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.25]}>
        {/* Wooden wall brackets */}
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 1.2, 0]} color="#654321" roughness={0.7} seed={5200} bevel={0.01} />
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 2.0, 0]} color="#654321" roughness={0.7} seed={5201} bevel={0.01} />
        <NoisyBox size={[0.06, 0.3, 0.04]} position={[-0.65, 1.6, 0.13]} color="#5C3D1E" roughness={0.75} seed={5202} bevel={0.008} />
        <NoisyBox size={[0.06, 0.3, 0.04]} position={[0.65, 1.6, 0.13]} color="#5C3D1E" roughness={0.75} seed={5203} bevel={0.008} />
        {['H', 'O', 'M', 'E'].map((_, i) => (
          <NoisyBox key={`lbl-${i}`} size={[0.12, 0.15, 0.12]} position={[-0.4 + i * 0.25, 2.1, 0]}
            color={['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'][i]!} roughness={0.5} seed={5210 + i} bevel={0.01} />
        ))}
        {/* Animal figurines on lower shelf */}
        {[[-0.35, '#FF6B6B'], [0, '#4ECDC4'], [0.3, '#FFE66D']].map(([x, c], i) => (
          <group key={`fig-${i}`} position={[x as number, 1.28, 0]}>
            <NoisyBox size={[0.06, 0.08, 0.06]} position={[0, 0.04, 0]} color={c as string} roughness={0.6} seed={5220 + i} bevel={0.008} />
            <NoisySphere args={[0.035, 8, 6]} position={[0, 0.1, 0]} color={c as string} roughness={0.5} seed={5225 + i} />
          </group>
        ))}
      </group>

      {/* === 3. 白い木目ドア（ガラス窓付き、開放） === */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.1, 2.4, 0.1]} position={[0, 1.2, 0]} color="#F5F5F0" roughness={0.5} seed={5300} bevel={0.015} />
        <mesh position={[0, 1.2, 0.06]}><planeGeometry args={[0.85, 2.1]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.45, 1.2, 0.1]} rotation={[0, -0.55, 0]}>
          <NoisyBox size={[0.85, 2.1, 0.05]} color="#FFFFFF" roughness={0.45} seed={5301} bevel={0.012} />
          {/* Door panels (raised rectangles) */}
          <NoisyBox size={[0.6, 0.4, 0.015]} position={[0, 0.5, 0.03]} color="#F0F0F0" roughness={0.5} seed={5302} bevel={0.008} />
          <NoisyBox size={[0.6, 0.4, 0.015]} position={[0, -0.3, 0.03]} color="#F0F0F0" roughness={0.5} seed={5303} bevel={0.008} />
          {/* Brass doorknob */}
          <NoisySphere args={[0.03, 10, 8]} position={[-0.3, 0, 0.04]} color="#DAA520" roughness={0.2} metalness={0.8} seed={5304} />
        </group>
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1.5} distance={3} decay={2} />
      </group>

      {/* === 4. フラッシュシーリングライト（暖色円盤） === */}
      <group position={[0, ROOM_H - 0.05, 0]}>
        <NoisyCylinder args={[0.25, 0.25, 0.04]} position={[0, 0, 0]} color="#F5F0E0" roughness={0.4} seed={5400} />
        <EmissiveBox size={[0.3, 0.02, 0.3]} position={[0, -0.03, 0]} color="#FFF8E1" emissiveIntensity={1.5} />
        <pointLight position={[0, -0.1, 0]} color="#FFF8E1" intensity={3} distance={6} decay={2} castShadow />
      </group>

      {/* === 5. 木製デスク+レトロPC+椅子 === */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyBox size={[1.3, 0.06, 0.6]} position={[0, 0.7, 0]} color="#78350f" roughness={0.65} seed={5500} bevel={0.012} />
        {[[-0.55, -0.23], [-0.55, 0.23], [0.55, -0.23], [0.55, 0.23]].map(([x, z], i) => (
          <NoisyBox key={`dl-${i}`} size={[0.06, 0.7, 0.06]} position={[x!, 0.35, z!]} color="#5c3a1e" roughness={0.7} seed={5510 + i} bevel={0.008} />
        ))}
        {/* Retro PC — beige box + CRT monitor */}
        <NoisyBox size={[0.3, 0.2, 0.22]} position={[0.35, 0.84, -0.1]} color="#D4C5A0" roughness={0.55} seed={5520} bevel={0.01} />
        <NoisyBox size={[0.35, 0.3, 0.04]} position={[-0.1, 1.0, -0.15]} color="#D4C5A0" roughness={0.5} seed={5521} bevel={0.01} />
        <mesh position={[-0.1, 1.02, -0.12]}><planeGeometry args={[0.28, 0.22]} /><meshStandardMaterial color="#333" emissive="#4a6741" emissiveIntensity={0.3} /></mesh>
        {/* Keyboard */}
        <NoisyBox size={[0.35, 0.015, 0.12]} position={[-0.1, 0.74, 0.12]} color="#C8C0B0" roughness={0.5} seed={5522} bevel={0.005} />
        {/* Wooden chair */}
        <group position={[0, 0, 0.65]}>
          <NoisyBox size={[0.35, 0.04, 0.35]} position={[0, 0.4, 0]} color="#654321" roughness={0.7} seed={5530} bevel={0.01} />
          <NoisyBox size={[0.35, 0.35, 0.04]} position={[0, 0.6, -0.15]} color="#654321" roughness={0.7} seed={5531} bevel={0.01} />
          {[[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].map(([x, z], i) => (
            <NoisyBox key={`cl-${i}`} size={[0.035, 0.4, 0.035]} position={[x!, 0.2, z!]} color="#5C3D1E" roughness={0.75} seed={5535 + i} bevel={0.006} />
          ))}
        </group>
      </group>

      {/* === 6. 木籠バスケット（ぬいぐるみ入り） === */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.28, 0.5]} position={[0, 0.25, 0]} color="#B8860B" roughness={0.85} seed={5600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#8B6914" roughness={0.8} seed={5601} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.38, 0]} color="#8B6914" roughness={0.8} seed={5602} />
        {/* Stuffed toys poking out */}
        <NoisySphere args={[0.07, 10, 8]} position={[-0.05, 0.55, 0]} color="#FFB6C1" roughness={0.8} seed={5610} />
        <NoisySphere args={[0.06, 8, 6]} position={[0.1, 0.52, 0.05]} color="#87CEEB" roughness={0.8} seed={5611} />
        <NoisySphere args={[0.05, 8, 6]} position={[0, 0.5, -0.08]} color="#FFE66D" roughness={0.8} seed={5612} />
      </group>

      {/* === 7. テラコッタ鉢植え（ポトス+ゴムの木） === */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyCylinder args={[0.12, 0.1, 0.2]} position={[0, 0.1, 0]} color="#C2784A" roughness={0.75} seed={5700} />
        <NoisyCylinder args={[0.02, 0.015, 0.45]} position={[0, 0.45, 0]} color="#228B22" roughness={0.8} seed={5701} />
        <NoisySphere args={[0.12, 12, 8]} position={[0, 0.7, 0]} color="#4CAF50" roughness={0.7} seed={5702} lightnessSpread={0.15} />
        <NoisySphere args={[0.08, 10, 7]} position={[0.08, 0.8, 0.04]} color="#66BB6A" roughness={0.75} seed={5703} />
      </group>
      <group position={[-ROOM_W / 2 + 0.6, 0, 2.5]}>
        <NoisyCylinder args={[0.1, 0.08, 0.16]} position={[0, 0.08, 0]} color="#C2784A" roughness={0.75} seed={5710} />
        <NoisyCylinder args={[0.015, 0.012, 0.3]} position={[0, 0.3, 0]} color="#228B22" roughness={0.8} seed={5711} />
        <NoisySphere args={[0.08, 10, 7]} position={[0, 0.48, 0]} color="#4CAF50" roughness={0.7} seed={5712} />
      </group>

      {/* === 8-11: 共通小物（ブロック、本、ポーション、キューブ） === */}
      <group position={[-2.5, 0, 2.5]}>
        {['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E74C3C'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[i < 4 ? (i % 2) * 0.13 : i === 4 ? 0.4 : -0.2, i < 2 ? 0.06 : i < 4 ? 0.18 : 0.06, i > 3 ? i * 0.06 : (i > 2 ? 0.05 : 0)]}
            color={c} roughness={0.5} seed={5800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={5900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={5901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#8B0000" roughness={0.7} seed={5902} bevel={0.002} />
      </group>
      <group position={[1.8, 0.01, 2.7]} rotation={[0, -0.5, 0]}>
        <NoisyBox size={[0.18, 0.04, 0.25]} position={[0, 0.02, 0]} color="#00008B" roughness={0.7} seed={5910} bevel={0.005} />
      </group>
      <group position={[0, 0, 2]}>
        <NoisyCylinder args={[0.03, 0.02, 0.14]} position={[-0.15, 0.07, 0]} color="#B0E0E6" roughness={0.1} metalness={0.2} seed={5920} />
        <NoisyBox size={[0.04, 0.03, 0.04]} position={[-0.15, 0.15, 0]} color="#DEB887" roughness={0.8} seed={5921} bevel={0.003} />
        <NoisyCylinder args={[0.025, 0.02, 0.11]} position={[0.15, 0.055, -0.05]} color="#FFB6C1" roughness={0.1} metalness={0.2} seed={5922} />
        <NoisyBox size={[0.035, 0.025, 0.035]} position={[0.15, 0.12, -0.05]} color="#DEB887" roughness={0.8} seed={5923} bevel={0.003} />
      </group>
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#3498DB" roughness={0.5} seed={5930} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#818cf8" roughness={0.5} seed={5931} bevel={0.008} />

      {/* === 12. 壁テクスチャ: 暖色腰壁（下1/3ティール+上2/3ベージュ） === */}
      {/* Lower wainscoting accent (on left wall) */}
      <group position={[-ROOM_W / 2 + 0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[ROOM_D - 0.5, 0.03, 0.02]} position={[0, ROOM_H * 0.33, 0]} color="#2A9D8F" roughness={0.6} seed={5940} bevel={0.003} />
      </group>
      {/* Door-side shelf */}
      <group position={[-0.5, 0, -ROOM_D / 2 + 0.25]}>
        <NoisyBox size={[0.9, 0.05, 0.25]} position={[0, 1.5, 0]} color="#654321" roughness={0.7} seed={5950} bevel={0.01} />
        {[[-0.25, '#FFD54F'], [0, '#81C784'], [0.2, '#FF8A80']].map(([x, c], i) => (
          <NoisySphere key={`sf-${i}`} args={[0.03, 8, 6]} position={[x as number, 1.58, 0]} color={c as string} roughness={0.6} seed={5955 + i} />
        ))}
      </group>
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

      {/* Leaf clusters — 壁/枝の接合部に自然に配置 */}
      {[
        [-ROOM_W / 2 + 0.3, 2.6, -2, 0.2], [-ROOM_W / 2 + 0.3, 2.0, 1, 0.22],
        [ROOM_W / 2 - 0.3, 2.0, 0.5, 0.18], [ROOM_W / 2 - 0.3, 2.5, -1.5, 0.2],
      ].map(([x, y, z, size], i) => (
        <group key={`leaf-cluster-${i}`} position={[x!, y!, z!]}>
          <NoisyBox size={[size!, size! * 0.7, size!]} position={[0, 0, 0]}
            color={['#228B22', '#2E8B57', '#4CAF50', '#1B5E20'][i % 4]!}
            roughness={0.88} seed={3210 + i} bevel={0.02} lightnessSpread={0.2} />
          <NoisyBox size={[size! * 0.6, size! * 0.5, size! * 0.6]}
            position={[size! * 0.3, -0.02, size! * 0.2]}
            color={i % 2 === 0 ? '#2E7D32' : '#43A047'}
            roughness={0.85} seed={3250 + i} bevel={0.015} />
        </group>
      ))}

      {/* VoxelGrid Mushrooms — 壁際にまとめて配置 */}
      <VoxelMushroomModel position={[-ROOM_W / 2 + 0.8, 0, 2.5]} scale={0.6} seed={6001} />
      <VoxelMushroomModel position={[-ROOM_W / 2 + 1.2, 0, 2.8]} scale={0.45} seed={6002} />
      <VoxelMushroomModel position={[ROOM_W / 2 - 0.8, 0, -2.5]} scale={0.5} seed={6003} />

      {/* Lantern */}
      <group position={[0, 2.2, 0]}>
        <NoisyBox size={[0.12, 0.16, 0.12]} position={[0, 0, 0]} color="#B8860B" roughness={0.4} metalness={0.3} seed={3280} bevel={0.012} />
        <EmissiveBox size={[0.08, 0.1, 0.08]} position={[0, 0, 0]} color="#FFAA00" emissiveIntensity={1.5} />
        <pointLight ref={lanternRef} position={[0, 0, 0]} color="#FFAA00" intensity={2} distance={4} decay={2} />
      </group>

      <pointLight position={[-2, 1.5, 1]} color="#90EE90" intensity={0.5} distance={3} decay={2} />
      {/* === Treehouse 12 unique elements === */}
      {/* 1. Round window (looking out at forest canopy) */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyCylinder args={[0.65, 0.65, 0.1]} color="#5C3D1E" roughness={0.75} seed={6100} />
        <mesh position={[0, 0, 0.06]}><circleGeometry args={[0.55, 24]} /><meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.15} /></mesh>
        <NoisySphere args={[0.15, 10, 8]} position={[-0.15, 0.1, 0.065]} color="#4CAF50" roughness={0.7} seed={6110} />
        <NoisySphere args={[0.1, 8, 6]} position={[0.2, -0.05, 0.065]} color="#66BB6A" roughness={0.7} seed={6111} />
      </group>
      {/* 2. Branch shelves + bird figurines + block letters */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[1.3, 0.06, 0.25]} position={[0, 1.2, 0]} color="#5C3D1E" roughness={0.8} seed={6200} bevel={0.015} lightnessSpread={0.15} />
        <NoisyBox size={[1.1, 0.05, 0.22]} position={[0.1, 1.9, 0]} color="#654321" roughness={0.82} seed={6201} bevel={0.018} lightnessSpread={0.18} />
        {['N', 'E', 'S', 'T'].map((_, i) => (
          <NoisyBox key={`rn-${i}`} size={[0.1, 0.12, 0.1]} position={[-0.3 + i * 0.22, 2.0, 0]}
            color={['#F1C40F', '#2ECC71', '#9B59B6', '#E74C3C'][i]!} roughness={0.5} seed={6210 + i} bevel={0.01} />
        ))}
        {[[-0.3, '#FFD54F'], [0, '#A1887F'], [0.25, '#81C784']].map(([x, c], i) => (
          <group key={`bird-${i}`} position={[x as number, 1.28, 0]}>
            <NoisySphere args={[0.035, 8, 6]} position={[0, 0.04, 0]} color={c as string} roughness={0.6} seed={6220 + i} />
            <NoisyBox size={[0.015, 0.015, 0.03]} position={[0, 0.04, 0.035]} color="#FF8C00" roughness={0.5} seed={6225 + i} bevel={0.002} />
          </group>
        ))}
      </group>
      {/* 3. Round wooden hobbit-door */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyCylinder args={[0.55, 0.55, 0.12]} position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]} color="#5C3D1E" roughness={0.78} seed={6300} />
        <mesh position={[0, 1.3, 0.07]}><circleGeometry args={[0.45, 24]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.2, 1.3, 0.1]} rotation={[0, -0.4, 0]}>
          <NoisyCylinder args={[0.45, 0.45, 0.05]} rotation={[Math.PI / 2, 0, 0]} color="#78350f" roughness={0.75} seed={6301} />
          <NoisyBox size={[0.6, 0.04, 0.02]} position={[0, -0.15, 0.03]} color="#5C3D1E" roughness={0.7} seed={6305} bevel={0.003} />
          <NoisyBox size={[0.6, 0.04, 0.02]} position={[0, 0.15, 0.03]} color="#5C3D1E" roughness={0.7} seed={6306} bevel={0.003} />
          <NoisySphere args={[0.03, 8, 6]} position={[-0.2, 0, 0.04]} color="#8B6914" roughness={0.3} metalness={0.7} seed={6310} />
        </group>
        <pointLight position={[0, 1.3, 0.3]} color="#FFAA00" intensity={1.2} distance={2.5} decay={2} />
      </group>
      {/* 4. Hanging lantern */}
      <group position={[0, ROOM_H - 0.1, 0]}>
        <NoisyCylinder args={[0.01, 0.01, 0.4]} position={[0, -0.2, 0]} color="#5C3D1E" roughness={0.8} seed={6400} />
        <NoisyBox size={[0.15, 0.2, 0.15]} position={[0, -0.5, 0]} color="#B8860B" roughness={0.3} metalness={0.5} seed={6401} bevel={0.01} />
        <EmissiveBox size={[0.08, 0.1, 0.08]} position={[0, -0.5, 0]} color="#FFAA00" emissiveIntensity={2} />
        <pointLight position={[0, -0.55, 0]} color="#FFAA00" intensity={3} distance={5} decay={2} castShadow />
      </group>
      {/* 5. Mushroom stump desk + compass + map */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyCylinder args={[0.35, 0.3, 0.65]} position={[0, 0.325, 0]} color="#5C3D1E" roughness={0.85} seed={6500} />
        <NoisyCylinder args={[0.45, 0.45, 0.05]} position={[0, 0.68, 0]} color="#6B4E14" roughness={0.75} seed={6501} />
        <NoisyCylinder args={[0.05, 0.05, 0.015]} position={[-0.15, 0.71, 0.1]} color="#DAA520" roughness={0.2} metalness={0.8} seed={6505} />
        <NoisyBox size={[0.3, 0.01, 0.25]} position={[0.1, 0.71, -0.05]} color="#FFF8DC" roughness={0.85} seed={6506} bevel={0.003} />
        <NoisyCylinder args={[0.2, 0.15, 0.3]} position={[0, 0.15, 0.6]} color="#5C3D1E" roughness={0.85} seed={6510} />
      </group>
      {/* 6. Woven vine barrel with acorns */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.25, 0.5]} position={[0, 0.25, 0]} color="#5C3D1E" roughness={0.85} seed={6600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#228B22" roughness={0.6} seed={6601} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.38, 0]} color="#228B22" roughness={0.6} seed={6602} />
        {[[-0.06, '#8D6E63'], [0.08, '#A1887F'], [0, '#795548']].map(([x, c], i) => (
          <NoisySphere key={`acorn-${i}`} args={[0.04, 8, 6]} position={[x as number, 0.55, i * 0.04 - 0.04]} color={c as string} roughness={0.7} seed={6610 + i} />
        ))}
      </group>
      {/* 7. Flower pots (vine+flower) */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#78350f" roughness={0.75} seed={6700} bevel={0.01} />
        <NoisyCylinder args={[0.015, 0.012, 0.35]} position={[0, 0.4, 0]} color="#228B22" roughness={0.8} seed={6701} />
        <NoisySphere args={[0.1, 10, 8]} position={[0, 0.6, 0]} color="#4CAF50" roughness={0.7} seed={6702} />
        <NoisySphere args={[0.03, 6, 4]} position={[0.06, 0.68, 0.05]} color="#FF80AB" roughness={0.5} seed={6703} />
      </group>
      <group position={[-ROOM_W / 2 + 0.6, 0, 2.5]}>
        <NoisyBox size={[0.2, 0.15, 0.2]} position={[0, 0.075, 0]} color="#78350f" roughness={0.75} seed={6710} bevel={0.01} />
        <NoisyCylinder args={[0.012, 0.01, 0.25]} position={[0, 0.27, 0]} color="#228B22" roughness={0.8} seed={6711} />
        <NoisySphere args={[0.06, 8, 6]} position={[0, 0.42, 0]} color="#81C784" roughness={0.7} seed={6712} />
      </group>
      {/* 8. 積み木ブロック — 棚の近くにまとめて */}
      <group position={[ROOM_W / 2 - 1.5, 0, -ROOM_D / 2 + 0.5]}>
        {['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.14, Math.floor(i / 2) * 0.13 + 0.06, 0]}
            color={c} roughness={0.5} seed={6800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={6900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={6901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#006400" roughness={0.7} seed={6902} bevel={0.002} />
      </group>
      <NoisyCylinder args={[0.03, 0.02, 0.14]} position={[-0.15, 0.07, 2]} color="#228B22" roughness={0.1} metalness={0.2} seed={6910} />
      <NoisyCylinder args={[0.025, 0.02, 0.11]} position={[0.15, 0.055, 1.95]} color="#FFD54F" roughness={0.1} metalness={0.2} seed={6911} />
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#3498DB" roughness={0.5} seed={6920} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#818cf8" roughness={0.5} seed={6921} bevel={0.008} />
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
      {/* === Beach 12 unique elements === */}
      {/* 1. Surfboard wall art (large) */}
      <group position={[-ROOM_W / 2 + 0.14, 1.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[0.35, 1.6, 0.05]} position={[0, 0, 0]} color="#FFD54F" roughness={0.5} seed={7100} bevel={0.02} />
        <NoisyBox size={[0.28, 0.4, 0.01]} position={[0, 0.3, 0.03]} color="#FF6347" roughness={0.6} seed={7101} bevel={0.01} />
        <NoisyBox size={[0.2, 0.3, 0.01]} position={[0, -0.2, 0.03]} color="#00BCD4" roughness={0.6} seed={7102} bevel={0.008} />
      </group>
      {/* 2. Bamboo shelf + shell collection */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.25]}>
        <NoisyCylinder args={[0.03, 0.03, 1.3]} position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]} color="#D4A574" roughness={0.7} seed={7200} />
        <NoisyCylinder args={[0.03, 0.03, 1.3]} position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]} color="#D4A574" roughness={0.7} seed={7201} />
        {['W', 'A', 'V', 'E'].map((_, i) => (
          <NoisyBox key={`bk-${i}`} size={[0.1, 0.12, 0.1]} position={[-0.35 + i * 0.22, 2.0, 0]}
            color={['#FF6347', '#FFD54F', '#00BCD4', '#2ECC71'][i]!} roughness={0.5} seed={7210 + i} bevel={0.01} />
        ))}
        {[[-0.3, '#FFF5EE'], [0, '#FFE4C4'], [0.2, '#FFDAB9']].map(([x, c], i) => (
          <NoisySphere key={`shell-${i}`} args={[0.035, 8, 6]} position={[x as number, 1.26, 0]} color={c as string} roughness={0.4} seed={7220 + i} />
        ))}
      </group>
      {/* 3. Screen door (mesh + wood frame) */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.0, 2.3, 0.08]} position={[0, 1.15, 0]} color="#D4A574" roughness={0.65} seed={7300} bevel={0.012} />
        <mesh position={[0, 1.15, 0.05]}><planeGeometry args={[0.75, 1.9]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.4, 1.15, 0.1]} rotation={[0, -0.5, 0]}>
          <NoisyBox size={[0.75, 1.9, 0.04]} color="#D4A574" roughness={0.6} seed={7301} bevel={0.01} />
          <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.55, 1.5]} /><meshStandardMaterial color="#aaa" transparent opacity={0.15} /></mesh>
          <NoisyBox size={[0.04, 0.1, 0.03]} position={[-0.25, 0, 0.03]} color="#C0C0C0" roughness={0.2} metalness={0.8} seed={7305} bevel={0.005} />
        </group>
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1.5} distance={3} decay={2} />
      </group>
      {/* 4. Rattan fan light */}
      <group position={[0, ROOM_H - 0.05, 0]}>
        <NoisyCylinder args={[0.3, 0.3, 0.03]} position={[0, 0, 0]} color="#D4A574" roughness={0.7} seed={7400} />
        <EmissiveBox size={[0.15, 0.04, 0.15]} position={[0, -0.03, 0]} color="#FFF8E1" emissiveIntensity={1.5} />
        <pointLight position={[0, -0.1, 0]} color="#FFF8E1" intensity={3} distance={6} decay={2} castShadow />
      </group>
      {/* 5. Driftwood desk + radio + sunglasses */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyBox size={[1.2, 0.06, 0.55]} position={[0, 0.65, 0]} color="#D4A574" roughness={0.8} seed={7500} bevel={0.015} lightnessSpread={0.15} />
        {[[-0.5, -0.2], [-0.5, 0.2], [0.5, -0.2], [0.5, 0.2]].map(([x, z], i) => (
          <NoisyBox key={`bleg-${i}`} size={[0.05, 0.65, 0.05]} position={[x!, 0.325, z!]} color="#A67C50" roughness={0.75} seed={7510 + i} bevel={0.008} />
        ))}
        <NoisyBox size={[0.25, 0.15, 0.12]} position={[-0.2, 0.76, 0]} color="#8B4513" roughness={0.6} seed={7520} bevel={0.01} />
        <NoisyCylinder args={[0.025, 0.025, 0.02]} position={[-0.28, 0.84, 0.06]} color="#333" roughness={0.4} metalness={0.5} seed={7521} />
        <NoisyCylinder args={[0.025, 0.025, 0.02]} position={[-0.12, 0.84, 0.06]} color="#333" roughness={0.4} metalness={0.5} seed={7522} />
        <NoisyBox size={[0.15, 0.02, 0.06]} position={[0.25, 0.69, 0.1]} color="#1a1a1a" roughness={0.3} metalness={0.2} seed={7525} bevel={0.003} />
      </group>
      {/* 6. Coconut shell barrel with shells */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.28, 0.5]} position={[0, 0.25, 0]} color="#A67C50" roughness={0.8} seed={7600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#C0C0C0" roughness={0.3} metalness={0.6} seed={7601} />
        {[[-0.05, '#FFF5EE'], [0.08, '#FFE4C4'], [0, '#87CEEB']].map(([x, c], i) => (
          <NoisySphere key={`sh-${i}`} args={[0.04, 8, 6]} position={[x as number, 0.55, i * 0.03 - 0.03]} color={c as string} roughness={0.4} seed={7610 + i} />
        ))}
      </group>
      {/* 7. Hibiscus + tropical plant */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyCylinder args={[0.12, 0.1, 0.2]} position={[0, 0.1, 0]} color="#C2784A" roughness={0.7} seed={7700} />
        <NoisyCylinder args={[0.015, 0.012, 0.4]} position={[0, 0.45, 0]} color="#228B22" roughness={0.8} seed={7701} />
        <NoisySphere args={[0.1, 10, 8]} position={[0, 0.65, 0]} color="#4CAF50" roughness={0.7} seed={7702} />
        <NoisySphere args={[0.04, 6, 4]} position={[0.05, 0.72, 0.04]} color="#FF6B6B" roughness={0.4} seed={7703} />
      </group>
      {/* 8-11 */}
      <group position={[-2.5, 0, 2.5]}>
        {['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.13, i < 2 ? 0.06 : 0.18, i > 2 ? 0.1 : 0]}
            color={c} roughness={0.5} seed={7800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={7900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={7901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#FF6347" roughness={0.7} seed={7902} bevel={0.002} />
      </group>
      <NoisyCylinder args={[0.03, 0.02, 0.13]} position={[-0.15, 0.065, 2]} color="#00BCD4" roughness={0.1} metalness={0.2} seed={7910} />
      <NoisyCylinder args={[0.025, 0.02, 0.1]} position={[0.15, 0.05, 1.95]} color="#FFD54F" roughness={0.1} metalness={0.2} seed={7911} />
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#00BCD4" roughness={0.5} seed={7920} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#FFD54F" roughness={0.5} seed={7921} bevel={0.008} />
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

      {/* === Rooftop 12 unique elements === */}
      {/* 1. Neon sign wall art */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[1.2, 0.8, 0.05]} color="#333" roughness={0.6} seed={8100} bevel={0.01} />
        <EmissiveBox size={[0.8, 0.05, 0.02]} position={[0, 0.15, 0.04]} color="#FF1493" emissiveIntensity={3} />
        <EmissiveBox size={[0.05, 0.4, 0.02]} position={[-0.4, 0, 0.04]} color="#FF1493" emissiveIntensity={3} />
        <EmissiveBox size={[0.05, 0.4, 0.02]} position={[0.4, 0, 0.04]} color="#00BFFF" emissiveIntensity={3} />
        <EmissiveBox size={[0.8, 0.05, 0.02]} position={[0, -0.15, 0.04]} color="#00BFFF" emissiveIntensity={3} />
        <pointLight position={[0, 0, 0.15]} color="#FF1493" intensity={1} distance={3} decay={2} />
      </group>
      {/* 2. Industrial pipe shelves */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyCylinder args={[0.03, 0.03, 1.4]} position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]} color="#555" roughness={0.3} metalness={0.8} seed={8200} />
        <NoisyCylinder args={[0.03, 0.03, 1.4]} position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]} color="#555" roughness={0.3} metalness={0.8} seed={8201} />
        <NoisyBox size={[1.3, 0.04, 0.25]} position={[0, 1.22, 0]} color="#78909C" roughness={0.5} metalness={0.6} seed={8202} bevel={0.005} />
        <NoisyBox size={[1.3, 0.04, 0.25]} position={[0, 2.02, 0]} color="#78909C" roughness={0.5} metalness={0.6} seed={8203} bevel={0.005} />
        {['R', 'O', 'O', 'F'].map((_, i) => (
          <NoisyBox key={`lb-${i}`} size={[0.1, 0.12, 0.1]} position={[-0.35 + i * 0.22, 2.1, 0]}
            color={['#FF1493', '#00BFFF', '#FFD700', '#FF1493'][i]!} roughness={0.4} seed={8210 + i} bevel={0.01} />
        ))}
      </group>
      {/* 3. Heavy steel fire-exit door */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.1, 2.4, 0.12]} position={[0, 1.2, 0]} color="#555" roughness={0.4} metalness={0.7} seed={8300} bevel={0.015} />
        <mesh position={[0, 1.2, 0.07]}><planeGeometry args={[0.85, 2.1]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.42, 1.2, 0.12]} rotation={[0, -0.45, 0]}>
          <NoisyBox size={[0.85, 2.1, 0.06]} color="#607D8B" roughness={0.35} metalness={0.75} seed={8301} bevel={0.012} />
          <NoisyBox size={[0.08, 0.3, 0.04]} position={[-0.3, 0, 0.05]} color="#888" roughness={0.2} metalness={0.9} seed={8305} bevel={0.005} />
          <EmissiveBox size={[0.06, 0.06, 0.01]} position={[0, 0.8, 0.04]} color="#FF0000" emissiveIntensity={1.5} />
        </group>
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1} distance={2.5} decay={2} />
      </group>
      {/* 4. Ceiling = reuse string lights above */}
      {/* 5. Crate desk + neon lamp */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyBox size={[1.2, 0.5, 0.6]} position={[0, 0.25, 0]} color="#78909C" roughness={0.5} metalness={0.5} seed={8500} bevel={0.012} />
        <NoisyBox size={[1.25, 0.04, 0.65]} position={[0, 0.52, 0]} color="#607D8B" roughness={0.4} metalness={0.6} seed={8501} bevel={0.008} />
        <NoisyCylinder args={[0.02, 0.02, 0.3]} position={[-0.3, 0.7, 0]} color="#333" roughness={0.4} metalness={0.5} seed={8510} />
        <EmissiveBox size={[0.06, 0.04, 0.06]} position={[-0.3, 0.87, 0]} color="#FF1493" emissiveIntensity={2} />
        <pointLight position={[-0.3, 0.87, 0.05]} color="#FF1493" intensity={0.5} distance={1.5} decay={2} />
        <NoisyBox size={[0.3, 0.2, 0.05]} position={[0.2, 0.65, -0.15]} color="#1A1A2E" roughness={0.3} metalness={0.4} seed={8515} bevel={0.008} />
        <mesh position={[0.2, 0.67, -0.12]}><planeGeometry args={[0.24, 0.14]} /><meshStandardMaterial color="#111" emissive="#00BFFF" emissiveIntensity={0.3} /></mesh>
      </group>
      {/* 6. Metal drum container */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.3, 0.6]} position={[0, 0.3, 0]} color="#78909C" roughness={0.4} metalness={0.6} seed={8600} />
        <NoisyCylinder args={[0.31, 0.31, 0.02]} position={[0, 0.6, 0]} color="#607D8B" roughness={0.35} metalness={0.7} seed={8601} />
      </group>
      {/* 7. Concrete planter + succulents */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#888" roughness={0.85} seed={8700} bevel={0.015} />
        <NoisySphere args={[0.1, 10, 8]} position={[0, 0.28, 0]} color="#4CAF50" roughness={0.7} seed={8702} />
        <NoisySphere args={[0.06, 8, 6]} position={[0.06, 0.32, 0.04]} color="#66BB6A" roughness={0.75} seed={8703} />
      </group>
      {/* 8-11 blocks/book/bottles/cubes */}
      <group position={[-2.5, 0, 2.5]}>
        {['#FF1493', '#00BFFF', '#FFD700', '#2ECC71', '#FF1493'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.13, i < 2 ? 0.06 : 0.18, i > 2 ? 0.1 : 0]}
            color={c} roughness={0.5} seed={8800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={8900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={8901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#333" roughness={0.7} seed={8902} bevel={0.002} />
      </group>
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#FF1493" roughness={0.5} seed={8920} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#00BFFF" roughness={0.5} seed={8921} bevel={0.008} />
    </group>
  );
}

// =================================================================
// Space (宇宙ステーション) — ENVIRONMENT_SPECS準拠 12必須要素完全実装
// =================================================================
function SpaceDecorations() {
  const holoRef = useRef<THREE.Mesh>(null);
  const panelRef = useRef<THREE.Group>(null);
  const monitorRef = useRef<THREE.Group>(null);
  const plantRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Hologram planet rotation
    if (holoRef.current) {
      holoRef.current.rotation.y = t * 0.3;
      holoRef.current.position.y = 1.5 + Math.sin(t * 0.5) * 0.1;
      if (holoRef.current.material instanceof THREE.MeshStandardMaterial) {
        holoRef.current.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
      }
    }
    // Monitor screen flicker
    if (monitorRef.current) {
      monitorRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 1.2 + Math.sin(t * 3 + i * 1.5) * 0.3;
        }
      });
    }
    // Wall indicator panel
    if (panelRef.current) {
      panelRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = i % 3 === 0 ? 1 + Math.sin(t * 4 + i) * 0.5 : 0.5 + Math.sin(t * 2 + i * 0.5) * 0.3;
        }
      });
    }
    // Glowing plant pulse
    if (plantRef.current) {
      plantRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 0.6 + Math.sin(t * 0.8 + i * 2) * 0.3;
        }
      });
    }
  });

  return (
    <group>
      {/* ============================================================ */}
      {/* 1. 大型壁面装飾 — 左壁のデータチャートフレーム (壁面積30%) */}
      {/* ============================================================ */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Frame (dark metal) */}
        <NoisyBox size={[2.2, 1.5, 0.06]} color="#2A2A3E" roughness={0.2} metalness={0.85} seed={8100} bevel={0.015} />
        {/* Screen content — data chart */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[2.0, 1.3]} />
          <meshStandardMaterial color="#0a0a2e" emissive="#1a3a6e" emissiveIntensity={0.4} />
        </mesh>
        {/* Chart grid lines (horizontal) */}
        {[0.4, 0.15, -0.1, -0.35].map((y, i) => (
          <mesh key={`hline-${i}`} position={[0, y, 0.05]}>
            <planeGeometry args={[1.8, 0.005]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.4} />
          </mesh>
        ))}
        {/* Chart grid lines (vertical) */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={`vline-${i}`} position={[x, 0, 0.05]}>
            <planeGeometry args={[0.005, 1.1]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={0.3} />
          </mesh>
        ))}
        {/* Data points on chart */}
        {[[-0.5, 0.1], [-0.2, 0.35], [0.1, -0.05], [0.4, 0.25], [0.7, 0.15]].map(([x, y], i) => (
          <mesh key={`dp-${i}`} position={[x!, y!, 0.055]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
          </mesh>
        ))}
        {/* Data lines connecting points */}
        <mesh position={[0.1, 0.16, 0.053]}>
          <planeGeometry args={[1.3, 0.015]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.5} transparent opacity={0.6} />
        </mesh>
        <pointLight position={[0, 0, 0.15]} color="#22d3ee" intensity={0.5} distance={2} decay={2} />
      </group>

      {/* ============================================================ */}
      {/* 2. 棚（2段）+ ミニフィギュア + ブロック文字 — 奥壁ドア右 */}
      {/* ============================================================ */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.25]}>
        {/* Shelf supports */}
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 1.2, 0]} color="#3A3A4E" roughness={0.3} metalness={0.8} seed={8200} bevel={0.008} />
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 2.0, 0]} color="#3A3A4E" roughness={0.3} metalness={0.8} seed={8201} bevel={0.008} />
        {/* Block letters: C R O S S on upper shelf */}
        {['C', 'R', 'O', 'S', 'S'].map((_, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.15, 0.12]} position={[-0.5 + i * 0.25, 2.1, 0]}
            color={['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6'][i]!}
            roughness={0.5} seed={8210 + i} bevel={0.01} />
        ))}
        {/* Mini figures (specimen jars) on lower shelf */}
        {[[-0.4, '#7B68EE'], [0, '#FF69B4'], [0.3, '#00CED1']].map(([x, c], i) => (
          <group key={`jar-${i}`} position={[x as number, 1.28, 0]}>
            {/* Jar */}
            <NoisyBox size={[0.08, 0.14, 0.08]} position={[0, 0.07, 0]} color="#B0C4DE" roughness={0.1} metalness={0.3} seed={8220 + i} bevel={0.005} />
            {/* Creature inside */}
            <mesh position={[0, 0.07, 0]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={1.5} />
            </mesh>
            {/* Lid */}
            <NoisyBox size={[0.1, 0.02, 0.1]} position={[0, 0.15, 0]} color="#C0C0C0" roughness={0.2} metalness={0.9} seed={8230 + i} bevel={0.003} />
          </group>
        ))}
        {/* Small books standing */}
        <NoisyBox size={[0.04, 0.12, 0.08]} position={[0.55, 1.32, 0]} color="#1a1a4e" roughness={0.8} seed={8240} bevel={0.005} />
        <NoisyBox size={[0.035, 0.1, 0.07]} position={[0.6, 1.3, 0]} color="#2d1810" roughness={0.85} seed={8241} bevel={0.004} />
      </group>

      {/* Shelf left of door (1 shelf) */}
      <group position={[-0.5, 0, -ROOM_D / 2 + 0.25]}>
        <NoisyBox size={[1.0, 0.05, 0.3]} position={[0, 1.5, 0]} color="#3A3A4E" roughness={0.3} metalness={0.8} seed={8250} bevel={0.008} />
        {/* Crystals on shelf */}
        {[[-0.3, '#a78bfa'], [0, '#22d3ee'], [0.25, '#f472b6']].map(([x, c], i) => (
          <group key={`crystal-${i}`} position={[x as number, 1.58, 0]}>
            <NoisyBox size={[0.06, 0.12, 0.06]} position={[0, 0.06, 0]}
              color={c as string} roughness={0.15} metalness={0.4} seed={8260 + i} bevel={0.008} />
          </group>
        ))}
      </group>

      {/* ============================================================ */}
      {/* 3. ドア（開放） — 奥壁右寄り、金属金庫風 */}
      {/* ============================================================ */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        {/* Door frame */}
        <NoisyBox size={[1.1, 2.4, 0.12]} position={[0, 1.2, 0]} color="#2A2A3E" roughness={0.3} metalness={0.85} seed={8300} bevel={0.015} />
        {/* Door opening (dark void) */}
        <mesh position={[0, 1.2, 0.07]}>
          <planeGeometry args={[0.85, 2.1]} />
          <meshStandardMaterial color="#080818" />
        </mesh>
        {/* Door panel (swung open to the right) */}
        <group position={[0.45, 1.2, 0.12]} rotation={[0, -0.6, 0]}>
          <NoisyBox size={[0.85, 2.1, 0.06]} color="#3A3A4E" roughness={0.25} metalness={0.85} seed={8301} bevel={0.01} />
          {/* Vault wheel handle */}
          <NoisyCylinder args={[0.12, 0.12, 0.04]} position={[0, 0.2, 0.04]} color="#C0C0C0" roughness={0.15} metalness={0.95} seed={8302} />
          {/* Handle spokes */}
          <NoisyBox size={[0.22, 0.02, 0.02]} position={[0, 0.2, 0.06]} color="#A0A0B0" roughness={0.2} metalness={0.9} seed={8303} bevel={0.003} />
          <NoisyBox size={[0.02, 0.22, 0.02]} position={[0, 0.2, 0.06]} color="#A0A0B0" roughness={0.2} metalness={0.9} seed={8304} bevel={0.003} />
        </group>
        {/* Door frame rivets */}
        {[-1.0, -0.5, 0, 0.5, 1.0].map((y, i) => (
          <mesh key={`dr-${i}`} position={[-0.5, 0.2 + y * 0.4 + 1.2, 0.08]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Warm light from corridor */}
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1.5} distance={3} decay={2} />
      </group>

      {/* ============================================================ */}
      {/* 4. 天井照明 — ペンダントライト（暖色） */}
      {/* ============================================================ */}
      <group position={[0, ROOM_H - 0.1, 0]}>
        {/* Mounting plate */}
        <NoisyCylinder args={[0.08, 0.08, 0.03]} position={[0, 0, 0]} color="#555" roughness={0.2} metalness={0.9} seed={8400} />
        {/* Cable */}
        <NoisyCylinder args={[0.01, 0.01, 0.5]} position={[0, -0.25, 0]} color="#333" roughness={0.3} metalness={0.8} seed={8401} />
        {/* Lampshade (cone) */}
        <mesh position={[0, -0.55, 0]}>
          <coneGeometry args={[0.2, 0.15, 16, 1, true]} />
          <meshStandardMaterial color="#4A4A5E" roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* Bulb (warm glow) */}
        <EmissiveBox size={[0.06, 0.08, 0.06]} position={[0, -0.58, 0]} color="#FFF8E1" emissiveIntensity={2} />
        <pointLight position={[0, -0.6, 0]} color="#FFF8E1" intensity={3} distance={6} decay={2} castShadow />
      </group>

      {/* ============================================================ */}
      {/* 5. デスク + デュアルモニタ + 椅子 — 右壁前 */}
      {/* ============================================================ */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        {/* Desk top */}
        <NoisyBox size={[1.4, 0.06, 0.65]} position={[0, 0.7, 0]} color="#3A3A4E" roughness={0.3} metalness={0.75} seed={8500} bevel={0.01} />
        {/* Desk legs */}
        {[[-0.6, -0.25], [-0.6, 0.25], [0.6, -0.25], [0.6, 0.25]].map(([x, z], i) => (
          <NoisyBox key={`dleg-${i}`} size={[0.05, 0.7, 0.05]} position={[x!, 0.35, z!]}
            color="#2A2A3E" roughness={0.25} metalness={0.85} seed={8510 + i} bevel={0.005} />
        ))}
        {/* Monitor 1 (main, larger) */}
        <group ref={monitorRef}>
          <mesh position={[-0.25, 1.1, -0.15]}>
            <boxGeometry args={[0.55, 0.4, 0.015]} />
            <meshStandardMaterial color="#1A1A2E" emissive="#00BFFF" emissiveIntensity={1.2} />
          </mesh>
          {/* Monitor 1 frame */}
          <NoisyBox size={[0.6, 0.45, 0.03]} position={[-0.25, 1.1, -0.17]} color="#2A2A3E" roughness={0.2} metalness={0.85} seed={8520} bevel={0.008} />
          {/* Monitor 1 stand */}
          <NoisyBox size={[0.04, 0.18, 0.04]} position={[-0.25, 0.84, -0.15]} color="#3A3A4E" roughness={0.25} metalness={0.8} seed={8521} bevel={0.005} />
          {/* Monitor 2 (smaller) */}
          <mesh position={[0.25, 1.05, -0.15]}>
            <boxGeometry args={[0.4, 0.3, 0.015]} />
            <meshStandardMaterial color="#1A1A2E" emissive="#7B68EE" emissiveIntensity={1} />
          </mesh>
          <NoisyBox size={[0.45, 0.35, 0.03]} position={[0.25, 1.05, -0.17]} color="#2A2A3E" roughness={0.2} metalness={0.85} seed={8522} bevel={0.008} />
          <NoisyBox size={[0.04, 0.14, 0.04]} position={[0.25, 0.81, -0.15]} color="#3A3A4E" roughness={0.25} metalness={0.8} seed={8523} bevel={0.005} />
        </group>
        {/* Console/keyboard */}
        <NoisyBox size={[0.6, 0.03, 0.2]} position={[0, 0.74, 0.15]} color="#2A2A3E" roughness={0.35} metalness={0.75} seed={8530} bevel={0.005} />
        {/* Keyboard buttons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`kb-${i}`} position={[-0.2 + i * 0.06, 0.765, 0.15]}>
            <boxGeometry args={[0.04, 0.01, 0.04]} />
            <meshStandardMaterial
              color={i % 4 === 0 ? '#ff4444' : i % 4 === 1 ? '#44ff44' : i % 4 === 2 ? '#4444ff' : '#ffaa00'}
              emissive={i % 4 === 0 ? '#ff4444' : i % 4 === 1 ? '#44ff44' : i % 4 === 2 ? '#4444ff' : '#ffaa00'}
              emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* Monitor light cast */}
        <pointLight position={[-0.25, 1.1, 0.1]} color="#00BFFF" intensity={0.5} distance={2} decay={2} />
        {/* Chair */}
        <group position={[0, 0, 0.7]}>
          <NoisyBox size={[0.4, 0.04, 0.4]} position={[0, 0.4, 0]} color="#3A3A4E" roughness={0.4} metalness={0.7} seed={8540} bevel={0.008} />
          <NoisyBox size={[0.4, 0.35, 0.04]} position={[0, 0.6, -0.18]} color="#3A3A4E" roughness={0.4} metalness={0.7} seed={8541} bevel={0.008} />
          {/* Chair legs */}
          {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
            <NoisyCylinder key={`cleg-${i}`} args={[0.02, 0.02, 0.4]} position={[x!, 0.2, z!]}
              color="#555" roughness={0.2} metalness={0.9} seed={8550 + i} />
          ))}
        </group>
      </group>

      {/* ============================================================ */}
      {/* 6. 丸型コンテナ（樽） — 中央、発光クリスタル入り */}
      {/* ============================================================ */}
      <group position={[-1, 0, 0.5]}>
        {/* Barrel body (cylinder approximated with boxes) */}
        <NoisyCylinder args={[0.35, 0.3, 0.6]} position={[0, 0.3, 0]} color="#5C4033" roughness={0.8} seed={8600} />
        {/* Metal bands */}
        <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.15, 0]} color="#888" roughness={0.3} metalness={0.8} seed={8601} />
        <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.45, 0]} color="#888" roughness={0.3} metalness={0.8} seed={8602} />
        {/* Crystal contents (sticking out) */}
        <NoisyBox size={[0.06, 0.2, 0.06]} position={[-0.1, 0.7, 0]} color="#a78bfa" roughness={0.15} metalness={0.3} seed={8610} bevel={0.008} />
        <NoisyBox size={[0.05, 0.15, 0.05]} position={[0.08, 0.65, 0.05]} color="#22d3ee" roughness={0.15} metalness={0.3} seed={8611} bevel={0.008} />
        <NoisyBox size={[0.04, 0.12, 0.04]} position={[0, 0.63, -0.08]} color="#f472b6" roughness={0.15} metalness={0.3} seed={8612} bevel={0.006} />
        <pointLight position={[0, 0.7, 0]} color="#a78bfa" intensity={0.6} distance={1.5} decay={2} />
      </group>

      {/* ============================================================ */}
      {/* 7. 発光植物 x2 — 左壁前、金属プランター */}
      {/* ============================================================ */}
      <group ref={plantRef}>
        {/* Plant 1 (tall) */}
        <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
          {/* Metal planter */}
          <NoisyBox size={[0.3, 0.25, 0.3]} position={[0, 0.125, 0]} color="#4A4A5E" roughness={0.3} metalness={0.8} seed={8700} bevel={0.01} />
          {/* Stem */}
          <NoisyCylinder args={[0.02, 0.015, 0.5]} position={[0, 0.5, 0]} color="#228B22" roughness={0.8} seed={8701} />
          {/* Glowing leaves */}
          <mesh position={[-0.06, 0.65, 0.04]}>
            <sphereGeometry args={[0.08, 12, 8]} />
            <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.6} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.05, 0.75, -0.03]}>
            <sphereGeometry args={[0.06, 10, 6]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.65} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
          <pointLight position={[0, 0.7, 0]} color="#00FF88" intensity={0.3} distance={1.5} decay={2} />
        </group>
        {/* Plant 2 (short) */}
        <group position={[-ROOM_W / 2 + 0.6, 0, 2.5]}>
          <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#4A4A5E" roughness={0.3} metalness={0.8} seed={8710} bevel={0.01} />
          <NoisyCylinder args={[0.02, 0.015, 0.3]} position={[0, 0.35, 0]} color="#1B5E20" roughness={0.85} seed={8711} />
          <mesh position={[0.04, 0.45, 0]}>
            <sphereGeometry args={[0.06, 10, 7]} />
            <meshStandardMaterial color="#00FFAA" emissive="#00FFAA" emissiveIntensity={0.6} transparent opacity={0.7} />
          </mesh>
          <mesh position={[-0.03, 0.52, 0.02]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} transparent opacity={0.6} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 8. カラフルブロック積み木 — 床の左手前 */}
      {/* ============================================================ */}
      <group position={[-2.5, 0, 2.5]}>
        {/* Stacked blocks (L-shape) */}
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.06, 0]} color="#E74C3C" roughness={0.5} seed={8800} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.06, 0]} color="#3498DB" roughness={0.5} seed={8801} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.18, 0]} color="#F1C40F" roughness={0.5} seed={8802} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.18, 0.05]} color="#2ECC71" roughness={0.5} seed={8803} bevel={0.01} />
        {/* Scattered singles */}
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.4, 0.06, 0.15]} color="#9B59B6" roughness={0.5} seed={8804} bevel={0.01} />
        <NoisyBox size={[0.12, 0.12, 0.12]} position={[-0.2, 0.06, 0.3]} color="#E74C3C" roughness={0.5} seed={8805} bevel={0.01} />
      </group>

      {/* ============================================================ */}
      {/* 9. 開いた本 — 床の右手前 */}
      {/* ============================================================ */}
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        {/* Left page */}
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={8900} bevel={0.003} />
        {/* Right page */}
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={8901} bevel={0.003} />
        {/* Spine */}
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#654321" roughness={0.7} seed={8902} bevel={0.002} />
        {/* Text lines on left page */}
        {[-0.08, -0.04, 0, 0.04, 0.08].map((z, i) => (
          <mesh key={`txt-${i}`} position={[-0.1, 0.02, z]}>
            <planeGeometry args={[0.14, 0.008]} />
            <meshStandardMaterial color="#AAA" />
          </mesh>
        ))}
        {/* Circuit diagram on right page */}
        <mesh position={[0.1, 0.02, 0]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} transparent opacity={0.3} />
        </mesh>
      </group>
      {/* Second book (closed, nearby) */}
      <group position={[1.8, 0.01, 2.7]} rotation={[0, -0.5, 0]}>
        <NoisyBox size={[0.18, 0.04, 0.25]} position={[0, 0.02, 0]} color="#1a1a4e" roughness={0.7} seed={8910} bevel={0.005} />
      </group>

      {/* ============================================================ */}
      {/* 10. 小瓶/ポーション — 床の中央手前 */}
      {/* ============================================================ */}
      <group position={[0, 0, 2]}>
        {/* Bottle 1 (pink) */}
        <group position={[-0.15, 0, 0]}>
          <NoisyBox size={[0.06, 0.16, 0.06]} position={[0, 0.08, 0]} color="#FF69B4" roughness={0.1} metalness={0.2} seed={9000} bevel={0.006} />
          <NoisyBox size={[0.04, 0.04, 0.04]} position={[0, 0.17, 0]} color="#C0C0C0" roughness={0.2} metalness={0.9} seed={9001} bevel={0.003} />
        </group>
        {/* Bottle 2 (cyan) */}
        <group position={[0.15, 0, -0.05]}>
          <NoisyBox size={[0.05, 0.12, 0.05]} position={[0, 0.06, 0]} color="#B0E0E6" roughness={0.1} metalness={0.2} seed={9002} bevel={0.005} />
          <NoisyBox size={[0.035, 0.03, 0.035]} position={[0, 0.13, 0]} color="#C0C0C0" roughness={0.2} metalness={0.9} seed={9003} bevel={0.003} />
        </group>
      </group>

      {/* ============================================================ */}
      {/* 11. 散乱キューブ — 単独ブロック */}
      {/* ============================================================ */}
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#3498DB" roughness={0.5} seed={9100} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#818cf8" roughness={0.5} seed={9101} bevel={0.008} />

      {/* ============================================================ */}
      {/* 12. 壁パネルディテール — リベット + パネル継ぎ目 */}
      {/* ============================================================ */}
      {/* Left wall panel seams */}
      <group position={[-ROOM_W / 2 + 0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {[0.7, 1.4, 2.1, 2.8].map((y, i) => (
          <mesh key={`seam-lh-${i}`} position={[0, y, 0.01]}>
            <planeGeometry args={[ROOM_D - 0.5, 0.01]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {[-2.5, -1.0, 0.5, 2.0].map((z, i) => (
          <mesh key={`seam-lv-${i}`} position={[z, ROOM_H / 2, 0.01]}>
            <planeGeometry args={[0.01, ROOM_H - 0.5]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Rivets */}
        {[0.7, 1.4, 2.1, 2.8].flatMap((y, yi) =>
          [-2.5, -1.0, 0.5, 2.0].map((z, zi) => (
            <mesh key={`rv-l-${yi}-${zi}`} position={[z, y, 0.015]}>
              <sphereGeometry args={[0.012, 6, 4]} />
              <meshStandardMaterial color="#777" metalness={0.95} roughness={0.15} />
            </mesh>
          ))
        )}
      </group>

      {/* Back wall panel rivets */}
      <group position={[0, 0, -ROOM_D / 2 + 0.12]}>
        {[0.7, 1.4, 2.1, 2.8].map((y, i) => (
          <mesh key={`seam-bh-${i}`} position={[0, y, 0.01]}>
            <planeGeometry args={[ROOM_W - 0.5, 0.01]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {[-2.5, -1.0, 0.5, 2.0, 3.0].map((x, i) => (
          <mesh key={`seam-bv-${i}`} position={[x, ROOM_H / 2, 0.01]}>
            <planeGeometry args={[0.01, ROOM_H - 0.5]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {[0.7, 1.4, 2.1, 2.8].flatMap((y, yi) =>
          [-2.5, -1.0, 0.5, 2.0, 3.0].map((x, xi) => (
            <mesh key={`rv-b-${yi}-${xi}`} position={[x, y, 0.015]}>
              <sphereGeometry args={[0.012, 6, 4]} />
              <meshStandardMaterial color="#777" metalness={0.95} roughness={0.15} />
            </mesh>
          ))
        )}
      </group>

      {/* ============================================================ */}
      {/* === テーマ固有小物 === */}
      {/* ============================================================ */}

      {/* Space window (kept from original, enhanced) */}
      <group position={[-2.5, 2, -ROOM_D / 2 + 0.14]}>
        <NoisyBox size={[1.8, 1.2, 0.06]} color="#1A1A2E" roughness={0.2} metalness={0.85} seed={8050} bevel={0.012} />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.6, 1.0]} />
          <meshStandardMaterial color="#000020" emissive="#0a0a3e" emissiveIntensity={0.3} />
        </mesh>
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={`wstar2-${i}`} position={[(Math.sin(i * 4.3) * 0.7), (Math.cos(i * 3.1) * 0.4), 0.05]}>
            <sphereGeometry args={[0.008 + (i % 3) * 0.005, 6, 4]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2 + (i % 3)} />
          </mesh>
        ))}
      </group>

      {/* Gear props (space-specific) */}
      {[[2.8, 0.06, 2.8], [-2, 0.04, 1.8]].map(([x, y, z], i) => (
        <group key={`gear-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.2]}>
          <NoisyCylinder args={[0.08 + i * 0.02, 0.08 + i * 0.02, 0.03]} color="#888" roughness={0.3} metalness={0.85} seed={9200 + i} />
          {/* Teeth */}
          {Array.from({ length: 8 }).map((_, j) => {
            const a = j * Math.PI / 4;
            return (
              <NoisyBox key={`gt-${i}-${j}`} size={[0.03, 0.02, 0.03]}
                position={[Math.cos(a) * (0.09 + i * 0.02), Math.sin(a) * (0.09 + i * 0.02), 0]}
                color="#888" roughness={0.3} metalness={0.85} seed={9210 + i * 8 + j} bevel={0.003} />
            );
          })}
        </group>
      ))}

      {/* Small robot figure (space-specific) */}
      <group position={[0.5, 0, 1]}>
        {/* Body */}
        <NoisyBox size={[0.1, 0.12, 0.08]} position={[0, 0.1, 0]} color="#C0C0C0" roughness={0.3} metalness={0.8} seed={9300} bevel={0.008} />
        {/* Head */}
        <NoisyBox size={[0.08, 0.08, 0.06]} position={[0, 0.2, 0]} color="#B0BEC5" roughness={0.25} metalness={0.85} seed={9301} bevel={0.006} />
        {/* Eyes (emissive) */}
        <EmissiveBox size={[0.02, 0.02, 0.01]} position={[-0.02, 0.21, 0.035]} color="#22d3ee" emissiveIntensity={2} />
        <EmissiveBox size={[0.02, 0.02, 0.01]} position={[0.02, 0.21, 0.035]} color="#22d3ee" emissiveIntensity={2} />
        {/* Antenna */}
        <NoisyCylinder args={[0.005, 0.005, 0.06]} position={[0, 0.27, 0]} color="#888" roughness={0.2} metalness={0.9} seed={9302} />
        <EmissiveBox size={[0.015, 0.015, 0.015]} position={[0, 0.3, 0]} color="#ff4444" emissiveIntensity={2} />
        {/* Arms */}
        <NoisyBox size={[0.03, 0.08, 0.03]} position={[-0.08, 0.1, 0]} color="#90A4AE" roughness={0.3} metalness={0.8} seed={9303} bevel={0.004} />
        <NoisyBox size={[0.03, 0.08, 0.03]} position={[0.08, 0.1, 0]} color="#90A4AE" roughness={0.3} metalness={0.8} seed={9304} bevel={0.004} />
        {/* Legs */}
        <NoisyBox size={[0.035, 0.06, 0.035]} position={[-0.03, 0.03, 0]} color="#78909C" roughness={0.3} metalness={0.8} seed={9305} bevel={0.004} />
        <NoisyBox size={[0.035, 0.06, 0.035]} position={[0.03, 0.03, 0]} color="#78909C" roughness={0.3} metalness={0.8} seed={9306} bevel={0.004} />
      </group>

      {/* Ray gun prop (space-specific) */}
      <group position={[-1.5, 0.02, 2.8]} rotation={[0, 0.8, 0]}>
        <NoisyBox size={[0.04, 0.06, 0.15]} position={[0, 0.03, 0]} color="#4A4A5E" roughness={0.3} metalness={0.8} seed={9400} bevel={0.005} />
        <NoisyBox size={[0.03, 0.03, 0.06]} position={[0, 0.06, -0.1]} color="#3A3A4E" roughness={0.25} metalness={0.85} seed={9401} bevel={0.004} />
        <EmissiveBox size={[0.015, 0.015, 0.02]} position={[0, 0.04, -0.14]} color="#22d3ee" emissiveIntensity={1.5} />
      </group>

      {/* Hologram planet — 壁沿いの小型ホログラムディスプレイ */}
      <group position={[-2, 2.5, -ROOM_D / 2 + 0.5]}>
        <mesh ref={holoRef}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.25} wireframe />
        </mesh>
        {/* Planet ring */}
        <mesh rotation={[0.3, 0, 0.2]}>
          <torusGeometry args={[0.22, 0.008, 8, 24]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.6} transparent opacity={0.3} />
        </mesh>
        <pointLight color="#22d3ee" intensity={0.4} distance={2} decay={2} />
      </group>

      {/* VoxelGrid Console (kept) */}
      <VoxelSpaceConsoleModel position={[-ROOM_W / 2 + 0.5, 0, -2]} rotation={[0, Math.PI / 2, 0]} scale={0.8} seed={8001} />

      {/* Control panel indicators on left wall */}
      <group ref={panelRef} position={[-ROOM_W / 2 + 0.15, 1.5, -2.5]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`indicator-${i}`} position={[0, 0.2 - i * 0.08, 0]}>
            <sphereGeometry args={[0.02, 10, 6]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
              emissive={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
              emissiveIntensity={1} />
          </mesh>
        ))}
      </group>

      {/* Antenna dish on ceiling */}
      <group position={[2.5, ROOM_H - 0.1, -2.5]}>
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[0.3, 0.12, 20, 1, true]} />
          <meshStandardMaterial color="#555" roughness={0.15} metalness={0.92} side={THREE.DoubleSide} />
        </mesh>
        <NoisyCylinder args={[0.015, 0.015, 0.2]} position={[0, -0.1, 0]} color="#888" roughness={0.2} metalness={0.9} seed={9500} />
      </group>

      {/* ============================================================ */}
      {/* === ライティング === */}
      {/* ============================================================ */}
      {/* Crystal accent light */}
      <pointLight position={[-1, 0.7, 0.5]} color="#a78bfa" intensity={0.4} distance={2} decay={2} />
      {/* Monitor blue glow */}
      <pointLight position={[ROOM_W / 2 - 1.2, 1.1, -1.5]} color="#00BFFF" intensity={0.3} distance={2.5} decay={2} />
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

      {/* === Aquarium 12 unique elements === */}
      {/* 1. Porthole window (看板:深海マップ) */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyCylinder args={[0.6, 0.6, 0.1]} color="#2C3E50" roughness={0.4} metalness={0.6} seed={9100} />
        <mesh position={[0, 0, 0.06]}><circleGeometry args={[0.48, 24]} /><meshStandardMaterial color="#003366" emissive="#00CED1" emissiveIntensity={0.15} /></mesh>
        {[[-0.15, 0.1], [0.2, -0.05]].map(([x, y], i) => (
          <NoisySphere key={`fish-${i}`} args={[0.06, 8, 6]} position={[x!, y!, 0.065]} color={i === 0 ? '#FF6B6B' : '#FFD54F'} roughness={0.5} seed={9110 + i} />
        ))}
      </group>
      {/* 2. Metal shelf + coral specimens in jars */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[1.3, 0.04, 0.25]} position={[0, 1.2, 0]} color="#2C3E50" roughness={0.4} metalness={0.6} seed={9200} bevel={0.005} />
        <NoisyBox size={[1.3, 0.04, 0.25]} position={[0, 2.0, 0]} color="#2C3E50" roughness={0.4} metalness={0.6} seed={9201} bevel={0.005} />
        {['S', 'E', 'A', '!'].map((_, i) => (
          <NoisyBox key={`al-${i}`} size={[0.1, 0.12, 0.1]} position={[-0.35 + i * 0.22, 2.1, 0]}
            color={['#40E0D0', '#FF6B6B', '#FFD54F', '#40E0D0'][i]!} roughness={0.4} seed={9210 + i} bevel={0.01} />
        ))}
        {[[-0.3, '#FF69B4'], [0, '#40E0D0'], [0.25, '#FFD54F']].map(([x, c], i) => (
          <group key={`jar-${i}`} position={[x as number, 1.28, 0]}>
            <NoisyCylinder args={[0.04, 0.04, 0.12]} position={[0, 0.06, 0]} color="#ccc" roughness={0.1} metalness={0.1} seed={9220 + i} />
            <NoisySphere args={[0.02, 6, 4]} position={[0, 0.04, 0]} color={c as string} roughness={0.3} seed={9225 + i} />
          </group>
        ))}
      </group>
      {/* 3. Submarine hatch door */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.2, 2.4, 0.12]} position={[0, 1.2, 0]} color="#555" roughness={0.4} metalness={0.7} seed={9300} bevel={0.015} />
        <mesh position={[0, 1.2, 0.07]}><planeGeometry args={[0.85, 2.1]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.42, 1.2, 0.12]} rotation={[0, -0.4, 0]}>
          <NoisyBox size={[0.85, 2.1, 0.06]} color="#78909C" roughness={0.35} metalness={0.7} seed={9301} bevel={0.01} />
          <NoisyCylinder args={[0.12, 0.12, 0.03]} position={[-0.15, 0.1, 0.05]} color="#888" roughness={0.2} metalness={0.9} seed={9305} />
          {[0.7, 0.3, -0.3, -0.7].map((y, i) => (
            <NoisyCylinder key={`rv-${i}`} args={[0.02, 0.02, 0.03]} position={[0.3, y, 0.05]} color="#aaa" roughness={0.2} metalness={0.85} seed={9310 + i} />
          ))}
        </group>
        <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1} distance={2.5} decay={2} />
      </group>
      {/* 4. Pendant lamp (warm glow marine style) */}
      <group position={[0, ROOM_H - 0.05, 0]}>
        <NoisyCylinder args={[0.01, 0.01, 0.3]} position={[0, -0.15, 0]} color="#555" roughness={0.3} metalness={0.7} seed={9400} />
        <NoisyCylinder args={[0.15, 0.1, 0.12]} position={[0, -0.36, 0]} color="#8B7355" roughness={0.5} seed={9401} />
        <EmissiveBox size={[0.08, 0.06, 0.08]} position={[0, -0.4, 0]} color="#FFF8E1" emissiveIntensity={2} />
        <pointLight position={[0, -0.4, 0]} color="#FFF8E1" intensity={3} distance={5} decay={2} castShadow />
      </group>
      {/* 5. Sonar console desk */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyBox size={[1.3, 0.06, 0.6]} position={[0, 0.7, 0]} color="#2C3E50" roughness={0.45} metalness={0.5} seed={9500} bevel={0.01} />
        {[[-0.55, -0.23], [-0.55, 0.23], [0.55, -0.23], [0.55, 0.23]].map(([x, z], i) => (
          <NoisyBox key={`sl-${i}`} size={[0.05, 0.7, 0.05]} position={[x!, 0.35, z!]} color="#1A3D5C" roughness={0.4} metalness={0.5} seed={9510 + i} bevel={0.006} />
        ))}
        <NoisyBox size={[0.35, 0.25, 0.04]} position={[-0.1, 0.96, -0.15]} color="#1A3D5C" roughness={0.3} metalness={0.5} seed={9520} bevel={0.008} />
        <mesh position={[-0.1, 0.96, -0.12]}><planeGeometry args={[0.28, 0.18]} /><meshStandardMaterial color="#003" emissive="#00CED1" emissiveIntensity={0.4} /></mesh>
        <NoisyBox size={[0.3, 0.015, 0.12]} position={[-0.1, 0.74, 0.1]} color="#2C3E50" roughness={0.4} metalness={0.5} seed={9522} bevel={0.004} />
      </group>
      {/* 6. Coral barrel */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.25, 0.5]} position={[0, 0.25, 0]} color="#5C4033" roughness={0.8} seed={9600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#8B7355" roughness={0.6} seed={9601} />
        <NoisySphere args={[0.06, 8, 6]} position={[-0.05, 0.55, 0]} color="#FF69B4" roughness={0.4} seed={9610} />
        <NoisySphere args={[0.05, 8, 6]} position={[0.08, 0.52, 0.05]} color="#40E0D0" roughness={0.4} seed={9611} />
      </group>
      {/* 7. Bioluminescent coral planter */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#2C3E50" roughness={0.5} metalness={0.4} seed={9700} bevel={0.01} />
        <NoisyCylinder args={[0.015, 0.012, 0.3]} position={[0, 0.35, 0]} color="#2E7D32" roughness={0.8} seed={9701} />
        <NoisySphere args={[0.08, 10, 8]} position={[0, 0.5, 0]} color="#FF6B6B" roughness={0.4} seed={9702} />
        <pointLight position={[0, 0.5, 0]} color="#FF6B6B" intensity={0.3} distance={1} decay={2} />
      </group>
      {/* 8-11 */}
      <group position={[-2.5, 0, 2.5]}>
        {['#40E0D0', '#FF6B6B', '#FFD54F', '#40E0D0', '#FF69B4'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.13, i < 2 ? 0.06 : 0.18, i > 2 ? 0.1 : 0]}
            color={c} roughness={0.5} seed={9800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={9900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={9901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#003366" roughness={0.7} seed={9902} bevel={0.002} />
      </group>
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#40E0D0" roughness={0.5} seed={9920} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#FF6B6B" roughness={0.5} seed={9921} bevel={0.008} />
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

      {/* === Volcano 12 unique elements === */}
      {/* 1. Lava canyon mural (glowing obsidian frame) */}
      <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[1.6, 1.1, 0.12]} color="#1a0a00" roughness={0.85} seed={10100} bevel={0.02} lightnessSpread={0.2} />
        <mesh position={[0, 0, 0.07]}><planeGeometry args={[1.3, 0.8]} /><meshStandardMaterial color="#2d1810" /></mesh>
        <EmissiveBox size={[0.6, 0.1, 0.01]} position={[0, -0.2, 0.08]} color="#FF4500" emissiveIntensity={1.5} />
        <EmissiveBox size={[0.3, 0.05, 0.01]} position={[-0.25, -0.1, 0.08]} color="#FFD700" emissiveIntensity={1} />
      </group>
      {/* 2. Basalt column shelves */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[1.3, 0.06, 0.25]} position={[0, 1.2, 0]} color="#333" roughness={0.85} seed={10200} bevel={0.015} lightnessSpread={0.15} />
        <NoisyBox size={[1.1, 0.05, 0.22]} position={[0.1, 1.9, 0]} color="#2d1810" roughness={0.88} seed={10201} bevel={0.018} lightnessSpread={0.18} />
        {['L', 'A', 'V', 'A'].map((_, i) => (
          <NoisyBox key={`vl-${i}`} size={[0.1, 0.12, 0.1]} position={[-0.35 + i * 0.22, 2.0, 0]}
            color={['#FF4500', '#FFD700', '#FF6347', '#FF4500'][i]!} roughness={0.3} seed={10210 + i} bevel={0.01} />
        ))}
      </group>
      {/* 3. Cave mouth door (obsidian arch) */}
      <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[1.3, 2.5, 0.15]} position={[0, 1.25, 0]} color="#1a0a00" roughness={0.9} seed={10300} bevel={0.025} lightnessSpread={0.2} />
        <mesh position={[0, 1.2, 0.08]}><planeGeometry args={[0.85, 2.0]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <group position={[0.42, 1.2, 0.12]} rotation={[0, -0.45, 0]}>
          <NoisyBox size={[0.85, 2.0, 0.08]} color="#2d1810" roughness={0.88} seed={10301} bevel={0.02} lightnessSpread={0.18} />
          <EmissiveBox size={[0.75, 0.03, 0.01]} position={[0, -0.3, 0.05]} color="#FF4500" emissiveIntensity={1.5} />
          <NoisySphere args={[0.04, 8, 6]} position={[-0.2, 0.1, 0.06]} color="#888" roughness={0.2} metalness={0.8} seed={10310} />
        </group>
        <pointLight position={[0, 0.5, 0.3]} color="#FF4500" intensity={1} distance={2} decay={2} />
      </group>
      {/* 4. Overhead lava glow (ceiling) */}
      <group position={[0, ROOM_H - 0.05, 0]}>
        <EmissiveBox size={[0.4, 0.03, 0.4]} position={[0, 0, 0]} color="#FF4500" emissiveIntensity={1} />
        <pointLight position={[0, -0.1, 0]} color="#FF4500" intensity={2} distance={4} decay={2} />
      </group>
      {/* 5. Anvil forge desk */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        <NoisyBox size={[1.1, 0.08, 0.55]} position={[0, 0.65, 0]} color="#333" roughness={0.4} metalness={0.7} seed={10500} bevel={0.01} />
        {[[-0.45, -0.2], [-0.45, 0.2], [0.45, -0.2], [0.45, 0.2]].map(([x, z], i) => (
          <NoisyBox key={`fl-${i}`} size={[0.06, 0.65, 0.06]} position={[x!, 0.325, z!]} color="#2d1810" roughness={0.85} seed={10510 + i} bevel={0.008} />
        ))}
        <NoisyBox size={[0.3, 0.2, 0.2]} position={[0.2, 0.78, 0]} color="#555" roughness={0.3} metalness={0.8} seed={10520} bevel={0.015} />
        <NoisyBox size={[0.35, 0.04, 0.2]} position={[0.2, 0.9, 0]} color="#444" roughness={0.3} metalness={0.85} seed={10521} bevel={0.006} />
        <NoisyBox size={[0.03, 0.25, 0.03]} position={[-0.3, 0.78, 0.1]} color="#555" roughness={0.3} metalness={0.7} seed={10525} bevel={0.005} />
      </group>
      {/* 6. Obsidian barrel with magma crystals */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.28, 0.5]} position={[0, 0.25, 0]} color="#333" roughness={0.5} metalness={0.5} seed={10600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#555" roughness={0.3} metalness={0.7} seed={10601} />
        <EmissiveBox size={[0.06, 0.18, 0.06]} position={[-0.05, 0.65, 0]} color="#FF4500" emissiveIntensity={2} />
        <EmissiveBox size={[0.04, 0.12, 0.04]} position={[0.08, 0.6, 0.05]} color="#FFD700" emissiveIntensity={1.5} />
      </group>
      {/* 7. Heat-resistant planter + fire flower */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color="#333" roughness={0.6} metalness={0.4} seed={10700} bevel={0.01} />
        <NoisyCylinder args={[0.015, 0.012, 0.3]} position={[0, 0.35, 0]} color="#555" roughness={0.8} seed={10701} />
        <NoisySphere args={[0.08, 10, 8]} position={[0, 0.52, 0]} color="#888" roughness={0.7} seed={10702} />
        <EmissiveBox size={[0.04, 0.04, 0.04]} position={[0.05, 0.58, 0.03]} color="#FF4500" emissiveIntensity={2} />
      </group>
      {/* 8-11 */}
      <group position={[-2.5, 0, 2.5]}>
        {['#FF4500', '#FFD700', '#FF6347', '#FF4500', '#FFD700'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.13, i < 2 ? 0.06 : 0.18, i > 2 ? 0.1 : 0]}
            color={c} roughness={0.5} seed={10800 + i} bevel={0.01} />
        ))}
      </group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={10900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={10901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#2d1810" roughness={0.7} seed={10902} bevel={0.002} />
      </group>
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#FF4500" roughness={0.5} seed={10920} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#FFD700" roughness={0.5} seed={10921} bevel={0.008} />
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
