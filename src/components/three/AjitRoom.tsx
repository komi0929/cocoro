/**
 * cocoro - AjitRoom Phase 7
 * Theme-aware 3D room with 8 immersive visual worlds
 * Floor, walls, ceiling, lighting, decorations, particles all change based on theme
 */

import { useAjitStore } from '@/store/useAjitStore';
import { useRoomStore } from '@/store/useRoomStore';
import * as THREE from 'three';
import { VoxelFurniture } from './furniture/VoxelFurniture';
import { AvatarEntity } from './AvatarEntity';
import { Environment, ContactShadows } from '@react-three/drei';
import { ROOM_THEMES } from '@/types/cocoro';
import type { RoomThemeDef } from '@/types/cocoro';
import { ThemeParticles } from './ThemeParticles';
import { ThemeDecorations } from './ThemeDecorations';
import { ThemeArchitecture } from './ThemeArchitecture';
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
        intensity={theme.ambientIntensity > 0.6 ? 10 : 8}
        color="#FFE8C0"
        distance={12}
        decay={1.8}
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

      {/* ===== WOODEN PLANK FLOOR (見本準拠: 木目板1枚1枚) ===== */}
      {/* Click handler on invisible plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        name="floor"
        onClick={(e) => {
          e.stopPropagation();
          deselectFurniture();
        }}
      >
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      {/* Individual wooden planks */}
      {Array.from({ length: Math.ceil(ROOM_W / 0.45) }).map((_, i) => {
        const plankW = 0.42;
        const gap = 0.03;
        const x = -ROOM_W / 2 + (i + 0.5) * (plankW + gap);
        if (x > ROOM_W / 2) return null;
        // Alternate plank colors for natural wood look
        const plankColor = i % 2 === 0 ? theme.floorColor : (() => {
          const c = new THREE.Color(theme.floorColor);
          c.multiplyScalar(0.92);
          return '#' + c.getHexString();
        })();
        return (
          <mesh key={`plank-${i}`} position={[x, 0, 0]} receiveShadow>
            <boxGeometry args={[plankW, 0.04, ROOM_D - 0.1]} />
            <meshStandardMaterial
              color={plankColor}
              roughness={floorMat.roughness}
              metalness={floorMat.metalness}
            />
          </mesh>
        );
      })}

      {/* ===== Stepped Terrain Layers (voxel island edge) ===== */}
      {/* Layer 1: Grass/Top trim around edges */}
      {[
        { pos: [0, -0.06, -ROOM_D / 2 + 0.15] as [number,number,number], size: [ROOM_W + 0.3, 0.12, 0.3] as [number,number,number] },
        { pos: [0, -0.06, ROOM_D / 2 - 0.15] as [number,number,number], size: [ROOM_W + 0.3, 0.12, 0.3] as [number,number,number] },
        { pos: [-ROOM_W / 2 + 0.15, -0.06, 0] as [number,number,number], size: [0.3, 0.12, ROOM_D] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.15, -0.06, 0] as [number,number,number], size: [0.3, 0.12, ROOM_D] as [number,number,number] },
      ].map((edge, i) => (
        <mesh key={`edge1-${i}`} position={edge.pos} castShadow receiveShadow>
          <boxGeometry args={edge.size} />
          <meshStandardMaterial color={theme.accentColor} roughness={0.7} />
        </mesh>
      ))}
      {/* Layer 2: Dirt/mid layer */}
      {[
        { pos: [0, -0.22, -ROOM_D / 2 + 0.2] as [number,number,number], size: [ROOM_W + 0.5, 0.2, 0.4] as [number,number,number] },
        { pos: [0, -0.22, ROOM_D / 2 - 0.2] as [number,number,number], size: [ROOM_W + 0.5, 0.2, 0.4] as [number,number,number] },
        { pos: [-ROOM_W / 2 + 0.2, -0.22, 0] as [number,number,number], size: [0.4, 0.2, ROOM_D + 0.3] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.2, -0.22, 0] as [number,number,number], size: [0.4, 0.2, ROOM_D + 0.3] as [number,number,number] },
      ].map((edge, i) => (
        <mesh key={`edge2-${i}`} position={edge.pos} castShadow>
          <boxGeometry args={edge.size} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      ))}
      {/* Layer 3: Rock/bottom layer */}
      {[
        { pos: [0, -0.42, -ROOM_D / 2 + 0.25] as [number,number,number], size: [ROOM_W + 0.7, 0.2, 0.5] as [number,number,number] },
        { pos: [0, -0.42, ROOM_D / 2 - 0.25] as [number,number,number], size: [ROOM_W + 0.7, 0.2, 0.5] as [number,number,number] },
        { pos: [-ROOM_W / 2 + 0.25, -0.42, 0] as [number,number,number], size: [0.5, 0.2, ROOM_D + 0.5] as [number,number,number] },
        { pos: [ROOM_W / 2 - 0.25, -0.42, 0] as [number,number,number], size: [0.5, 0.2, ROOM_D + 0.5] as [number,number,number] },
      ].map((edge, i) => (
        <mesh key={`edge3-${i}`} position={edge.pos} castShadow>
          <boxGeometry args={edge.size} />
          <meshStandardMaterial color="#5C4033" roughness={0.95} />
        </mesh>
      ))}
      {/* Corner cubes for voxel stepped look */}
      {[
        [-ROOM_W / 2 + 0.2, -ROOM_D / 2 + 0.2],
        [ROOM_W / 2 - 0.2, -ROOM_D / 2 + 0.2],
        [-ROOM_W / 2 + 0.2, ROOM_D / 2 - 0.2],
        [ROOM_W / 2 - 0.2, ROOM_D / 2 - 0.2],
      ].map(([x, z], i) => (
        <group key={`corner-${i}`}>
          <mesh position={[x!, -0.06, z!]} castShadow>
            <boxGeometry args={[0.4, 0.12, 0.4]} />
            <meshStandardMaterial color={theme.accentColor} roughness={0.7} />
          </mesh>
          <mesh position={[x!, -0.25, z!]} castShadow>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color="#8B6914" roughness={0.9} />
          </mesh>
          <mesh position={[x!, -0.48, z!]} castShadow>
            <boxGeometry args={[0.6, 0.25, 0.6]} />
            <meshStandardMaterial color="#5C4033" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Under-floor fill (bottom of island) */}
      <mesh position={[0, -0.28, 0]} receiveShadow>
        <boxGeometry args={[ROOM_W, 0.55, ROOM_D]} />
        <meshStandardMaterial color="#4A3728" roughness={0.95} />
      </mesh>

      {/* ===== Floor Pattern Overlay ===== */}
      <FloorOverlay pattern={theme.floorPattern} color={theme.floorColor} />

      {/* ===== Back Wall — 腰壁2色化 (見本準拠) ===== */}
      {/* Upper wall (明るい色) */}
      <mesh position={[0, ROOM_H * 0.7, -ROOM_D / 2]} name="wall-back" receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H * 0.6, 0.15]} />
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
      {/* Lower wainscot (暗い腰壁+縦パネル溝) */}
      <mesh position={[0, ROOM_H * 0.2, -ROOM_D / 2]} receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H * 0.4, 0.16]} />
        <meshStandardMaterial
          color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.12, -0.22); return '#' + c.getHexString(); })()}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* 縦パネル溝 (back wall腰壁) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = -ROOM_W / 2 + 0.25 + i * (ROOM_W / 16);
        return (
          <mesh key={`bp-${i}`} position={[x, ROOM_H * 0.2, -ROOM_D / 2 + 0.082]}>
            <boxGeometry args={[0.02, ROOM_H * 0.36, 0.005]} />
            <meshStandardMaterial
              color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.15, -0.28); return '#' + c.getHexString(); })()}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      {/* Wainscot cap rail (腰壁の上端レール) */}
      <mesh position={[0, ROOM_H * 0.4, -ROOM_D / 2 + 0.09]}>
        <boxGeometry args={[ROOM_W + 0.05, 0.06, 0.04]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Wall crown molding (top) */}
      <mesh position={[0, ROOM_H - 0.05, -ROOM_D / 2 + 0.08]}>
        <boxGeometry args={[ROOM_W + 0.1, 0.1, 0.02]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Baseboard trim (巾木) */}
      <mesh position={[0, 0.04, -ROOM_D / 2 + 0.09]}>
        <boxGeometry args={[ROOM_W + 0.1, 0.08, 0.04]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* ===== Left Wall — 腰壁2色化 ===== */}
      {/* Upper */}
      <mesh position={[-ROOM_W / 2, ROOM_H * 0.7, 0]} rotation={[0, Math.PI / 2, 0]} name="wall-left" receiveShadow>
        <boxGeometry args={[ROOM_D, ROOM_H * 0.6, 0.15]} />
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
      {/* Lower wainscot */}
      <mesh position={[-ROOM_W / 2, ROOM_H * 0.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM_D, ROOM_H * 0.4, 0.16]} />
        <meshStandardMaterial
          color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.12, -0.22); return '#' + c.getHexString(); })()}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* 縦パネル溝 (left wall腰壁) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const z = -ROOM_D / 2 + 0.25 + i * (ROOM_D / 16);
        return (
          <mesh key={`lp-${i}`} position={[-ROOM_W / 2 + 0.082, ROOM_H * 0.2, z]}>
            <boxGeometry args={[0.005, ROOM_H * 0.36, 0.02]} />
            <meshStandardMaterial
              color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.15, -0.28); return '#' + c.getHexString(); })()}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      {/* Wainscot cap rail */}
      <mesh position={[-ROOM_W / 2 + 0.09, ROOM_H * 0.4, 0]}>
        <boxGeometry args={[0.04, 0.06, ROOM_D + 0.05]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Crown + baseboard */}
      <mesh position={[-ROOM_W / 2 + 0.08, ROOM_H - 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, ROOM_D + 0.1]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + 0.09, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.08, ROOM_D + 0.1]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* ===== Right Wall — 腰壁2色化 ===== */}
      {/* Upper */}
      <mesh position={[ROOM_W / 2, ROOM_H * 0.7, 0]} rotation={[0, Math.PI / 2, 0]} name="wall-right" receiveShadow>
        <boxGeometry args={[ROOM_D, ROOM_H * 0.6, 0.15]} />
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
      {/* Lower wainscot */}
      <mesh position={[ROOM_W / 2, ROOM_H * 0.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM_D, ROOM_H * 0.4, 0.16]} />
        <meshStandardMaterial
          color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.12, -0.22); return '#' + c.getHexString(); })()}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* 縦パネル溝 (right wall腰壁) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const z = -ROOM_D / 2 + 0.25 + i * (ROOM_D / 16);
        return (
          <mesh key={`rp-${i}`} position={[ROOM_W / 2 - 0.082, ROOM_H * 0.2, z]}>
            <boxGeometry args={[0.005, ROOM_H * 0.36, 0.02]} />
            <meshStandardMaterial
              color={(() => { const c = new THREE.Color(theme.wallColor); c.offsetHSL(0, 0.15, -0.28); return '#' + c.getHexString(); })()}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      {/* Wainscot cap rail */}
      <mesh position={[ROOM_W / 2 - 0.09, ROOM_H * 0.4, 0]}>
        <boxGeometry args={[0.04, 0.06, ROOM_D + 0.05]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Crown + baseboard */}
      <mesh position={[ROOM_W / 2 - 0.08, ROOM_H - 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, ROOM_D + 0.1]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[ROOM_W / 2 - 0.09, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.08, ROOM_D + 0.1]} />
        <meshStandardMaterial color={theme.accentColor} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* ===== Ceiling with panel detail ===== */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={theme.ceilingColor} roughness={0.9} />
      </mesh>
      {/* Ceiling beams for visual interest */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`beam-${i}`} position={[x, ROOM_H - 0.04, 0]}>
          <boxGeometry args={[0.12, 0.08, ROOM_D - 0.5]} />
          <meshStandardMaterial color={theme.ceilingColor} roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
      {[-2, 0, 2].map((z, i) => (
        <mesh key={`beamz-${i}`} position={[0, ROOM_H - 0.04, z]}>
          <boxGeometry args={[ROOM_W - 0.5, 0.08, 0.12]} />
          <meshStandardMaterial color={theme.ceilingColor} roughness={0.8} metalness={0.1} />
        </mesh>
      ))}

      {/* ===== Ceiling Light Fixture (見本準拠: シーリングライト) ===== */}
      <group position={[0, ROOM_H - 0.02, 0]}>
        {/* Base plate */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.03, 8]} />
          <meshStandardMaterial color="#8B7355" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.25, 0.35, 0.15, 8]} />
          <meshStandardMaterial color="#F5DEB3" roughness={0.6} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
        {/* Bulb glow */}
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#FFF8DC"
            emissive="#FFF8DC"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </group>


      {/* ===== Wall Pattern Overlays ===== */}
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="back" />
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="left" />
      <WallOverlay pattern={theme.wallPattern} color={theme.wallColor} wall="right" />

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

      {/* ===== Theme Architecture (扉・天井照明・壁装飾・窓) ===== */}
      <ThemeArchitecture theme={themeId} />

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

      {/* ===== Avatar Rim Light ===== */}
      <pointLight
        position={[0, 1, -1.5]}
        color="#6366f1"
        intensity={0.6}
        distance={3}
        decay={2}
      />
    </group>
  );
}
