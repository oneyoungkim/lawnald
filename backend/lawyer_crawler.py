"""
변호사 이메일 수집 크롤러 v2
- 대한변호사협회 회원 검색
- 네이버 블로그: mainFrame 내부 본문 + 법률 키워드 전략
- 유튜브: Description/고정 댓글 + 구독자 수 기반 우선순위
- 키워드별 자동 태깅 (#전세사기, #이혼 등)
- Anti-blocking: time.sleep, User-Agent 로테이션, 재시도 로직
"""
import json
import os
import re
import time
import random
import hashlib
from datetime import datetime, date
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup

# ── 설정 ──────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "lawyer_contacts_db.json")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
]

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# ── 법률 분야별 키워드 맵 ─────────────────────────────
LEGAL_KEYWORDS = {
    "이혼": ["이혼 변호사", "이혼소송 변호사", "양육권 변호사", "재산분할 변호사", "협의이혼 변호사", "위자료 변호사"],
    "전세사기": ["전세사기 변호사", "전세보증금 변호사", "임대차 변호사", "전세 피해 변호사", "보증금 반환 변호사"],
    "형사": ["형사 변호사", "성범죄 변호사", "음주운전 변호사", "폭행 변호사", "사기죄 변호사", "마약 변호사"],
    "부동산": ["부동산 변호사", "명도소송 변호사", "부동산 분쟁 변호사", "건축 변호사", "재개발 변호사"],
    "상속": ["상속 변호사", "유산 분쟁 변호사", "상속세 변호사", "유언장 변호사", "상속포기 변호사"],
    "노동": ["노동 변호사", "부당해고 변호사", "임금체불 변호사", "근로계약 변호사", "산재 변호사"],
    "교통사고": ["교통사고 변호사", "교통사고 합의 변호사", "자동차 사고 변호사", "뺑소니 변호사"],
    "의료": ["의료사고 변호사", "의료과실 변호사", "의료분쟁 변호사", "의료소송 변호사"],
    "민사": ["민사소송 변호사", "손해배상 변호사", "채권추심 변호사", "민사 분쟁 변호사"],
    "기업": ["기업 법무 변호사", "법인 변호사", "기업 소송 변호사", "계약서 검토 변호사", "스타트업 변호사"],
}

# 이메일 제외 도메인 (gmail.com은 제외하지 않음 — 많은 변호사가 Gmail 사용)
EXCLUDED_EMAIL_DOMAINS = [
    "noreply", "example.com", "navercorp", "naver.com",
    "google.com", "youtube.com", "daum.net",
    "hanmail.net", "kakao.com", "test.com"
]

# 전화번호 추출 정규식
PHONE_REGEX = re.compile(r"(0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4})")


# ── 유틸리티 ──────────────────────────────────────────
def _random_sleep(min_sec: float = 3.0, max_sec: float = 7.0):
    """차단 방지를 위한 랜덤 딜레이"""
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)
    return delay


