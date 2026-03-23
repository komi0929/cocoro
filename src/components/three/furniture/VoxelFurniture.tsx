/**
 * cocoro — Voxel Furniture Factory Phase 7
 * 量産エンジン(VoxelFurniture.ts) 全100種直結
 *
 * FURNITURE_GENERATOR_MAP → VoxelGrid ベース（全家具）
 * レガシーコンポーネントはフォールバックとして保持
 */

import React, { Suspense, useMemo } from 'react';
import type { FurnitureItem } from '@/types/cocoro';
import { VoxelGrid, type VoxelData } from '../voxel/VoxelGrid';
import { FURNITURE_GENERATOR_MAP } from '../voxel/VoxelFurniture';

// ============================================================
// 量産エンジン家具 — VoxelGrid ベースレンダリング
// FURNITURE_GENERATOR_MAP に登録された全家具が自動的に使用される
// ============================================================

/** デフォルトの voxelSize 推定: グリッドサイズから自動計算 */
function estimateVoxelSize(data: VoxelData): number {
  const maxH = data.length;
  const maxD = data[0]?.length ?? 1;
  const maxW = data[0]?.[0]?.length ?? 1;
  const maxDim = Math.max(maxW, maxH, maxD);
  // 目標: 家具が概ね 0.4〜1.2 ワールドユニットに収まる
  if (maxDim <= 6) return 0.08;
  if (maxDim <= 10) return 0.06;
  if (maxDim <= 16) return 0.04;
  if (maxDim <= 24) return 0.03;
  return 0.025;
}

/** 量産エンジン家具をVoxelGridで描画するコンポーネント */
function EngineRenderedFurniture({ furnitureId }: { furnitureId: string }) {
  const data = useMemo(() => {
    const gen = FURNITURE_GENERATOR_MAP[furnitureId];
    return gen ? gen() : null;
  }, [furnitureId]);

  if (!data) return null;

  const voxelSize = estimateVoxelSize(data);
  const W = data[0]?.[0]?.length ?? 1;
  const D = data[0]?.length ?? 1;

  return (
    <VoxelGrid
      data={data}
      voxelSize={voxelSize}
      enableAO
      aoIntensity={0.55}
      position={[-W * voxelSize / 2, 0, -D * voxelSize / 2]}
    />
  );
}


// --- チル系 ---
import {
  VoxelBed, VoxelSofa, VoxelLSofa, VoxelBeanbag, VoxelHammock,
  VoxelRug, VoxelRugRound, VoxelRugStripe,
  VoxelCushion, VoxelTable, VoxelLowTable, VoxelCactus,
  VoxelKotatsu, VoxelRockingChair, VoxelDaybed, VoxelBlanket,
  VoxelPillowPile, VoxelSleepingBag, VoxelSwingChair, VoxelFuton, VoxelFloorMat,
} from './ChillFurniture';

// --- 遊び系 ---
import {
  VoxelArcade, VoxelSkateboard, VoxelDJBooth, VoxelPizzaBox,
  VoxelBasketball, VoxelGuitar, VoxelBoombox,
  VoxelBigSpeaker, VoxelPinball, VoxelVinylPlayer, VoxelFoamSword,
  VoxelDartBoard, VoxelPoolTable, VoxelKaraokeMic, VoxelDrumSet,
  VoxelSoccerBall, VoxelBoardGame, VoxelVRHeadset, VoxelTrampoline, VoxelPunchingBag,
} from './PlayFurniture';

// --- デスク系 ---
import {
  VoxelDesk, VoxelGamingChair, VoxelMonitor, VoxelMonitorDual,
  VoxelGamingPC, VoxelSteelRack, VoxelChair, VoxelShelf,
  VoxelFilingCabinet, VoxelWhiteboard,
  VoxelLaptop, VoxelTabletStand, VoxelDeskOrganizer, VoxelKeyboard,
  VoxelMousePad, VoxelWebcam, VoxelHeadsetStand, VoxelCableBox, VoxelStandingDesk,
} from './DeskFurniture';

// --- 照明系 ---
import {
  VoxelLamp, VoxelFloorLamp, VoxelNeonSign, VoxelNeonHeart,
  VoxelNeonStar, VoxelLavaLamp, VoxelStringLights,
  VoxelPendantLight, VoxelCandleSet,
  VoxelDiscoBall, VoxelSpotLight, VoxelLEDStrip, VoxelPaperLantern,
  VoxelFairyJar, VoxelMoonLight, VoxelStarProjector,
  VoxelFireplace, VoxelTorch, VoxelLantern, VoxelNeonLightning,
} from './LightFurniture';

