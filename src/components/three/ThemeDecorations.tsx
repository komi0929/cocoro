/**
 * cocoro — Theme Decorations (Phase 7 — High-Poly Voxel)
 * 8テーマ固有の3D装飾オブジェクト群
 * NoisyBox/NoisyCylinder/NoisySphere/EmissiveBox + アニメーション付き高セグメントジオメトリ
 * 参考画像レベルのハイポリボクセルアートを実現
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomTheme } from '@/types/cocoro';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './furniture/VoxelBuilder';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// =================================================================
// Underground (地下室) — crystal, pipe, glow_moss, stalactite
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
      {/* Crystals (animated emissive — keep raw mesh for ref access) */}
      <group ref={crystalRef}>
        {[
          { pos: [-3.5, 0, -3.5] as const, scale: 1.2, rot: 0.3 },
          { pos: [3.2, 0, -3.2] as const, scale: 0.8, rot: -0.5 },
          { pos: [-2, 0, 2.5] as const, scale: 0.6, rot: 0.7 },
          { pos: [2.8, 0, 1.5] as const, scale: 1.0, rot: -0.2 },
        ].map((c, i) => (
          <mesh key={`crystal-${i}`} position={[c.pos[0], c.scale * 0.5, c.pos[2]]} rotation={[0, c.rot, 0.1]}>
            <coneGeometry args={[0.15 * c.scale, c.scale * 1.2, 8]} />
            <meshStandardMaterial
              color="#9b59b6" emissive="#7c3aed" emissiveIntensity={2}
              transparent opacity={0.8} roughness={0.08} metalness={0.55}
            />
          </mesh>
        ))}
        {/* Small crystal clusters around base */}
        {[
          [-3.7, 0, -3.3], [-3.3, 0, -3.7], [3.0, 0, -3.0], [3.4, 0, -3.4],
          [-2.2, 0, 2.3], [2.6, 0, 1.3], [3.0, 0, 1.7],
        ].map(([x, , z], i) => (
          <mesh key={`mini-crystal-${i}`} position={[x!, 0.15, z!]} rotation={[0, i * 0.9, 0.2 + i * 0.1]}>
            <coneGeometry args={[0.05 + i * 0.01, 0.3 + i * 0.04, 6]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.5} transparent opacity={0.7} roughness={0.1} metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Pipes along ceiling */}
      {[0.8, -0.8].map((z, i) => (
        <NoisyCylinder key={`pipe-${i}`} args={[0.06, 0.06, ROOM_W - 1]} position={[0, ROOM_H - 0.3, z * 3]} rotation={[0, 0, Math.PI / 2]} color="#555" roughness={0.2} metalness={0.9} seed={3000 + i} />
      ))}
      {/* Pipe joints */}
      {[0.8, -0.8].map((z, i) =>
        [-2, 0, 2].map((x, j) => (
          <NoisyCylinder key={`joint-${i}-${j}`} args={[0.09, 0.09, 0.08]} position={[x, ROOM_H - 0.3, z * 3]} rotation={[0, 0, Math.PI / 2]} color="#666" metalness={0.85} roughness={0.25} seed={3010 + i * 3 + j} />
        ))
      )}

      {/* Glow moss patches on walls (animated) */}
      <mesh ref={mossRef} position={[-ROOM_W / 2 + 0.12, 0.8, -1.5]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#2d6a4f" emissive="#4ade80" emissiveIntensity={0.3} roughness={1} transparent opacity={0.7} />
      </mesh>
      {/* Additional moss patches */}
      <NoisySphere args={[0.2]} position={[-ROOM_W / 2 + 0.14, 1.5, 1.0]} color="#3a7d5e" roughness={0.95} seed={3020} />
      <NoisySphere args={[0.15]} position={[ROOM_W / 2 - 0.14, 0.6, -2.0]} color="#2d8659" roughness={0.95} seed={3021} />

      {/* Stalactites from ceiling */}
      {[
        [-1.5, -2], [0.5, -1], [2, -3], [-2.5, 0.5], [1.5, 2.5],
      ].map(([x, z], i) => (
        <NoisyCylinder key={`stalactite-${i}`} args={[0.02, 0.08 + i * 0.02, 0.4 + i * 0.15]} position={[x!, ROOM_H - 0.2 - (0.4 + i * 0.15) / 2, z!]} color="#4a3728" roughness={0.85} seed={3030 + i} />
      ))}

      {/* Rock formations on floor */}
      <NoisyBox size={[0.6, 0.25, 0.5]} position={[-1, 0.125, 3]} color="#3d2b1f" roughness={0.95} seed={3040} bevel={0.03} />
      <NoisyBox size={[0.4, 0.3, 0.35]} position={[2, 0.15, -1]} color="#4a3728" roughness={0.9} seed={3041} bevel={0.02} />

      {/* Crystal point lights */}
      <pointLight position={[-3.5, 0.8, -3.5]} color="#7c3aed" intensity={1.5} distance={3} decay={2} />
      <pointLight position={[3.2, 0.6, -3.2]} color="#a855f7" intensity={1} distance={2.5} decay={2} />
    </group>
  );
}

// =================================================================
// Loft (ロフト) — window_frame, bookshelf, fireplace, hanging_plant
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
      {/* Window frame on back wall */}
      <group position={[1.5, 1.8, -ROOM_D / 2 + 0.12]}>
        {/* Window glass */}
        <mesh>
          <planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#FFF8DC" emissiveIntensity={0.5} />
        </mesh>
        {/* Frame */}
        {[
          { pos: [0, 0.75, 0.01] as [number,number,number], size: [1.3, 0.06, 0.05] as [number,number,number] },
          { pos: [0, -0.75, 0.01] as [number,number,number], size: [1.3, 0.06, 0.05] as [number,number,number] },
          { pos: [-0.6, 0, 0.01] as [number,number,number], size: [0.06, 1.5, 0.05] as [number,number,number] },
          { pos: [0.6, 0, 0.01] as [number,number,number], size: [0.06, 1.5, 0.05] as [number,number,number] },
          { pos: [0, 0, 0.01] as [number,number,number], size: [0.04, 1.5, 0.05] as [number,number,number] },
        ].map((f, i) => (
          <NoisyBox key={`wf-${i}`} size={f.size} position={f.pos} color="#8B6914" roughness={0.55} seed={3100 + i} bevel={0.01} />
        ))}
        <spotLight position={[0, 0, 0.5]} target-position={[0.5, -2, 2]} angle={0.6} penumbra={1}
          intensity={2} color="#FFF8DC" distance={6} castShadow />
      </group>

      {/* Bookshelf on left wall */}
      <group position={[-ROOM_W / 2 + 0.25, 0, -1]}>
        {/* Shelves */}
        {[0.3, 1.0, 1.7, 2.4].map((y, i) => (
          <NoisyBox key={`shelf-${i}`} size={[0.25, 0.05, 1.0]} position={[0, y, 0]} color="#654321" roughness={0.75} seed={3110 + i} bevel={0.008} />
        ))}
        {/* Side panels */}
        <NoisyBox size={[0.2, 2.2, 0.04]} position={[0, 1.3, -0.48]} color="#5c3a1e" roughness={0.8} seed={3115} bevel={0.006} />
        <NoisyBox size={[0.2, 2.2, 0.04]} position={[0, 1.3, 0.48]} color="#5c3a1e" roughness={0.8} seed={3116} bevel={0.006} />
        {/* Books */}
        {[0.3, 1.0, 1.7].map((y, si) => (
          <group key={`books-${si}`} position={[0, y + 0.15, 0]}>
            {Array.from({ length: 6 }).map((_, bi) => (
              <NoisyBox key={`b-${si}-${bi}`} size={[0.15, 0.2 + bi * 0.012, 0.08]} position={[0, 0, -0.35 + bi * 0.12]}
                color={['#8B0000', '#00008B', '#006400', '#8B4513', '#4B0082', '#B8860B'][bi]!}
                roughness={0.85} seed={3120 + si * 6 + bi} bevel={0.006} />
            ))}
          </group>
        ))}
      </group>

      {/* Fireplace */}
      <group position={[0, 0, -ROOM_D / 2 + 0.3]}>
        <NoisyBox size={[1.2, 0.7, 0.5]} position={[0, 0.35, 0]} color="#8B4513" roughness={0.85} seed={3150} bevel={0.02} />
        <NoisyBox size={[0.8, 0.5, 0.3]} position={[0, 0.35, 0.1]} color="#1a0a00" roughness={0.95} seed={3151} bevel={0.01} />
        {/* Mantle */}
        <NoisyBox size={[1.4, 0.07, 0.55]} position={[0, 0.72, 0]} color="#654321" roughness={0.65} seed={3152} bevel={0.012} />
        {/* Decorative items on mantle */}
        <NoisyCylinder args={[0.03, 0.03, 0.08]} position={[-0.4, 0.8, 0]} color="#DAA520" metalness={0.5} roughness={0.3} seed={3153} />
        <NoisyBox size={[0.1, 0.12, 0.04]} position={[0.4, 0.82, 0]} color="#2196F3" roughness={0.8} seed={3154} bevel={0.008} />
        <pointLight ref={fireRef} position={[0, 0.3, 0.2]} color="#FF6B35" intensity={3} distance={4} decay={2} />
      </group>

      {/* Hanging plants */}
      {[
        [2, ROOM_H - 0.3, -2] as const,
        [-1.5, ROOM_H - 0.3, 2] as const,
      ].map(([x, y, z], i) => (
        <group key={`plant-${i}`} position={[x, y, z]}>
          <NoisyCylinder args={[0.12, 0.08, 0.15]} color="#CD853F" roughness={0.75} seed={3160 + i} />
          {[0, 1, 2].map(j => (
            <NoisySphere key={`vine-${j}`} args={[0.07]} position={[Math.sin(j * 2.1) * 0.1, -0.15 - j * 0.14, Math.cos(j * 2.1) * 0.1]} color="#228B22" roughness={0.88} seed={3165 + i * 3 + j} />
          ))}
        </group>
      ))}
    </group>
  );
}

