/**
 * cocoro — Voxel Items (Phase 7 — High-Poly Voxel)
 * 11種のハイポリボクセルアクセサリーアイテム
 * NoisyBox / NoisyCylinder / NoisySphere / EmissiveBox で構成
 * 角丸+ノイズテクスチャで参考画像レベルの粒度を実現
 */

import { useMemo } from 'react';
import type { AvatarItemType } from '@/types/cocoro';
import { NoisyBox, NoisyCylinder, NoisySphere, EmissiveBox } from '../furniture/VoxelBuilder';

/** 木の剣＆ハニカム盾 */
function SwordAndShield() {
  return (
    <group>
      {/* 右手の剣 */}
      <group position={[0.42, 0.35, 0.1]}>
        {/* 刃 */}
        <NoisyBox size={[0.06, 0.4, 0.03]} position={[0, 0.25, 0]} color="#C0C0C0" metalness={0.6} roughness={0.2} seed={101} bevel={0.008} />
        {/* 刃先のハイライト */}
        <NoisyBox size={[0.04, 0.38, 0.015]} position={[0, 0.26, 0.01]} color="#E0E0E0" metalness={0.7} roughness={0.15} seed={102} bevel={0.005} />
        {/* 柄 */}
        <NoisyBox size={[0.05, 0.12, 0.05]} position={[0, -0.02, 0]} color="#8B4513" roughness={0.8} seed={103} bevel={0.01} />
        {/* 柄の巻き */}
        <NoisyBox size={[0.055, 0.03, 0.055]} position={[0, -0.01, 0]} color="#6D3A1A" roughness={0.85} seed={104} bevel={0.008} />
        <NoisyBox size={[0.055, 0.03, 0.055]} position={[0, 0.03, 0]} color="#6D3A1A" roughness={0.85} seed={105} bevel={0.008} />
        {/* 鍔 */}
        <NoisyBox size={[0.14, 0.03, 0.05]} position={[0, 0.04, 0]} color="#DAA520" metalness={0.65} roughness={0.2} seed={106} bevel={0.006} />
        {/* ポンメル */}
        <NoisySphere args={[0.025]} position={[0, -0.08, 0]} color="#DAA520" metalness={0.65} roughness={0.2} seed={107} />
      </group>
      {/* 左手の盾 */}
      <group position={[-0.42, 0.35, 0.1]}>
        <NoisyBox size={[0.25, 0.3, 0.05]} color="#DAA520" roughness={0.5} metalness={0.3} seed={110} bevel={0.012} />
        {/* ハニカムディテール */}
        <NoisyBox size={[0.12, 0.12, 0.02]} position={[0, 0.05, 0.03]} color="#FFD700" roughness={0.4} metalness={0.4} seed={111} bevel={0.008} />
        <NoisyBox size={[0.1, 0.08, 0.02]} position={[0, -0.06, 0.03]} color="#FFC107" roughness={0.4} metalness={0.35} seed={112} bevel={0.006} />
        {/* 盾の縁取り */}
        <NoisyBox size={[0.27, 0.02, 0.06]} position={[0, 0.14, 0]} color="#B8860B" metalness={0.5} roughness={0.3} seed={113} bevel={0.004} />
        <NoisyBox size={[0.27, 0.02, 0.06]} position={[0, -0.14, 0]} color="#B8860B" metalness={0.5} roughness={0.3} seed={114} bevel={0.004} />
      </group>
    </group>
  );
}

