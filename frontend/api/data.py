from typing import List, Dict
import random
from datetime import datetime, timedelta

def get_random_avatar(gender="male"):
    idx = random.randint(1, 99)
    gender_str = "men" if gender == "male" else "women"
    return f"https://randomuser.me/api/portraits/{gender_str}/{idx}.jpg"


import random

# Constants for generating data
LAST_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "류", "전", "홍", "고", "문", "양", "손", "배", "조", "백", "허", "유", "남", "심", "노", "정", "하", "곽", "성", "차", "주", "우", "구", "신", "임", "나", "전", "민", "유", "진", "지", "엄", "채", "원", "천", "방", "공", "강", "현", "함", "변", "염", "양", "변", "여", "추", "노", "도", "소", "신", "석", "선", "설", "마", "길", "주", "연", "방", "위", "표", "명", "기", "반", "왕", "금", "옥", "육", "인", "맹", "제", "모", "장", "남", "탁", "국", "여", "진", "어", "은", "편", "구", "용"]
FIRST_NAMES = ["민수", "서준", "도윤", "예준", "시우", "하준", "지호", "주원", "준우", "지후", "서연", "서윤", "지우", "서현", "하은", "민서", "지유", "윤서", "채원", "수아", "지민", "지영", "지원", "민지", "현우", "준서", "다은", "예은", "수빈", "소율", "예린", "지아", "채은", "현준", "건우", "우진", "서진", "유준", "정우", "도현", "연우", "하율", "지율", "서우", "유나", "서하", "채아", "다인", "규현", "동현", "승우", "승현", "시후", "시윤", "은우", "시현", "이준", "은성", "준희", "수진", "수민", "수현", "하윤", "주하", "서아", "시아", "아인", "나은", "예담", "예나", "지안", "수연", "나윤", "시은", "서영", "채윤", "수정", "유진", "현지", "민주", "지현", "혜진", "수안", "하린", "도하", "로운", "이안", "선우", "정민", "동하", "율", "리하", "다온", "라온", "하랑", "이솔", "예솔"]

FIRMS = ["법무법인 로날드", "법무법인 태평", "법무법인 광장", "법무법인 세종", "법무법인 율촌", "법무법인 화우", "법무법인 바른", "법무법인 대륙아주", "법무법인 지평", "법무법인 충정", "법무법인 동인", "법무법인 한빛", "법무법인 율전", "법무법인 정의", "법률사무소 승리", "법률사무소 평화", "법률사무소 공정", "법률사무소 정의", "법률사무소 믿음", "개인법률사무소"]

LOCATIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]

EDUCATION_TYPES = ["사법연수원", "법학전문대학원"]
CAREER_TAGS = ["판사 출신", "검사 출신", "대형 로펌 출신", "경찰 간부 출신", "공정위 출신", "금융감독원 출신", "국세청 출신"]

# Official KBA Specializations
OFFICIAL_SPECIALTIES = [
    "형사법 전문", "민사법 전문", "가사법 전문", "행정법 전문", 
    "노동법 전문", "조세법 전문", "지식재산권법 전문", "국제법 전문", 
    "부동산법 전문", "도산법 전문", "의료법 전문", "건설법 전문", 
    "해상법 전문", "중재법 전문"
]

