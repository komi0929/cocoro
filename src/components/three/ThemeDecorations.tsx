/**
 * cocoro — Theme Decorations (Radical Cleanup — NORTH_STAR準拠)
 *
 * 見本(NORTH_STAR_4/5)に厳密に合わせた共通家具レイアウト:
 * - 大型壁絵画(左壁)
 * - 本棚(左壁沿い)
 * - デスク+レトロPC+椅子(右壁沿い)
 * - シーリングライト(天井中央)
 * - 鉢植え2個(壁際)
 * - バスケット(中央やや左)
 * - 積み木ブロック4個(左手前)
 * - 開いた本(手前中央)
 *
 * テーマ固有装飾は ThemeArchitecture.tsx に集約。
 * ここでは全テーマ共通の家具レイアウトのみ。
 */

import React from 'react';
import type { RoomTheme } from '@/types/cocoro';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './furniture/VoxelBuilder';
import { VoxelFigurineModel, VoxelLetterBlockModel } from './voxel/VoxelAssets';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// =================================================================
// 共通家具レイアウト（全テーマ共通 — NORTH_STAR_4準拠）
// =================================================================
function CommonRoomLayout() {
  return (
    <group>

      {/* === 2. 本棚（左壁沿い — NORTH_STAR_4準拠） === */}
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

      {/* === 3. シーリングライト（天井中央 — 暖色ダウンライト） === */}
      <group position={[0, ROOM_H - 0.05, 0]}>
        <NoisyCylinder args={[0.25, 0.25, 0.04]} position={[0, 0, 0]} color="#F5F0E0" roughness={0.4} seed={5400} />
        <EmissiveBox size={[0.3, 0.02, 0.3]} position={[0, -0.03, 0]} color="#FFF8E1" emissiveIntensity={1.5} />
      </group>

      {/* === 4. デスク+レトロPC+椅子（右壁沿い — NORTH_STAR_4準拠） === */}
      <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
        {/* Desk top */}
        <NoisyBox size={[1.3, 0.06, 0.6]} position={[0, 0.7, 0]} color="#78350f" roughness={0.65} seed={5500} bevel={0.012} />
        {/* Desk legs */}
        {[[-0.55, -0.23], [-0.55, 0.23], [0.55, -0.23], [0.55, 0.23]].map(([x, z], i) => (
          <NoisyBox key={`dl-${i}`} size={[0.06, 0.7, 0.06]} position={[x!, 0.35, z!]} color="#5c3a1e" roughness={0.7} seed={5510 + i} bevel={0.008} />
        ))}
        {/* Retro PC body */}
        <NoisyBox size={[0.3, 0.2, 0.22]} position={[0.35, 0.84, -0.1]} color="#D4C5A0" roughness={0.55} seed={5520} bevel={0.01} />
        {/* CRT Monitor */}
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

      {/* === 5. バスケット+ぬいぐるみ（中央やや左 — NORTH_STAR_4のお風呂桶に相当） === */}
      <group position={[-1, 0, 0.5]}>
        <NoisyCylinder args={[0.3, 0.28, 0.5]} position={[0, 0.25, 0]} color="#B8860B" roughness={0.85} seed={5600} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.12, 0]} color="#8B6914" roughness={0.8} seed={5601} />
        <NoisyCylinder args={[0.31, 0.31, 0.03]} position={[0, 0.38, 0]} color="#8B6914" roughness={0.8} seed={5602} />
        {/* Stuffed toys */}
        <NoisySphere args={[0.07, 10, 8]} position={[-0.05, 0.55, 0]} color="#FFB6C1" roughness={0.8} seed={5610} />
        <NoisySphere args={[0.06, 8, 6]} position={[0.1, 0.52, 0.05]} color="#87CEEB" roughness={0.8} seed={5611} />
        <NoisySphere args={[0.05, 8, 6]} position={[0, 0.5, -0.08]} color="#FFE66D" roughness={0.8} seed={5612} />
      </group>

      {/* === 6. 鉢植え2個（左壁沿い — NORTH_STAR_4準拠） === */}
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

      {/* === 7. 積み木ブロック4個（手前左 — NORTH_STAR_4準拠） === */}
      <group position={[-2.5, 0, 2.5]}>
        {['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'].map((c, i) => (
          <NoisyBox key={`blk-${i}`} size={[0.12, 0.12, 0.12]}
            position={[(i % 2) * 0.13, Math.floor(i / 2) * 0.13 + 0.06, 0]}
            color={c} roughness={0.5} seed={5800 + i} bevel={0.01} />
        ))}
      </group>

      {/* === 8. 開いた本（手前中央 — NORTH_STAR_4準拠） === */}
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={5900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={5901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color="#8B0000" roughness={0.7} seed={5902} bevel={0.002} />
      </group>

      {/* === 9. 壁棚2段+フィギュア+文字ブロック（背面壁右側 — NORTH_STAR_4準拠） === */}
      <group position={[2.5, 0, -ROOM_D / 2 + 0.25]}>
        {/* Shelf 1 (lower) */}
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 1.2, 0]} color="#654321" roughness={0.7} seed={6200} bevel={0.01} />
        {/* Shelf brackets */}
        <NoisyBox size={[0.06, 0.3, 0.04]} position={[-0.65, 1.35, 0.13]} color="#5C3D1E" roughness={0.75} seed={6202} bevel={0.008} />
        <NoisyBox size={[0.06, 0.3, 0.04]} position={[0.65, 1.35, 0.13]} color="#5C3D1E" roughness={0.75} seed={6203} bevel={0.008} />
        {/* Shelf 2 (upper) */}
        <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 2.0, 0]} color="#654321" roughness={0.7} seed={6201} bevel={0.01} />
        {/* Figurines on lower shelf */}
        <VoxelFigurineModel position={[-0.35, 1.28, 0]} baseColor="#FF6B6B" seed={6220} scale={0.8} />
        <VoxelFigurineModel position={[0, 1.28, 0]} baseColor="#4ECDC4" seed={6221} scale={0.8} />
        <VoxelFigurineModel position={[0.3, 1.28, 0]} baseColor="#FFE66D" seed={6222} scale={0.8} />
        {/* Letter blocks on upper shelf (A, B, C) */}
        <VoxelLetterBlockModel position={[-0.3, 2.1, 0]} letter="A" blockColor="#E74C3C" seed={6230} />
        <VoxelLetterBlockModel position={[0, 2.1, 0]} letter="B" blockColor="#3498DB" seed={6231} />
        <VoxelLetterBlockModel position={[0.3, 2.1, 0]} letter="C" blockColor="#F1C40F" seed={6232} />
      </group>

      {/* === 10. ドア横の壁棚（背面壁左側 — NORTH_STAR_4準拠） === */}
      <group position={[-0.5, 0, -ROOM_D / 2 + 0.25]}>
        <NoisyBox size={[0.9, 0.05, 0.25]} position={[0, 1.5, 0]} color="#654321" roughness={0.7} seed={6300} bevel={0.01} />
        <VoxelFigurineModel position={[-0.25, 1.58, 0]} baseColor="#FFD54F" seed={6310} scale={0.7} />
        <VoxelFigurineModel position={[0, 1.58, 0]} baseColor="#81C784" seed={6311} scale={0.7} />
        <VoxelFigurineModel position={[0.2, 1.58, 0]} baseColor="#FF8A80" seed={6312} scale={0.7} />
      </group>
    </group>
  );
}

// =================================================================
// 全テーマ = 共通レイアウト（テーマ固有はThemeArchitectureに集約）
// =================================================================
function UndergroundDecorations() { return <CommonRoomLayout />; }
function LoftDecorations() { return <CommonRoomLayout />; }
function TreehouseDecorations() { return <CommonRoomLayout />; }
function BeachDecorations() { return <CommonRoomLayout />; }
function RooftopDecorations() { return <CommonRoomLayout />; }
function SpaceDecorations() { return <CommonRoomLayout />; }
function AquariumDecorations() { return <CommonRoomLayout />; }
function VolcanoDecorations() { return <CommonRoomLayout />; }

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
