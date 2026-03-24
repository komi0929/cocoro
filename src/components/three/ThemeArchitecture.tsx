/**
 * cocoro — Theme Architecture (Radical Cleanup)
 *
 * 見本(NORTH_STAR_4/5)準拠:
 * - 各テーマはVoxelDoorModelのみ配置
 * - 天井ライト/棚/窓等はThemeDecorationsの共通パートに統一済み
 * - テーマ固有の世界観はAjitRoom.tsxの壁/床/天井の色で表現
 */

import type { RoomTheme } from '@/types/cocoro';
import { VoxelDoorModel } from './voxel/VoxelAssets';

const ROOM_D = 8;

// ============================================================
// テーマ別 — VoxelDoorModelのみ（NORTH_STAR_4の木目ドア準拠）
// ============================================================

function UndergroundArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[2, 0, -ROOM_D / 2 + 0.35]} doorColor="#8B6914" frameColor="#5C4033" seed={4100} voxelSize={0.09} />
    </group>
  );
}

function TreehouseArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[-2, 0, -ROOM_D / 2 + 0.35]} doorColor="#8B6914" frameColor="#5C3A1E" seed={3100} voxelSize={0.09} />
    </group>
  );
}

function BeachArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[0, 0, -ROOM_D / 2 + 0.35]} doorColor="#D4A574" frameColor="#8B6914" seed={5100} voxelSize={0.09} />
    </group>
  );
}

function SpaceArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[2.5, 0, -ROOM_D / 2 + 0.35]} doorColor="#778899" frameColor="#555555" seed={6100} voxelSize={0.09} />
    </group>
  );
}

function RooftopArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[-2.5, 0, -ROOM_D / 2 + 0.35]} doorColor="#78909C" frameColor="#546E7A" seed={7100} voxelSize={0.09} />
    </group>
  );
}

function RetroGamingArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[-3, 0, -ROOM_D / 2 + 0.35]} doorColor="#C8976B" frameColor="#8B6914" seed={8100} voxelSize={0.09} />
    </group>
  );
}

function AquariumArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[2, 0, -ROOM_D / 2 + 0.35]} doorColor="#5A7A9C" frameColor="#2A5A8C" seed={9100} voxelSize={0.09} />
    </group>
  );
}

function VolcanoArchitecture() {
  return (
    <group>
      <VoxelDoorModel position={[-2, 0, -ROOM_D / 2 + 0.35]} doorColor="#3E2723" frameColor="#4E342E" seed={10100} voxelSize={0.09} />
    </group>
  );
}

// ============================================================
// メインエクスポート
// ============================================================

export function ThemeArchitecture({ theme }: { theme: string }) {
  switch (theme) {
    case 'underground': return <UndergroundArchitecture />;
    case 'treehouse': return <TreehouseArchitecture />;
    case 'beach': return <BeachArchitecture />;
    case 'space': return <SpaceArchitecture />;
    case 'rooftop': return <RooftopArchitecture />;
    case 'retro_gaming': return <RetroGamingArchitecture />;
    case 'aquarium': return <AquariumArchitecture />;
    case 'volcano': return <VolcanoArchitecture />;
    default: return null;
  }
}
