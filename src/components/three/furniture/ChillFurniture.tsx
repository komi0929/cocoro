/**
 * cocoro  Eチル系家具 (Chill) Phase 4
 * 色ノイズ入り�Eクセル  E13種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// === ベッチE(二段ベッチE ===
export function VoxelBed({}: Props) {
  return (
    <group>
      {/* フレーム柱 x4 */}
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[-0.45, 0.8, -0.35]} color="#5c3a1e" seed={10} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[0.45, 0.8, -0.35]} color="#5c3a1e" seed={11} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[-0.45, 0.8, 0.35]} color="#5c3a1e" seed={12} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[0.45, 0.8, 0.35]} color="#5c3a1e" seed={13} />
      {/* 下段マットレス */}
      <NoisyBox size={[0.8, 0.12, 0.6]} position={[0, 0.2, 0]} color="#6d28d9" seed={20} lightnessSpread={0.15} />
      {/* 下段极E*/}
      <NoisyBox size={[0.2, 0.08, 0.15]} position={[-0.25, 0.3, 0]} color="#f472b6" seed={21} />
      {/* 下段毛币E*/}
      <NoisyBox size={[0.5, 0.06, 0.55]} position={[0.1, 0.29, 0]} color="#818cf8" seed={22} lightnessSpread={0.18} />
      {/* 上段ベ�Eスボ�EチE*/}
      <NoisyBox size={[0.85, 0.05, 0.65]} position={[0, 0.78, 0]} color="#78350f" seed={23} />
      {/* 上段マットレス */}
      <NoisyBox size={[0.8, 0.12, 0.6]} position={[0, 0.9, 0]} color="#7c3aed" seed={24} lightnessSpread={0.15} />
      {/* 上段极E*/}
      <NoisyBox size={[0.2, 0.08, 0.15]} position={[-0.25, 1.0, 0]} color="#67e8f9" seed={25} />
      {/* はしご */}
      <NoisyBox size={[0.04, 1.0, 0.04]} position={[0.5, 0.5, 0.3]} color="#92400e" seed={30} />
      <NoisyBox size={[0.04, 1.0, 0.04]} position={[0.5, 0.5, 0.15]} color="#92400e" seed={31} />
      {[0.25, 0.5, 0.75].map((y, i) => (
        <NoisyBox key={i} size={[0.04, 0.03, 0.15]} position={[0.5, y, 0.225]} color="#a16207" seed={32 + i} />
      ))}
    </group>
  );
}

// === ソファ (パ�Eプル) ===
export function VoxelSofa({}: Props) {
  return (
    <group>
      {/* 座面 */}
      <NoisyBox size={[0.9, 0.18, 0.45]} position={[0, 0.18, 0.05]} color="#7c3aed" seed={40} lightnessSpread={0.14} />
      {/* 背もたれ */}
      <NoisyBox size={[0.9, 0.25, 0.1]} position={[0, 0.38, -0.17]} color="#6d28d9" seed={41} lightnessSpread={0.14} />
      {/* 肘掛け左 */}
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[-0.46, 0.28, 0.05]} color="#5b21b6" seed={42} />
      {/* 肘掛け右 */}
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[0.46, 0.28, 0.05]} color="#5b21b6" seed={43} />
      {/* クチE��ョン */}
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[-0.2, 0.32, 0.08]} color="#f472b6" seed={44} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[0.2, 0.32, 0.08]} color="#67e8f9" seed={45} />
      {/* 脁Ex4 */}
      {[[-0.35, 0.04, -0.1], [0.35, 0.04, -0.1], [-0.35, 0.04, 0.2], [0.35, 0.04, 0.2]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.025, 0.025, 0.08, 6]} position={p as [number,number,number]} color="#1e1b4b" seed={46+i} metalness={0.4} />
      ))}
    </group>
  );
}

// === ソファ (レチE��) ===
export function VoxelSofaRed({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.9, 0.18, 0.45]} position={[0, 0.18, 0.05]} color="#dc2626" seed={140} lightnessSpread={0.14} />
      <NoisyBox size={[0.9, 0.25, 0.1]} position={[0, 0.38, -0.17]} color="#b91c1c" seed={141} lightnessSpread={0.14} />
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[-0.46, 0.28, 0.05]} color="#991b1b" seed={142} />
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[0.46, 0.28, 0.05]} color="#991b1b" seed={143} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[-0.2, 0.32, 0.08]} color="#fbbf24" seed={144} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[0.2, 0.32, 0.08]} color="#34d399" seed={145} />
      {[[-0.35, 0.04, -0.1], [0.35, 0.04, -0.1], [-0.35, 0.04, 0.2], [0.35, 0.04, 0.2]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.025, 0.025, 0.08, 6]} position={p as [number,number,number]} color="#292524" seed={146+i} metalness={0.4} />
      ))}
    </group>
  );
}

