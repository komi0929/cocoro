-- =============================================================
-- cocoro — Supabase Database Migration
-- Supabase Dashboard > SQL Editor に貼り付けて実行してください
-- =============================================================

-- 1. profiles テーブル (auth.users と連携)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_species TEXT NOT NULL DEFAULT 'cat',
  avatar_color TEXT NOT NULL DEFAULT '#fbbf24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 新規ユーザー登録時に自動でprofileを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. rooms テーブル
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'underground',
  access_mode TEXT NOT NULL DEFAULT 'open',
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_invite ON rooms(invite_code);

-- 3. furniture テーブル
CREATE TABLE IF NOT EXISTS furniture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  catalog_id TEXT NOT NULL,
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  pos_z REAL NOT NULL DEFAULT 0,
  rotation_y REAL NOT NULL DEFAULT 0,
  color_variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_furniture_room ON furniture(room_id);

-- 4. messages テーブル
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC);

-- 5. room_allowed_users テーブル (アクセス制御)
CREATE TABLE IF NOT EXISTS room_allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 6. room_visits テーブル (訪問履歴)
CREATE TABLE IF NOT EXISTS room_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_visits_user ON room_visits(user_id);

-- =============================================================
-- Row Level Security (RLS) — 必須
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_visits ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のprofileは読み書き可、他人は読み取りのみ
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- rooms: 誰でも読める、作成はログインユーザー、更新は所有者のみ
DROP POLICY IF EXISTS "rooms_select" ON rooms;
DROP POLICY IF EXISTS "rooms_insert" ON rooms;
DROP POLICY IF EXISTS "rooms_update" ON rooms;
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (auth.uid() = owner_id);

-- furniture: 部屋の家具は誰でも見える、追加/更新/削除は部屋所有者
DROP POLICY IF EXISTS "furniture_select" ON furniture;
DROP POLICY IF EXISTS "furniture_insert" ON furniture;
DROP POLICY IF EXISTS "furniture_update" ON furniture;
DROP POLICY IF EXISTS "furniture_delete" ON furniture;
CREATE POLICY "furniture_select" ON furniture FOR SELECT USING (true);
CREATE POLICY "furniture_insert" ON furniture FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.owner_id = auth.uid()));
CREATE POLICY "furniture_update" ON furniture FOR UPDATE
  USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.owner_id = auth.uid()));
CREATE POLICY "furniture_delete" ON furniture FOR DELETE
  USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.owner_id = auth.uid()));

-- messages: 部屋のメッセージは誰でも読める、送信はログインユーザー
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- room_allowed_users: 誰でも読める、追加/削除は部屋所有者
DROP POLICY IF EXISTS "allowed_select" ON room_allowed_users;
DROP POLICY IF EXISTS "allowed_insert" ON room_allowed_users;
DROP POLICY IF EXISTS "allowed_delete" ON room_allowed_users;
CREATE POLICY "allowed_select" ON room_allowed_users FOR SELECT USING (true);
CREATE POLICY "allowed_insert" ON room_allowed_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.owner_id = auth.uid()));
CREATE POLICY "allowed_delete" ON room_allowed_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.owner_id = auth.uid()));

-- room_visits: 自分の訪問履歴のみ
DROP POLICY IF EXISTS "visits_select" ON room_visits;
DROP POLICY IF EXISTS "visits_insert" ON room_visits;
DROP POLICY IF EXISTS "visits_update" ON room_visits;
CREATE POLICY "visits_select" ON room_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "visits_insert" ON room_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visits_update" ON room_visits FOR UPDATE USING (auth.uid() = user_id);
