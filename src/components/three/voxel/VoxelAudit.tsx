/**
 * VoxelAudit — 3Dポリゴン量産エンジン品質監査ページ
 *
 * 全カテゴリのモデルを一覧表示し、品質確認と承認を行う。
 * 品質ゲート（qualityGate）で自動チェックし、基準未達モデルを可視化。
 * URLパラメータ ?audit=voxel でアクセス。
 *
 * WebGLコンテキスト管理:
 *   IntersectionObserverで可視カードのみCanvasを生成。
 *   同時アクティブ上限 MAX_ACTIVE_CANVASES = 8 を確保。
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VoxelGrid, EmissiveVoxelGrid, type VoxelData } from './VoxelGrid';
import {
  generateBearAvatar, generateCatAvatar, generateRabbitAvatar,
  generateDogAvatar, generatePandaAvatar, generateFoxAvatar,
  generatePenguinAvatar, generateHamsterAvatar,
} from './VoxelAvatars';
import {
  generateHoneyJar, generateTable, generateChair, generateLamp,
  generateCushion, generatePottedPlant, generateBookshelf,
  generateBed, generateCake,
  generateSofa, generateFridge, generateTV, generateWallClock,
  generateFlowerVase, generateCoffeeTable, generateEasel,
  generateBookStack, generateYarnBall,
} from './VoxelFurniture';
import {
  generateIslandBase, generatePremiumPalmTree, generateBush,
  generateWarmRock, generateGrassPatch,
} from './VoxelEnvironments';
import {
  generatePalmTree, generateRock, generateCrystal,
  generateCoral, generateMushroom, generateLavaFlow,
  generateSeaweed, generateBuilding, generateWaterTower,
  generateSpaceConsole, generateTreasureChest, generateJellyfish
} from './VoxelModels';
import { qualityGate, type QualityGateResult } from './VoxelEngine';
import { CATALOG } from './VoxelCatalog';

const MAX_ACTIVE_CANVASES = 8;

type ModelDef = {
  id: string; name: string; category: string;
  fn: (seed: number) => VoxelData;
  voxelSize: number; emissive?: boolean;
  rank: 'S' | 'A' | 'B' | 'C';
  gateResult?: QualityGateResult;
};

const ALL_MODELS: ModelDef[] = [
  // アバター
  { id: 'avatar-bear', name: '🐻 クマ', category: 'アバター', fn: generateBearAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-cat', name: '🐱 ネコ', category: 'アバター', fn: generateCatAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-rabbit', name: '🐰 ウサギ', category: 'アバター', fn: generateRabbitAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-dog', name: '🐶 イヌ', category: 'アバター', fn: generateDogAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-panda', name: '🐼 パンダ', category: 'アバター', fn: generatePandaAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-fox', name: '🦊 キツネ', category: 'アバター', fn: generateFoxAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-penguin', name: '🐧 ペンギン', category: 'アバター', fn: generatePenguinAvatar, voxelSize: 0.12, rank: 'A' },
  { id: 'avatar-hamster', name: '🐹 ハムスター', category: 'アバター', fn: generateHamsterAvatar, voxelSize: 0.12, rank: 'A' },
  // 家具・アイテム
  { id: 'fur-sofa', name: '🛋️ ソファ', category: '家具', fn: generateSofa, voxelSize: 0.04, rank: 'A' },
  { id: 'fur-fridge', name: '🧊 冷蔵庫', category: '家具', fn: generateFridge, voxelSize: 0.05, rank: 'A' },
  { id: 'fur-tv', name: '📺 テレビ', category: '家具', fn: generateTV, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-clock', name: '🕐 壁時計', category: '家具', fn: generateWallClock, voxelSize: 0.08, rank: 'A' },
  { id: 'fur-honey', name: '🍯 ハチミツ壺', category: '家具', fn: generateHoneyJar, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-table', name: '🪑 テーブル', category: '家具', fn: generateTable, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-chair', name: '💺 椅子', category: '家具', fn: generateChair, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-lamp', name: '💡 ランプ', category: '家具', fn: generateLamp, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-cushion', name: '🛋️ クッション', category: '家具', fn: (s) => generateCushion(s), voxelSize: 0.06, rank: 'A' },
  { id: 'fur-plant', name: '🪴 植木鉢', category: '家具', fn: generatePottedPlant, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-bookshelf', name: '📚 本棚', category: '家具', fn: generateBookshelf, voxelSize: 0.05, rank: 'A' },
  { id: 'fur-bed', name: '🛏️ ベッド', category: '家具', fn: generateBed, voxelSize: 0.05, rank: 'A' },
  { id: 'fur-cake', name: '🎂 ケーキ', category: '家具', fn: generateCake, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-flower', name: '🌺 花瓶', category: '家具', fn: generateFlowerVase, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-coffee', name: '☕ コーヒーテーブル', category: '家具', fn: generateCoffeeTable, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-easel', name: '🎨 イーゼル', category: '家具', fn: generateEasel, voxelSize: 0.06, rank: 'A' },
  { id: 'fur-books', name: '📖 本の山', category: '家具', fn: generateBookStack, voxelSize: 0.08, rank: 'A' },
  { id: 'fur-yarn', name: '🧶 毛糸玉', category: '家具', fn: generateYarnBall, voxelSize: 0.08, rank: 'A' },
  // 環境
  { id: 'env-island', name: '🏝️ 浮島', category: '環境', fn: generateIslandBase, voxelSize: 0.04, rank: 'S' },
  { id: 'env-palm', name: '🌴 ヤシの木（プレミアム）', category: '環境', fn: generatePremiumPalmTree, voxelSize: 0.04, rank: 'S' },
  { id: 'env-bush', name: '🌿 低木', category: '環境', fn: generateBush, voxelSize: 0.06, rank: 'A' },
  { id: 'env-rock', name: '🪨 岩', category: '環境', fn: (s) => generateWarmRock(s), voxelSize: 0.06, rank: 'A' },
  { id: 'env-grass', name: '🌱 草パッチ', category: '環境', fn: (s) => generateGrassPatch(20, 20, s), voxelSize: 0.05, rank: 'A' },
  // 旧プロシージャル
  { id: 'old-palm', name: '🌴 ヤシの木（旧）', category: '旧モデル', fn: generatePalmTree, voxelSize: 0.04, rank: 'B' },
  { id: 'old-rock', name: '🪨 岩（旧）', category: '旧モデル', fn: (s) => generateRock(10, s), voxelSize: 0.06, rank: 'B' },
  { id: 'old-crystal', name: '💎 クリスタル', category: '旧モデル', fn: (s) => generateCrystal(18, s), voxelSize: 0.04, rank: 'B' },
  { id: 'old-coral', name: '🪸 サンゴ', category: '旧モデル', fn: generateCoral, voxelSize: 0.05, rank: 'B' },
  { id: 'old-mushroom', name: '🍄 キノコ', category: '旧モデル', fn: generateMushroom, voxelSize: 0.05, rank: 'B' },
  { id: 'old-lava', name: '🌋 溶岩', category: '旧モデル', fn: generateLavaFlow, voxelSize: 0.06, rank: 'B', emissive: true },
  { id: 'old-seaweed', name: '🌿 海藻', category: '旧モデル', fn: generateSeaweed, voxelSize: 0.05, rank: 'B' },
  { id: 'old-building', name: '🏢 ビル', category: '旧モデル', fn: (s) => generateBuilding(10, 30, 10, s), voxelSize: 0.04, rank: 'B' },
  { id: 'old-tower', name: '🗼 水塔', category: '旧モデル', fn: generateWaterTower, voxelSize: 0.05, rank: 'B' },
  { id: 'old-console', name: '🖥️ コンソール', category: '旧モデル', fn: generateSpaceConsole, voxelSize: 0.05, rank: 'B' },
  { id: 'old-chest', name: '📦 宝箱', category: '旧モデル', fn: generateTreasureChest, voxelSize: 0.05, rank: 'B' },
  { id: 'old-jelly', name: '🪼 クラゲ', category: '旧モデル', fn: generateJellyfish, voxelSize: 0.04, rank: 'B', emissive: true },
];

/* ─── WebGL コンテキスト管理（グローバル） ─── */
const activeSet = new Set<string>();
const waitQueue: Array<{ id: string; resolve: () => void }> = [];

