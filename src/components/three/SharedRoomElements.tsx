/**
 * cocoro — SharedRoomElements
 * ENVIRONMENT_SPECS.md 12必須要素の共通実装
 * 各テーマはこれらをテーマカラー/素材で呼び出すだけ。
 */

import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './furniture/VoxelBuilder';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// ============================================================
// 共通型定義
// ============================================================
export interface ThemePalette {
  // 建材
  wallPrimary: string;   // 壁の主色
  wallSecondary: string; // 壁のアクセント/腰壁色
  frameMaterial: string; // フレーム素材色
  metalAccent: string;   // 金属アクセント

  // 家具
  deskTop: string;       // デスク天板
  deskLeg: string;       // デスク脚
  chairSeat: string;     // 椅子座面

  // ドア
  doorFrame: string;
  doorPanel: string;
  doorHandle: string;

  // 小物
  shelfColor: string;
  barrelWood: string;
  barrelBand: string;
  planterColor: string;

  // 照明
  lampShade: string;
  lightColor: string;    // 暖色照明

  // スクリーン/絵画
  screenBg: string;
  screenGlow: string;
  artContent: string;    // 絵画の主キャンバス色

  // 植物
  plantStem: string;
  plantLeaf1: string;
  plantLeaf2: string;

  // 棚上フィギュアの色パレット
  figureColors: string[];

  // コンテナ中身の色
  containerContent: string[];

  // 本の表紙色
  bookCovers: string[];
}

