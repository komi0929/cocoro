/**
 * cocoro - LobbyScreen (Phase 5)
 * 3-step character maker
 * Avatar 3D preview + species/color/item carousels
 */

import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VoxelAvatar } from '../three/avatar/VoxelAvatar';
import { useAvatarStore } from '@/store/useAvatarStore';
import {
  AVATAR_SPECIES_LIST,
  AVATAR_SPECIES_LABELS,
  AVATAR_SPECIES_EMOJI,
  AVATAR_ITEM_LIST,
  AVATAR_ITEM_LABELS,
  AVATAR_ITEM_EMOJI,
  AVATAR_COLOR_PRESETS,
} from '@/types/cocoro';
import type { AvatarSpecies, AvatarItemType } from '@/types/cocoro';

type TabId = 'species' | 'color' | 'item';

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'species', emoji: '\u{1F43E}', label: '\u3069\u3046\u3076\u3064' },
  { id: 'color', emoji: '\u{1F3A8}', label: '\u30AB\u30E9\u30FC' },
  { id: 'item', emoji: '\u{1F392}', label: '\u30A2\u30A4\u30C6\u30E0' },
];

interface LobbyScreenProps {
  onEnterRoom: () => void;
}

function AvatarPreviewScene() {
  const config = useAvatarStore(s => s.config);
  return (
    <>
      <ambientLight intensity={0.6} color="#c4b5fd" />
      <directionalLight position={[2, 4, 3]} intensity={1.2} color="#fef3c7" />
      <pointLight position={[-2, 3, 1]} intensity={0.8} color="#818cf8" />
      <VoxelAvatar config={config} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={3}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.45, 0]}
      />
    </>
  );
}

export function LobbyScreen({ onEnterRoom }: LobbyScreenProps) {
  const { config, setSpecies, setColor, setItem, save } = useAvatarStore();
  const [activeTab, setActiveTab] = useState<TabId>('species');

  const speciesIdx = AVATAR_SPECIES_LIST.indexOf(config.species);
  const itemIdx = AVATAR_ITEM_LIST.indexOf(config.item);

  const handlePrevSpecies = useCallback(() => {
    const idx = (speciesIdx - 1 + AVATAR_SPECIES_LIST.length) % AVATAR_SPECIES_LIST.length;
    setSpecies(AVATAR_SPECIES_LIST[idx]);
  }, [speciesIdx, setSpecies]);

  const handleNextSpecies = useCallback(() => {
    const idx = (speciesIdx + 1) % AVATAR_SPECIES_LIST.length;
    setSpecies(AVATAR_SPECIES_LIST[idx]);
  }, [speciesIdx, setSpecies]);

  const handlePrevItem = useCallback(() => {
    const idx = (itemIdx - 1 + AVATAR_ITEM_LIST.length) % AVATAR_ITEM_LIST.length;
    setItem(AVATAR_ITEM_LIST[idx]);
  }, [itemIdx, setItem]);

  const handleNextItem = useCallback(() => {
    const idx = (itemIdx + 1) % AVATAR_ITEM_LIST.length;
    setItem(AVATAR_ITEM_LIST[idx]);
  }, [itemIdx, setItem]);

  const handleGo = useCallback(() => {
    save();
    onEnterRoom();
  }, [save, onEnterRoom]);

  return (
    <div className="lobby-screen">
      <div className="lobby-title">
        <span className="pixel-text neon-glow">{'\u30AD\u30E3\u30E9\u30E1\u30A4\u30AF'}</span>
      </div>

      <div className="lobby-preview">
        <Canvas
          camera={{ position: [0, 0.6, 2.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <AvatarPreviewScene />
          </Suspense>
        </Canvas>
      </div>

      <div className="lobby-avatar-info">
        <span className="lobby-info-species">
          {AVATAR_SPECIES_EMOJI[config.species]} {AVATAR_SPECIES_LABELS[config.species]}
        </span>
        <span className="lobby-info-item">
          {AVATAR_ITEM_EMOJI[config.item]} {AVATAR_ITEM_LABELS[config.item]}
        </span>
      </div>

      <div className="lobby-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`lobby-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="lobby-tab-emoji">{tab.emoji}</span>
            <span className="lobby-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="lobby-carousel">
        {activeTab === 'species' && (
          <SpeciesCarousel current={config.species} onPrev={handlePrevSpecies} onNext={handleNextSpecies} />
        )}
        {activeTab === 'color' && (
          <ColorCarousel current={config.color} onSelect={setColor} />
        )}
        {activeTab === 'item' && (
          <ItemCarousel current={config.item} onPrev={handlePrevItem} onNext={handleNextItem} />
        )}
      </div>

      <button className="lobby-go-btn btn btn-primary" onClick={handleGo}>
        {'\u{1F3E0} \u3053\u306E\u3059\u304C\u305F\u3067 \u30A2\u30B8\u30C8\u306B\u884C\u304F\uFF01'}
      </button>
    </div>
  );
}

function SpeciesCarousel({ current, onPrev, onNext }: { current: AvatarSpecies; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="carousel-row">
      <button className="carousel-arrow" onClick={onPrev}>{'\u25C0'}</button>
      <div className="carousel-center">
        <span className="carousel-emoji">{AVATAR_SPECIES_EMOJI[current]}</span>
        <span className="carousel-label">{AVATAR_SPECIES_LABELS[current]}</span>
      </div>
      <button className="carousel-arrow" onClick={onNext}>{'\u25B6'}</button>
    </div>
  );
}

function ColorCarousel({ current, onSelect }: { current: string; onSelect: (color: string) => void }) {
  return (
    <div className="color-grid">
      {AVATAR_COLOR_PRESETS.map(preset => (
        <button
          key={preset.hex}
          className={`color-swatch ${current === preset.hex ? 'active' : ''}`}
          style={{ background: preset.hex }}
          onClick={() => onSelect(preset.hex)}
          title={preset.label}
        >
          {current === preset.hex && <span className="color-check">{'\u2713'}</span>}
        </button>
      ))}
    </div>
  );
}

function ItemCarousel({ current, onPrev, onNext }: { current: AvatarItemType; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="carousel-row">
      <button className="carousel-arrow" onClick={onPrev}>{'\u25C0'}</button>
      <div className="carousel-center">
        <span className="carousel-emoji">{AVATAR_ITEM_EMOJI[current]}</span>
        <span className="carousel-label">{AVATAR_ITEM_LABELS[current]}</span>
      </div>
      <button className="carousel-arrow" onClick={onNext}>{'\u25B6'}</button>
    </div>
  );
}