function requestSlot(id: string): Promise<void> {
  if (activeSet.size < MAX_ACTIVE_CANVASES) {
    activeSet.add(id);
    return Promise.resolve();
  }
  return new Promise(resolve => waitQueue.push({ id, resolve }));
}

function releaseSlot(id: string) {
  activeSet.delete(id);
  if (waitQueue.length > 0) {
    const next = waitQueue.shift()!;
    activeSet.add(next.id);
    next.resolve();
  }
}

/* ─── Lazy 3D Card ─── */
function ModelCard({ model, seed, onSeedChange }: { model: ModelDef; seed: number; onSeedChange: (s: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [slotReady, setSlotReady] = useState(false);

  // IntersectionObserver: ビューポート可視判定
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px 0px' } // 200px早めに読み込み
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // スロットの取得と解放
  useEffect(() => {
    if (!visible) {
      releaseSlot(model.id);
      setSlotReady(false);
      return;
    }
    let cancelled = false;
    requestSlot(model.id).then(() => {
      if (!cancelled) setSlotReady(true);
    });
    return () => {
      cancelled = true;
      releaseSlot(model.id);
      setSlotReady(false);
    };
  }, [visible, model.id]);

  const data = useMemo(() => {
    if (!slotReady) return null;
    try { return model.fn(seed); } catch (e) { console.error(`Model ${model.id} failed:`, e); return [[[]]] as VoxelData; }
  }, [model, seed, slotReady]);

  const rankColors: Record<string, string> = { S: '#FFD700', A: '#4CAF50', B: '#FF9800', C: '#F44336' };

  // ボクセル数を自動計算
  let voxelCount = 0;
  if (data) { for (const layer of data) { for (const row of layer) { for (const v of row) { if (v) voxelCount++; } } } }

  const gate = model.gateResult;

  return (
    <div ref={ref} style={{ ...S.card, borderColor: gate ? (gate.passed ? '#4CAF50' : '#F44336') : '#1e1e3a' }}>
      <div style={S.cardHeader}>
        <span style={S.cardName}>{model.name}</span>
        <span style={{ ...S.badge, background: rankColors[model.rank] ?? '#888' }}>{model.rank}</span>
        {gate && <span style={{ ...S.badge, background: gate.passed ? '#4CAF50' : '#F44336', fontSize: 10 }}>{gate.score}点</span>}
        <span style={S.catBadge}>{model.category}</span>
        {voxelCount > 0 && <span style={{ fontSize: 10, color: '#555' }}>{voxelCount.toLocaleString()} voxels</span>}
      </div>
      <div style={S.canvasWrap}>
        {slotReady && data ? (
          <Canvas camera={{ position: [0, 3, 8], fov: 35 }} style={{ background: '#12122a' }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 8, 5]} intensity={1.6} color="#ffffff" />
            <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#8888cc" />
            <directionalLight position={[0, -2, -5]} intensity={0.3} color="#442244" />
            {model.emissive ? (
              <EmissiveVoxelGrid data={data} voxelSize={model.voxelSize} emissiveColor="#FF4500" emissiveIntensity={1.5} />
            ) : (
              <VoxelGrid data={data} voxelSize={model.voxelSize} enableAO aoIntensity={0.55} />
            )}
            <OrbitControls autoRotate autoRotateSpeed={0.5} />
            <gridHelper args={[4, 20, '#222', '#1a1a1a']} />
          </Canvas>
        ) : (
          <div style={S.placeholder}>
            <span style={{ fontSize: 32 }}>{model.name.split(' ')[0]}</span>
            <span style={{ fontSize: 11, color: '#555', marginTop: 8 }}>読み込み中...</span>
          </div>
        )}
      </div>
      {/* 品質ゲートチェック結果 */}
      {gate && (
        <div style={{ padding: '6px 8px', fontSize: 11, borderTop: '1px solid #1e1e3a' }}>
          {gate.checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
              <span>{c.passed ? '✅' : '❌'}</span>
              <span style={{ color: c.passed ? '#4CAF50' : '#F44336', fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: '#666', flex: 1 }}>{c.detail}</span>
            </div>
          ))}
        </div>
      )}
      <div style={S.seedRow}>
        <span style={{ fontSize: 11, color: '#666' }}>Seed: {seed}</span>
        <button onClick={() => onSeedChange(seed + 1)} style={S.btn}>+1</button>
        <button onClick={() => onSeedChange(Math.floor(Math.random() * 9999))} style={S.btn}>🎲</button>
      </div>
    </div>
  );
}

