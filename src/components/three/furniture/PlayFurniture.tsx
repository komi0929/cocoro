/**
 * cocoro  E遊�E系家具 (Play) Phase 4
 * 色ノイズ入り�Eクセル  E11種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// === アーケード筐佁E===
export function VoxelArcade({}: Props) {
  const screenRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.6, 1.5, 0.5]} position={[0, 0.75, 0]} color="#1e1b4b" seed={200} lightnessSpread={0.1} />
      <mesh ref={screenRef} position={[0, 1.0, 0.26]}>
        <boxGeometry args={[0.4, 0.35, 0.01]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.5} />
      </mesh>
      <NoisyBox size={[0.44, 0.39, 0.005]} position={[0, 1.0, 0.255]} color="#0f172a" seed={201} />
      <EmissiveBox size={[0.5, 0.15, 0.02]} position={[0, 1.35, 0.26]} color="#f43f5e" emissiveIntensity={1} />
      <NoisyBox size={[0.5, 0.2, 0.02]} position={[0, 0.6, 0.26]} rotation={[-0.3, 0, 0]} color="#1e293b" seed={202} metalness={0.3} />
      {/* ジョイスチE��チE�� */}
      <NoisyCylinder args={[0.015, 0.015, 0.08, 6]} position={[-0.1, 0.68, 0.3]} color="#ef4444" seed={203} />
      <NoisySphere args={[0.025, 6, 6]} position={[-0.1, 0.73, 0.3]} color="#ef4444" seed={204} />
      {/* ボタン */}
      {[0.05, 0.12, 0.19].map((x, i) => (
        <NoisyCylinder key={i} args={[0.02, 0.02, 0.02, 8]} position={[x, 0.65, 0.3]} color={['#fbbf24', '#22c55e', '#3b82f6'][i]} seed={205+i} />
      ))}
      <pointLight position={[0, 1.0, 0.5]} color="#06b6d4" intensity={0.5} distance={1.5} decay={2} />
    </group>
  );
}

// === スケボ�E ===
export function VoxelSkateboard({}: Props) {
  return (
    <group rotation={[0, 0.4, 0]}>
      <NoisyBox size={[0.6, 0.02, 0.15]} position={[0, 0.06, 0]} color="#7c3aed" seed={210} lightnessSpread={0.15} />
      <NoisyBox size={[0.08, 0.02, 0.15]} position={[0.28, 0.09, 0]} rotation={[0, 0, 0.3]} color="#7c3aed" seed={211} />
      <NoisyBox size={[0.08, 0.02, 0.15]} position={[-0.28, 0.09, 0]} rotation={[0, 0, -0.3]} color="#7c3aed" seed={212} />
      {[-0.15, 0.15].map((x, i) => (
        <NoisyBox key={i} size={[0.04, 0.02, 0.12]} position={[x, 0.03, 0]} color="#888888" seed={213+i} metalness={0.7} />
      ))}
      {[[-0.15, 0.02, 0.06], [-0.15, 0.02, -0.06], [0.15, 0.02, 0.06], [0.15, 0.02, -0.06]].map((p, i) => (
        <NoisyCylinder key={i} args={[0.02, 0.02, 0.015, 8]} position={p as [number,number,number]} rotation={[Math.PI/2,0,0]} color="#fbbf24" seed={215+i} />
      ))}
      <NoisyBox size={[0.4, 0.001, 0.03]} position={[0, 0.072, 0]} color="#f43f5e" seed={220} />
    </group>
  );
}

