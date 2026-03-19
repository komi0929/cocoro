/**
 * cocoro  EVoxel Face Texture Generator (Phase 5)
 * Canvas APIで16ÁE6ドット絵チE��スチャを動皁E��戁E * THREE.NearestFilterでピクセルアートをくっきり描画
 */

import * as THREE from 'three';
import type { AvatarSpecies } from '@/types/cocoro';

const TEX_SIZE = 16;

/** HSL色をCSS斁E���Eに変換 */
function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** ピクセルを描ぁE*/
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** 矩形を描ぁE*/
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// 顔パターン定義
function drawBearFace(ctx: CanvasRenderingContext2D) {
  // 目�E�黒い2px�E�E  px(ctx, 5, 6, '#111');  px(ctx, 6, 6, '#111');
  px(ctx, 9, 6, '#111');  px(ctx, 10, 6, '#111');
  // 目のハイライチE  px(ctx, 5, 6, '#333');
  px(ctx, 9, 6, '#333');
  // 鼻
  px(ctx, 7, 8, '#222'); px(ctx, 8, 8, '#222');
  // 口�E�ニチE��リ�E�E  px(ctx, 6, 9, '#333'); px(ctx, 9, 9, '#333');
  px(ctx, 7, 10, '#333'); px(ctx, 8, 10, '#333');
  // ほっぺ�E�ピンク�E�E  px(ctx, 3, 9, '#FF8FAA'); px(ctx, 4, 9, '#FF8FAA'); px(ctx, 4, 10, '#FF8FAA');
  px(ctx, 11, 9, '#FF8FAA'); px(ctx, 12, 9, '#FF8FAA'); px(ctx, 11, 10, '#FF8FAA');
}

function drawCatFace(ctx: CanvasRenderingContext2D) {
  // 目�E�縦長キャチE��アイ�E�E  px(ctx, 5, 5, '#111'); px(ctx, 5, 6, '#111'); px(ctx, 5, 7, '#111');
  px(ctx, 10, 5, '#111'); px(ctx, 10, 6, '#111'); px(ctx, 10, 7, '#111');
  // 瞳允E  px(ctx, 5, 5, '#44AA44');
  px(ctx, 10, 5, '#44AA44');
  // 鼻�E�小さぁE��ンク三角！E  px(ctx, 7, 8, '#FFB6C1'); px(ctx, 8, 8, '#FFB6C1');
  // 口�E�ω！E  px(ctx, 6, 9, '#444'); px(ctx, 7, 10, '#444');
  px(ctx, 9, 9, '#444'); px(ctx, 8, 10, '#444');
  // ヒゲ
  rect(ctx, 1, 8, 3, 1, '#555');
  rect(ctx, 12, 8, 3, 1, '#555');
  rect(ctx, 1, 10, 3, 1, '#555');
  rect(ctx, 12, 10, 3, 1, '#555');
  // ほっぺ
  px(ctx, 3, 9, '#FFB0C0'); px(ctx, 12, 9, '#FFB0C0');
}

function drawDogFace(ctx: CanvasRenderingContext2D) {
  // 目�E�丸ぁE��きめ�E�E  px(ctx, 5, 6, '#111'); px(ctx, 6, 6, '#111');
  px(ctx, 5, 7, '#111'); px(ctx, 6, 7, '#111');
  px(ctx, 9, 6, '#111'); px(ctx, 10, 6, '#111');
  px(ctx, 9, 7, '#111'); px(ctx, 10, 7, '#111');
  // ハイライチE  px(ctx, 5, 6, '#444');
  px(ctx, 9, 6, '#444');
  // 鼻
  rect(ctx, 7, 8, 2, 1, '#222');
  // 舁E  px(ctx, 7, 10, '#FF6B8A'); px(ctx, 8, 10, '#FF6B8A');
  px(ctx, 7, 11, '#FF6B8A'); px(ctx, 8, 11, '#FF6B8A');
  // ほっぺ
  px(ctx, 3, 9, '#FFB0C0'); px(ctx, 12, 9, '#FFB0C0');
}

function drawRabbitFace(ctx: CanvasRenderingContext2D) {
  // 目�E�キラキラ丸目�E�E  px(ctx, 5, 6, '#CC2255'); px(ctx, 6, 6, '#CC2255');
  px(ctx, 5, 7, '#CC2255'); px(ctx, 6, 7, '#CC2255');
  px(ctx, 10, 6, '#CC2255'); px(ctx, 11, 6, '#CC2255');
  px(ctx, 10, 7, '#CC2255'); px(ctx, 11, 7, '#CC2255');
  // ハイライチE  px(ctx, 5, 6, '#FF88AA');
  px(ctx, 10, 6, '#FF88AA');
  // 鼻�E�ピンクY�E�E  px(ctx, 7, 9, '#FFB6C1'); px(ctx, 8, 9, '#FFB6C1');
  // 口
  px(ctx, 7, 10, '#AA5577'); px(ctx, 8, 10, '#AA5577');
  // ほっぺ
  rect(ctx, 2, 9, 2, 2, '#FF99B5');
  rect(ctx, 12, 9, 2, 2, '#FF99B5');
}

