/**
 * cocoro  E照明系家具 (Light) Phase 4
 * 色ノイズ入り�Eクセル  E9種
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FurnitureItem } from '@/types/cocoro';
import * as THREE from 'three';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from './VoxelBuilder';

interface Props { item: FurnitureItem; }

// === チE��クランチE===
export function VoxelLamp({ item }: Props) {
  const isOn = item.state?.isOn !== false;
  return (
    <group>
      <NoisyBox size={[0.12, 0.02, 0.12]} position={[0, 0.01, 0]} color="#374151" seed={600} metalness={0.5} />
      <NoisyCylinder args={[0.015, 0.015, 0.25, 6]} position={[0, 0.14, 0]} color="#555555" seed={601} metalness={0.5} />
      <NoisyCylinder args={[0.008, 0.008, 0.12, 4]} position={[0.04, 0.28, 0]} rotation={[0, 0, -0.5]} color="#555555" seed={602} metalness={0.5} />
      <NoisyBox size={[0.1, 0.06, 0.1]} position={[0.08, 0.34, 0]} color={isOn ? '#fef3c7' : '#555555'} seed={603} />
      {isOn && <pointLight position={[0.08, 0.35, 0]} color="#fde68a" intensity={1.5} distance={2} decay={2} />}
    </group>
  );
}

// === フロアランチE===
export function VoxelFloorLamp({ item }: Props) {
  const isOn = item.state?.isOn !== false;
  return (
    <group>
      <NoisyBox size={[0.2, 0.04, 0.2]} position={[0, 0.02, 0]} color="#374151" seed={610} metalness={0.4} />
      <NoisyCylinder args={[0.02, 0.02, 1.2, 6]} position={[0, 0.62, 0]} color="#555555" seed={611} metalness={0.4} />
      <NoisyBox size={[0.2, 0.12, 0.2]} position={[0, 1.28, 0]} color={isOn ? '#fef3c7' : '#6b7280'} seed={612} lightnessSpread={0.15} />
      {isOn && <pointLight position={[0, 1.4, 0]} color="#fde68a" intensity={2} distance={3} decay={2} />}
    </group>
  );
}

// === ネオンサイン (壁掛ぁE ===
export function VoxelNeonSign({}: Props) {
  const neonRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (neonRef.current) {
      const mat = neonRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.5 + Math.sin(clock.elapsedTime * 1.5) * 0.5;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.8, 0.35, 0.03]} position={[0, 0, 0]} color="#0f172a" seed={620} />
      <mesh ref={neonRef} position={[0, 0, 0.02]}>
        <boxGeometry args={[0.6, 0.12, 0.02]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.15]} color="#06b6d4" intensity={2} distance={3} decay={2} />
    </group>
  );
}

// === ネオンハ�EチE(壁掛ぁE ===
export function VoxelNeonHeart({}: Props) {
  const heartRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (heartRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.05;
      heartRef.current.scale.set(s, s, 1);
    }
  });
  return (
    <group>
      <NoisyBox size={[0.4, 0.4, 0.03]} position={[0, 0, 0]} color="#0f172a" seed={630} />
      <group ref={heartRef}>
        {/* ハ�Eト形を�Eクセルで表現 */}
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[-0.08, 0.08, 0.02]} color="#f472b6" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0.08, 0.08, 0.02]} color="#f472b6" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[-0.16, 0.02, 0.02]} color="#f472b6" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0.16, 0.02, 0.02]} color="#f472b6" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[-0.08, 0, 0.02]} color="#ec4899" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0.08, 0, 0.02]} color="#ec4899" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0, -0.06, 0.02]} color="#ec4899" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0, 0.06, 0.02]} color="#f472b6" emissiveIntensity={3} />
        <EmissiveBox size={[0.08, 0.08, 0.025]} position={[0, -0.14, 0.02]} color="#db2777" emissiveIntensity={2.5} />
      </group>
      <pointLight position={[0, 0, 0.15]} color="#f472b6" intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

