/**
 * cocoro — Theme Materials (Phase 10 — 高品質プロシージャルテクスチャ)
 * floorPattern / wallPattern に基づくプロシージャル床・壁・天井マテリアル
 * Canvas2Dで木目・石畳・レンガ等のテクスチャを動的生成し、質感を大幅向上
 */

import { useMemo } from 'react';
import * as THREE from 'three';

type FloorPattern = 'solid' | 'wood' | 'stone' | 'sand' | 'metal' | 'grass' | 'tile' | 'lava';
type WallPattern = 'solid' | 'brick' | 'wood' | 'glass' | 'rock' | 'coral' | 'obsidian' | 'panel';

interface MaterialParams {
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

// ---- Floor pattern materials ----
const FLOOR_MATERIALS: Record<FloorPattern, MaterialParams> = {
  solid:  { roughness: 0.7, metalness: 0.1 },
  wood:   { roughness: 0.75, metalness: 0.05 },
  stone:  { roughness: 0.95, metalness: 0.05 },
  sand:   { roughness: 1.0, metalness: 0 },
  metal:  { roughness: 0.15, metalness: 0.95 },
  grass:  { roughness: 0.95, metalness: 0 },
  tile:   { roughness: 0.3, metalness: 0.15 },
  lava:   { roughness: 0.5, metalness: 0.3, emissive: '#FF4500', emissiveIntensity: 0.8, },
};

// ---- Wall pattern materials ----
const WALL_MATERIALS: Record<WallPattern, MaterialParams> = {
  solid:    { roughness: 0.85, metalness: 0.05 },
  brick:    { roughness: 0.9, metalness: 0.05 },
  wood:     { roughness: 0.8, metalness: 0.05 },
  glass:    { roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.4 },
  rock:     { roughness: 0.95, metalness: 0.1 },
  coral:    { roughness: 0.85, metalness: 0.1 },
  obsidian: { roughness: 0.05, metalness: 0.9, emissive: '#FF4500', emissiveIntensity: 0.15 },
  panel:    { roughness: 0.2, metalness: 0.85 },
};

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

// ============================================================
// プロシージャルテクスチャ生成ユーティリティ
// ============================================================

function createCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** 簡易2Dノイズ */
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

// ============================================================
// 高品質プロシージャル床テクスチャ
// ============================================================

function useWoodFloorTextures(baseColor: string) {
  return useMemo(() => {
    const c = new THREE.Color(baseColor);
    const map = createCanvasTexture((ctx, w, h) => {
      const plankW = w / 6;
      for (let i = 0; i < 6; i++) {
        const x = i * plankW;
        // 板ごとに微妙に色を変える
        const shade = i % 2 === 0 ? 0 : -0.03;
        const pc = c.clone().offsetHSL(0, 0, shade);
        ctx.fillStyle = pc.getStyle();
        ctx.fillRect(x + 1, 0, plankW - 2, h);
        // 木目ライン
        for (let line = 0; line < 30; line++) {
          const y = line * (h / 30) + noise2D(i, line) * 6;
          const alpha = 0.04 + noise2D(i * 10 + line, 0) * 0.06;
          ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
          ctx.lineWidth = 0.5 + noise2D(line, i) * 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 2, y);
          // 木目の波形
          for (let dx = 0; dx < plankW - 4; dx += 4) {
            ctx.lineTo(x + 2 + dx, y + Math.sin(dx * 0.08 + i) * 2);
          }
          ctx.stroke();
        }
        // 板間の溝
        ctx.fillStyle = `rgba(0,0,0,0.25)`;
        ctx.fillRect(x, 0, 1.5, h);
        // 節穴（ランダム）
        if (noise2D(i * 3, 7) > 0.7) {
          const kx = x + plankW * 0.3 + noise2D(i, 3) * plankW * 0.4;
          const ky = h * 0.2 + noise2D(i, 5) * h * 0.6;
          const kr = 3 + noise2D(i, 9) * 4;
          const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
          grad.addColorStop(0, `rgba(40,20,5,0.5)`);
          grad.addColorStop(0.5, `rgba(60,30,10,0.3)`);
          grad.addColorStop(1, `rgba(0,0,0,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(kx, ky, kr, kr * 1.3, noise2D(i, 11) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    map.repeat.set(2, 2);

    // バンプマップ（凹凸）
    const bumpMap = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      const plankW = w / 6;
      for (let i = 0; i < 6; i++) {
        // 板表面を少し浮かせる
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(i * plankW + 2, 0, plankW - 4, h);
        // 溝
        ctx.fillStyle = '#555555';
        ctx.fillRect(i * plankW, 0, 2, h);
        // 木目の微細凹凸
        for (let y = 0; y < h; y += 3) {
          const bump = 128 + (noise2D(i, y) - 0.5) * 20;
          ctx.fillStyle = `rgb(${bump},${bump},${bump})`;
          ctx.fillRect(i * plankW + 2, y, plankW - 4, 2);
        }
      }
    });
    bumpMap.repeat.set(2, 2);

    return { map, bumpMap };
  }, [baseColor]);
}

function useStoneFloorTextures(baseColor: string) {
  return useMemo(() => {
    const c = new THREE.Color(baseColor);
    const map = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = c.getStyle();
      ctx.fillRect(0, 0, w, h);
      // 石畳パターン
      const gridSize = w / 4;
      for (let gx = 0; gx < 4; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const ox = gx * gridSize;
          const oy = gy * gridSize;
          const shade = (noise2D(gx, gy) - 0.5) * 0.1;
          const sc = c.clone().offsetHSL(0, 0, shade);
          // 石の形
          const inset = 2 + noise2D(gx * 3, gy * 3) * 3;
          ctx.fillStyle = sc.getStyle();
          ctx.beginPath();
          ctx.roundRect(ox + inset, oy + inset, gridSize - inset * 2, gridSize - inset * 2, 4 + noise2D(gx, gy * 2) * 6);
          ctx.fill();
          // 石の表面テクスチャ
          for (let n = 0; n < 40; n++) {
            const nx = ox + inset + noise2D(gx * 10 + n, gy) * (gridSize - inset * 2);
            const ny = oy + inset + noise2D(gx, gy * 10 + n) * (gridSize - inset * 2);
            const na = 0.03 + noise2D(n, gx + gy) * 0.05;
            ctx.fillStyle = `rgba(0,0,0,${na})`;
            ctx.beginPath();
            ctx.arc(nx, ny, 1 + noise2D(n * 2, 0) * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          // 目地
          ctx.strokeStyle = `rgba(0,0,0,0.2)`;
          ctx.lineWidth = 2;
          ctx.strokeRect(ox + 1, oy + 1, gridSize - 2, gridSize - 2);
        }
      }
    });
    map.repeat.set(2, 2);

    const bumpMap = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#606060';
      ctx.fillRect(0, 0, w, h);
      const gridSize = w / 4;
      for (let gx = 0; gx < 4; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const ox = gx * gridSize;
          const oy = gy * gridSize;
          const bump = 140 + noise2D(gx, gy) * 30;
          ctx.fillStyle = `rgb(${bump},${bump},${bump})`;
          ctx.beginPath();
          ctx.roundRect(ox + 4, oy + 4, gridSize - 8, gridSize - 8, 6);
          ctx.fill();
        }
      }
    });
    bumpMap.repeat.set(2, 2);
    return { map, bumpMap };
  }, [baseColor]);
}

function useBrickTextures(baseColor: string) {
  return useMemo(() => {
    const c = new THREE.Color(baseColor);
    const brickW = 64;
    const brickH = 28;
    const mortarW = 3;
    const map = createCanvasTexture((ctx, w, h) => {
      // モルタル背景
      const mc = c.clone().offsetHSL(0, -0.1, -0.15);
      ctx.fillStyle = mc.getStyle();
      ctx.fillRect(0, 0, w, h);
      const rows = Math.ceil(h / (brickH + mortarW));
      const cols = Math.ceil(w / (brickW + mortarW)) + 1;
      for (let row = 0; row < rows; row++) {
        const offset = row % 2 === 0 ? 0 : (brickW + mortarW) / 2;
        const y = row * (brickH + mortarW);
        for (let col = -1; col < cols; col++) {
          const x = col * (brickW + mortarW) + offset;
          const shade = (noise2D(row, col) - 0.5) * 0.08;
          const bc = c.clone().offsetHSL(noise2D(row * 3, col * 3) * 0.02, 0, shade);
          ctx.fillStyle = bc.getStyle();
          ctx.beginPath();
          ctx.roundRect(x + mortarW / 2, y + mortarW / 2, brickW, brickH, 1);
          ctx.fill();
          // レンガのテクスチャノイズ
          for (let n = 0; n < 15; n++) {
            const nx = x + mortarW / 2 + noise2D(row * 10 + n, col) * brickW;
            const ny = y + mortarW / 2 + noise2D(row, col * 10 + n) * brickH;
            ctx.fillStyle = `rgba(0,0,0,${0.02 + noise2D(n, row + col) * 0.04})`;
            ctx.fillRect(nx, ny, 2, 1);
          }
        }
      }
    });
    map.wrapS = map.wrapT = THREE.RepeatWrapping;

    const bumpMap = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#606060';
      ctx.fillRect(0, 0, w, h);
      const rows = Math.ceil(h / (brickH + mortarW));
      const cols = Math.ceil(w / (brickW + mortarW)) + 1;
      for (let row = 0; row < rows; row++) {
        const offset = row % 2 === 0 ? 0 : (brickW + mortarW) / 2;
        const y = row * (brickH + mortarW);
        for (let col = -1; col < cols; col++) {
          const x = col * (brickW + mortarW) + offset;
          const bump = 160 + noise2D(row, col) * 20;
          ctx.fillStyle = `rgb(${bump},${bump},${bump})`;
          ctx.beginPath();
          ctx.roundRect(x + mortarW / 2 + 1, y + mortarW / 2 + 1, brickW - 2, brickH - 2, 1);
          ctx.fill();
        }
      }
    });
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    return { map, bumpMap };
  }, [baseColor]);
}

function useRockTextures(baseColor: string) {
  return useMemo(() => {
    const c = new THREE.Color(baseColor);
    const map = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = c.getStyle();
      ctx.fillRect(0, 0, w, h);
      // 不規則な岩のテクスチャ
      for (let i = 0; i < 200; i++) {
        const x = noise2D(i, 0) * w;
        const y = noise2D(0, i) * h;
        const r = 2 + noise2D(i, i) * 8;
        const shade = (noise2D(i * 2, i * 3) - 0.5) * 0.15;
        const rc = c.clone().offsetHSL(0, 0, shade);
        ctx.fillStyle = rc.getStyle();
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.8 + noise2D(i * 5, 0) * 0.4), noise2D(i, 7) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      // 亀裂
      for (let crack = 0; crack < 8; crack++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.08 + noise2D(crack, 99) * 0.1})`;
        ctx.lineWidth = 0.5 + noise2D(crack, 0) * 1.5;
        ctx.beginPath();
        let cx = noise2D(crack, 1) * w;
        let cy = noise2D(crack, 2) * h;
        ctx.moveTo(cx, cy);
        for (let s = 0; s < 10; s++) {
          cx += (noise2D(crack * 10 + s, 0) - 0.5) * 40;
          cy += (noise2D(0, crack * 10 + s) - 0.5) * 40;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
    });
    map.wrapS = map.wrapT = THREE.RepeatWrapping;

    const bumpMap = createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 150; i++) {
        const x = noise2D(i, 0) * w;
        const y = noise2D(0, i) * h;
        const r = 3 + noise2D(i, i) * 10;
        const bump = 128 + (noise2D(i * 2, i * 3) - 0.5) * 60;
        ctx.fillStyle = `rgb(${bump},${bump},${bump})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    return { map, bumpMap };
  }, [baseColor]);
}

// ============================================================
// 高品質 Floor Overlay（テクスチャベース）
// ============================================================

function WoodFloorOverlay({ color }: { color: string }) {
  const { map, bumpMap } = useWoodFloorTextures(color);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.03} roughness={0.7} metalness={0.05} />
    </mesh>
  );
}

function StoneFloorOverlay({ color }: { color: string }) {
  const { map, bumpMap } = useStoneFloorTextures(color);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.05} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function GrassFloorOverlay({ color }: { color: string }) {
  const c = new THREE.Color(color);
  const tex = useMemo(() => {
    return createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = c.getStyle();
      ctx.fillRect(0, 0, w, h);
      // 草の葉を大量描画
      for (let i = 0; i < 600; i++) {
        const gx = noise2D(i, 0) * w;
        const gy = noise2D(0, i) * h;
        const gh = 4 + noise2D(i, i) * 10;
        const shade = (noise2D(i * 2, 0) - 0.5) * 0.15;
        const gc = c.clone().offsetHSL(noise2D(i, 3) * 0.06, 0, shade);
        ctx.strokeStyle = gc.getStyle();
        ctx.lineWidth = 1 + noise2D(i * 3, 0) * 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + (noise2D(i, 5) - 0.5) * 6, gy - gh * 0.5, gx + (noise2D(i, 7) - 0.5) * 4, gy - gh);
        ctx.stroke();
      }
    });
  }, [c]);
  tex.repeat.set(3, 3);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function SandFloorOverlay({ color }: { color: string }) {
  const c = new THREE.Color(color);
  const tex = useMemo(() => {
    return createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = c.getStyle();
      ctx.fillRect(0, 0, w, h);
      // 砂粒テクスチャ
      for (let i = 0; i < 3000; i++) {
        const sx = noise2D(i, 0) * w;
        const sy = noise2D(0, i) * h;
        const shade = (noise2D(i * 2, i) - 0.5) * 0.06;
        const sc = c.clone().offsetHSL(0, 0, shade);
        ctx.fillStyle = sc.getStyle();
        ctx.fillRect(sx, sy, 1, 1);
      }
      // 波紋
      for (let r = 0; r < 8; r++) {
        const rx = w * 0.2 + noise2D(r, 1) * w * 0.6;
        const ry = h * 0.2 + noise2D(1, r) * h * 0.6;
        ctx.strokeStyle = `rgba(0,0,0,0.04)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 30 + noise2D(r, r) * 40, 8, noise2D(r, 3) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [c]);
  tex.repeat.set(2, 2);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} roughness={1.0} metalness={0} />
    </mesh>
  );
}

function TileFloorOverlay({ color }: { color: string }) {
  const c = new THREE.Color(color);
  const tex = useMemo(() => {
    return createCanvasTexture((ctx, w, h) => {
      const tileSize = w / 4;
      for (let tx = 0; tx < 4; tx++) {
        for (let ty = 0; ty < 4; ty++) {
          const isAlt = (tx + ty) % 2 === 0;
          const tc = isAlt ? c.clone() : c.clone().offsetHSL(0, -0.1, 0.08);
          ctx.fillStyle = tc.getStyle();
          ctx.fillRect(tx * tileSize + 1, ty * tileSize + 1, tileSize - 2, tileSize - 2);
          // タイルの光沢グラデーション
          const grad = ctx.createLinearGradient(tx * tileSize, ty * tileSize, tx * tileSize + tileSize, ty * tileSize + tileSize);
          grad.addColorStop(0, 'rgba(255,255,255,0.06)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.04)');
          ctx.fillStyle = grad;
          ctx.fillRect(tx * tileSize + 2, ty * tileSize + 2, tileSize - 4, tileSize - 4);
          // 目地
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, 1.5);
          ctx.fillRect(tx * tileSize, ty * tileSize, 1.5, tileSize);
        }
      }
    });
  }, [c]);
  tex.repeat.set(2, 2);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} roughness={0.25} metalness={0.15} />
    </mesh>
  );
}