// ============================================================
// 1. 大型壁面装飾（左壁上半分、壁面積30%）
// ============================================================
export function WallArtDecoration({ palette, artType = 'painting' }: { palette: ThemePalette; artType?: 'painting' | 'chart' | 'window' | 'board' }) {
  return (
    <group position={[-ROOM_W / 2 + 0.14, 2.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      <NoisyBox size={[2.0, 1.4, 0.06]} color={palette.frameMaterial} roughness={0.4} metalness={0.3} seed={7100} bevel={0.015} />
      {/* Canvas/Screen */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshStandardMaterial color={palette.screenBg}
          emissive={artType === 'chart' ? palette.screenGlow : undefined}
          emissiveIntensity={artType === 'chart' ? 0.3 : 0} />
      </mesh>
      {/* Content varies by artType */}
      {artType === 'painting' && (
        <>
          {/* Simple pixel art landscape */}
          {[[-0.4, 0.3, '#4CAF50'], [-0.1, 0.35, '#388E3C'], [0.2, 0.25, '#2E7D32'], [0.5, 0.4, '#66BB6A']].map(([x, y, c], i) => (
            <NoisyBox key={`mountain-${i}`} size={[0.25, (y as number) * 0.8, 0.01]} position={[x as number, (y as number) * 0.4 - 0.15, 0.05]} color={c as string} roughness={0.8} seed={7110 + i} bevel={0.003} />
          ))}
          {/* Sun */}
          <mesh position={[0.5, 0.4, 0.055]}>
            <sphereGeometry args={[0.08, 12, 8]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}
      {artType === 'chart' && (
        <>
          {[0.35, 0.1, -0.15, -0.35].map((y, i) => (
            <mesh key={`hline-${i}`} position={[0, y, 0.05]}>
              <planeGeometry args={[1.6, 0.004]} />
              <meshStandardMaterial color={palette.screenGlow} emissive={palette.screenGlow} emissiveIntensity={1.5} transparent opacity={0.4} />
            </mesh>
          ))}
          {[[-0.5, 0.1], [-0.2, 0.3], [0.1, -0.05], [0.4, 0.2]].map(([x, y], i) => (
            <mesh key={`dp-${i}`} position={[x!, y!, 0.055]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshStandardMaterial color={palette.screenGlow} emissive={palette.screenGlow} emissiveIntensity={2} />
            </mesh>
          ))}
        </>
      )}
      {artType === 'window' && (
        <>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.6, 1.0]} />
            <meshStandardMaterial color={palette.artContent} transparent opacity={0.3}
              emissive={palette.artContent} emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============================================================
// 2. 棚（2段）+ フィギュア + ブロック文字
// ============================================================
export function ShelvesWithFigures({ palette, letters = 'ABCDE' }: { palette: ThemePalette; letters?: string }) {
  const blockColors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6'];
  return (
    <group position={[2.5, 0, -ROOM_D / 2 + 0.25]}>
      {/* Shelf boards */}
      <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 1.2, 0]} color={palette.shelfColor} roughness={0.4} metalness={0.3} seed={7200} bevel={0.008} />
      <NoisyBox size={[1.4, 0.05, 0.3]} position={[0, 2.0, 0]} color={palette.shelfColor} roughness={0.4} metalness={0.3} seed={7201} bevel={0.008} />

      {/* Block letters on upper shelf */}
      {letters.slice(0, 5).split('').map((_, i) => (
        <NoisyBox key={`blk-${i}`} size={[0.12, 0.15, 0.12]} position={[-0.5 + i * 0.25, 2.1, 0]}
          color={blockColors[i % blockColors.length]!} roughness={0.5} seed={7210 + i} bevel={0.01} />
      ))}

      {/* Mini figures on lower shelf */}
      {palette.figureColors.slice(0, 3).map((c, i) => (
        <group key={`fig-${i}`} position={[-0.35 + i * 0.3, 1.28, 0]}>
          <NoisyBox size={[0.06, 0.1, 0.06]} position={[0, 0.05, 0]} color={c} roughness={0.5} seed={7220 + i} bevel={0.006} />
          <NoisySphere args={[0.04, 8, 6]} position={[0, 0.13, 0]} color={c} roughness={0.5} seed={7225 + i} />
        </group>
      ))}

      {/* Standing books */}
      <NoisyBox size={[0.04, 0.12, 0.08]} position={[0.55, 1.32, 0]} color={palette.bookCovers[0] ?? '#8B0000'} roughness={0.8} seed={7240} bevel={0.005} />
      <NoisyBox size={[0.035, 0.1, 0.07]} position={[0.6, 1.3, 0]} color={palette.bookCovers[1] ?? '#00008B'} roughness={0.85} seed={7241} bevel={0.004} />
    </group>
  );
}

// ============================================================
// 3. ドア（開放状態）
// ============================================================
export function OpenDoor({ palette, handleType = 'knob' }: { palette: ThemePalette; handleType?: 'knob' | 'wheel' | 'wooden' }) {
  return (
    <group position={[1.2, 0, -ROOM_D / 2 + 0.12]}>
      {/* Door frame */}
      <NoisyBox size={[1.1, 2.4, 0.12]} position={[0, 1.2, 0]} color={palette.doorFrame} roughness={0.35} metalness={0.4} seed={7300} bevel={0.015} />
      {/* Dark void */}
      <mesh position={[0, 1.2, 0.07]}>
        <planeGeometry args={[0.85, 2.1]} />
        <meshStandardMaterial color="#080818" />
      </mesh>
      {/* Door panel (swung open) */}
      <group position={[0.45, 1.2, 0.12]} rotation={[0, -0.6, 0]}>
        <NoisyBox size={[0.85, 2.1, 0.06]} color={palette.doorPanel} roughness={0.4} metalness={0.3} seed={7301} bevel={0.01} />
        {/* Handle */}
        {handleType === 'knob' && (
          <NoisySphere args={[0.04, 10, 8]} position={[0, 0.2, 0.04]} color={palette.doorHandle} roughness={0.2} metalness={0.8} seed={7302} />
        )}
        {handleType === 'wheel' && (
          <>
            <NoisyCylinder args={[0.12, 0.12, 0.04]} position={[0, 0.2, 0.04]} color={palette.doorHandle} roughness={0.15} metalness={0.95} seed={7302} />
            <NoisyBox size={[0.22, 0.02, 0.02]} position={[0, 0.2, 0.06]} color={palette.doorHandle} roughness={0.2} metalness={0.9} seed={7303} bevel={0.003} />
          </>
        )}
        {handleType === 'wooden' && (
          <NoisyBox size={[0.06, 0.12, 0.04]} position={[-0.15, 0.2, 0.04]} color={palette.doorHandle} roughness={0.6} seed={7302} bevel={0.008} />
        )}
      </group>
      {/* Warm corridor light */}
      <pointLight position={[0, 1.2, 0.3]} color="#FFF8E1" intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

// ============================================================
// 4. 天井照明（暖色）
// ============================================================
export function CeilingLight({ palette }: { palette: ThemePalette }) {
  return (
    <group position={[0, ROOM_H - 0.1, 0]}>
      <NoisyCylinder args={[0.08, 0.08, 0.03]} position={[0, 0, 0]} color={palette.metalAccent} roughness={0.2} metalness={0.9} seed={7400} />
      <NoisyCylinder args={[0.01, 0.01, 0.5]} position={[0, -0.25, 0]} color={palette.metalAccent} roughness={0.3} metalness={0.8} seed={7401} />
      <mesh position={[0, -0.55, 0]}>
        <coneGeometry args={[0.2, 0.15, 16, 1, true]} />
        <meshStandardMaterial color={palette.lampShade} roughness={0.3} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <EmissiveBox size={[0.06, 0.08, 0.06]} position={[0, -0.58, 0]} color={palette.lightColor} emissiveIntensity={2} />
      <pointLight position={[0, -0.6, 0]} color={palette.lightColor} intensity={3} distance={6} decay={2} castShadow />
    </group>
  );
}

// ============================================================
// 5. デスク + モニタ/PC + 椅子
// ============================================================
export function DeskSetup({ palette, deviceType = 'pc' }: { palette: ThemePalette; deviceType?: 'pc' | 'monitor' | 'scroll' | 'radio' | 'forge' | 'sonar' }) {
  return (
    <group position={[ROOM_W / 2 - 1.2, 0, -1.5]}>
      {/* Desk top */}
      <NoisyBox size={[1.4, 0.06, 0.65]} position={[0, 0.7, 0]} color={palette.deskTop} roughness={0.4} metalness={0.3} seed={7500} bevel={0.01} />
      {/* Desk legs */}
      {[[-0.6, -0.25], [-0.6, 0.25], [0.6, -0.25], [0.6, 0.25]].map(([x, z], i) => (
        <NoisyBox key={`dleg-${i}`} size={[0.05, 0.7, 0.05]} position={[x!, 0.35, z!]}
          color={palette.deskLeg} roughness={0.4} metalness={0.3} seed={7510 + i} bevel={0.005} />
      ))}

      {/* Device */}
      {(deviceType === 'pc' || deviceType === 'monitor') && (
        <>
          <mesh position={[0, 1.05, -0.15]}>
            <boxGeometry args={[0.5, 0.35, 0.015]} />
            <meshStandardMaterial color={palette.screenBg} emissive={palette.screenGlow} emissiveIntensity={0.8} />
          </mesh>
          <NoisyBox size={[0.55, 0.4, 0.03]} position={[0, 1.05, -0.17]} color={palette.frameMaterial} roughness={0.3} metalness={0.5} seed={7520} bevel={0.008} />
          <NoisyBox size={[0.04, 0.15, 0.04]} position={[0, 0.82, -0.15]} color={palette.metalAccent} roughness={0.25} metalness={0.8} seed={7521} bevel={0.005} />
          {deviceType === 'pc' && (
            <NoisyBox size={[0.3, 0.25, 0.2]} position={[0.45, 0.86, -0.1]} color={palette.frameMaterial} roughness={0.4} metalness={0.3} seed={7525} bevel={0.01} />
          )}
        </>
      )}
      {deviceType === 'scroll' && (
        <group position={[0, 0.75, 0]}>
          <NoisyBox size={[0.4, 0.02, 0.3]} position={[0, 0, 0]} color="#FFF8DC" roughness={0.85} seed={7530} bevel={0.003} />
          <NoisyCylinder args={[0.015, 0.015, 0.35]} position={[0, 0.015, -0.15]} rotation={[0, 0, Math.PI / 2]} color={palette.frameMaterial} roughness={0.6} seed={7531} />
          <NoisyCylinder args={[0.015, 0.015, 0.35]} position={[0, 0.015, 0.15]} rotation={[0, 0, Math.PI / 2]} color={palette.frameMaterial} roughness={0.6} seed={7532} />
        </group>
      )}
      {deviceType === 'radio' && (
        <group position={[0, 0.75, 0]}>
          <NoisyBox size={[0.35, 0.2, 0.15]} position={[0, 0.1, 0]} color={palette.frameMaterial} roughness={0.5} seed={7535} bevel={0.01} />
          <NoisyCylinder args={[0.04, 0.04, 0.03]} position={[-0.08, 0.22, 0.08]} color={palette.metalAccent} roughness={0.3} metalness={0.7} seed={7536} />
          <NoisyCylinder args={[0.04, 0.04, 0.03]} position={[0.08, 0.22, 0.08]} color={palette.metalAccent} roughness={0.3} metalness={0.7} seed={7537} />
        </group>
      )}
      {deviceType === 'forge' && (
        <group position={[0, 0.75, 0]}>
          <NoisyBox size={[0.5, 0.15, 0.3]} position={[0, 0.08, 0]} color="#333" roughness={0.7} metalness={0.6} seed={7540} bevel={0.01} />
          <EmissiveBox size={[0.3, 0.05, 0.2]} position={[0, 0.18, 0]} color="#FF4500" emissiveIntensity={1.5} />
          <NoisyBox size={[0.06, 0.25, 0.06]} position={[0.4, 0.22, 0]} color="#555" roughness={0.3} metalness={0.9} seed={7541} bevel={0.008} />
        </group>
      )}
      {deviceType === 'sonar' && (
        <group position={[0, 0.75, 0]}>
          <NoisyBox size={[0.45, 0.35, 0.04]} position={[0, 0.18, -0.1]} color="#1A1A2E" roughness={0.3} metalness={0.5} seed={7545} bevel={0.008} />
          <mesh position={[0, 0.18, -0.075]}>
            <circleGeometry args={[0.12, 24]} />
            <meshStandardMaterial color="#003300" emissive="#00FF00" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Keyboard/items on desk */}
      <NoisyBox size={[0.45, 0.02, 0.15]} position={[-0.1, 0.74, 0.15]} color={palette.metalAccent} roughness={0.5} metalness={0.3} seed={7550} bevel={0.005} />

      {/* Chair */}
      <group position={[0, 0, 0.7]}>
        <NoisyBox size={[0.4, 0.04, 0.4]} position={[0, 0.4, 0]} color={palette.chairSeat} roughness={0.5} metalness={0.3} seed={7560} bevel={0.008} />
        <NoisyBox size={[0.4, 0.35, 0.04]} position={[0, 0.6, -0.18]} color={palette.chairSeat} roughness={0.5} metalness={0.3} seed={7561} bevel={0.008} />
        {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
          <NoisyCylinder key={`cleg-${i}`} args={[0.02, 0.02, 0.4]} position={[x!, 0.2, z!]}
            color={palette.metalAccent} roughness={0.2} metalness={0.9} seed={7570 + i} />
        ))}
      </group>
    </group>
  );
}

// ============================================================
// 6. 丸型コンテナ（樽）
// ============================================================
export function BarrelContainer({ palette }: { palette: ThemePalette }) {
  return (
    <group position={[-1, 0, 0.5]}>
      <NoisyCylinder args={[0.35, 0.3, 0.6]} position={[0, 0.3, 0]} color={palette.barrelWood} roughness={0.8} seed={7600} />
      <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.15, 0]} color={palette.barrelBand} roughness={0.3} metalness={0.7} seed={7601} />
      <NoisyCylinder args={[0.36, 0.36, 0.04]} position={[0, 0.45, 0]} color={palette.barrelBand} roughness={0.3} metalness={0.7} seed={7602} />
      {palette.containerContent.slice(0, 3).map((c, i) => (
        <NoisyBox key={`cc-${i}`} size={[0.05 + i * 0.005, 0.12 + i * 0.03, 0.05]}
          position={[-0.1 + i * 0.1, 0.65 + i * 0.02, i * 0.04 - 0.04]}
          color={c} roughness={0.2} metalness={0.3} seed={7610 + i} bevel={0.006} />
      ))}
      <pointLight position={[0, 0.7, 0]} color={palette.containerContent[0] ?? '#a78bfa'} intensity={0.4} distance={1.5} decay={2} />
    </group>
  );
}

// ============================================================
// 7. 植物2-3鉢
// ============================================================
export function PlantPots({ palette }: { palette: ThemePalette }) {
  return (
    <group>
      {/* Plant 1 (tall) */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 1.5]}>
        <NoisyBox size={[0.3, 0.25, 0.3]} position={[0, 0.125, 0]} color={palette.planterColor} roughness={0.5} seed={7700} bevel={0.01} />
        <NoisyCylinder args={[0.02, 0.015, 0.5]} position={[0, 0.5, 0]} color={palette.plantStem} roughness={0.8} seed={7701} />
        <NoisySphere args={[0.12, 12, 8]} position={[0, 0.75, 0]} color={palette.plantLeaf1} roughness={0.75} seed={7702} lightnessSpread={0.2} />
        <NoisySphere args={[0.08, 10, 6]} position={[0.06, 0.85, 0.04]} color={palette.plantLeaf2} roughness={0.8} seed={7703} />
      </group>
      {/* Plant 2 (short) */}
      <group position={[-ROOM_W / 2 + 0.6, 0, 2.5]}>
        <NoisyBox size={[0.25, 0.2, 0.25]} position={[0, 0.1, 0]} color={palette.planterColor} roughness={0.5} seed={7710} bevel={0.01} />
        <NoisyCylinder args={[0.015, 0.012, 0.3]} position={[0, 0.35, 0]} color={palette.plantStem} roughness={0.85} seed={7711} />
        <NoisySphere args={[0.08, 10, 7]} position={[0, 0.5, 0]} color={palette.plantLeaf1} roughness={0.75} seed={7712} lightnessSpread={0.2} />
      </group>
    </group>
  );
}

// ============================================================
// 8. カラフルブロック積み木
// ============================================================
export function ColorfulBlocks() {
  const blockColors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6'];
  return (
    <group position={[-2.5, 0, 2.5]}>
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.06, 0]} color={blockColors[0]!} roughness={0.5} seed={7800} bevel={0.01} />
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.06, 0]} color={blockColors[1]!} roughness={0.5} seed={7801} bevel={0.01} />
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.18, 0]} color={blockColors[2]!} roughness={0.5} seed={7802} bevel={0.01} />
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.13, 0.18, 0.05]} color={blockColors[3]!} roughness={0.5} seed={7803} bevel={0.01} />
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0.4, 0.06, 0.15]} color={blockColors[4]!} roughness={0.5} seed={7804} bevel={0.01} />
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[-0.2, 0.06, 0.3]} color={blockColors[0]!} roughness={0.5} seed={7805} bevel={0.01} />
    </group>
  );
}

