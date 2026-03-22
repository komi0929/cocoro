/**
 * cocoro — Voxel Furniture Factory Phase 6
 * 量産エンジン(VoxelFurniture.ts)直結 + 既存100家具フォールバック
 *
 * 優先順位:
 * 1. ENGINE_MAP → 量産エンジン VoxelGrid ベース（高品質）
 * 2. FURNITURE_MAP → 既存手作りコンポーネント（レガシー）
 */

import React, { Suspense, useMemo } from 'react';
import type { FurnitureItem } from '@/types/cocoro';
import { VoxelGrid, type VoxelData } from '../voxel/VoxelGrid';
import {
  generateSofa, generateFridge, generateTV, generateWallClock,
  generateTable, generateChair, generateLamp, generatePottedPlant,
  generateBookshelf, generateBed, generateCushion, generateCake,
  generateHoneyJar, generateFlowerVase, generateCoffeeTable,
  generateEasel, generateBookStack, generateYarnBall,
} from '../voxel/VoxelFurniture';

// ============================================================
// 量産エンジン家具マップ — VoxelGrid ベース高品質レンダリング
// ここに登録するだけで本番に自動反映される
// ============================================================
type EngineEntry = { fn: (seed?: number) => VoxelData; voxelSize: number };
const ENGINE_MAP: Record<string, EngineEntry> = {
  sofa:         { fn: generateSofa, voxelSize: 0.03 },
  sofa_red:     { fn: (s) => generateSofa(s ?? 101), voxelSize: 0.03 },
  sofa_green:   { fn: (s) => generateSofa(s ?? 102), voxelSize: 0.03 },
  mini_fridge:  { fn: generateFridge, voxelSize: 0.03 },
  // monitor は TV で代用
  table:        { fn: generateTable, voxelSize: 0.04 },
  low_table:    { fn: generateTable, voxelSize: 0.035 },
  chair:        { fn: generateChair, voxelSize: 0.04 },
  lamp:         { fn: generateLamp, voxelSize: 0.04 },
  plant:        { fn: generatePottedPlant, voxelSize: 0.04 },
  plant_tall:   { fn: generatePottedPlant, voxelSize: 0.05 },
  shelf:        { fn: generateBookshelf, voxelSize: 0.03 },
  bed:          { fn: generateBed, voxelSize: 0.03 },
  cushion:      { fn: generateCushion, voxelSize: 0.04 },
  clock:        { fn: generateWallClock, voxelSize: 0.05 },
  bonsai:       { fn: generatePottedPlant, voxelSize: 0.04 },
};

/** 量産エンジン家具をVoxelGridで描画するコンポーネント */
function EngineRenderedFurniture({ entry, item }: { entry: EngineEntry; item: FurnitureItem }) {
  const data = useMemo(() => entry.fn(42), [entry]);
  // Center the model at origin
  const W = data[0]?.[0]?.length ?? 1;
  const D = data[0]?.length ?? 1;
  return (
    <VoxelGrid
      data={data}
      voxelSize={entry.voxelSize}
      enableAO
      aoIntensity={0.55}
      position={[-W * entry.voxelSize / 2, 0, -D * entry.voxelSize / 2]}
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
  const engineEntry = ENGINE_MAP[item.type];
  const Component = FURNITURE_MAP[item.type];
  if (!engineEntry && !Component) return null;

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
        {/* 量産エンジン版があればそちらを優先、なければレガシーコンポーネント */}
        {engineEntry
          ? <EngineRenderedFurniture entry={engineEntry} item={item} />
          : Component && <Component item={item} />
        }
      </group>
    </Suspense>
  );
}