// === ネオンスター (壁掛ぁE ===
export function VoxelNeonStar({}: Props) {
  const starRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (starRef.current) {
      starRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.4, 0.4, 0.03]} position={[0, 0, 0]} color="#0f172a" seed={640} />
      <group ref={starRef}>
        {/* 星をボクセルで構�E */}
        <EmissiveBox size={[0.06, 0.2, 0.025]} position={[0, 0, 0.02]} color="#fbbf24" emissiveIntensity={3} />
        <EmissiveBox size={[0.2, 0.06, 0.025]} position={[0, 0, 0.02]} color="#fbbf24" emissiveIntensity={3} />
        <EmissiveBox size={[0.06, 0.06, 0.025]} position={[-0.06, 0.06, 0.02]} color="#f59e0b" emissiveIntensity={2.5} />
        <EmissiveBox size={[0.06, 0.06, 0.025]} position={[0.06, 0.06, 0.02]} color="#f59e0b" emissiveIntensity={2.5} />
        <EmissiveBox size={[0.06, 0.06, 0.025]} position={[-0.06, -0.06, 0.02]} color="#f59e0b" emissiveIntensity={2.5} />
        <EmissiveBox size={[0.06, 0.06, 0.025]} position={[0.06, -0.06, 0.02]} color="#f59e0b" emissiveIntensity={2.5} />
      </group>
      <pointLight position={[0, 0, 0.15]} color="#fbbf24" intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

// === ラバランチE===
export function VoxelLavaLamp({}: Props) {
  const blobRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (blobRef.current) {
      const t = clock.elapsedTime;
      blobRef.current.position.y = 0.2 + Math.sin(t * 0.8) * 0.08;
      blobRef.current.scale.x = 1 + Math.sin(t * 1.2) * 0.15;
      blobRef.current.scale.z = 1 + Math.cos(t * 1.2) * 0.15;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.08, 0.03, 0.08]} position={[0, 0.015, 0]} color="#374151" seed={650} metalness={0.5} />
      <NoisyCylinder args={[0.04, 0.05, 0.35, 8]} position={[0, 0.19, 0]} color="#4c1d95" seed={651} lightnessSpread={0.1} />
      <mesh ref={blobRef} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={1.5} transparent opacity={0.8} />
      </mesh>
      <NoisyBox size={[0.06, 0.04, 0.06]} position={[0, 0.38, 0]} color="#374151" seed={652} metalness={0.4} />
      <pointLight position={[0, 0.2, 0.1]} color="#a855f7" intensity={0.5} distance={1.5} decay={2} />
    </group>
  );
}

// === ストリングライチE(壁掛ぁE ===
export function VoxelStringLights({}: Props) {
  const lightsRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (lightsRef.current) {
      lightsRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 2 + i * 1.5) * 0.8;
        }
      });
    }
  });
  const colors = ['#fbbf24', '#f472b6', '#67e8f9', '#22c55e', '#a78bfa', '#fbbf24', '#f472b6'];
  return (
    <group>
      {/* ワイヤー */}
      <NoisyBox size={[0.8, 0.005, 0.005]} position={[0, 0.02, 0.01]} color="#333333" seed={660} />
      {/* 電琁E*/}
      <group ref={lightsRef}>
        {colors.map((c, i) => (
          <mesh key={i} position={[-0.36 + i * 0.12, -0.02 + Math.sin(i * 0.8) * 0.01, 0.015]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// === ペンダントライチE===
export function VoxelPendantLight({}: Props) {
  return (
    <group>
      <NoisyCylinder args={[0.005, 0.005, 0.4, 4]} position={[0, 0.8, 0]} color="#333333" seed={670} metalness={0.5} />
      <NoisyBox size={[0.22, 0.12, 0.22]} position={[0, 0.56, 0]} color="#1e293b" seed={671} metalness={0.3} />
      <EmissiveBox size={[0.18, 0.005, 0.18]} position={[0, 0.495, 0]} color="#fde68a" emissiveIntensity={3} />
      <pointLight position={[0, 0.45, 0]} color="#fde68a" intensity={2.5} distance={3} decay={2} />
    </group>
  );
}

// === キャンドルセット ===
export function VoxelCandleSet({}: Props) {
  const flame1 = useRef<THREE.Mesh>(null!);
  const flame2 = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    [flame1, flame2].forEach((ref, i) => {
      if (ref.current) {
        const s = 1 + Math.sin(clock.elapsedTime * 5 + i * 2) * 0.2;
        ref.current.scale.set(s, 1 + Math.sin(clock.elapsedTime * 7 + i) * 0.3, s);
      }
    });
  });
  return (
    <group>
      <NoisyBox size={[0.2, 0.02, 0.1]} position={[0, 0.01, 0]} color="#78350f" seed={680} />
      <NoisyCylinder args={[0.025, 0.025, 0.12, 8]} position={[-0.04, 0.08, 0]} color="#fef3c7" seed={681} />
      <mesh ref={flame1} position={[-0.04, 0.16, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <NoisyCylinder args={[0.018, 0.018, 0.08, 8]} position={[0.04, 0.06, 0]} color="#fef3c7" seed={682} />
      <mesh ref={flame2} position={[0.04, 0.12, 0]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.15, 0.05]} color="#fbbf24" intensity={0.8} distance={1.5} decay={2} />
    </group>
  );
}

// === ミラーボール ===
export function VoxelDiscoBall({}: Props) {
  const ballRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ballRef.current) {
      ballRef.current.rotation.y = clock.elapsedTime * 0.8;
    }
  });
  return (
    <group>
      <NoisyCylinder args={[0.005, 0.005, 0.3, 4]} position={[0, 0.85, 0]} color="#999" seed={690} metalness={0.6} />
      <mesh ref={ballRef} position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.05} />
      </mesh>
      <pointLight position={[0, 0.65, 0]} color="#f472b6" intensity={1} distance={3} decay={2} />
    </group>
  );
}

