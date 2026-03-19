/**
 * cocoro — チル系家具 (Chill) Phase 4.5
 * 色バリアント対応 + 11種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// ============================================================
// Color variant helper
// ============================================================

/** Map of base-type to color lookup */
const SOFA_COLOR_MAP: Record<string, { main: string; back: string; arm: string; cushionA: string; cushionB: string }> = {
  purple: { main: '#7c3aed', back: '#6d28d9', arm: '#5b21b6', cushionA: '#f472b6', cushionB: '#67e8f9' },
  red:    { main: '#dc2626', back: '#b91c1c', arm: '#991b1b', cushionA: '#fbbf24', cushionB: '#34d399' },
  green:  { main: '#4d7c0f', back: '#3f6212', arm: '#365314', cushionA: '#fde68a', cushionB: '#a78bfa' },
  blue:   { main: '#2563eb', back: '#1d4ed8', arm: '#1e40af', cushionA: '#fbbf24', cushionB: '#f472b6' },
  pink:   { main: '#ec4899', back: '#db2777', arm: '#be185d', cushionA: '#fde68a', cushionB: '#67e8f9' },
};

function getSofaColors(item: FurnitureItem) {
  // backward compat for old sofa_red / sofa_green items
  if (item.type === 'sofa_red') return SOFA_COLOR_MAP.red;
  if (item.type === 'sofa_green') return SOFA_COLOR_MAP.green;
  const variantId = item.colorVariant ?? 'purple';
  return SOFA_COLOR_MAP[variantId] ?? SOFA_COLOR_MAP.purple;
}

// === ベッド (二段ベッド) ===
export function VoxelBed({ item }: Props) {
  const variant = item.colorVariant ?? 'purple';
  const bedColorMap: Record<string, { mattress: string; topMattress: string; pillow: string; blanket: string }> = {
    purple: { mattress: '#6d28d9', topMattress: '#7c3aed', pillow: '#f472b6', blanket: '#818cf8' },
    blue:   { mattress: '#1d4ed8', topMattress: '#2563eb', pillow: '#67e8f9', blanket: '#60a5fa' },
    pink:   { mattress: '#db2777', topMattress: '#ec4899', pillow: '#fde68a', blanket: '#f9a8d4' },
    green:  { mattress: '#15803d', topMattress: '#16a34a', pillow: '#86efac', blanket: '#4ade80' },
  };
  const c = bedColorMap[variant] ?? bedColorMap.purple;
  return (
    <group>
      {/* フレーム柱 x4 */}
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[-0.45, 0.8, -0.35]} color="#5c3a1e" seed={10} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[0.45, 0.8, -0.35]} color="#5c3a1e" seed={11} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[-0.45, 0.8, 0.35]} color="#5c3a1e" seed={12} />
      <NoisyCylinder args={[0.04, 0.04, 1.6, 6]} position={[0.45, 0.8, 0.35]} color="#5c3a1e" seed={13} />
      {/* 下段マットレス */}
      <NoisyBox size={[0.8, 0.12, 0.6]} position={[0, 0.2, 0]} color={c.mattress} seed={20} lightnessSpread={0.15} />
      {/* 下段枕 */}
      <NoisyBox size={[0.2, 0.08, 0.15]} position={[-0.25, 0.3, 0]} color={c.pillow} seed={21} />
      {/* 下段毛布 */}
      <NoisyBox size={[0.5, 0.06, 0.55]} position={[0.1, 0.29, 0]} color={c.blanket} seed={22} lightnessSpread={0.18} />
      {/* 上段ベースボード */}
      <NoisyBox size={[0.85, 0.05, 0.65]} position={[0, 0.78, 0]} color="#78350f" seed={23} />
      {/* 上段マットレス */}
      <NoisyBox size={[0.8, 0.12, 0.6]} position={[0, 0.9, 0]} color={c.topMattress} seed={24} lightnessSpread={0.15} />
      {/* 上段枕 */}
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

