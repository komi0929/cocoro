/**
 * cocoro  EFurnitureDragger (Mobile-First)
 * PointerEvent ベ�EスのタチE��対応ドラチE��移勁E * 床面/壁E��のRaycast追征E+ clamp
 */

import { useCallback, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useAjitStore } from '@/store/useAjitStore';
import { getFurnitureDef } from '@/data/furnitureCatalog';
import * as THREE from 'three';

const ROOM_W = 8;
const ROOM_D = 8;
const HALF_W = ROOM_W / 2 - 0.3;
const HALF_D = ROOM_D / 2 - 0.3;

export function FurnitureDragger() {
  const selectedId = useAjitStore(s => s.selectedFurnitureId);
  const isDragging = useAjitStore(s => s.isDragging);
  const setDragging = useAjitStore(s => s.setDragging);
  const moveFurniture = useAjitStore(s => s.moveFurniture);
  const rotateFurniture = useAjitStore(s => s.rotateFurniture);
  const placedFurniture = useAjitStore(s => s.placedFurniture);
  const { scene, camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const dragStartTime = useRef(0);
  const hasMoved = useRef(false);
  const DRAG_THRESHOLD_MS = 150;

  const selectedItem = selectedId
    ? placedFurniture.find(f => f.id === selectedId)
    : null;

  const isWallItem = selectedItem
    ? (getFurnitureDef(selectedItem.type)?.placement === 'wall')
    : false;

  // Compute pointer from native event (mouse or touch)
  const updatePointer = useCallback((e: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
  }, [gl]);

  const doRaycast = useCallback(() => {
    if (!selectedId || !selectedItem) return;

    raycaster.current.setFromCamera(pointer.current, camera);

    if (isWallItem) {
      const walls = ['wall-back', 'wall-left', 'wall-right']
        .map(name => scene.getObjectByName(name))
        .filter(Boolean) as THREE.Object3D[];

      const intersects = raycaster.current.intersectObjects(walls, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;
        const normal = hit.face?.normal;
        if (normal && hit.object) {
          const worldNormal = normal.clone().transformDirection(hit.object.matrixWorld);
          const wallPos: [number, number, number] = [
            point.x + worldNormal.x * 0.02,
            Math.max(0.3, Math.min(3.0, point.y)),
            point.z + worldNormal.z * 0.02,
          ];
          let rotY = 0;
          if (Math.abs(worldNormal.z) > 0.5) {
            rotY = worldNormal.z > 0 ? 0 : Math.PI;
          } else if (Math.abs(worldNormal.x) > 0.5) {
            rotY = worldNormal.x > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          moveFurniture(selectedId, wallPos);
          rotateFurniture(selectedId, rotY);
        }
      }
    } else {
      const floor = scene.getObjectByName('floor');
      if (!floor) return;
      const intersects = raycaster.current.intersectObject(floor);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const x = Math.max(-HALF_W, Math.min(HALF_W, point.x));
        const z = Math.max(-HALF_D, Math.min(HALF_D, point.z));
        moveFurniture(selectedId, [x, 0, z]);
      }
    }
  }, [selectedId, selectedItem, isWallItem, camera, scene, moveFurniture, rotateFurniture]);

  // Native pointer event handlers on canvas DOM element
  useEffect(() => {
    if (!selectedId) return;
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      dragStartTime.current = Date.now();
      hasMoved.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragStartTime.current === 0) return;
      const elapsed = Date.now() - dragStartTime.current;
      if (elapsed < DRAG_THRESHOLD_MS && !hasMoved.current) return;

      if (!hasMoved.current) {
        hasMoved.current = true;
        setDragging(true);
        // Capture pointer for smooth tracking
        canvas.setPointerCapture(e.pointerId);
      }

      updatePointer(e);
      doRaycast();
    };

    const onPointerUp = (e: PointerEvent) => {
      dragStartTime.current = 0;
      if (hasMoved.current) {
        hasMoved.current = false;
        setDragging(false);
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerup', onPointerUp, { passive: true });
    canvas.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [selectedId, gl, setDragging, updatePointer, doRaycast]);

  // No visible mesh needed - we use native DOM events
  return null;
}
