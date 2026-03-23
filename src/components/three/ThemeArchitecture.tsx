/**
 * cocoro — Theme Architecture (Phase 10)
 * 各テーマの建築要素: 扉、天井照明、壁装飾、窓、棚
 * 見本(Honey Island Defense)レベルの世界観を構築
 */

import * as THREE from 'three';
import type { RoomTheme } from '@/types/cocoro';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './furniture/VoxelBuilder';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// ============================================================
// 共通建築パーツ
// ============================================================

/** テーマ対応ドア */
function ThemeDoor({
  position,
  rotation = [0, 0, 0],
  doorColor,
  frameColor,
  knobColor,
  style = 'standard'
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  doorColor: string;
  frameColor: string;
  knobColor: string;
  style?: 'standard' | 'arch' | 'hatch' | 'portal';
}) {
  const doorW = 1.0;
  const doorH = 2.2;

  return (
    <group position={position} rotation={rotation}>
      {/* ドアフレーム */}
      <NoisyBox size={[0.12, doorH + 0.15, 0.15]} position={[-doorW / 2 - 0.06, doorH / 2, 0]} color={frameColor} seed={100} />
      <NoisyBox size={[0.12, doorH + 0.15, 0.15]} position={[doorW / 2 + 0.06, doorH / 2, 0]} color={frameColor} seed={101} />
      <NoisyBox size={[doorW + 0.24, 0.12, 0.15]} position={[0, doorH + 0.06, 0]} color={frameColor} seed={102} />
      {/* ドア本体 */}
      <NoisyBox size={[doorW, doorH, 0.08]} position={[0, doorH / 2, 0]} color={doorColor} seed={103} lightnessSpread={0.08} />
      {/* ドアパネル装飾 */}
      {style === 'standard' && (
        <>
          <NoisyBox size={[doorW * 0.7, doorH * 0.25, 0.02]} position={[0, doorH * 0.7, 0.05]} color={new THREE.Color(doorColor).offsetHSL(0, 0, -0.05).getStyle()} seed={104} />
          <NoisyBox size={[doorW * 0.7, doorH * 0.25, 0.02]} position={[0, doorH * 0.3, 0.05]} color={new THREE.Color(doorColor).offsetHSL(0, 0, -0.05).getStyle()} seed={105} />
        </>
      )}
      {style === 'arch' && (
        <NoisySphere args={[doorW * 0.35, 12, 12]} position={[0, doorH, 0.05]} color={frameColor} seed={106} />
      )}
      {style === 'hatch' && (
        <>
          <NoisyBox size={[doorW * 0.5, doorW * 0.5, 0.02]} position={[0, doorH * 0.6, 0.05]} color={new THREE.Color(doorColor).offsetHSL(0, 0, -0.1).getStyle()} seed={107} />
          <NoisyCylinder args={[0.02, 0.02, doorW * 0.6, 8]} position={[0, doorH * 0.6, 0.06]} rotation={[0, 0, Math.PI / 4]} color={knobColor} seed={108} />
          <NoisyCylinder args={[0.02, 0.02, doorW * 0.6, 8]} position={[0, doorH * 0.6, 0.06]} rotation={[0, 0, -Math.PI / 4]} color={knobColor} seed={109} />
        </>
      )}
      {/* ドアノブ */}
      <NoisySphere args={[0.04, 8, 8]} position={[doorW * 0.35, doorH * 0.45, 0.06]} color={knobColor} seed={110} />
      <NoisyCylinder args={[0.015, 0.015, 0.06, 6]} position={[doorW * 0.35, doorH * 0.45, 0.04]} rotation={[Math.PI / 2, 0, 0]} color={knobColor} seed={111} />
    </group>
  );
}