# Case Templates mapped to Official Specializations
# Keys are Official Specializations, Values are list of (Title, Summary)
CASE_TEMPLATES = {
    "형사법 전문": [
        ("강제추행 무죄", "CCTV 사각지대 및 진술의 모순점 파고들어 무죄 입증"),
        ("카메라등이용촬영 기소유예", "초범이고 피해자와 원만히 합의하여 기소유예 처분"),
        ("준강간 혐의없음", "합의하에 이루어진 관계임을 문자 내역 등으로 증명하여 혐의없음"),
        ("통신매체이용음란 무죄", "성적 수치심을 일으킬 목적이 없었음을 법리적으로 주장하여 무죄"),
        ("미성년자 의제강간 감형", "진지한 반성과 피해 회복 노력으로 법정 최저형 선고"),
        ("음주운전 3진 아웃 집행유예", "차량 매각 및 알코올 치료 병행 등으로 재범 방지 의지 보여 집행유예"),
        ("측정거부 무죄", "경찰의 위법한 체포 및 측정 요구 절차 위반 입증하여 무죄"),
        ("음주 뺑소니 감형", "피해자와 합의하고 처벌 불원서 제출하여 실형 면함"),
        ("보이스피싱 현금 수거책 무죄", "구인광고를 보고 단순 아르바이트로 인지했음을 입증하여 무죄"),
        ("보이스피싱 중계기 관리책 집행유예", "범행 가담 기간이 짧고 수익이 적음을 주장하여 집행유예")
    ],
    "가사법 전문": [
        ("재산분할 80% 방어", "특유재산 입증 및 기여도 방어하여 상대방 청구 기각 및 80% 재산 보존"),
        ("친권 양육권 승소", "아빠의 양육 의지 및 보조 양육자 존재 부각하여 엄마를 상대로 양육권 확보"),
        ("황혼이혼 재산분할", "장기간 혼인 생활에 대한 가사 노동 기여도 50% 인정"),
        ("유책배우자 이혼 청구 승소", "축출 이혼이 아님을 입증하고 혼인 파탄의 실질적 원인 규명"),
        ("양육비 일시금 지급 판결", "상대방의 양육비 미지급 우려 소명하여 장래 양육비 일시금 수령"),
        ("면접교섭권 직권 변경", "자녀의 복리를 위해 면접교섭 횟수 및 방법 변경 인용"),
        ("상간녀 위자료 3천만원", "부정행위의 기간, 정도, 고의성을 입증하여 고액 위자료 판결"),
        ("상간남 소송 기각 방어", "기혼 사실을 몰랐음을 문자 내역 등으로 입증하여 원고 청구 기각"),
        ("사실혼 파기 손해배상", "정당한 이유 없는 사실혼 파기에 대한 위자료 및 예물 반환 청구 승소"),
        ("과거 양육비 청구", "이혼 후 10년간 지급받지 못한 과거 양육비 일시 청구 승소")
    ],
    "부동산법 전문": [
        ("전세사기 보증금 반환", "임대인의 기망 행위 입증하여 계약 취소 및 보증금 전액 반환 판결"),
        ("HUG 보증 이행 청구", "보증 사고 요건 충족 입증하여 주택도시보증공사 상대 이행 청구 승소"),
        ("임차권 등기 명령 신청", "이사 후에도 대항력 유지하기 위해 임차권 등기 명령 신속 결정"),
        ("깡통전세 경매 배당", "최우선 변제금 및 확정일자 순위에 따른 배당 이의 소송 승소"),
        ("공인중개사 손해배상", "중개 대상물 확인 설명 의무 위반으로 공인중개사에게 손해배상 청구"),
        ("신탁 부동산 사기 구제", "신탁 원부 미확인 등 과실 비율 다툼 끝에 보증금 일부 회수"),
        ("다가구 주택 선순위 확인", "선순위 임차인 정보 제공 요청 및 배당 순위 다툼"),
        ("전세 대출 연장 거부 대응", "임대인의 협조 의무 위반에 따른 손해배상 청구"),
        ("상가 임대차 권리금 회수", "임대인의 방해 행위 입증하여 권리금 상당 손해배상 승소"),
        ("명도 소송 승소", "차임 연체로 인한 계약 해지 및 건물 인도 완료")
    ],
    "행정법 전문": [
        ("영조물 하자 국가배상", "도로 파손으로 인한 차량 파손에 대해 지자체 관리 소홀 입증하여 배상"),
        ("경찰관 직무집행법 위반", "경찰의 과잉 진압으로 인한 부상에 대해 국가배상 청구 승소"),
        ("군 복무 중 부상", "군 병원의 오진 및 조치 지연으로 인한 악화에 대해 배상 인정"),
        ("공무원 위법 처분 손해배상", "공무원의 고의 과실로 인한 건축 허가 지연 손해 배상"),
        ("영업정지 처분 취소", "미성년자 위조 신분증에 속은 사정 입증하여 행정 처분 취소"),
        ("운전면허 취소 구제", "생계형 운전자임과 혈중알코올농도 수치 오류 주장하여 구제"),
        ("공무원 징계 처분 취소", "징계 사유의 부당성 및 절차적 하자 주장하여 징계 취소"),
        ("국가유공자 등록 거부 취소", "직무상 재해와 질병 사이의 인과관계 입증하여 유공자 인정"),
        ("정보공개 거부 처분 취소", "비공개 대상 정보가 아님을 다투어 정보 공개 판결"),
        ("이행강제금 부과 처분 취소", "위반 건축물이 아님을 소명하여 부과 처분 취소")
    ],
    "민사법 전문": [
        ("대여금 반환 청구", "차용증 없는 금전 거래에서 계좌 내역과 문자를 통해 대여 사실 입증"),
        ("손해배상(기)", "교통사고 후유장해 인정받아 보험사 제시액의 3배 배상 판결"),
        ("계약금 반환 소송", "상대방의 이행 지체로 인한 계약 해제 및 계약금 배액 배상"),
        ("공사 대금 청구", "추가 공사 사실 입증하여 미지급 공사 대금 전액 승소"),
        ("부당이득 반환", "법률상 원인 없는 이득임을 밝혀 부당이득금 반환 판결"),
        ("물품 대금 청구", "거래 명세서 및 인수증 바탕으로 미지급 물품 대금 회수"),
        ("사해행위 취소 소송", "채무자의 재산 빼돌리기 입증하여 증여 계약 취소 및 원상 회복"),
        ("공유물 분할 청구", "협의되지 않는 공유 토지에 대해 경매 분할 판결 이끌어냄"),
        ("유류분 반환 청구", "증여 재산 산정하여 침해된 유류분 반환 승소"),
        ("건물 철거 및 토지 인도", "무단 점유 건물의 철거 및 토지 인도, 부당이득 반환 승소")
    ]
}