// === スポットライト ===
export function VoxelSpotLight({}: Props) {
  return (
    <group>
      <NoisyCylinder args={[0.02, 0.02, 0.6, 6]} position={[0, 0.3, 0]} color="#555" seed={700} metalness={0.5} />
      <NoisyBox size={[0.12, 0.02, 0.12]} position={[0, 0.01, 0]} color="#374151" seed={701} metalness={0.4} />
      <NoisyCylinder args={[0.06, 0.04, 0.1, 8]} position={[0, 0.65, 0]} rotation={[0.3, 0, 0]} color="#1e293b" seed={702} metalness={0.3} />
      <pointLight position={[0, 0.65, 0.1]} color="#fde68a" intensity={2} distance={3} decay={2} />
    </group>
  );
}

// === LEDストリップ (壁掛け) ===
export function VoxelLEDStrip({}: Props) {
  const ledRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      const hue = (clock.elapsedTime * 0.15) % 1;
      mat.color.setHSL(hue, 0.9, 0.5);
      mat.emissive.setHSL(hue, 0.9, 0.5);
    }
  });
  return (
    <group>
      <mesh ref={ledRef} position={[0, 0, 0.01]}>
        <boxGeometry args={[0.8, 0.02, 0.01]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

// === 提灯 ===
export function VoxelPaperLantern({}: Props) {
  return (
    <group>
      <NoisyCylinder args={[0.005, 0.005, 0.15, 4]} position={[0, 0.4, 0]} color="#333" seed={710} />
      <NoisySphere args={[0.1, 10, 8]} position={[0, 0.25, 0]} color="#dc2626" seed={711} lightnessSpread={0.15} />
      <NoisyBox size={[0.06, 0.02, 0.06]} position={[0, 0.35, 0]} color="#1e293b" seed={712} />
      <NoisyBox size={[0.06, 0.02, 0.06]} position={[0, 0.15, 0]} color="#1e293b" seed={713} />
      <pointLight position={[0, 0.25, 0]} color="#fbbf24" intensity={0.8} distance={1.5} decay={2} />
    </group>
  );
}

// === 光る瓶 ===
export function VoxelFairyJar({}: Props) {
  const glowRef = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.3;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 8]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} roughness={0.05} />
      </mesh>
      <NoisyBox size={[0.06, 0.02, 0.06]} position={[0, 0.15, 0]} color="#78350f" seed={720} />
      <EmissiveBox size={[0.02, 0.02, 0.02]} position={[0.01, 0.08, 0.01]} color="#fbbf24" emissiveIntensity={3} />
      <EmissiveBox size={[0.015, 0.015, 0.015]} position={[-0.02, 0.1, -0.01]} color="#22c55e" emissiveIntensity={2} />
      <pointLight ref={glowRef} position={[0, 0.08, 0]} color="#fbbf24" intensity={0.5} distance={1} decay={2} />
    </group>
  );
}

// === ムーンライト ===
export function VoxelMoonLight({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.06, 0.02, 0.06]} position={[0, 0.01, 0]} color="#374151" seed={730} metalness={0.4} />
      <NoisyCylinder args={[0.008, 0.008, 0.06, 4]} position={[0, 0.04, 0]} color="#555" seed={731} metalness={0.5} />
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 0.15, 0]} color="#fde68a" intensity={1} distance={2} decay={2} />
    </group>
  );
}

// === スタープロジェクター ===
export function VoxelStarProjector({}: Props) {
  const projRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (projRef.current) {
      projRef.current.rotation.y = clock.elapsedTime * 0.3;
    }
  });
  return (
    <group>
      <NoisyBox size={[0.08, 0.02, 0.08]} position={[0, 0.01, 0]} color="#1e1b4b" seed={740} />
      <NoisyCylinder args={[0.04, 0.03, 0.12, 8]} position={[0, 0.08, 0]} color="#1e293b" seed={741} />
      <group ref={projRef} position={[0, 0.15, 0]}>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const r = deg * Math.PI / 180;
          return (
            <EmissiveBox key={i} size={[0.005, 0.005, 0.04]}
              position={[Math.cos(r) * 0.03, 0, Math.sin(r) * 0.03]}
              rotation={[0, r, 0]}
              color={['#fbbf24', '#67e8f9', '#f472b6', '#22c55e', '#a78bfa', '#fbbf24'][i]}
              emissiveIntensity={3} />
          );
        })}
      </group>
      <pointLight position={[0, 0.15, 0]} color="#a78bfa" intensity={0.5} distance={3} decay={2} />
    </group>
  );
}