function drawFoxFace(ctx: CanvasRenderingContext2D) {
  // 目�E�シュチE��したつり目�E�E  px(ctx, 4, 6, '#111'); px(ctx, 5, 6, '#111'); px(ctx, 6, 7, '#111');
  px(ctx, 11, 6, '#111'); px(ctx, 10, 6, '#111'); px(ctx, 9, 7, '#111');
  // 鼻
  px(ctx, 7, 9, '#222'); px(ctx, 8, 9, '#222');
  // ニヤリ
  px(ctx, 5, 10, '#444'); px(ctx, 6, 10, '#444');
  px(ctx, 9, 10, '#444'); px(ctx, 10, 10, '#444');
  // 白マズル
  rect(ctx, 5, 8, 6, 4, 'rgba(255,255,255,0.15)');
}

function drawFrogFace(ctx: CanvasRenderingContext2D) {
  // 大きい目�E�上寁E���E�E  rect(ctx, 3, 3, 3, 3, '#111');
  rect(ctx, 10, 3, 3, 3, '#111');
  // 瞳
  rect(ctx, 4, 3, 2, 2, '#EEDD00');
  rect(ctx, 11, 3, 2, 2, '#EEDD00');
  px(ctx, 4, 3, '#222');
  px(ctx, 11, 3, '#222');
  // 口�E�にっこり大きく�E�E  rect(ctx, 3, 10, 10, 1, '#335522');
  px(ctx, 3, 9, '#335522'); px(ctx, 12, 9, '#335522');
  // ほっぺ
  rect(ctx, 1, 8, 2, 2, '#FF8888');
  rect(ctx, 13, 8, 2, 2, '#FF8888');
}

function drawPenguinFace(ctx: CanvasRenderingContext2D) {
  // 白ぁE��エリア
  rect(ctx, 3, 3, 10, 10, 'rgba(255,255,255,0.3)');
  // 目
  px(ctx, 5, 6, '#111'); px(ctx, 6, 6, '#111');
  px(ctx, 9, 6, '#111'); px(ctx, 10, 6, '#111');
  // ハイライチE  px(ctx, 5, 6, '#333');
  px(ctx, 9, 6, '#333');
  // くちばし（黁E��三角！E  rect(ctx, 6, 9, 4, 1, '#FFB300');
  rect(ctx, 7, 10, 2, 1, '#FFB300');
  // ほっぺ
  px(ctx, 4, 8, '#FF99B5'); px(ctx, 11, 8, '#FF99B5');
}

function drawPandaFace(ctx: CanvasRenderingContext2D) {
  // 黒い目の周り（パンダ模様！E  rect(ctx, 3, 4, 4, 4, 'rgba(0,0,0,0.6)');
  rect(ctx, 9, 4, 4, 4, 'rgba(0,0,0,0.6)');
  // 目�E�白+黒！E  px(ctx, 5, 5, '#111'); px(ctx, 5, 6, '#111');
  px(ctx, 11, 5, '#111'); px(ctx, 11, 6, '#111');
  // ハイライチE  px(ctx, 5, 5, '#555');
  px(ctx, 11, 5, '#555');
  // 鼻
  px(ctx, 7, 9, '#222'); px(ctx, 8, 9, '#222');
  // 口
  px(ctx, 7, 10, '#444'); px(ctx, 8, 10, '#444');
  // ほっぺ
  px(ctx, 4, 9, '#FF99B5'); px(ctx, 12, 9, '#FF99B5');
}

const FACE_DRAWERS: Record<AvatarSpecies, (ctx: CanvasRenderingContext2D) => void> = {
  bear: drawBearFace,
  cat: drawCatFace,
  dog: drawDogFace,
  rabbit: drawRabbitFace,
  fox: drawFoxFace,
  frog: drawFrogFace,
  penguin: drawPenguinFace,
  panda: drawPandaFace,
};

/** 種族デフォルト�E毛色 */
export const SPECIES_DEFAULT_COLORS: Record<AvatarSpecies, string> = {
  bear: '#8B6914',
  cat: '#FF9800',
  dog: '#C49A6C',
  rabbit: '#F8F0E3',
  fox: '#FF6D00',
  frog: '#4CAF50',
  penguin: '#37474F',
  panda: '#FAFAFA',
};

// チE��スチャキャチE��ュ
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * 種族に応じた顔テクスチャを生成（キャチE��ュ付き�E�E */
export function createFaceTexture(species: AvatarSpecies): THREE.CanvasTexture {
  const cacheKey = species;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;

  // 透�E背景
  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);

  // 顔を描画
  const drawer = FACE_DRAWERS[species];
  if (drawer) drawer(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/** キャチE��ュクリア */
export function clearFaceTextureCache() {
  textureCache.forEach(t => t.dispose());
  textureCache.clear();
}