def generate_lawyers(count=100):
    random.seed(42) # Ensure deterministic data generation
    lawyers = []
    
    # We only have templates for these 5 major areas for now, so we distribute them.
    # In a real scenario, we would have templates for all 14.
    available_specialties = list(CASE_TEMPLATES.keys())
    
    # Content Templates
    CONTENT_TYPES = ["blog", "column", "book", "lecture"]
    
    CONTENT_TITLES = {
        "가사법 전문": [
            ("이혼 소송, 이것만은 알고 시작하세요", "blog"),
            ("양육비 미지급 해결 가이드", "blog"),
            ("상간녀 위자료 청구의 모든 것", "column"),
            ("행복한 이혼을 위한 법률 가이드", "book"),
            ("가사법 전문 변호사가 말하는 재산분할", "lecture")
        ],
        "형사법 전문": [
            ("성범죄 혐의, 초기 대응이 중요합니다", "blog"),
            ("음주운전 구제 사례 모음", "blog"),
            ("형사 사건의 골든타임", "column"),
            ("억울한 혐의를 벗는 법", "book"),
            ("학교폭력 예방 및 대처 세미나", "lecture")
        ],
        "부동산법 전문": [
            ("전세보증금 반환 소송 절차", "blog"),
            ("부동산 계약 시 필수 확인 사항", "column"),
            ("임대차 3법 완벽 해설", "book"),
            ("재개발 조합원 자격 요건 설명회", "lecture")
        ],
        "민사법 전문": [
            ("채권추심, 합법적으로 돈 받는 법", "blog"),
            ("손해배상 청구 소송의 핵심", "column"),
            ("나홀로 소송 가이드북", "book")
        ],
        "행정법 전문": [
            ("영업정지 처분 취소 소송 사례", "blog"),
            ("음주운전 면허취소 구제 전략", "column")
        ]
    }

    for i in range(count):
        # Pick a specialization
        specialty = available_specialties[i % len(available_specialties)]
        
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{last}{first}"
        firm = random.choice(FIRMS)
        location = random.choice(LOCATIONS)
        career_years = random.randint(3, 30)
        
        education = random.choice(EDUCATION_TYPES)
        # Randomly assign 0-2 career tags
        if random.random() < 0.3:
            career_tags = []
        else:
            career_tags = random.sample(CAREER_TAGS, k=random.randint(1, 2))

        # Generate cases
        lawyer_cases = []
        case_pool = CASE_TEMPLATES[specialty]
        
        # Pick 10 random cases
        for _ in range(10):
            case_template = random.choice(case_pool)
            lawyer_cases.append({
                "title": case_template[0],
                "summary": case_template[1]
            })

        # Generate Content Items (Random 0~5 items)
        content_items = []
        if specialty in CONTENT_TITLES:
            possible_contents = CONTENT_TITLES[specialty]
            num_contents = random.choices([0, 1, 3, 5], weights=[0.4, 0.3, 0.2, 0.1])[0]
            
            for _ in range(num_contents):
                content_template = random.choice(possible_contents)
                title = content_template[0]
                type_ = content_template[1]
                
                # Context-aware mock content
                intro = f"안녕하세요. 법무법인 {firm}의 {name} 변호사입니다.\n오늘은 '{title}'에 대해 많은 분들이 궁금해하시는 점을 정리해드리고자 합니다."
                
                body = ""
                if type_ == "case":
                    body = f"이번 사건은 의뢰인이 억울하게 휘말린 사례였습니다.\n치밀한 법리 분석과 증거 수집 끝에 재판부의 무죄 판결을 이끌어낼 수 있었습니다.\n특히 초기 상담 단계부터 신속하게 대응했던 것이 주효했습니다."
                else:
                    body = f"법적 분쟁은 예방이 최선입니다.\n하지만 이미 분쟁이 발생했다면, 전문가의 조언을 통해 신속하게 대응하는 것이 중요합니다.\n관련 법령과 최신 판례를 꼼꼼히 검토하여 최선의 해결책을 찾아야 합니다."
                
                conclusion = f"\n본 사안과 관련하여 더 궁금한 점이 있으시거나 법률적 조력이 필요하시다면 언제든지 문의주시기 바랍니다.\n의뢰인의 권익 보호를 위해 {firm}이 함께하겠습니다."
                
                full_content = f"{intro}\n\n{body}\n\n{conclusion}"
                
                summary = ""
                if type_ == "case":
                    summary = f"이번 승소 사례는 초기 대응의 중요성을 잘 보여주는 사건입니다. 명확한 증거 수집과 법리적 다툼 끝에 의뢰인이 원하는 결과를 얻을 수 있었습니다."
                else:
                    summary = f"본 칼럼에서는 {title}와 관련된 핵심 법리 및 실무적 유의사항을 다룹니다. 복잡한 법률 문제를 알기 쉽게 풀이하여 실질적인 도움을 드리고자 합니다."

                from seo import seo_generator  # type: ignore
                
                # SEO Generation
                slug = seo_generator.generate_slug(title)
                seo_title = seo_generator.generate_seo_title(title, name, type_)
                seo_desc = seo_generator.generate_meta_description(full_content, summary)
                
                content_items.append({
                    "id": f"content-{random.randint(1000, 9999)}",
                    "type": type_,
                    "title": title,
                    "slug": slug,
                    "seo_title": seo_title,
                    "seo_description": seo_desc,
                    "content": full_content,
                    "summary": summary,
                    "topic_tags": [specialty.replace(" 전문", "")], # e.g., "가사법"
                    "verified": True, # For now, assume generated ones are verified
                    "date": "2025-01-01", # Dummy recent date
                    "url": "https://example.com"
                })

        lawyers.append({
            "id": f"lawyer-{i+1}",
            "imageUrl": None,
            "name": name,
            "firm": firm,
            "location": location,
            # IMPORTANT: Use official qualification name here
            "career": f"경력 {career_years}년, {specialty}", 
            "education": education,
            "careerTags": career_tags,
            "expertise": [specialty], # This helps with filtering
            "cases": lawyer_cases,
            "content_items": content_items,
            "phone": f"010-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
            "homepage": f"https://lawfirm-{i}.com",
            "kakao_id": f"lawyer_{random.randint(100,999)}",
            "last_login": (datetime.now() - timedelta(days=random.randint(0, 60))).strftime("%Y-%m-%d %H:%M:%S")
        })
    return lawyers

