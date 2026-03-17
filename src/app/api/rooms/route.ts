/**
 * kokoro — Rooms API
 * GET: アクティブルーム一覧取得
 * POST: 新規ルーム作成
 */

import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rooms: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { name, emoji, vibe, theme, max_participants } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'ルーム名は必須です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: name.trim(),
        emoji: emoji ?? '☕',
        vibe: vibe ?? null,
        theme: theme ?? 'cosmos',
        max_participants: max_participants ?? 20,
        host_id: body.host_id ?? null,
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ room: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
