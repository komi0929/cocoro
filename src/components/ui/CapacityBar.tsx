/**
 * cocoro  ECapacityBar
 * 画面上部のルームキャパシチE��ゲージ
 */

import { useAjitStore } from '@/store/useAjitStore';

export function CapacityBar() {
  const roomCapacity = useAjitStore(s => s.roomCapacity); const current = roomCapacity; const max = 200;
  const pct = (current / max) * 100;

  let barClass = 'capacity-bar-fill';
  if (pct >= 100) barClass += ' full';
  else if (pct >= 75) barClass += ' warning';

  return (
    <div className="capacity-bar-track">
      <div className={barClass} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}