/** スケボー（小脇に抱え） */
function Skateboard() {
  return (
    <group position={[-0.38, 0.2, 0]} rotation={[0.3, 0, 0.8]}>
      {/* デッキ */}
      <NoisyBox size={[0.12, 0.025, 0.4]} color="#E91E63" roughness={0.45} seed={200} bevel={0.008} />
      {/* デッキのグラフィック */}
      <NoisyBox size={[0.08, 0.003, 0.25]} position={[0, 0.014, 0]} color="#C2185B" roughness={0.4} seed={201} bevel={0.003} />
      {/* ノーズキック */}
      <NoisyBox size={[0.12, 0.025, 0.06]} position={[0, 0.02, 0.18]} rotation={[0.4, 0, 0]} color="#E91E63" roughness={0.45} seed={202} bevel={0.006} />
      {/* テールキック */}
      <NoisyBox size={[0.12, 0.025, 0.06]} position={[0, 0.02, -0.18]} rotation={[-0.4, 0, 0]} color="#E91E63" roughness={0.45} seed={203} bevel={0.006} />
      {/* トラック+ウィール (前) */}
      <NoisyBox size={[0.14, 0.02, 0.03]} position={[0, -0.03, 0.12]} color="#888" metalness={0.7} roughness={0.2} seed={204} bevel={0.004} />
      {[-1, 1].map(s => (
        <NoisyCylinder key={`wf${s}`} args={[0.018, 0.018, 0.015]} position={[s * 0.07, -0.05, 0.12]} rotation={[0, 0, Math.PI / 2]} color="#333" roughness={0.35} metalness={0.3} seed={205 + s} />
      ))}
      {/* トラック+ウィール (後) */}
      <NoisyBox size={[0.14, 0.02, 0.03]} position={[0, -0.03, -0.12]} color="#888" metalness={0.7} roughness={0.2} seed={207} bevel={0.004} />
      {[-1, 1].map(s => (
        <NoisyCylinder key={`wb${s}`} args={[0.018, 0.018, 0.015]} position={[s * 0.07, -0.05, -0.12]} rotation={[0, 0, Math.PI / 2]} color="#333" roughness={0.35} metalness={0.3} seed={208 + s} />
      ))}
    </group>
  );
}

/** ゲームコントローラー */
function GameController() {
  return (
    <group position={[0, 0.25, 0.25]}>
      {/* 本体 */}
      <NoisyBox size={[0.22, 0.06, 0.12]} color="#2D2D2D" roughness={0.4} metalness={0.15} seed={300} bevel={0.015} />
      {/* 左グリップ */}
      <NoisyBox size={[0.06, 0.1, 0.08]} position={[-0.1, -0.04, 0.02]} color="#2D2D2D" roughness={0.4} metalness={0.15} seed={301} bevel={0.015} />
      {/* 右グリップ */}
      <NoisyBox size={[0.06, 0.1, 0.08]} position={[0.1, -0.04, 0.02]} color="#2D2D2D" roughness={0.4} metalness={0.15} seed={302} bevel={0.015} />
      {/* 十字キー */}
      <NoisyBox size={[0.03, 0.012, 0.08]} position={[-0.06, 0.035, 0]} color="#555" roughness={0.35} seed={303} bevel={0.003} />
      <NoisyBox size={[0.08, 0.012, 0.03]} position={[-0.06, 0.035, 0]} color="#555" roughness={0.35} seed={304} bevel={0.003} />
      {/* ABXY ボタン */}
      {[
        { pos: [0.04, 0.038, 0.01] as [number, number, number], c: '#E53935' },
        { pos: [0.08, 0.038, 0.01] as [number, number, number], c: '#4CAF50' },
        { pos: [0.06, 0.038, 0.03] as [number, number, number], c: '#2196F3' },
        { pos: [0.06, 0.038, -0.01] as [number, number, number], c: '#FFC107' },
      ].map((btn, i) => (
        <NoisySphere key={`btn${i}`} args={[0.012]} position={btn.pos} color={btn.c} roughness={0.25} seed={310 + i} />
      ))}
      {/* アナログスティック */}
      <NoisyCylinder args={[0.012, 0.012, 0.01]} position={[-0.03, 0.038, -0.03]} color="#444" roughness={0.3} metalness={0.2} seed={315} />
      <NoisyCylinder args={[0.012, 0.012, 0.01]} position={[0.03, 0.038, 0.04]} color="#444" roughness={0.3} metalness={0.2} seed={316} />
    </group>
  );
}