// === DJブ�Eス ===
export function VoxelDJBooth({}: Props) {
  const ledRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      const hue = (clock.elapsedTime * 0.2) % 1;
      mat.color.setHSL(hue, 0.9, 0.5);
      mat.emissive.setHSL(hue, 0.9, 0.5);
    }
  });
  return (
    <group>
      <NoisyBox size={[1.0, 0.06, 0.6]} position={[0, 0.45, 0]} color="#1e1b4b" seed={230} metalness={0.3} />
      <NoisyBox size={[0.9, 0.42, 0.5]} position={[0, 0.22, 0]} color="#0f172a" seed={231} />
      {/* ターンチE�Eブル */}
      {[-0.25, 0.25].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.505, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.04, 12]} />
            <meshStandardMaterial color={i === 0 ? '#ef4444' : '#3b82f6'} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <NoisyBox size={[0.15, 0.02, 0.25]} position={[0, 0.5, 0]} color="#1f2937" seed={232} metalness={0.3} />
      {[-0.03, 0, 0.03].map((x, i) => (
        <NoisyBox key={i} size={[0.015, 0.015, 0.06]} position={[x, 0.52, 0.05]} color="#fbbf24" seed={233+i} />
      ))}
      <mesh ref={ledRef} position={[0, 0.01, 0.26]}>
        <boxGeometry args={[0.88, 0.15, 0.01]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1.5} />
      </mesh>
      {/* ヘッド�Eン */}
      <mesh position={[0.4, 0.56, 0.15]} rotation={[0, 0, 0.2]} castShadow>
        <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.4} />
      </mesh>
    </group>
  );
}

// === ピザの箱 ===
export function VoxelPizzaBox({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.35, 0.05, 0.35]} position={[0, 0.025, 0]} color="#d97706" seed={240} lightnessSpread={0.18} />
      <NoisyBox size={[0.35, 0.05, 0.35]} position={[0, 0.08, 0]} color="#b45309" seed={241} lightnessSpread={0.18} />
      <NoisyBox size={[0.35, 0.02, 0.35]} position={[0, 0.12, -0.12]} rotation={[-0.3, 0, 0]} color="#d97706" seed={242} />
      <mesh position={[0, 0.1, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 8]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.8} />
      </mesh>
    </group>
  );
}

// === バスケチE��ボ�Eル ===
export function VoxelBasketball({}: Props) {
  return (
    <group>
      <NoisySphere args={[0.12, 12, 12]} position={[0, 0.12, 0]} color="#ea580c" seed={250} lightnessSpread={0.15} />
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.121, 0.003, 4, 16]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.121, 0.003, 4, 16]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
      </mesh>
    </group>
  );
}

// === ギター ===
export function VoxelGuitar({}: Props) {
  return (
    <group rotation={[0, 0, 0.15]}>
      <NoisyCylinder args={[0.015, 0.02, 0.6, 4]} position={[0, 0.3, 0]} color="#555555" seed={260} metalness={0.5} />
      {[-0.08, 0.08].map((z, i) => (
        <NoisyBox key={i} size={[0.03, 0.02, 0.04]} position={[0, 0.02, z]} color="#555555" seed={261+i} metalness={0.5} />
      ))}
      <NoisyBox size={[0.25, 0.04, 0.3]} position={[0.02, 0.25, 0]} color="#dc2626" seed={263} lightnessSpread={0.12} />
      <NoisyBox size={[0.04, 0.45, 0.06]} position={[0, 0.55, 0]} color="#78350f" seed={264} lightnessSpread={0.15} />
      <NoisyBox size={[0.06, 0.08, 0.08]} position={[0, 0.8, 0]} color="#78350f" seed={265} />
      {[-0.02, 0, 0.02].map((z, i) => (
        <NoisyCylinder key={i} args={[0.006, 0.006, 0.03, 4]} position={[0.04, 0.78 + i * 0.025, z]} rotation={[0, 0, Math.PI / 2]} color="#cccccc" seed={266+i} metalness={0.7} />
      ))}
      <mesh position={[0.02, 0.25, 0.021]}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
    </group>
  );
}

// === ブ�Eムボックス ===
export function VoxelBoombox({}: Props) {
  const speakerRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (speakerRef.current) {
      speakerRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 8) * 0.02;
      speakerRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 8) * 0.02;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.5, 0.22, 0.18]} position={[0, 0.12, 0]} color="#1e293b" seed={270} metalness={0.2} />
      <mesh position={[-0.15, 0.12, 0.091]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh ref={speakerRef} position={[0.15, 0.12, 0.091]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.4} />
      </mesh>
      <NoisyBox size={[0.08, 0.05, 0.005]} position={[0, 0.14, 0.091]} color="#0f172a" seed={271} />
      <NoisyBox size={[0.3, 0.02, 0.02]} position={[0, 0.24, 0]} color="#6b7280" seed={272} metalness={0.6} />
      <EmissiveBox size={[0.1, 0.015, 0.003]} position={[0, 0.2, 0.091]} color="#22c55e" emissiveIntensity={2} />
    </group>
  );
}

