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
