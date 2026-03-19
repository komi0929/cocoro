/**
 * cocoro - Database Layer
 * Supabase DB operations for users, rooms, furniture, messages
 * Falls back to localStorage when Supabase is not configured
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { RoomTheme, AccessMode } from '@/types/cocoro';

// ===== Users =====

export interface DBUser {
  id: string;
  name: string;
  pin_hash: string;
  browser_token: string;
  avatar_species: string;
  avatar_color: string;
}

export async function dbCreateUser(
  name: string,
  pinHash: string,
  browserToken: string,
  avatarSpecies: string = 'cat',
  avatarColor: string = '#fbbf24'
): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('users')
    .insert({ name, pin_hash: pinHash, browser_token: browserToken, avatar_species: avatarSpecies, avatar_color: avatarColor })
    .select()
    .single();

  if (error) { console.error('DB createUser error:', error); return null; }
  return data as DBUser;
}

export async function dbGetUserByToken(browserToken: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('browser_token', browserToken)
    .single();

  if (error) return null;
  return data as DBUser;
}

export async function dbUpdateUser(id: string, updates: Partial<Pick<DBUser, 'name' | 'avatar_species' | 'avatar_color'>>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().from('users').update(updates).eq('id', id);
}

// ===== Rooms =====

export interface DBRoom {
  id: string;
  owner_id: string;
  name: string;
  theme: RoomTheme;
  access_mode: AccessMode;
  invite_code: string;
  is_active: boolean;
}

export async function dbCreateRoom(
  ownerId: string,
  name: string,
  theme: RoomTheme,
  inviteCode: string,
  accessMode: AccessMode = 'open'
): Promise<DBRoom | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('rooms')
    .insert({ owner_id: ownerId, name, theme, invite_code: inviteCode, access_mode: accessMode })
    .select()
    .single();

  if (error) { console.error('DB createRoom error:', error); return null; }
  return data as DBRoom;
}

export async function dbGetRoomByInviteCode(code: string): Promise<DBRoom | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('rooms')
    .select('*')
    .eq('invite_code', code)
    .single();

  if (error) return null;
  return data as DBRoom;
}

export async function dbGetRoom(id: string): Promise<DBRoom | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as DBRoom;
}

export async function dbUpdateRoom(id: string, updates: Partial<Pick<DBRoom, 'name' | 'theme' | 'access_mode'>>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().from('rooms').update(updates).eq('id', id);
}

export async function dbGetRoomsByOwner(ownerId: string): Promise<DBRoom[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from('rooms')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true);

  if (error) return [];
  return (data ?? []) as DBRoom[];
}

// ===== Furniture =====

export interface DBFurniture {
  id: string;
  room_id: string;
  catalog_id: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rotation_y: number;
}

export async function dbGetFurniture(roomId: string): Promise<DBFurniture[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from('furniture')
    .select('*')
    .eq('room_id', roomId);

  if (error) return [];
  return (data ?? []) as DBFurniture[];
}

export async function dbAddFurniture(item: Omit<DBFurniture, 'id'>): Promise<DBFurniture | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('furniture')
    .insert(item)
    .select()
    .single();

  if (error) return null;
  return data as DBFurniture;
}

export async function dbUpdateFurniture(id: string, updates: Partial<Pick<DBFurniture, 'pos_x' | 'pos_y' | 'pos_z' | 'rotation_y'>>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().from('furniture').update(updates).eq('id', id);
}

export async function dbDeleteFurniture(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().from('furniture').delete().eq('id', id);
}

// ===== Messages =====

export interface DBMessage {
  id: string;
  room_id: string;
  user_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export async function dbSaveMessage(roomId: string, userId: string, senderName: string, text: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await getSupabase()
    .from('messages')
    .insert({ room_id: roomId, user_id: userId, sender_name: senderName, text });
}

export async function dbGetRecentMessages(roomId: string, limit: number = 50): Promise<DBMessage[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return ((data ?? []) as DBMessage[]).reverse();
}

// ===== Access Control =====

export async function dbAddAllowedUser(roomId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase()
    .from('room_allowed_users')
    .upsert({ room_id: roomId, user_id: userId });
}

export async function dbRemoveAllowedUser(roomId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase()
    .from('room_allowed_users')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
}

export async function dbIsUserAllowed(roomId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const { data, error } = await getSupabase()
    .from('room_allowed_users')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

// ===== Visit History =====

export async function dbRecordVisit(userId: string, roomId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from('room_visits')
    .insert({ user_id: userId, room_id: roomId })
    .select('id')
    .single();

  if (error) return null;
  return (data as { id: string }).id;
}

export async function dbEndVisit(visitId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase()
    .from('room_visits')
    .update({ left_at: new Date().toISOString() })
    .eq('id', visitId);
}