import json
import os

_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(_DIR, "lawyers_db.json")

def _load_from_supabase():
    """Supabase에서 변호사 데이터를 로드합니다."""
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb is None:
            return None
        
        response = sb.table("lawyers").select("*").execute()
        if response.data:
            lawyers = []
            for row in response.data:
                lawyer = row.get("data", {})
                lawyer["id"] = row["id"]
                lawyer["is_mock"] = row.get("is_mock", False)
                lawyer["verified"] = row.get("verified", False)
                lawyers.append(lawyer)
            print(f"✅ Supabase에서 변호사 {len(lawyers)}명 로드 완료")
            return lawyers
        else:
            print("📭 Supabase 테이블이 비어 있습니다")
            return []
    except Exception as e:
        print(f"⚠️ Supabase 로드 실패: {e}")
        return None


def _save_to_supabase(db):
    """변호사 데이터를 Supabase에 upsert합니다."""
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb is None:
            return False
        
        from datetime import datetime as _dt
        now = _dt.now().isoformat()
        
        rows = []
        for lawyer in db:
            rows.append({
                "id": lawyer["id"],
                "data": lawyer,
                "is_mock": lawyer.get("is_mock", False),
                "verified": lawyer.get("verified", False),
                "updated_at": now,
            })
        
        if rows:
            sb.table("lawyers").upsert(rows, on_conflict="id").execute()
            print(f"✅ Supabase에 {len(rows)}명 저장/업데이트 완료")
        return True
    except Exception as e:
        print(f"⚠️ Supabase 저장 실패: {e}")
        return False