/** ペンダントライト */
function PendantCeilingLight({
  position,
  lampColor,
  cordColor = '#333333',
  emissiveColor,
  intensity = 2,
  shape = 'dome',
}: {
  position: [number, number, number];
  lampColor: string;
  cordColor?: string;
  emissiveColor: string;
  intensity?: number;
  shape?: 'dome' | 'lantern' | 'crystal' | 'industrial' | 'cage';
}) {
  return (
    <group position={position}>
      {/* コード */}
      <NoisyCylinder args={[0.01, 0.01, 0.6, 4]} position={[0, 0.3, 0]} color={cordColor} seed={200} />
      {shape === 'dome' && (
        <NoisySphere args={[0.18, 12, 12]} position={[0, 0.05, 0]} color={lampColor} seed={201} />
      )}
      {shape === 'lantern' && (
        <NoisyBox size={[0.2, 0.3, 0.2]} position={[0, -0.1, 0]} color={lampColor} seed={202} lightnessSpread={0.1} />
      )}
      {shape === 'industrial' && (
        <>
          <NoisyCylinder args={[0.2, 0.12, 0.15, 8]} position={[0, 0, 0]} color={lampColor} seed={203} />
          <NoisyCylinder args={[0.22, 0.22, 0.02, 8]} position={[0, 0.08, 0]} color={cordColor} seed={204} />
        </>
      )}
      {shape === 'cage' && (
        <>
          <NoisyCylinder args={[0.15, 0.15, 0.02, 8]} position={[0, 0.08, 0]} color={cordColor} seed={205} />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <NoisyCylinder key={i} args={[0.005, 0.005, 0.25, 4]}
              position={[Math.cos(i * Math.PI / 3) * 0.12, -0.05, Math.sin(i * Math.PI / 3) * 0.12]}
              color={cordColor} seed={206 + i} />
          ))}
          <NoisyCylinder args={[0.1, 0.1, 0.02, 8]} position={[0, -0.18, 0]} color={cordColor} seed={212} />
        </>
      )}
      {shape === 'crystal' && (
        <>
          <NoisySphere args={[0.08, 8, 8]} position={[0, -0.05, 0]} color={lampColor} seed={213} />
          {[0, 1, 2, 3].map(i => (
            <NoisyCylinder key={i} args={[0.005, 0.02, 0.12, 4]}
              position={[Math.cos(i * Math.PI / 2) * 0.04, -0.15, Math.sin(i * Math.PI / 2) * 0.04]}
              color={emissiveColor} seed={214 + i} />
          ))}
        </>
      )}
      {/* 光源 */}
      <EmissiveBox size={[0.08, 0.03, 0.08]} position={[0, -0.02, 0]} color={emissiveColor} emissiveIntensity={5} />
      <pointLight position={[0, -0.1, 0]} color={emissiveColor} intensity={intensity} distance={4} decay={2} />
    </group>
  );
}

/** 壁掛けフレーム */
function WallFrame({
  position,
  rotation = [0, 0, 0],
  frameColor,
  innerColor,
  size = [0.6, 0.5],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  frameColor: string;
  innerColor: string;
  size?: [number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <NoisyBox size={[size[0] + 0.06, size[1] + 0.06, 0.04]} position={[0, 0, 0]} color={frameColor} seed={300} />
      <NoisyBox size={[size[0], size[1], 0.02]} position={[0, 0, 0.02]} color={innerColor} seed={301} lightnessSpread={0.15} />
    </group>
  );
}

/** 壁掛け棚 */
function WallShelfWithItems({
  position,
  rotation = [0, 0, 0],
  shelfColor,
  itemColors,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  shelfColor: string;
  itemColors: string[];
}) {
  return (
    <group position={position} rotation={rotation}>
      <NoisyBox size={[0.8, 0.04, 0.18]} position={[0, 0, 0.09]} color={shelfColor} seed={400} />
      <NoisyBox size={[0.04, 0.12, 0.12]} position={[-0.35, -0.06, 0.06]} color={shelfColor} seed={401} />
      <NoisyBox size={[0.04, 0.12, 0.12]} position={[0.35, -0.06, 0.06]} color={shelfColor} seed={402} />
      {itemColors.map((c, i) => {
        const x = -0.25 + i * 0.2;
        return i % 3 === 0
          ? <NoisySphere key={i} args={[0.04, 8, 8]} position={[x, 0.06, 0.09]} color={c} seed={410 + i} />
          : <NoisyBox key={i} size={[0.06, 0.1, 0.06]} position={[x, 0.07, 0.09]} color={c} seed={410 + i} lightnessSpread={0.1} />;
      })}
    </group>
  );
}

/** 窓 */
function ThemeWindow({
  position,
  rotation = [0, 0, 0],
  frameColor,
  glassColor,
  shape = 'rect',
  glowColor,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  frameColor: string;
  glassColor: string;
  shape?: 'rect' | 'round' | 'porthole';
  glowColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {shape === 'rect' && (
        <>
          <NoisyBox size={[0.8, 0.8, 0.06]} position={[0, 0, 0]} color={frameColor} seed={500} />
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.65, 0.65]} />
            <meshStandardMaterial color={glassColor} transparent opacity={0.4} roughness={0.02} metalness={0.8} emissive={glowColor ?? glassColor} emissiveIntensity={0.3} />
          </mesh>
          <NoisyBox size={[0.65, 0.03, 0.02]} position={[0, 0, 0.04]} color={frameColor} seed={501} />
          <NoisyBox size={[0.03, 0.65, 0.02]} position={[0, 0, 0.04]} color={frameColor} seed={502} />
        </>
      )}
      {(shape === 'round' || shape === 'porthole') && (
        <>
          <NoisyCylinder args={[0.35, 0.35, 0.06, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color={frameColor} seed={503} />
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.28, 16]} />
            <meshStandardMaterial color={glassColor} transparent opacity={0.35} roughness={0.02} metalness={0.8} emissive={glowColor ?? glassColor} emissiveIntensity={0.3} />
          </mesh>
          {shape === 'porthole' && (
            <>
              <NoisyCylinder args={[0.32, 0.32, 0.08, 16]} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} color={frameColor} seed={504} />
              {[0, 1, 2, 3].map(i => (
                <NoisyCylinder key={i} args={[0.015, 0.015, 0.03, 4]}
                  position={[Math.cos(i * Math.PI / 2) * 0.3, Math.sin(i * Math.PI / 2) * 0.3, 0.04]}
                  color={frameColor} seed={505 + i} />
              ))}
            </>
          )}
        </>
      )}
      {glowColor && <pointLight position={[0, 0, 0.3]} color={glowColor} intensity={0.8} distance={2.5} decay={2} />}
    </group>
  );
}