// === 巨大スピ�Eカー ===
export function VoxelBigSpeaker({}: Props) {
  const coneRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (coneRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.015;
      coneRef.current.scale.set(s, s, 1);
    }
  });
  return (
    <group>
      <NoisyBox size={[0.5, 0.9, 0.4]} position={[0, 0.45, 0]} color="#1e1b4b" seed={280} lightnessSpread={0.1} />
      {/* 大ウーファー */}
      <mesh ref={coneRef} position={[0, 0.35, 0.201]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* チE��ーター */}
      <mesh position={[0, 0.7, 0.201]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#555555" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* LED */}
      <EmissiveBox size={[0.4, 0.02, 0.01]} position={[0, 0.88, 0.201]} color="#7c3aed" emissiveIntensity={2} />
      {/* 脁E*/}
      <NoisyBox size={[0.45, 0.04, 0.35]} position={[0, 0.02, 0]} color="#0f172a" seed={281} />
    </group>
  );
}

// === ピンボ�Eル ===
export function VoxelPinball({}: Props) {
  const flashRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1 + Math.sin(clock.elapsedTime * 5) * 0.8;
    }
  });
  return (
    <group>
      {/* ボディ */}
      <NoisyBox size={[0.5, 0.08, 0.9]} position={[0, 0.4, 0]} rotation={[-0.15, 0, 0]} color="#1e1b4b" seed={290} />
      {/* 脁E*/}
      <NoisyBox size={[0.45, 0.35, 0.4]} position={[0, 0.18, 0.15]} color="#0f172a" seed={291} />
      {/* バックボックス */}
      <NoisyBox size={[0.48, 0.45, 0.08]} position={[0, 0.7, -0.4]} color="#1e1b4b" seed={292} />
      {/* スコアスクリーン */}
      <mesh ref={flashRef} position={[0, 0.78, -0.355]}>
        <boxGeometry args={[0.35, 0.2, 0.01]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1} />
      </mesh>
      {/* バンパ�E */}
      <NoisySphere args={[0.03, 6, 6]} position={[-0.1, 0.48, -0.1]} color="#fbbf24" seed={293} />
      <NoisySphere args={[0.03, 6, 6]} position={[0.1, 0.48, -0.15]} color="#ef4444" seed={294} />
      <NoisySphere args={[0.03, 6, 6]} position={[0, 0.48, 0.05]} color="#22c55e" seed={295} />
    </group>
  );
}

// === レコード�Eレイヤー ===
export function VoxelVinylPlayer({}: Props) {
  const discRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (discRef.current) {
      discRef.current.rotation.z = clock.elapsedTime * 0.5;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.4, 0.06, 0.35]} position={[0, 0.03, 0]} color="#78350f" seed={300} lightnessSpread={0.15} />
      <NoisyBox size={[0.38, 0.02, 0.33]} position={[0, 0.07, 0]} color="#1e1b4b" seed={301} />
      <mesh ref={discRef} position={[-0.02, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-0.02, 0.086, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* ト�Eンアーム */}
      <NoisyCylinder args={[0.004, 0.004, 0.15, 4]} position={[0.14, 0.1, -0.05]} rotation={[0, 0.5, 0.3]} color="#cccccc" seed={302} metalness={0.7} />
    </group>
  );
}

// === スポンジ剣 ===
export function VoxelFoamSword({}: Props) {
  return (
    <group rotation={[0, 0.3, 0.5]}>
      <NoisyBox size={[0.06, 0.5, 0.04]} position={[0, 0.35, 0]} color="#3b82f6" seed={310} lightnessSpread={0.2} />
      <NoisyBox size={[0.04, 0.12, 0.04]} position={[0, 0.07, 0]} color="#92400e" seed={311} />
      <NoisyBox size={[0.14, 0.04, 0.04]} position={[0, 0.14, 0]} color="#fbbf24" seed={312} />
    </group>
  );
}