// === ソファ (グリーン) ===
export function VoxelSofaGreen({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.9, 0.18, 0.45]} position={[0, 0.18, 0.05]} color="#4d7c0f" seed={150} lightnessSpread={0.14} />
      <NoisyBox size={[0.9, 0.25, 0.1]} position={[0, 0.38, -0.17]} color="#3f6212" seed={151} lightnessSpread={0.14} />
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[-0.46, 0.28, 0.05]} color="#365314" seed={152} />
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[0.46, 0.28, 0.05]} color="#365314" seed={153} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[-0.2, 0.32, 0.08]} color="#fde68a" seed={154} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[0.2, 0.32, 0.08]} color="#a78bfa" seed={155} />
      {[[-0.35, 0.04, -0.1], [0.35, 0.04, -0.1], [-0.35, 0.04, 0.2], [0.35, 0.04, 0.2]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.025, 0.025, 0.08, 6]} position={p as [number,number,number]} color="#292524" seed={156+i} metalness={0.4} />
      ))}
    </group>
  );
}

// === L字ソファ ===
export function VoxelLSofa({}: Props) {
  return (
    <group>
      <NoisyBox size={[1.2, 0.18, 0.55]} position={[0, 0.18, 0.15]} color="#7c3aed" seed={50} lightnessSpread={0.14} />
      <NoisyBox size={[0.4, 0.18, 0.55]} position={[0.55, 0.18, -0.25]} color="#7c3aed" seed={51} lightnessSpread={0.14} />
      <NoisyBox size={[1.2, 0.22, 0.1]} position={[0, 0.38, -0.08]} color="#6d28d9" seed={52} />
      <NoisyBox size={[0.1, 0.22, 0.55]} position={[0.72, 0.38, -0.25]} color="#6d28d9" seed={53} />
      <NoisyBox size={[0.08, 0.12, 0.55]} position={[-0.58, 0.28, 0.15]} color="#5b21b6" seed={54} />
      {[[-0.3, 0.3, 0.2], [0, 0.3, 0.2], [0.3, 0.3, 0.2]].map((pos, i) => (
        <NoisyBox key={i} size={[0.22, 0.08, 0.2]} position={pos as [number,number,number]} color={['#f472b6', '#67e8f9', '#fbbf24'][i]} seed={55+i} />
      ))}
      {[[-0.5, 0.04, -0.05], [0.5, 0.04, -0.05], [-0.5, 0.04, 0.35], [0.5, 0.04, 0.35], [0.65, 0.04, -0.45]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.03, 0.03, 0.08, 6]} position={p as [number,number,number]} color="#1e1b4b" seed={60+i} metalness={0.5} />
      ))}
    </group>
  );
}

// === ビ�EズクチE��ョン ===
export function VoxelBeanbag({}: Props) {
  return (
    <group>
      <NoisySphere args={[0.3, 12, 10]} position={[0, 0.22, 0]} color="#a78bfa" seed={70} lightnessSpread={0.18} />
      <NoisySphere args={[0.32, 12, 6]} position={[0, 0.08, 0]} color="#8b5cf6" seed={71} lightnessSpread={0.18} />
      <NoisySphere args={[0.05, 6, 6]} position={[0.05, 0.48, 0]} color="#7c3aed" seed={72} />
    </group>
  );
}

// === ハンモチE�� ===
export function VoxelHammock({}: Props) {
  const fabricRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (fabricRef.current) {
      fabricRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.03;
    }
  });
  return (
    <group>
      <NoisyCylinder args={[0.025, 0.03, 1.0, 6]} position={[-0.6, 0.5, 0]} color="#78350f" seed={80} />
      <NoisyCylinder args={[0.025, 0.03, 1.0, 6]} position={[0.6, 0.5, 0]} color="#78350f" seed={81} />
      <mesh ref={fabricRef} position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.45]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      {[[-0.5, 0.85, 0], [0.5, 0.85, 0]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.008, 0.008, 0.3, 4]} position={p as [number,number,number]} color="#d4a574" seed={82+i} />
      ))}
      <NoisyBox size={[0.15, 0.06, 0.25]} position={[-0.3, 0.65, 0]} color="#f472b6" seed={84} />
    </group>
  );
}

// === ラグマッチE===
export function VoxelRug({}: Props) {
  return (
    <group>
      <NoisyBox size={[1.2, 0.02, 0.8]} position={[0, 0.01, 0]} color="#6d28d9" seed={90} lightnessSpread={0.2} receiveShadow castShadow={false} />
      {/* パターンストライチE*/}
      <NoisyBox size={[1.1, 0.005, 0.1]} position={[0, 0.022, -0.2]} color="#a78bfa" seed={91} />
      <NoisyBox size={[1.1, 0.005, 0.1]} position={[0, 0.022, 0.2]} color="#a78bfa" seed={92} />
      <NoisyBox size={[1.1, 0.005, 0.06]} position={[0, 0.022, 0]} color="#fbbf24" seed={93} />
    </group>
  );
}