// =================================================================
// Treehouse (ツリーハウス) — branch, leaf_cluster, bird_nest, vine, lantern
// =================================================================
function TreehouseDecorations() {
  const lanternRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lanternRef.current) {
      const t = clock.getElapsedTime();
      lanternRef.current.intensity = 2 + Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group>
      {/* Thick branches coming through walls */}
      {[
        { start: [-ROOM_W / 2, 2.5, -2] as [number,number,number], rot: [0.2, 0, 0.6] as [number,number,number], len: 3 },
        { start: [ROOM_W / 2, 1.8, 1] as [number,number,number], rot: [-0.1, Math.PI, -0.5] as [number,number,number], len: 2.5 },
        { start: [-ROOM_W / 2, 1, 2] as [number,number,number], rot: [0, 0, 0.4] as [number,number,number], len: 2 },
      ].map((b, i) => (
        <NoisyCylinder key={`branch-${i}`} args={[0.08, 0.15, b.len]} position={b.start} rotation={b.rot} color="#5C3D1E" roughness={0.9} seed={3200 + i} lightnessSpread={0.12} />
      ))}

      {/* Leaf clusters */}
      {[
        [-2, 2.8, -2], [1, 3, 0], [-1, ROOM_H - 0.2, 2], [3, 2.5, -1],
        [-3, 2.2, 1.5], [0, ROOM_H, -3], [2, 2.6, 2.5],
      ].map(([x, y, z], i) => (
        <NoisySphere key={`leaf-${i}`} args={[0.2 + i * 0.02]} position={[x!, y!, z!]} color={i % 2 === 0 ? '#228B22' : '#32CD32'} roughness={0.9} seed={3210 + i} lightnessSpread={0.12} />
      ))}

      {/* Bird nest */}
      <group position={[2, 2.8, -2.5]}>
        <NoisyCylinder args={[0.18, 0.12, 0.08]} color="#8B7355" roughness={0.95} seed={3220} />
        {[0, 1, 2].map(i => (
          <NoisySphere key={`egg-${i}`} args={[0.025]} position={[Math.sin(i * 2.1) * 0.06, 0.06, Math.cos(i * 2.1) * 0.06]} color="#F5F5DC" roughness={0.6} seed={3225 + i} />
        ))}
      </group>

      {/* Vines hanging from ceiling */}
      {[
        [-1, 0.5], [1.5, -1.5], [-2.5, 2], [3, 0],
      ].map(([x, z], i) => (
        <group key={`vine-${i}`} position={[x!, ROOM_H, z!]}>
          {Array.from({ length: 4 + i }).map((_, j) => (
            <NoisyCylinder key={`vs-${j}`} args={[0.018, 0.015, 0.25]} position={[Math.sin(j * 0.5) * 0.05, -j * 0.25, Math.cos(j * 0.3) * 0.03]} color="#2E5D2E" roughness={0.85} seed={3230 + i * 5 + j} />
          ))}
          {/* Small leaves on vines */}
          {Array.from({ length: 2 + i }).map((_, j) => (
            <NoisyBox key={`vleaf-${j}`} size={[0.04, 0.025, 0.03]} position={[Math.sin(j * 1.2) * 0.08, -j * 0.3 - 0.12, Math.cos(j * 1.2) * 0.06]} color="#3CB371" roughness={0.85} seed={3260 + i * 3 + j} bevel={0.005} />
          ))}
        </group>
      ))}

      {/* Lantern */}
      <group position={[0, 2.2, 0]}>
        <NoisyCylinder args={[0.1, 0.1, 0.22]} color="#B8860B" roughness={0.4} metalness={0.3} seed={3280} />
        <EmissiveBox size={[0.08, 0.12, 0.08]} position={[0, 0, 0]} color="#FFAA00" emissiveIntensity={1.5} />
        <pointLight ref={lanternRef} position={[0, 0, 0]} color="#FFAA00" intensity={2} distance={4} decay={2} />
        {/* Chain */}
        <NoisyCylinder args={[0.008, 0.008, 0.3]} position={[0, 0.25, 0]} color="#8B7355" roughness={0.5} metalness={0.4} seed={3281} />
      </group>

      {/* Mushrooms on floor */}
      {[[-2, 0, 1], [1, 0, 3], [-3, 0, -2]].map(([x, , z], i) => (
        <group key={`mushroom-${i}`} position={[x!, 0, z!]}>
          <NoisyCylinder args={[0.02, 0.025, 0.06 + i * 0.02]} position={[0, 0.03, 0]} color="#F5DEB3" roughness={0.8} seed={3290 + i} />
          <NoisySphere args={[0.04 + i * 0.008]} position={[0, 0.06 + i * 0.01, 0]} color={['#FF6347', '#FFD700', '#FF69B4'][i]!} roughness={0.7} seed={3293 + i} />
        </group>
      ))}
    </group>
  );
}