/** ピザの箱 */
function PizzaBox() {
  return (
    <group position={[-0.35, 0.3, 0.1]} rotation={[0, 0, 0.15]}>
      {/* 箱本体 */}
      <NoisyBox size={[0.3, 0.06, 0.3]} color="#F5F5DC" roughness={0.8} seed={400} bevel={0.01} />
      {/* 蓋 */}
      <NoisyBox size={[0.31, 0.015, 0.31]} position={[0, 0.035, 0]} color="#E8E0C8" roughness={0.8} seed={401} bevel={0.006} />
      {/* ピザロゴ */}
      <NoisyBox size={[0.12, 0.006, 0.12]} position={[0, 0.045, 0]} color="#E53935" roughness={0.55} seed={402} bevel={0.004} />
      {/* ロゴの文字的ディテール */}
      <NoisyBox size={[0.06, 0.006, 0.04]} position={[0, 0.049, 0]} color="#FFEB3B" roughness={0.5} seed={403} bevel={0.003} />
      {/* 箱の角補強 */}
      <NoisyBox size={[0.04, 0.065, 0.04]} position={[0.13, 0, 0.13]} color="#D7CCC8" roughness={0.8} seed={404} bevel={0.008} />
      <NoisyBox size={[0.04, 0.065, 0.04]} position={[-0.13, 0, -0.13]} color="#D7CCC8" roughness={0.8} seed={405} bevel={0.008} />
    </group>
  );
}

/** サングラス */
function Sunglasses() {
  return (
    <group position={[0, 0.72, 0.36]}>
      {/* ブリッジ */}
      <NoisyBox size={[0.08, 0.02, 0.02]} color="#111" roughness={0.2} metalness={0.6} seed={500} bevel={0.005} />
      {/* 左レンズ */}
      <NoisyBox size={[0.16, 0.1, 0.02]} position={[-0.13, 0, 0]} color="#1A237E" roughness={0.08} metalness={0.7} seed={501} bevel={0.008} transparent opacity={0.8} />
      {/* 右レンズ */}
      <NoisyBox size={[0.16, 0.1, 0.02]} position={[0.13, 0, 0]} color="#1A237E" roughness={0.08} metalness={0.7} seed={502} bevel={0.008} transparent opacity={0.8} />
      {/* 左テンプル */}
      <NoisyBox size={[0.02, 0.02, 0.22]} position={[-0.22, 0, -0.1]} color="#111" roughness={0.2} metalness={0.6} seed={503} bevel={0.004} />
      {/* 右テンプル */}
      <NoisyBox size={[0.02, 0.02, 0.22]} position={[0.22, 0, -0.1]} color="#111" roughness={0.2} metalness={0.6} seed={504} bevel={0.004} />
      {/* レンズのフレーム */}
      <NoisyBox size={[0.18, 0.12, 0.005]} position={[-0.13, 0, 0.01]} color="#222" roughness={0.15} metalness={0.65} seed={505} bevel={0.01} />
      <NoisyBox size={[0.18, 0.12, 0.005]} position={[0.13, 0, 0.01]} color="#222" roughness={0.15} metalness={0.65} seed={506} bevel={0.01} />
    </group>
  );
}

/** リボン — 頭のてっぺんに大きなリボン */
function Ribbon() {
  return (
    <group position={[0.1, 0.95, 0]}>
      {/* 中央結び目 */}
      <NoisyBox size={[0.06, 0.06, 0.06]} color="#E91E63" roughness={0.45} seed={600} bevel={0.015} />
      {/* 左リボン */}
      <NoisyBox size={[0.14, 0.09, 0.04]} position={[-0.1, 0.02, 0]} rotation={[0, 0, 0.3]} color="#F06292" roughness={0.4} seed={601} bevel={0.015} lightnessSpread={0.1} />
      {/* 右リボン */}
      <NoisyBox size={[0.14, 0.09, 0.04]} position={[0.1, 0.02, 0]} rotation={[0, 0, -0.3]} color="#F06292" roughness={0.4} seed={602} bevel={0.015} lightnessSpread={0.1} />
      {/* 左たれ */}
      <NoisyBox size={[0.04, 0.12, 0.03]} position={[-0.12, -0.06, 0]} rotation={[0, 0, 0.5]} color="#EC407A" roughness={0.45} seed={603} bevel={0.01} />
      {/* 右たれ */}
      <NoisyBox size={[0.04, 0.12, 0.03]} position={[0.12, -0.06, 0]} rotation={[0, 0, -0.5]} color="#EC407A" roughness={0.45} seed={604} bevel={0.01} />
      {/* ハイライト光沢 */}
      <NoisyBox size={[0.03, 0.025, 0.065]} position={[0, 0.01, 0]} color="#F8BBD0" roughness={0.3} seed={605} bevel={0.01} />
    </group>
  );
}

