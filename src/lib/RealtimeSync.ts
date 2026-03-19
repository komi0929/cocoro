/**
 * cocoro - RealtimeSync
 * Bridges Supabase Realtime with app stores for cross-device sync
 * Handles: chat, reactions, peer discovery, participant presence
 *
 * Falls back to localStorage-only when Supabase is not configured
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let channel: RealtimeChannel | null = null;
let localPeerId: string | null = null;

// ===== Callbacks =====
type ChatHandler = (sender: string, text: string) => void;
type ReactionHandler = (emoji: string, x: number, z: number) => void;
type PeerHandler = (peerId: string, displayName: string) => void;
type PeerLeftHandler = (peerId: string) => void;

let onChatReceived: ChatHandler | null = null;
let onReactionReceived: ReactionHandler | null = null;
let onPeerDiscovered: PeerHandler | null = null;
let onPeerGone: PeerLeftHandler | null = null;

export function setRealtimeCallbacks(callbacks: {
  onChat?: ChatHandler;
  onReaction?: ReactionHandler;
  onPeerDiscovered?: PeerHandler;
  onPeerGone?: PeerLeftHandler;
}): void {
  onChatReceived = callbacks.onChat ?? null;
  onReactionReceived = callbacks.onReaction ?? null;
  onPeerDiscovered = callbacks.onPeerDiscovered ?? null;
  onPeerGone = callbacks.onPeerGone ?? null;
}

/**
 * Join a room's realtime channel
 */
export async function joinRealtimeRoom(
  roomId: string,
  peerId: string,
  displayName: string
): Promise<void> {
  localPeerId = peerId;

  if (!isSupabaseConfigured()) {
    console.log('[RealtimeSync] Offline mode — using local events only');
    return;
  }

  const supabase = getSupabase();
  const channelName = `cocoro-room:${roomId}`;

  channel = supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  // --- Chat messages ---
  channel.on('broadcast', { event: 'chat:message' }, (payload) => {
    const data = payload.payload as { sender: string; text: string };
    onChatReceived?.(data.sender, data.text);
    // Also dispatch local custom event for TextChat UI
    window.dispatchEvent(new CustomEvent('cocoro-chat', {
      detail: { sender: data.sender, text: data.text },
    }));
  });

  // --- Reactions ---
  channel.on('broadcast', { event: 'reaction:send' }, (payload) => {
    const data = payload.payload as { emoji: string; x: number; z: number };
    onReactionReceived?.(data.emoji, data.x, data.z);
    window.dispatchEvent(new CustomEvent('cocoro-reaction', {
      detail: { emoji: data.emoji, x: data.x, z: data.z },
    }));
  });

  // --- Peer discovery ---
  channel.on('broadcast', { event: 'peer:announce' }, (payload) => {
    const data = payload.payload as { peerId: string; displayName: string };
    if (data.peerId !== localPeerId) {
      onPeerDiscovered?.(data.peerId, data.displayName);
    }
  });

  channel.on('broadcast', { event: 'peer:leave' }, (payload) => {
    const data = payload.payload as { peerId: string };
    onPeerGone?.(data.peerId);
  });

  // Subscribe
  await channel.subscribe();

  // Announce self
  channel.send({
    type: 'broadcast',
    event: 'peer:announce',
    payload: { peerId, displayName },
  });
}

/**
 * Send chat message via Realtime
 */
export function sendChatMessage(sender: string, text: string): void {
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'chat:message',
      payload: { sender, text },
    });
  }
}

/**
 * Send reaction via Realtime
 */
export function sendReaction(emoji: string, x: number = 0, z: number = 0): void {
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'reaction:send',
      payload: { emoji, x, z },
    });
  }
}

/**
 * Announce peer for WebRTC discovery
 */
export function announcePeer(peerId: string, displayName: string): void {
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'peer:announce',
      payload: { peerId, displayName },
    });
  }
}

/**
 * Leave room channel
 */
export async function leaveRealtimeRoom(): Promise<void> {
  if (channel && localPeerId) {
    channel.send({
      type: 'broadcast',
      event: 'peer:leave',
      payload: { peerId: localPeerId },
    });

    const supabase = getSupabase();
    await supabase.removeChannel(channel);
    channel = null;
  }
  localPeerId = null;
}
