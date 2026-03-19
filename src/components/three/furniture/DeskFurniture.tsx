/**
 * cocoro  EチE��ク系家具 (Desk) Phase 4
 * 色ノイズ入り�Eクセル  E11種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, EmissiveBox } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// === ゲーミングチE��ク ===
export function VoxelDesk({}: Props) {
  return (
    <group>
      <NoisyBox size={[1.0, 0.06, 0.5]} position={[0, 0.5, 0]} color="#1e293b" seed={400} lightnessSpread={0.1} />
      {[[-0.42, 0.24, -0.18], [0.42, 0.24, -0.18], [-0.42, 0.24, 0.18], [0.42, 0.24, 0.18]].map((p, i) => (
        <NoisyBox key={i} size={[0.05, 0.48, 0.05]} position={p as [number,number,number]} color="#374151" seed={401+i} metalness={0.3} />
      ))}
      <EmissiveBox size={[0.9, 0.02, 0.01]} position={[0, 0.54, 0.25]} color="#7c3aed" emissiveIntensity={2} />
      <NoisyBox size={[0.85, 0.04, 0.35]} position={[0, 0.1, 0]} color="#0f172a" seed={405} />
    </group>
  );
}

// === ゲーミングチェア ===
export function VoxelGamingChair({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.35, 0.06, 0.35]} position={[0, 0.35, 0]} color="#1e1b4b" seed={410} />
      <NoisyBox size={[0.33, 0.45, 0.06]} position={[0, 0.6, -0.16]} color="#1e1b4b" seed={411} />
      <NoisyBox size={[0.06, 0.1, 0.33]} position={[-0.18, 0.42, 0]} color="#dc2626" seed={412} />
      <NoisyBox size={[0.06, 0.1, 0.33]} position={[0.18, 0.42, 0]} color="#dc2626" seed={413} />
      <NoisyBox size={[0.2, 0.08, 0.04]} position={[0, 0.78, -0.16]} color="#dc2626" seed={414} />
      <NoisyCylinder args={[0.025, 0.025, 0.28, 6]} position={[0, 0.16, 0]} color="#555555" seed={415} metalness={0.6} />
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const r = deg * Math.PI / 180;
        return (
          <NoisyCylinder key={i} args={[0.015, 0.015, 0.2, 4]}
            position={[Math.cos(r) * 0.13, 0.02, Math.sin(r) * 0.13]}
            rotation={[0, 0, Math.PI / 2]}
            color="#333333" seed={416+i} metalness={0.5} />
        );
      })}
    </group>
  );
}

// === モニター ===
export function VoxelMonitor({}: Props) {
  const screenRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 2) * 0.1;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.5, 0.32, 0.03]} position={[0, 0.45, 0]} color="#111827" seed={420} />
      <mesh ref={screenRef} position={[0, 0.45, 0.016]}>
        <boxGeometry args={[0.44, 0.26, 0.005]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={1.2} />
      </mesh>
      <NoisyCylinder args={[0.02, 0.03, 0.18, 6]} position={[0, 0.2, -0.02]} color="#374151" seed={421} metalness={0.4} />
      <NoisyBox size={[0.18, 0.02, 0.12]} position={[0, 0.1, -0.02]} color="#374151" seed={422} metalness={0.3} />
      <pointLight position={[0, 0.45, 0.2]} color="#60a5fa" intensity={0.3} distance={1} decay={2} />
    </group>
  );
}

// === チE��アルモニター ===
export function VoxelMonitorDual({}: Props) {
  return (
    <group>
      {[-0.28, 0.28].map((x, i) => (
        <group key={i}>
          <NoisyBox size={[0.45, 0.28, 0.03]} position={[x, 0.45, 0]} color="#111827" seed={430+i*3} />
          <EmissiveBox size={[0.39, 0.22, 0.005]} position={[x, 0.45, 0.016]} color={i === 0 ? '#60a5fa' : '#a78bfa'} emissiveIntensity={1} />
        </group>
      ))}
      <NoisyBox size={[0.3, 0.02, 0.15]} position={[0, 0.1, -0.02]} color="#374151" seed={436} metalness={0.3} />
      <NoisyCylinder args={[0.025, 0.03, 0.22, 6]} position={[0, 0.21, -0.02]} color="#374151" seed={437} metalness={0.4} />
      <pointLight position={[0, 0.45, 0.3]} color="#60a5fa" intensity={0.3} distance={1.2} decay={2} />
    </group>
  );
}

// === ゲーミングPC ===
export function VoxelGamingPC({}: Props) {
  const rgbRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (rgbRef.current) {
      const mat = rgbRef.current.material as THREE.MeshStandardMaterial;
      const hue = (clock.elapsedTime * 0.15) % 1;
      mat.color.setHSL(hue, 0.9, 0.5);
      mat.emissive.setHSL(hue, 0.9, 0.4);
    }
  });
  return (
    <group>
      <NoisyBox size={[0.22, 0.5, 0.4]} position={[0, 0.25, 0]} color="#111827" seed={440} lightnessSpread={0.08} />
      {/* ガラスパネル */}
      <mesh position={[0.112, 0.28, 0]}>
        <boxGeometry args={[0.005, 0.35, 0.3]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} metalness={0.5} roughness={0.1} />
      </mesh>
      {/* RGB LED */}
      <mesh ref={rgbRef} position={[0.112, 0.28, 0]}>
        <boxGeometry args={[0.006, 0.32, 0.02]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={2} />
      </mesh>
      {/* ファン */}
      <mesh position={[-0.112, 0.35, 0]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* 電源�Eタン */}
      <NoisyCylinder args={[0.01, 0.01, 0.005, 8]} position={[0.112, 0.46, 0.12]} rotation={[0, 0, Math.PI / 2]} color="#22c55e" seed={441} />
    </group>
  );
}