/** 魔法のステッキ — キラキラの星付きワンド */
function MagicWand() {
  return (
    <group position={[0.42, 0.35, 0.1]} rotation={[0.2, 0, -0.3]}>
      {/* 柄（グラデーション風3段） */}
      <NoisyCylinder args={[0.02, 0.025, 0.3]} position={[0, -0.05, 0]} color="#E1BEE7" roughness={0.35} seed={700} />
      <NoisyCylinder args={[0.025, 0.022, 0.08]} position={[0, -0.12, 0]} color="#CE93D8" roughness={0.35} seed={701} />
      <NoisyCylinder args={[0.018, 0.028, 0.04]} position={[0, -0.18, 0]} color="#BA68C8" roughness={0.35} seed={702} />
      {/* 星（中央） */}
      <EmissiveBox size={[0.12, 0.12, 0.04]} position={[0, 0.18, 0]} color="#FFD700" emissiveIntensity={0.6} />
      {/* 星の角 */}
      <EmissiveBox size={[0.06, 0.07, 0.03]} position={[0, 0.27, 0]} color="#FFD700" emissiveIntensity={0.5} />
      <EmissiveBox size={[0.06, 0.07, 0.03]} position={[-0.09, 0.18, 0]} color="#FFD700" emissiveIntensity={0.5} />
      <EmissiveBox size={[0.06, 0.07, 0.03]} position={[0.09, 0.18, 0]} color="#FFD700" emissiveIntensity={0.5} />
      <EmissiveBox size={[0.06, 0.07, 0.03]} position={[0, 0.09, 0]} color="#FFD700" emissiveIntensity={0.5} />
      {/* キラキラパーティクル風の小球 */}
      <NoisySphere args={[0.015]} position={[0.1, 0.28, 0.03]} color="#FFF9C4" roughness={0.1} metalness={0.5} seed={710} />
      <NoisySphere args={[0.01]} position={[-0.08, 0.25, -0.02]} color="#FFF9C4" roughness={0.1} metalness={0.5} seed={711} />
      <NoisySphere args={[0.012]} position={[0.05, 0.12, 0.03]} color="#FFF9C4" roughness={0.1} metalness={0.5} seed={712} />
    </group>
  );
}