// === ダーツボード (壁掛け) ===
export function VoxelDartBoard({}: Props) {
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <circleGeometry args={[0.2, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* リングス */}
      {[0.18, 0.14, 0.1, 0.06].map((r, i) => (
        <mesh key={i} position={[0, 0, 0.004 + i * 0.001]}>
          <ringGeometry args={[r - 0.03, r, 20]} />
          <meshStandardMaterial color={['#dc2626', '#22c55e', '#dc2626', '#22c55e'][i]} roughness={0.6} />
        </mesh>
      ))}
      {/* ブル */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.02, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* ダーツ */}
      <NoisyBox size={[0.01, 0.01, 0.08]} position={[0.05, 0.03, 0.04]} rotation={[Math.PI * 0.1, 0, 0]} color="#fbbf24" seed={320} />
    </group>
  );
}

// === ビリヤード台 ===
export function VoxelPoolTable({}: Props) {
  return (
    <group>
      {/* テーブル */}
      <NoisyBox size={[1.2, 0.08, 0.7]} position={[0, 0.5, 0]} color="#15803d" seed={330} lightnessSpread={0.12} />
      {/* フレーム */}
      <NoisyBox size={[1.25, 0.12, 0.04]} position={[0, 0.48, 0.34]} color="#78350f" seed={331} />
      <NoisyBox size={[1.25, 0.12, 0.04]} position={[0, 0.48, -0.34]} color="#78350f" seed={332} />
      <NoisyBox size={[0.04, 0.12, 0.7]} position={[0.6, 0.48, 0]} color="#78350f" seed={333} />
      <NoisyBox size={[0.04, 0.12, 0.7]} position={[-0.6, 0.48, 0]} color="#78350f" seed={334} />
      {/* 脚 */}
      {[[-0.5, 0.21, -0.25], [0.5, 0.21, -0.25], [-0.5, 0.21, 0.25], [0.5, 0.21, 0.25]].map((p, i) => (
        <NoisyBox key={i} size={[0.08, 0.42, 0.08]} position={p as [number,number,number]} color="#5c3a1e" seed={335+i} />
      ))}
      {/* ボール */}
      {[[-0.2, 0.57, 0], [0.1, 0.57, 0.05], [0.15, 0.57, -0.08]].map((p, i) => (
        <NoisySphere key={i} args={[0.02, 8, 6]} position={p as [number,number,number]} color={['#fbbf24', '#dc2626', '#1e40af'][i]} seed={340+i} />
      ))}
    </group>
  );
}

// === カラオケマイク ===
export function VoxelKaraokeMic({}: Props) {
  return (
    <group>
      {/* スタンド */}
      <NoisyBox size={[0.15, 0.02, 0.15]} position={[0, 0.01, 0]} color="#333" seed={350} metalness={0.5} />
      <NoisyCylinder args={[0.015, 0.015, 0.9, 6]} position={[0, 0.46, 0]} color="#555" seed={351} metalness={0.5} />
      {/* マイク */}
      <NoisySphere args={[0.04, 8, 8]} position={[0, 0.95, 0]} color="#374151" seed={352} />
      <NoisyCylinder args={[0.02, 0.02, 0.08, 6]} position={[0, 0.88, 0]} color="#555" seed={353} metalness={0.5} />
    </group>
  );
}

// === ドラムセット ===
export function VoxelDrumSet({}: Props) {
  return (
    <group>
      {/* バスドラム */}
      <NoisyCylinder args={[0.2, 0.2, 0.15, 12]} position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]} color="#dc2626" seed={360} />
      {/* スネア */}
      <NoisyCylinder args={[0.1, 0.1, 0.06, 10]} position={[-0.2, 0.4, 0.15]} color="#e5e7eb" seed={361} metalness={0.4} />
      {/* ハイハット */}
      <NoisyCylinder args={[0.08, 0.08, 0.01, 10]} position={[-0.35, 0.5, 0.1]} color="#fbbf24" seed={362} metalness={0.6} />
      <NoisyCylinder args={[0.01, 0.01, 0.5, 4]} position={[-0.35, 0.25, 0.1]} color="#999" seed={363} metalness={0.5} />
      {/* ハイタム */}
      <NoisyCylinder args={[0.08, 0.08, 0.06, 10]} position={[0.15, 0.38, 0.1]} color="#dc2626" seed={364} />
      {/* シンバル */}
      <NoisyCylinder args={[0.12, 0.12, 0.01, 12]} position={[0.3, 0.55, 0]} color="#eab308" seed={365} metalness={0.6} />
      <NoisyCylinder args={[0.01, 0.01, 0.55, 4]} position={[0.3, 0.27, 0]} color="#999" seed={366} metalness={0.5} />
    </group>
  );
}

