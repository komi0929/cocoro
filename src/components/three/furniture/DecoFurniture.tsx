/**
 * cocoro  EチE��系家具 (Deco) Phase 4
 * 色ノイズ入り�Eクセル  E12種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// === ポスター (壁掛ぁE ===
export function VoxelPoster({ item }: Props) {
  return (
    <group>
      <NoisyBox size={[0.5, 0.65, 0.02]} position={[0, 0, 0]} color="#1e1b4b" seed={700} />
      <NoisyBox size={[0.42, 0.57, 0.005]} position={[0, 0, 0.013]} color="#e0e7ff" seed={701} lightnessSpread={0.06} />
      {/* アート部刁E*/}
      <NoisyBox size={[0.35, 0.4, 0.003]} position={[0, 0.03, 0.017]} color="#7c3aed" seed={702} lightnessSpread={0.25} />
      <NoisyBox size={[0.2, 0.04, 0.003]} position={[0, -0.22, 0.017]} color="#f472b6" seed={703} />
    </group>
  );
}

// === アートフレーム (壁掛ぁE ===
export function VoxelPosterFrame({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.4, 0.3, 0.03]} position={[0, 0, 0]} color="#78350f" seed={710} lightnessSpread={0.15} />
      <NoisyBox size={[0.32, 0.22, 0.005]} position={[0, 0, 0.016]} color="#fef3c7" seed={711} lightnessSpread={0.08} />
      {/* 抽象アーチE*/}
      <NoisyBox size={[0.12, 0.12, 0.003]} position={[-0.05, 0.02, 0.02]} color="#dc2626" seed={712} lightnessSpread={0.2} />
      <NoisyBox size={[0.1, 0.08, 0.003]} position={[0.08, -0.03, 0.02]} color="#3b82f6" seed={713} lightnessSpread={0.2} />
      <NoisyBox size={[0.06, 0.15, 0.003]} position={[-0.1, -0.02, 0.02]} color="#fbbf24" seed={714} lightnessSpread={0.2} />
    </group>
  );
}

// === ウォールシェルチE(壁掛ぁE ===
export function VoxelWallShelf({}: Props) {
  return (
    <group>
      {/* 棚板 */}
      <NoisyBox size={[0.5, 0.04, 0.15]} position={[0, 0, 0]} color="#78350f" seed={720} lightnessSpread={0.15} />
      {/* ブラケチE�� */}
      <NoisyBox size={[0.04, 0.1, 0.02]} position={[-0.18, -0.05, -0.06]} color="#6b7280" seed={721} metalness={0.5} />
      <NoisyBox size={[0.04, 0.1, 0.02]} position={[0.18, -0.05, -0.06]} color="#6b7280" seed={722} metalness={0.5} />
      {/* アイチE�� */}
      <NoisyBox size={[0.06, 0.1, 0.06]} position={[-0.15, 0.07, 0]} color="#dc2626" seed={723} />
      <NoisyCylinder args={[0.025, 0.025, 0.08, 8]} position={[0, 0.06, 0]} color="#22c55e" seed={724} />
      <NoisyBox size={[0.08, 0.08, 0.06]} position={[0.15, 0.06, 0]} color="#fbbf24" seed={725} />
    </group>
  );
}

// === 観葉植物 ===
export function VoxelPlant({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.12, 0.12, 0.12]} position={[0, 0.06, 0]} color="#92400e" seed={730} lightnessSpread={0.2} />
      <NoisyBox size={[0.1, 0.03, 0.1]} position={[0, 0.13, 0]} color="#5c3a1e" seed={731} lightnessSpread={0.25} />
      {/* 葉（色ノイズたっぷり！E*/}
      <NoisyBox size={[0.08, 0.08, 0.02]} position={[-0.03, 0.22, 0.02]} rotation={[0.2, 0.3, 0.1]} color="#16a34a" seed={732} lightnessSpread={0.22} />
      <NoisyBox size={[0.07, 0.09, 0.02]} position={[0.04, 0.25, -0.02]} rotation={[-0.1, -0.2, -0.15]} color="#15803d" seed={733} lightnessSpread={0.22} />
      <NoisyBox size={[0.06, 0.07, 0.02]} position={[0, 0.28, 0.03]} rotation={[0.3, 0, 0.2]} color="#22c55e" seed={734} lightnessSpread={0.22} />
      <NoisyBox size={[0.05, 0.06, 0.02]} position={[-0.05, 0.3, -0.01]} rotation={[-0.2, 0.4, 0]} color="#166534" seed={735} lightnessSpread={0.22} />
    </group>
  );
}