/** ぬいぐるみ — 小さいクマのぬいぐるみを抱える */
function Plushie() {
  return (
    <group position={[-0.3, 0.25, 0.15]}>
      {/* 体 */}
      <NoisyBox size={[0.16, 0.18, 0.14]} color="#D7CCC8" roughness={0.92} seed={800} bevel={0.025} lightnessSpread={0.06} />
      {/* お腹パッチ */}
      <NoisyBox size={[0.1, 0.1, 0.01]} position={[0, -0.01, 0.075]} color="#EFEBE9" roughness={0.95} seed={801} bevel={0.02} />
      {/* 頭 */}
      <NoisyBox size={[0.15, 0.15, 0.13]} position={[0, 0.14, 0.01]} color="#BCAAA4" roughness={0.92} seed={802} bevel={0.03} lightnessSpread={0.06} />
      {/* 左耳 */}
      <NoisySphere args={[0.03]} position={[-0.06, 0.24, 0]} color="#A1887F" roughness={0.92} seed={803} />
      {/* 耳の中 */}
      <NoisySphere args={[0.015]} position={[-0.06, 0.24, 0.02]} color="#F48FB1" roughness={0.9} seed={804} />
      {/* 右耳 */}
      <NoisySphere args={[0.03]} position={[0.06, 0.24, 0]} color="#A1887F" roughness={0.92} seed={805} />
      <NoisySphere args={[0.015]} position={[0.06, 0.24, 0.02]} color="#F48FB1" roughness={0.9} seed={806} />
      {/* 目 */}
      <NoisySphere args={[0.012]} position={[-0.03, 0.16, 0.068]} color="#333" roughness={0.2} metalness={0.3} seed={807} />
      <NoisySphere args={[0.012]} position={[0.03, 0.16, 0.068]} color="#333" roughness={0.2} metalness={0.3} seed={808} />
      {/* 目のハイライト */}
      <NoisySphere args={[0.005]} position={[-0.025, 0.168, 0.08]} color="#FFF" roughness={0.1} seed={809} />
      <NoisySphere args={[0.005]} position={[0.035, 0.168, 0.08]} color="#FFF" roughness={0.1} seed={810} />
      {/* 鼻 */}
      <NoisySphere args={[0.015]} position={[0, 0.13, 0.07]} color="#5D4037" roughness={0.4} seed={811} />
      {/* 口 */}
      <NoisyBox size={[0.025, 0.005, 0.005]} position={[0, 0.118, 0.068]} color="#5D4037" roughness={0.5} seed={812} bevel={0.002} />
      {/* 左腕 */}
      <NoisyBox size={[0.06, 0.09, 0.06]} position={[-0.1, 0.02, 0]} color="#D7CCC8" roughness={0.92} seed={813} bevel={0.02} />
      {/* 右腕 */}
      <NoisyBox size={[0.06, 0.09, 0.06]} position={[0.1, 0.02, 0]} color="#D7CCC8" roughness={0.92} seed={814} bevel={0.02} />
      {/* 足 */}
      <NoisyBox size={[0.055, 0.06, 0.06]} position={[-0.04, -0.12, 0]} color="#BCAAA4" roughness={0.92} seed={815} bevel={0.018} />
      <NoisyBox size={[0.055, 0.06, 0.06]} position={[0.04, -0.12, 0]} color="#BCAAA4" roughness={0.92} seed={816} bevel={0.018} />
    </group>
  );
}

/** ティアラ — キラキラの王冠 */
function Tiara() {
  return (
    <group position={[0, 0.92, 0.05]}>
      {/* ベースバンド */}
      <NoisyBox size={[0.4, 0.04, 0.04]} color="#FFD700" metalness={0.75} roughness={0.15} seed={900} bevel={0.008} />
      {/* 中央の宝石台 */}
      <NoisyBox size={[0.08, 0.1, 0.03]} position={[0, 0.06, 0]} color="#FFD700" metalness={0.75} roughness={0.15} seed={901} bevel={0.006} />
      {/* 中央宝石 */}
      <EmissiveBox size={[0.04, 0.04, 0.025]} position={[0, 0.08, 0.02]} color="#E91E63" emissiveIntensity={0.5} />
      {/* 左の飾り */}
      <NoisyBox size={[0.06, 0.07, 0.03]} position={[-0.1, 0.04, 0]} color="#FFD700" metalness={0.75} roughness={0.15} seed={903} bevel={0.006} />
      <EmissiveBox size={[0.03, 0.03, 0.025]} position={[-0.1, 0.05, 0.02]} color="#42A5F5" emissiveIntensity={0.4} />
      {/* 右の飾り */}
      <NoisyBox size={[0.06, 0.07, 0.03]} position={[0.1, 0.04, 0]} color="#FFD700" metalness={0.75} roughness={0.15} seed={905} bevel={0.006} />
      <EmissiveBox size={[0.03, 0.03, 0.025]} position={[0.1, 0.05, 0.02]} color="#42A5F5" emissiveIntensity={0.4} />
      {/* 左端の小飾り */}
      <NoisyBox size={[0.04, 0.05, 0.03]} position={[-0.17, 0.03, 0]} color="#FFD700" metalness={0.75} roughness={0.15} seed={907} bevel={0.005} />
      <NoisySphere args={[0.01]} position={[-0.17, 0.04, 0.02]} color="#AB47BC" roughness={0.1} metalness={0.4} seed={908} />
      {/* 右端の小飾り */}
      <NoisyBox size={[0.04, 0.05, 0.03]} position={[0.17, 0.03, 0]} color="#FFD700" metalness={0.75} roughness={0.15} seed={909} bevel={0.005} />
      <NoisySphere args={[0.01]} position={[0.17, 0.04, 0.02]} color="#AB47BC" roughness={0.1} metalness={0.4} seed={910} />
    </group>
  );
}

