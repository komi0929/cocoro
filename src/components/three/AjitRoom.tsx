/**
 * cocoro - AjitRoom Phase 7
 * Theme-aware 3D room with 8 immersive visual worlds
 * Floor, walls, ceiling, lighting, decorations, particles all change based on theme
 */

import { useAjitStore } from '@/store/useAjitStore';
import { useRoomStore } from '@/store/useRoomStore';
import { VoxelFurniture } from './furniture/VoxelFurniture';
import { AvatarEntity } from './AvatarEntity';
import { Environment, ContactShadows } from '@react-three/drei';
import { ROOM_THEMES } from '@/types/cocoro';
import type { RoomThemeDef } from '@/types/cocoro';
import { ThemeParticles } from './ThemeParticles';
import { ThemeDecorations } from './ThemeDecorations';
import { FloorOverlay, WallOverlay, getFloorMaterialProps, getWallMaterialProps } from './ThemeMaterials';

const ROOM_W = 8;
const ROOM_D = 8;
const ROOM_H = 3.5;

const DEFAULT_THEME: RoomThemeDef = ROOM_THEMES.underground;

export function AjitRoom() {
  const furniture = useAjitStore(s => s.placedFurniture);
  const selectedId = useAjitStore(s => s.selectedFurnitureId);
  const selectFurniture = useAjitStore(s => s.selectFurniture);
  const deselectFurniture = useAjitStore(s => s.deselectFurniture);
  const currentRoom = useRoomStore(s => s.currentRoom);

  const theme = currentRoom ? ROOM_THEMES[currentRoom.theme] : DEFAULT_THEME;
  const themeId = currentRoom?.theme ?? 'underground';
  const floorMat = getFloorMaterialProps(theme.floorPattern);
  const wallMat = getWallMaterialProps(theme.wallPattern);

  return (
    <group>
      {/* ===== Environment ===== */}
      <Environment preset={theme.environmentPreset} background={false} />
      <fog attach="fog" args={[theme.fogColor, 8, 20]} />

      {/* ===== Ambient Lighting ===== */}
      <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />

      {/* ===== Main Ceiling Light ===== */}
      <pointLight
        position={[0, ROOM_H - 0.5, 0]}
        intensity={theme.ambientIntensity > 0.6 ? 6 : 4}
        color={theme.ambientIntensity > 0.6 ? '#FFF8E1' : '#fde68a'}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />

      {/* ===== Directional Accent Light ===== */}
      <directionalLight
        position={[3, ROOM_H, 2]}
        intensity={theme.ambientIntensity > 0.6 ? 1.5 : 0.6}
        color={theme.accentColor}
        castShadow
      />

      {/* ===== Special Theme Lighting ===== */}
      {theme.specialLighting && (
        <>
          <spotLight
            position={[0, ROOM_H - 0.3, 0]}
            angle={Math.PI / 3}
            penumbra={0.8}
            intensity={theme.specialLighting.spotIntensity}
            color={theme.specialLighting.spotColor}
            distance={8}
            decay={2}
          />
          {theme.specialLighting.godRayColor && (
            <pointLight
              position={[2, ROOM_H, -2]}
              color={theme.specialLighting.godRayColor}
              intensity={1.5}
              distance={6}
              decay={2}
            />
          )}
        </>
      )}

      {/* ===== Floor ===== */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        name="floor"
        onClick={(e) => {
          e.stopPropagation();
          deselectFurniture();
        }}
      >
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          color={theme.floorColor}
          roughness={floorMat.roughness}
          metalness={floorMat.metalness}
          emissive={floorMat.emissive}
          emissiveIntensity={floorMat.emissiveIntensity ?? 0}
        />
      </mesh>

      {/* ===== Floor Pattern Overlay ===== */}
      <FloorOverlay pattern={theme.floorPattern} color={theme.floorColor} />

      {/* ===== Back Wall ===== */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]} name="wall-back" receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H, 0.15]} />
        <meshStandardMaterial
          color={theme.wallColor}
          roughness={wallMat.roughness}
          metalness={wallMat.metalness}
          emissive={wallMat.emissive}
          emissiveIntensity={wallMat.emissiveIntensity ?? 0}
          transparent={wallMat.transparent}
          opacity={wallMat.opacity ?? 1}
        />
      </mesh>

      {/* ===== Left Wall ===== */}
      <mesh
        position={[-ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        name="wall-left"
        receiveShadow
      >
        <boxGeometry args={[ROOM_D, ROOM_H, 0.15]} />
        <meshStandardMaterial
          color={theme.wallColor}
          roughness={wallMat.roughness}
          metalness={wallMat.metalness}
          emissive={wallMat.emissive}
          emissiveIntensity={wallMat.emissiveIntensity ?? 0}
          transparent={wallMat.transparent}
          opacity={wallMat.opacity ?? 1}
        />
      </mesh>

      {/* ===== Right Wall ===== */}
      <mesh
        position={[ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        name="wall-right"
        receiveShadow
      >
        <boxGeometry args={[ROOM_D, ROOM_H, 0.15]} />
        <meshStandardMaterial
          color={theme.wallColor}
          roughness={wallMat.roughness}
          metalness={wallMat.metalness}
          emissive={wallMat.emissive}
          emissiveIntensity={wallMat.emissiveIntensity ?? 0}
          transparent={wallMat.transparent}
          opacity={wallMat.opacity ?? 1}
        />
      </mesh>

      {/* ===== Wall Pattern Overlays ===== */}
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="back" />
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="left" />
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="right" />

      {/* ===== Ceiling ===== */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={theme.ceilingColor} roughness={0.9} />
      </mesh>

      {/* ===== Neon Accent Strips ===== */}
      <mesh position={[0, ROOM_H - 0.06, -ROOM_D / 2 + 0.1]}>
        <boxGeometry args={[ROOM_W - 0.4, 0.04, 0.04]} />
        <meshStandardMaterial
          color={theme.accentColor}
          emissive={theme.accentColor}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0, ROOM_H - 0.1, -ROOM_D / 2 + 0.3]}
        color={theme.accentColor}
        intensity={1}
        distance={3}
        decay={2}
      />

      <mesh position={[-ROOM_W / 2 + 0.1, ROOM_H - 0.06, 0]}>
        <boxGeometry args={[0.04, 0.04, ROOM_D - 0.4]} />
        <meshStandardMaterial
          color={theme.neonColor}
          emissive={theme.neonColor}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[-ROOM_W / 2 + 0.3, ROOM_H - 0.1, 0]}
        color={theme.neonColor}
        intensity={0.8}
        distance={3}
        decay={2}
      />

      {/* ===== Theme Particles ===== */}
      {theme.particles && (
        <ThemeParticles config={theme.particles} bounds={[ROOM_W - 1, ROOM_H - 0.5, ROOM_D - 1]} />
      )}

      {/* ===== Theme Decorations ===== */}
      <ThemeDecorations theme={themeId} />

      {/* ===== Contact Shadows ===== */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={ROOM_W}
        blur={2}
        far={4}
      />

      {/* ===== Furniture ===== */}
      {furniture.map(item => (
        <VoxelFurniture
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onClick={() => {
            selectFurniture(item.id);
          }}
        />
      ))}

      {/* ===== Avatar Entity ===== */}
      <AvatarEntity />
    </group>
  );
}
