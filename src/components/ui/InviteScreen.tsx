/**
 * cocoro - InviteScreen
 * QR code + URL sharing for room invitations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRoomStore } from '@/store/useRoomStore';

interface InviteScreenProps {
  roomId: string;
  onClose: () => void;
}

// Simple QR code generator using canvas (no external lib)
function drawQRPlaceholder(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 200;
  canvas.width = size;
  canvas.height = size;

  // Dark background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  // Simple visual pattern from invite code
  const cols = 10;
  const cellSize = size / cols;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  for (let y = 0; y < cols; y++) {
    for (let x = 0; x < cols; x++) {
      const val = Math.abs(Math.sin(hash * (y * cols + x + 1) * 12.9898) * 43758.5453) % 1;
      if (val > 0.45) {
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }
  }

  // Corner markers
  const markSize = cellSize * 3;
  const drawMark = (mx: number, my: number) => {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(mx, my, markSize, markSize);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(mx + cellSize * 0.5, my + cellSize * 0.5, markSize - cellSize, markSize - cellSize);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(mx + cellSize, my + cellSize, cellSize, cellSize);
  };
  drawMark(1, 1);
  drawMark(size - markSize - 1, 1);
  drawMark(1, size - markSize - 1);

  // Center text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, size / 2, size / 2 + 5);
}

export function InviteScreen({ roomId, onClose }: InviteScreenProps) {
  const getInviteUrl = useRoomStore(s => s.getInviteUrl);
  const rooms = useRoomStore(s => s.rooms);
  const room = rooms.find(r => r.id === roomId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const url = getInviteUrl(roomId);

  useEffect(() => {
    if (canvasRef.current && room) {
      drawQRPlaceholder(canvasRef.current, room.inviteCode);
    }
  }, [room]);

  const handleCopy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  if (!room) return null;

  return (
    <div className="invite-overlay" onClick={onClose}>
      <div className="invite-card" onClick={e => e.stopPropagation()}>
        <h2>{'\u{1F4E8} \u53CB\u9054\u3092\u62DB\u5F85'}</h2>

        <div className="invite-qr-area">
          <canvas ref={canvasRef} className="invite-qr-canvas" />
          <p className="invite-code">{'\u62DB\u5F85\u30B3\u30FC\u30C9: '}<strong>{room.inviteCode}</strong></p>
        </div>

        <div className="invite-url-area">
          <input
            type="text"
            className="invite-url-input"
            value={url}
            readOnly
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? '\u2705 \u30B3\u30D4\u30FC\u3057\u305F\uFF01' : '\u{1F4CB} URL\u3092\u30B3\u30D4\u30FC'}
          </button>
        </div>

        <p className="invite-hint">
          {'\u3053\u306EURL\u3092\u53CB\u9054\u306B\u9001\u308B\u3068\u3001\u3042\u306A\u305F\u306E\u90E8\u5C4B\u306B\u62DB\u5F85\u3067\u304D\u307E\u3059'}
        </p>

        <button className="btn btn-ghost" onClick={onClose}>
          {'\u2716 \u9589\u3058\u308B'}
        </button>
      </div>
    </div>
  );
}