// === 暖炉 ===
export function VoxelFireplace({}: Props) {
  const flameRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.15;
      flameRef.current.scale.set(s, 1 + Math.sin(clock.elapsedTime * 7) * 0.2, s);
    }
  });
  return (
    <group>
      {/* 外枠 */}
      <NoisyBox size={[0.8, 0.7, 0.4]} position={[0, 0.35, 0]} color="#78350f" seed={750} lightnessSpread={0.15} />
      {/* 内部 */}
      <NoisyBox size={[0.55, 0.45, 0.3]} position={[0, 0.28, 0.06]} color="#1e1b4b" seed={751} />
      {/* 薪 */}
      <NoisyCylinder args={[0.04, 0.03, 0.35, 6]} position={[0, 0.12, 0.08]} rotation={[0, 0, Math.PI/2]} color="#92400e" seed={752} />
      <NoisyCylinder args={[0.03, 0.025, 0.3, 6]} position={[0.05, 0.18, 0.08]} rotation={[0, 0.4, Math.PI/2]} color="#78350f" seed={753} />
      {/* 炎 */}
      <mesh ref={flameRef} position={[0, 0.28, 0.08]}>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={3} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 0.3, 0.2]} color="#f97316" intensity={2} distance={3} decay={2} />
    </group>
  );
}

// === 松明 (壁掛け) ===
export function VoxelTorch({}: Props) {
  const flameRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.2;
      flameRef.current.scale.set(s, 1 + Math.sin(clock.elapsedTime * 8) * 0.25, s);
    }
  });
  return (
    <group>
      <NoisyBox size={[0.04, 0.2, 0.04]} position={[0, -0.05, 0]} color="#78350f" seed={760} lightnessSpread={0.2} />
      <mesh ref={flameRef} position={[0, 0.1, 0.02]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.1, 0.05]} color="#f97316" intensity={1} distance={2} decay={2} />
    </group>
  );
}

// === ランタン ===
export function VoxelLantern({}: Props) {
  return (
    <group>
      <NoisyBox size={[0.08, 0.02, 0.08]} position={[0, 0.01, 0]} color="#374151" seed={770} metalness={0.5} />
      <NoisyBox size={[0.06, 0.12, 0.06]} position={[0, 0.08, 0]} color="#fef3c7" seed={771} />
      <NoisyBox size={[0.07, 0.02, 0.07]} position={[0, 0.15, 0]} color="#374151" seed={772} metalness={0.5} />
      <NoisyBox size={[0.02, 0.03, 0.02]} position={[0, 0.175, 0]} color="#555" seed={773} metalness={0.5} />
      <EmissiveBox size={[0.03, 0.06, 0.03]} position={[0, 0.08, 0]} color="#fbbf24" emissiveIntensity={2} />
      <pointLight position={[0, 0.08, 0]} color="#fbbf24" intensity={0.6} distance={1.5} decay={2} />
    </group>
  );
}

// === ネオンイナズマ (壁掛け) ===
export function VoxelNeonLightning({}: Props) {
  const boltRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (boltRef.current) {
      boltRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 4) * 1;
        }
      });
    }
  });
  return (
    <group>
      <NoisyBox size={[0.3, 0.4, 0.03]} position={[0, 0, 0]} color="#0f172a" seed={780} />
      <group ref={boltRef}>
        <EmissiveBox size={[0.06, 0.08, 0.025]} position={[0, 0.1, 0.02]} color="#eab308" emissiveIntensity={3} />
        <EmissiveBox size={[0.06, 0.08, 0.025]} position={[-0.04, 0.02, 0.02]} color="#fbbf24" emissiveIntensity={3} />
        <EmissiveBox size={[0.06, 0.08, 0.025]} position={[0.02, -0.06, 0.02]} color="#eab308" emissiveIntensity={3} />
        <EmissiveBox size={[0.04, 0.06, 0.025]} position={[-0.02, -0.12, 0.02]} color="#fbbf24" emissiveIntensity={2.5} />
      </group>
      <pointLight position={[0, 0, 0.15]} color="#eab308" intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

