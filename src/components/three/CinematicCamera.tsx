/**
 * kokoro — Cinematic Camera Controller
 * 入室時のダイブトランジション + フェーズ連動カメラワーク + 話者追従
 * 
 * P0修正: カメラが会話の中心（話者のcentroid）を追う
 * popopoの「話者が画面の中央に来る」を実現
 */
'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKokoroStore } from '@/store/useKokoroStore';
import { SpacePhase } from '@/types/kokoro';

interface CinematicCameraProps {
  /** Whether the entrance dive animation is enabled */
  enableEntrance?: boolean;
}

export function CinematicCamera({
  enableEntrance = true,
}: CinematicCameraProps) {
  const { camera } = useThree();
  const phase = useKokoroStore((s) => s.phase);
  const density = useKokoroStore((s) => s.density);
  const activeSpeakers = useKokoroStore((s) => s.activeSpeakers);
  const participants = useKokoroStore((s) => s.participants);

  const [diveComplete, setDiveComplete] = useState(!enableEntrance);
  const diveProgress = useRef(0);
  const targetPosition = useRef(new THREE.Vector3(0, 4, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.8, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.8, 0));
  const smoothSpeakerCentroid = useRef(new THREE.Vector3(0, 0.8, 0));

  // Start positions for the entrance dive
  const startPosition = useRef(new THREE.Vector3(0, 25, 30));
  const endPosition = useRef(new THREE.Vector3(0, 4, 8));

  // Initialize camera to start position
  useEffect(() => {
    if (enableEntrance) {
      camera.position.copy(startPosition.current);
      camera.lookAt(0, 0, 0);
    }
  }, [camera, enableEntrance]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (!diveComplete) {
      // === Entrance Dive Animation ===
      diveProgress.current += delta * 0.35; // ~3 second dive
      const t = Math.min(1, diveProgress.current);

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      // Interpolate position with a swooping curve
      const swoopX = Math.sin(eased * Math.PI) * 3; // Side swoop
      const swoopY =
        startPosition.current.y +
        (endPosition.current.y - startPosition.current.y) * eased +
        Math.sin(eased * Math.PI) * 4; // Arc over then down

      // eslint-disable-next-line -- camera.position mutation is standard R3F pattern
      camera.position.x = swoopX;
      camera.position.y = swoopY;
      camera.position.z = THREE.MathUtils.lerp(
        startPosition.current.z,
        endPosition.current.z,
        eased
      );

      // Look at center
      camera.lookAt(0, 0.5, 0);

      if (t >= 1) {
        setDiveComplete(true);
      }
      return;
    }

    // === Post-dive: Dynamic camera ===

    // Calculate speaker centroid (real-time)
    const speakerCentroid = new THREE.Vector3(0, 0.8, 0);
    if (activeSpeakers.length > 0) {
      let cx = 0, cy = 0, cz = 0, count = 0;
      for (const id of activeSpeakers) {
        const p = participants.get(id);
        if (p) {
          cx += p.transform.position.x;
          cy += 1.2; // Head height
          cz += p.transform.position.z;
          count++;
        }
      }
      if (count > 0) {
        speakerCentroid.set(cx / count, cy / count, cz / count);
      }
    }

    // Smooth the speaker centroid to prevent camera jitter
    smoothSpeakerCentroid.current.lerp(speakerCentroid, 0.03);
    const sc = smoothSpeakerCentroid.current;

    // Target position based on phase + speaker position
    switch (phase) {
      case SpacePhase.SILENCE:
        targetPosition.current.set(0, 4.5, 9);
        targetLookAt.current.set(0, 0.5, 0);
        break;
      case SpacePhase.TRIGGER: {
        // Camera slightly shifts toward the speaker
        const offsetX = sc.x * 0.3; // Follow speaker laterally
        const pullIn = 0.5; // Slight zoom on first voice
        targetPosition.current.set(offsetX, 3.5, 7 - pullIn);
        targetLookAt.current.set(sc.x * 0.6, 1.0, sc.z * 0.4); // Look at speaker
        break;
      }
      case SpacePhase.GRAVITY: {
        // Camera pulls in and orbits around conversation center
        const pullIn = density * 2;
        const orbitAngle = Math.sin(time * 0.08) * 0.15; // Subtle orbit
        const offsetX = sc.x * 0.4 + Math.sin(orbitAngle) * 0.5;
        const offsetZ = sc.z * 0.3;
        targetPosition.current.set(
          offsetX,
          3 - density * 0.5,
          6 - pullIn + offsetZ
        );
        // Look strongly at conversation center
        targetLookAt.current.set(
          sc.x * 0.7,
          1.0 + density * 0.3,
          sc.z * 0.5
        );
        break;
      }
    }

    // Smooth camera position interpolation
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      targetPosition.current.x,
      0.015
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetPosition.current.y,
      0.015
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      targetPosition.current.z,
      0.015
    );

    // Breathing camera sway (handheld feel)
    const breathX = Math.sin(time * 0.4) * 0.03;
    const breathY = Math.sin(time * 0.3) * 0.02 + Math.cos(time * 0.5) * 0.01;
    camera.position.x += breathX;
    camera.position.y += breathY;

    // Smooth lookAt — always tracking conversation center
    currentLookAt.current.lerp(targetLookAt.current, 0.02);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
