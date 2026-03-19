/**
 * cocoro - HUD
 * Room info overlay
 */

import { useAjitStore } from '@/store/useAjitStore';

export function HUD() {
  const passphrase = useAjitStore(s => s.passphrase);

  if (!passphrase) return null;

  return (
    <div className="hud">
      <div className="hud-room-name">
        <span className="hud-icon">{'\u{1F3E0}'}</span>
        <span>{'隠れ家'}</span>
      </div>
      <div className="hud-passphrase">
        <span className="hud-icon">{'\u{1F511}'}</span>
        <span>{passphrase.join('\u30FB')}</span>
      </div>
    </div>
  );
}