// =================================================================
// Beach (ビーチハウス)
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
      {/* Surfboard leaning on wall */}
      <group position={[ROOM_W / 2 - 0.3, 0.8, -2]} rotation={[0, -0.3, 0.15]}>
        <NoisyCylinder args={[0.12, 0.02, 1.8]} color="#FF6347" roughness={0.35} seed={3300} lightnessSpread={0.1} />
        <NoisyCylinder args={[0.05, 0.01, 1.6]} position={[0.05, 0, 0]} color="#FFD700" roughness={0.35} seed={3301} />
        {/* Fin */}
        <NoisyBox size={[0.04, 0.08, 0.06]} position={[0, -0.7, 0.08]} color="#333" roughness={0.3} metalness={0.4} seed={3302} bevel={0.008} />
      </group>

      {/* Shells scattered on floor */}
      {[
        [-2, 0.02, 1.5], [1, 0.02, 2.5], [-0.5, 0.02, -2], [3, 0.02, 0.5], [-3, 0.02, -1],
      ].map(([x, y, z], i) => (
        <NoisySphere key={`shell-${i}`} args={[0.05 + i * 0.005]} position={[x!, y!, z!]} color={i % 2 === 0 ? '#FFF5EE' : '#FFE4C4'} roughness={0.25} metalness={0.25} seed={3310 + i} />
      ))}

      {/* Starfish */}
      {[
        [2.5, 0.02, 2] as const,
        [-1.5, 0.02, 3] as const,
      ].map(([x, y, z], i) => (
        <group key={`star-${i}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, i * 0.8]}>
          {[0, 1, 2, 3, 4].map(arm => (
            <NoisyBox key={`arm-${arm}`} size={[0.02, 0.09, 0.012]}
              position={[Math.cos(arm * Math.PI * 2 / 5) * 0.06, Math.sin(arm * Math.PI * 2 / 5) * 0.06, 0]}
              rotation={[0, 0, arm * Math.PI * 2 / 5]}
              color="#FF7043" roughness={0.75} seed={3320 + i * 5 + arm} bevel={0.004} />
          ))}
          <NoisySphere args={[0.02]} position={[0, 0, 0.005]} color="#FF5722" roughness={0.7} seed={3335 + i} />
        </group>
      ))}

      {/* Palm tree */}
      <group position={[-3, 0, 2]}>
        <NoisyCylinder args={[0.08, 0.12, 2.2]} position={[0, 1.1, 0]} rotation={[0.05, 0, 0.08]} color="#8B7355" roughness={0.85} seed={3340} lightnessSpread={0.1} />
        {[0, 1, 2, 3, 4].map(i => (
          <NoisyBox key={`frond-${i}`} size={[0.08, 0.6, 0.03]}
            position={[Math.cos(i * Math.PI * 2 / 5) * 0.3, 2.4, Math.sin(i * Math.PI * 2 / 5) * 0.3]}
            rotation={[0.7, i * Math.PI * 2 / 5, 0]}
            color="#228B22" roughness={0.8} seed={3345 + i} bevel={0.006} />
        ))}
      </group>

      {/* Wave edge (animated) */}
      <mesh ref={waveRef} position={[0, 0.01, ROOM_D / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, 1]} />
        <meshStandardMaterial color="#00BCD4" transparent opacity={0.3} emissive="#00E5FF" emissiveIntensity={0.3} />
      </mesh>

      {/* Sun glow */}
      <pointLight position={[2, ROOM_H, ROOM_D / 2]} color="#FFA726" intensity={4} distance={8} decay={2} />
      <pointLight position={[-2, 2, ROOM_D / 2]} color="#FFD54F" intensity={2} distance={6} decay={2} />
    </group>
  );
}

// =================================================================
// Rooftop (屋上) — fence, antenna, distant_buildings, water_tower, string_lights
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
      {/* Fence around edges */}
      {[
        { pos: [0, 0.5, -ROOM_D / 2 + 0.1] as [number,number,number], size: [ROOM_W, 1, 0.06] as [number,number,number] },
        { pos: [-ROOM_W / 2 + 0.1, 0.5, 0] as [number,number,number], size: [0.06, 1, ROOM_D] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.1, 0.5, 0] as [number,number,number], size: [0.06, 1, ROOM_D] as [number,number,number] },
      ].map((f, i) => (
        <NoisyBox key={`fence-${i}`} size={f.size} position={f.pos} color="#808080" roughness={0.6} metalness={0.65} seed={3400 + i} bevel={0.008} transparent opacity={0.5} />
      ))}

      {/* Antenna */}
      <group position={[3, 0, -3]}>
        <NoisyCylinder args={[0.02, 0.02, 3]} position={[0, 1.5, 0]} color="#888" roughness={0.2} metalness={0.9} seed={3410} />
        <NoisyBox size={[0.8, 0.025, 0.025]} position={[0, 2.8, 0]} color="#888" roughness={0.2} metalness={0.9} seed={3411} bevel={0.004} />
        <EmissiveBox size={[0.04, 0.04, 0.04]} position={[0, 3.02, 0]} color="#FF0000" emissiveIntensity={2} />
      </group>

      {/* Distant buildings */}
      {[
        { x: -3, h: 4, w: 1.2 }, { x: -1, h: 5.5, w: 0.8 }, { x: 0.5, h: 3.5, w: 1 },
        { x: 2, h: 6, w: 0.9 }, { x: 3.5, h: 4.5, w: 1.1 },
      ].map((b, i) => (
        <group key={`building-${i}`} position={[b.x, b.h / 2, -ROOM_D / 2 - 1]}>
          <NoisyBox size={[b.w, b.h, 0.3]} color="#2C2C3A" roughness={0.85} seed={3420 + i} bevel={0.015} />
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 0.8) }).map((_, j) => (
            <EmissiveBox key={`win-${j}`} size={[0.1, 0.08, 0.01]}
              position={[(Math.random() - 0.5) * (b.w - 0.3), -b.h / 2 + 0.5 + j * 0.8, 0.16]}
              color="#FFD700" emissiveIntensity={0.2 + Math.random() * 0.3} />
          ))}
        </group>
      ))}

      {/* Water tower */}
      <group position={[-3, 0, 2.5]}>
        {[-0.2, 0.2].map(x =>
          [-0.2, 0.2].map(z => (
            <NoisyCylinder key={`leg-${x}-${z}`} args={[0.03, 0.03, 1.2]} position={[x, 0.6, z]} color="#8B4513" roughness={0.75} seed={3440} />
          ))
        )}
        <NoisyCylinder args={[0.3, 0.25, 0.5]} position={[0, 1.4, 0]} color="#696969" roughness={0.4} metalness={0.75} seed={3445} />
        <NoisyCylinder args={[0.32, 0.32, 0.03]} position={[0, 1.66, 0]} color="#555" roughness={0.3} metalness={0.8} seed={3446} />
      </group>

      {/* String lights (animated emissive) */}
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
// Space (宇宙ステーション)
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
          child.material.emissiveIntensity = i % 3 === 0
            ? 1 + Math.sin(t * 4 + i) * 0.5
            : 0.5 + Math.sin(t * 2 + i * 0.5) * 0.3;
        }
      });
    }
  });

  return (
    <group>
      {/* Space window on back wall */}
      <group position={[0, 2, -ROOM_D / 2 + 0.12]}>
        <NoisyBox size={[2.6, 1.6, 0.08]} color="#1A1A2E" roughness={0.2} metalness={0.85} seed={3500} bevel={0.015} />
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.4, 1.4]} />
          <meshStandardMaterial color="#000020" emissive="#1a1a4e" emissiveIntensity={0.5} />
        </mesh>
        {/* Stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`wstar-${i}`} position={[(Math.random() - 0.5) * 2.3, (Math.random() - 0.5) * 1.3, 0.06]}>
            <sphereGeometry args={[0.01 + Math.random() * 0.01, 6, 4]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
          </mesh>
        ))}
      </group>

      {/* Hologram planet (animated) */}
      <mesh ref={holoRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.4, 24, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={0.4} wireframe />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#22d3ee" intensity={1} distance={3} decay={2} />

      {/* Control panel on left wall */}
      <group position={[-ROOM_W / 2 + 0.15, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <NoisyBox size={[2, 1, 0.1]} color="#1A1A2E" roughness={0.25} metalness={0.85} seed={3510} bevel={0.012} />
        {/* Indicator lights (animated) */}
        <group ref={panelRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`indicator-${i}`} position={[-0.7 + i * 0.2, 0.3, 0.06]}>
              <sphereGeometry args={[0.03, 12, 8]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
                emissive={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
                emissiveIntensity={1}
              />
            </mesh>
          ))}
        </group>
        {/* Screen */}
        <EmissiveBox size={[1.5, 0.6, 0.01]} position={[0, -0.1, 0.06]} color="#22d3ee" emissiveIntensity={0.2} />
        {/* Buttons / knobs */}
        {Array.from({ length: 5 }).map((_, i) => (
          <NoisyCylinder key={`knob-${i}`} args={[0.02, 0.02, 0.02]} position={[-0.5 + i * 0.25, -0.35, 0.06]} color="#555" metalness={0.8} roughness={0.2} seed={3520 + i} />
        ))}
      </group>

      {/* Antenna dish */}
      <group position={[2.5, ROOM_H - 0.1, -2]}>
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[0.4, 0.15, 24, 1, true]} />
          <meshStandardMaterial color="#555" roughness={0.15} metalness={0.92} side={THREE.DoubleSide} />
        </mesh>
        <NoisyCylinder args={[0.02, 0.02, 0.4]} position={[0, -0.2, 0]} color="#666" roughness={0.2} metalness={0.9} seed={3530} />
      </group>
    </group>
  );
}

// =================================================================
// Aquarium (深海アクアリウム)
// =================================================================
function AquariumDecorations() {
  const jellyRef = useRef<THREE.Group>(null);
  const seaweedRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (jellyRef.current) {
      jellyRef.current.children.forEach((child, i) => {
        child.position.y = 1.5 + Math.sin(t * 0.4 + i * 2) * 0.5;
        child.rotation.z = Math.sin(t * 0.3 + i) * 0.15;
      });
    }
    if (seaweedRef.current) {
      seaweedRef.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 0.6 + i * 1.3) * 0.15;
      });
    }
  });

  return (
    <group>
      {/* Coral reef clusters */}
      {[
        { pos: [-3, 0, -3] as const, color: '#FF6B6B' },
        { pos: [2.5, 0, -2.5] as const, color: '#FF69B4' },
        { pos: [-1, 0, 3] as const, color: '#FFA07A' },
        { pos: [3, 0, 1.5] as const, color: '#FF8C69' },
      ].map((c, i) => (
        <group key={`coral-${i}`} position={c.pos}>
          {[0, 1, 2].map(j => (
            <NoisyCylinder key={`cb-${j}`} args={[0.03, 0.1, 0.3 + j * 0.1]}
              position={[Math.sin(j * 2.5) * 0.2, 0.15 + j * 0.1, Math.cos(j * 2.5) * 0.15]}
              color={c.color} roughness={0.75} seed={3600 + i * 3 + j} lightnessSpread={0.12} />
          ))}
          {/* Coral tips */}
          <NoisySphere args={[0.06]} position={[0, 0.4, 0]} color={c.color} roughness={0.6} seed={3620 + i} />
        </group>
      ))}

      {/* Jellyfish (animated position — keep raw mesh for ref) */}
      <group ref={jellyRef}>
        {[
          { x: -1.5, z: -1, color: '#E0FFFF' },
          { x: 1.5, z: 1.5, color: '#DDA0DD' },
          { x: 0, z: -2.5, color: '#B0E0E6' },
        ].map((j, i) => (
          <group key={`jelly-${i}`} position={[j.x, 1.5, j.z]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={j.color} emissive={j.color} emissiveIntensity={1} transparent opacity={0.5} />
            </mesh>
            {[0, 1, 2, 3].map(t => (
              <mesh key={`tent-${t}`} position={[Math.sin(t * 1.6) * 0.08, -0.2 - t * 0.04, Math.cos(t * 1.6) * 0.08]}>
                <cylinderGeometry args={[0.008, 0.003, 0.2, 8]} />
                <meshStandardMaterial color={j.color} transparent opacity={0.4} />
              </mesh>
            ))}
            <pointLight position={[0, 0, 0]} color={j.color} intensity={0.5} distance={2} decay={2} />
          </group>
        ))}
      </group>

      {/* Seaweed (animated rotation — keep raw mesh groups for ref) */}
      <group ref={seaweedRef}>
        {[
          [-2.5, 0, -1.5], [0.5, 0, 2.5], [3, 0, -1], [-1, 0, -3],
        ].map(([x, y, z], i) => (
          <group key={`seaweed-${i}`} position={[x!, y!, z!]}>
            {[0, 1, 2, 3].map(j => (
              <NoisyBox key={`sw-${j}`} size={[0.05, 0.3, 0.025]}
                position={[0, j * 0.3 + 0.15, 0]}
                color={j % 2 === 0 ? '#006400' : '#228B22'}
                roughness={0.85} seed={3650 + i * 4 + j} bevel={0.006} />
            ))}
          </group>
        ))}
      </group>

      {/* Treasure chest */}
      <group position={[2.5, 0, 2.5]} rotation={[0, -0.5, 0]}>
        <NoisyBox size={[0.4, 0.25, 0.25]} position={[0, 0.12, 0]} color="#8B4513" roughness={0.65} seed={3670} bevel={0.015} />
        <NoisyBox size={[0.4, 0.06, 0.25]} position={[0, 0.28, -0.05]} rotation={[0.3, 0, 0]} color="#8B4513" roughness={0.65} seed={3671} bevel={0.01} />
        {/* Metal bands */}
        <NoisyBox size={[0.42, 0.02, 0.27]} position={[0, 0.15, 0]} color="#DAA520" metalness={0.6} roughness={0.3} seed={3672} bevel={0.004} />
        <NoisyBox size={[0.42, 0.02, 0.27]} position={[0, 0.22, 0]} color="#DAA520" metalness={0.6} roughness={0.3} seed={3673} bevel={0.004} />
        <pointLight position={[0, 0.3, 0]} color="#FFD700" intensity={1} distance={1.5} decay={2} />
      </group>

      {/* Portholes on walls */}
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
// Volcano (火山の洞窟)
// =================================================================
function VolcanoDecorations() {
  const lavaRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lavaRef.current) {
      lavaRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 2 + Math.sin(t * 1.5 + i) * 0.8;
        }
      });
    }
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
      {/* Lava streams (animated emissive) */}
      <group ref={lavaRef}>
        {[
          { points: [[-3, 0.01, -2], [0, 0.01, 0], [2, 0.01, 2]] },
          { points: [[-1, 0.01, -3], [1, 0.01, -1], [3, 0.01, 0]] },
        ].map((stream, si) => (
          <group key={`lava-stream-${si}`}>
            {stream.points.map(([x, y, z], pi) => (
              <mesh key={`lp-${pi}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, si * 0.5 + pi * 0.3]}>
                <planeGeometry args={[0.3 + pi * 0.1, 1.5]} />
                <meshStandardMaterial color="#FF4500" emissive="#FF6347" emissiveIntensity={2} transparent opacity={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Obsidian pillars */}
      {[
        [-3, -3.5] as const, [3.5, -2] as const, [-2, 2.5] as const, [2.5, 3] as const,
      ].map(([x, z], i) => (
        <NoisyCylinder key={`obsidian-${i}`} args={[0.15, 0.2, 1.6 + i * 0.4]}
          position={[x, 0.8 + i * 0.2, z]}
          color="#1a0a2e" roughness={0.08} metalness={0.85} seed={3700 + i} />
      ))}

      {/* Magma cracks on floor (animated emissive — keep raw) */}
      {[
        [-2, 0.005, 0], [1, 0.005, -2], [0, 0.005, 3], [-3, 0.005, -1],
      ].map(([x, y, z], i) => (
        <mesh key={`crack-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.1]}>
          <planeGeometry args={[0.06, 1.5 + i * 0.3]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF6347" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Volcanic rocks on floor */}
      {[[-1, 0, 1.5], [2, 0, -0.5], [-2.5, 0, -2]].map(([x, , z], i) => (
        <NoisyBox key={`vrock-${i}`} size={[0.5 + i * 0.1, 0.2 + i * 0.05, 0.4 + i * 0.08]}
          position={[x!, 0.1 + i * 0.025, z!]}
          color="#2d1810" roughness={0.9} seed={3710 + i} bevel={0.02} />
      ))}

      {/* Heat/steam vents (animated position) */}
      <group ref={steamRef}>
        {[
          [1.5, 0, -3] as const,
          [-2.5, 0, 1] as const,
        ].map(([x, y, z], i) => (
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

      {/* Ember glow */}
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