// === ソファ (カラーバリアント統合) ===
export function VoxelSofa({ item }: Props) {
  const c = getSofaColors(item);
  return (
    <group>
      {/* 座面 */}
      <NoisyBox size={[0.9, 0.18, 0.45]} position={[0, 0.18, 0.05]} color={c.main} seed={40} lightnessSpread={0.14} />
      {/* 背もたれ */}
      <NoisyBox size={[0.9, 0.25, 0.1]} position={[0, 0.38, -0.17]} color={c.back} seed={41} lightnessSpread={0.14} />
      {/* 肘掛け左 */}
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[-0.46, 0.28, 0.05]} color={c.arm} seed={42} />
      {/* 肘掛け右 */}
      <NoisyBox size={[0.08, 0.22, 0.45]} position={[0.46, 0.28, 0.05]} color={c.arm} seed={43} />
      {/* クッション */}
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[-0.2, 0.32, 0.08]} color={c.cushionA} seed={44} />
      <NoisyBox size={[0.25, 0.08, 0.18]} position={[0.2, 0.32, 0.08]} color={c.cushionB} seed={45} />
      {/* 脚x4 */}
      {[[-0.35, 0.04, -0.1], [0.35, 0.04, -0.1], [-0.35, 0.04, 0.2], [0.35, 0.04, 0.2]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.025, 0.025, 0.08, 6]} position={p as [number,number,number]} color="#1e1b4b" seed={46+i} metalness={0.4} />
      ))}
    </group>
  );
}

// === L字ソファ ===
export function VoxelLSofa({ item }: Props) {
  const c = getSofaColors(item);
  return (
    <group>
      <NoisyBox size={[1.2, 0.18, 0.55]} position={[0, 0.18, 0.15]} color={c.main} seed={50} lightnessSpread={0.14} />
      <NoisyBox size={[0.4, 0.18, 0.55]} position={[0.55, 0.18, -0.25]} color={c.main} seed={51} lightnessSpread={0.14} />
      <NoisyBox size={[1.2, 0.22, 0.1]} position={[0, 0.38, -0.08]} color={c.back} seed={52} />
      <NoisyBox size={[0.1, 0.22, 0.55]} position={[0.72, 0.38, -0.25]} color={c.back} seed={53} />
      <NoisyBox size={[0.08, 0.12, 0.55]} position={[-0.58, 0.28, 0.15]} color={c.arm} seed={54} />
      {[[-0.3, 0.3, 0.2], [0, 0.3, 0.2], [0.3, 0.3, 0.2]].map((pos, i) => (
        <NoisyBox key={i} size={[0.22, 0.08, 0.2]} position={pos as [number,number,number]} color={[c.cushionA, c.cushionB, '#fbbf24'][i]} seed={55+i} />
      ))}
      {[[-0.5, 0.04, -0.05], [0.5, 0.04, -0.05], [-0.5, 0.04, 0.35], [0.5, 0.04, 0.35], [0.65, 0.04, -0.45]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.03, 0.03, 0.08, 6]} position={p as [number,number,number]} color="#1e1b4b" seed={60+i} metalness={0.5} />
      ))}
    </group>
  );
}

// === ビーズクッション ===
export function VoxelBeanbag({ item }: Props) {
  const colorMap: Record<string, { main: string; base: string; top: string }> = {
    purple: { main: '#a78bfa', base: '#8b5cf6', top: '#7c3aed' },
    pink:   { main: '#f472b6', base: '#ec4899', top: '#db2777' },
    blue:   { main: '#60a5fa', base: '#3b82f6', top: '#2563eb' },
    orange: { main: '#fb923c', base: '#f97316', top: '#ea580c' },
  };
  const variant = item.colorVariant ?? 'purple';
  const c = colorMap[variant] ?? colorMap.purple;
  return (
    <group>
      <NoisySphere args={[0.3, 12, 10]} position={[0, 0.22, 0]} color={c.main} seed={70} lightnessSpread={0.18} />
      <NoisySphere args={[0.32, 12, 6]} position={[0, 0.08, 0]} color={c.base} seed={71} lightnessSpread={0.18} />
      <NoisySphere args={[0.05, 6, 6]} position={[0.05, 0.48, 0]} color={c.top} seed={72} />
    </group>
  );
}

// === ハンモック ===
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

