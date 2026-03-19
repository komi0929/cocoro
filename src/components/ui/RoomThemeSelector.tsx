/**
 * cocoro - RoomThemeSelector
 * 6-theme visual picker with preview cards
 */

import { useCallback } from 'react';
import { ROOM_THEMES, ROOM_THEME_LIST } from '@/types/cocoro';
import type { RoomTheme } from '@/types/cocoro';

interface RoomThemeSelectorProps {
  onSelect: (theme: RoomTheme) => void;
  onSkip?: () => void;
}

export function RoomThemeSelector({ onSelect, onSkip }: RoomThemeSelectorProps) {
  const handleSelect = useCallback((theme: RoomTheme) => {
    onSelect(theme);
  }, [onSelect]);

  return (
    <div className="theme-selector-screen">
      <div className="theme-selector-card">
        <h2>{'\u{1F3E0} \u96A0\u308C\u5BB6\u306E\u30C6\u30FC\u30DE\u3092\u9078\u3076'}</h2>
        <p className="theme-hint">{'\u90E8\u5C4B\u306E\u96F0\u56F2\u6C17\u3092\u6C7A\u3081\u3088\u3046'}</p>

        <div className="theme-grid">
          {ROOM_THEME_LIST.map(themeId => {
            const t = ROOM_THEMES[themeId];
            return (
              <button
                key={themeId}
                className="theme-card"
                onClick={() => handleSelect(themeId)}
                style={{
                  '--theme-floor': t.floorColor,
                  '--theme-wall': t.wallColor,
                  '--theme-accent': t.accentColor,
                  '--theme-neon': t.neonColor,
                } as React.CSSProperties}
              >
                <div className="theme-preview"
                  style={{
                    background: `linear-gradient(135deg, ${t.wallColor} 0%, ${t.floorColor} 60%, ${t.accentColor} 100%)`,
                    boxShadow: `0 0 20px ${t.neonColor}33`,
                  }}
                >
                  <span className="theme-preview-emoji">{t.emoji}</span>
                </div>
                <div className="theme-info">
                  <span className="theme-name">{t.name}</span>
                  <span className="theme-desc">{t.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        {onSkip && (
          <button className="btn btn-ghost" onClick={onSkip} style={{ width: '100%', maxWidth: 320, marginTop: 16 }}>
            {'\u23E9 \u30B9\u30AD\u30C3\u30D7\uFF08\u53CB\u9054\u306E\u90E8\u5C4B\u306B\u884C\u304F\uFF09'}
          </button>
        )}
      </div>
    </div>
  );
}
