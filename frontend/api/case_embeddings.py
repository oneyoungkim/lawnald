"""
RAG 기반 유사 판례 검색 모듈
- 승소사례 업로드 시 임베딩 생성 → Supabase pgvector 저장
- 사건개요 입력 → 유사 판례 벡터 검색
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime

# OpenAI 임베딩
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536

_openai_client = None

def _get_openai():
    global _openai_client
    if _openai_client:
        return _openai_client
    try:
        from search import client  # type: ignore
        _openai_client = client
        return _openai_client
    except Exception:
        return None


def _get_supabase():
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None


def create_embedding(text: str) -> Optional[List[float]]:
    """텍스트를 임베딩 벡터로 변환"""
    client = _get_openai()
    if not client or not text.strip():
        return None
    
    try:
        # 최대 8000자로 제한 (토큰 초과 방지)
        truncated = text[:8000]
        response = client.embeddings.create(
            input=[truncated],
            model=EMBEDDING_MODEL
        )
        return response.data[0].embedding  # type: ignore
    except Exception as e:
        print(f"❌ 임베딩 생성 실패: {e}")
        return None


def store_case_embedding(
    case_id: str,
    lawyer_id: str,
    lawyer_name: str,
    title: str,
    content: str,
    case_number: str = "",
    court: str = "",
    ai_tags: str = "",
    file_hash: str = ""
) -> bool:
    """
    승소사례를 임베딩하여 Supabase에 저장.
    PDF 업로드 → AI 분석 후 이 함수를 호출.
    """
    sb = _get_supabase()
    if not sb:
        print("⚠️ Supabase 미연결 → 임베딩 저장 스킵")
        return False
    
    # 임베딩 생성용 텍스트 (제목 + 본문 + 태그)
    embed_text = f"[{title}] {content} 태그: {ai_tags}"
    embedding = create_embedding(embed_text)
    
    if not embedding:
        print(f"❌ 임베딩 생성 실패: {title[:30]}")
        return False
    
    try:
        data = {
            "id": case_id,
            "lawyer_id": lawyer_id,
            "lawyer_name": lawyer_name,
            "title": title,
            "content_summary": content[:500],  # 요약만 저장
            "case_number": case_number,
            "court": court,
            "ai_tags": ai_tags,
            "file_hash": file_hash,
            "embedding": embedding,
            "created_at": datetime.now().isoformat()
        }
        
        sb.table("case_embeddings").upsert(data).execute()
        print(f"✅ 임베딩 저장: {title[:30]}...")
        return True
    except Exception as e:
        print(f"❌ 임베딩 저장 실패: {e}")
        return False


def search_similar_cases(
    query: str,
    top_k: int = 5,
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    사건개요로 유사 판례를 검색합니다.
    Supabase pgvector의 코사인 유사도 검색 사용.
    """
    sb = _get_supabase()
    if not sb:
        print("⚠️ Supabase 미연결")
        return []
    
    # 쿼리 임베딩
    query_embedding = create_embedding(query)
    if not query_embedding:
        return []
    
    try:
        # Supabase RPC로 유사도 검색 (pgvector cosine similarity)
        result = sb.rpc("match_case_embeddings", {
            "query_embedding": query_embedding,
            "match_threshold": threshold,
            "match_count": top_k
        }).execute()
        
        if result.data:
            return result.data
        return []
    except Exception as e:
        print(f"❌ 유사 판례 검색 실패: {e}")
        return []


# --- Supabase 테이블 설정 SQL ---
SETUP_SQL = """
-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 임베딩 테이블 생성
CREATE TABLE IF NOT EXISTS case_embeddings (
    id TEXT PRIMARY KEY,
    lawyer_id TEXT NOT NULL,
    lawyer_name TEXT DEFAULT '',
    title TEXT NOT NULL,
    content_summary TEXT DEFAULT '',
    case_number TEXT DEFAULT '',
    court TEXT DEFAULT '',
    ai_tags TEXT DEFAULT '',
    file_hash TEXT DEFAULT '',
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 벡터 인덱스 (IVFFlat — 빠른 근사 검색)
CREATE INDEX IF NOT EXISTS idx_case_embeddings_vector 
ON case_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. 유사도 검색 함수
CREATE OR REPLACE FUNCTION match_case_embeddings(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id text,
    lawyer_id text,
    lawyer_name text,
    title text,
    content_summary text,
    case_number text,
    court text,
    ai_tags text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        ce.id,
        ce.lawyer_id,
        ce.lawyer_name,
        ce.title,
        ce.content_summary,
        ce.case_number,
        ce.court,
        ce.ai_tags,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM case_embeddings ce
    WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
$$;
"""


def setup_supabase_tables():
    """Supabase에 필요한 테이블/함수를 설정합니다. (수동 실행용)"""
    print("=== Supabase 설정 SQL ===")
    print(SETUP_SQL)
    print("위 SQL을 Supabase Dashboard > SQL Editor에서 실행해주세요.")
    return SETUP_SQL
