-- ============================================
-- cocoro — Supabase DB Schema
-- Supabase Dashboard > SQL Editor で実行
-- ============================================

-- 1. プロフィール
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '名無し',
  avatar_id TEXT NOT NULL DEFAULT 'seed-san',
  bio TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- トリガー: updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auth トリガー: 新規ユーザー作成時にプロフィール自動生成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', '名無し'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. ルーム
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '☕',
  vibe TEXT,
  host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_participants INTEGER NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'cosmos',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- デフォルトルーム
INSERT INTO rooms (name, emoji, vibe, theme) VALUES
  ('コグニティブ・ラウンジ', '☕', 'カジュアルに語ろう', 'cosmos'),
  ('エモーション・フィールド', '🌿', '静かなひととき', 'nature'),
  ('グラビティ・コア', '🎉', 'エネルギッシュに', 'neon'),
  ('リジェネラティブ・スペース', '🌙', 'まったりタイム', 'sunset')
ON CONFLICT DO NOTHING;

-- 3. ルーム訪問履歴
CREATE TABLE IF NOT EXISTS room_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_min INTEGER
);

CREATE INDEX idx_room_visits_user ON room_visits(user_id);
CREATE INDEX idx_room_visits_room ON room_visits(room_id);

-- 4. フレンド関係
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- 5. レピュテーションイベント
CREATE TABLE IF NOT EXISTS reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reputation_user ON reputation_events(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- profiles: 全員読み取り可、本人のみ更新可
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- rooms: 全員読み取り可、認証済みユーザーのみ作成可
CREATE POLICY "rooms_read" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (host_id = auth.uid());

-- room_visits: 本人のみ読み書き
CREATE POLICY "visits_own" ON room_visits FOR ALL USING (user_id = auth.uid());

-- friendships: 関係者のみ
CREATE POLICY "friends_own" ON friendships FOR ALL 
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- reputation_events: 全員読み取り可、本人のみ挿入
CREATE POLICY "rep_read" ON reputation_events FOR SELECT USING (true);
CREATE POLICY "rep_insert" ON reputation_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
