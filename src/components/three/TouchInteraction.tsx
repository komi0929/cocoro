/**
 * cocoro — Touch Interaction Engine
 * ROM専ユーザー向けタッチインタラクション
 * タップ位置にパーティクルバースト（物理演算: 重力+ドラグ+バウンス）
 */
'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_TOUCH_PARTICLES = 30;
const PARTICLE_LIFETIME = 2.0;

interface TouchParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

const touchVertexShader = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute vec3 aColor;

  varying float vLife;
  varying vec3 vColor;

  void main() {
    vLife = aLife;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (150.0 / -mvPosition.z) * aLife;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const touchFragmentShader = /* glsl */ `
  varying float vLife;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow = 1.0 - d * 2.0;
    glow = pow(glow, 1.5);

    float alpha = glow * vLife * 0.9;
    vec3 color = vColor + vec3(0.2, 0.1, 0.3) * glow;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function TouchInteraction() {
  const { camera, gl, raycaster } = useThree();
  const particlesRef = useRef<TouchParticle[]>([]);
  const pointsRef = useRef<THREE.Points>(null);

  // Stable buffer references via useRef (mutated in useFrame, not during render)
  const buffersRef = useRef({
    positions: new Float32Array(MAX_TOUCH_PARTICLES * 3),
    lives: new Float32Array(MAX_TOUCH_PARTICLES),
    sizes: new Float32Array(MAX_TOUCH_PARTICLES),
    colors: new Float32Array(MAX_TOUCH_PARTICLES * 3),
  });

  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const spawnParticles = useCallback(
    (worldPos: THREE.Vector3) => {
      const count = 8 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_TOUCH_PARTICLES) {
          particlesRef.current.shift();
        }

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.4;
        const speed = 1 + Math.random() * 3;

        const vel = new THREE.Vector3(
          Math.cos(theta) * Math.sin(phi) * speed,
          Math.cos(phi) * speed * 1.5,
          Math.sin(theta) * Math.sin(phi) * speed
        );

        const hue = 0.7 + Math.random() * 0.3;
        const color = new THREE.Color().setHSL(
          hue % 1,
          0.6 + Math.random() * 0.3,
          0.5 + Math.random() * 0.3
        );

        particlesRef.current.push({
          position: worldPos.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.3,
              0.1,
              (Math.random() - 0.5) * 0.3
            )
          ),
          velocity: vel,
          life: PARTICLE_LIFETIME,
          maxLife: PARTICLE_LIFETIME,
          color,
          size: 1 + Math.random() * 3,
        });
      }
    },
    []
  );

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(floorPlane, intersection);

      if (hit) {
        spawnParticles(intersection);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [camera, gl, raycaster, spawnParticles, floorPlane]);

  useFrame((_, delta) => {
    // Remove dead particles
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    const buf = buffersRef.current;

    // Update and write to buffers
    for (let i = 0; i < MAX_TOUCH_PARTICLES; i++) {
      const p = particlesRef.current[i];
      if (p) {
        p.velocity.y -= 4.0 * delta;
        p.velocity.multiplyScalar(1 - 1.5 * delta);
        p.position.addScaledVector(p.velocity, delta);
        p.life -= delta;

        if (p.position.y < 0.05) {
          p.position.y = 0.05;
          p.velocity.y = Math.abs(p.velocity.y) * 0.3;
        }

        buf.positions[i * 3] = p.position.x;
        buf.positions[i * 3 + 1] = p.position.y;
        buf.positions[i * 3 + 2] = p.position.z;
        buf.lives[i] = p.life / p.maxLife;
        buf.sizes[i] = p.size;
        buf.colors[i * 3] = p.color.r;
        buf.colors[i * 3 + 1] = p.color.g;
        buf.colors[i * 3 + 2] = p.color.b;
      } else {
        buf.positions[i * 3] = 0;
        buf.positions[i * 3 + 1] = -100;
        buf.positions[i * 3 + 2] = 0;
        buf.lives[i] = 0;
        buf.sizes[i] = 0;
      }
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      for (const name of ['position', 'aLife', 'aSize', 'aColor']) {
        const attr = geo.getAttribute(name);
        if (attr) attr.needsUpdate = true;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <float32BufferAttribute
          attach="attributes-position"
          args={[buffersRef.current.positions, 3]}
        />
        <float32BufferAttribute
          attach="attributes-aLife"
          args={[buffersRef.current.lives, 1]}
        />
        <float32BufferAttribute
          attach="attributes-aSize"
          args={[buffersRef.current.sizes, 1]}
        />
        <float32BufferAttribute
          attach="attributes-aColor"
          args={[buffersRef.current.colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={touchVertexShader}
        fragmentShader={touchFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