// ============================================================
// テーマ別建築要素
// ============================================================

function UndergroundArchitecture() {
  return (
    <group>
      <ThemeDoor position={[2, 0, -ROOM_D / 2 + 0.08]} doorColor="#4a3728" frameColor="#5C4033" knobColor="#8B7355" style="arch" />
      <PendantCeilingLight position={[-1.5, ROOM_H, -1.5]} lampColor="#8B7355" emissiveColor="#FFB347" intensity={1.5} shape="lantern" />
      <PendantCeilingLight position={[1.5, ROOM_H, 1.5]} lampColor="#8B7355" emissiveColor="#FFB347" intensity={1.2} shape="lantern" />
      {/* 壁掛けトーチ */}
      {[[-ROOM_W / 2 + 0.15, 2.2, -2], [-ROOM_W / 2 + 0.15, 2.2, 2]].map(([x, y, z], i) => (
        <group key={`torch-${i}`} position={[x!, y!, z!]}>
          <NoisyCylinder args={[0.02, 0.03, 0.25, 6]} position={[0, 0, 0]} color="#5C4033" seed={600 + i} />
          <EmissiveBox size={[0.06, 0.08, 0.06]} position={[0, 0.15, 0]} color="#FF6B35" emissiveIntensity={4} />
          <pointLight position={[0, 0.2, 0]} color="#FF6B35" intensity={1} distance={2} decay={2} />
        </group>
      ))}
      {/* 壁の盾と剣 */}
      <group position={[0, 2.2, -ROOM_D / 2 + 0.1]}>
        <NoisyBox size={[0.35, 0.4, 0.04]} position={[0, 0, 0]} color="#8B4513" seed={610} />
        <NoisyBox size={[0.06, 0.6, 0.02]} position={[0.25, 0, 0.02]} color="#888888" seed={611} />
        <NoisyBox size={[0.15, 0.04, 0.02]} position={[0.25, 0.2, 0.02]} color="#888888" seed={612} />
      </group>
      {/* 石柱 */}
      <NoisyCylinder args={[0.15, 0.18, ROOM_H, 8]} position={[-ROOM_W / 2 + 0.5, ROOM_H / 2, -ROOM_D / 2 + 0.5]} color="#5C4033" seed={620} />
      <NoisyCylinder args={[0.15, 0.18, ROOM_H, 8]} position={[ROOM_W / 2 - 0.5, ROOM_H / 2, -ROOM_D / 2 + 0.5]} color="#5C4033" seed={621} />
    </group>
  );
}