function LavaFloorOverlay({ color }: { color: string }) {
  const c = new THREE.Color(color);
  const tex = useMemo(() => {
    return createCanvasTexture((ctx, w, h) => {
      // 暗い岩ベース
      ctx.fillStyle = '#1a0a05';
      ctx.fillRect(0, 0, w, h);
      // 溶岩の亀裂
      for (let crack = 0; crack < 20; crack++) {
        const grad = ctx.createLinearGradient(
          noise2D(crack, 0) * w, noise2D(crack, 1) * h,
          noise2D(crack, 2) * w, noise2D(crack, 3) * h
        );
        grad.addColorStop(0, 'rgba(255,69,0,0)');
        grad.addColorStop(0.3, c.getStyle());
        grad.addColorStop(0.5, '#FF6B35');
        grad.addColorStop(0.7, c.getStyle());
        grad.addColorStop(1, 'rgba(255,69,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + noise2D(crack, 5) * 4;
        ctx.beginPath();
        let lx = noise2D(crack, 6) * w;
        let ly = noise2D(crack, 7) * h;
        ctx.moveTo(lx, ly);
        for (let s = 0; s < 8; s++) {
          lx += (noise2D(crack * 10 + s, 0) - 0.5) * 60;
          ly += (noise2D(0, crack * 10 + s) - 0.5) * 60;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
    });
  }, [c]);
  tex.repeat.set(2, 2);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} emissive="#FF4500" emissiveIntensity={0.6} roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

// ============================================================
// 高品質 Wall Overlay（テクスチャベース）
// ============================================================

function BrickWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const { map, bumpMap } = useBrickTextures(color);
  return (
    <mesh position={[position[0], position[1], position[2] + 0.08]} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.04} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function GlassWallOverlay({ position, rotation }: {
  position: [number, number, number]; rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.15}
          roughness={0.02}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function PanelWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const c = new THREE.Color(color);
  const tex = useMemo(() => {
    return createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = c.getStyle();
      ctx.fillRect(0, 0, w, h);
      const panelW = w / 4;
      const panelH = h / 3;
      for (let px = 0; px < 4; px++) {
        for (let py = 0; py < 3; py++) {
          // パネルの境界線
          ctx.strokeStyle = c.clone().offsetHSL(0, 0, 0.15).getStyle();
          ctx.lineWidth = 2;
          ctx.strokeRect(px * panelW, py * panelH, panelW, panelH);
          // パネル光沢
          const grad = ctx.createLinearGradient(px * panelW, py * panelH, px * panelW + panelW, py * panelH + panelH);
          grad.addColorStop(0, 'rgba(255,255,255,0.05)');
          grad.addColorStop(1, 'rgba(0,0,0,0.03)');
          ctx.fillStyle = grad;
          ctx.fillRect(px * panelW + 2, py * panelH + 2, panelW - 4, panelH - 4);
        }
      }
    });
  }, [c]);
  return (
    <mesh position={[position[0], position[1], position[2] + 0.08]} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} roughness={0.2} metalness={0.85} />
    </mesh>
  );
}

function WoodWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const { map, bumpMap } = useWoodFloorTextures(color);
  return (
    <mesh position={[position[0], position[1], position[2] + 0.08]} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.02} roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

function RockWallOverlay({ color, position, rotation, width, height }: {
  color: string; position: [number, number, number]; rotation: [number, number, number]; width: number; height: number;
}) {
  const { map, bumpMap } = useRockTextures(color);
  return (
    <mesh position={[position[0], position[1], position[2] + 0.08]} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.06} roughness={0.95} metalness={0.1} />
    </mesh>
  );
}

// ---- Exports ----

interface FloorOverlayProps {
  pattern: string;
  color: string;
}

export function FloorOverlay({ pattern, color }: FloorOverlayProps) {
  switch (pattern) {
    case 'wood': return <WoodFloorOverlay color={color} />;
    case 'stone': return <StoneFloorOverlay color={color} />;
    case 'tile': return <TileFloorOverlay color={color} />;
    case 'lava': return <LavaFloorOverlay color={color} />;
    case 'grass': return <GrassFloorOverlay color={color} />;
    case 'sand': return <SandFloorOverlay color={color} />;
    default: return null;
  }
}

export function getFloorMaterialProps(pattern: string): MaterialParams {
  return FLOOR_MATERIALS[pattern as FloorPattern] ?? FLOOR_MATERIALS.solid;
}

