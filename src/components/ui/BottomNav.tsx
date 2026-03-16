/**
 * kokoro — Bottom Navigation
 * スマホ最適化の固定下部ナビゲーション
 * 
 * 思想: スマホアプリ的な操作感を実現
 * Safe-area対応 + ハプティック + シンプルな4タブ構成
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'ホーム', icon: '🏠', path: '/' },
  { id: 'lobby', label: 'ロビー', icon: '🚪', path: '/lobby' },
  { id: 'profile', label: 'アバター', icon: '👤', path: '/lobby' }, // Reuses lobby's avatar section
  { id: 'settings', label: '設定', icon: '⚙️', path: '/lobby' }, // Placeholder
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNav = useCallback(
    (item: NavItem) => {
      // Haptic
      if (navigator.vibrate) navigator.vibrate(10);
      router.push(item.path);
    },
    [router]
  );

  // Don't show in space (3D mode)
  if (pathname === '/space') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f0a1a]/90 backdrop-blur-xl
        border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12
                transition-all duration-200 active:scale-90 touch-manipulation
                ${isActive
                  ? 'text-violet-400'
                  : 'text-white/30 hover:text-white/50'
                }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-6 h-0.5 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