// === 丸ラグ ===
export function VoxelRugRound({}: Props) {
  return (
    <group>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 24]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.3, 24]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.85} />
      </mesh>
    </group>
  );
}

// === ストライプラグ ===
export function VoxelRugStripe({}: Props) {
  return (
    <group>
      <NoisyBox size={[1.0, 0.02, 0.7]} position={[0, 0.01, 0]} color="#92400e" seed={190} lightnessSpread={0.2} receiveShadow castShadow={false} />
      {[-0.25, -0.1, 0.05, 0.2].map((z, i) => (
        <NoisyBox key={i} size={[0.9, 0.005, 0.08]} position={[0, 0.022, z]} color={['#fbbf24', '#dc2626', '#3b82f6', '#22c55e'][i]} seed={191+i} />
      ))}
    </group>
  );
}

// === フロアクチE��ョン ===
export function VoxelCushion({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.35, 0.12, 0.35]} position={[0, 0.06, 0]} color="#06b6d4" seed={100} lightnessSpread={0.15} />
      <NoisyBox size={[0.3, 0.1, 0.3]} position={[0.02, 0.16, -0.02]} rotation={[0, 0.3, 0]} color="#f472b6" seed={101} lightnessSpread={0.15} />
    </group>
  );
}

// === ローチE�Eブル ===
export function VoxelTable({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.8, 0.06, 0.5]} position={[0, 0.24, 0]} color="#78350f" seed={110} lightnessSpread={0.15} />
      {[[-0.32, 0.1, -0.18], [0.32, 0.1, -0.18], [-0.32, 0.1, 0.18], [0.32, 0.1, 0.18]].map((p, i) => (
        <NoisyBox key={i} size={[0.06, 0.2, 0.06]} position={p as [number,number,number]} color="#5c3a1e" seed={111+i} />
      ))}
      {/* マグカチE�E */}
      <NoisyCylinder args={[0.03, 0.03, 0.06, 8]} position={[0.15, 0.31, 0.05]} color="#e11d48" seed={115} />
      {/* 本 */}
      <NoisyBox size={[0.12, 0.04, 0.08]} position={[-0.2, 0.31, -0.05]} color="#3b82f6" seed={116} />
    </group>
  );
}

// === センターチE�Eブル (低い) ===
export function VoxelLowTable({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.7, 0.04, 0.4]} position={[0, 0.18, 0]} color="#92400e" seed={170} lightnessSpread={0.18} />
      <NoisyBox size={[0.06, 0.16, 0.06]} position={[-0.28, 0.08, -0.14]} color="#78350f" seed={171} />
      <NoisyBox size={[0.06, 0.16, 0.06]} position={[0.28, 0.08, -0.14]} color="#78350f" seed={172} />
      <NoisyBox size={[0.06, 0.16, 0.06]} position={[-0.28, 0.08, 0.14]} color="#78350f" seed={173} />
      <NoisyBox size={[0.06, 0.16, 0.06]} position={[0.28, 0.08, 0.14]} color="#78350f" seed={174} />
      {/* コースター */}
      <NoisyBox size={[0.06, 0.005, 0.06]} position={[0.1, 0.205, 0.05]} color="#fbbf24" seed={175} />
    </group>
  );
}

// === サボテン ===
export function VoxelCactus({}: Props) {
  return (
    <group>
      {/* 鉢 */}
      <NoisyBox size={[0.2, 0.15, 0.2]} position={[0, 0.075, 0]} color="#92400e" seed={180} lightnessSpread={0.2} />
      {/* 圁E*/}
      <NoisyBox size={[0.18, 0.03, 0.18]} position={[0, 0.16, 0]} color="#5c3a1e" seed={181} lightnessSpread={0.25} />
      {/* メイン幹 */}
      <NoisyBox size={[0.1, 0.35, 0.1]} position={[0, 0.35, 0]} color="#16a34a" seed={182} lightnessSpread={0.2} />
      {/* 右极E*/}
      <NoisyBox size={[0.07, 0.04, 0.07]} position={[0.08, 0.35, 0]} color="#15803d" seed={183} />
      <NoisyBox size={[0.07, 0.18, 0.07]} position={[0.14, 0.45, 0]} color="#16a34a" seed={184} lightnessSpread={0.2} />
      {/* 左极E*/}
      <NoisyBox size={[0.06, 0.03, 0.06]} position={[-0.07, 0.28, 0]} color="#15803d" seed={185} />
      <NoisyBox size={[0.06, 0.12, 0.06]} position={[-0.12, 0.35, 0]} color="#16a34a" seed={186} lightnessSpread={0.2} />
    </group>
  );
}