// ============================================================
// 9. 開いた本
// ============================================================
export function OpenBook({ palette }: { palette: ThemePalette }) {
  return (
    <group>
      <group position={[1.5, 0.01, 2.5]} rotation={[0, 0.3, 0]}>
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[-0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={7900} bevel={0.003} />
        <NoisyBox size={[0.2, 0.01, 0.28]} position={[0.1, 0.01, 0]} color="#FFF8DC" roughness={0.9} seed={7901} bevel={0.003} />
        <NoisyBox size={[0.02, 0.02, 0.28]} position={[0, 0.01, 0]} color={palette.bookCovers[0] ?? '#654321'} roughness={0.7} seed={7902} bevel={0.002} />
        {[-0.08, -0.04, 0, 0.04, 0.08].map((z, i) => (
          <mesh key={`txt-${i}`} position={[-0.1, 0.02, z]}>
            <planeGeometry args={[0.14, 0.006]} />
            <meshStandardMaterial color="#BBB" />
          </mesh>
        ))}
      </group>
      {/* Second book (closed) */}
      <group position={[1.8, 0.01, 2.7]} rotation={[0, -0.5, 0]}>
        <NoisyBox size={[0.18, 0.04, 0.25]} position={[0, 0.02, 0]} color={palette.bookCovers[1] ?? '#1a1a4e'} roughness={0.7} seed={7910} bevel={0.005} />
      </group>
    </group>
  );
}

// ============================================================
// 10. 小瓶/ポーション
// ============================================================
export function PotionBottles({ palette }: { palette: ThemePalette }) {
  const bottleColors = palette.containerContent.length >= 2
    ? palette.containerContent : ['#FF69B4', '#B0E0E6'];
  return (
    <group position={[0, 0, 2]}>
      <group position={[-0.15, 0, 0]}>
        <NoisyBox size={[0.06, 0.16, 0.06]} position={[0, 0.08, 0]} color={bottleColors[0]!} roughness={0.1} metalness={0.2} seed={31232} bevel={0.006} />
        <NoisyBox size={[0.04, 0.04, 0.04]} position={[0, 0.17, 0]} color={palette.metalAccent} roughness={0.2} metalness={0.9} seed={31233} bevel={0.003} />
      </group>
      <group position={[0.15, 0, -0.05]}>
        <NoisyBox size={[0.05, 0.12, 0.05]} position={[0, 0.06, 0]} color={bottleColors[1]!} roughness={0.1} metalness={0.2} seed={31234} bevel={0.005} />
        <NoisyBox size={[0.035, 0.03, 0.035]} position={[0, 0.13, 0]} color={palette.metalAccent} roughness={0.2} metalness={0.9} seed={31235} bevel={0.003} />
      </group>
    </group>
  );
}

// ============================================================
// 11. 散乱キューブ
// ============================================================
export function ScatteredCubes() {
  return (
    <>
      <NoisyBox size={[0.1, 0.1, 0.1]} position={[2.5, 0.05, 1.5]} color="#3498DB" roughness={0.5} seed={31488} bevel={0.01} />
      <NoisyBox size={[0.08, 0.08, 0.08]} position={[0.5, 0.04, 3]} color="#818cf8" roughness={0.5} seed={31489} bevel={0.008} />
    </>
  );
}

// ============================================================
// 壁棚 (ドア左側 — 1段)
// ============================================================
export function DoorSideShelf({ palette }: { palette: ThemePalette }) {
  return (
    <group position={[-0.5, 0, -ROOM_D / 2 + 0.25]}>
      <NoisyBox size={[1.0, 0.05, 0.3]} position={[0, 1.5, 0]} color={palette.shelfColor} roughness={0.4} metalness={0.3} seed={7250} bevel={0.008} />
      {palette.figureColors.slice(0, 3).map((c, i) => (
        <group key={`shelf-item-${i}`} position={[-0.3 + i * 0.25, 1.58, 0]}>
          <NoisyBox size={[0.06, 0.1, 0.06]} position={[0, 0.05, 0]}
            color={c} roughness={0.3} metalness={0.2} seed={7260 + i} bevel={0.005} />
        </group>
      ))}
    </group>
  );
}
