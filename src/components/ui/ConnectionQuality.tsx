/**
 * kokoro — Connection Quality Indicator
 * 接続品質のリアルタイム表示
 *
 * サイクル76: ネットワーク品質を可視化
 * - 音声遅延/パケットロス/帯域を総合評価
 * - 5段階アイコン表示
 * - 品質悪化時の自動案内
 * = 「声が途切れるのは自分のせい？相手のせい？」の解消
 */
'use client';

type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

interface ConnectionQualityProps {
  latencyMs: number;
  packetLoss: number; // %
  jitter: number;     // ms
}

function computeQuality(props: ConnectionQualityProps): { level: QualityLevel; bars: number; label: string; color: string } {
  const { latencyMs, packetLoss, jitter } = props;

  if (latencyMs < 50 && packetLoss < 1 && jitter < 10) {
    return { level: 'excellent', bars: 4, label: '最高', color: 'text-emerald-400' };
  }
  if (latencyMs < 100 && packetLoss < 3 && jitter < 20) {
    return { level: 'good', bars: 3, label: '良好', color: 'text-emerald-300' };
  }
  if (latencyMs < 200 && packetLoss < 5 && jitter < 40) {
    return { level: 'fair', bars: 2, label: '普通', color: 'text-amber-300' };
  }
  if (latencyMs < 400 && packetLoss < 10) {
    return { level: 'poor', bars: 1, label: '不安定', color: 'text-orange-400' };
  }
  return { level: 'critical', bars: 0, label: '切断リスク', color: 'text-red-400' };
}

export function ConnectionQuality(props: ConnectionQualityProps) {
  const quality = computeQuality(props);

  return (
    <div className="flex items-center gap-1.5">
      {/* Signal bars */}
      <div className="flex items-end gap-[2px]">
        {[0, 1, 2, 3].map(i => (
          <div key={i}
            className={`w-[3px] rounded-full transition-all duration-300
              ${i <= quality.bars
                ? `${quality.color.replace('text-', 'bg-')}`
                : 'bg-white/10'
              }`}
            style={{ height: `${6 + i * 3}px` }}
          />
        ))}
      </div>
      <span className={`text-[8px] ${quality.color}`}>{quality.label}</span>
    </div>
  );
}