// === サッカーボール ===
export function VoxelSoccerBall({}: Props) {
  return (
    <group>
      <NoisySphere args={[0.12, 12, 12]} position={[0, 0.12, 0]} color="#f5f5f4" seed={370} lightnessSpread={0.08} />
      {/* 黒パッチ */}
      {[[0, 0.24, 0], [0.08, 0.12, 0.08], [-0.08, 0.12, -0.08]].map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// === ボードゲーム ===
export function VoxelBoardGame({}: Props) {
  return (
    <group>
      {/* ボード */}
      <NoisyBox size={[0.35, 0.02, 0.35]} position={[0, 0.01, 0]} color="#78350f" seed={380} lightnessSpread={0.15} />
      {/* グリッド */}
      <NoisyBox size={[0.3, 0.005, 0.3]} position={[0, 0.02, 0]} color="#fef3c7" seed={381} />
      {/* コマ */}
      <NoisyCylinder args={[0.02, 0.02, 0.03, 6]} position={[-0.08, 0.04, 0.05]} color="#dc2626" seed={382} />
      <NoisyCylinder args={[0.02, 0.02, 0.03, 6]} position={[0.06, 0.04, -0.08]} color="#3b82f6" seed={383} />
      <NoisyCylinder args={[0.02, 0.02, 0.03, 6]} position={[0.1, 0.04, 0.1]} color="#22c55e" seed={384} />
      {/* サイコロ */}
      <NoisyBox size={[0.03, 0.03, 0.03]} position={[0.15, 0.025, 0.15]} color="#f5f5f4" seed={385} />
    </group>
  );
}

// === VRヘッドセット ===
export function VoxelVRHeadset({}: Props) {
  return (
    <group>
      {/* スタンド */}
      <NoisyBox size={[0.1, 0.02, 0.1]} position={[0, 0.01, 0]} color="#374151" seed={390} metalness={0.4} />
      <NoisyCylinder args={[0.015, 0.015, 0.2, 6]} position={[0, 0.12, 0]} color="#555" seed={391} metalness={0.5} />
      {/* ヘッドセット */}
      <NoisyBox size={[0.16, 0.1, 0.1]} position={[0, 0.27, 0]} color="#1e1b4b" seed={392} />
      {/* レンズ部分 */}
      <NoisyBox size={[0.14, 0.06, 0.02]} position={[0, 0.27, 0.06]} color="#0f172a" seed={393} />
      {/* バンド */}
      <NoisyBox size={[0.16, 0.03, 0.005]} position={[0, 0.32, -0.04]} color="#374151" seed={394} />
    </group>
  );
}

// === トランポリン ===
export function VoxelTrampoline({}: Props) {
  return (
    <group>
      {/* フレーム（円形） */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.03, 8, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* マット */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.33, 16]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.8} />
      </mesh>
      {/* 脚 */}
      {[0, 120, 240].map((deg, i) => {
        const r = deg * Math.PI / 180;
        return (
          <NoisyCylinder key={i} args={[0.02, 0.02, 0.15, 6]}
            position={[Math.cos(r) * 0.3, 0.07, Math.sin(r) * 0.3]}
            color="#555" seed={396+i} metalness={0.5} />
        );
      })}
    </group>
  );
}

// === パンチングバッグ ===
export function VoxelPunchingBag({}: Props) {
  return (
    <group>
      {/* ベース */}
      <NoisyCylinder args={[0.2, 0.25, 0.06, 12]} position={[0, 0.03, 0]} color="#374151" seed={400} metalness={0.4} />
      {/* ポール */}
      <NoisyCylinder args={[0.02, 0.02, 0.8, 6]} position={[0, 0.43, 0]} color="#999" seed={401} metalness={0.6} />
      {/* バッグ */}
      <NoisyCylinder args={[0.12, 0.1, 0.35, 10]} position={[0, 1.0, 0]} color="#dc2626" seed={402} lightnessSpread={0.15} />
    </group>
  );
}

