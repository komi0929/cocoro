/**
 * cocoro  EVoxel Items (Phase 5)
 * 5種のボクセルアクセサリーアイチE��
 * Box絁E��合わせで構�E、アバターの手や顔に裁E��
 */

import { useMemo } from 'react';
import type { AvatarItemType } from '@/types/cocoro';

/** 木の剣�E�E��ニカム盾 */
function SwordAndShield() {
  return (
    <group>
      {/* 右手�E剣 */}
      <group position={[0.42, 0.35, 0.1]}>
        {/* 刁E*/}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.03]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* 柁E*/}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.05, 0.12, 0.05]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        {/* 鍁E*/}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.14, 0.03, 0.05]} />
          <meshStandardMaterial color="#DAA520" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      {/* 左手�E盾�E��E角形風�E�E*/}
      <group position={[-0.42, 0.35, 0.1]}>
        <mesh>
          <boxGeometry args={[0.25, 0.3, 0.04]} />
          <meshStandardMaterial color="#DAA520" roughness={0.6} />
        </mesh>
        {/* ハニカムチE��チE�Eル */}
        <mesh position={[0, 0.05, 0.025]}>
          <boxGeometry args={[0.12, 0.12, 0.01]} />
          <meshStandardMaterial color="#FFD700" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0.025]}>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color="#FFC107" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** スケボ�E�E�小脇に抱え！E*/
function Skateboard() {
  return (
    <group position={[-0.38, 0.2, 0]} rotation={[0.3, 0, 0.8]}>
      {/* チE��キ */}
      <mesh>
        <boxGeometry args={[0.12, 0.02, 0.4]} />
        <meshStandardMaterial color="#E91E63" roughness={0.5} />
      </mesh>
      {/* ノ�EズキチE�� */}
      <mesh position={[0, 0.02, 0.18]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.06]} />
        <meshStandardMaterial color="#E91E63" roughness={0.5} />
      </mesh>
      {/* チE�EルキチE�� */}
      <mesh position={[0, 0.02, -0.18]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.06]} />
        <meshStandardMaterial color="#E91E63" roughness={0.5} />
      </mesh>
      {/* トラチE��+ウィール (剁E */}
      <mesh position={[0, -0.03, 0.12]}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={`wf${s}`} position={[s * 0.07, -0.05, 0.12]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
      ))}
      {/* トラチE��+ウィール (征E */}
      <mesh position={[0, -0.03, -0.12]}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={`wb${s}`} position={[s * 0.07, -0.05, -0.12]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** ゲームコントローラー */
function GameController() {
  return (
    <group position={[0, 0.25, 0.25]}>
      {/* 本佁E*/}
      <mesh>
        <boxGeometry args={[0.22, 0.06, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* 左グリチE�E */}
      <mesh position={[-0.1, -0.04, 0.02]}>
        <boxGeometry args={[0.06, 0.08, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* 右グリチE�E */}
      <mesh position={[0.1, -0.04, 0.02]}>
        <boxGeometry args={[0.06, 0.08, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* 十字キーエリア */}
      <mesh position={[-0.06, 0.035, 0]}>
        <boxGeometry args={[0.03, 0.01, 0.08]} />
        <meshStandardMaterial color="#555" roughness={0.4} />
      </mesh>
      <mesh position={[-0.06, 0.035, 0]}>
        <boxGeometry args={[0.08, 0.01, 0.03]} />
        <meshStandardMaterial color="#555" roughness={0.4} />
      </mesh>
      {/* ボタン (ABXY) */}
      {[[0.04, 0.01], [0.08, 0.01], [0.06, 0.03], [0.06, -0.01]].map(([x, z], i) => (
        <mesh key={`btn${i}`} position={[x, 0.035, z]}>
          <boxGeometry args={[0.02, 0.01, 0.02]} />
          <meshStandardMaterial color={['#E53935', '#4CAF50', '#2196F3', '#FFC107'][i]} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** ピザの箱 */
function PizzaBox() {
  return (
    <group position={[-0.35, 0.3, 0.1]} rotation={[0, 0, 0.15]}>
      {/* 箱本佁E*/}
      <mesh>
        <boxGeometry args={[0.3, 0.06, 0.3]} />
        <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
      </mesh>
      {/* 蓁E*/}
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[0.31, 0.01, 0.31]} />
        <meshStandardMaterial color="#E8E0C8" roughness={0.8} />
      </mesh>
      {/* ピザロゴ�E�赤ぁE���E�E*/}
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.1]} />
        <meshStandardMaterial color="#E53935" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** サングラス */
function Sunglasses() {
  return (
    <group position={[0, 0.72, 0.36]}>
      {/* ブリチE�� */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* 左レンズ */}
      <mesh position={[-0.13, 0, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshStandardMaterial color="#1A237E" roughness={0.1} metalness={0.6} transparent opacity={0.8} />
      </mesh>
      {/* 右レンズ */}
      <mesh position={[0.13, 0, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshStandardMaterial color="#1A237E" roughness={0.1} metalness={0.6} transparent opacity={0.8} />
      </mesh>
      {/* 左チE��プル */}
      <mesh position={[-0.22, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* 右チE��プル */}
      <mesh position={[0.22, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

const ITEM_COMPONENTS: Record<AvatarItemType, React.FC | null> = {
  none: null,
  sword_shield: SwordAndShield,
  skateboard: Skateboard,
  controller: GameController,
  pizza: PizzaBox,
  sunglasses: Sunglasses,
};

interface VoxelItemProps {
  itemType: AvatarItemType;
}

export function VoxelItem({ itemType }: VoxelItemProps) {
  const Component = useMemo(() => ITEM_COMPONENTS[itemType], [itemType]);
  if (!Component) return null;
  return <Component />;
}
