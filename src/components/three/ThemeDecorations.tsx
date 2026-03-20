/**
 * cocoro — Theme Decorations
 * 8テーマ固有の3D装飾オブジェクト群
 * 各テーマの世界観を劇的に強化するプロシージャル3Dジオメトリ
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomTheme } from '@/types/cocoro';

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
      {/* Crystals */}
      <group ref={crystalRef}>
        {[
          { pos: [-3.5, 0, -3.5] as const, scale: 1.2, rot: 0.3 },
          { pos: [3.2, 0, -3.2] as const, scale: 0.8, rot: -0.5 },
          { pos: [-2, 0, 2.5] as const, scale: 0.6, rot: 0.7 },
          { pos: [2.8, 0, 1.5] as const, scale: 1.0, rot: -0.2 },
        ].map((c, i) => (
          <mesh key={`crystal-${i}`} position={[c.pos[0], c.scale * 0.5, c.pos[2]]} rotation={[0, c.rot, 0.1]}>
            <coneGeometry args={[0.15 * c.scale, c.scale * 1.2, 5]} />
            <meshStandardMaterial
              color="#9b59b6"
              emissive="#7c3aed"
              emissiveIntensity={2}
              transparent
              opacity={0.8}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Pipes along ceiling */}
      {[0.8, -0.8].map((z, i) => (
        <mesh key={`pipe-${i}`} position={[0, ROOM_H - 0.3, z * 3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, ROOM_W - 1, 8]} />
          <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

      {/* Glow moss patches on walls */}
      <mesh ref={mossRef} position={[-ROOM_W / 2 + 0.12, 0.8, -1.5]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial
          color="#2d6a4f"
          emissive="#4ade80"
          emissiveIntensity={0.3}
          roughness={1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Stalactites from ceiling */}
      {[
        [-1.5, -2], [0.5, -1], [2, -3], [-2.5, 0.5], [1.5, 2.5],
      ].map(([x, z], i) => (
        <mesh key={`stalactite-${i}`} position={[x!, ROOM_H - 0.3, z!]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08 + i * 0.02, 0.4 + i * 0.15, 5]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

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
          { pos: [0, 0.75, 0.01] as const, size: [1.3, 0.06, 0.05] as const },
          { pos: [0, -0.75, 0.01] as const, size: [1.3, 0.06, 0.05] as const },
          { pos: [-0.6, 0, 0.01] as const, size: [0.06, 1.5, 0.05] as const },
          { pos: [0.6, 0, 0.01] as const, size: [0.06, 1.5, 0.05] as const },
          { pos: [0, 0, 0.01] as const, size: [0.04, 1.5, 0.05] as const },
        ].map((f, i) => (
          <mesh key={`wf-${i}`} position={f.pos}>
            <boxGeometry args={f.size} />
            <meshStandardMaterial color="#8B6914" roughness={0.6} />
          </mesh>
        ))}
        {/* God rays from window */}
        <spotLight position={[0, 0, 0.5]} target-position={[0.5, -2, 2]} angle={0.6} penumbra={1}
          intensity={2} color="#FFF8DC" distance={6} castShadow />
      </group>

      {/* Bookshelf on left wall */}
      <group position={[-ROOM_W / 2 + 0.25, 0, -1]}>
        {/* Shelves */}
        {[0.3, 1.0, 1.7, 2.4].map((y, i) => (
          <mesh key={`shelf-${i}`} position={[0, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.0, 0.04, 0.25]} />
            <meshStandardMaterial color="#654321" roughness={0.8} />
          </mesh>
        ))}
        {/* Books */}
        {[0.3, 1.0, 1.7].map((y, si) => (
          <group key={`books-${si}`} position={[0, y + 0.15, 0]}>
            {Array.from({ length: 6 }).map((_, bi) => (
              <mesh key={`b-${si}-${bi}`} position={[0, 0, -0.35 + bi * 0.12]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.08, 0.2 + Math.random() * 0.08, 0.15]} />
                <meshStandardMaterial
                  color={['#8B0000', '#00008B', '#006400', '#8B4513', '#4B0082', '#B8860B'][bi]!}
                  roughness={0.9}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Fireplace */}
      <group position={[0, 0, -ROOM_D / 2 + 0.3]}>
        {/* Hearth */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.2, 0.7, 0.5]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        {/* Opening */}
        <mesh position={[0, 0.35, 0.1]}>
          <boxGeometry args={[0.8, 0.5, 0.3]} />
          <meshStandardMaterial color="#1a0a00" emissive="#FF4500" emissiveIntensity={0.3} />
        </mesh>
        {/* Mantle */}
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.55]} />
          <meshStandardMaterial color="#654321" roughness={0.7} />
        </mesh>
        {/* Fire light */}
        <pointLight ref={fireRef} position={[0, 0.3, 0.2]} color="#FF6B35" intensity={3} distance={4} decay={2} />
      </group>

      {/* Hanging plants */}
      {[
        [2, ROOM_H - 0.3, -2] as const,
        [-1.5, ROOM_H - 0.3, 2] as const,
      ].map(([x, y, z], i) => (
        <group key={`plant-${i}`} position={[x, y, z]}>
          {/* Pot */}
          <mesh>
            <cylinderGeometry args={[0.12, 0.08, 0.15, 8]} />
            <meshStandardMaterial color="#CD853F" roughness={0.8} />
          </mesh>
          {/* Vine trails */}
          {[0, 1, 2].map(j => (
            <mesh key={`vine-${j}`} position={[Math.sin(j * 2.1) * 0.1, -0.15 - j * 0.12, Math.cos(j * 2.1) * 0.1]}>
              <sphereGeometry args={[0.06, 6, 4]} />
              <meshStandardMaterial color="#228B22" roughness={0.9} />
            </mesh>
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
        { start: [-ROOM_W / 2, 2.5, -2] as const, rot: [0.2, 0, 0.6] as const, len: 3 },
        { start: [ROOM_W / 2, 1.8, 1] as const, rot: [-0.1, Math.PI, -0.5] as const, len: 2.5 },
        { start: [-ROOM_W / 2, 1, 2] as const, rot: [0, 0, 0.4] as const, len: 2 },
      ].map((b, i) => (
        <mesh key={`branch-${i}`} position={b.start} rotation={b.rot}>
          <cylinderGeometry args={[0.08, 0.15, b.len, 6]} />
          <meshStandardMaterial color="#5C3D1E" roughness={0.95} />
        </mesh>
      ))}

      {/* Leaf clusters */}
      {[
        [-2, 2.8, -2], [1, 3, 0], [-1, ROOM_H - 0.2, 2], [3, 2.5, -1],
        [-3, 2.2, 1.5], [0, ROOM_H, -3], [2, 2.6, 2.5],
      ].map(([x, y, z], i) => (
        <mesh key={`leaf-${i}`} position={[x!, y!, z!]}>
          <sphereGeometry args={[0.2 + Math.random() * 0.15, 6, 5]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#228B22' : '#32CD32'} roughness={0.95} />
        </mesh>
      ))}

      {/* Bird nest */}
      <group position={[2, 2.8, -2.5]}>
        <mesh rotation={[-0.1, 0, 0]}>
          <torusGeometry args={[0.15, 0.05, 6, 12]} />
          <meshStandardMaterial color="#8B7355" roughness={1} />
        </mesh>
        {/* Eggs */}
        {[0, 1, 2].map(i => (
          <mesh key={`egg-${i}`} position={[Math.sin(i * 2.1) * 0.06, 0.04, Math.cos(i * 2.1) * 0.06]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Vines hanging from ceiling */}
      {[
        [-1, 0.5], [1.5, -1.5], [-2.5, 2], [3, 0],
      ].map(([x, z], i) => (
        <group key={`vine-${i}`} position={[x!, ROOM_H, z!]}>
          {Array.from({ length: 4 + i }).map((_, j) => (
            <mesh key={`vs-${j}`} position={[Math.sin(j * 0.5) * 0.05, -j * 0.25, Math.cos(j * 0.3) * 0.03]}>
              <cylinderGeometry args={[0.015, 0.015, 0.25, 4]} />
              <meshStandardMaterial color="#2E5D2E" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Lantern */}
      <group position={[0, 2.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFAA00" emissiveIntensity={1} transparent opacity={0.6} />
        </mesh>
        <pointLight ref={lanternRef} position={[0, 0, 0]} color="#FFAA00" intensity={2} distance={4} decay={2} />
      </group>
    </group>
  );
}

// =================================================================
// Beach (ビーチハウス) — palm_shadow, shell, wave_edge, surfboard, starfish
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
        <mesh>
          <cylinderGeometry args={[0.12, 0.02, 1.8, 8]} />
          <meshStandardMaterial color="#FF6347" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Stripe */}
        <mesh position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.01, 1.6, 8]} />
          <meshStandardMaterial color="#FFD700" roughness={0.4} />
        </mesh>
      </group>

      {/* Shells scattered on floor */}
      {[
        [-2, 0.02, 1.5], [1, 0.02, 2.5], [-0.5, 0.02, -2], [3, 0.02, 0.5], [-3, 0.02, -1],
      ].map(([x, y, z], i) => (
        <group key={`shell-${i}`} position={[x!, y!, z!]} rotation={[0, i * 1.3, 0]}>
          <mesh>
            <torusGeometry args={[0.06, 0.03, 4, 6, Math.PI]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#FFF5EE' : '#FFE4C4'} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Starfish */}
      {[
        [2.5, 0.02, 2] as const,
        [-1.5, 0.02, 3] as const,
      ].map(([x, y, z], i) => (
        <group key={`star-${i}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, i * 0.8]}>
          {[0, 1, 2, 3, 4].map(arm => (
            <mesh key={`arm-${arm}`} position={[Math.cos(arm * Math.PI * 2 / 5) * 0.06, Math.sin(arm * Math.PI * 2 / 5) * 0.06, 0]}>
              <boxGeometry args={[0.02, 0.08, 0.01]} />
              <meshStandardMaterial color="#FF7043" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Wave edge */}
      <mesh ref={waveRef} position={[0, 0.01, ROOM_D / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, 1]} />
        <meshStandardMaterial color="#00BCD4" transparent opacity={0.3} emissive="#00E5FF" emissiveIntensity={0.3} />
      </mesh>

      {/* Sun glow from behind */}
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
        { pos: [0, 0.5, -ROOM_D / 2 + 0.1] as const, size: [ROOM_W, 1, 0.05] as const },
        { pos: [-ROOM_W / 2 + 0.1, 0.5, 0] as const, size: [0.05, 1, ROOM_D] as const },
        { pos: [ROOM_W / 2 - 0.1, 0.5, 0] as const, size: [0.05, 1, ROOM_D] as const },
      ].map((f, i) => (
        <mesh key={`fence-${i}`} position={f.pos}>
          <boxGeometry args={f.size} />
          <meshStandardMaterial color="#808080" roughness={0.7} metalness={0.6} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Antenna */}
      <group position={[3, 0, -3]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 3, 6]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[0.8, 0.02, 0.02]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.9} />
        </mesh>
        <pointLight position={[0, 3, 0]} color="#FF0000" intensity={0.5} distance={2} decay={2} />
      </group>

      {/* Distant buildings (silhouettes beyond back wall) */}
      {[
        { x: -3, h: 4, w: 1.2 }, { x: -1, h: 5.5, w: 0.8 }, { x: 0.5, h: 3.5, w: 1 },
        { x: 2, h: 6, w: 0.9 }, { x: 3.5, h: 4.5, w: 1.1 },
      ].map((b, i) => (
        <mesh key={`building-${i}`} position={[b.x, b.h / 2, -ROOM_D / 2 - 1]} >
          <boxGeometry args={[b.w, b.h, 0.3]} />
          <meshStandardMaterial color="#2C2C3A" roughness={0.9} emissive="#FFD700" emissiveIntensity={0.05} />
        </mesh>
      ))}

      {/* Water tower */}
      <group position={[-3, 0, 2.5]}>
        {/* Legs */}
        {[-0.2, 0.2].map(x =>
          [-0.2, 0.2].map(z => (
            <mesh key={`leg-${x}-${z}`} position={[x, 0.6, z]}>
              <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
          ))
        )}
        {/* Tank */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.3, 0.25, 0.5, 8]} />
          <meshStandardMaterial color="#696969" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>

      {/* String lights */}
      <group ref={lightsRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const t = i / 9;
          const x = -3 + t * 6;
          const sag = Math.sin(t * Math.PI) * 0.3;
          return (
            <mesh key={`slight-${i}`} position={[x, ROOM_H - 0.5 - sag, -1]}>
              <sphereGeometry args={[0.04, 6, 4]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.5} />
            </mesh>
          );
        })}
      </group>
      {/* String light glow */}
      <pointLight position={[0, ROOM_H - 0.6, -1]} color="#FFD700" intensity={1.5} distance={5} decay={2} />
    </group>
  );
}

// =================================================================
// Space (宇宙ステーション) — star_field, space_window, hologram_planet, control_panel, antenna_dish
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
        <mesh>
          <planeGeometry args={[2.5, 1.5]} />
          <meshStandardMaterial color="#000020" emissive="#1a1a4e" emissiveIntensity={0.5} />
        </mesh>
        {/* Stars in window */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`wstar-${i}`} position={[(Math.random() - 0.5) * 2.3, (Math.random() - 0.5) * 1.3, 0.01]}>
            <sphereGeometry args={[0.01 + Math.random() * 0.01, 4, 3]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
          </mesh>
        ))}
        {/* Window frame */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[1.0, 1.1, 32]} />
          <meshStandardMaterial color="#444" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* Hologram planet */}
      <mesh ref={holoRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1}
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#22d3ee" intensity={1} distance={3} decay={2} />

      {/* Control panel on left wall */}
      <group position={[-ROOM_W / 2 + 0.15, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Panel back */}
        <mesh>
          <boxGeometry args={[2, 1, 0.1]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Indicator lights */}
        <group ref={panelRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`indicator-${i}`} position={[-0.7 + i * 0.2, 0.3, 0.06]}>
              <sphereGeometry args={[0.03, 6, 4]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
                emissive={i % 3 === 0 ? '#ff4444' : i % 3 === 1 ? '#44ff44' : '#4444ff'}
                emissiveIntensity={1}
              />
            </mesh>
          ))}
        </group>
        {/* Screen */}
        <mesh position={[0, -0.1, 0.06]}>
          <planeGeometry args={[1.5, 0.6]} />
          <meshStandardMaterial color="#0a2a0a" emissive="#22d3ee" emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* Antenna dish on ceiling */}
      <group position={[2.5, ROOM_H - 0.1, -2]}>
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[0.4, 0.15, 16, 1, true]} />
          <meshStandardMaterial color="#555" roughness={0.2} metalness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#666" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// =================================================================
// Aquarium (深海アクアリウム) — coral_reef, jellyfish, seaweed, treasure_chest, porthole
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
            <mesh key={`cb-${j}`} position={[Math.sin(j * 2.5) * 0.2, 0.15 + j * 0.1, Math.cos(j * 2.5) * 0.15]}>
              <cylinderGeometry args={[0.03, 0.1, 0.3 + j * 0.1, 5]} />
              <meshStandardMaterial color={c.color} roughness={0.8} emissive={c.color} emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Jellyfish */}
      <group ref={jellyRef}>
        {[
          { x: -1.5, z: -1, color: '#E0FFFF' },
          { x: 1.5, z: 1.5, color: '#DDA0DD' },
          { x: 0, z: -2.5, color: '#B0E0E6' },
        ].map((j, i) => (
          <group key={`jelly-${i}`} position={[j.x, 1.5, j.z]}>
            {/* Bell */}
            <mesh>
              <sphereGeometry args={[0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color={j.color}
                emissive={j.color}
                emissiveIntensity={1}
                transparent
                opacity={0.5}
              />
            </mesh>
            {/* Tentacles */}
            {[0, 1, 2, 3].map(t => (
              <mesh key={`tent-${t}`} position={[Math.sin(t * 1.6) * 0.08, -0.2 - t * 0.04, Math.cos(t * 1.6) * 0.08]}>
                <cylinderGeometry args={[0.008, 0.003, 0.2, 4]} />
                <meshStandardMaterial color={j.color} transparent opacity={0.4} />
              </mesh>
            ))}
            <pointLight position={[0, 0, 0]} color={j.color} intensity={0.5} distance={2} decay={2} />
          </group>
        ))}
      </group>

      {/* Seaweed */}
      <group ref={seaweedRef}>
        {[
          [-2.5, 0, -1.5], [0.5, 0, 2.5], [3, 0, -1], [-1, 0, -3],
        ].map(([x, y, z], i) => (
          <group key={`seaweed-${i}`} position={[x!, y!, z!]}>
            {[0, 1, 2, 3].map(j => (
              <mesh key={`sw-${j}`} position={[0, j * 0.3 + 0.15, 0]} rotation={[0, 0, Math.sin(j * 0.5) * 0.1]}>
                <boxGeometry args={[0.04, 0.3, 0.02]} />
                <meshStandardMaterial color={j % 2 === 0 ? '#006400' : '#228B22'} roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Treasure chest */}
      <group position={[2.5, 0, 2.5]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.4, 0.25, 0.25]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.28, -0.05]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.25]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        {/* Gold glow */}
        <pointLight position={[0, 0.3, 0]} color="#FFD700" intensity={1} distance={1.5} decay={2} />
      </group>

      {/* Portholes on walls */}
      {[
        { pos: [-ROOM_W / 2 + 0.12, 1.8, -1.5] as const, rot: [0, Math.PI / 2, 0] as const },
        { pos: [ROOM_W / 2 - 0.12, 1.8, 1] as const, rot: [0, -Math.PI / 2, 0] as const },
      ].map((p, i) => (
        <group key={`port-${i}`} position={p.pos} rotation={p.rot}>
          <mesh>
            <ringGeometry args={[0.25, 0.3, 24]} />
            <meshStandardMaterial color="#8B7355" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[0.25, 24]} />
            <meshStandardMaterial color="#003366" emissive="#00CED1" emissiveIntensity={0.2} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Caustic light effect */}
      <pointLight position={[0, ROOM_H - 0.5, 0]} color="#40E0D0" intensity={1.5} distance={6} decay={2} />
    </group>
  );
}

// =================================================================
// Volcano (火山の洞窟) — lava_stream, ember_vent, obsidian_pillar, magma_crack, heat_vent
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
      {/* Lava streams on floor */}
      <group ref={lavaRef}>
        {[
          { points: [[-3, 0.01, -2], [0, 0.01, 0], [2, 0.01, 2]] },
          { points: [[-1, 0.01, -3], [1, 0.01, -1], [3, 0.01, 0]] },
        ].map((stream, si) => (
          <group key={`lava-stream-${si}`}>
            {stream.points.map(([x, y, z], pi) => (
              <mesh key={`lp-${pi}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, si * 0.5 + pi * 0.3]}>
                <planeGeometry args={[0.3 + pi * 0.1, 1.5]} />
                <meshStandardMaterial
                  color="#FF4500"
                  emissive="#FF6347"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Obsidian pillars */}
      {[
        [-3, -3.5] as const, [3.5, -2] as const, [-2, 2.5] as const, [2.5, 3] as const,
      ].map(([x, z], i) => (
        <mesh key={`obsidian-${i}`} position={[x, 0.8 + i * 0.2, z]}>
          <cylinderGeometry args={[0.15, 0.2, 1.6 + i * 0.4, 6]} />
          <meshStandardMaterial
            color="#1a0a2e"
            roughness={0.1}
            metalness={0.8}
            emissive="#FF4500"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}

      {/* Magma cracks on floor */}
      {[
        [-2, 0.005, 0], [1, 0.005, -2], [0, 0.005, 3], [-3, 0.005, -1],
      ].map(([x, y, z], i) => (
        <mesh key={`crack-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.1]}>
          <planeGeometry args={[0.06, 1.5 + i * 0.3]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF6347" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Heat/steam vents */}
      <group ref={steamRef}>
        {[
          [1.5, 0, -3] as const,
          [-2.5, 0, 1] as const,
        ].map(([x, y, z], i) => (
          <group key={`vent-${i}`} position={[x, y, z]}>
            {/* Vent hole */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.15, 8]} />
              <meshStandardMaterial color="#2d1810" emissive="#FF4500" emissiveIntensity={0.5} />
            </mesh>
            {/* Steam puffs */}
            {[0, 1, 2].map(j => (
              <mesh key={`steam-${j}`} position={[Math.sin(j) * 0.05, 0.1 + j * 0.3, Math.cos(j) * 0.05]}>
                <sphereGeometry args={[0.05 + j * 0.02, 6, 4]} />
                <meshStandardMaterial color="#aaa" transparent opacity={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Ember glow lights */}
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
  const DecoComponent = DECORATION_MAP[theme];
  return <DecoComponent />;
}