// === ラグマット ===
export function VoxelRug({ item }: Props) {
  const colorMap: Record<string, { base: string; stripe: string; center: string }> = {
    purple: { base: '#6d28d9', stripe: '#a78bfa', center: '#fbbf24' },
    red:    { base: '#b91c1c', stripe: '#f87171', center: '#fbbf24' },
    blue:   { base: '#1e40af', stripe: '#60a5fa', center: '#fbbf24' },
    green:  { base: '#166534', stripe: '#4ade80', center: '#fde68a' },
    orange: { base: '#c2410c', stripe: '#fb923c', center: '#fde68a' },
  };
  const variant = item.colorVariant ?? 'purple';
  const c = colorMap[variant] ?? colorMap.purple;
  return (
    <group>
      <NoisyBox size={[1.2, 0.02, 0.8]} position={[0, 0.01, 0]} color={c.base} seed={90} lightnessSpread={0.2} receiveShadow castShadow={false} />
      <NoisyBox size={[1.1, 0.005, 0.1]} position={[0, 0.022, -0.2]} color={c.stripe} seed={91} />
      <NoisyBox size={[1.1, 0.005, 0.1]} position={[0, 0.022, 0.2]} color={c.stripe} seed={92} />
      <NoisyBox size={[1.1, 0.005, 0.06]} position={[0, 0.022, 0]} color={c.center} seed={93} />
    </group>
  );
}

// === 丸ラグ ===
export function VoxelRugRound({ item }: Props) {
  const colorMap: Record<string, { base: string; ring: string; center: string }> = {
    purple: { base: '#6d28d9', ring: '#a78bfa', center: '#fbbf24' },
    red:    { base: '#b91c1c', ring: '#f87171', center: '#fbbf24' },
    blue:   { base: '#1e40af', ring: '#60a5fa', center: '#fde68a' },
    green:  { base: '#166534', ring: '#4ade80', center: '#fbbf24' },
    orange: { base: '#c2410c', ring: '#fb923c', center: '#fde68a' },
  };
  const variant = item.colorVariant ?? 'purple';
  const c = colorMap[variant] ?? colorMap.purple;
  return (
    <group>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 24]} />
        <meshStandardMaterial color={c.base} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.3, 24]} />
        <meshStandardMaterial color={c.ring} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color={c.center} roughness={0.85} />
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

// === フロアクッション ===
export function VoxelCushion({ item }: Props) {
  const colorMap: Record<string, { bottom: string; top: string }> = {
    cyan:     { bottom: '#06b6d4', top: '#f472b6' },
    pink:     { bottom: '#f472b6', top: '#67e8f9' },
    yellow:   { bottom: '#facc15', top: '#a78bfa' },
    lavender: { bottom: '#a78bfa', top: '#f472b6' },
  };
  const variant = item.colorVariant ?? 'cyan';
  const c = colorMap[variant] ?? colorMap.cyan;
  return (
    <group>
      <NoisyBox size={[0.35, 0.12, 0.35]} position={[0, 0.06, 0]} color={c.bottom} seed={100} lightnessSpread={0.15} />
      <NoisyBox size={[0.3, 0.1, 0.3]} position={[0.02, 0.16, -0.02]} rotation={[0, 0.3, 0]} color={c.top} seed={101} lightnessSpread={0.15} />
    </group>
  );
}

// === ローテーブル ===
export function VoxelTable({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.8, 0.06, 0.5]} position={[0, 0.24, 0]} color="#78350f" seed={110} lightnessSpread={0.15} />
      {[[-0.32, 0.1, -0.18], [0.32, 0.1, -0.18], [-0.32, 0.1, 0.18], [0.32, 0.1, 0.18]].map((p, i) => (
        <NoisyBox key={i} size={[0.06, 0.2, 0.06]} position={p as [number,number,number]} color="#5c3a1e" seed={111+i} />
      ))}
      {/* マグカップ */}
      <NoisyCylinder args={[0.03, 0.03, 0.06, 8]} position={[0.15, 0.31, 0.05]} color="#e11d48" seed={115} />
      {/* 本 */}
      <NoisyBox size={[0.12, 0.04, 0.08]} position={[-0.2, 0.31, -0.05]} color="#3b82f6" seed={116} />
    </group>
  );
}

// === センターテーブル (低い) ===
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
      {/* 土 */}
      <NoisyBox size={[0.18, 0.03, 0.18]} position={[0, 0.16, 0]} color="#5c3a1e" seed={181} lightnessSpread={0.25} />
      {/* メイン幹 */}
      <NoisyBox size={[0.1, 0.35, 0.1]} position={[0, 0.35, 0]} color="#16a34a" seed={182} lightnessSpread={0.2} />
      {/* 右枝 */}
      <NoisyBox size={[0.07, 0.04, 0.07]} position={[0.08, 0.35, 0]} color="#15803d" seed={183} />
      <NoisyBox size={[0.07, 0.18, 0.07]} position={[0.14, 0.45, 0]} color="#16a34a" seed={184} lightnessSpread={0.2} />
      {/* 左枝 */}
      <NoisyBox size={[0.06, 0.03, 0.06]} position={[-0.07, 0.28, 0]} color="#15803d" seed={185} />
      <NoisyBox size={[0.06, 0.12, 0.06]} position={[-0.12, 0.35, 0]} color="#16a34a" seed={186} lightnessSpread={0.2} />
    </group>
  );
}