function TreehouseArchitecture() {
  return (
    <group>
      <ThemeDoor position={[-2, 0, -ROOM_D / 2 + 0.08]} doorColor="#8B6914" frameColor="#5C3A1E" knobColor="#FFD700" style="standard" />
      <PendantCeilingLight position={[0, ROOM_H, 0]} lampColor="#228B22" emissiveColor="#AAFF77" intensity={1.5} shape="dome" />
      <PendantCeilingLight position={[-2, ROOM_H, -2]} lampColor="#3CB371" emissiveColor="#77FF99" intensity={0.8} shape="crystal" />
      <ThemeWindow position={[ROOM_W / 2 - 0.08, 2, 0]} rotation={[0, -Math.PI / 2, 0]} frameColor="#5C3A1E" glassColor="#87CEEB" shape="round" glowColor="#AAFF77" />
      <WallShelfWithItems position={[0.5, 2.2, -ROOM_D / 2 + 0.08]} shelfColor="#78350f" itemColors={['#FF6B6B', '#4ECDC4', '#FFE66D', '#a78bfa']} />
      <WallFrame position={[-2, 2, -ROOM_D / 2 + 0.1]} frameColor="#5C3A1E" innerColor="#2E7D32" size={[0.5, 0.4]} />
      {/* ツタ */}
      {[-2, 0, 2].map((x, i) => (
        <group key={`vine-${i}`}>
          <NoisyCylinder args={[0.03, 0.02, 1.5, 6]} position={[x + 0.1, ROOM_H - 0.2, -1 + i * 0.5]} rotation={[0, 0, Math.PI / 6]} color="#2E7D32" seed={700 + i} />
          <NoisySphere args={[0.05, 6, 6]} position={[x + 0.2, ROOM_H - 0.3, -0.8 + i * 0.5]} color="#4CAF50" seed={710 + i} />
        </group>
      ))}
    </group>
  );
}

function BeachArchitecture() {
  return (
    <group>
      <ThemeDoor position={[0, 0, -ROOM_D / 2 + 0.08]} doorColor="#D4A574" frameColor="#8B6914" knobColor="#C0C0C0" style="standard" />
      <PendantCeilingLight position={[0, ROOM_H, 0]} lampColor="#F5F0E0" emissiveColor="#FFE4B5" intensity={2} shape="dome" />
      <ThemeWindow position={[ROOM_W / 2 - 0.08, 2, -1]} rotation={[0, -Math.PI / 2, 0]} frameColor="#F5F0E0" glassColor="#87CEEB" shape="rect" glowColor="#87CEEB" />
      <ThemeWindow position={[ROOM_W / 2 - 0.08, 2, 1.5]} rotation={[0, -Math.PI / 2, 0]} frameColor="#F5F0E0" glassColor="#87CEEB" shape="rect" glowColor="#87CEEB" />
      {/* サーフボード */}
      <group position={[-ROOM_W / 2 + 0.12, 2, 1]} rotation={[0, Math.PI / 2, Math.PI / 12]}>
        <NoisyBox size={[0.12, 1.2, 0.04]} position={[0, 0, 0]} color="#FF6B6B" seed={800} lightnessSpread={0.15} />
      </group>
      <WallFrame position={[1.5, 2.3, -ROOM_D / 2 + 0.1]} frameColor="#D4A574" innerColor="#4FC3F7" size={[0.7, 0.45]} />
      <WallShelfWithItems position={[-2, 2, -ROOM_D / 2 + 0.08]} shelfColor="#D4A574" itemColors={['#FFB6C1', '#E0E0E0', '#FFD700', '#FF8A80']} />
    </group>
  );
}

