"""
Lawnald Admin Blog Module
- 관리자 전용 공식 블로그 CRUD
- Supabase 영구 저장 (JSON 파일 폴백)
- 관리자 인증 미들웨어
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel  # type: ignore
from fastapi import APIRouter, HTTPException, Header, UploadFile, File  # type: ignore

router = APIRouter(prefix="/api/admin/blog", tags=["admin-blog"])

# --- Supabase 연동 ---
TABLE_NAME = "admin_blog_posts"

def _get_sb():
    """Supabase 클라이언트 반환 (None이면 JSON 폴백)"""
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None


def _load_from_supabase():
    """Supabase에서 블로그 글 전체 로드"""
    sb = _get_sb()
    if sb is None:
        return None
    try:
        res = sb.table(TABLE_NAME).select("*").order("created_at", desc=True).execute()
        posts = []
        for row in res.data or []:
            post = {
                "id": row["id"],
                "title": row.get("title", ""),
                "content": row.get("content", ""),
                "summary": row.get("summary", ""),
                "category": row.get("category", "insights"),
                "cover_image": row.get("cover_image"),
                "featured_lawyer_id": row.get("featured_lawyer_id"),
                "tags": row.get("tags", []),
                "is_published": row.get("is_published", True),
                "author": row.get("author", "로날드 에디터"),
                "author_image": row.get("author_image", "/logo.png"),
                "post_type": row.get("post_type", "ADMIN"),
                "created_at": row.get("created_at", ""),
                "updated_at": row.get("updated_at", ""),
            }
            posts.append(post)
        return posts
    except Exception as e:
        print(f"⚠️ Supabase 블로그 로드 실패: {e}")
        return None


def _upsert_to_supabase(post: dict) -> bool:
    """Supabase에 블로그 글 저장/업데이트"""
    sb = _get_sb()
    if sb is None:
        return False
    try:
        row = {
            "id": post["id"],
            "title": post.get("title", ""),
            "content": post.get("content", ""),
            "summary": post.get("summary", ""),
            "category": post.get("category", "insights"),
            "cover_image": post.get("cover_image"),
            "featured_lawyer_id": post.get("featured_lawyer_id"),
            "tags": post.get("tags", []),
            "is_published": post.get("is_published", True),
            "author": post.get("author", "로날드 에디터"),
            "author_image": post.get("author_image", "/logo.png"),
            "post_type": post.get("post_type", "ADMIN"),
            "created_at": post.get("created_at", datetime.now().isoformat()),
            "updated_at": post.get("updated_at", datetime.now().isoformat()),
        }
        sb.table(TABLE_NAME).upsert(row, on_conflict="id").execute()
        return True
    except Exception as e:
        print(f"⚠️ Supabase 블로그 저장 실패: {e}")
        return False


def _delete_from_supabase(post_id: str) -> bool:
    """Supabase에서 블로그 글 삭제"""
    sb = _get_sb()
    if sb is None:
        return False
    try:
        sb.table(TABLE_NAME).delete().eq("id", post_id).execute()
        return True
    except Exception as e:
        print(f"⚠️ Supabase 블로그 삭제 실패: {e}")
        return False


# --- JSON 파일 폴백 ---
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BUNDLED_JSON = os.path.join(_SCRIPT_DIR, "admin_blog_db.json")
ADMIN_BLOG_FILE = os.path.join("/tmp" if os.path.exists("/tmp") else ".", "admin_blog_db.json")

# 하드코딩 시드 데이터 (Vercel에서 JSON 파일 못 찾을 때 최종 폴백 — 원본 전체 내용)
_SEED_POSTS = [{'id': '4cc34b06', 'title': '자본과 경매 입찰 순이 아닌, 오직 전문성으로 승부하는 변호사 찾기의 새로운 표준', 'content': "네이버 검색창에 주요 법률 키워드를 검색해 보신 적 있으신가요? 가장 먼저 화면 상단을 차지하는 것은 변호사의 실력이나 승소율이 아닙니다. 철저한 '자본'의 크기입니다.

> 10만 원짜리 클릭, 이 출혈 경쟁을 언제까지 버티시겠습니까?

현재 법률 시장은 클릭 당 10만 원에 달하는 비용을 서슴없이 입찰해야만 겨우 상위에 노출될 수 있는 기형적인 구조가 되었습니다. 광고비를 쏟아붓는 특정 로펌과 일부 변호사가 의뢰인을 독식하는 이 참담한 현실을, 우리는 그저 '어쩔 수 없는 경쟁'이라는 단어로 단순하게 치부해서는 안 됩니다.

내 인생을 걸고 싸워줄 법률 전문가를 찾는 과정이, 돈을 가장 많이 낸 사람부터 보여주는 '경매장'과 같을 수는 없습니다. 변호사는 결코 경매 입찰 순으로 소개되어서는 안 됩니다.

> 로날드에는 '광고 탭'이 없습니다. 오직 '전문성'만 묻습니다.

저희는 흔하디흔한 블로그 상위 노출 대행이나 키워드 광고를 제안하려는 것이 아닙니다. 로날드에는 애초에 돈을 내고 순위를 올리는 '광고 탭' 자체가 없으며, 광고비를 일절 받지 않습니다.

로날드가 변호사님께 원하는 것은 자본력이 아닙니다. 오직 '전문성'입니다.

> 로날드의 매칭 시스템은 직관적이고 공정합니다.

의뢰인이 답답하고 억울한 자신의 사연을 AI 로날드에 적습니다.

AI가 의뢰인의 사연을 정밀하게 분석하여, 해당 사연과 가장 비슷한 승소 사례와 전문 지식을 보유한 변호사 10명을 찾아내어 추천합니다.

> 대한민국 변호사 찾기의 새로운 표준, 로날드가 시작합니다.

더 이상 무의미한 법률 키워드 입찰 전쟁에 피 같은 비용과 시간을 쏟지 마십시오. 변호사님이 피땀 흘려 이뤄낸 '승소 판결문'과 '전문적인 칼럼' 그 자체가 가장 강력한 마케팅 무기가 되는 곳, 그곳이 바로 로날드입니다.

의뢰인에게는 가장 확실한 전문가를, 변호사님께는 불필요한 비용 없는 공정한 무대를 제공하겠습니다. 대한민국 변호사 찾기, 로날드가 표준이 되도록 시작하겠습니다.

> [파운딩 멤버 초청 안내]

지금 로날드의 철학에 공감하시는 진정성 있는 변호사님들을 모시고 있습니다. 파운딩 멤버로 합류하시면 평생 구독료 50% 할인과 초기 상단 노출 및 베스트로이어 배지 등의 영구적인 혜택을 드립니다.", 'summary': "로날드가 변호사님께 원하는 것은 자본력이 아닙니다. 오직 '전문성'입니다.", 'category': 'platform-news', 'cover_image': None, 'featured_lawyer_id': None, 'tags': ['변호사광고'], 'is_published': True, 'author': '로날드 에디터', 'author_image': '/logo.png', 'post_type': 'ADMIN', 'created_at': '2026-02-22T01:05:38.129720', 'updated_at': '2026-02-22T01:25:44.495183'}, {'id': 'bc142874', 'title': '외형 확장에 집중하는 리걸 플랫폼, 그 거대한 유지 비용은 누구의 지갑에서 나올까요?', 'content': '
법률 시장을 혁신하겠다며 등장한 기존의 플랫폼들은 막대한 자본을 투자해 외형을 키우고 시장을 선점하는 데 집중해 왔습니다. 하지만 그 이면을 들여다보면 우려스러운 구조적 한계가 존재합니다.

막대한 마케팅 비용과 인건비, 그리고 인프라 유지에 들어가는 천문학적인 자금은 결국 어디서 충당될까요? 그 거대한 플랫폼을 유지하기 위한 비용은 필연적으로 수요자인 변호사님들의 광고비와 수수료라는 형태로 전가될 수밖에 없는 구조입니다.

플랫폼이 수익을 창출하기 위해 광고 구좌를 쪼개고 입찰 경쟁을 유도할수록, 자본력이 뛰어난 대형 로펌이나 마케팅 비용을 아낌없이 쏟아붓는 소수의 변호사에게만 수임이 집중됩니다. 반면, 묵묵히 실력으로 승부하려는 대다수의 변호사님들은 막대한 광고비의 장벽에 부딪혀 철저히 소외되는 승자독식의 굴레가 반복되고 있습니다.

이제 업계는 변호사님들이 무의미한 출혈 경쟁을 벌이며 검색 포털과 플랫폼의 외형 확장만 돕는 이 기형적인 구조에서 벗어나야 합니다.

로날드는 다릅니다. 고비용 저효율의 원인이 되는 불필요한 경쟁과 과도한 마케팅 시스템을 철저히 배제했습니다. 의뢰인과 변호사를 직접 연결하는 본질적인 기능에 집중하여, 막대한 운영비 없이도 지속 가능한 합리적인 광고와 업무 시스템을 완성했습니다.

부담스러운 광고비 입찰이나 상위 노출을 위한 헛된 지출은 더 이상 필요 없습니다. 변호사님의 실력을 증명하는 승소 사례와 칼럼만 있다면, 로날드는 영구적인 마케팅 자산이 되어 변호사님과 의뢰인을 공정하게 연결할 것입니다. 변호사님들의 지출은 획기적으로 줄어들고, 오직 사건과 의뢰인에게만 집중할 수 있는 환경을 약속드립니다.

[파운딩 멤버 초청 안내]
지금 로날드의 철학에 공감하시는 진정성 있는 변호사 500분께 파운딩 멤버 합류를 제안합니다. 파운딩 멤버가 되어주신 모든 변호사 분들께는 평생 구독료 50% 할인, 초기 상단 노출 및 로날드 선정 베스트로이어 배지 영구 부여 등의 혜택을 드립니다.', 'summary': '막대한 마케팅 비용과 인건비, 그리고 인프라 유지에 들어가는 천문학적인 자금은 결국 어디서 충당될까요? 그 거대한 플랫폼을 유지하기 위한 비용은 필연적으로 수요자인 변호사님들의 광고비와 수수료라는 형태로 전가될 수밖에 없는 구조입니다.', 'category': 'platform-news', 'cover_image': None, 'featured_lawyer_id': None, 'tags': [], 'is_published': True, 'author': '로날드 에디터', 'author_image': '/logo.png', 'post_type': 'ADMIN', 'created_at': '2026-02-22T01:30:09.130575', 'updated_at': '2026-02-22T01:30:19.609315'}, {'id': '77aa603a', 'title': '클릭 당 10만 원 시대, 변호사님의 마케팅 수익률은 안녕하십니까?', 'content': "

수십 년간 변호사 마케팅 시장에서 변한 것이 있다면, 오직 검색 포털의 키워드 입찰 단가뿐입니다.

미국은 국민 244명당 변호사가 1명, 한국은 1383명당 1명입니다. 통계적으로 우리가 훨씬 유리한 환경임에도 불구하고, 한국 변호사들의 마케팅 지출은 미국 대비 30%가량 더 큽니다. 소비자도, 시장도, 그리고 비용을 직접 지불하시는 변호사님 조차 납득하기 어려운 기형적인 상황입니다.

## 클릭 한 번에 10만 원, 정말 감당할 수 있으십니까?

대형 네트워크 펌들이 상한 금액인 클릭 당 10만 원을 거리낌 없이 입찰하면서 마케팅 단가는 아득해졌습니다. 이제는 웬만한 변호사분들이 출혈을 각오하고 10만 원을 입찰해도 10위권 노출조차 보장받지 못하는 경우가 허다합니다. 광고비를 쏟아붓는 소수가 의뢰인을 독식하는 이 현실을 그저 단순한 '자유 경쟁'으로 치부해서는 안 됩니다.

이러한 구조 속에서는 법률 쇼퍼들이 발생시키는 트래픽에 변호사님들이 고스란히 비용을 지불하고, 결국 검색 포털과 거대 플랫폼의 배만 불려주는 악순환이 반복될 뿐입니다.

## 밑 빠진 독에 물 붓기식 마케팅, 이제는 멈춰야 합니다.

법률 시장은 반드시 이 휘발성 마케팅 비용을 최우선으로 줄여야만 건전한 발전을 도모할 수 있습니다. 로날드에서는 클릭 당 10만 원에 달하는 법률 키워드를 입찰하실 필요가 없습니다. 자금이 떨어지면 순식간에 사라지는 파워링크와는 근본적으로 다릅니다.

## 승소 판결문 PDF 업로드, 그것으로 모든 마케팅이 끝납니다.

로날드의 시스템이 알아서 난해한 법률 용어를 의뢰인의 눈높이에 맞게 번역하고, 스토리를 입히며, 검색 엔진 최적화와 썸네일 생성까지 완료하여 발행합니다. 로날드에 기록된 모든 승소 사례와 칼럼은 변호사님의 영구적인 포트폴리오이자 자산이 되어 24시간 쉬지 않고 의뢰인을 설득할 것입니다.

자본의 크기가 아닌, 변호사님의 진짜 실력으로 영구적인 마케팅 자산을 구축하십시오.

## [파운딩 멤버 초청 안내]
팀 로날드가 생각하는 진정성 있는 변호사 500분께 파운딩 멤버 합류를 제안합니다. 파운딩 멤버가 되어주신 변호사분들께는 아래와 같은 영구적인 혜택을 드립니다. (500명 이상 가입 시 혜택 종료)

평생 구독료 50% 할인

초기 상단 노출 및 로날드 선정 베스트로이어 배지 부여

네이버 블로그 자동 연동 서비스 무상 지원", 'summary': '미국은 국민 244명당 변호사가 1명, 한국은 1383명당 1명입니다. 통계적으로 우리가 훨씬 유리한 환경임에도 불구하고, 한국 변호사들의 마케팅 지출은 미국 대비 30%가량 더 큽니다. 소비자도, 시장도, 그리고 비용을 직접 지불하시는 변호사님 조차 납득하기 어려운 기형적인 상황입니다.', 'category': 'insights', 'cover_image': None, 'featured_lawyer_id': None, 'tags': ['변호사마케팅'], 'is_published': True, 'author': '로날드 에디터', 'author_image': '/logo.png', 'post_type': 'ADMIN', 'created_at': '2026-02-22T01:35:25.659669', 'updated_at': '2026-02-22T01:35:25.659669'}, {'id': '3c6b8ea9', 'title': '미국 변호사보다 마케팅 비용을 30% 더 쓰는 한국 법률 시장의 기형적 구조', 'content': "
미국의 변호사 수는 국민 244명당 1명입니다. 반면 한국은 1383명당 1명에 불과합니다.

단순한 통계만 놓고 보면 한국의 변호사 시장이 미국보다 훨씬 여유로워야 정상입니다. 하지만 현실은 정반대입니다. 한국 변호사가 미국 변호사 대비 지출하는 마케팅 비용은 무려 30%가량 더 큽니다. 변호사 1인당 감당해야 할 잠재적 의뢰인 수는 한국이 5배나 많은데, 왜 광고비는 우리가 훨씬 더 많이 내고 있을까요?

## 이 기형적인 수치가 바로 현재 대한민국 법률 시장의 뼈아픈 현실을 증명합니다.

소비자도, 변호사도, 시장도 납득하기 어려운 이 현상의 원인은 단 하나입니다. 의뢰인이 자신에게 맞는 변호사를 찾는 과정이 너무나도 험난하고, 정보의 통로가 좁게 통제되어 있기 때문입니다. 그 좁은 길목을 장악한 거대 검색 포털과 적자에 허덕이는 리걸 플랫폼들이 모든 트래픽 비용을 변호사님들에게 전가하고 있는 것입니다.

이것은 변호사님들의 역량 문제도, 수임료의 문제도 아닙니다. 필연적으로 변호사의 지출을 늘려야만 자신들의 누적 적자를 메울 수 있는 플랫폼들의 '구조적 문제'입니다.

수임료 수준은 선진국과 비교해도, 그간의 물가 상승률을 감안해도 저렴한 수준에 머물러 있는데, 지출해야 하는 광고비는 매년 천정부지로 솟구칩니다. 사건을 더 수임하기 위해 울며 겨자 먹기로 더 많은 마케팅 비용을 태우고, 결국 영업이익은 줄어드는 악순환. 이대로 순응하시겠습니까?

## 로날드는 이 비정상적인 마케팅 굴레를 끊어내기 위해 탄생했습니다.

본질에 집중하십시오. 변호사라는 직업은 이토록 마케팅과 브랜딩에 필사적으로 임해야 하는 직업이 아닙니다. 애초에 그래야 할 이유가 없습니다. 로날드에서는 클릭 당 10만 원의 출혈 입찰도, 플랫폼에 바쳐야 하는 과도한 광고비도 필요 없습니다.

단지 변호사님의 실력을 증명할 승소 판결문을 업로드하고 전문적인 칼럼을 써주시면 됩니다. 로날드의 AI가 난해한 법률 용어를 의뢰인의 언어로 번역하고, 검색 엔진에 최적화하여 압도적인 트래픽을 만들어냅니다. 변호사님의 기록은 휘발성 광고가 아닌 영구적인 마케팅 자산이 되어, 의뢰인과 변호사님을 가장 빠르고 정확하게 연결할 것입니다.", 'summary': '미국의 변호사 수는 국민 244명당 1명입니다. 반면 한국은 1383명당 1명에 불과합니다.  단순한 통계만 놓고 보면 한국의 변호사 시장이 미국보다 훨씬 여유로워야 정상입니다. 하지만 현실은 정반대입니다. 한국 변호사가 미국 변호사 대비 지출하는 마케팅 비용은 무려 30%가량 더 큽니다. 변호사 1인당 감당해야 할 잠재적 의뢰인 수는 한국이 5배나 많은데, 왜 광고비는 우리가 훨씬 더 많이 내고 있을까요?', 'category': 'insights', 'cover_image': None, 'featured_lawyer_id': None, 'tags': ['변호사마케팅'], 'is_published': True, 'author': '로날드 에디터', 'author_image': '/logo.png', 'post_type': 'ADMIN', 'created_at': '2026-02-22T01:37:36.934064', 'updated_at': '2026-02-22T01:37:36.934064'}, {'id': '048906ed', 'title': '내 글로 들어온 의뢰인, 왜 다른 변호사에게 상담받고 있을까?', 'content': '

변호사님께서 바쁜 재판 일정을 쪼개어 정성스럽게 작성한 법률 칼럼과 승소 사례. 그 글을 읽고 절박한 심정으로 유입된 의뢰인이, 정작 글을 쓴 변호사님이 아닌 다른 변호사에게 상담을 받고 수임 계약을 맺는 황당한 상황을 겪어보지 않으셨습니까?

## 기존 리걸 플랫폼들의 교묘한 시스템 구조가 바로 그 원인입니다.

변호사님의 피땀 어린 콘텐츠는 오직 변호사님을 위해 쓰여야 마땅합니다. 하지만 기존 플랫폼들은 변호사님의 글을 자신들의 플랫폼 전체 트래픽을 늘리기 위한 미끼로 사용합니다. 변호사님의 명문장으로 의뢰인을 유인해 놓고선, 교묘하게 다른 변호사들의 리스트를 들이밀며 플랫폼 내에서 법률 쇼핑을 하도록 유도합니다. 결국 광고비를 더 많이 낸 다른 변호사들에게 의뢰인을 빼앗기는 불합리한 구조가 반복되고 있습니다.

재주는 변호사님이 부리고 이득은 플랫폼과 타 변호사가 챙기는 이 기형적인 구조, 언제까지 지켜만 보시겠습니까?

변호사님의 글로 유입이 됐다면, 의뢰인은 당연히 변호사님에게 가야 합니다. 로날드는 이 당연한 상식을 시스템의 기본 원칙으로 삼았습니다.

로날드는 변호사님의 승소 사례와 칼럼을 읽은 의뢰인이 다른 곳으로 이탈하지 않도록, 변호사님과 즉시 상담할 수 있는 다이렉트 매칭 구조를 제공합니다. 변호사님께서 퀄리티 높은 법률 정보 글을 써주시면, 로날드의 AI가 이를 분석하여 추천 시스템에 반영하고 구글에 노출시켜 압도적인 조회수를 만들어냅니다. 그리고 그 조회수는 오롯이 변호사님 한 분만의 온전한 수임 기회로 전환됩니다.

변호사님의 콘텐츠는 오직 변호사님에게만 유용해야 합니다. 로날드에 기록하는 모든 글은 플랫폼의 배를 불리는 수단이 아닌, 변호사님의 영구적인 포트폴리오이자 독점적인 마케팅 자산이 될 것입니다.', 'summary': '변호사님께서 바쁜 재판 일정을 쪼개어 정성스럽게 작성한 법률 칼럼과 승소 사례. 그 글을 읽고 절박한 심정으로 유입된 의뢰인이, 정작 글을 쓴 변호사님이 아닌 다른 변호사에게 상담을 받고 수임 계약을 맺는 황당한 상황을 겪어보지 않으셨습니까?', 'category': 'insights', 'cover_image': None, 'featured_lawyer_id': None, 'tags': ['변호사상담'], 'is_published': True, 'author': '로날드 에디터', 'author_image': '/logo.png', 'post_type': 'ADMIN', 'created_at': '2026-02-22T01:39:06.058877', 'updated_at': '2026-02-22T01:39:06.058877'}]

def _load_from_json() -> List[dict]:
    # 1. 번들 파일 먼저 확인 (Vercel 배포 시 코드와 함께 포함)
    for path in [_BUNDLED_JSON, ADMIN_BLOG_FILE]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data:
                    print(f"📁 JSON 로드: {path} ({len(data)}개)")
                    return data
            except Exception:
                pass
    # JSON 파일 없으면 하드코딩 시드 데이터 반환
    if _SEED_POSTS:
        print(f"📁 하드코딩 시드 데이터 사용: {len(_SEED_POSTS)}개")
    return _SEED_POSTS[:]

def _save_to_json(db: list):
    try:
        with open(ADMIN_BLOG_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ JSON 저장 실패: {e}")


# --- 초기 로드 ---
def load_blog_db() -> List[dict]:
    # Supabase 우선
    sb_posts = _load_from_supabase()
    json_posts = _load_from_json()

    if sb_posts is not None:
        if len(sb_posts) > 0:
            print(f"✅ Supabase에서 블로그 글 {len(sb_posts)}개 로드")
            return sb_posts
        # Supabase 연결됐지만 비어있고, JSON에 데이터가 있으면 동기화
        if len(json_posts) > 0:
            print(f"🔄 Supabase 비어있음 → JSON {len(json_posts)}개 글 동기화 시작")
            for post in json_posts:
                _upsert_to_supabase(post)
            print(f"✅ JSON → Supabase 동기화 완료 ({len(json_posts)}개)")
            return json_posts
        return []

    # Supabase 연결 실패 → JSON 폴백
    print(f"📁 JSON에서 블로그 글 {len(json_posts)}개 로드")
    return json_posts

def save_blog_db(db: list):
    """전체 DB를 JSON에 저장 (폴백용)"""
    _save_to_json(db)

ADMIN_BLOG_DB = load_blog_db()

# --- Admin Auth ---
import hashlib

ADMIN_CREDENTIALS = {
    "username": os.getenv("ADMIN_USERNAME", ""),
    "password": os.getenv("ADMIN_PASSWORD", ""),
}

def _generate_token(username: str) -> str:
    """간단한 토큰 생성 (salt는 환경변수에서 로드)"""
    salt = os.getenv("ADMIN_TOKEN_SALT", os.getenv("JWT_SECRET_KEY", "default-salt"))
    raw = f"{username}:{salt}"
    return hashlib.sha256(raw.encode()).hexdigest()

ADMIN_TOKEN = _generate_token(ADMIN_CREDENTIALS["username"])

def verify_admin(authorization: Optional[str] = Header(None)):
    """관리자 인증 미들웨어"""
    if not authorization:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="관리자 권한이 없습니다")


class AdminLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
async def admin_login(req: AdminLoginRequest):
    """관리자 로그인"""
    if req.username != ADMIN_CREDENTIALS["username"] or req.password != ADMIN_CREDENTIALS["password"]:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다")
    return {
        "message": "로그인 성공",
        "token": ADMIN_TOKEN,
        "username": req.username,
    }


@router.get("/auth/verify")
async def admin_verify(authorization: Optional[str] = Header(None)):
    """관리자 토큰 검증"""
    verify_admin(authorization)
    return {"valid": True, "username": ADMIN_CREDENTIALS["username"]}


# --- Pydantic Models ---
class AdminPostCreate(BaseModel):
    title: str
    content: str  # Markdown content
    summary: str
    category: str = "insights"
    cover_image: Optional[str] = None
    featured_lawyer_id: Optional[str] = None
    tags: List[str] = []
    is_published: bool = True


class AdminPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    cover_image: Optional[str] = None
    featured_lawyer_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None


# --- Public API (No Auth) ---
@router.get("/posts")
async def list_posts(category: Optional[str] = None):
    """공개 블로그 글 목록"""
    # 매번 Supabase에서 최신 데이터 로드 시도
    fresh = _load_from_supabase()
    # Supabase 비어있으면 인메모리 데이터 사용
    posts = fresh if (fresh is not None and len(fresh) > 0) else ADMIN_BLOG_DB

    posts = [p for p in posts if p.get("is_published", True)]
    if category:
        posts = [p for p in posts if p.get("category") == category]
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [{
        "id": p["id"],
        "title": p["title"],
        "summary": p["summary"],
        "category": p["category"],
        "cover_image": p.get("cover_image"),
        "featured_lawyer_id": p.get("featured_lawyer_id"),
        "tags": p.get("tags", []),
        "created_at": p["created_at"],
        "updated_at": p.get("updated_at"),
    } for p in posts]


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """공개 블로그 글 상세"""
    # Supabase에서 최신 데이터 시도
    fresh = _load_from_supabase()
    source = fresh if (fresh is not None and len(fresh) > 0) else ADMIN_BLOG_DB

    post = next((p for p in source if p["id"] == post_id), None)
    if not post or not post.get("is_published", True):
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    featured_lawyer = None
    if post.get("featured_lawyer_id"):  # type: ignore
        try:
            from data import LAWYERS_DB  # type: ignore
            featured_lawyer = next(
                (l for l in LAWYERS_DB if l["id"] == post["featured_lawyer_id"]), None  # type: ignore
            )
            if featured_lawyer:
                featured_lawyer = {
                    "id": featured_lawyer["id"],
                    "name": featured_lawyer["name"],
                    "firm": featured_lawyer.get("firm", ""),
                    "location": featured_lawyer.get("location", ""),
                    "expertise": featured_lawyer.get("expertise", []),
                    "imageUrl": featured_lawyer.get("imageUrl"),
                    "cutoutImageUrl": featured_lawyer.get("cutoutImageUrl"),
                    "introduction_short": featured_lawyer.get("introduction_short"),
                }
        except Exception:
            pass

    return {**post, "featured_lawyer": featured_lawyer}  # type: ignore


# --- Admin CRUD (Auth Required) ---
@router.post("/manage")
async def create_post(post: AdminPostCreate, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 작성"""
    verify_admin(authorization)

    new_post = {
        "id": str(uuid.uuid4())[:8],  # type: ignore
        "title": post.title,
        "content": post.content,
        "summary": post.summary,
        "category": post.category,
        "cover_image": post.cover_image,
        "featured_lawyer_id": post.featured_lawyer_id,
        "tags": post.tags,
        "is_published": post.is_published,
        "author": "로날드 에디터",
        "author_image": "/logo.png",
        "post_type": "ADMIN",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    # Supabase에 저장
    if not _upsert_to_supabase(new_post):
        print("⚠️ Supabase 저장 실패 → JSON 폴백")

    # 인메모리 + JSON 동기화
    ADMIN_BLOG_DB.append(new_post)
    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 등록되었습니다", "id": new_post["id"]}


@router.put("/manage/{post_id}")
async def update_post(post_id: str, post: AdminPostUpdate, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 수정"""
    verify_admin(authorization)

    existing = next((p for p in ADMIN_BLOG_DB if p["id"] == post_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    update_data = post.model_dump(exclude_none=True)
    existing.update(update_data)
    existing["updated_at"] = datetime.now().isoformat()

    # Supabase에 저장
    if not _upsert_to_supabase(existing):
        print("⚠️ Supabase 업데이트 실패 → JSON 폴백")

    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 수정되었습니다"}


@router.delete("/manage/{post_id}")
async def delete_post(post_id: str, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 삭제"""
    verify_admin(authorization)

    global ADMIN_BLOG_DB
    before = len(ADMIN_BLOG_DB)
    ADMIN_BLOG_DB = [p for p in ADMIN_BLOG_DB if p["id"] != post_id]

    if len(ADMIN_BLOG_DB) == before:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    # Supabase에서 삭제
    _delete_from_supabase(post_id)

    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 삭제되었습니다"}


@router.get("/manage/all")
async def list_all_posts(authorization: Optional[str] = Header(None)):
    """관리자: 모든 글 목록 (비공개 포함)"""
    verify_admin(authorization)
    # Supabase에서 최신 데이터
    fresh = _load_from_supabase()
    source = fresh if fresh is not None else ADMIN_BLOG_DB
    posts = sorted(source, key=lambda x: x.get("created_at", ""), reverse=True)
    return posts


@router.post("/upload-image")
async def upload_blog_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    """관리자: 블로그 이미지 업로드 (클립보드 붙여넣기용)"""
    verify_admin(authorization)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="5MB 이하의 이미지만 업로드 가능합니다")

    # 고유 파일명 생성
    ext_map = {"image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "image/webp": ".webp"}
    ext = ext_map.get(file.content_type, ".png")
    timestamp = int(datetime.now().timestamp() * 1000)
    filename = f"blog_{timestamp}_{str(uuid.uuid4())[:6]}{ext}"  # type: ignore

    # Supabase Storage 업로드 시도
    try:
        from storage_utils import upload_and_get_url  # type: ignore
        public_url = upload_and_get_url("photos", f"blog/{filename}", file_bytes, file.content_type)
        if public_url:
            print(f"✅ 블로그 이미지 업로드: {public_url}")
            return {"url": public_url, "filename": filename}
    except Exception as e:
        print(f"⚠️ Supabase Storage 실패: {e}")

    # 폴백: /tmp에 저장
    tmp_dir = "/tmp/uploads/blog"
    os.makedirs(tmp_dir, exist_ok=True)
    filepath = os.path.join(tmp_dir, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)  # type: ignore

    fallback_url = f"/uploads/blog/{filename}"
    print(f"📁 블로그 이미지 로컬 저장: {fallback_url}")
    return {"url": fallback_url, "filename": filename}
