/**
 * cocoro — Ambient Presence System
 * 空間の「気配」を演出するアンビエント音+環境パーティクル制御
 * 誰もいないときも空間に静かな生命感を与える
 */
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useCocoroStore } from '@/store/useCocoroStore';
import { SpacePhase } from '@/types/cocoro';

/**
 * Web Audio APIで動的にアンビエント音を生成
 * Oscillator + 高次倍音 + フィルターで瞑想的なドローンを作成
 */
export function useAmbientPresence() {
  const phase = useCocoroStore((s) => s.phase);
  const density = useCocoroStore((s) => s.density);
  const participantCount = useCocoroStore((s) => s.participants.size);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const isInitRef = useRef(false);

  // Initialize audio on first user interaction
  const initAudio = useCallback(() => {
    if (isInitRef.current || typeof window === 'undefined') return;
    isInitRef.current = true;

    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Master gain
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gainNodeRef.current = gain;

      // Low-pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.7;
      filterRef.current = filter;

      // Subtle reverb via convolver (simple delay-based approach)
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.3;

      // Create drone oscillators (fundamental + harmonics)
      const fundamentalFreq = 55; // A1
      const harmonics = [1, 2, 3, 5, 8]; // Overtone series
      const volumes = [0.3, 0.15, 0.08, 0.04, 0.02];

      harmonics.forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = fundamentalFreq * harmonic;

        const oscGain = ctx.createGain();
        oscGain.gain.value = volumes[i] ?? 0.01;

        osc.connect(oscGain);
        oscGain.connect(filter);

        // Add subtle detuning for chorus effect
        if (i > 0) {
          osc.detune.value = (Math.random() - 0.5) * 8;
        }

        osc.start();
        oscillatorsRef.current.push(osc);
      });

      // Chain: oscillators → filter → gain → destination
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Fade in slowly
      gain.gain.setTargetAtTime(0.06, ctx.currentTime, 3.0);
    } catch {
      // Audio not supported
    }
  }, []);

  // Listen for first interaction to start audio
  useEffect(() => {
    const handler = () => {
      initAudio();
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };

    document.addEventListener('pointerdown', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });

    return () => {
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [initAudio]);

  // Dynamic modulation based on phase/density
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const gain = gainNodeRef.current;
    const filter = filterRef.current;
    if (!ctx || !gain || !filter) return;

    const now = ctx.currentTime;

    // Volume: louder in silence/trigger, quieter during active conversation
    let targetVolume: number;
    switch (phase) {
      case SpacePhase.SILENCE:
        targetVolume = participantCount > 0 ? 0.06 : 0.08;
        break;
      case SpacePhase.TRIGGER:
        targetVolume = 0.04;
        break;
      case SpacePhase.GRAVITY:
        targetVolume = Math.max(0.01, 0.04 - density * 0.03);
        break;
    }

    gain.gain.setTargetAtTime(targetVolume, now, 2.0);

    // Filter: opens up during heated conversation
    const filterFreq = 300 + density * 400;
    filter.frequency.setTargetAtTime(filterFreq, now, 1.5);

    // Detune oscillators slightly based on density for tension
    oscillatorsRef.current.forEach((osc, i) => {
      if (i > 0) {
        const detuneAmount = density * 5 * (i - 1);
        osc.detune.setTargetAtTime(detuneAmount, now, 2.0);
      }
    });
  }, [phase, density, participantCount]);

  // Cleanup
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);
}
