/**
 * cocoro  EVoxelAvatar (Phase 6  EHigh-Poly Voxel)
 * Procedural voxel animal avatar
 * High-poly rounded blocks for smooth Minecraft-style look
 * Shared body + species parts + color noise + voice-reactive animation
 * + Furniture-specific action animations
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarSpecies, AvatarConfig, FurnitureActionType } from '@/types/cocoro';
import { createFaceTexture } from './voxelFaceTexture';
import { VoxelItem } from './VoxelItems';

// ============================================================
// ハイポリ角丸ボクセル用 BoxGeometry wrapper
// ============================================================

function createRoundedBox(w: number, h: number, d: number, r = 0.035, seg = 4): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w - r * 2, h - r * 2, d - r * 2, seg, seg, seg);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const v = new THREE.Vector3();
  const hw = (w - r * 2) / 2;
  const hh = (h - r * 2) / 2;
  const hd = (d - r * 2) / 2;
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const dx = Math.max(0, Math.abs(v.x) - hw) * Math.sign(v.x);
    const dy = Math.max(0, Math.abs(v.y) - hh) * Math.sign(v.y);
    const dz = Math.max(0, Math.abs(v.z) - hd) * Math.sign(v.z);
    const off = new THREE.Vector3(dx, dy, dz);
    if (off.length() > 0) off.normalize().multiplyScalar(r);
    const cx = Math.min(hw, Math.max(-hw, v.x));
    const cy = Math.min(hh, Math.max(-hh, v.y));
    const cz = Math.min(hd, Math.max(-hd, v.z));
    pos.setXYZ(i, cx + off.x, cy + off.y, cz + off.z);
    if (off.length() > 0) norm.setXYZ(i, off.x, off.y, off.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** 角丸ボクセルジオメトリのキャチE��ュ */
const geoCache = new Map<string, THREE.BufferGeometry>();
function getRoundedBox(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (!geoCache.has(key)) {
    const radius = Math.min(0.04, Math.min(w, h, d) * 0.25);
    geoCache.set(key, createRoundedBox(w, h, d, radius, 4));
  }
  return geoCache.get(key)!;
}

/** boxGeometryの代わりに使ぁE��ンポ�EネンチE*/
function RoundedBoxGeo({ args }: { args: [number, number, number] }) {
  const geo = useMemo(() => getRoundedBox(args[0], args[1], args[2]), [args[0], args[1], args[2]]);
  return <primitive object={geo} attach="geometry" />;
}


// ============================================================
// Color noise utility
// ============================================================

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

  const s2 = s / 100;
  const l2 = l / 100;
  const a = s2 * Math.min(l2, 1 - l2);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const clr = l2 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * clr).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function noisyColor(baseHex: string, seed: number): string {
  const [h, s, l] = hexToHSL(baseHex);
  const rng = (offset: number) => Math.sin(seed * 12.9898 + offset * 78.233) * 0.5 + 0.5;
  return hslToHex(
    h + (rng(1) - 0.5) * 10,
    s + (rng(2) - 0.5) * 16,
    l + (rng(3) - 0.5) * 12,
  );
}

// ============================================================
// Species body definitions
// ============================================================

interface SpeciesBodyDef {
  headSize: [number, number, number];
  ears: 'round' | 'triangle' | 'droopy' | 'long' | 'triangle-large' | 'none' | 'round-black';
  tail: 'small-round' | 'long-thin' | 'short' | 'round' | 'big-fluffy' | 'none' | 'small';
  special?: 'beak' | 'panda-pattern';
}