export function getWallMaterialProps(pattern: string): MaterialParams {
  return WALL_MATERIALS[pattern as WallPattern] ?? WALL_MATERIALS.solid;
}

interface WallOverlayProps {
  pattern: string;
  color: string;
  wall: 'back' | 'left' | 'right';
}

export function WallOverlay({ pattern, color, wall }: WallOverlayProps) {
  const wallPositions: Record<string, { pos: [number, number, number]; rot: [number, number, number]; w: number }> = {
    back: { pos: [0, ROOM_H / 2, -ROOM_D / 2], rot: [0, 0, 0], w: ROOM_W },
    left: { pos: [-ROOM_W / 2, ROOM_H / 2, 0], rot: [0, Math.PI / 2, 0], w: ROOM_D },
    right: { pos: [ROOM_W / 2, ROOM_H / 2, 0], rot: [0, Math.PI / 2, 0], w: ROOM_D },
  };
  const wp = wallPositions[wall]!;

  switch (pattern) {
    case 'brick': return <BrickWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'glass': return <GlassWallOverlay position={wp.pos} rotation={wp.rot} />;
    case 'panel': return <PanelWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'wood': return <WoodWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    case 'rock': return <RockWallOverlay color={color} position={wp.pos} rotation={wp.rot} width={wp.w} height={ROOM_H} />;
    default: return null;
  }
}
