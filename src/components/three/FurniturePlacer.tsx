/**
 * cocoro  EFurniturePlacer Phase 4
 * 床面/壁E��との raycasting でタチE��位置に家具を設置する
 * placement属性に応じて壁E�� or 床面にRaycast先を刁E��
 */

import { useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { useAjitStore } from '@/store/useAjitStore';
import { getFurnitureDef } from '@/data/furnitureCatalog';
import * as THREE from 'three';

const ROOM_W = 8;
const ROOM_D = 8;
const HALF_W = ROOM_W / 2 - 0.3;
const HALF_D = ROOM_D / 2 - 0.3;

export function FurniturePlacer() {
  const placingType = useAjitStore(s => s.placingType);
  const addFurniture = useAjitStore(s => s.addFurniture);
  const setPlacingType = useAjitStore(s => s.setPlacingType);
  const { scene } = useThree();

  const isWallPlacement = placingType
    ? (getFurnitureDef(placingType)?.placement === 'wall')
    : false;

  const handleClick = useCallback((e: any) => {
    if (!placingType) return;
    e.stopPropagation();

    if (isWallPlacement) {
      // Wall placement: find wall intersections
      const point = e.point;
      const intersections = e.intersections;

      // Look for wall hits
      for (const hit of intersections) {
        const name = hit.object?.name || '';
        if (name.startsWith('wall-') && hit.face) {
          const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
          const wallPos: [number, number, number] = [
            point.x + normal.x * 0.02,
            Math.max(0.5, Math.min(3.0, point.y)),
            point.z + normal.z * 0.02,
          ];

          let rotY = 0;
          if (Math.abs(normal.z) > 0.5) {
            rotY = normal.z > 0 ? 0 : Math.PI;
          } else if (Math.abs(normal.x) > 0.5) {
            rotY = normal.x > 0 ? Math.PI / 2 : -Math.PI / 2;
          }

          const item = { id: crypto.randomUUID(), type: placingType, position: wallPos as [number,number,number], rotationY: rotY };
          addFurniture(item);
          setPlacingType(null);
          return;
        }
      }
    } else {
      // Floor placement
      const point = e.point;
      const x = Math.max(-HALF_W, Math.min(HALF_W, point.x));
      const z = Math.max(-HALF_D, Math.min(HALF_D, point.z));
      const item = { id: crypto.randomUUID(), type: placingType, position: [x, 0, z] as [number,number,number], rotationY: 0 };
      addFurniture(item);
      setPlacingType(null);
    }
  }, [placingType, addFurniture, setPlacingType, isWallPlacement]);

  if (!placingType) return null;

  if (isWallPlacement) {
    // Wall placement: show highlight on walls
    return (
      <group>
        {/* 奥壁ハイライチE*/}
        <mesh position={[0, 1.75, -ROOM_D / 2 + 0.08]} onClick={handleClick}>
          <planeGeometry args={[ROOM_W - 0.4, 3]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
        {/* 左壁ハイライチE*/}
        <mesh position={[-ROOM_W / 2 + 0.08, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} onClick={handleClick}>
          <planeGeometry args={[ROOM_D - 0.4, 3]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
        {/* 右壁ハイライチE*/}
        <mesh position={[ROOM_W / 2 - 0.08, 1.75, 0]} rotation={[0, -Math.PI / 2, 0]} onClick={handleClick}>
          <planeGeometry args={[ROOM_D - 0.4, 3]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  // Floor placement overlay
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshBasicMaterial color="#00f5d4" transparent opacity={0.08} />
    </mesh>
  );
}