def _filter_real_lawyers(lawyers):
    """is_mock=True인 가상 변호사를 필터링합니다."""
    import re
    real = []
    mock_count = 0
    for lawyer in lawyers:
        is_mock = lawyer.get("is_mock", False)
        if not is_mock and not re.match(r'^lawyer-\d+$', lawyer.get("id", "")):
            real.append(lawyer)
        else:
            mock_count += 1  # type: ignore
    if mock_count > 0:
        print(f"🗑️ 가상 변호사 {mock_count}명 필터링 완료 (실제 {len(real)}명 유지)")
    return real


# --- SEED USER (Kim Won-young) ---
_KIM_WON_YOUNG_SEED = {
    "id": "welder49264@naver.com",
    "name": "김원영 변호사",
    "email": "welder49264@naver.com",
    "password": "password",
    "role": "lawyer",
    "firm": "법무법인 맥디",
    "location": "서울 서초구",
    "career": "경력 15년, 형사법 전문",
    "education": "서울대학교 법학전문대학원 졸업",
    "careerTags": ["대형 로펌 출신", "검사 출신"],
    "expertise": ["형사법 전문", "성범죄", "교통사고"],
    "cases": [
        {"title": "보이스피싱 현금 수거책 무죄", "summary": "구인광고를 보고 단순 아르바이트로 인지했음을 입증하여 무죄 판결을 이끌어냈습니다."},
        {"title": "강제추행 기소유예 처분", "summary": "피해자와의 원만한 합의를 이끌어내고 기소유예 처분을 받았습니다."},
        {"title": "음주운전 집행유예 방어", "summary": "구체적인 재범 방지 대책을 제시하여 집행유예를 선고받았습니다."}
    ],
    "content_items": [],
    "phone": "010-1234-5678",
    "homepage": "https://macdee.co.kr",
    "kakao_id": "won_lawyer",
    "verified": True,
    "is_mock": False,
    "imageUrl": "/lawyers/lawyer_male_1_1770727915967.png",
    "bgRemoveStatus": "done",
    "gender": "Male",
    "is_subscribed": True,
    "is_founder": True,
    "subscription_plan": "lifetime_free",
    "blog_theme": {"primaryColor": "#0F172A", "secondaryColor": "#E2E8F0", "accentColor": "#3B82F6"},
    "blog_content": {
        "hero_description": "의뢰인의 삶을 지키는 법률 서비스,<br/><strong>김원영</strong>이 함께하겠습니다.",
        "consultation_title": "무료 법률 상담",
        "consultation_message": "복잡한 법률 문제,<br/>전문가와 직접 이야기하세요."
    }
}