// --- デコ系 ---
import {
  VoxelPoster, VoxelPosterFrame, VoxelWallShelf,
  VoxelPlant, VoxelPlantTall, VoxelPlantHanging,
  VoxelTerrarium, VoxelGlobe, VoxelTrophy, VoxelClock,
  VoxelVinylRecord, VoxelMiniFridge,
  VoxelFishTank, VoxelDreamCatcher, VoxelMirror, VoxelFlag,
  VoxelPhotoFrame, VoxelSnowGlobe, VoxelMusicBox, VoxelBonsai,
} from './DecoFurniture';

interface Props {
  item: FurnitureItem;
  onClick?: () => void;
  isSelected?: boolean;
}

const FURNITURE_MAP: Record<string, React.FC<{ item: FurnitureItem }>> = {
  // チル系 (20)
  bed: VoxelBed,
  sofa: VoxelSofa,
  sofa_red: VoxelSofa,
  sofa_green: VoxelSofa,
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
  kotatsu: VoxelKotatsu,
  rocking_chair: VoxelRockingChair,
  daybed: VoxelDaybed,
  blanket: VoxelBlanket,
  pillow_pile: VoxelPillowPile,
  sleeping_bag: VoxelSleepingBag,
  swing_chair: VoxelSwingChair,
  futon: VoxelFuton,
  floor_mat: VoxelFloorMat,

  // 遊び系 (20)
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
  dart_board: VoxelDartBoard,
  pool_table: VoxelPoolTable,
  karaoke_mic: VoxelKaraokeMic,
  drum_set: VoxelDrumSet,
  soccer_ball: VoxelSoccerBall,
  board_game: VoxelBoardGame,
  vr_headset: VoxelVRHeadset,
  trampoline: VoxelTrampoline,
  punching_bag: VoxelPunchingBag,

  // デスク系 (20)
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
  laptop: VoxelLaptop,
  tablet_stand: VoxelTabletStand,
  desk_organizer: VoxelDeskOrganizer,
  keyboard: VoxelKeyboard,
  mouse_pad: VoxelMousePad,
  webcam: VoxelWebcam,
  headset_stand: VoxelHeadsetStand,
  cable_box: VoxelCableBox,
  standing_desk: VoxelStandingDesk,

  // 照明系 (20)
  lamp: VoxelLamp,
  floor_lamp: VoxelFloorLamp,
  neon_sign: VoxelNeonSign,
  neon_heart: VoxelNeonHeart,
  neon_star: VoxelNeonStar,
  lava_lamp: VoxelLavaLamp,
  string_lights: VoxelStringLights,
  pendant_light: VoxelPendantLight,
  candle_set: VoxelCandleSet,
  disco_ball: VoxelDiscoBall,
  spot_light: VoxelSpotLight,
  led_strip: VoxelLEDStrip,
  paper_lantern: VoxelPaperLantern,
  fairy_jar: VoxelFairyJar,
  moon_light: VoxelMoonLight,
  star_projector: VoxelStarProjector,
  fireplace: VoxelFireplace,
  torch: VoxelTorch,
  lantern: VoxelLantern,
  neon_lightning: VoxelNeonLightning,

  // デコ系 (20)
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
  fish_tank: VoxelFishTank,
  dream_catcher: VoxelDreamCatcher,
  mirror: VoxelMirror,
  flag: VoxelFlag,
  photo_frame: VoxelPhotoFrame,
  snow_globe: VoxelSnowGlobe,
  music_box: VoxelMusicBox,
  bonsai: VoxelBonsai,
};

export function VoxelFurniture({ item, onClick, isSelected }: Props) {
  const hasEngine = !!FURNITURE_GENERATOR_MAP[item.type];
  const Component = FURNITURE_MAP[item.type];
  if (!hasEngine && !Component) return null;

  return (
    <Suspense fallback={null}>
      <group
        position={item.position}
        rotation={item.rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {/* Selection highlight */}
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
        {/* 高品質コンポーネントを優先、なければエンジンフォールバック */}
        {Component
          ? <Component item={item} />
          : hasEngine && <EngineRenderedFurniture furnitureId={item.type} />
        }
      </group>
    </Suspense>
  );
}