// === 大きい観葉植物 ===
export function VoxelPlantTall({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.18, 0.2, 0.18]} position={[0, 0.1, 0]} color="#92400e" seed={740} lightnessSpread={0.2} />
      <NoisyBox size={[0.15, 0.04, 0.15]} position={[0, 0.22, 0]} color="#5c3a1e" seed={741} lightnessSpread={0.25} />
      {/* 幹 */}
      <NoisyCylinder args={[0.03, 0.035, 0.5, 6]} position={[0, 0.49, 0]} color="#78350f" seed={742} lightnessSpread={0.18} />
      {/* 葉�Eクラスタ */}
      {[
        [0, 0.8, 0], [-0.12, 0.72, 0.08], [0.1, 0.75, -0.06],
        [-0.06, 0.85, -0.1], [0.08, 0.82, 0.1], [0, 0.9, 0.05],
      ].map((p, i) => (
        <NoisyBox key={i} size={[0.12, 0.1, 0.12]}
          position={p as [number,number,number]}
          rotation={[Math.random()*0.3, Math.random()*0.5, Math.random()*0.3]}
          color={['#16a34a', '#15803d', '#22c55e', '#166534', '#4ade80', '#14532d'][i]}
          seed={743+i} lightnessSpread={0.25} />
      ))}
    </group>
  );
}

// === 吊り下げ植物 ===
export function VoxelPlantHanging({}: Props) {
  const vineRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (vineRef.current) {
      vineRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.03;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.15, 0.1, 0.15]} position={[0, 0.6, 0]} color="#92400e" seed={760} lightnessSpread={0.2} />
      <NoisyCylinder args={[0.004, 0.004, 0.2, 4]} position={[-0.04, 0.72, 0]} color="#d4a574" seed={761} />
      <NoisyCylinder args={[0.004, 0.004, 0.2, 4]} position={[0.04, 0.72, 0]} color="#d4a574" seed={762} />
      <group ref={vineRef}>
        {[
          [0, 0.52, 0.06], [-0.06, 0.45, 0.04], [0.04, 0.4, 0.05],
          [-0.02, 0.35, 0.07], [0.06, 0.3, 0.03],
        ].map((p, i) => (
          <NoisyBox key={i} size={[0.06, 0.05, 0.02]}
            position={p as [number, number, number]}
            rotation={[0, i * 0.5, 0]}
            color={['#22c55e', '#16a34a', '#15803d', '#4ade80', '#166534'][i]}
            seed={763+i} lightnessSpread={0.25} />
        ))}
      </group>
    </group>
  );
}

// === チE��リウム ===
export function VoxelTerrarium({}: Props) {
  return (
    <group>
      {/* ガラス琁E*/}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.25} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* 圁E*/}
      <NoisyBox size={[0.18, 0.04, 0.18]} position={[0, 0.06, 0]} color="#5c3a1e" seed={770} lightnessSpread={0.3} />
      {/* 小さぁE��物 */}
      <NoisyBox size={[0.04, 0.08, 0.04]} position={[-0.03, 0.14, 0]} color="#16a34a" seed={771} lightnessSpread={0.25} />
      <NoisyBox size={[0.03, 0.06, 0.03]} position={[0.04, 0.12, 0.02]} color="#22c55e" seed={772} lightnessSpread={0.25} />
      {/* 苁E*/}
      <NoisyBox size={[0.12, 0.02, 0.1]} position={[0, 0.09, 0]} color="#15803d" seed={773} lightnessSpread={0.3} />
      {/* 小石 */}
      <NoisySphere args={[0.015, 6, 6]} position={[0.05, 0.08, -0.03]} color="#9ca3af" seed={774} />
    </group>
  );
}