// === こたつ ===
export function VoxelKotatsu({}: Props) {
  return (
    <group>
      {/* テーブル天板 */}
      <NoisyBox size={[0.8, 0.04, 0.6]} position={[0, 0.32, 0]} color="#78350f" seed={200} lightnessSpread={0.15} />
      {/* 布団 (天板より大きい) */}
      <NoisyBox size={[0.9, 0.06, 0.7]} position={[0, 0.26, 0]} color="#dc2626" seed={201} lightnessSpread={0.18} />
      {/* テーブル脚 x4 */}
      {[[-0.3, 0.13, -0.2], [0.3, 0.13, -0.2], [-0.3, 0.13, 0.2], [0.3, 0.13, 0.2]].map((p, i) => (
        <NoisyBox key={i} size={[0.05, 0.22, 0.05]} position={p as [number,number,number]} color="#5c3a1e" seed={202+i} />
      ))}
      {/* みかん */}
      <NoisySphere args={[0.04, 8, 6]} position={[0.1, 0.37, 0.05]} color="#f97316" seed={206} />
    </group>
  );
}

// === ロッキングチェア ===
export function VoxelRockingChair({}: Props) {
  return (
    <group>
      {/* 座面 */}
      <NoisyBox size={[0.35, 0.04, 0.35]} position={[0, 0.3, 0]} color="#78350f" seed={210} lightnessSpread={0.15} />
      {/* 背もたれ */}
      <NoisyBox size={[0.35, 0.35, 0.04]} position={[0, 0.5, -0.15]} color="#92400e" seed={211} />
      {/* 肘掛け */}
      <NoisyBox size={[0.04, 0.12, 0.3]} position={[-0.17, 0.38, 0]} color="#78350f" seed={212} />
      <NoisyBox size={[0.04, 0.12, 0.3]} position={[0.17, 0.38, 0]} color="#78350f" seed={213} />
      {/* ロッカー(曲線の脚) */}
      <NoisyBox size={[0.04, 0.04, 0.5]} position={[-0.15, 0.04, 0]} color="#5c3a1e" seed={214} />
      <NoisyBox size={[0.04, 0.04, 0.5]} position={[0.15, 0.04, 0]} color="#5c3a1e" seed={215} />
    </group>
  );
}

// === デイベッド ===
export function VoxelDaybed({ item }: Props) {
  const c = getSofaColors(item);
  return (
    <group>
      {/* マットレス */}
      <NoisyBox size={[1.0, 0.15, 0.5]} position={[0, 0.2, 0]} color={c.main} seed={220} lightnessSpread={0.14} />
      {/* 背もたれ（片側のみ） */}
      <NoisyBox size={[1.0, 0.2, 0.08]} position={[0, 0.35, -0.2]} color={c.back} seed={221} />
      {/* 肘掛け（片方） */}
      <NoisyBox size={[0.08, 0.18, 0.5]} position={[-0.48, 0.25, 0]} color={c.arm} seed={222} />
      {/* クッション */}
      <NoisyBox size={[0.2, 0.1, 0.18]} position={[-0.3, 0.32, 0]} color={c.cushionA} seed={223} />
      {/* 脚 */}
      {[[-0.4, 0.05, -0.18], [0.4, 0.05, -0.18], [-0.4, 0.05, 0.18], [0.4, 0.05, 0.18]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.02, 0.02, 0.1, 6]} position={p as [number,number,number]} color="#1e1b4b" seed={224+i} metalness={0.4} />
      ))}
    </group>
  );
}

// === ブランケット ===
export function VoxelBlanket({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.5, 0.04, 0.35]} position={[0, 0.02, 0]} color="#f472b6" seed={230} lightnessSpread={0.2} />
      <NoisyBox size={[0.4, 0.03, 0.3]} position={[0.02, 0.055, -0.01]} color="#f9a8d4" seed={231} lightnessSpread={0.15} />
      <NoisyBox size={[0.3, 0.02, 0.2]} position={[0.04, 0.075, -0.02]} color="#fce7f3" seed={232} />
    </group>
  );
}

