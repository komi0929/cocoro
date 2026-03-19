/**
 * cocoro  ECraftDrawer (Mobile-First)
 * カチE��リタブ付き + 56種類�E家具メニュー
 * 大きなタチE��ターゲチE��、E�E置モードインジケーター
 */

import { useState } from 'react';
import { useAjitStore } from '@/store/useAjitStore';
import { CATEGORY_LABELS, getCatalogByCategory, getFurnitureDef } from '@/data/furnitureCatalog';
import type { FurnitureType } from '@/types/cocoro';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export function CraftDrawer() {
  const isOpen = useAjitStore(s => s.isDrawerOpen);
  const setDrawerOpen = useAjitStore(s => s.setDrawerOpen);
  const placingType = useAjitStore(s => s.placingType);
  const setPlacingType = useAjitStore(s => s.setPlacingType);
  const capacity = useAjitStore(s => s.roomCapacity);
  const [activeCategory, setActiveCategory] = useState('chill');

  const grouped = getCatalogByCategory();
  const items = grouped[activeCategory] ?? [];

  const handleSelect = (type: FurnitureType) => {
    setPlacingType(type);
    setDrawerOpen(false);
  };

  // 配置モードインジケーター (ドロワー外に表示)
  const placingDef = placingType ? getFurnitureDef(placingType) : null;

  return (
    <>
      {/* 配置モードインジケーター */}
      {placingType && placingDef && (
        <div className="placement-indicator">
          {placingDef.icon} {placingDef.placement === 'wall' ? '壁をタチE�Eして設置' : '床をタチE�Eして設置'}
        </div>
      )}

      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`}>
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="drawer-panel">
          <div className="drawer-handle" />

          {/* ヘッダー */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            padding: '0 4px',
          }}>
            <span className="pixel-text" style={{ fontSize: 10, color: 'var(--accent-neon)' }}>
              クラフト
            </span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              💎 <span style={{ color: capacity > 200 * 0.75 ? 'var(--accent-yellow)' : 'var(--accent-neon)', fontFamily: 'var(--font-pixel)', fontSize: 11 }}>
                {capacity}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>{200}</span>
            </span>
          </div>

          {/* カチE��リタチE E横スクロール、大きなタチE��ターゲチE�� */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 12,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: 'none',
                  background: activeCategory === cat
                    ? 'linear-gradient(135deg, var(--accent-neon), var(--accent-purple))'
                    : 'rgba(255,255,255,0.06)',
                  color: activeCategory === cat ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* 家具グリチE��  Eモバイル3列、タブレチE��4刁E*/}
          <div className="drawer-grid">
            {items.map(def => {
              const canAfford = capacity + def.cost <= 200;
              return (
                <button
                  key={def.type}
                  className={`drawer-item ${!canAfford ? 'disabled' : ''}`}
                  onClick={() => canAfford && handleSelect(def.type)}
                >
                  <span className="drawer-item-icon">{def.icon}</span>
                  <span className="drawer-item-name">{def.name}</span>
                  <span className="drawer-item-cost">
                    {def.placement === 'wall' ? '📌' : ''} 💎{def.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
