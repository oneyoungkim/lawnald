-- ============================================
-- Lawnald — Supabase 변호사 테이블 생성 스크립트
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS lawyers (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  is_mock BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_lawyers_verified ON lawyers(verified);
CREATE INDEX IF NOT EXISTS idx_lawyers_is_mock ON lawyers(is_mock);

-- 3. Row Level Security (RLS) — API 키로 접근 허용
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON lawyers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON lawyers FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON lawyers FOR DELETE USING (true);

-- ============================================
-- 관리자 블로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS admin_blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'insights',
  cover_image TEXT,
  featured_lawyer_id TEXT,
  tags JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT TRUE,
  author TEXT DEFAULT '로날드 에디터',
  author_image TEXT DEFAULT '/logo.png',
  post_type TEXT DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON admin_blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_category ON admin_blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_created ON admin_blog_posts(created_at DESC);

ALTER TABLE admin_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON admin_blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON admin_blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON admin_blog_posts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON admin_blog_posts FOR DELETE USING (true);