/** 花束 — 手に持つカラフルな花束 */
function FlowerBouquet() {
  return (
    <group position={[-0.38, 0.3, 0.12]} rotation={[0.4, 0, 0.2]}>
      {/* 包み紙(上) */}
      <NoisyBox size={[0.15, 0.18, 0.15]} position={[0, -0.05, 0]} color="#E8F5E9" roughness={0.65} seed={1000} bevel={0.015} lightnessSpread={0.06} />
      {/* 包み紙(下) — テーパー風 */}
      <NoisyBox size={[0.1, 0.06, 0.1]} position={[0, -0.15, 0]} color="#C8E6C9" roughness={0.65} seed={1001} bevel={0.012} />
      {/* 茎束 */}
      <NoisyCylinder args={[0.02, 0.02, 0.12]} position={[0, -0.16, 0]} color="#388E3C" roughness={0.7} seed={1002} />
      {/* 赤い花 */}
      <NoisySphere args={[0.045]} position={[0, 0.1, 0.02]} color="#E53935" roughness={0.45} seed={1003} lightnessSpread={0.1} />
      <NoisySphere args={[0.02]} position={[0, 0.1, 0.05]} color="#FFEB3B" roughness={0.4} seed={1004} />
      {/* ピンクの花 */}
      <NoisySphere args={[0.04]} position={[-0.06, 0.08, -0.02]} color="#F48FB1" roughness={0.45} seed={1005} lightnessSpread={0.1} />
      <NoisySphere args={[0.015]} position={[-0.06, 0.08, 0.02]} color="#FFF9C4" roughness={0.4} seed={1006} />
      {/* 黄色い花 */}
      <NoisySphere args={[0.035]} position={[0.05, 0.12, -0.01]} color="#FFD54F" roughness={0.45} seed={1007} lightnessSpread={0.1} />
      <NoisySphere args={[0.012]} position={[0.05, 0.12, 0.02]} color="#FF9800" roughness={0.4} seed={1008} />
      {/* 白い花 */}
      <NoisySphere args={[0.035]} position={[0.02, 0.06, 0.04]} color="#FAFAFA" roughness={0.45} seed={1009} />
      <NoisySphere args={[0.012]} position={[0.02, 0.06, 0.065]} color="#FFF176" roughness={0.4} seed={1010} />
      {/* 紫の花 */}
      <NoisySphere args={[0.035]} position={[-0.04, 0.13, 0.03]} color="#AB47BC" roughness={0.45} seed={1011} lightnessSpread={0.1} />
      <NoisySphere args={[0.012]} position={[-0.04, 0.13, 0.055]} color="#E1BEE7" roughness={0.4} seed={1012} />
      {/* 葉っぱ */}
      <NoisyBox size={[0.05, 0.07, 0.015]} position={[0.06, 0.04, 0.05]} color="#4CAF50" roughness={0.55} seed={1013} bevel={0.006} />
      <NoisyBox size={[0.04, 0.06, 0.015]} position={[-0.07, 0.04, -0.03]} color="#388E3C" roughness={0.55} seed={1014} bevel={0.006} />
      <NoisyBox size={[0.035, 0.05, 0.015]} position={[0.04, 0.02, -0.04]} color="#2E7D32" roughness={0.55} seed={1015} bevel={0.005} />
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
