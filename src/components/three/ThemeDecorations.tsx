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
// Underground (地下室) — HIGH-POLY VOXEL
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
      {/* === Crystal formations (multi-block clusters) === */}
      <group ref={crystalRef}>
        {[
          { pos: [-3.5, 0, -3.5], scale: 1.2, rot: 0.3 },
          { pos: [3.2, 0, -3.2], scale: 0.8, rot: -0.5 },
          { pos: [-2, 0, 2.5], scale: 0.6, rot: 0.7 },
          { pos: [2.8, 0, 1.5], scale: 1.0, rot: -0.2 },
          { pos: [-1, 0, -1.5], scale: 0.7, rot: 0.4 },
          { pos: [1.5, 0, 3], scale: 0.5, rot: -0.6 },
        ].map((c, i) => (
          <group key={`crystal-group-${i}`} position={[c.pos[0], 0, c.pos[2]]} rotation={[0, c.rot, 0]}>
            {/* Main crystal — 3 stacked blocks tapering upward */}
            <NoisyBox size={[0.12 * c.scale, 0.3 * c.scale, 0.12 * c.scale]}
              position={[0, 0.15 * c.scale, 0]} rotation={[0, 0, 0.05]}
              color="#9b59b6" roughness={0.08} metalness={0.55} seed={3000 + i * 3}
              bevel={0.01} lightnessSpread={0.15} />
            <NoisyBox size={[0.08 * c.scale, 0.25 * c.scale, 0.08 * c.scale]}
              position={[0, 0.42 * c.scale, 0]} rotation={[0, 0.3, 0.08]}
              color="#7c3aed" roughness={0.06} metalness={0.6} seed={3001 + i * 3}
              bevel={0.008} lightnessSpread={0.12} />
            <NoisyBox size={[0.05 * c.scale, 0.18 * c.scale, 0.05 * c.scale]}
              position={[0, 0.65 * c.scale, 0]} rotation={[0, 0.1, 0.1]}
              color="#a855f7" roughness={0.05} metalness={0.65} seed={3002 + i * 3}
              bevel={0.006} />
            {/* Side crystals */}
            <NoisyBox size={[0.06 * c.scale, 0.2 * c.scale, 0.06 * c.scale]}
              position={[0.1 * c.scale, 0.1 * c.scale, 0.05 * c.scale]} rotation={[0.2, 0.5, 0.15]}
              color="#c084fc" roughness={0.07} metalness={0.5} seed={3050 + i}
              bevel={0.005} />
            <NoisyBox size={[0.04 * c.scale, 0.15 * c.scale, 0.04 * c.scale]}
              position={[-0.08 * c.scale, 0.08 * c.scale, -0.06 * c.scale]} rotation={[-0.1, -0.3, -0.2]}
              color="#d8b4fe" roughness={0.06} metalness={0.55} seed={3060 + i}
              bevel={0.004} />
          </group>
        ))}
      </group>

      {/* === Pipes along ceiling with valves === */}
      {[0.8, -0.8].map((z, i) => (
        <group key={`pipe-${i}`}>
          <NoisyCylinder args={[0.07, 0.07, ROOM_W - 1]} position={[0, ROOM_H - 0.3, z * 3]}
            rotation={[0, 0, Math.PI / 2]} color="#555" roughness={0.2} metalness={0.9} seed={3070 + i} />
          {/* Pipe joints */}
          {[-2, 0, 2].map((x, j) => (
            <group key={`joint-${i}-${j}`}>
              <NoisyCylinder args={[0.1, 0.1, 0.08]} position={[x, ROOM_H - 0.3, z * 3]}
                rotation={[0, 0, Math.PI / 2]} color="#666" metalness={0.85} roughness={0.25} seed={3080 + i * 3 + j} />
              {/* Valve wheel */}
              {j === 1 && (
                <NoisyBox size={[0.06, 0.06, 0.02]} position={[x, ROOM_H - 0.15, z * 3]}
                  color="#FF4444" roughness={0.3} metalness={0.7} seed={3090 + i} bevel={0.005} />
              )}
            </group>
          ))}
        </group>
      ))}

      {/* === Glow moss clusters (enhanced) === */}
      {[
        [-ROOM_W / 2 + 0.12, 0.8, -1.5], [-ROOM_W / 2 + 0.14, 1.5, 1.0],
        [ROOM_W / 2 - 0.14, 0.6, -2.0], [-ROOM_W / 2 + 0.12, 2.0, 0],
        [ROOM_W / 2 - 0.14, 1.2, 1.5],
      ].map(([x, y, z], i) => (
        <group key={`moss-cluster-${i}`} position={[x!, y!, z!]}>
          <mesh ref={i === 0 ? mossRef : undefined}>
            <sphereGeometry args={[0.15 + i * 0.02, 16, 12]} />
            <meshStandardMaterial color="#2d6a4f" emissive="#4ade80" emissiveIntensity={0.3}
              roughness={1} transparent opacity={0.7} />
          </mesh>
          {/* Surrounding smaller moss spots */}
          {[0, 1, 2].map(j => {
            const a = j * Math.PI * 2 / 3;
            return (
              <NoisySphere key={`ms-${j}`} args={[0.06 + j * 0.01]}
                position={[Math.cos(a) * 0.12, Math.sin(a) * 0.06, Math.sin(a) * 0.08]}
                color={j % 2 === 0 ? '#3a7d5e' : '#2d8659'} roughness={0.95} seed={3100 + i * 3 + j} />
            );
          })}
        </group>
      ))}

      {/* === Stalactites (more, varying sizes) === */}
      {[
        [-1.5, -2, 0.5], [0.5, -1, 0.4], [2, -3, 0.6], [-2.5, 0.5, 0.35],
        [1.5, 2.5, 0.45], [-0.5, -2.5, 0.3], [3, 1, 0.5], [-3, -1.5, 0.55],
      ].map(([x, z, h], i) => (
        <group key={`stalactite-${i}`} position={[x!, ROOM_H - 0.1, z!]}>
          <NoisyBox size={[0.06 + i * 0.005, (h as number), 0.06 + i * 0.005]}
            position={[0, -(h as number) / 2, 0]}
            color="#4a3728" roughness={0.85} seed={3120 + i} bevel={0.008} lightnessSpread={0.12} />
          <NoisyBox size={[0.04, (h as number) * 0.6, 0.04]}
            position={[0, -(h as number) * 0.8, 0]}
            color="#3d2b1f" roughness={0.88} seed={3130 + i} bevel={0.005} />
        </group>
      ))}

      {/* === Rock formations on floor (more variety) === */}
      {[
        [-1, 0, 3, 0.5, 0.3], [2, 0, -1, 0.4, 0.35], [-2.5, 0, -0.5, 0.35, 0.2],
        [1, 0, 1, 0.3, 0.25], [3, 0, 2.5, 0.45, 0.28],
      ].map(([x, , z, w, h], i) => (
        <group key={`rock-${i}`} position={[x as number, 0, z as number]}>
          <NoisyBox size={[(w as number), (h as number), (w as number) * 0.8]}
            position={[0, (h as number) / 2, 0]}
            color={i % 2 === 0 ? '#3d2b1f' : '#4a3728'} roughness={0.95} seed={3140 + i}
            bevel={0.015} lightnessSpread={0.15} />
          {/* Small rock fragments nearby */}
          <NoisyBox size={[(w as number) * 0.3, (h as number) * 0.5, (w as number) * 0.3]}
            position={[(w as number) * 0.5, (h as number) * 0.25, 0]}
            color="#5C4033" roughness={0.9} seed={3145 + i} bevel={0.01} />
        </group>
      ))}

      {/* === Crystal point lights === */}
      <pointLight position={[-3.5, 0.8, -3.5]} color="#7c3aed" intensity={1.5} distance={3} decay={2} />
      <pointLight position={[3.2, 0.6, -3.2]} color="#a855f7" intensity={1} distance={2.5} decay={2} />
      <pointLight position={[-1, 0.5, -1.5]} color="#c084fc" intensity={0.8} distance={2} decay={2} />
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
// Treehouse (ツリーハウス) — HIGH-POLY VOXEL
// =================================================================
function TreehouseDecorations() {
  const lanternRef = useRef<THREE.PointLight>(null);
  const vineSwayRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lanternRef.current) {
      lanternRef.current.intensity = 2 + Math.sin(t * 3) * 0.3;
    }
    if (vineSwayRef.current) {
      vineSwayRef.current.rotation.z = Math.sin(t * 0.4) * 0.03;
    }
  });

  return (
    <group>
      {/* === Thick branches (multi-segment blocky) === */}
      {[
        { start: [-ROOM_W / 2, 2.5, -2] as [number,number,number], rot: [0.2, 0, 0.6] as [number,number,number], segs: 6, w: 0.14 },
        { start: [ROOM_W / 2, 1.8, 1] as [number,number,number], rot: [-0.1, Math.PI, -0.5] as [number,number,number], segs: 5, w: 0.12 },
        { start: [-ROOM_W / 2, 1, 2] as [number,number,number], rot: [0, 0, 0.4] as [number,number,number], segs: 4, w: 0.1 },
        { start: [0, ROOM_H, -3] as [number,number,number], rot: [0.3, 0.5, 0] as [number,number,number], segs: 3, w: 0.08 },
      ].map((b, bi) => (
        <group key={`branch-${bi}`} position={b.start} rotation={b.rot}>
          {Array.from({ length: b.segs }).map((_, si) => {
            const t = si / b.segs;
            const w = b.w * (1 - t * 0.3);
            return (
              <group key={`bs-${si}`}>
                <NoisyBox size={[w, 0.35, w]} position={[si * 0.06, si * 0.35, si * 0.03]}
                  rotation={[0, si * 0.15, 0]}
                  color={si % 2 === 0 ? '#5C3D1E' : '#6B4E32'} roughness={0.9} seed={3200 + bi * 10 + si}
                  bevel={0.012} lightnessSpread={0.15} />
                {/* Bark texture */}
                {si > 0 && (
                  <NoisyBox size={[w + 0.02, 0.015, w + 0.02]}
                    position={[si * 0.06, si * 0.35 - 0.16, si * 0.03]}
                    color="#4A3320" roughness={0.95} seed={3250 + bi * 10 + si} bevel={0.005} />
                )}
              </group>
            );
          })}
          {/* Sub-branches at tips */}
          <NoisyBox size={[b.w * 0.5, 0.2, b.w * 0.5]}
            position={[b.segs * 0.06 + 0.1, b.segs * 0.35 + 0.1, b.segs * 0.03 + 0.05]}
            rotation={[0.3, 0.5, 0.2]}
            color="#7A5C3A" roughness={0.88} seed={3260 + bi} bevel={0.008} />
        </group>
      ))}

      {/* === Dense leaf clusters (many small blocks) === */}
      {[
        [-2, 2.8, -2, 0.25], [1, 3, 0, 0.3], [-1, ROOM_H - 0.2, 2, 0.22],
        [3, 2.5, -1, 0.2], [-3, 2.2, 1.5, 0.28], [0, ROOM_H, -3, 0.18],
        [2, 2.6, 2.5, 0.2], [-1.5, 2.5, -3, 0.15], [3.5, 2.8, 0.5, 0.22],
        [-2.5, ROOM_H - 0.1, 0, 0.2], [0.5, 2.4, 3, 0.18], [1.5, ROOM_H, -2, 0.16],
      ].map(([x, y, z, size], i) => (
        <group key={`leaf-cluster-${i}`} position={[x!, y!, z!]}>
          {/* Core sphere */}
          <NoisyBox size={[size!, size! * 0.8, size!]} position={[0, 0, 0]}
            color={['#228B22', '#2E8B57', '#32CD32', '#1B5E20', '#4CAF50', '#388E3C'][i % 6]!}
            roughness={0.88} seed={3210 + i} bevel={0.02} lightnessSpread={0.2} />
          {/* Surrounding smaller blocks */}
          {[0, 1, 2, 3].map(j => {
            const a = j * Math.PI / 2;
            return (
              <NoisyBox key={`lsub-${j}`}
                size={[size! * 0.5, size! * 0.4, size! * 0.5]}
                position={[Math.cos(a) * size! * 0.5, (j % 2 === 0 ? 0.03 : -0.03), Math.sin(a) * size! * 0.5]}
                color={j % 2 === 0 ? '#2E7D32' : '#43A047'}
                roughness={0.85} seed={3210 + i * 4 + j + 50} bevel={0.015} lightnessSpread={0.18} />
            );
          })}
        </group>
      ))}

      {/* === Bird nest (detailed) === */}
      <group position={[2, 2.8, -2.5]}>
        {/* Nest bowl - stacked rings */}
        <NoisyCylinder args={[0.2, 0.14, 0.06]} color="#8B7355" roughness={0.95} seed={3220} />
        <NoisyCylinder args={[0.22, 0.16, 0.03]} position={[0, 0.04, 0]} color="#7A6544" roughness={0.95} seed={3221} />
        {/* Twigs sticking out */}
        {[0, 1, 2, 3, 4].map(i => {
          const a = i * Math.PI * 2 / 5;
          return (
            <NoisyBox key={`twig-${i}`} size={[0.01, 0.01, 0.1]}
              position={[Math.cos(a) * 0.15, 0.03, Math.sin(a) * 0.15]}
              rotation={[0.3, a, Math.random() * 0.3]}
              color="#6B5B43" roughness={0.9} seed={3222 + i} bevel={0.002} />
          );
        })}
        {/* Eggs */}
        {[0, 1, 2].map(i => (
          <NoisySphere key={`egg-${i}`} args={[0.03]} position={[Math.sin(i * 2.1) * 0.06, 0.06, Math.cos(i * 2.1) * 0.06]}
            color="#F5F5DC" roughness={0.5} seed={3225 + i} />
        ))}
      </group>

      {/* === Vines (thick, with leaves) === */}
      <group ref={vineSwayRef}>
        {[
          [-1, 0.5], [1.5, -1.5], [-2.5, 2], [3, 0], [-0.5, -2.5], [2, 2],
        ].map(([x, z], i) => (
          <group key={`vine-${i}`} position={[x!, ROOM_H, z!]}>
            {Array.from({ length: 5 + i % 2 }).map((_, j) => (
              <group key={`vseg-${j}`}>
                {/* Vine stem segment */}
                <NoisyBox size={[0.025, 0.22, 0.025]}
                  position={[Math.sin(j * 0.6) * 0.04, -j * 0.22 - 0.11, Math.cos(j * 0.4) * 0.03]}
                  color="#2E5D2E" roughness={0.85} seed={3230 + i * 7 + j} bevel={0.004} />
                {/* Leaves on vine */}
                {j % 2 === 0 && (
                  <NoisyBox size={[0.06, 0.04, 0.02]}
                    position={[Math.sin(j * 0.6) * 0.04 + 0.04, -j * 0.22 - 0.11, Math.cos(j * 0.4) * 0.03]}
                    rotation={[0, j * 0.8, 0.3]}
                    color={j % 4 === 0 ? '#3CB371' : '#2E8B57'}
                    roughness={0.82} seed={3280 + i * 5 + j} bevel={0.005} lightnessSpread={0.15} />
                )}
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* === Lantern (enhanced) === */}
      <group position={[0, 2.2, 0]}>
        {/* Chain links */}
        {[0, 1, 2].map(i => (
          <NoisyBox key={`chain-${i}`} size={[0.02, 0.06, 0.02]}
            position={[0, 0.2 + i * 0.08, 0]}
            color="#8B7355" roughness={0.5} metalness={0.4} seed={3281 + i} bevel={0.003} />
        ))}
        {/* Lantern body */}
        <NoisyBox size={[0.12, 0.16, 0.12]} position={[0, 0, 0]}
          color="#B8860B" roughness={0.4} metalness={0.3} seed={3280} bevel={0.012} />
        <EmissiveBox size={[0.08, 0.1, 0.08]} position={[0, 0, 0]} color="#FFAA00" emissiveIntensity={1.5} />
        {/* Cap */}
        <NoisyBox size={[0.14, 0.03, 0.14]} position={[0, 0.09, 0]}
          color="#DAA520" roughness={0.4} metalness={0.4} seed={3285} bevel={0.006} />
        <pointLight ref={lanternRef} position={[0, 0, 0]} color="#FFAA00" intensity={2} distance={4} decay={2} />
      </group>

      {/* === Mushrooms (detailed, various sizes) === */}
      {[
        [-2, 0, 1, '#FF6347', 0.04, 0.07], [1, 0, 3, '#FFD700', 0.05, 0.09],
        [-3, 0, -2, '#FF69B4', 0.035, 0.06], [0.5, 0, -1.5, '#E0E0E0', 0.03, 0.05],
        [-1, 0, 2.5, '#FF8A65', 0.045, 0.08], [3, 0, -0.5, '#CE93D8', 0.038, 0.07],
      ].map(([x, , z, capColor, stemR, capR], i) => (
        <group key={`mushroom-${i}`} position={[x as number, 0, z as number]}>
          {/* Stem */}
          <NoisyBox size={[(stemR as number) * 2, 0.08 + i * 0.01, (stemR as number) * 2]}
            position={[0, 0.04 + i * 0.005, 0]}
            color="#F5DEB3" roughness={0.75} seed={3290 + i} bevel={0.006} />
          {/* Cap */}
          <NoisyBox size={[(capR as number) * 2, 0.04, (capR as number) * 2]}
            position={[0, 0.09 + i * 0.01, 0]}
            color={capColor as string} roughness={0.65} seed={3296 + i} bevel={0.01} lightnessSpread={0.15} />
          {/* Cap top detail */}
          <NoisyBox size={[(capR as number) * 1.2, 0.02, (capR as number) * 1.2]}
            position={[0, 0.12 + i * 0.01, 0]}
            color={capColor as string} roughness={0.6} seed={3302 + i} bevel={0.008} lightnessSpread={0.2} />
          {/* Spots on cap */}
          {i % 2 === 0 && (
            <NoisySphere args={[0.01]} position={[0.02, 0.12 + i * 0.01, 0.01]}
              color="#FFFFFF" roughness={0.5} seed={3308 + i} />
          )}
        </group>
      ))}

      {/* === Moss patches on floor === */}
      {[[-1.5, 0.005, 0.5], [2, 0.005, -1], [-2, 0.005, -2.5], [0, 0.005, 2]].map(([mx, my, mz], mi) => (
        <NoisyBox key={`moss-${mi}`} size={[0.3 + mi * 0.05, 0.015, 0.25 + mi * 0.04]}
          position={[mx!, my!, mz!]}
          color={mi % 2 === 0 ? '#2E7D32' : '#1B5E20'} roughness={0.95} seed={3310 + mi}
          bevel={0.01} lightnessSpread={0.2} />
      ))}

      {/* === Extra lighting === */}
      <pointLight position={[-2, 1.5, 1]} color="#90EE90" intensity={0.5} distance={3} decay={2} />
      <pointLight position={[2, 2, -1.5]} color="#ADFF2F" intensity={0.4} distance={3} decay={2} />
    </group>
  );
}

// =================================================================
// Beach (ビーチハウス) — HIGH-POLY VOXEL
// =================================================================

/** Voxel-style palm tree with blocky segmented trunk and dense leaf clusters */
function VoxelPalmTree({ position, lean = 0.08, seed = 3340, scale = 1 }: {
  position: [number, number, number]; lean?: number; seed?: number; scale?: number;
}) {
  // Trunk: 10 stacked cubes with slight rotation offsets for organic feel
  const trunkSegs = 10;
  const segH = 0.22 * scale;
  const baseW = 0.18 * scale;
  const topW = 0.12 * scale;

  // Bark ring textures at trunk joints
  const barkColors = ['#8B6B4A', '#7A5C3A', '#8B7355', '#6B4E32', '#7A5C3A',
                      '#8B6B4A', '#7A5C3A', '#6B4E32', '#8B7355', '#7A5C3A'];

  // Leaf fronds: 7 fronds, each made of 5 graduated blocks
  const frondCount = 7;
  const frondSeeds = Array.from({ length: frondCount }, (_, i) => seed + 100 + i);

  return (
    <group position={position}>
      {/* Trunk segments — stacked blocks with offsets */}
      {Array.from({ length: trunkSegs }).map((_, i) => {
        const t = i / (trunkSegs - 1);
        const w = baseW + (topW - baseW) * t;
        const y = i * segH + segH / 2;
        const xOff = Math.sin(i * 0.6) * 0.02 * scale + lean * i * 0.12;
        const zOff = Math.cos(i * 0.8) * 0.015 * scale;
        return (
          <group key={`trunk-${i}`}>
            <NoisyBox size={[w, segH * 0.95, w]} position={[xOff, y, zOff]}
              rotation={[0, i * 0.2, 0]}
              color={barkColors[i]!} roughness={0.88} seed={seed + i}
              bevel={0.01 * scale} lightnessSpread={0.15} />
            {/* Bark ring at joint */}
            {i > 0 && i < trunkSegs - 1 && (
              <NoisyBox size={[w + 0.03 * scale, 0.02 * scale, w + 0.03 * scale]}
                position={[xOff, i * segH, zOff]}
                color="#5C3D1E" roughness={0.9} seed={seed + 50 + i}
                bevel={0.005 * scale} />
            )}
          </group>
        );
      })}

      {/* Leaf crown — dense fronds */}
      <group position={[lean * trunkSegs * 0.12, trunkSegs * segH, 0]}>
        {/* Center top cluster */}
        <NoisyBox size={[0.15 * scale, 0.12 * scale, 0.15 * scale]} position={[0, 0.05 * scale, 0]}
          color="#2D8B2D" roughness={0.85} seed={seed + 200} bevel={0.02 * scale} lightnessSpread={0.2} />

        {/* Fronds radiating outward */}
        {Array.from({ length: frondCount }).map((_, fi) => {
          const angle = (fi / frondCount) * Math.PI * 2;
          const droop = 0.4 + fi * 0.05;
          return (
            <group key={`frond-${fi}`} rotation={[droop, angle, 0]}>
              {/* Each frond = 5 blocks getting smaller, going outward */}
              {[0, 1, 2, 3, 4].map(seg => {
                const segScale = 1 - seg * 0.15;
                const w = 0.1 * scale * segScale;
                const h = 0.04 * scale;
                const d = 0.2 * scale * segScale;
                const y = seg * 0.18 * scale;
                return (
                  <NoisyBox key={`fs-${seg}`}
                    size={[w, h, d]}
                    position={[0, y, 0]}
                    rotation={[seg * 0.12, 0, 0]}
                    color={seg % 2 === 0 ? '#228B22' : '#32CD32'}
                    roughness={0.82} seed={frondSeeds[fi]! + seg}
                    bevel={0.006 * scale} lightnessSpread={0.18} />
                );
              })}
              {/* Leaf tip */}
              <NoisyBox size={[0.04 * scale, 0.025 * scale, 0.08 * scale]}
                position={[0, 0.9 * scale, 0]} rotation={[0.3, 0, 0]}
                color="#3CB371" roughness={0.8} seed={frondSeeds[fi]! + 10}
                bevel={0.004 * scale} />
            </group>
          );
        })}

        {/* Coconuts */}
        {[[-0.06, -0.02, 0.06], [0.05, -0.03, -0.04], [0.0, -0.01, 0.08]].map(([cx, cy, cz], ci) => (
          <NoisySphere key={`coconut-${ci}`} args={[0.04 * scale]}
            position={[cx! * scale, cy! * scale, cz! * scale]}
            color="#5C3D1E" roughness={0.7} seed={seed + 300 + ci} />
        ))}
      </group>
    </group>
  );
}

/** Voxel tropical flower cluster */
function VoxelTropicalFlower({ position, color, seed }: {
  position: [number, number, number]; color: string; seed: number;
}) {
  return (
    <group position={position}>
      <NoisyCylinder args={[0.015, 0.02, 0.12]} position={[0, 0.06, 0]} color="#228B22" roughness={0.85} seed={seed} />
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <NoisyBox key={`petal-${i}`} size={[0.04, 0.015, 0.03]}
            position={[Math.cos(a) * 0.03, 0.13, Math.sin(a) * 0.03]}
            rotation={[0.3, a, 0]}
            color={color} roughness={0.7} seed={seed + i + 1} bevel={0.004} />
        );
      })}
      <NoisySphere args={[0.015]} position={[0, 0.14, 0]} color="#FFD700" roughness={0.6} seed={seed + 10} />
    </group>
  );
}

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
      {/* === TWO VOXEL PALM TREES === */}
      <VoxelPalmTree position={[-3, 0, 2]} lean={0.06} seed={3340} scale={1} />
      <VoxelPalmTree position={[2.5, 0, -2.5]} lean={-0.04} seed={3370} scale={0.85} />

      {/* === Surfboard (detailed) leaning on wall === */}
      <group position={[ROOM_W / 2 - 0.25, 0, -2]} rotation={[0, -0.3, 0.12]}>
        {/* Board body — stacked layers for thickness */}
        <NoisyBox size={[0.2, 1.6, 0.04]} position={[0, 0.85, 0]} color="#FF6347" roughness={0.3} seed={3300} bevel={0.015} lightnessSpread={0.12} />
        <NoisyBox size={[0.16, 1.4, 0.02]} position={[0.01, 0.85, 0.02]} color="#FFD700" roughness={0.3} seed={3301} bevel={0.01} />
        {/* Stripe */}
        <NoisyBox size={[0.18, 0.06, 0.005]} position={[0, 1.0, 0.025]} color="#00BCD4" roughness={0.35} seed={3303} bevel={0.004} />
        <NoisyBox size={[0.18, 0.06, 0.005]} position={[0, 0.7, 0.025]} color="#00BCD4" roughness={0.35} seed={3304} bevel={0.004} />
        {/* Fins */}
        <NoisyBox size={[0.03, 0.07, 0.06]} position={[0, 0.12, -0.03]} color="#333" roughness={0.3} metalness={0.4} seed={3302} bevel={0.006} />
        <NoisyBox size={[0.025, 0.05, 0.04]} position={[0.04, 0.15, -0.02]} color="#444" roughness={0.3} metalness={0.3} seed={3305} bevel={0.005} />
      </group>

      {/* === Shells (more variety) === */}
      {[
        [-2, 0.015, 1.5], [1, 0.015, 2.5], [-0.5, 0.015, -2],
        [3, 0.015, 0.5], [-3, 0.015, -1], [0.5, 0.015, 3],
        [-1.5, 0.015, -0.5], [2, 0.015, 1],
      ].map(([x, y, z], i) => (
        <group key={`shell-${i}`} position={[x!, y!, z!]} rotation={[-Math.PI / 2, 0, i * 1.1]}>
          <NoisyBox size={[0.04 + i * 0.003, 0.03 + i * 0.002, 0.015]}
            color={['#FFF5EE', '#FFE4C4', '#FFDAB9', '#FFE0B2', '#FFF8E1', '#FFCCBC', '#F5F5DC', '#FFE4E1'][i]!}
            roughness={0.25} metalness={0.2} seed={3310 + i} bevel={0.003} />
        </group>
      ))}

      {/* === Starfish (enhanced detail) === */}
      {[
        [2.5, 0.02, 2] as const,
        [-1.5, 0.02, 3] as const,
        [0.5, 0.02, -3] as const,
      ].map(([x, y, z], i) => (
        <group key={`star-${i}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, i * 0.8]}>
          {[0, 1, 2, 3, 4].map(arm => {
            const a = arm * Math.PI * 2 / 5;
            return (
              <group key={`arm-${arm}`}>
                <NoisyBox size={[0.025, 0.08, 0.015]}
                  position={[Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0]}
                  rotation={[0, 0, a]}
                  color={['#FF7043', '#FF5722', '#E64A19'][i]!} roughness={0.7} seed={3320 + i * 5 + arm} bevel={0.004} />
                <NoisyBox size={[0.015, 0.04, 0.012]}
                  position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]}
                  rotation={[0, 0, a]}
                  color={['#FF8A65', '#FF7043', '#FF5722'][i]!} roughness={0.7} seed={3330 + i * 5 + arm} bevel={0.003} />
              </group>
            );
          })}
          <NoisySphere args={[0.025]} position={[0, 0, 0.005]} color="#FF5722" roughness={0.65} seed={3335 + i} />
        </group>
      ))}

      {/* === Tropical flowers === */}
      <VoxelTropicalFlower position={[-2, 0, 1]} color="#FF69B4" seed={3350} />
      <VoxelTropicalFlower position={[1.5, 0, 3]} color="#FF4081" seed={3355} />
      <VoxelTropicalFlower position={[-1, 0, -1.5]} color="#FFD740" seed={3360} />

      {/* === Grass tufts around palm bases === */}
      {[[-3.2, 0, 2.2], [-2.8, 0, 1.8], [-3, 0, 2.4], [2.3, 0, -2.3], [2.7, 0, -2.7]].map(([gx, , gz], gi) => (
        <NoisyBox key={`grass-${gi}`} size={[0.06, 0.08, 0.03]}
          position={[gx!, 0.04, gz!]} rotation={[0, gi * 1.3, 0]}
          color={gi % 2 === 0 ? '#2E7D32' : '#4CAF50'} roughness={0.9} seed={3360 + gi} bevel={0.005} />
      ))}

      {/* === Sand ripple mounds === */}
      {[[-1, 0.03, 0], [2, 0.025, 1.5], [-2, 0.02, -2]].map(([sx, sy, sz], si) => (
        <NoisyBox key={`mound-${si}`} size={[0.6 + si * 0.1, 0.04, 0.4 + si * 0.05]}
          position={[sx!, sy!, sz!]}
          color="#F5DEB3" roughness={1} seed={3380 + si} bevel={0.015} lightnessSpread={0.1} />
      ))}

      {/* === Driftwood === */}
      <group position={[1, 0.04, 1.5]} rotation={[0, 0.5, 0.08]}>
        <NoisyBox size={[0.06, 0.04, 0.5]} position={[0, 0, 0]} color="#9E9E9E" roughness={0.9} seed={3385} bevel={0.008} lightnessSpread={0.15} />
        <NoisyBox size={[0.04, 0.03, 0.15]} position={[0.03, 0.02, 0.2]} rotation={[0, 0.4, 0.2]} color="#BDBDBD" roughness={0.9} seed={3386} bevel={0.006} />
      </group>

      {/* === Wave edge (animated) === */}
      <mesh ref={waveRef} position={[0, 0.01, ROOM_D / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, 1]} />
        <meshStandardMaterial color="#00BCD4" transparent opacity={0.3} emissive="#00E5FF" emissiveIntensity={0.3} />
      </mesh>
      {/* Foam line */}
      <mesh position={[0, 0.015, ROOM_D / 2 - 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W - 0.5, 0.15]} />
        <meshStandardMaterial color="#E0F7FA" transparent opacity={0.5} emissive="#E0F7FA" emissiveIntensity={0.2} />
      </mesh>

      {/* === Lighting === */}
      <pointLight position={[2, ROOM_H, ROOM_D / 2]} color="#FFA726" intensity={4} distance={8} decay={2} />
      <pointLight position={[-2, 2, ROOM_D / 2]} color="#FFD54F" intensity={2} distance={6} decay={2} />
      <pointLight position={[-3, 2.5, 2]} color="#FFEE58" intensity={1} distance={4} decay={2} />
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