// === スチ�EルラチE�� ===
export function VoxelSteelRack({}: Props) {
  return (
    <group>
      {[[-0.28, 0, -0.15], [0.28, 0, -0.15], [-0.28, 0, 0.15], [0.28, 0, 0.15]].map((p, i) => (
        <NoisyBox key={i} size={[0.03, 1.2, 0.03]} position={[p[0], 0.6, p[2]]} color="#6b7280" seed={450+i} metalness={0.6} />
      ))}
      {[0.01, 0.3, 0.6, 0.9].map((y, i) => (
        <NoisyBox key={i} size={[0.55, 0.02, 0.28]} position={[0, y, 0]} color="#9ca3af" seed={454+i} metalness={0.5} />
      ))}
      <NoisyBox size={[0.1, 0.15, 0.1]} position={[0.1, 0.38, 0]} color="#3b82f6" seed={460} />
      <NoisyBox size={[0.15, 0.1, 0.12]} position={[-0.1, 0.66, 0]} color="#22c55e" seed={461} />
    </group>
  );
}

// === イス ===
export function VoxelChair({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.3, 0.04, 0.3]} position={[0, 0.32, 0]} color="#78350f" seed={470} lightnessSpread={0.15} />
      <NoisyBox size={[0.28, 0.3, 0.04]} position={[0, 0.5, -0.13]} color="#78350f" seed={471} lightnessSpread={0.15} />
      {[[-0.12, 0.15, -0.12], [0.12, 0.15, -0.12], [-0.12, 0.15, 0.12], [0.12, 0.15, 0.12]].map((p, i) => (
        <NoisyBox key={i} size={[0.03, 0.3, 0.03]} position={p as [number,number,number]} color="#5c3a1e" seed={472+i} />
      ))}
    </group>
  );
}