// === 枕の山 ===
export function VoxelPillowPile({ item }: Props) {
  const colorMap: Record<string, string[]> = {
    cyan: ['#06b6d4', '#67e8f9', '#a5f3fc'],
    pink: ['#ec4899', '#f9a8d4', '#fce7f3'],
    yellow: ['#eab308', '#fde68a', '#fef9c3'],
    lavender: ['#8b5cf6', '#c4b5fd', '#ede9fe'],
  };
  const variant = item.colorVariant ?? 'cyan';
  const cols = colorMap[variant] ?? colorMap.cyan;
  return (
    <group>
      <NoisyBox size={[0.25, 0.12, 0.2]} position={[-0.1, 0.06, 0]} color={cols[0]} seed={240} />
      <NoisyBox size={[0.22, 0.1, 0.18]} position={[0.1, 0.05, 0.03]} color={cols[1]} seed={241} />
      <NoisyBox size={[0.2, 0.1, 0.16]} position={[0, 0.14, 0]} rotation={[0, 0.4, 0]} color={cols[2]} seed={242} />
    </group>
  );
}

// === 寝袋 ===
export function VoxelSleepingBag({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.35, 0.1, 0.8]} position={[0, 0.05, 0]} color="#16a34a" seed={250} lightnessSpread={0.18} />
      <NoisyBox size={[0.3, 0.08, 0.15]} position={[0, 0.12, -0.35]} color="#15803d" seed={251} />
      {/* ジッパーライン */}
      <NoisyBox size={[0.02, 0.005, 0.7]} position={[0.12, 0.105, 0.03]} color="#fbbf24" seed={252} />
    </group>
  );
}

// === スイングチェア ===
export function VoxelSwingChair({}: Props) {
  return (
    <group>
      {/* フレーム */}
      <NoisyCylinder args={[0.02, 0.02, 1.4, 6]} position={[0, 0.7, 0]} color="#64748b" seed={260} metalness={0.5} />
      {/* チェーン */}
      <NoisyBox size={[0.02, 0.4, 0.02]} position={[0, 1.2, 0]} color="#94a3b8" seed={261} metalness={0.6} />
      {/* シート（卵型） */}
      <NoisySphere args={[0.3, 10, 8]} position={[0, 0.55, 0]} color="#e2e8f0" seed={262} lightnessSpread={0.1} />
      {/* クッション */}
      <NoisySphere args={[0.2, 8, 6]} position={[0, 0.45, 0.05]} color="#f472b6" seed={263} />
    </group>
  );
}

// === 布団セット ===
export function VoxelFuton({ item }: Props) {
  const variant = item.colorVariant ?? 'purple';
  const colorMap: Record<string, { mattress: string; blanket: string; pillow: string }> = {
    purple: { mattress: '#f5f5f4', blanket: '#6d28d9', pillow: '#f472b6' },
    blue: { mattress: '#f5f5f4', blanket: '#1d4ed8', pillow: '#67e8f9' },
    pink: { mattress: '#f5f5f4', blanket: '#db2777', pillow: '#fde68a' },
    green: { mattress: '#f5f5f4', blanket: '#15803d', pillow: '#86efac' },
  };
  const c = colorMap[variant] ?? colorMap.purple;
  return (
    <group>
      {/* 敷布団 */}
      <NoisyBox size={[0.5, 0.06, 0.9]} position={[0, 0.03, 0]} color={c.mattress} seed={270} lightnessSpread={0.1} />
      {/* 掛け布団 */}
      <NoisyBox size={[0.48, 0.08, 0.6]} position={[0, 0.08, 0.1]} color={c.blanket} seed={271} lightnessSpread={0.18} />
      {/* 枕 */}
      <NoisyBox size={[0.3, 0.06, 0.15]} position={[0, 0.08, -0.35]} color={c.pillow} seed={272} />
    </group>
  );
}

// === ヨガマット ===
export function VoxelFloorMat({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.4, 0.02, 1.0]} position={[0, 0.01, 0]} color="#7c3aed" seed={280} lightnessSpread={0.15} />
      {/* 巻いた端 */}
      <NoisyCylinder args={[0.03, 0.03, 0.4, 8]} position={[0, 0.04, 0.48]} rotation={[0, 0, Math.PI / 2]} color="#6d28d9" seed={281} />
    </group>
  );
}

