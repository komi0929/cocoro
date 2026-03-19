/**
 * cocoro — CraftDrawer (Mobile-First)
 * カテゴリタブ付き + 家具メニュー + カラーバリアント選択
 */

import { useState } from 'react';
import { useAjitStore } from '@/store/useAjitStore';
import { CATEGORY_LABELS, getCatalogByCategory, getFurnitureDef } from '@/data/furnitureCatalog';
import type { FurnitureDef, FurnitureType } from '@/types/cocoro';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export function CraftDrawer() {
  const isOpen = useAjitStore(s => s.isDrawerOpen);
  const setDrawerOpen = useAjitStore(s => s.setDrawerOpen);
  const placingType = useAjitStore(s => s.placingType);
  const placingColor = useAjitStore(s => s.placingColorVariant);
  const setPlacingType = useAjitStore(s => s.setPlacingType);
  const setPlacingColorVariant = useAjitStore(s => s.setPlacingColorVariant);
  const capacity = useAjitStore(s => s.roomCapacity);
  const [activeCategory, setActiveCategory] = useState('chill');
  const [colorPickerDef, setColorPickerDef] = useState<FurnitureDef | null>(null);

  const grouped = getCatalogByCategory();
  const items = grouped[activeCategory] ?? [];

  const handleSelect = (def: FurnitureDef) => {
    if (def.colorVariants && def.colorVariants.length > 0) {
      // Show color picker first
      setColorPickerDef(def);
    } else {
      setPlacingType(def.type);
      setPlacingColorVariant(undefined);
      setDrawerOpen(false);
    }
  };

  const handleColorSelect = (colorId: string) => {
    if (colorPickerDef) {
      setPlacingType(colorPickerDef.type);
      setPlacingColorVariant(colorId);
      setColorPickerDef(null);
      setDrawerOpen(false);
    }
  };

  const handleColorPickerBack = () => {
    setColorPickerDef(null);
  };

  // 配置モードインジケーター (ドロワー外に表示)
  const placingDef = placingType ? getFurnitureDef(placingType) : null;

  return (
    <>
      {/* 配置モードインジケーター */}
      {placingType && placingDef && (
        <div className="placement-indicator">
          {placingDef.icon} {placingDef.placement === 'wall' ? '壁をタップして設置' : '床をタップして設置'}
          {placingColor && (
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: placingDef.colorVariants?.find(v => v.id === placingColor)?.hex ?? '#fff',
              marginLeft: 6,
              border: '1px solid rgba(255,255,255,0.3)',
              verticalAlign: 'middle',
            }} />
          )}
        </div>
      )}

      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`}>
        <div className="drawer-backdrop" onClick={() => { setDrawerOpen(false); setColorPickerDef(null); }} />
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
              {colorPickerDef ? `${colorPickerDef.icon} カラー選択` : 'クラフト'}
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

          {colorPickerDef ? (
            // === Color Picker Mode ===
            <div>
              <button
                onClick={handleColorPickerBack}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 12,
                  fontFamily: 'var(--font-body)',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                }}
              >
                ← もどる
              </button>

              <div style={{
                textAlign: 'center',
                fontSize: 32,
                marginBottom: 8,
              }}>
                {colorPickerDef.icon}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}>
                {colorPickerDef.name}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 10,
                padding: '0 4px',
              }}>
                {colorPickerDef.colorVariants!.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleColorSelect(variant.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 8px',
                      borderRadius: 14,
                      border: '2px solid transparent',
                      background: 'rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onPointerEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                      (e.currentTarget as HTMLElement).style.borderColor = variant.hex;
                    }}
                    onPointerLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: variant.hex,
                      boxShadow: `0 0 12px ${variant.hex}66`,
                      border: '2px solid rgba(255,255,255,0.2)',
                    }} />
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {variant.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // === Normal Catalog Mode ===
            <>
              {/* カテゴリタブ — 横スクロール、大きなタッチターゲット */}
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

              {/* 家具グリッド — モバイル3列、タブレット4列 */}
              <div className="drawer-grid">
                {items.map(def => {
                  const canAfford = capacity + def.cost <= 200;
                  return (
                    <button
                      key={def.type}
                      className={`drawer-item ${!canAfford ? 'disabled' : ''}`}
                      onClick={() => canAfford && handleSelect(def)}
                    >
                      <span className="drawer-item-icon">{def.icon}</span>
                      <span className="drawer-item-name">{def.name}</span>
                      <span className="drawer-item-cost">
                        {def.placement === 'wall' ? '📌' : ''}
                        {def.colorVariants ? '🎨' : ''} 💎{def.cost}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