// === シェルチE===
export function VoxelShelf({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.6, 0.04, 0.25]} position={[0, 0.02, 0]} color="#78350f" seed={480} />
      <NoisyBox size={[0.6, 0.04, 0.25]} position={[0, 0.35, 0]} color="#78350f" seed={481} />
      <NoisyBox size={[0.6, 0.04, 0.25]} position={[0, 0.68, 0]} color="#78350f" seed={482} />
      <NoisyBox size={[0.04, 0.7, 0.25]} position={[-0.28, 0.35, 0]} color="#5c3a1e" seed={483} />
      <NoisyBox size={[0.04, 0.7, 0.25]} position={[0.28, 0.35, 0]} color="#5c3a1e" seed={484} />
      {/* 本 */}
      <NoisyBox size={[0.08, 0.22, 0.15]} position={[-0.15, 0.48, 0]} color="#dc2626" seed={485} />
      <NoisyBox size={[0.06, 0.2, 0.15]} position={[-0.04, 0.47, 0]} color="#3b82f6" seed={486} />
      <NoisyBox size={[0.07, 0.18, 0.14]} position={[0.06, 0.46, 0]} color="#22c55e" seed={487} />
      {/* フィギュア */}
      <NoisyBox size={[0.05, 0.12, 0.05]} position={[0.18, 0.13, 0]} color="#fbbf24" seed={488} />
    </group>
  );
}

// === ファイリングキャビネチE�� ===
export function VoxelFilingCabinet({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.35, 0.7, 0.3]} position={[0, 0.35, 0]} color="#6b7280" seed={490} metalness={0.5} lightnessSpread={0.1} />
      {[0.55, 0.38, 0.2].map((y, i) => (
        <group key={i}>
          <NoisyBox size={[0.3, 0.14, 0.005]} position={[0, y, 0.153]} color="#9ca3af" seed={491+i} metalness={0.4} />
          <NoisyBox size={[0.06, 0.02, 0.02]} position={[0, y, 0.165]} color="#d4d4d8" seed={494+i} metalness={0.6} />
        </group>
      ))}
    </group>
  );
}

// === ホワイトボード ===
export function VoxelWhiteboard({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.8, 0.5, 0.03]} position={[0, 0.25, 0]} color="#f1f5f9" seed={500} lightnessSpread={0.04} />
      <NoisyBox size={[0.84, 0.04, 0.04]} position={[0, 0.51, 0]} color="#94a3b8" seed={501} metalness={0.3} />
      <NoisyBox size={[0.84, 0.04, 0.04]} position={[0, -0.01, 0]} color="#94a3b8" seed={502} metalness={0.3} />
      <NoisyBox size={[0.04, 0.52, 0.04]} position={[-0.4, 0.25, 0]} color="#94a3b8" seed={503} metalness={0.3} />
      <NoisyBox size={[0.04, 0.52, 0.04]} position={[0.4, 0.25, 0]} color="#94a3b8" seed={504} metalness={0.3} />
      <NoisyBox size={[0.4, 0.03, 0.05]} position={[0, -0.02, 0.03]} color="#64748b" seed={505} metalness={0.4} />
      <NoisyCylinder args={[0.008, 0.008, 0.08, 6]} position={[-0.08, 0.0, 0.03]} rotation={[0, 0, Math.PI / 2]} color="#dc2626" seed={506} />
      <NoisyCylinder args={[0.008, 0.008, 0.08, 6]} position={[0.02, 0.0, 0.03]} rotation={[0, 0, Math.PI / 2]} color="#3b82f6" seed={507} />
    </group>
  );
}

// === ノートPC ===
export function VoxelLaptop({}: Props) {
  return (
    <group>
      {/* ベース */}
      <NoisyBox size={[0.3, 0.02, 0.2]} position={[0, 0.01, 0]} color="#374151" seed={510} metalness={0.3} />
      {/* キーボード面 */}
      <NoisyBox size={[0.26, 0.005, 0.14]} position={[0, 0.02, 0.02]} color="#1e293b" seed={511} />
      {/* スクリーン */}
      <NoisyBox size={[0.3, 0.2, 0.01]} position={[0, 0.12, -0.09]} rotation={[-0.2, 0, 0]} color="#1e293b" seed={512} />
      <EmissiveBox size={[0.26, 0.16, 0.005]} position={[0, 0.12, -0.085]} rotation={[-0.2, 0, 0]} color="#60a5fa" emissiveIntensity={1.2} />
      <pointLight position={[0, 0.12, 0.1]} color="#60a5fa" intensity={0.3} distance={1} decay={2} />
    </group>
  );
}

