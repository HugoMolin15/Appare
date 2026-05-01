-- =============================================
-- Appare — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- Safe to run multiple times (idempotent)
-- =============================================

-- Words
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  italiano TEXT NOT NULL DEFAULT '',
  hiragana TEXT NOT NULL DEFAULT '',
  katakana TEXT NOT NULL DEFAULT '',
  romaji TEXT NOT NULL DEFAULT '',
  kanji TEXT NOT NULL DEFAULT '',
  category TEXT,
  word_type TEXT,
  folder_id TEXT,
  created_at BIGINT NOT NULL
);

ALTER TABLE words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own words" ON words;
CREATE POLICY "own words" ON words FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Folders
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  parent_id TEXT,
  created_at BIGINT NOT NULL
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own folders" ON folders;
CREATE POLICY "own folders" ON folders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study history (date -> word IDs studied that day)
CREATE TABLE IF NOT EXISTS study_history (
  user_id UUID REFERENCES auth.users NOT NULL,
  date TEXT NOT NULL,
  word_ids TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, date)
);

ALTER TABLE study_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own history" ON study_history;
CREATE POLICY "own history" ON study_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Date colors (cronologia folder colors)
CREATE TABLE IF NOT EXISTS date_colors (
  user_id UUID REFERENCES auth.users NOT NULL,
  key TEXT NOT NULL,
  color TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

ALTER TABLE date_colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own date colors" ON date_colors;
CREATE POLICY "own date colors" ON date_colors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Settings (one row per user)
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  study_goal INTEGER NOT NULL DEFAULT 10,
  japanese_font_size INTEGER NOT NULL DEFAULT 48,
  card_order TEXT[] NOT NULL DEFAULT ARRAY['italiano','hiragana','katakana','romaji','kanji'],
  random_card_order BOOLEAN NOT NULL DEFAULT false,
  daily_words_count INTEGER NOT NULL DEFAULT 5
);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS word_scores JSONB NOT NULL DEFAULT '{}';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS folder_order JSONB NOT NULL DEFAULT '{}';

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own settings" ON settings;
CREATE POLICY "own settings" ON settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Enable Google and Apple OAuth in:
-- Supabase Dashboard > Authentication > Providers
-- =============================================