function SpaceArchitecture() {
  return (
    <group>
      <ThemeDoor position={[2.5, 0, -ROOM_D / 2 + 0.08]} doorColor="#778899" frameColor="#555555" knobColor="#00BFFF" style="hatch" />
      <PendantCeilingLight position={[-1.5, ROOM_H, -1.5]} lampColor="#444444" cordColor="#555555" emissiveColor="#00BFFF" intensity={1.5} shape="industrial" />
      <PendantCeilingLight position={[1.5, ROOM_H, 1.5]} lampColor="#444444" cordColor="#555555" emissiveColor="#00BFFF" intensity={1.5} shape="industrial" />
      <ThemeWindow position={[ROOM_W / 2 - 0.08, 2, 0]} rotation={[0, -Math.PI / 2, 0]} frameColor="#555555" glassColor="#0D1B2A" shape="porthole" glowColor="#4FC3F7" />
      <ThemeWindow position={[-ROOM_W / 2 + 0.08, 2, 0]} rotation={[0, Math.PI / 2, 0]} frameColor="#555555" glassColor="#0D1B2A" shape="porthole" glowColor="#4FC3F7" />
      {/* 壁モニター */}
      <group position={[0, 2, -ROOM_D / 2 + 0.1]}>
        <NoisyBox size={[1.2, 0.7, 0.06]} position={[0, 0, 0]} color="#1A1A2E" seed={900} />
        <EmissiveBox size={[1.1, 0.6, 0.02]} position={[0, 0, 0.04]} color="#0D47A1" emissiveIntensity={2} />
        {[0, 1, 2, 3, 4].map(i => (
          <EmissiveBox key={i} size={[1.05, 0.005, 0.01]} position={[0, -0.25 + i * 0.12, 0.05]} color="#00BFFF" emissiveIntensity={3} />
        ))}
      </group>
      {/* 配管 */}
      <NoisyCylinder args={[0.02, 0.02, ROOM_H, 6]} position={[-ROOM_W / 2 + 0.2, ROOM_H / 2, -3]} color="#666666" seed={920} />
      <NoisyCylinder args={[0.02, 0.02, ROOM_H, 6]} position={[-ROOM_W / 2 + 0.2, ROOM_H / 2, 3]} color="#666666" seed={921} />
      {/* LED */}
      <EmissiveBox size={[ROOM_W - 0.5, 0.02, 0.02]} position={[0, ROOM_H - 0.08, -ROOM_D / 2 + 0.15]} color="#00BFFF" emissiveIntensity={4} />
      <EmissiveBox size={[0.02, 0.02, ROOM_D - 0.5]} position={[ROOM_W / 2 - 0.15, ROOM_H - 0.08, 0]} color="#00BFFF" emissiveIntensity={4} />
    </group>
  );
}

function RooftopArchitecture() {
  return (
    <group>
      <ThemeDoor position={[-2.5, 0, -ROOM_D / 2 + 0.08]} doorColor="#78909C" frameColor="#546E7A" knobColor="#FFD54F" style="standard" />
      <PendantCeilingLight position={[0, ROOM_H, 0]} lampColor="#37474F" cordColor="#455A64" emissiveColor="#FFE082" intensity={2} shape="cage" />
      <PendantCeilingLight position={[-2.5, ROOM_H, 2]} lampColor="#37474F" cordColor="#455A64" emissiveColor="#FFE082" intensity={1} shape="industrial" />
      {/* フェンス */}
      {Array.from({ length: 5 }).map((_, i) => (
        <NoisyCylinder key={`fence-${i}`} args={[0.02, 0.02, 1.2, 4]} position={[ROOM_W / 2 - 0.1, 0.6, -3 + i * 1.5]} color="#78909C" seed={1000 + i} />
      ))}
      <NoisyBox size={[0.04, 0.04, ROOM_D - 1]} position={[ROOM_W / 2 - 0.1, 1.2, 0]} color="#78909C" seed={1010} />
      <WallFrame position={[1, 1.8, -ROOM_D / 2 + 0.1]} frameColor="#37474F" innerColor="#FF5252" size={[0.8, 0.6]} />
    </group>
  );
}

function RetroGamingArchitecture() {
  return (
    <group>
      <ThemeDoor position={[-3, 0, -ROOM_D / 2 + 0.08]} doorColor="#C8976B" frameColor="#8B6914" knobColor="#f472b6" style="standard" />
      <PendantCeilingLight position={[0, ROOM_H, 0]} lampColor="#1e1b4b" emissiveColor="#f472b6" intensity={1.5} shape="industrial" />
      <PendantCeilingLight position={[-2, ROOM_H, -2]} lampColor="#1e1b4b" emissiveColor="#67e8f9" intensity={1} shape="cage" />
      <WallFrame position={[-1, 2.2, -ROOM_D / 2 + 0.1]} frameColor="#312e81" innerColor="#7c3aed" size={[0.5, 0.7]} />
      <WallFrame position={[2, 2.2, -ROOM_D / 2 + 0.1]} frameColor="#312e81" innerColor="#f472b6" size={[0.4, 0.5]} />
      <WallShelfWithItems position={[1, 1.5, -ROOM_D / 2 + 0.08]} shelfColor="#312e81" itemColors={['#f472b6', '#67e8f9', '#fbbf24', '#a78bfa', '#34d399']} />
      {/* ネオンLED */}
      <EmissiveBox size={[ROOM_W - 0.5, 0.02, 0.02]} position={[0, ROOM_H - 0.08, -ROOM_D / 2 + 0.15]} color="#f472b6" emissiveIntensity={3} />
      <EmissiveBox size={[0.02, 0.02, ROOM_D - 0.5]} position={[-ROOM_W / 2 + 0.15, ROOM_H - 0.08, 0]} color="#67e8f9" emissiveIntensity={3} />
      <EmissiveBox size={[0.02, 0.02, ROOM_D - 0.5]} position={[ROOM_W / 2 - 0.15, ROOM_H - 0.08, 0]} color="#67e8f9" emissiveIntensity={3} />
    </group>
  );
}

