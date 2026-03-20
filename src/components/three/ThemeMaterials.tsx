/**
 * cocoro — Theme Materials
 * floorPattern / wallPattern に基づくプロシージャル床・壁・天井マテリアル
 * テクスチャファイル不要、マテリアルパラメータとジオメトリで質感を表現
 */

import { useMemo } from 'react';
import * as THREE from 'three';

type FloorPattern = 'solid' | 'wood' | 'stone' | 'sand' | 'metal' | 'grass' | 'tile' | 'lava';
type WallPattern = 'solid' | 'brick' | 'wood' | 'glass' | 'rock' | 'coral' | 'obsidian' | 'panel';

interface MaterialParams {
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

// ---- Floor pattern materials ----
const FLOOR_MATERIALS: Record<FloorPattern, MaterialParams> = {
  solid:  { roughness: 0.7, metalness: 0.1 },
  wood:   { roughness: 0.75, metalness: 0.05 },
  stone:  { roughness: 0.95, metalness: 0.05 },
  sand:   { roughness: 1.0, metalness: 0 },
  metal:  { roughness: 0.15, metalness: 0.95 },
  grass:  { roughness: 0.95, metalness: 0 },
  tile:   { roughness: 0.3, metalness: 0.15 },
  lava:   { roughness: 0.5, metalness: 0.3, emissive: '#FF4500', emissiveIntensity: 0.8, },
};

// ---- Wall pattern materials ----
const WALL_MATERIALS: Record<WallPattern, MaterialParams> = {
  solid:    { roughness: 0.85, metalness: 0.05 },
  brick:    { roughness: 0.9, metalness: 0.05 },
  wood:     { roughness: 0.8, metalness: 0.05 },
  glass:    { roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.4 },
  rock:     { roughness: 0.95, metalness: 0.1 },
  coral:    { roughness: 0.85, metalness: 0.1 },
  obsidian: { roughness: 0.05, metalness: 0.9, emissive: '#FF4500', emissiveIntensity: 0.15 },
  panel:    { roughness: 0.2, metalness: 0.85 },
};

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// ---- Floor overlay geometry (adds visual texture) ----

function WoodFloorOverlay({ color }: { color: string }) {
  return (
    <group>
      {/* Wood plank lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-ROOM_W / 2 + i + 0.5, 0.003, 0]}>
          <planeGeometry args={[0.9, ROOM_D]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? color : new THREE.Color(color).offsetHSL(0, 0, -0.05).getStyle()}
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>
      ))}
      {/* Gaps between planks */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`gap-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-ROOM_W / 2 + i + 1, 0.002, 0]}>
          <planeGeometry args={[0.02, ROOM_D]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0, 0, -0.15).getStyle()}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function StoneFloorOverlay({ color }: { color: string }) {
  const stones = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number; shade: number }[] = [];
    for (let gx = 0; gx < 4; gx++) {
      for (let gz = 0; gz < 4; gz++) {
        result.push({
          x: -ROOM_W / 2 + gx * 2 + 1 + (Math.random() - 0.5) * 0.2,
          z: -ROOM_D / 2 + gz * 2 + 1 + (Math.random() - 0.5) * 0.2,
          w: 1.6 + Math.random() * 0.3,
          d: 1.6 + Math.random() * 0.3,
          shade: Math.random() * 0.1 - 0.05,
        });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.003, s.z]}>
          <planeGeometry args={[s.w, s.d]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0, 0, s.shade).getStyle()}
            roughness={0.9 + Math.random() * 0.1}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function GrassFloorOverlay({ color }: { color: string }) {
  const tufts = useMemo(() => {
    const result: { x: number; z: number; rot: number; h: number; shade: number }[] = [];
    for (let i = 0; i < 60; i++) {
      result.push({
        x: (Math.random() - 0.5) * ROOM_W * 0.9,
        z: (Math.random() - 0.5) * ROOM_D * 0.9,
        rot: Math.random() * Math.PI,
        h: 0.04 + Math.random() * 0.06,
        shade: Math.random() * 0.12 - 0.06,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {tufts.map((t, i) => (
        <mesh key={i} position={[t.x, t.h / 2, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[0.08, t.h, 0.02]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0.02, 0, t.shade).getStyle()}
            roughness={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function SandFloorOverlay({ color }: { color: string }) {
  const ripples = useMemo(() => {
    const result: { x: number; z: number; w: number; rot: number }[] = [];
    for (let i = 0; i < 12; i++) {
      result.push({
        x: (Math.random() - 0.5) * ROOM_W * 0.85,
        z: (Math.random() - 0.5) * ROOM_D * 0.85,
        w: 0.8 + Math.random() * 1.2,
        rot: Math.random() * 0.3 - 0.15,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {ripples.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, r.rot, 0]} position={[r.x, 0.003, r.z]}>
          <planeGeometry args={[r.w, 0.03]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0, 0, 0.04).getStyle()}
            roughness={1.0}
          />
        </mesh>
      ))}
    </group>
  );
}

function TileFloorOverlay({ color }: { color: string }) {
  return (
    <group>
      {Array.from({ length: 8 }).map((_, i) =>
        Array.from({ length: 8 }).map((_, j) => (
          <mesh key={`tile-${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]}
            position={[-ROOM_W / 2 + i + 0.5, 0.003, -ROOM_D / 2 + j + 0.5]}>
            <planeGeometry args={[0.92, 0.92]} />
            <meshStandardMaterial
              color={(i + j) % 2 === 0 ? color : new THREE.Color(color).offsetHSL(0, -0.1, 0.08).getStyle()}
              roughness={0.3}
              metalness={0.15}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

function LavaFloorOverlay({ color }: { color: string }) {
  return (
    <group>
      {/* Base cracks */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`lava-crack-${i}`} rotation={[-Math.PI / 2, 0, i * 0.5]}
          position={[(Math.random() - 0.5) * ROOM_W * 0.8, 0.004, (Math.random() - 0.5) * ROOM_D * 0.8]}>
          <planeGeometry args={[0.04, 1.5 + Math.random()]} />
          <meshStandardMaterial color={color} emissive="#FF6B35" emissiveIntensity={4} />
        </mesh>
      ))}
    </group>
  );
}

function BrickWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const rows = Math.floor(height / 0.12);
  const cols = Math.floor(width / 0.3);

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const offset = row % 2 === 0 ? 0 : 0.15;
          const x = -width / 2 + col * 0.3 + offset + 0.15;
          const y = -height / 2 + row * 0.12 + 0.06;
          if (x > width / 2 || x < -width / 2) return null;
          return (
            <mesh key={`brick-${row}-${col}`} position={[x, y, 0.08]}>
              <boxGeometry args={[0.26, 0.1, 0.02]} />
              <meshStandardMaterial
                color={new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.06).getStyle()}
                roughness={0.9}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function GlassWallOverlay({ position, rotation }: {
  position: [number, number, number]; rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Reflective sheen */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.15}
          roughness={0.02}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function PanelWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const panelCols = 4;
  const panelRows = 3;
  const pW = width / panelCols;
  const pH = height / panelRows;

  return (
    <group position={position} rotation={rotation}>
      {/* Panel seams */}
      {Array.from({ length: panelCols - 1 }).map((_, i) => (
        <mesh key={`seam-v-${i}`} position={[-width / 2 + (i + 1) * pW, 0, 0.08]}>
          <boxGeometry args={[0.01, height, 0.005]} />
          <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, 0, 0.15).getStyle()} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {Array.from({ length: panelRows - 1 }).map((_, i) => (
        <mesh key={`seam-h-${i}`} position={[0, -height / 2 + (i + 1) * pH, 0.08]}>
          <boxGeometry args={[width, 0.01, 0.005]} />
          <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, 0, 0.15).getStyle()} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function WoodWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const planks = Math.floor(width / 0.4);
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: planks }).map((_, i) => {
        const x = -width / 2 + i * 0.4 + 0.2;
        const shade = (i % 3 === 0) ? -0.04 : (i % 3 === 1) ? 0.02 : 0;
        return (
          <mesh key={`wp-${i}`} position={[x, 0, 0.08]}>
            <boxGeometry args={[0.36, height, 0.01]} />
            <meshStandardMaterial
              color={new THREE.Color(color).offsetHSL(0, 0, shade).getStyle()}
              roughness={0.8}
              metalness={0.05}
            />
          </mesh>
        );
      })}
      {/* Gaps between planks */}
      {Array.from({ length: planks - 1 }).map((_, i) => (
        <mesh key={`wg-${i}`} position={[-width / 2 + (i + 1) * 0.4, 0, 0.078]}>
          <boxGeometry args={[0.01, height, 0.005]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0, 0, -0.12).getStyle()}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function RockWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const rocks = useMemo(() => {
    const result: { x: number; y: number; w: number; h: number; shade: number }[] = [];
    for (let row = 0; row < Math.floor(height / 0.3); row++) {
      const cols = Math.floor(width / 0.5) + 1;
      for (let col = 0; col < cols; col++) {
        const offset = row % 2 === 0 ? 0 : 0.25;
        result.push({
          x: -width / 2 + col * 0.5 + offset + (Math.random() - 0.5) * 0.1,
          y: -height / 2 + row * 0.3 + 0.15 + (Math.random() - 0.5) * 0.05,
          w: 0.35 + Math.random() * 0.12,
          h: 0.22 + Math.random() * 0.06,
          shade: (Math.random() - 0.5) * 0.08,
        });
      }
    }
    return result;
  }, [width, height]);

  return (
    <group position={position} rotation={rotation}>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, 0.08]}>
          <boxGeometry args={[r.w, r.h, 0.02]} />
          <meshStandardMaterial
            color={new THREE.Color(color).offsetHSL(0, 0, r.shade).getStyle()}
            roughness={0.95}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---- Exports ----

interface FloorOverlayProps {
  pattern: string;
  color: string;
}

export function FloorOverlay({ pattern, color }: FloorOverlayProps) {
  switch (pattern) {
    case 'wood': return <WoodFloorOverlay color={color} />;
    case 'stone': return <StoneFloorOverlay color={color} />;
    case 'tile': return <TileFloorOverlay color={color} />;
    case 'lava': return <LavaFloorOverlay color={color} />;
    case 'grass': return <GrassFloorOverlay color={color} />;
    case 'sand': return <SandFloorOverlay color={color} />;
    default: return null;
  }
}

export function getFloorMaterialProps(pattern: string): MaterialParams {
  return FLOOR_MATERIALS[pattern as FloorPattern] ?? FLOOR_MATERIALS.solid;
}

export function getWallMaterialProps(pattern: string): MaterialParams {
  return WALL_MATERIALS[pattern as WallPattern] ?? WALL_MATERIALS.solid;
}

interface WallOverlayProps {
  pattern: string;
  color: string;
  wall: 'back' | 'left' | 'right';
}

export function WallOverlay({ pattern, color, wall }: WallOverlayProps) {
  const wallPositions: Record<string, { pos: [number, number, number]; rot: [number, number, number]; w: number }> = {
    back: { pos: [0, ROOM_H / 2, -ROOM_D / 2], rot: [0, 0, 0], w: ROOM_W },
    left: { pos: [-ROOM_W / 2, ROOM_H / 2, 0], rot: [0, Math.PI / 2, 0], w: ROOM_D },
    right: { pos: [ROOM_W / 2, ROOM_H / 2, 0], rot: [0, Math.PI / 2, 0], w: ROOM_D },
  };
  const wp = wallPositions[wall]!;

  switch (pattern) {
    case 'brick': return <BrickWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'glass': return <GlassWallOverlay position={wp.pos} rotation={wp.rot} />;
    case 'panel': return <PanelWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'wood': return <WoodWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'rock': return <RockWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    default: return null;
  }
}
