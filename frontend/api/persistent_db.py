"""
Persistent DB Helper
- Supabase-backed storage for LEADS_DB, CLIENT_STORIES_DB, CONSULTATIONS_DB, SUBMISSIONS_DB
- Each uses a simple pattern: Supabase table with id + data JSONB
- In-memory cache with periodic sync
"""


def _sb():
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None


def sb_append(table: str, item: dict, id_field: str = "id", fk_field: str = "lawyer_id"):
    """Supabase에 항목 추가 (upsert)"""
    sb = _sb()
    if sb is None:
        return False
    try:
        row = {
            "id": item[id_field],
            fk_field: item.get(fk_field, ""),
            "data": item,
        }
        sb.table(table).upsert(row, on_conflict="id").execute()
        return True
    except Exception as e:
        print(f"⚠️ {table} Supabase 저장 실패: {e}")
        return False


def sb_load_all(table: str) -> list:
    """Supabase에서 전체 항목 로드"""
    sb = _sb()
    if sb is None:
        return []
    try:
        res = sb.table(table).select("data").execute()
        return [r["data"] for r in (res.data or [])]
    except Exception as e:
        print(f"⚠️ {table} Supabase 로드 실패: {e}")
        return []


def sb_load_by_fk(table: str, fk_field: str, fk_value: str) -> list:
    """Supabase에서 FK 기준으로 항목 로드"""
    sb = _sb()
    if sb is None:
        return []
    try:
        res = sb.table(table).select("data").eq(fk_field, fk_value).execute()
        return [r["data"] for r in (res.data or [])]
    except Exception as e:
        print(f"⚠️ {table} Supabase 로드 실패: {e}")
        return []


def sb_update(table: str, item_id: str, data: dict):
    """Supabase 항목 업데이트"""
    sb = _sb()
    if sb is None:
        return False
    try:
        sb.table(table).update({"data": data}).eq("id", item_id).execute()
        return True
    except Exception as e:
        print(f"⚠️ {table} Supabase 업데이트 실패: {e}")
        return False
