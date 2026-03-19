/**
 * cocoro - EmojiReactions
 * Floating emoji reactions in 3D space
 * Triggered by quick-tap buttons, float upward and fade out
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const REACTION_EMOJIS = [
  '\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F44F}',
  '\u{1F525}', '\u{1F60E}', '\u{1F60D}', '\u{1F914}',
  '\u{1F389}', '\u{1F4A1}', '\u{1F622}', '\u{1F631}',
];

interface FloatingReaction {
  id: number;
  emoji: string;
  startPos: THREE.Vector3;
  startTime: number;
}

let reactionId = 0;

// ---- 3D Floating Component ----
function FloatingEmoji({ emoji, startPos, startTime }: FloatingReaction) {
  const ref = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);

  useFrame(() => {
    if (!ref.current) return;
    const elapsed = (Date.now() - startTime) / 1000;
    // Float up
    ref.current.position.y = startPos.y + elapsed * 1.5;
    // Slight wobble
    ref.current.position.x = startPos.x + Math.sin(elapsed * 3) * 0.15;
    // Scale pulse
    const scale = 1 + Math.sin(elapsed * 4) * 0.1;
    ref.current.scale.setScalar(scale);
    // Fade out
    const o = Math.max(0, 1 - elapsed / 2.5);
    setOpacity(o);
  });

  if (opacity <= 0) return null;

  return (
    <group ref={ref} position={startPos}>
      <Html center style={{ pointerEvents: 'none', opacity, fontSize: 32, filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.5))` }}>
        {emoji}
      </Html>
    </group>
  );
}

// ---- 3D Reactions Container ----
export function ReactionCloud() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Listen for custom events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { emoji: string; x?: number; z?: number };
      const newReaction: FloatingReaction = {
        id: ++reactionId,
        emoji: detail.emoji,
        startPos: new THREE.Vector3(
          (detail.x ?? 0) + (Math.random() - 0.5) * 0.5,
          1.5,
          (detail.z ?? 0) + (Math.random() - 0.5) * 0.5
        ),
        startTime: Date.now(),
      };
      setReactions(prev => [...prev.slice(-10), newReaction]);
    };
    window.addEventListener('cocoro-reaction', handler);
    return () => window.removeEventListener('cocoro-reaction', handler);
  }, []);

  // Cleanup old reactions
  useFrame(() => {
    const now = Date.now();
    setReactions(prev => prev.filter(r => now - r.startTime < 3000));
  });

  return (
    <group>
      {reactions.map(r => (
        <FloatingEmoji key={r.id} {...r} />
      ))}
    </group>
  );
}

// ---- UI Reaction Bar ----
export function ReactionBar() {
  const [isOpen, setIsOpen] = useState(false);

  const sendReaction = useCallback((emoji: string) => {
    window.dispatchEvent(new CustomEvent('cocoro-reaction', {
      detail: { emoji, x: 0, z: 0 },
    }));
    setIsOpen(false);
  }, []);

  return (
    <div className="reaction-bar">
      <button
        className="reaction-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '\u2716' : '\u{1F60A}'}
      </button>
      {isOpen && (
        <div className="reaction-picker">
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              className="reaction-emoji-btn"
              onClick={() => sendReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