// === 地琁E�� ===
export function VoxelGlobe({}: Props) {
  const globeRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.elapsedTime * 0.3;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.1, 0.02, 0.1]} position={[0, 0.01, 0]} color="#78350f" seed={780} />
      <NoisyCylinder args={[0.008, 0.008, 0.15, 4]} position={[0, 0.09, 0]} color="#6b7280" seed={781} metalness={0.6} />
      <mesh ref={globeRef} position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.085, 0.003, 4, 16]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// === トロフィー ===
export function VoxelTrophy({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.08, 0.04, 0.08]} position={[0, 0.02, 0]} color="#78350f" seed={790} />
      <NoisyCylinder args={[0.015, 0.025, 0.08, 6]} position={[0, 0.06, 0]} color="#fbbf24" seed={791} metalness={0.4} />
      <NoisyBox size={[0.1, 0.12, 0.06]} position={[0, 0.16, 0]} color="#fbbf24" seed={792} metalness={0.3} lightnessSpread={0.15} />
      {/* ハンドル */}
      <NoisyBox size={[0.02, 0.06, 0.02]} position={[-0.07, 0.16, 0]} color="#f59e0b" seed={793} metalness={0.4} />
      <NoisyBox size={[0.02, 0.06, 0.02]} position={[0.07, 0.16, 0]} color="#f59e0b" seed={794} metalness={0.4} />
    </group>
  );
}

// === 掛け時訁E(壁掛ぁE ===
export function VoxelClock({}: Props) {
  const secondRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (secondRef.current) {
      secondRef.current.rotation.z = -clock.elapsedTime * 0.5;
    }
  });
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.13, 0.15, 16]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1} />
      </mesh>
      {/* 時�E */}
      <mesh position={[0, 0.03, 0.008]} rotation={[0, 0, -0.8]}>
        <boxGeometry args={[0.008, 0.06, 0.005]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* 刁E�E */}
      <mesh position={[0, 0.04, 0.008]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.005, 0.09, 0.005]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* 秒�E */}
      <mesh ref={secondRef} position={[0, 0.03, 0.01]}>
        <boxGeometry args={[0.003, 0.1, 0.003]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// === レコード飾めE(壁掛ぁE ===
export function VoxelVinylRecord({}: Props) {
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <circleGeometry args={[0.14, 20]} />
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.04, 0.06, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <circleGeometry args={[0.01, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* グルーブ（溝）表現 */}
      {[0.08, 0.1, 0.12].map((r, i) => (
        <mesh key={i} position={[0, 0, 0.003]}>
          <ringGeometry args={[r - 0.003, r, 20]} />
          <meshStandardMaterial color="#222222" roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// === ミニ冷蔵庫 ===
export function VoxelMiniFridge({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.3, 0.5, 0.28]} position={[0, 0.25, 0]} color="#e2e8f0" seed={800} lightnessSpread={0.08} />
      {/* ドア刁E��緁E*/}
      <NoisyBox size={[0.28, 0.005, 0.005]} position={[0, 0.35, 0.141]} color="#9ca3af" seed={801} />
      {/* ハンドル */}
      <NoisyBox size={[0.02, 0.1, 0.02]} position={[0.12, 0.42, 0.15]} color="#6b7280" seed={802} metalness={0.5} />
      <NoisyBox size={[0.02, 0.08, 0.02]} position={[0.12, 0.2, 0.15]} color="#6b7280" seed={803} metalness={0.5} />
      {/* スチE��カー */}
      <NoisyBox size={[0.06, 0.06, 0.003]} position={[-0.06, 0.42, 0.142]} color="#f43f5e" seed={804} />
      <NoisyBox size={[0.04, 0.04, 0.003]} position={[0.02, 0.25, 0.142]} color="#fbbf24" seed={805} />
      <NoisyBox size={[0.05, 0.05, 0.003]} position={[-0.08, 0.15, 0.142]} color="#3b82f6" seed={806} />
    </group>
  );
}
