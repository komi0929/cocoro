/**
 * cocoro — Connection Graph UI
 * 参加者間のつながりを視覚化するUIコンポーネント
 *
 * 反復291-300:
 * - セッション後に表示される「つながりの地図」
 * - 会話時間が長い人同士が近くに配置
 * - ピークモーメントを共有した人に光の線
 * - コネクション強度による線の太さ
 * = 「ここに来てよかった」と感じる振り返り画面
 */
'use client';

import { useMemo } from 'react';

interface ConnectionNode {
  id: string;
  name: string;
  avatar: string;
  isSelf: boolean;
  speechMinutes: number;
}

interface ConnectionEdge {
  from: string;
  to: string;
  strength: number;     // 0-1
  sharedPeaks: number;  // shared peak moments
}

interface ConnectionGraphProps {
  nodes: ConnectionNode[];
  edges: ConnectionEdge[];
  onClose: () => void;
}

export function ConnectionGraph({ nodes, edges, onClose }: ConnectionGraphProps) {
  // Calculate positions in a circle
  const nodePositions = useMemo(() => {
    const centerX = 50; // percentage
    const centerY = 50;
    const radius = 30;

    return nodes.map((node, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        ...node,
        x: node.isSelf ? centerX : centerX + Math.cos(angle) * radius,
        y: node.isSelf ? centerY : centerY + Math.sin(angle) * radius,
      };
    });
  }, [nodes]);

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const np of nodePositions) m.set(np.id, { x: np.x, y: np.y });
    return m;
  }, [nodePositions]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ animation: 'fade-in-up 0.5s ease-out' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#1a1225]/95 backdrop-blur-2xl
        rounded-3xl border border-white/10 shadow-2xl p-6 overflow-hidden">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-white/40 uppercase tracking-widest">session</p>
          <h2 className="text-lg font-bold text-white/90 mt-1">つながりの地図</h2>
        </div>

        {/* Graph area */}
        <div className="relative w-full aspect-square">
          {/* SVG for edges */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {edges.map((edge, i) => {
              const from = posMap.get(edge.from);
              const to = posMap.get(edge.to);
              if (!from || !to) return null;

              return (
                <line
                  key={i}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={edge.sharedPeaks > 0 ? '#fbbf24' : '#8b5cf6'}
                  strokeWidth={0.3 + edge.strength * 1.2}
                  strokeOpacity={0.2 + edge.strength * 0.4}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodePositions.map((node) => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                text-lg shadow-lg border-2
                ${node.isSelf ? 'border-violet-400/60 bg-violet-500/20' : 'border-white/10 bg-white/5'}`}
                style={{
                  boxShadow: node.isSelf ? '0 0 20px rgba(139,92,246,0.3)' : undefined,
                }}
              >
                {node.avatar || node.name.charAt(0)}
              </div>
              <span className={`text-[10px] whitespace-nowrap
                ${node.isSelf ? 'text-violet-300/80 font-medium' : 'text-white/40'}`}>
                {node.name}
                {node.isSelf && ' (あなた)'}
              </span>
              <span className="text-[8px] text-white/20">{node.speechMinutes}分</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <div className="w-4 h-[2px] bg-violet-500/50 rounded" /> 会話
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-[2px] bg-amber-400/50 rounded" /> ピークモーメント共有
          </span>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-white/5 border border-white/8
            text-sm text-white/60 hover:bg-white/8 active:scale-98 transition-all"
        >
          とじる
        </button>
      </div>
    </div>
  );
}