def _get_headers() -> dict:
    """랜덤 User-Agent 헤더 반환"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }


def _safe_request(url: str, method: str = "GET", max_retries: int = 3, **kwargs) -> Optional[requests.Response]:
    """백오프 재시도가 포함된 안전한 HTTP 요청"""
    for attempt in range(max_retries):
        try:
            headers = _get_headers()
            if "headers" in kwargs:
                headers.update(kwargs.pop("headers"))
            resp = requests.request(method, url, headers=headers, timeout=15, **kwargs)
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as e:
            wait = (attempt + 1) * 5 + random.uniform(1, 3)
            print(f"  [재시도 {attempt+1}/{max_retries}] {e} → {wait:.1f}초 대기")
            time.sleep(wait)
    return None


def _generate_id(name: str, email: str) -> str:
    raw = f"{name}_{email}".lower()
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def _is_valid_lawyer_email(email: str) -> bool:
    """변호사 업무용으로 보이는 이메일인지 판단"""
    lower = email.lower()
    for excluded in EXCLUDED_EMAIL_DOMAINS:
        if excluded in lower:
            return False
    # 너무 짧은 이메일 제외 (spam 방지)
    if len(lower) < 5:
        return False
    return True


def _ensure_lawyer_keyword(keyword: str) -> str:
    """키워드에 '변호사'가 포함되어 있지 않으면 자동 추가"""
    if "변호사" not in keyword and "법무" not in keyword and "로펌" not in keyword:
        return f"{keyword} 변호사"
    return keyword


def _format_subscribers(count: int) -> str:
    """구독자 수 포맷팅"""
    if count >= 10000:
        return f"{count // 10000}만"
    elif count >= 1000:
        return f"{count // 1000}천"
    return str(count)


# ── DB 관리 ───────────────────────────────────────────
def load_contacts() -> List[Dict]:
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def save_contacts(contacts: List[Dict]):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(contacts, f, ensure_ascii=False, indent=2)


def add_contacts(new_contacts: List[Dict]) -> dict:
    """중복 제거 후 연락처 추가, 통계 반환"""
    existing = load_contacts()
    existing_emails = {c["email"].lower() for c in existing if c.get("email")}

    added = 0
    skipped = 0
    for contact in new_contacts:
        email = contact.get("email", "").lower().strip()
        if not email or email in existing_emails:
            skipped += 1
            continue
        contact["id"] = _generate_id(contact.get("name", ""), email)
        contact["collected_at"] = datetime.now().isoformat()
        existing.append(contact)
        existing_emails.add(email)
        added += 1

    save_contacts(existing)
    return {"added": added, "skipped": skipped, "total": len(existing)}


def get_today_count() -> int:
    """오늘 수집된 연락처 수"""
    contacts = load_contacts()
    today_str = date.today().isoformat()
    return sum(1 for c in contacts if c.get("collected_at", "").startswith(today_str))


# ── 크롤러: 대한변호사협회 ──────────────────────────────
class KoreanBarCrawler:
    """대한변호사협회(koreanbar.or.kr) 변호사 검색 크롤러"""
    BASE_URL = "https://www.koreanbar.or.kr"
    SEARCH_URL = f"{BASE_URL}/pages/search/EmpSchPage.aspx"

    def crawl(self, max_pages: int = 5, keyword: str = "", tags: Optional[List[str]] = None) -> List[Dict]:
        results = []
        print(f"\n{'='*50}")
        print(f"[대한변협 크롤러] 시작 (max_pages={max_pages}, keyword='{keyword}')")
        print(f"{'='*50}")

        for page in range(1, max_pages + 1):
            print(f"\n  📄 페이지 {page}/{max_pages} 수집 중...")
            delay = _random_sleep(3.0, 7.0)
            print(f"  ⏳ {delay:.1f}초 딜레이 적용")

            try:
                params = {"page": page}
                if keyword:
                    params["searchWord"] = keyword

                resp = _safe_request(self.SEARCH_URL, params=params)
                if not resp:
                    print(f"  ❌ 페이지 {page} 요청 실패, 건너뜀")
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")
                rows = soup.select("table.list_table tbody tr")
                if not rows:
                    rows = soup.select(".search_result .item")
                if not rows:
                    rows = soup.select("table tr")

                page_count = 0
                for row in rows:
                    contact = self._parse_row(row)
                    if contact and contact.get("email"):
                        contact["source"] = "대한변호사협회"
                        contact["tags"] = tags or []
                        results.append(contact)
                        page_count += 1

                print(f"  ✅ 페이지 {page}: {page_count}건 수집")
                if page_count == 0 and page > 1:
                    break

            except Exception as e:
                print(f"  ❌ 페이지 {page} 오류: {e}")
                continue

        print(f"\n[대한변협 크롤러] 완료: 총 {len(results)}건 수집")
        return results

    def _parse_row(self, row) -> Optional[Dict]:
        try:
            cells = row.find_all("td")
            if len(cells) < 2:
                return None

            text = row.get_text(" ", strip=True)
            emails = EMAIL_REGEX.findall(text)
            if not emails:
                mailto = row.find("a", href=re.compile(r"^mailto:"))
                if mailto:
                    email_match = EMAIL_REGEX.search(mailto["href"])
                    if email_match:
                        emails = [email_match.group()]
            if not emails:
                return None

            name_el = row.find("strong") or row.find("a") or cells[0]
            name = name_el.get_text(strip=True) if name_el else ""
            firm_el = row.find(class_=re.compile(r"firm|office|belong")) or (cells[1] if len(cells) > 1 else None)
            firm = firm_el.get_text(strip=True) if firm_el else ""

            return {"name": name, "firm": firm, "email": emails[0]}
        except Exception:
            return None


# ── 크롤러: 네이버 블로그 (mainFrame 전략) ──────────────
class NaverBlogCrawler:
    """
    네이버 블로그 크롤러 v2
    - 법률 분야별 키워드로 네이버 블로그 검색
    - 각 블로그의 mainFrame(PostView) 내부 본문 직접 접근
    - 하단 연락처 섹션에서 @ 포함 이메일 주소 수집
    - 검색 키워드 기반 자동 태깅
    """
    SEARCH_URL = "https://search.naver.com/search.naver"

    def crawl(self, keywords: Optional[List[str]] = None,
              max_results_per_keyword: int = 10,
              legal_categories: Optional[List[str]] = None) -> List[Dict]:
        results = []

        # 카테고리별 키워드 or 직접 키워드 사용
        if legal_categories:
            keyword_map = {}
            for cat in legal_categories:
                if cat in LEGAL_KEYWORDS:
                    for kw in LEGAL_KEYWORDS[cat]:
                        keyword_map[kw] = cat
            search_items = list(keyword_map.items())
        elif keywords:
            # 사용자 키워드에 '변호사' 자동 추가
            search_items = [(_ensure_lawyer_keyword(kw), kw) for kw in keywords]
        else:
            # 기본: 모든 법률 카테고리
            keyword_map = {}
            for cat, kws in LEGAL_KEYWORDS.items():
                for kw in kws[:2]:  # 카테고리당 2개 키워드
                    keyword_map[kw] = cat
            search_items = list(keyword_map.items())

        print(f"\n{'='*50}")
        print(f"[네이버 블로그 크롤러 v2] 시작 ({len(search_items)}개 키워드)")
        print(f"{'='*50}")

        for idx, (keyword, tag) in enumerate(search_items, 1):
            print(f"\n  🔍 [{idx}/{len(search_items)}] 키워드: '{keyword}' → 태그: #{tag}")

            delay = _random_sleep(4.0, 8.0)
            print(f"  ⏳ {delay:.1f}초 딜레이 적용")

            try:
                # 네이버 블로그 탭 검색
                params = {
                    "where": "blog",
                    "query": keyword,
                    "sm": "tab_opt",
                    "nso": "",
                }
                resp = _safe_request(self.SEARCH_URL, params=params)
                if not resp:
                    print(f"  ❌ 검색 실패, 건너뜀")
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")

                # 블로그 포스트 링크 추출 (다양한 셀렉터 시도)
                blog_links = []
                # 셀렉터 1: 일반적인 네이버 블로그 검색 결과
                for a_tag in soup.select("a.api_txt_lines.total_tit"):
                    href = a_tag.get("href", "")
                    if href and "blog.naver.com" in href:
                        blog_links.append(href)

                # 셀렉터 2: 대체 구조
                if not blog_links:
                    for a_tag in soup.select(".total_wrap a[href*='blog.naver.com']"):
                        href = a_tag.get("href", "")
                        if href:
                            blog_links.append(href)

                # 셀렉터 3: 더 넓은 범위 - 모든 네이버 블로그 링크
                if not blog_links:
                    for a_tag in soup.find_all("a", href=True):
                        href = a_tag["href"]
                        if "blog.naver.com" in href and href not in blog_links:
                            blog_links.append(href)

                # 중복 제거 및 제한
                blog_links = list(dict.fromkeys(blog_links))[:max_results_per_keyword]
                print(f"  📋 블로그 링크 {len(blog_links)}개 발견")

                for link in blog_links:
                    delay = _random_sleep(3.0, 6.0)
                    contact = self._extract_from_blog_mainframe(link)
                    if contact and contact.get("email"):
                        contact["source"] = "네이버 블로그"
                        contact["source_url"] = link
                        contact["tags"] = [tag]
                        contact["search_keyword"] = keyword
                        results.append(contact)
                        print(f"    ✅ 수집: {contact['name']} ({contact['email']}) #{tag}")
                    else:
                        print(f"    ⬜ 이메일 미발견: {link[:50]}...")

            except Exception as e:
                print(f"  ❌ 키워드 '{keyword}' 오류: {e}")
                continue

        print(f"\n[네이버 블로그 크롤러 v2] 완료: 총 {len(results)}건 수집")
        return results

    def _extract_from_blog_mainframe(self, url: str) -> Optional[Dict]:
        """
        네이버 블로그 mainFrame(PostView) 내부 본문을 직접 접근하여 이메일 추출.
        네이버 블로그는 iframe 구조 → PostView.naver URL로 직접 접근.
        """
        try:
            # URL에서 blogId와 logNo 추출
            blog_id = None
            log_no = None

            # https://blog.naver.com/blogId/logNo 패턴
            match = re.search(r"blog\.naver\.com/([^/?]+)/(\d+)", url)
            if match:
                blog_id = match.group(1)
                log_no = match.group(2)

            if not blog_id or not log_no:
                # 모바일 URL 시도
                match = re.search(r"m\.blog\.naver\.com/([^/?]+)/(\d+)", url)
                if match:
                    blog_id = match.group(1)
                    log_no = match.group(2)

            if blog_id and log_no:
                # mainFrame(PostView) 직접 접근
                post_url = f"https://blog.naver.com/PostView.naver?blogId={blog_id}&logNo={log_no}"
                resp = _safe_request(post_url)
            else:
                # fallback: 모바일 버전
                mobile_url = url.replace("blog.naver.com", "m.blog.naver.com")
                resp = _safe_request(mobile_url)

            if not resp:
                return None

            soup = BeautifulSoup(resp.text, "html.parser")

            # mainFrame 본문 영역 선택 (여러 셀렉터 시도)
            content_area = (
                soup.select_one(".se-main-container") or      # SmartEditor 3
                soup.select_one("#postViewArea") or            # PostView
                soup.select_one(".post-view") or               # 모바일
                soup.select_one("#post-view") or
                soup
            )

            text = content_area.get_text(" ", strip=True) if content_area else ""

            # 전체 페이지 텍스트도 보조 사용
            full_text = soup.get_text(" ", strip=True)

            # 이메일 추출 (본문 + 전체에서)
            emails_body = EMAIL_REGEX.findall(text)
            emails_full = EMAIL_REGEX.findall(full_text)
            all_emails = list(dict.fromkeys(emails_body + emails_full))  # 순서 유지 중복 제거

            # 유효한 변호사 이메일만 필터
            valid_emails = [e for e in all_emails if _is_valid_lawyer_email(e)]

            if not valid_emails:
                return None

            # 변호사 이름 추출
            name = ""
            name_match = re.search(r"([가-힣]{2,4})\s*변호사", text) or re.search(r"([가-힣]{2,4})\s*변호사", full_text)
            if name_match:
                name = name_match.group(1)

            # 법무법인/법률사무소 추출
            firm = ""
            firm_match = re.search(r"(법무법인|법률사무소|로펌)\s*[가-힣\w]{1,10}", text) or \
                         re.search(r"(법무법인|법률사무소|로펌)\s*[가-힣\w]{1,10}", full_text)
            if firm_match:
                firm = firm_match.group(0)

            # 전화번호 추출 (보조 연락처)
            phone = ""
            phone_match = PHONE_REGEX.search(text) or PHONE_REGEX.search(full_text)
            if phone_match:
                phone = phone_match.group(1)

            # 블로그 제목에서 보완
            title_el = soup.find("title")
            if title_el and not name:
                title_text = title_el.get_text(strip=True)
                title_name = re.search(r"([가-힣]{2,4})\s*변호사", title_text)
                if title_name:
                    name = title_name.group(1)

            result = {
                "name": name or "미확인",
                "firm": firm,
                "email": valid_emails[0],
            }
            if phone:
                result["phone"] = phone
            return result

        except Exception:
            return None


# ── 크롤러: 유튜브 ────────────────────────────────────
class YouTubeCrawler:
    """
    유튜브 법률 채널 크롤러
    - 법률 키워드로 영상 검색
    - 영상 Description(설명란) + 고정 댓글에서 이메일 추출
    - 채널 구독자 수 수집 → 영향력 기반 우선순위
    - 키워드별 자동 태깅
    """
    SEARCH_URL = "https://www.youtube.com/results"

    def crawl(self, keywords: Optional[List[str]] = None,
              max_results_per_keyword: int = 10,
              legal_categories: Optional[List[str]] = None) -> List[Dict]:
        results = []

        # 키워드 준비
        if legal_categories:
            keyword_map = {}
            for cat in legal_categories:
                if cat in LEGAL_KEYWORDS:
                    for kw in LEGAL_KEYWORDS[cat]:
                        keyword_map[kw] = cat
            search_items = list(keyword_map.items())
        elif keywords:
            # 사용자 키워드에 '변호사' 자동 추가
            search_items = [(_ensure_lawyer_keyword(kw), kw) for kw in keywords]
        else:
            keyword_map = {}
            for cat, kws in LEGAL_KEYWORDS.items():
                keyword_map[kws[0]] = cat  # 카테고리당 1개
            search_items = list(keyword_map.items())

        print(f"\n{'='*50}")
        print(f"[유튜브 크롤러] 시작 ({len(search_items)}개 키워드)")
        print(f"{'='*50}")

        seen_channels = set()

        for idx, (keyword, tag) in enumerate(search_items, 1):
            print(f"\n  🎬 [{idx}/{len(search_items)}] 키워드: '{keyword}' → 태그: #{tag}")

            delay = _random_sleep(4.0, 8.0)
            print(f"  ⏳ {delay:.1f}초 딜레이 적용")

            try:
                # 유튜브 검색
                params = {"search_query": keyword}
                resp = _safe_request(self.SEARCH_URL, params=params)
                if not resp:
                    print(f"  ❌ 검색 실패, 건너뜀")
                    continue

                # 유튜브 검색결과에서 영상 ID 추출 (HTML에서 파싱)
                video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', resp.text)
                video_ids = list(dict.fromkeys(video_ids))[:max_results_per_keyword]
                print(f"  📋 영상 {len(video_ids)}개 발견")

                for vid in video_ids:
                    delay = _random_sleep(3.0, 6.0)
                    contact = self._extract_from_video(vid, tag)
                    if contact and contact.get("email"):
                        # 채널 중복 방지
                        channel_key = contact.get("youtube_channel", "")
                        if channel_key and channel_key in seen_channels:
                            print(f"    ⬜ 이미 수집된 채널: {channel_key}")
                            continue
                        if channel_key:
                            seen_channels.add(channel_key)

                        contact["source"] = "유튜브"
                        contact["source_url"] = f"https://youtube.com/watch?v={vid}"
                        # 기존 태그에 추가
                        existing_tags = contact.get("tags", [])
                        if tag not in existing_tags:
                            existing_tags.append(tag)
                        contact["tags"] = existing_tags
                        contact["search_keyword"] = keyword
                        results.append(contact)

                        subs_str = _format_subscribers(contact.get("subscribers", 0))
                        print(f"    ✅ 수집: {contact['name']} ({contact['email']}) 구독자:{subs_str} #{tag}")
                    else:
                        print(f"    ⬜ 이메일 미발견: /watch?v={vid}")

            except Exception as e:
                print(f"  ❌ 키워드 '{keyword}' 오류: {e}")
                continue

        # 구독자 수 기준 내림차순 정렬
        results.sort(key=lambda x: x.get("subscribers", 0), reverse=True)
        print(f"\n[유튜브 크롤러] 완료: 총 {len(results)}건 수집 (구독자 수 기준 정렬)")
        return results

    def _extract_from_video(self, video_id: str, tag: str = "") -> Optional[Dict]:
        """영상의 Description + 고정 댓글에서 변호사 이메일 추출"""
        try:
            # 영상 페이지 접근
            url = f"https://www.youtube.com/watch?v={video_id}"
            resp = _safe_request(url)
            if not resp:
                return None

            html = resp.text

            # ── Description 추출 (JSON-LD / ytInitialData) ──
            description = ""
            # ytInitialData에서 description 추출
            desc_match = re.search(r'"shortDescription":"(.*?)"', html)
            if desc_match:
                description = desc_match.group(1).replace("\\n", "\n").replace("\\t", " ")

            # ── 채널 정보 추출 ──
            channel_name = ""
            channel_match = re.search(r'"ownerChannelName":"(.*?)"', html)
            if channel_match:
                channel_name = channel_match.group(1)

            # ── 구독자 수 추출 ──
            subscribers = 0
            sub_match = re.search(r'"subscriberCountText":\{"simpleText":"구독자\s*([0-9,.]+)(만|천)?명', html)
            if sub_match:
                num_str = sub_match.group(1).replace(",", "")
                unit = sub_match.group(2) or ""
                try:
                    num = float(num_str)
                    if unit == "만":
                        subscribers = int(num * 10000)
                    elif unit == "천":
                        subscribers = int(num * 1000)
                    else:
                        subscribers = int(num)
                except ValueError:
                    subscribers = 0

            if not sub_match:
                # 대체 패턴
                sub_match2 = re.search(r'"subscriberCountText":\{"simpleText":"([\d.]+)(만|천)?', html)
                if sub_match2:
                    try:
                        num = float(sub_match2.group(1))
                        unit = sub_match2.group(2) or ""
                        if unit == "만":
                            subscribers = int(num * 10000)
                        elif unit == "천":
                            subscribers = int(num * 1000)
                        else:
                            subscribers = int(num)
                    except ValueError:
                        pass

            # ── 고정 댓글 텍스트 추출 시도 ──
            pinned_comment = ""
            pinned_match = re.search(r'"pinnedCommentRenderer".*?"text":\{"runs":\[\{"text":"(.*?)"\}', html)
            if pinned_match:
                pinned_comment = pinned_match.group(1).replace("\\n", "\n")

            # ── 이메일 추출 (description + 고정 댓글) ──
            combined_text = f"{description}\n{pinned_comment}"
            all_emails = EMAIL_REGEX.findall(combined_text)
            valid_emails = [e for e in all_emails if _is_valid_lawyer_email(e)]

            if not valid_emails:
                return None

            # 변호사 이름 추출
            name = ""
            name_match = re.search(r"([가-힣]{2,4})\s*변호사", combined_text)
            if name_match:
                name = name_match.group(1)
            elif channel_name:
                # 채널명에서 추출 시도
                ch_name_match = re.search(r"([가-힣]{2,4})\s*변호사", channel_name)
                if ch_name_match:
                    name = ch_name_match.group(1)

            # 법무법인 추출
            firm = ""
            firm_match = re.search(r"(법무법인|법률사무소|로펌)\s*[가-힣\w]{1,10}", combined_text)
            if firm_match:
                firm = firm_match.group(0)

            return {
                "name": name or channel_name or "미확인",
                "firm": firm,
                "email": valid_emails[0],
                "youtube_channel": channel_name,
                "subscribers": subscribers,
                "subscribers_display": _format_subscribers(subscribers),
                "tags": [],
            }

        except Exception:
            return None


# ── 포털(법률 포탈) 크롤러 ────────────────────────────
class LegalPortalCrawler:
    """법률 포털 사이트에서 공개된 변호사 이메일을 수집"""
    LAWTALK_URL = "https://www.lawtalk.co.kr"

    def crawl(self, max_pages: int = 3, tags: Optional[List[str]] = None) -> List[Dict]:
        results = []
        print(f"\n{'='*50}")
        print(f"[법률 포털 크롤러] 시작 (max_pages={max_pages})")
        print(f"{'='*50}")

        for page in range(1, max_pages + 1):
            print(f"\n  📄 페이지 {page}/{max_pages} 수집 중...")
            delay = _random_sleep(4.0, 8.0)
            print(f"  ⏳ {delay:.1f}초 딜레이 적용")

            try:
                url = f"{self.LAWTALK_URL}/lawyers?page={page}"
                resp = _safe_request(url)
                if not resp:
                    print(f"  ❌ 페이지 {page} 요청 실패")
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")
                profile_links = []
                for a_tag in soup.select("a[href*='/lawyers/']"):
                    href = a_tag.get("href", "")
                    if href and "/lawyers/" in href:
                        full_url = self.LAWTALK_URL + href if href.startswith("/") else href
                        if full_url not in profile_links:
                            profile_links.append(full_url)

                profile_links = profile_links[:10]
                print(f"  📋 프로필 {len(profile_links)}개 발견")

                for link in profile_links:
                    delay = _random_sleep(3.0, 6.0)
                    contact = self._extract_from_profile(link)
                    if contact and contact.get("email"):
                        contact["source"] = "법률 포털"
                        contact["source_url"] = link
                        contact["tags"] = tags or []
                        results.append(contact)
                        print(f"    ✅ 수집: {contact['name']} ({contact['email']})")

            except Exception as e:
                print(f"  ❌ 오류: {e}")
                continue

        print(f"\n[법률 포털 크롤러] 완료: 총 {len(results)}건 수집")
        return results

    def _extract_from_profile(self, url: str) -> Optional[Dict]:
        try:
            resp = _safe_request(url)
            if not resp:
                return None
            soup = BeautifulSoup(resp.text, "html.parser")
            text = soup.get_text(" ", strip=True)
            emails = EMAIL_REGEX.findall(text)
            filtered = [e for e in emails if _is_valid_lawyer_email(e)]
            if not filtered:
                return None

            name = ""
            name_match = re.search(r"([가-힣]{2,4})\s*변호사", text)
            if name_match:
                name = name_match.group(1)

            firm = ""
            firm_match = re.search(r"(법무법인|법률사무소)\s*[가-힣\w]+", text)
            if firm_match:
                firm = firm_match.group(0)

            return {"name": name or "미확인", "firm": firm, "email": filtered[0]}
        except Exception:
            return None


# ── 메인 크롤러 클래스 ────────────────────────────────
class LawyerCrawler:
    """
    모든 크롤러를 통합 관리하는 메인 클래스.
    관리자 대시보드에서 호출합니다.
    """

    def __init__(self):
        self.korean_bar = KoreanBarCrawler()
        self.naver_blog = NaverBlogCrawler()
        self.youtube = YouTubeCrawler()
        self.legal_portal = LegalPortalCrawler()
        self._status = {
            "running": False,
            "source": "",
            "progress": "",
            "last_run": None,
            "last_result": None,
        }

    @property
    def status(self):
        return self._status

    def run(self, source: str = "all", **kwargs) -> dict:
        """
        크롤링 실행

        Args:
            source: "koreanbar" | "naver" | "youtube" | "portal" | "all"
            **kwargs: 각 크롤러에 전달할 추가 인자
                - max_pages: 최대 페이지 수
                - keyword: 검색 키워드
                - keywords: 키워드 리스트
                - legal_categories: ["이혼", "전세사기", ...] 법률 카테고리
                - max_results: 키워드당 최대 결과 수

        Returns:
            {"added": int, "skipped": int, "total": int, "source": str, "duration": float}
        """
        self._status["running"] = True
        self._status["source"] = source
        self._status["progress"] = "수집 시작..."

        start_time = time.time()
        all_contacts = []
        legal_categories = kwargs.get("legal_categories")

        try:
            if source in ("koreanbar", "all"):
                self._status["progress"] = "대한변호사협회 수집 중..."
                contacts = self.korean_bar.crawl(
                    max_pages=kwargs.get("max_pages", 5),
                    keyword=kwargs.get("keyword", ""),
                )
                all_contacts.extend(contacts)

            if source in ("naver", "all"):
                self._status["progress"] = "네이버 블로그 수집 중 (mainFrame 전략)..."
                contacts = self.naver_blog.crawl(
                    keywords=kwargs.get("keywords"),
                    max_results_per_keyword=kwargs.get("max_results", 10),
                    legal_categories=legal_categories,
                )
                all_contacts.extend(contacts)

            if source in ("youtube", "all"):
                self._status["progress"] = "유튜브 영상 설명란 수집 중..."
                contacts = self.youtube.crawl(
                    keywords=kwargs.get("keywords"),
                    max_results_per_keyword=kwargs.get("max_results", 10),
                    legal_categories=legal_categories,
                )
                all_contacts.extend(contacts)

            if source in ("portal", "all"):
                self._status["progress"] = "법률 포털 수집 중..."
                contacts = self.legal_portal.crawl(
                    max_pages=kwargs.get("max_pages", 3),
                )
                all_contacts.extend(contacts)

            # DB에 저장
            result = add_contacts(all_contacts)
            duration = time.time() - start_time

            result_info = {
                **result,
                "source": source,
                "duration": round(duration, 1),
                "collected_raw": len(all_contacts),
                "today_count": get_today_count(),
            }

            self._status["progress"] = f"완료: {result['added']}건 추가"
            self._status["last_run"] = datetime.now().isoformat()
            self._status["last_result"] = result_info

            print(f"\n{'='*50}")
            print(f"[크롤링 최종 결과]")
            print(f"  소스: {source}")
            print(f"  수집: {len(all_contacts)}건 (원본)")
            print(f"  추가: {result['added']}건 (중복 제외)")
            print(f"  건너뜀: {result['skipped']}건 (중복)")
            print(f"  총 DB: {result['total']}건")
            print(f"  소요시간: {duration:.1f}초")
            print(f"  오늘 수집: {result_info['today_count']}건")
            print(f"{'='*50}\n")

            return result_info

        except Exception as e:
            self._status["progress"] = f"오류 발생: {str(e)}"
            raise
        finally:
            self._status["running"] = False


# ── 싱글톤 인스턴스 ───────────────────────────────────
crawler_instance = LawyerCrawler()


# ── CLI 실행 (테스트용) ───────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="변호사 이메일 수집 크롤러 v2")
    parser.add_argument("--source", default="all", choices=["koreanbar", "naver", "youtube", "portal", "all"])
    parser.add_argument("--max-pages", type=int, default=3)
    parser.add_argument("--keyword", default="")
    parser.add_argument("--categories", nargs="*", default=None,
                        help="법률 카테고리: 이혼 전세사기 형사 부동산 상속 노동 ...")
    args = parser.parse_args()

    crawler = LawyerCrawler()
    result = crawler.run(
        source=args.source,
        max_pages=args.max_pages,
        keyword=args.keyword,
        legal_categories=args.categories,
    )
    print(f"\n최종: {json.dumps(result, ensure_ascii=False, indent=2)}")
