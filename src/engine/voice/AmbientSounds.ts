/**
 * cocoro - AmbientSounds
 * Theme-matched background audio using Web Audio API
 * Procedurally generated ambient loops — no external files
 */

import type { RoomTheme } from '@/types/cocoro';

let ctx: AudioContext | null = null;
let currentNodes: AudioNode[] = [];
let isPlaying = false;
let currentTheme: RoomTheme | null = null;
let gainNode: GainNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function stopAll() {
  currentNodes.forEach(n => {
    try {
      if (n instanceof OscillatorNode) n.stop();
      n.disconnect();
    } catch { /* already stopped */ }
  });
  currentNodes = [];
  isPlaying = false;
}

/** Create a gentle drone at a given frequency */
function createDrone(ac: AudioContext, freq: number, volume: number, type: OscillatorType = 'sine'): OscillatorNode {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;

  // Slow LFO for organic feel
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 0.1 + Math.random() * 0.2;
  lfoGain.gain.value = freq * 0.02;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start();

  osc.connect(gain);
  if (gainNode) gain.connect(gainNode);
  currentNodes.push(osc, gain, lfo, lfoGain);
  return osc;
}

/** Create filtered noise (for rain, wind, etc.) */
function createNoise(ac: AudioContext, cutoff: number, volume: number, type: BiquadFilterType = 'lowpass'): AudioBufferSourceNode {
  const bufferSize = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7;

  const gain = ac.createGain();
  gain.gain.value = volume;

  source.connect(filter).connect(gain);
  if (gainNode) gain.connect(gainNode);
  currentNodes.push(source, filter, gain);
  return source;
}

const themeAmbience: Record<RoomTheme, () => void> = {
  underground: () => {
    const ac = getCtx();
    // Deep hum
    createDrone(ac, 55, 0.04, 'sine').start();
    createDrone(ac, 82, 0.02, 'triangle').start();
    // Distant rumble
    createNoise(ac, 200, 0.015, 'lowpass').start();
  },

  loft: () => {
    const ac = getCtx();
    // Warm pad
    createDrone(ac, 220, 0.02, 'sine').start();
    createDrone(ac, 330, 0.015, 'sine').start();
    createDrone(ac, 440, 0.008, 'triangle').start();
  },

  treehouse: () => {
    const ac = getCtx();
    // Wind through leaves
    createNoise(ac, 3000, 0.03, 'bandpass').start();
    createNoise(ac, 800, 0.015, 'highpass').start();
    // Soft birds (high pings)
    createDrone(ac, 1200, 0.005, 'sine').start();
    createDrone(ac, 1800, 0.003, 'sine').start();
  },

  beach: () => {
    const ac = getCtx();
    // Ocean waves (filtered noise with LFO)
    const waves = createNoise(ac, 1500, 0.04, 'lowpass');
    waves.start();
    // Gentle breeze
    createNoise(ac, 4000, 0.02, 'bandpass').start();
    // Gentle tone
    createDrone(ac, 262, 0.008, 'sine').start();
  },

  rooftop: () => {
    const ac = getCtx();
    // City hum
    createNoise(ac, 300, 0.02, 'lowpass').start();
    createDrone(ac, 110, 0.02, 'sawtooth').start();
    // Distant wind
    createNoise(ac, 2000, 0.01, 'bandpass').start();
  },

  space: () => {
    const ac = getCtx();
    // Deep space drone
    createDrone(ac, 40, 0.03, 'sine').start();
    createDrone(ac, 60, 0.02, 'sine').start();
    // Electronic hum
    createDrone(ac, 440, 0.005, 'square').start();
    // Subtle static
    createNoise(ac, 5000, 0.008, 'highpass').start();
  },
};

export function startAmbience(theme: RoomTheme): void {
  if (currentTheme === theme && isPlaying) return;
  stopAll();

  const ac = getCtx();
  gainNode = ac.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(ac.destination);
  currentNodes.push(gainNode);

  // Fade in
  gainNode.gain.linearRampToValueAtTime(1, ac.currentTime + 2);

  currentTheme = theme;
  isPlaying = true;
  themeAmbience[theme]();
}

export function stopAmbience(): void {
  if (!isPlaying) return;
  if (gainNode && ctx) {
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(stopAll, 1200);
  } else {
    stopAll();
  }
  currentTheme = null;
}

export function setAmbienceVolume(vol: number): void {
  if (gainNode && ctx) {
    gainNode.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, vol)), ctx.currentTime + 0.1);
  }
}
