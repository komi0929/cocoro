/**
 * cocoro  EVoxel Furniture Factory Phase 4
 * 56種の家具をルーチE��ング  E色ノイズ + 選択ハイライチE */

import React, { Suspense } from 'react';
import type { FurnitureItem } from '@/types/cocoro';

// --- チル系 ---
import {
  VoxelBed, VoxelSofa, VoxelSofaRed, VoxelSofaGreen,
  VoxelLSofa, VoxelBeanbag, VoxelHammock,
  VoxelRug, VoxelRugRound, VoxelRugStripe,
  VoxelCushion, VoxelTable, VoxelLowTable, VoxelCactus,
} from './ChillFurniture';

// --- 遊�E系 ---
import {
  VoxelArcade, VoxelSkateboard, VoxelDJBooth, VoxelPizzaBox,
  VoxelBasketball, VoxelGuitar, VoxelBoombox,
  VoxelBigSpeaker, VoxelPinball, VoxelVinylPlayer, VoxelFoamSword,
} from './PlayFurniture';

// --- チE��ク系 ---
import {
  VoxelDesk, VoxelGamingChair, VoxelMonitor, VoxelMonitorDual,
  VoxelGamingPC, VoxelSteelRack, VoxelChair, VoxelShelf,
  VoxelFilingCabinet, VoxelWhiteboard,
} from './DeskFurniture';

// --- 照明系 ---
import {
  VoxelLamp, VoxelFloorLamp, VoxelNeonSign, VoxelNeonHeart,
  VoxelNeonStar, VoxelLavaLamp, VoxelStringLights,
  VoxelPendantLight, VoxelCandleSet,
} from './LightFurniture';

// --- チE��系 ---
import {
  VoxelPoster, VoxelPosterFrame, VoxelWallShelf,
  VoxelPlant, VoxelPlantTall, VoxelPlantHanging,
  VoxelTerrarium, VoxelGlobe, VoxelTrophy, VoxelClock,
  VoxelVinylRecord, VoxelMiniFridge,
} from './DecoFurniture';

interface Props {
  item: FurnitureItem;
  onClick?: () => void;
  isSelected?: boolean;
}

const FURNITURE_MAP: Record<string, React.FC<{ item: FurnitureItem }>> = {
  // チル系
  bed: VoxelBed,
  sofa: VoxelSofa,
  sofa_red: VoxelSofaRed,
  sofa_green: VoxelSofaGreen,
  l_sofa: VoxelLSofa,
  beanbag: VoxelBeanbag,
  hammock: VoxelHammock,
  rug: VoxelRug,
  rug_round: VoxelRugRound,
  rug_stripe: VoxelRugStripe,
  cushion: VoxelCushion,
  table: VoxelTable,
  low_table: VoxelLowTable,
  cactus: VoxelCactus,

  // 遊�E系
  arcade: VoxelArcade,
  skateboard: VoxelSkateboard,
  dj_booth: VoxelDJBooth,
  pizza_box: VoxelPizzaBox,
  basketball: VoxelBasketball,
  guitar: VoxelGuitar,
  boombox: VoxelBoombox,
  big_speaker: VoxelBigSpeaker,
  pinball: VoxelPinball,
  vinyl_player: VoxelVinylPlayer,
  foam_sword: VoxelFoamSword,

  // チE��ク系
  desk: VoxelDesk,
  gaming_chair: VoxelGamingChair,
  monitor: VoxelMonitor,
  monitor_dual: VoxelMonitorDual,
  gaming_pc: VoxelGamingPC,
  steel_rack: VoxelSteelRack,
  chair: VoxelChair,
  shelf: VoxelShelf,
  filing_cabinet: VoxelFilingCabinet,
  whiteboard: VoxelWhiteboard,

  // 照明系
  lamp: VoxelLamp,
  floor_lamp: VoxelFloorLamp,
  neon_sign: VoxelNeonSign,
  neon_heart: VoxelNeonHeart,
  neon_star: VoxelNeonStar,
  lava_lamp: VoxelLavaLamp,
  string_lights: VoxelStringLights,
  pendant_light: VoxelPendantLight,
  candle_set: VoxelCandleSet,

  // チE��系
  poster: VoxelPoster,
  poster_frame: VoxelPosterFrame,
  wall_shelf: VoxelWallShelf,
  plant: VoxelPlant,
  plant_tall: VoxelPlantTall,
  plant_hanging: VoxelPlantHanging,
  terrarium: VoxelTerrarium,
  globe: VoxelGlobe,
  trophy: VoxelTrophy,
  clock: VoxelClock,
  vinyl_record: VoxelVinylRecord,
  mini_fridge: VoxelMiniFridge,
};

export function VoxelFurniture({ item, onClick, isSelected }: Props) {
  const Component = FURNITURE_MAP[item.type];
  if (!Component) return null;

  return (
    <Suspense fallback={null}>
      <group
        position={item.position}
        rotation={item.rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {/* Selection highlight  Epulsing ring + bounding glow */}
        {isSelected && (
          <>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.6, 32]} />
              <meshStandardMaterial
                color="#00f5d4"
                transparent
                opacity={0.6}
                emissive="#00f5d4"
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
            {/* 上部インジケーター */}
            <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color="#00f5d4"
                emissive="#00f5d4"
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          </>
        )}
        <Component item={item} />
      </group>
    </Suspense>
  );
}