const SPECIES_BODY: Record<AvatarSpecies, SpeciesBodyDef> = {
  bear:    { headSize: [0.7, 0.7, 0.7], ears: 'round', tail: 'small-round' },
  cat:     { headSize: [0.65, 0.6, 0.6], ears: 'triangle', tail: 'long-thin' },
  dog:     { headSize: [0.65, 0.65, 0.65], ears: 'droopy', tail: 'short' },
  rabbit:  { headSize: [0.6, 0.6, 0.6], ears: 'long', tail: 'round' },
  fox:     { headSize: [0.65, 0.6, 0.6], ears: 'triangle-large', tail: 'big-fluffy' },
  frog:    { headSize: [0.8, 0.6, 0.65], ears: 'none', tail: 'none' },
  penguin: { headSize: [0.65, 0.65, 0.65], ears: 'none', tail: 'none', special: 'beak' },
  panda:   { headSize: [0.7, 0.7, 0.7], ears: 'round-black', tail: 'small', special: 'panda-pattern' },
};

// ============================================================
// Sub-components for body parts
// ============================================================

function Ears({ type, color, headSize }: { type: string; color: string; headSize: [number, number, number] }) {
  const earCol = color;
  const hw = headSize[0] / 2;

  switch (type) {
    case 'round':
      return (
        <>
          <mesh position={[-hw + 0.05, headSize[1] / 2 + 0.08, 0]}>
            <RoundedBoxGeo args={[0.15, 0.12, 0.12]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.05, headSize[1] / 2 + 0.08, 0]}>
            <RoundedBoxGeo args={[0.15, 0.12, 0.12]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
        </>
      );
    case 'round-black':
      return (
        <>
          <mesh position={[-hw + 0.05, headSize[1] / 2 + 0.08, 0]}>
            <RoundedBoxGeo args={[0.15, 0.12, 0.12]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.05, headSize[1] / 2 + 0.08, 0]}>
            <RoundedBoxGeo args={[0.15, 0.12, 0.12]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
        </>
      );
    case 'triangle':
      return (
        <>
          <mesh position={[-hw + 0.08, headSize[1] / 2 + 0.1, 0]}>
            <RoundedBoxGeo args={[0.1, 0.18, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[-hw + 0.08, headSize[1] / 2 + 0.18, 0]}>
            <RoundedBoxGeo args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.08, headSize[1] / 2 + 0.1, 0]}>
            <RoundedBoxGeo args={[0.1, 0.18, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.08, headSize[1] / 2 + 0.18, 0]}>
            <RoundedBoxGeo args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
        </>
      );
    case 'triangle-large':
      return (
        <>
          <mesh position={[-hw + 0.08, headSize[1] / 2 + 0.12, 0]}>
            <RoundedBoxGeo args={[0.14, 0.22, 0.1]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[-hw + 0.08, headSize[1] / 2 + 0.22, 0]}>
            <RoundedBoxGeo args={[0.08, 0.08, 0.06]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.08, headSize[1] / 2 + 0.12, 0]}>
            <RoundedBoxGeo args={[0.14, 0.22, 0.1]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.08, headSize[1] / 2 + 0.22, 0]}>
            <RoundedBoxGeo args={[0.08, 0.08, 0.06]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
        </>
      );
    case 'droopy':
      return (
        <>
          <mesh position={[-hw - 0.04, headSize[1] / 2 - 0.08, 0]}>
            <RoundedBoxGeo args={[0.12, 0.2, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw + 0.04, headSize[1] / 2 - 0.08, 0]}>
            <RoundedBoxGeo args={[0.12, 0.2, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
        </>
      );
    case 'long':
      return (
        <>
          <mesh position={[-hw + 0.1, headSize[1] / 2 + 0.22, 0]}>
            <RoundedBoxGeo args={[0.1, 0.4, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[-hw + 0.1, headSize[1] / 2 + 0.22, 0.01]}>
            <RoundedBoxGeo args={[0.06, 0.32, 0.06]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.7} />
          </mesh>
          <mesh position={[hw - 0.1, headSize[1] / 2 + 0.22, 0]}>
            <RoundedBoxGeo args={[0.1, 0.4, 0.08]} />
            <meshStandardMaterial color={earCol} roughness={0.8} />
          </mesh>
          <mesh position={[hw - 0.1, headSize[1] / 2 + 0.22, 0.01]}>
            <RoundedBoxGeo args={[0.06, 0.32, 0.06]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.7} />
          </mesh>
        </>
      );
    default:
      return null;
  }
}

function Tail({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'small-round':
      return (
        <mesh position={[0, 0.3, -0.25]}>
          <RoundedBoxGeo args={[0.1, 0.1, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      );
    case 'small':
      return (
        <mesh position={[0, 0.3, -0.22]}>
          <RoundedBoxGeo args={[0.08, 0.08, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      );
    case 'long-thin':
      return (
        <group position={[0, 0.15, -0.22]}>
          <mesh position={[0, 0.05, -0.06]}>
            <RoundedBoxGeo args={[0.05, 0.05, 0.18]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.08, -0.16]} rotation={[0.5, 0, 0]}>
            <RoundedBoxGeo args={[0.04, 0.04, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      );
    case 'short':
      return (
        <mesh position={[0, 0.3, -0.22]}>
          <RoundedBoxGeo args={[0.08, 0.06, 0.1]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      );
    case 'round':
      return (
        <mesh position={[0, 0.3, -0.24]}>
          <RoundedBoxGeo args={[0.12, 0.12, 0.1]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>
      );
    case 'big-fluffy':
      return (
        <group position={[0, 0.15, -0.25]}>
          <mesh>
            <RoundedBoxGeo args={[0.2, 0.25, 0.22]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.1, -0.05]}>
            <RoundedBoxGeo args={[0.15, 0.18, 0.18]} />
            <meshStandardMaterial color="#fff" roughness={0.8} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function Beak() {
  return (
    <group position={[0, 0.65, 0.35]}>
      <mesh>
        <RoundedBoxGeo args={[0.12, 0.05, 0.08]} />
        <meshStandardMaterial color="#FFB300" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.03, 0.01]}>
        <RoundedBoxGeo args={[0.1, 0.03, 0.06]} />
        <meshStandardMaterial color="#FF8F00" roughness={0.5} />
      </mesh>
    </group>
  );
}

function PandaPatternOverlay() {
  return (
    <mesh position={[0, 0.32, 0.13]}>
      <RoundedBoxGeo args={[0.3, 0.3, 0.02]} />
      <meshStandardMaterial color="#FAFAFA" roughness={0.8} />
    </mesh>
  );
}

// ============================================================
// Main Component
// ============================================================

export interface VoxelAvatarProps {
  config: AvatarConfig;
  voiceVolume?: number;
  isWalking?: boolean;
  isSpeaking?: boolean;
  emissiveBoost?: number;
  currentAction?: FurnitureActionType | null;
}

export function VoxelAvatar({
  config,
  voiceVolume = 0,
  isWalking = false,
  isSpeaking = false,
  emissiveBoost = 0,
  currentAction = null,
}: VoxelAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const cheekMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const { species, color, item } = config;
  const body = SPECIES_BODY[species];

  const faceTexture = useMemo(() => createFaceTexture(species), [species]);

  const colors = useMemo(() => ({
    head: color,
    torso: noisyColor(color, 1),
    armL: noisyColor(color, 2),
    armR: noisyColor(color, 3),
    legL: noisyColor(color, 4),
    legR: noisyColor(color, 5),
    ear: noisyColor(color, 6),
    tail: noisyColor(color, 7),
  }), [color]);

  const pandaLimbColor = species === 'panda' ? '#222' : undefined;
  const penguinBelly = species === 'penguin';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.015;
      let jumpY = 0;

      if (isSpeaking && voiceVolume > 0.08) {
        jumpY = Math.abs(Math.sin(t * 12)) * 0.06 * Math.min(1, voiceVolume * 3);
      }

      // Action-specific body transforms
      if (currentAction) {
        switch (currentAction) {
          case 'sit':
            // Lower body to sitting position
            jumpY = -0.15;
            break;
          case 'sleep':
            // Lie down (tilt sideways)
            groupRef.current.rotation.z = Math.PI / 2 * 0.8;
            jumpY = -0.2;
            break;
          case 'dance':
            // Bounce up and down + sway
            jumpY = Math.abs(Math.sin(t * 6)) * 0.1;
            groupRef.current.rotation.z = Math.sin(t * 3) * 0.15;
            break;
          case 'relax':
            // Sit low on ground
            jumpY = -0.2;
            break;
          default:
            // Reset rotation for non-sleep/dance actions
            if (groupRef.current.rotation.z !== 0) {
              groupRef.current.rotation.z *= 0.9;
            }
            break;
        }
      } else {
        // Reset z rotation when no action
        if (groupRef.current.rotation.z !== 0) {
          groupRef.current.rotation.z *= 0.9;
          if (Math.abs(groupRef.current.rotation.z) < 0.01) groupRef.current.rotation.z = 0;
        }
      }

      groupRef.current.position.y = jumpY;
      groupRef.current.scale.y = breathe;
    }

    // Arm & Leg animation
    let leftArmRot = 0;
    let rightArmRot = 0;
    let leftLegRot = 0;
    let rightLegRot = 0;

    if (isWalking) {
      const swing = Math.sin(t * 8) * 0.4;
      leftArmRot = swing;
      rightArmRot = -swing;
      leftLegRot = -swing;
      rightLegRot = swing;
    } else if (currentAction) {
      switch (currentAction) {
        case 'play':
        case 'dj':
          // Fast arm movement (button mashing / turntable)
          leftArmRot = Math.sin(t * 10) * 0.5;
          rightArmRot = Math.sin(t * 12 + 1) * 0.5;
          break;
        case 'strum':
          // Strumming motion
          rightArmRot = Math.sin(t * 8) * 0.6;
          leftArmRot = -0.3; // Holding neck
          break;
        case 'dance':
          // Arms up and swaying
          leftArmRot = Math.sin(t * 4) * 0.5 - 0.3;
          rightArmRot = Math.sin(t * 4 + Math.PI) * 0.5 - 0.3;
          leftLegRot = Math.sin(t * 6) * 0.15;
          rightLegRot = Math.sin(t * 6 + Math.PI) * 0.15;
          break;
        case 'gaze':
        case 'admire':
          // Still, arms slightly back (contemplative)
          leftArmRot = -0.1;
          rightArmRot = -0.1;
          break;
        case 'sit':
          // Legs forward
          leftLegRot = -0.8;
          rightLegRot = -0.8;
          // Hands on knees
          leftArmRot = -0.5;
          rightArmRot = -0.5;
          break;
        case 'sleep':
          // Arms curled in
          leftArmRot = -0.6;
          rightArmRot = -0.6;
          leftLegRot = -0.4;
          rightLegRot = -0.4;
          break;
        case 'eat':
          // Bring hand to mouth repeatedly
          rightArmRot = Math.sin(t * 4) * 0.3 - 0.6;
          break;
        case 'work':
        case 'write':
          // Typing / writing motion
          leftArmRot = Math.sin(t * 6) * 0.2 - 0.5;
          rightArmRot = Math.sin(t * 6 + 2) * 0.2 - 0.5;
          break;
        case 'read':
        case 'browse':
          // Holding something
          leftArmRot = -0.5;
          rightArmRot = -0.5;
          break;
        case 'kick':
          // Kicking motion (one leg forward)
          rightLegRot = Math.sin(t * 6) * 0.6;
          break;
        case 'swing':
          // Swinging weapon
          rightArmRot = Math.sin(t * 8) * 0.8;
          break;
        case 'warm':
          // Hands extended forward
          leftArmRot = -0.4;
          rightArmRot = -0.4;
          break;
        case 'water':
          // Watering motion (tilt arm)
          rightArmRot = Math.sin(t * 2) * 0.2 - 0.6;
          break;
        case 'lounge':
          // Leaning on table
          leftArmRot = -0.3;
          rightArmRot = -0.3;
          break;
        case 'relax':
          // Arms out relaxed
          leftArmRot = -0.2;
          rightArmRot = -0.2;
          leftLegRot = -0.6;
          rightLegRot = -0.6;
          break;
      }
    }

    if (leftArmRef.current) leftArmRef.current.rotation.x = leftArmRot;
    if (rightArmRef.current) rightArmRef.current.rotation.x = rightArmRot;
    if (leftLegRef.current) leftLegRef.current.rotation.x = leftLegRot;
    if (rightLegRef.current) rightLegRef.current.rotation.x = rightLegRot;

    if (cheekMatRef.current) {
      const glow = isSpeaking ? Math.min(1, voiceVolume * 4) * 0.6 + emissiveBoost : emissiveBoost;
      cheekMatRef.current.emissiveIntensity = glow;
    }
  });

  const headY = 0.65;
  const torsoY = 0.28;

  return (
    <group ref={groupRef}>
      {/* HEAD */}
      <group position={[0, headY, 0]}>
        <mesh castShadow>
          <RoundedBoxGeo args={body.headSize} />
          <meshStandardMaterial color={colors.head} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, body.headSize[2] / 2 + 0.01]}>
          <planeGeometry args={[body.headSize[0], body.headSize[1]]} />
          <meshStandardMaterial map={faceTexture} transparent alphaTest={0.1} roughness={0.9} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} depthWrite={false} />
        </mesh>
        <Ears type={body.ears} color={colors.ear} headSize={body.headSize} />
        {body.special === 'beak' && <Beak />}
      </group>

      {/* TORSO */}
      <group position={[0, torsoY, 0]}>
        <mesh castShadow>
          <RoundedBoxGeo args={[0.5, 0.35, 0.35]} />
          <meshStandardMaterial color={colors.torso} roughness={0.8} />
        </mesh>
        {penguinBelly && (
          <mesh position={[0, 0, 0.13]}>
            <RoundedBoxGeo args={[0.3, 0.28, 0.02]} />
            <meshStandardMaterial color="#ECEFF1" roughness={0.8} />
          </mesh>
        )}
        {body.special === 'panda-pattern' && <PandaPatternOverlay />}
      </group>

      {/* ARMS */}
      <group ref={leftArmRef} position={[-0.34, torsoY + 0.05, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <RoundedBoxGeo args={[0.16, 0.28, 0.16]} />
          <meshStandardMaterial color={pandaLimbColor ?? colors.armL} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.34, torsoY + 0.05, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <RoundedBoxGeo args={[0.16, 0.28, 0.16]} />
          <meshStandardMaterial color={pandaLimbColor ?? colors.armR} roughness={0.8} />
        </mesh>
      </group>

      {/* LEGS */}
      <group ref={leftLegRef} position={[-0.12, 0.12, 0]}>
        <mesh position={[0, -0.06, 0]} castShadow>
          <RoundedBoxGeo args={[0.18, 0.24, 0.18]} />
          <meshStandardMaterial color={pandaLimbColor ?? colors.legL} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.12, 0.12, 0]}>
        <mesh position={[0, -0.06, 0]} castShadow>
          <RoundedBoxGeo args={[0.18, 0.24, 0.18]} />
          <meshStandardMaterial color={pandaLimbColor ?? colors.legR} roughness={0.8} />
        </mesh>
      </group>

      {/* TAIL */}
      <Tail type={body.tail} color={colors.tail} />

      {/* CHEEK GLOW */}
      <mesh position={[0, headY - 0.05, body.headSize[2] / 2 + 0.01]}>
        <planeGeometry args={[body.headSize[0] * 0.7, body.headSize[1] * 0.3]} />
        <meshStandardMaterial
          ref={cheekMatRef}
          color="#FF8FAA"
          emissive="#FF8FAA"
          emissiveIntensity={0}
          transparent
          opacity={0.0}
        />
      </mesh>

      {/* ITEM */}
      <VoxelItem itemType={item} />
    </group>
  );
}