def load_lawyers_db():
    # 1. Supabase 시도 (프로덕션)
    supabase_lawyers = _load_from_supabase()
    if supabase_lawyers is not None and len(supabase_lawyers) > 0:
        real_lawyers = _filter_real_lawyers(supabase_lawyers)
        if len(real_lawyers) < len(supabase_lawyers):
            save_lawyers_db(real_lawyers)
        return real_lawyers

    # 2. JSON 파일 폴백 (로컬 개발)
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                print(f"Loading DB from {DB_FILE}")
                lawyers = json.load(f)
                real_lawyers = _filter_real_lawyers(lawyers)
                if len(real_lawyers) < len(lawyers):
                    save_lawyers_db(real_lawyers)
                if supabase_lawyers is not None and len(supabase_lawyers) == 0 and real_lawyers:
                    print("📤 JSON → Supabase 초기 시드 업로드 시작...")
                    _save_to_supabase(real_lawyers)
                return real_lawyers
        except Exception as e:
            print(f"Failed to load DB: {e}. Starting fresh.")

    # 3. 데이터가 없으면 시드 유저만 생성
    print("📋 DB 없음 → 시드 유저(김원영)만 생성")
    lawyers = [_KIM_WON_YOUNG_SEED.copy()]
    save_lawyers_db(lawyers)
    return lawyers

def save_lawyers_db(db):
    # 1. JSON 파일 저장 (로컬 캐시)
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
        print("DB Saved (JSON)")
    except Exception as e:
        print(f"JSON 저장 실패 (서버리스 환경에서는 정상): {e}")
    
    # 2. Supabase에도 저장 (프로덕션용)
    _save_to_supabase(db)

LAWYERS_DB = load_lawyers_db()

# Local images map
LOCAL_IMAGES = {
    "Male": [
        "/lawyers/lawyer_male_1_1770727915967.png",
        "/lawyers/lawyer_male_2_1770727949695.png",
        "/lawyers/lawyer_male_senior_1770728016740.png"
    ],
    "Female": [
        "/lawyers/lawyer_female_1_1770727931596.png",
        "/lawyers/lawyer_female_2_1770727964339.png",
        "/lawyers/lawyer_female_senior_1770728034922.png"
    ]
}

# Assign random avatars and ensure essential fields exist
updated = False
for i, lawyer in enumerate(LAWYERS_DB):
    # 1. Backfill Image
    if not lawyer.get("imageUrl"):
        is_female = random.choice([True, False])
        gender = "Female" if is_female else "Male"
        lawyer["gender"] = gender
        images_pool = LOCAL_IMAGES[gender]
        lawyer["imageUrl"] = images_pool[i % len(images_pool)]
        updated = True

    # 2. Backfill Kakao ID
    if not lawyer.get("kakao_id"):
        lawyer["kakao_id"] = f"lawyer_{random.randint(100, 999)}"
        updated = True

    # 3. Backfill Homepage
    if not lawyer.get("homepage"):
        lawyer["homepage"] = f"https://lawfirm-{i}.com"
        updated = True

    # 4. Backfill Cases (if empty)
    if not lawyer.get("cases"):
        # Borrow from templates based on their expertise or random if not found
        specialty = lawyer.get("expertise", ["형사법 전문"])[0]
        # Fallback if specialty not in templates
        template_key = specialty if specialty in CASE_TEMPLATES else random.choice(list(CASE_TEMPLATES.keys()))
        
        # Pick 3 random cases
        case_pool = CASE_TEMPLATES[template_key]
        lawyer["cases"] = []
        for _ in range(3):
            case_template = random.choice(case_pool)
            lawyer["cases"].append({
                "title": case_template[0],
                "summary": case_template[1]
            })
        updated = True

if updated:
    print("Backfilled missing data for lawyers.")
    save_lawyers_db(LAWYERS_DB)