// === タブレットスタンド ===
export function VoxelTabletStand({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.1, 0.02, 0.08]} position={[0, 0.01, 0]} color="#374151" seed={520} metalness={0.4} />
      <NoisyBox size={[0.06, 0.12, 0.02]} position={[0, 0.07, -0.02]} rotation={[-0.15, 0, 0]} color="#555" seed={521} metalness={0.4} />
      {/* タブレット */}
      <NoisyBox size={[0.15, 0.22, 0.01]} position={[0, 0.16, -0.03]} rotation={[-0.15, 0, 0]} color="#1e1b4b" seed={522} />
      <EmissiveBox size={[0.13, 0.19, 0.005]} position={[0, 0.16, -0.025]} rotation={[-0.15, 0, 0]} color="#a78bfa" emissiveIntensity={0.8} />
    </group>
  );
}

// === デスクオーガナイザー ===
export function VoxelDeskOrganizer({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.2, 0.1, 0.1]} position={[0, 0.05, 0]} color="#78350f" seed={530} lightnessSpread={0.15} />
      {/* 仕切り */}
      <NoisyBox size={[0.01, 0.1, 0.1]} position={[-0.05, 0.05, 0]} color="#5c3a1e" seed={531} />
      {/* ペン */}
      <NoisyCylinder args={[0.006, 0.006, 0.12, 4]} position={[-0.08, 0.11, 0]} color="#dc2626" seed={532} />
      <NoisyCylinder args={[0.006, 0.006, 0.1, 4]} position={[-0.06, 0.1, 0.02]} color="#3b82f6" seed={533} />
      <NoisyCylinder args={[0.006, 0.006, 0.11, 4]} position={[0.06, 0.105, 0]} color="#22c55e" seed={534} />
      {/* はさみ */}
      <NoisyBox size={[0.04, 0.08, 0.01]} position={[0.08, 0.09, 0]} color="#9ca3af" seed={535} metalness={0.5} />
    </group>
  );
}

// === メカニカルキーボード ===
export function VoxelKeyboard({}: Props) {
  const ledRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      const hue = (clock.elapsedTime * 0.3) % 1;
      mat.color.setHSL(hue, 0.8, 0.5);
      mat.emissive.setHSL(hue, 0.8, 0.4);
    }
  });
  return (
    <group>
      <NoisyBox size={[0.35, 0.025, 0.12]} position={[0, 0.013, 0]} color="#1e293b" seed={540} />
      {/* キー列 */}
      {[-0.04, -0.015, 0.01, 0.035].map((z, row) => (
        <group key={row}>
          {Array.from({ length: 10 }).map((_, col) => (
            <NoisyBox key={col} size={[0.025, 0.01, 0.02]}
              position={[-0.14 + col * 0.032, 0.03, z]}
              color="#334155" seed={541 + row * 10 + col} />
          ))}
        </group>
      ))}
      {/* RGB LED */}
      <mesh ref={ledRef} position={[0, 0.005, 0.065]}>
        <boxGeometry args={[0.33, 0.005, 0.003]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// === マウスパッド ===
export function VoxelMousePad({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.3, 0.005, 0.25]} position={[0, 0.003, 0]} color="#1e1b4b" seed={550} lightnessSpread={0.1} />
      {/* ネオンエッジ */}
      <EmissiveBox size={[0.3, 0.003, 0.003]} position={[0, 0.006, 0.124]} color="#7c3aed" emissiveIntensity={2} />
      <EmissiveBox size={[0.3, 0.003, 0.003]} position={[0, 0.006, -0.124]} color="#7c3aed" emissiveIntensity={2} />
      {/* マウス */}
      <NoisyBox size={[0.04, 0.02, 0.06]} position={[0.05, 0.015, 0]} color="#374151" seed={551} />
    </group>
  );
}