export function VoxelAuditPage() {
  const [filter, setFilter] = useState('アバター');
  const [seeds, setSeeds] = useState<Record<string, number>>({});
  const categories = ['全て', 'アバター', '家具', '環境', '旧モデル', '🔍 カタログ品質'];
  const getSeed = useCallback((id: string) => seeds[id] ?? 42, [seeds]);
  const setSeed = useCallback((id: string, s: number) => setSeeds(p => ({ ...p, [id]: s })), []);

  // カタログモデルの品質ゲート結果
  const catalogModels = useMemo(() => CATALOG.map(cfg => {
    const gate = qualityGate(cfg);
    return {
      id: `cat-${cfg.id}`,
      name: `📐 ${cfg.name}`,
      category: '🔍 カタログ品質',
      fn: (_s: number) => { const { buildModel } = require('./VoxelEngine'); return buildModel(cfg, _s); },
      voxelSize: cfg.renderDefaults?.voxelSize ?? 0.06,
      rank: gate.suggestedRank,
      gateResult: gate,
    } as ModelDef;
  }), []);

  const allModels = useMemo(() => [...ALL_MODELS, ...catalogModels], [catalogModels]);
  const filtered = filter === '全て' ? allModels : allModels.filter(m => m.category === filter);

  // カテゴリ切り替え時にすべてのスロットを解放
  useEffect(() => {
    activeSet.clear();
    waitQueue.length = 0;
  }, [filter]);

  const counts = {
    avatar: ALL_MODELS.filter(m => m.category === 'アバター').length,
    furniture: ALL_MODELS.filter(m => m.category === '家具').length,
    env: ALL_MODELS.filter(m => m.category === '環境').length,
    old: ALL_MODELS.filter(m => m.category === '旧モデル').length,
    catalog: catalogModels.length,
  };

  // 品質ゲート集計
  const gatePass = catalogModels.filter(m => m.gateResult?.passed).length;
  const gateFail = catalogModels.filter(m => m.gateResult && !m.gateResult.passed).length;

  return (
    <div style={S.page}>
      <header style={S.header}>
        <h1 style={S.title}>🔧 ボクセル量産エンジン — 品質監査</h1>
        <p style={S.sub}>アバター {counts.avatar} / 家具 {counts.furniture} / 環境 {counts.env} / 旧 {counts.old} / カタログ {counts.catalog} = 計 {allModels.length} モデル</p>
        {/* 品質ゲート集計 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <span style={{ color: '#4CAF50', fontWeight: 700, fontSize: 14 }}>✅ 品質通過: {gatePass}</span>
          {gateFail > 0 && <span style={{ color: '#F44336', fontWeight: 700, fontSize: 14 }}>❌ 品質不足: {gateFail}</span>}
        </div>
        <div style={S.filterBar}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={filter === c ? S.filterOn : S.filterOff}>{c}</button>
          ))}
        </div>
      </header>
      <div style={S.grid}>
        {filtered.map(m => (
          <ModelCard key={m.id} model={m} seed={getSeed(m.id)} onSeedChange={s => setSeed(m.id, s)} />
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a1a', color: '#e0e0e0', padding: 24, fontFamily: "'Inter','Noto Sans JP',sans-serif" },
  header: { textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg,#FFD700,#FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { fontSize: 13, color: '#888', marginTop: 4 },
  filterBar: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' as const },
  filterOff: { padding: '6px 14px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 },
  filterOn: { padding: '6px 14px', borderRadius: 8, border: '1px solid #FFD700', background: 'rgba(255,215,0,0.15)', color: '#FFD700', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 },
  card: { background: '#12122a', borderRadius: 16, padding: 14, border: '1px solid #1e1e3a' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardName: { fontSize: 14, fontWeight: 700, flex: 1 },
  badge: { padding: '2px 8px', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 800 },
  catBadge: { padding: '2px 8px', borderRadius: 6, background: '#222', color: '#888', fontSize: 10 },
  canvasWrap: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' },
  placeholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', background: '#0e0e20' },
  seedRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  btn: { padding: '3px 10px', borderRadius: 6, border: '1px solid #333', background: '#1a1a2e', color: '#ccc', cursor: 'pointer', fontSize: 11 },
};
