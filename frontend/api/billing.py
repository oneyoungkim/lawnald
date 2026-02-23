"""
Lawnald SaaS Billing Module
- 토스페이먼츠 빌링키 발급 및 정기 결제
- 파운딩 멤버 평생 50% 할인
- 자동 결제 스케줄러
"""

import os
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

# --- Configuration ---
TOSS_SECRET_KEY = os.getenv("TOSS_SECRET_KEY", "test_sk_FAKE_KEY_FOR_DEV")
TOSS_API_BASE = "https://api.tosspayments.com"
FOUNDER_LIMIT = 300
STANDARD_PRICE = 200000  # 월 정가 20만 원
FOUNDER_DISCOUNT = 0.5   # 파운딩 멤버 50% 할인 → 10만 원

router = APIRouter(prefix="/api/billing", tags=["billing"])


# --- Pydantic Models ---
class BillingKeyRequest(BaseModel):
    lawyer_id: str
    auth_key: str  # 토스에서 발급한 인증키 (customerKey + authKey)
    customer_key: str


class ChargeRequest(BaseModel):
    lawyer_id: str


class SubscriptionStatus(BaseModel):
    is_subscribed: bool
    is_founder: bool
    trial_ends_at: Optional[str]
    days_remaining: int
    plan_name: str
    monthly_price: int
    has_billing_key: bool


# --- Helper Functions ---
def calculate_amount(lawyer: dict) -> int:
    """
    결제 금액 산정.
    파운딩 멤버(is_founder=True)는 평생 50% 할인.
    """
    if lawyer.get("is_founder", False):
        return int(STANDARD_PRICE * (1 - FOUNDER_DISCOUNT))  # 100,000원
    return STANDARD_PRICE  # 200,000원


def get_trial_days_remaining(lawyer: dict) -> int:
    """무료 체험 남은 일수 계산"""
    trial_str = lawyer.get("trial_ends_at")
    if not trial_str:
        return 0
    try:
        trial_end = datetime.fromisoformat(trial_str)
        remaining = (trial_end - datetime.now()).days
        return max(0, remaining)
    except (ValueError, TypeError):
        return 0


def is_trial_active(lawyer: dict) -> bool:
    """무료 체험 기간 중인지 확인"""
    return get_trial_days_remaining(lawyer) > 0


def set_founder_benefits(lawyer: dict) -> dict:
    """
    회원가입 시 파운더 혜택 부여.
    외부에서 LAWYERS_DB 길이 체크 후 호출.
    """
    lawyer["is_founder"] = True
    lawyer["is_subscribed"] = True  # 체험 기간 동안은 구독 상태
    lawyer["trial_ends_at"] = (datetime.now() + timedelta(days=90)).isoformat()
    lawyer["subscription_plan"] = "founder"
    return lawyer


def set_standard_trial(lawyer: dict) -> dict:
    """일반 가입자 체험 혜택 부여 (14일)"""
    lawyer["is_founder"] = False
    lawyer["is_subscribed"] = True
    lawyer["trial_ends_at"] = (datetime.now() + timedelta(days=14)).isoformat()
    lawyer["subscription_plan"] = "standard"
    return lawyer


# --- Toss Payments API Wrapper ---
async def toss_issue_billing_key(auth_key: str, customer_key: str) -> dict:
    """토스페이먼츠 빌링키 발급"""
    import base64
    encoded_key = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TOSS_API_BASE}/v1/billing/authorizations/issue",
            headers={
                "Authorization": f"Basic {encoded_key}",
                "Content-Type": "application/json",
            },
            json={
                "authKey": auth_key,
                "customerKey": customer_key,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"빌링키 발급 실패: {response.text}"
        )

    return response.json()


async def toss_charge_billing(billing_key: str, amount: int, order_id: str, customer_key: str) -> dict:
    """토스페이먼츠 빌링키로 자동 결제"""
    import base64
    encoded_key = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TOSS_API_BASE}/v1/billing/{billing_key}",
            headers={
                "Authorization": f"Basic {encoded_key}",
                "Content-Type": "application/json",
            },
            json={
                "customerKey": customer_key,
                "amount": amount,
                "orderId": order_id,
                "orderName": "로날드 변호사 프리미엄 월 구독",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"결제 실패: {response.text}"
        )

    return response.json()