// === ウェブカメラ ===
export function VoxelWebcam({}: Props) {
  return (
    <group>
      {/* 三脚ベース */}
      <NoisyBox size={[0.06, 0.02, 0.06]} position={[0, 0.01, 0]} color="#333" seed={560} metalness={0.4} />
      <NoisyCylinder args={[0.008, 0.008, 0.15, 4]} position={[0, 0.09, 0]} color="#555" seed={561} metalness={0.5} />
      {/* カメラ本体 */}
      <NoisyBox size={[0.06, 0.04, 0.04]} position={[0, 0.18, 0]} color="#1e1b4b" seed={562} />
      {/* レンズ */}
      <NoisyCylinder args={[0.012, 0.012, 0.01, 8]} position={[0, 0.18, 0.025]} color="#374151" seed={563} metalness={0.6} />
      {/* LED */}
      <EmissiveBox size={[0.008, 0.008, 0.005]} position={[0.02, 0.2, 0.021]} color="#22c55e" emissiveIntensity={3} />
    </group>
  );
}

// === ヘッドセットスタンド ===
export function VoxelHeadsetStand({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.1, 0.02, 0.1]} position={[0, 0.01, 0]} color="#374151" seed={570} metalness={0.4} />
      <NoisyCylinder args={[0.015, 0.015, 0.25, 6]} position={[0, 0.14, 0]} color="#555" seed={571} metalness={0.5} />
      {/* フック */}
      <NoisyBox size={[0.12, 0.02, 0.04]} position={[0, 0.27, 0]} color="#555" seed={572} metalness={0.5} />
      {/* ヘッドセット */}
      <mesh position={[0, 0.27, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.06, 0.015, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
      </mesh>
      {/* イヤーパッド */}
      <NoisyBox size={[0.04, 0.05, 0.03]} position={[-0.06, 0.22, 0]} color="#374151" seed={573} />
      <NoisyBox size={[0.04, 0.05, 0.03]} position={[0.06, 0.22, 0]} color="#374151" seed={574} />
    </group>
  );
}

// === ケーブルボックス ===
export function VoxelCableBox({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.25, 0.1, 0.1]} position={[0, 0.05, 0]} color="#f5f5f4" seed={580} lightnessSpread={0.08} />
      {/* 穴 */}
      <NoisyBox size={[0.03, 0.08, 0.005]} position={[0.11, 0.05, 0.05]} color="#d4d4d8" seed={581} />
      <NoisyBox size={[0.03, 0.08, 0.005]} position={[-0.11, 0.05, 0.05]} color="#d4d4d8" seed={582} />
      {/* ケーブル */}
      <NoisyCylinder args={[0.005, 0.005, 0.12, 4]} position={[0.13, 0.05, 0.08]} rotation={[Math.PI/2, 0, 0.3]} color="#333" seed={583} />
    </group>
  );
}

// === スタンディングデスク ===
export function VoxelStandingDesk({}: Props) {
  return (
    <group>
      {/* 天板 */}
      <NoisyBox size={[0.9, 0.05, 0.45]} position={[0, 0.75, 0]} color="#1e293b" seed={590} lightnessSpread={0.1} />
      {/* 脚（昇降式） */}
      <NoisyBox size={[0.06, 0.7, 0.06]} position={[-0.38, 0.35, -0.15]} color="#374151" seed={591} metalness={0.4} />
      <NoisyBox size={[0.06, 0.7, 0.06]} position={[0.38, 0.35, -0.15]} color="#374151" seed={592} metalness={0.4} />
      <NoisyBox size={[0.06, 0.7, 0.06]} position={[-0.38, 0.35, 0.15]} color="#374151" seed={593} metalness={0.4} />
      <NoisyBox size={[0.06, 0.7, 0.06]} position={[0.38, 0.35, 0.15]} color="#374151" seed={594} metalness={0.4} />
      {/* LED */}
      <EmissiveBox size={[0.8, 0.02, 0.01]} position={[0, 0.79, 0.22]} color="#7c3aed" emissiveIntensity={1.5} />
    </group>
  );
}

