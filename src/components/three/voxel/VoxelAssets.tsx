/**
 * VoxelAssets — VoxelModelsのジェネレーターをuseMemoでキャッシュし、
 * VoxelGridでレンダリングするReactコンポーネント群。
 * ThemeDecorationsから使用される。
 */

import { useMemo } from 'react';
import { VoxelGrid, EmissiveVoxelGrid } from './VoxelGrid';
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
  const data = useMemo(() => generatePalmTree(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelGrassModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 100, width = 20, depth = 20 }: BaseProps & { width?: number; depth?: number }) {
  const data = useMemo(() => generateGrassField(width, depth, seed), [width, depth, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelRockModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 300, size = 10 }: BaseProps & { size?: number }) {
  const data = useMemo(() => generateRock(size, seed), [size, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelCrystalModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 400, height = 18 }: BaseProps & { height?: number }) {
  const data = useMemo(() => generateCrystal(height, seed), [height, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} enableAO aoIntensity={0.55} />;
}

export function VoxelCoralModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 500 }: BaseProps) {
  const data = useMemo(() => generateCoral(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelMushroomModel({ position, rotation, scale = 1, voxelSize = 0.05, seed = 600 }: BaseProps) {
  const data = useMemo(() => generateMushroom(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelLavaModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 700 }: BaseProps) {
  const data = useMemo(() => generateLavaFlow(seed), [seed]);
  return <EmissiveVoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} emissiveColor="#FF4500" emissiveIntensity={1.5} />;
}

export function VoxelSeaweedModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 800 }: BaseProps) {
  const data = useMemo(() => generateSeaweed(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelBuildingModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 900, width = 10, height = 30, depth = 10 }: BaseProps & { width?: number; height?: number; depth?: number }) {
  const data = useMemo(() => generateBuilding(width, height, depth, seed), [width, height, depth, seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelWaterTowerModel({ position, rotation, scale = 1, voxelSize = 0.07, seed = 1000 }: BaseProps) {
  const data = useMemo(() => generateWaterTower(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelSpaceConsoleModel({ position, rotation, scale = 1, voxelSize = 0.07, seed = 1100 }: BaseProps) {
  const data = useMemo(() => generateSpaceConsole(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelTreasureChestModel({ position, rotation, scale = 1, voxelSize = 0.06, seed = 1200 }: BaseProps) {
  const data = useMemo(() => generateTreasureChest(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}

export function VoxelJellyfishModel({ position, rotation, scale = 1, voxelSize = 0.05, seed = 1300 }: BaseProps) {
  const data = useMemo(() => generateJellyfish(seed), [seed]);
  return <EmissiveVoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} emissiveColor="#80DEEA" emissiveIntensity={1} transparent opacity={0.7} />;
}

export function VoxelFloatingIslandModel({ position, rotation, scale = 1, voxelSize = 0.08, seed = 1400 }: BaseProps) {
  const data = useMemo(() => generateFloatingIsland(seed), [seed]);
  return <VoxelGrid data={data} voxelSize={voxelSize} position={position} rotation={rotation} scale={scale} />;
}