# --- API Routes ---
@router.post("/issue-key")
async def issue_billing_key(req: BillingKeyRequest):
    """빌링키 발급 (카드 등록)"""
    from data import LAWYERS_DB, save_lawyers_db

    lawyer = next((l for l in LAWYERS_DB if l["id"] == req.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다")

    # 토스 API 호출
    if TOSS_SECRET_KEY.startswith("test_sk_FAKE"):
        # Mock mode for development
        billing_key = f"mock_billing_{uuid.uuid4().hex[:12]}"
    else:
        result = await toss_issue_billing_key(req.auth_key, req.customer_key)
        billing_key = result.get("billingKey")

    lawyer["billing_key"] = billing_key
    save_lawyers_db(LAWYERS_DB)

    return {"message": "카드가 성공적으로 등록되었습니다", "billing_key_registered": True}


@router.post("/charge")
async def charge_subscription(req: ChargeRequest):
    """수동 결제 실행"""
    from data import LAWYERS_DB, save_lawyers_db

    lawyer = next((l for l in LAWYERS_DB if l["id"] == req.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다")

    billing_key = lawyer.get("billing_key")
    if not billing_key:
        raise HTTPException(status_code=400, detail="등록된 카드가 없습니다. 먼저 카드를 등록해주세요.")

    amount = calculate_amount(lawyer)
    order_id = f"lawnald_{lawyer['id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    if TOSS_SECRET_KEY.startswith("test_sk_FAKE"):
        # Mock mode
        result = {
            "orderId": order_id,
            "amount": amount,
            "status": "DONE",
            "method": "카드",
        }
    else:
        result = await toss_charge_billing(
            billing_key, amount, order_id, lawyer.get("id", "unknown")
        )

    # 결제 성공 → 구독 상태 갱신
    lawyer["is_subscribed"] = True
    lawyer["trial_ends_at"] = None  # 체험 종료, 정식 결제
    save_lawyers_db(LAWYERS_DB)

    discount_text = " (파운딩 멤버 50% 할인 적용)" if lawyer.get("is_founder") else ""
    return {
        "message": f"결제가 완료되었습니다{discount_text}",
        "amount": amount,
        "order_id": order_id,
    }


@router.get("/status/{lawyer_id}")
async def get_subscription_status(lawyer_id: str):
    """구독 상태 조회"""
    from data import LAWYERS_DB

    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다")

    is_founder = lawyer.get("is_founder", False)
    is_subscribed = lawyer.get("is_subscribed", False)
    days_remaining = get_trial_days_remaining(lawyer)
    has_billing_key = bool(lawyer.get("billing_key"))

    # 평생 무료 구독 (테스트 계정)
    if lawyer.get("subscription_plan") == "lifetime_free":
        plan_name = "평생 무료 구독"
        monthly_price = 0
        days_remaining = 9999
    elif is_founder and is_trial_active(lawyer):
        plan_name = "파운딩 멤버 무료 체험"
        monthly_price = 0
    elif is_founder:
        plan_name = "파운딩 멤버 (평생 50% 할인)"
        monthly_price = calculate_amount(lawyer)
    elif is_trial_active(lawyer):
        plan_name = "무료 체험"
        monthly_price = 0
    else:
        plan_name = "스탠다드"
        monthly_price = STANDARD_PRICE

    return SubscriptionStatus(
        is_subscribed=is_subscribed,
        is_founder=is_founder,
        trial_ends_at=lawyer.get("trial_ends_at"),
        days_remaining=days_remaining,
        plan_name=plan_name,
        monthly_price=monthly_price,
        has_billing_key=has_billing_key,
    )


@router.get("/founder-count")
async def get_founder_count():
    """파운딩 멤버 현황 (FOMO 카운터용)"""
    from data import LAWYERS_DB

    total_lawyers = len(LAWYERS_DB)
    founder_count = sum(1 for l in LAWYERS_DB if l.get("is_founder", False))
    remaining_slots = max(0, FOUNDER_LIMIT - total_lawyers)

    return {
        "total_lawyers": total_lawyers,
        "founder_count": founder_count,
        "founder_limit": FOUNDER_LIMIT,
        "remaining_slots": remaining_slots,
        "is_open": remaining_slots > 0,
    }


class ActivateRequest(BaseModel):
    lawyer_id: str


@router.post("/activate-founder")
async def activate_founder(req: ActivateRequest):
    """기존 가입 변호사의 파운딩 멤버 구독 활성화"""
    from data import LAWYERS_DB, save_lawyers_db

    lawyer = next((l for l in LAWYERS_DB if l["id"] == req.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다")

    # 이미 파운딩 멤버인 경우
    if lawyer.get("is_founder"):
        return {"message": "이미 파운딩 멤버입니다", "is_founder": True, "already_active": True}

    # 콘텐츠 10개 이상 업로드 필수
    content_count = len(lawyer.get("content_items", []))
    if content_count < 10:
        raise HTTPException(
            status_code=400,
            detail=f"파운딩 멤버 활성화를 위해 승소사례와 칼럼을 합산 10개 이상 등록해야 합니다. (현재 {content_count}개)"
        )

    # 자리 체크
    total = len(LAWYERS_DB)
    if total > FOUNDER_LIMIT:
        raise HTTPException(status_code=400, detail="파운딩 멤버 모집이 마감되었습니다")

    set_founder_benefits(lawyer)
    save_lawyers_db(LAWYERS_DB)

    return {
        "message": "🚀 파운딩 멤버로 활성화되었습니다! 3개월 무료 체험 + 평생 50% 할인",
        "is_founder": True,
        "trial_ends_at": lawyer["trial_ends_at"],
    }


@router.post("/activate-standard")
async def activate_standard(req: ActivateRequest):
    """기존 가입 변호사의 스탠다드 구독 활성화"""
    from data import LAWYERS_DB, save_lawyers_db

    lawyer = next((l for l in LAWYERS_DB if l["id"] == req.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다")

    if lawyer.get("is_subscribed") and lawyer.get("trial_ends_at"):
        return {"message": "이미 구독이 활성화되어 있습니다", "already_active": True}

    set_standard_trial(lawyer)
    save_lawyers_db(LAWYERS_DB)

    return {
        "message": "스탠다드 구독이 활성화되었습니다! 14일 무료 체험",
        "trial_ends_at": lawyer["trial_ends_at"],
    }


# --- Auto-Billing Scheduler ---
async def run_auto_billing():
    """
    매일 실행: 체험 종료된 변호사 자동 결제.
    빌링키가 있으면 결제 시도, 없으면 구독 해제.
    """
    from data import LAWYERS_DB, save_lawyers_db

    now = datetime.now()
    charged = 0
    deactivated = 0

    for lawyer in LAWYERS_DB:
        trial_str = lawyer.get("trial_ends_at")
        if not trial_str:
            continue

        try:
            trial_end = datetime.fromisoformat(trial_str)
        except (ValueError, TypeError):
            continue

        # 체험 기간 아직 남음 → skip
        if trial_end > now:
            continue

        billing_key = lawyer.get("billing_key")
        if not billing_key:
            # 빌링키 없음 → 구독 해제
            lawyer["is_subscribed"] = False
            deactivated += 1
            continue

        # 자동 결제 시도
        amount = calculate_amount(lawyer)
        order_id = f"auto_{lawyer['id']}_{now.strftime('%Y%m%d')}"

        try:
            if TOSS_SECRET_KEY.startswith("test_sk_FAKE"):
                # Mock mode - just mark as charged
                pass
            else:
                await toss_charge_billing(
                    billing_key, amount, order_id, lawyer.get("id", "unknown")
                )

            lawyer["is_subscribed"] = True
            lawyer["trial_ends_at"] = None  # 정식 결제로 전환
            charged += 1
        except Exception as e:
            print(f"Auto-billing failed for {lawyer['id']}: {e}")
            lawyer["is_subscribed"] = False
            deactivated += 1

    save_lawyers_db(LAWYERS_DB)
    return {"charged": charged, "deactivated": deactivated}


@router.post("/run-auto-billing")
async def trigger_auto_billing():
    """수동으로 자동 결제 스케줄러 실행 (관리자용 / cron에서 호출)"""
    result = await run_auto_billing()
    return {"message": "자동 결제 처리 완료", **result}