function AquariumArchitecture() {
  return (
    <group>
      <ThemeDoor position={[2, 0, -ROOM_D / 2 + 0.08]} doorColor="#5A7A9C" frameColor="#2A5A8C" knobColor="#C0C0C0" style="hatch" />
      <PendantCeilingLight position={[0, ROOM_H, 0]} lampColor="#4FC3F7" emissiveColor="#80DEEA" intensity={1.5} shape="crystal" />
      <PendantCeilingLight position={[-2, ROOM_H, 2]} lampColor="#4FC3F7" emissiveColor="#80DEEA" intensity={0.8} shape="crystal" />
      <ThemeWindow position={[ROOM_W / 2 - 0.08, 2, -1]} rotation={[0, -Math.PI / 2, 0]} frameColor="#2A5A8C" glassColor="#0D47A1" shape="porthole" glowColor="#4FC3F7" />
      <ThemeWindow position={[-ROOM_W / 2 + 0.08, 2, 1]} rotation={[0, Math.PI / 2, 0]} frameColor="#2A5A8C" glassColor="#0D47A1" shape="porthole" glowColor="#4FC3F7" />
      <NoisyCylinder args={[0.025, 0.025, ROOM_H, 6]} position={[ROOM_W / 2 - 0.2, ROOM_H / 2, -3.5]} color="#4A6D8C" seed={1200} />
      <NoisyCylinder args={[0.025, 0.025, ROOM_H, 6]} position={[ROOM_W / 2 - 0.2, ROOM_H / 2, 3.5]} color="#4A6D8C" seed={1201} />
      <EmissiveBox size={[ROOM_W - 0.5, 0.02, 0.02]} position={[0, 0.05, -ROOM_D / 2 + 0.15]} color="#80DEEA" emissiveIntensity={3} />
    </group>
  );
}

function VolcanoArchitecture() {
  return (
    <group>
      <ThemeDoor position={[-2, 0, -ROOM_D / 2 + 0.08]} doorColor="#3E2723" frameColor="#4E342E" knobColor="#FF8F00" style="arch" />
      <PendantCeilingLight position={[-1, ROOM_H, -1]} lampColor="#4E342E" emissiveColor="#FF6D00" intensity={2} shape="lantern" />
      <PendantCeilingLight position={[1, ROOM_H, 1]} lampColor="#4E342E" emissiveColor="#FF6D00" intensity={2} shape="lantern" />
      {/* 壁トーチ */}
      {[[-ROOM_W / 2 + 0.15, 2, -2], [-ROOM_W / 2 + 0.15, 2, 2], [ROOM_W / 2 - 0.15, 2, 0]].map(([x, y, z], i) => (
        <group key={`torch-${i}`} position={[x!, y!, z!]}>
          <NoisyCylinder args={[0.025, 0.035, 0.3, 6]} position={[0, 0, 0]} color="#4E342E" seed={1300 + i} />
          <EmissiveBox size={[0.06, 0.1, 0.06]} position={[0, 0.2, 0]} color="#FF6D00" emissiveIntensity={5} />
          <pointLight position={[0, 0.25, 0]} color="#FF6D00" intensity={1.5} distance={2.5} decay={2} />
        </group>
      ))}
      {/* 鍾乳石 */}
      {[-2.5, -1, 0.5, 2.5].map((x, i) => (
        <NoisyCylinder key={`stal-${i}`} args={[0.02, 0.08, 0.4, 6]} position={[x, ROOM_H - 0.15, -1 + i * 0.8]} color="#5D4037" seed={1320 + i} />
      ))}
      <NoisyCylinder args={[0.2, 0.25, ROOM_H, 8]} position={[ROOM_W / 2 - 0.5, ROOM_H / 2, -ROOM_D / 2 + 0.5]} color="#3E2723" seed={1340} />
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
