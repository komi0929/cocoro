/**
 * VoxelAssets — VoxelModelsのジェネレーターをensureQuality品質ゲート経由で
 * useMemoでキャッシュし、VoxelGridでレンダリングするReactコンポーネント群。
 * ThemeDecorationsから使用される。
 */

import { useMemo } from 'react';
import { VoxelGrid, EmissiveVoxelGrid } from './VoxelGrid';
import { ensureQuality } from './VoxelEngine';
import {
  generatePalmTree, generateGrassField, generateRock, generateCrystal,
  generateCoral, generateMushroom, generateLavaFlow, generateSeaweed,
  generateBuilding, generateWaterTower, generateSpaceConsole,
  generateTreasureChest, generateJellyfish, generateFloatingIsland,
} from './VoxelModels';

interface BaseProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  voxelSize?: number;
  seed?: number;
}

export function VoxelPalmTreeModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 42 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generatePalmTree(s), 'environment', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelGrassModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 100, width = 20, depth = 20 }: BaseProps & { width?: number; depth?: number }) {
  const data = useMemo(() => ensureQuality((s) => generateGrassField(width, depth, s), 'environment', seed), [width, depth, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelRockModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 300, size = 10 }: BaseProps & { size?: number }) {
  const data = useMemo(() => ensureQuality((s) => generateRock(size, s), 'environment', seed), [size, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelCrystalModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 400, height = 18 }: BaseProps & { height?: number }) {
  const data = useMemo(() => ensureQuality((s) => generateCrystal(height, s), 'decoration', seed), [height, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} enableAO aoIntensity={0.55} />;
}

export function VoxelCoralModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 500 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateCoral(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelMushroomModel({ position, rotation, scale = 1, voxelSize = 0.05, seed = 600 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateMushroom(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelLavaModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 700 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateLavaFlow(s), 'decoration', seed), [seed]);
  return <EmissiveVoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} emissiveColor="#FF4500" emissiveIntensity={1.5} />;
}

export function VoxelSeaweedModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 800 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateSeaweed(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelBuildingModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 900, width = 10, height = 30, depth = 10 }: BaseProps & { width?: number; height?: number; depth?: number }) {
  const data = useMemo(() => ensureQuality((s) => generateBuilding(width, height, depth, s), 'environment', seed), [width, height, depth, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelWaterTowerModel({ position, rotation, scale = 1, voxelSize = 0.07, seed = 1000 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateWaterTower(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelSpaceConsoleModel({ position, rotation, scale = 1, voxelSize = 0.07, seed = 1100 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateSpaceConsole(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelTreasureChestModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 1200 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateTreasureChest(s), 'decoration', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelJellyfishModel({ position, rotation, scale = 1, voxelSize = 0.05, seed = 1300 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateJellyfish(s), 'decoration', seed), [seed]);
  return <EmissiveVoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} emissiveColor="#80DEEA" emissiveIntensity={1} transparent opacity={0.7} />;
}

export function VoxelFloatingIslandModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 1400 }: BaseProps) {
  const data = useMemo(() => ensureQuality((s) => generateFloatingIsland(s), 'environment', seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}
