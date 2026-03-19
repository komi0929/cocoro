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
      {/* ブリッジ */}
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
      {/* 左テンプル */}
      <mesh position={[-0.22, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* 右テンプル */}
      <mesh position={[0.22, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** リボン — 頭のてっぺんに大きなリボン */
function Ribbon() {
  return (
    <group position={[0.1, 0.95, 0]}>
      {/* 中央結び目 */}
      <mesh>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#E91E63" roughness={0.5} />
      </mesh>
      {/* 左リボン */}
      <mesh position={[-0.1, 0.02, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.14, 0.08, 0.04]} />
        <meshStandardMaterial color="#F06292" roughness={0.5} />
      </mesh>
      {/* 右リボン */}
      <mesh position={[0.1, 0.02, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.14, 0.08, 0.04]} />
        <meshStandardMaterial color="#F06292" roughness={0.5} />
      </mesh>
      {/* 左たれ */}
      <mesh position={[-0.12, -0.06, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.04, 0.1, 0.03]} />
        <meshStandardMaterial color="#EC407A" roughness={0.5} />
      </mesh>
      {/* 右たれ */}
      <mesh position={[0.12, -0.06, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.04, 0.1, 0.03]} />
        <meshStandardMaterial color="#EC407A" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** 魔法のステッキ — キラキラの星付きワンド */
function MagicWand() {
  return (
    <group position={[0.42, 0.35, 0.1]} rotation={[0.2, 0, -0.3]}>
      {/* 柄（グラデーション風） */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.04, 0.3, 0.04]} />
        <meshStandardMaterial color="#E1BEE7" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.05, 0.08, 0.05]} />
        <meshStandardMaterial color="#CE93D8" roughness={0.4} />
      </mesh>
      {/* 星（中央） */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.04]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* 星の角（上下左右） */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.03]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[-0.08, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.03]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.03]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** ぬいぐるみ — 小さいクマのぬいぐるみを抱える */
function Plushie() {
  return (
    <group position={[-0.3, 0.25, 0.15]}>
      {/* 体 */}
      <mesh>
        <boxGeometry args={[0.16, 0.18, 0.14]} />
        <meshStandardMaterial color="#D7CCC8" roughness={0.9} />
      </mesh>
      {/* 頭 */}
      <mesh position={[0, 0.14, 0.01]}>
        <boxGeometry args={[0.14, 0.14, 0.12]} />
        <meshStandardMaterial color="#BCAAA4" roughness={0.9} />
      </mesh>
      {/* 左耳 */}
      <mesh position={[-0.06, 0.22, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.04]} />
        <meshStandardMaterial color="#A1887F" roughness={0.9} />
      </mesh>
      {/* 右耳 */}
      <mesh position={[0.06, 0.22, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.04]} />
        <meshStandardMaterial color="#A1887F" roughness={0.9} />
      </mesh>
      {/* 目（左） */}
      <mesh position={[-0.03, 0.16, 0.065]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color="#333" roughness={0.3} />
      </mesh>
      {/* 目（右） */}
      <mesh position={[0.03, 0.16, 0.065]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color="#333" roughness={0.3} />
      </mesh>
      {/* 鼻 */}
      <mesh position={[0, 0.13, 0.065]}>
        <boxGeometry args={[0.03, 0.02, 0.01]} />
        <meshStandardMaterial color="#5D4037" roughness={0.5} />
      </mesh>
      {/* 左腕 */}
      <mesh position={[-0.1, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color="#D7CCC8" roughness={0.9} />
      </mesh>
      {/* 右腕 */}
      <mesh position={[0.1, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color="#D7CCC8" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** ティアラ — キラキラの王冠 */
function Tiara() {
  return (
    <group position={[0, 0.92, 0.05]}>
      {/* ベースバンド */}
      <mesh>
        <boxGeometry args={[0.4, 0.04, 0.04]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* 中央の宝石台 */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.1, 0.03]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* 中央宝石 */}
      <mesh position={[0, 0.08, 0.02]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#E91E63" emissive="#E91E63" emissiveIntensity={0.3} metalness={0.3} roughness={0.1} />
      </mesh>
      {/* 左の飾り */}
      <mesh position={[-0.1, 0.04, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.03]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[-0.1, 0.05, 0.02]}>
        <boxGeometry args={[0.03, 0.03, 0.02]} />
        <meshStandardMaterial color="#42A5F5" emissive="#42A5F5" emissiveIntensity={0.2} metalness={0.3} roughness={0.1} />
      </mesh>
      {/* 右の飾り */}
      <mesh position={[0.1, 0.04, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.03]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.1, 0.05, 0.02]}>
        <boxGeometry args={[0.03, 0.03, 0.02]} />
        <meshStandardMaterial color="#42A5F5" emissive="#42A5F5" emissiveIntensity={0.2} metalness={0.3} roughness={0.1} />
      </mesh>
      {/* 左端の小飾り */}
      <mesh position={[-0.17, 0.03, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.03]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* 右端の小飾り */}
      <mesh position={[0.17, 0.03, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.03]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** 花束 — 手に持つカラフルな花束 */
function FlowerBouquet() {
  return (
    <group position={[-0.38, 0.3, 0.12]} rotation={[0.4, 0, 0.2]}>
      {/* 包み紙 */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.14, 0.18, 0.14]} />
        <meshStandardMaterial color="#E8F5E9" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#C8E6C9" roughness={0.7} />
      </mesh>
      {/* 赤い花 */}
      <mesh position={[0, 0.1, 0.02]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
        <meshStandardMaterial color="#E53935" roughness={0.5} />
      </mesh>
      {/* ピンクの花 */}
      <mesh position={[-0.06, 0.08, -0.02]}>
        <boxGeometry args={[0.07, 0.07, 0.06]} />
        <meshStandardMaterial color="#F48FB1" roughness={0.5} />
      </mesh>
      {/* 黄色い花 */}
      <mesh position={[0.05, 0.12, -0.01]}>
        <boxGeometry args={[0.06, 0.06, 0.05]} />
        <meshStandardMaterial color="#FFD54F" roughness={0.5} />
      </mesh>
      {/* 白い花 */}
      <mesh position={[0.02, 0.06, 0.04]}>
        <boxGeometry args={[0.06, 0.06, 0.05]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.5} />
      </mesh>
      {/* 紫の花 */}
      <mesh position={[-0.04, 0.13, 0.03]}>
        <boxGeometry args={[0.06, 0.06, 0.05]} />
        <meshStandardMaterial color="#AB47BC" roughness={0.5} />
      </mesh>
      {/* 葉っぱ */}
      <mesh position={[0.06, 0.04, 0.05]}>
        <boxGeometry args={[0.04, 0.06, 0.02]} />
        <meshStandardMaterial color="#4CAF50" roughness={0.6} />
      </mesh>
      <mesh position={[-0.07, 0.04, -0.03]}>
        <boxGeometry args={[0.04, 0.05, 0.02]} />
        <meshStandardMaterial color="#388E3C" roughness={0.6} />
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
  ribbon: Ribbon,
  magic_wand: MagicWand,
  plushie: Plushie,
  tiara: Tiara,
  flower_bouquet: FlowerBouquet,
};

interface VoxelItemProps {
  itemType: AvatarItemType;
}

export function VoxelItem({ itemType }: VoxelItemProps) {
  const Component = useMemo(() => ITEM_COMPONENTS[itemType], [itemType]);
  if (!Component) return null;
  return <Component />;
}
