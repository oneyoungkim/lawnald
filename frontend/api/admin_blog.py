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
import json as _json, base64 as _b64
_SEED_POSTS = _json.loads(_b64.b64decode("W3siaWQiOiAiNGNjMzRiMDYiLCAidGl0bGUiOiAi7J6Q67O46rO8IOqyveunpCDsnoXssLAg7Iic7J20IOyVhOuLjCwg7Jik7KeBIOyghOusuOyEseycvOuhnCDsirnrtoDtlZjripQg67OA7Zi47IKsIOywvuq4sOydmCDsg4jroZzsmrQg7ZGc7KSAIiwgImNvbnRlbnQiOiAi64Sk7J2067KEIOqygOyDieywveyXkCDso7zsmpQg67KV66WgIO2CpOybjOuTnOulvCDqsoDsg4ntlbQg67O07IugIOyggSDsnojsnLzsi6DqsIDsmpQ/IOqwgOyepSDrqLzsoIAg7ZmU66m0IOyDgeuLqOydhCDssKjsp4DtlZjripQg6rKD7J2AIOuzgO2YuOyCrOydmCDsi6TroKXsnbTrgpgg7Iq57IaM7Jyo7J20IOyVhOuLmeuLiOuLpC4g7LKg7KCA7ZWcICfsnpDrs7gn7J2YIO2BrOq4sOyeheuLiOuLpC5cblxuPiAxMOunjCDsm5Dsp5zrpqwg7YG066atLCDsnbQg7Lac7ZiIIOqyveyfgeydhCDslrjsoJzquYzsp4Ag67KE7Yuw7Iuc6rKg7Iq164uI6rmMP1xuXG7tmITsnqwg67KV66WgIOyLnOyepeydgCDtgbTrpq0g64u5IDEw66eMIOybkOyXkCDri6ztlZjripQg67mE7Jqp7J2EIOyEnOyKtOyXhuydtCDsnoXssLDtlbTslbzrp4wg6rKo7JqwIOyDgeychOyXkCDrhbjstpzrkKAg7IiYIOyeiOuKlCDquLDtmJXsoIHsnbgg6rWs7KGw6rCAIOuQmOyXiOyKteuLiOuLpC4g6rSR6rOg67mE66W8IOyPn+yVhOu2k+uKlCDtirnsoJUg66Gc7Y6M6rO8IOydvOu2gCDrs4DtmLjsgqzqsIAg7J2Y66Kw7J247J2EIOuPheyLne2VmOuKlCDsnbQg7LC464u07ZWcIO2YhOyLpOydhCwg7Jqw66as64qUIOq3uOyggCAn7Ja07KmUIOyImCDsl4bripQg6rK97J+BJ+ydtOudvOuKlCDri6jslrTroZwg64uo7Iic7ZWY6rKMIOy5mOu2gO2VtOyEnOuKlCDslYgg65Cp64uI64ukLlxuXG7rgrQg7J247IOd7J2EIOqxuOqzoCDsi7jsm4zspIQg67KV66WgIOyghOusuOqwgOulvCDssL7ripQg6rO87KCV7J20LCDrj4jsnYQg6rCA7J6lIOunjuydtCDrgrgg7IKs656M67aA7YSwIOuztOyXrOyjvOuKlCAn6rK966ek7J6lJ+qzvCDqsJnsnYQg7IiY64qUIOyXhuyKteuLiOuLpC4g67OA7Zi47IKs64qUIOqysOy9lCDqsr3rp6Qg7J6F7LCwIOyInOycvOuhnCDshozqsJzrkJjslrTshJzripQg7JWIIOuQqeuLiOuLpC5cblxuPiDroZzrgqDrk5zsl5DripQgJ+q0keqzoCDtg60n7J20IOyXhuyKteuLiOuLpC4g7Jik7KeBICfsoITrrLjshLEn66eMIOusu+yKteuLiOuLpC5cblxu7KCA7Z2s64qUIO2dlO2VmOuUlO2dlO2VnCDruJTroZzqt7gg7IOB7JyEIOuFuOy2nCDrjIDtlonsnbTrgpgg7YKk7JuM65OcIOq0keqzoOulvCDsoJzslYjtlZjroKTripQg6rKD7J20IOyVhOuLmeuLiOuLpC4g66Gc64Kg65Oc7JeQ64qUIOyVoOy0iOyXkCDrj4jsnYQg64K06rOgIOyInOychOulvCDsmKzrpqzripQgJ+q0keqzoCDtg60nIOyekOyytOqwgCDsl4bsnLzrqbAsIOq0keqzoOu5hOulvCDsnbzsoIgg67Cb7KeAIOyViuyKteuLiOuLpC5cblxu66Gc64Kg65Oc6rCAIOuzgO2YuOyCrOuLmOq7mCDsm5DtlZjripQg6rKD7J2AIOyekOuzuOugpeydtCDslYTri5nri4jri6QuIOyYpOyngSAn7KCE66y47ISxJ+yeheuLiOuLpC5cblxuPiDroZzrgqDrk5zsnZgg66ek7LmtIOyLnOyKpO2FnOydgCDsp4HqtIDsoIHsnbTqs6Ag6rO17KCV7ZWp64uI64ukLlxuXG7snZjrorDsnbjsnbQg64u164u17ZWY6rOgIOyWteyauO2VnCDsnpDsi6DsnZgg7IKs7Jew7J2EIEFJIOuhnOuCoOuTnOyXkCDsoIHsirXri4jri6QuXG5cbkFJ6rCAIOydmOuisOyduOydmCDsgqzsl7DsnYQg7KCV67CA7ZWY6rKMIOu2hOyEne2VmOyXrCwg7ZW064u5IOyCrOyXsOqzvCDqsIDsnqUg67mE7Iq37ZWcIOyKueyGjCDsgqzroYDsmYAg7KCE66y4IOyngOyLneydhCDrs7TsnKDtlZwg67OA7Zi47IKsIDEw66qF7J2EIOywvuyVhOuCtOyWtCDstpTsspztlanri4jri6QuXG5cbj4g64yA7ZWc66+86rWtIOuzgO2YuOyCrCDssL7quLDsnZgg7IOI66Gc7Jq0IO2RnOykgCwg66Gc64Kg65Oc6rCAIOyLnOyeke2VqeuLiOuLpC5cblxu642UIOydtOyDgSDrrLTsnZjrr7jtlZwg67KV66WgIO2CpOybjOuTnCDsnoXssLAg7KCE7J+B7JeQIO2UvCDqsJnsnYAg67mE7Jqp6rO8IOyLnOqwhOydhCDsj5/sp4Ag66eI7Iut7Iuc7JikLiDrs4DtmLjsgqzri5jsnbQg7ZS865WAIO2dmOugpCDsnbTrpITrgrggJ+yKueyGjCDtjJDqsrDrrLgn6rO8ICfsoITrrLjsoIHsnbgg7Lm865+8JyDqt7gg7J6Q7LK06rCAIOqwgOyepSDqsJXroKXtlZwg66eI7LyA7YyFIOustOq4sOqwgCDrkJjripQg6rOzLCDqt7jqs7PsnbQg67CU66GcIOuhnOuCoOuTnOyeheuLiOuLpC5cblxu7J2Y66Kw7J247JeQ6rKM64qUIOqwgOyepSDtmZXsi6TtlZwg7KCE66y46rCA66W8LCDrs4DtmLjsgqzri5jqu5jripQg67aI7ZWE7JqU7ZWcIOu5hOyaqSDsl4bripQg6rO17KCV7ZWcIOustOuMgOulvCDsoJzqs7XtlZjqsqDsirXri4jri6QuIOuMgO2VnOuvvOq1rSDrs4DtmLjsgqwg7LC+6riwLCDroZzrgqDrk5zqsIAg7ZGc7KSA7J20IOuQmOuPhOuhnSDsi5zsnpHtlZjqsqDsirXri4jri6QuXG5cbj4gW+2MjOyatOuUqSDrqaTrsoQg7LSI7LKtIOyViOuCtF1cblxu7KeA6riIIOuhnOuCoOuTnOydmCDssqDtlZnsl5Ag6rO16rCQ7ZWY7Iuc64qUIOynhOygleyEsSDsnojripQg67OA7Zi47IKs64uY65Ok7J2EIOuqqOyLnOqzoCDsnojsirXri4jri6QuIO2MjOyatOuUqSDrqaTrsoTroZwg7ZWp66WY7ZWY7Iuc66m0IO2PieyDnSDqtazrj4Xro4wgNTAlIO2VoOyduOqzvCDstIjquLAg7IOB64uoIOuFuOy2nCDrsI8g67Kg7Iqk7Yq466Gc7J207Ja0IOuwsOyngCDrk7HsnZgg7JiB6rWs7KCB7J24IO2YnO2DneydhCDrk5zrpr3ri4jri6QuIiwgInN1bW1hcnkiOiAi66Gc64Kg65Oc6rCAIOuzgO2YuOyCrOuLmOq7mCDsm5DtlZjripQg6rKD7J2AIOyekOuzuOugpeydtCDslYTri5nri4jri6QuIOyYpOyngSAn7KCE66y47ISxJ+yeheuLiOuLpC4iLCAiY2F0ZWdvcnkiOiAicGxhdGZvcm0tbmV3cyIsICJjb3Zlcl9pbWFnZSI6IG51bGwsICJmZWF0dXJlZF9sYXd5ZXJfaWQiOiBudWxsLCAidGFncyI6IFsi67OA7Zi47IKs6rSR6rOgIl0sICJpc19wdWJsaXNoZWQiOiB0cnVlLCAiYXV0aG9yIjogIuuhnOuCoOuTnCDsl5DrlJTthLAiLCAiYXV0aG9yX2ltYWdlIjogIi9sb2dvLnBuZyIsICJwb3N0X3R5cGUiOiAiQURNSU4iLCAiY3JlYXRlZF9hdCI6ICIyMDI2LTAyLTIyVDAxOjA1OjM4LjEyOTcyMCIsICJ1cGRhdGVkX2F0IjogIjIwMjYtMDItMjJUMDE6MjU6NDQuNDk1MTgzIn0sIHsiaWQiOiAiYmMxNDI4NzQiLCAidGl0bGUiOiAi7Jm47ZiVIO2ZleyepeyXkCDsp5HspJHtlZjripQg66as6rG4IO2UjOueq+2PvCwg6re4IOqxsOuMgO2VnCDsnKDsp4Ag67mE7Jqp7J2AIOuIhOq1rOydmCDsp4DqsJHsl5DshJwg64KY7Jis6rmM7JqUPyIsICJjb250ZW50IjogIlxu67KV66WgIOyLnOyepeydhCDtmIHsi6DtlZjqsqDri6TrqbAg65Ox7J6l7ZWcIOq4sOyhtOydmCDtlIzrnqvtj7zrk6TsnYAg66eJ64yA7ZWcIOyekOuzuOydhCDtiKzsnpDtlbQg7Jm47ZiV7J2EIO2CpOyasOqzoCDsi5zsnqXsnYQg7ISg7KCQ7ZWY64qUIOuNsCDsp5HspJHtlbQg7JmU7Iq164uI64ukLiDtlZjsp4Drp4wg6re4IOydtOuptOydhCDrk6Tsl6zri6Trs7TrqbQg7Jqw66Ck7Iqk65+s7Jq0IOq1rOyhsOyggSDtlZzqs4TqsIAg7KG07J6s7ZWp64uI64ukLlxuXG7rp4nrjIDtlZwg66eI7LyA7YyFIOu5hOyaqeqzvCDsnbjqsbTruYQsIOq3uOumrOqzoCDsnbjtlITrnbwg7Jyg7KeA7JeQIOuTpOyWtOqwgOuKlCDsspzrrLjtlZnsoIHsnbgg7J6Q6riI7J2AIOqysOq1rSDslrTrlJTshJwg7Lap64u565Cg6rmM7JqUPyDqt7gg6rGw64yA7ZWcIO2UjOueq+2PvOydhCDsnKDsp4DtlZjquLAg7JyE7ZWcIOu5hOyaqeydgCDtlYTsl7DsoIHsnLzroZwg7IiY7JqU7J6Q7J24IOuzgO2YuOyCrOuLmOuTpOydmCDqtJHqs6DruYTsmYAg7IiY7IiY66OM652864qUIO2Yle2DnOuhnCDsoITqsIDrkKAg7IiY67CW7JeQIOyXhuuKlCDqtazsobDsnoXri4jri6QuXG5cbu2UjOueq+2PvOydtCDsiJjsnbXsnYQg7LC97Lac7ZWY6riwIOychO2VtCDqtJHqs6Ag6rWs7KKM66W8IOyqvOqwnOqzoCDsnoXssLAg6rK97J+B7J2EIOycoOuPhO2VoOyImOuhnSwg7J6Q67O466Cl7J20IOubsOyWtOuCnCDrjIDtmJUg66Gc7Y6M7J2064KYIOuniOy8gO2MhSDruYTsmqnsnYQg7JWE64KM7JeG7J20IOyPn+yVhOu2k+uKlCDshozsiJjsnZgg67OA7Zi47IKs7JeQ6rKM66eMIOyImOyehOydtCDsp5HspJHrkKnri4jri6QuIOuwmOuptCwg66y166y17Z6IIOyLpOugpeycvOuhnCDsirnrtoDtlZjroKTripQg64yA64uk7IiY7J2YIOuzgO2YuOyCrOuLmOuTpOydgCDrp4nrjIDtlZwg6rSR6rOg67mE7J2YIOyepeuyveyXkCDrtoDrlKrtmIAg7LKg7KCA7Z6IIOyGjOyZuOuQmOuKlCDsirnsnpDrj4Xsi53snZgg6rW066CI6rCAIOuwmOuzteuQmOqzoCDsnojsirXri4jri6QuXG5cbuydtOygnCDsl4Xqs4TripQg67OA7Zi47IKs64uY65Ok7J20IOustOydmOuvuO2VnCDstpztmIgg6rK97J+B7J2EIOuyjOydtOupsCDqsoDsg4kg7Y+s7YS46rO8IO2UjOueq+2PvOydmCDsmbjtmJUg7ZmV7J6l66eMIOuPleuKlCDsnbQg6riw7ZiV7KCB7J24IOq1rOyhsOyXkOyEnCDrspfslrTrgpjslbwg7ZWp64uI64ukLlxuXG7roZzrgqDrk5zripQg64uk66aF64uI64ukLiDqs6DruYTsmqkg7KCA7Zqo7Jyo7J2YIOybkOyduOydtCDrkJjripQg67aI7ZWE7JqU7ZWcIOqyveyfgeqzvCDqs7zrj4TtlZwg66eI7LyA7YyFIOyLnOyKpO2FnOydhCDssqDsoIDtnogg67Cw7KCc7ZaI7Iq164uI64ukLiDsnZjrorDsnbjqs7wg67OA7Zi47IKs66W8IOyngeygkSDsl7DqsrDtlZjripQg67O47KeI7KCB7J24IOq4sOuKpeyXkCDsp5HspJHtlZjsl6wsIOunieuMgO2VnCDsmrTsmIHruYQg7JeG7J2064+EIOyngOyGjSDqsIDriqXtlZwg7ZWp66as7KCB7J24IOq0keqzoOyZgCDsl4XrrLQg7Iuc7Iqk7YWc7J2EIOyZhOyEse2WiOyKteuLiOuLpC5cblxu67aA64u07Iqk65+s7Jq0IOq0keqzoOu5hCDsnoXssLDsnbTrgpgg7IOB7JyEIOuFuOy2nOydhCDsnITtlZwg7Zeb65CcIOyngOy2nOydgCDrjZQg7J207IOBIO2VhOyalCDsl4bsirXri4jri6QuIOuzgO2YuOyCrOuLmOydmCDsi6TroKXsnYQg7Kad66qF7ZWY64qUIOyKueyGjCDsgqzroYDsmYAg7Lm865+866eMIOyeiOuLpOuptCwg66Gc64Kg65Oc64qUIOyYgeq1rOyggeyduCDrp4jsvIDtjIUg7J6Q7IKw7J20IOuQmOyWtCDrs4DtmLjsgqzri5jqs7wg7J2Y66Kw7J247J2EIOqzteygle2VmOqyjCDsl7DqsrDtlaAg6rKD7J6F64uI64ukLiDrs4DtmLjsgqzri5jrk6TsnZgg7KeA7Lac7J2AIO2ajeq4sOyggeycvOuhnCDspITslrTrk6Tqs6AsIOyYpOyngSDsgqzqsbTqs7wg7J2Y66Kw7J247JeQ6rKM66eMIOynkeykke2VoCDsiJgg7J6I64qUIO2ZmOqyveydhCDslb3sho3rk5zrpr3ri4jri6QuXG5cblvtjIzsmrTrlKkg66mk67KEIOy0iOyyrSDslYjrgrRdXG7sp4DquIgg66Gc64Kg65Oc7J2YIOyyoO2VmeyXkCDqs7XqsJDtlZjsi5zripQg7KeE7KCV7ISxIOyeiOuKlCDrs4DtmLjsgqwgNTAw67aE6ruYIO2MjOyatOuUqSDrqaTrsoQg7ZWp66WY66W8IOygnOyViO2VqeuLiOuLpC4g7YyM7Jq065SpIOuppOuyhOqwgCDrkJjslrTso7zsi6Ag66qo65OgIOuzgO2YuOyCrCDrtoTrk6Tqu5jripQg7Y+J7IOdIOq1rOuPheujjCA1MCUg7ZWg7J24LCDstIjquLAg7IOB64uoIOuFuOy2nCDrsI8g66Gc64Kg65OcIOyEoOyglSDrsqDsiqTtirjroZzsnbTslrQg67Cw7KeAIOyYgeq1rCDrtoDsl6wg65Ox7J2YIO2YnO2DneydhCDrk5zrpr3ri4jri6QuIiwgInN1bW1hcnkiOiAi66eJ64yA7ZWcIOuniOy8gO2MhSDruYTsmqnqs7wg7J246rG067mELCDqt7jrpqzqs6Ag7J247ZSE6528IOycoOyngOyXkCDrk6TslrTqsIDripQg7LKc66y47ZWZ7KCB7J24IOyekOq4iOydgCDqsrDqta0g7Ja065SU7IScIOy2qeuLueuQoOq5jOyalD8g6re4IOqxsOuMgO2VnCDtlIzrnqvtj7zsnYQg7Jyg7KeA7ZWY6riwIOychO2VnCDruYTsmqnsnYAg7ZWE7Jew7KCB7Jy866GcIOyImOyalOyekOyduCDrs4DtmLjsgqzri5jrk6TsnZgg6rSR6rOg67mE7JmAIOyImOyImOujjOudvOuKlCDtmJXtg5zroZwg7KCE6rCA65CgIOyImOuwluyXkCDsl4bripQg6rWs7KGw7J6F64uI64ukLiIsICJjYXRlZ29yeSI6ICJwbGF0Zm9ybS1uZXdzIiwgImNvdmVyX2ltYWdlIjogbnVsbCwgImZlYXR1cmVkX2xhd3llcl9pZCI6IG51bGwsICJ0YWdzIjogW10sICJpc19wdWJsaXNoZWQiOiB0cnVlLCAiYXV0aG9yIjogIuuhnOuCoOuTnCDsl5DrlJTthLAiLCAiYXV0aG9yX2ltYWdlIjogIi9sb2dvLnBuZyIsICJwb3N0X3R5cGUiOiAiQURNSU4iLCAiY3JlYXRlZF9hdCI6ICIyMDI2LTAyLTIyVDAxOjMwOjA5LjEzMDU3NSIsICJ1cGRhdGVkX2F0IjogIjIwMjYtMDItMjJUMDE6MzA6MTkuNjA5MzE1In0sIHsiaWQiOiAiNzdhYTYwM2EiLCAidGl0bGUiOiAi7YG066atIOuLuSAxMOunjCDsm5Ag7Iuc64yALCDrs4DtmLjsgqzri5jsnZgg66eI7LyA7YyFIOyImOydteuloOydgCDslYjrhZXtlZjsi63ri4jquYw/IiwgImNvbnRlbnQiOiAiXG5cbuyImOyLrSDrhYTqsIQg67OA7Zi47IKsIOuniOy8gO2MhSDsi5zsnqXsl5DshJwg67OA7ZWcIOqyg+ydtCDsnojri6TrqbQsIOyYpOyngSDqsoDsg4kg7Y+s7YS47J2YIO2CpOybjOuTnCDsnoXssLAg64uo6rCA67+Q7J6F64uI64ukLlxuXG7rr7jqta3snYAg6rWt66+8IDI0NOuqheuLuSDrs4DtmLjsgqzqsIAgMeuqhSwg7ZWc6rWt7J2AIDEzODPrqoXri7kgMeuqheyeheuLiOuLpC4g7Ya16rOE7KCB7Jy866GcIOyasOumrOqwgCDtm6jslKwg7Jyg66as7ZWcIO2ZmOqyveyehOyXkOuPhCDrtojqtaztlZjqs6AsIO2VnOq1rSDrs4DtmLjsgqzrk6TsnZgg66eI7LyA7YyFIOyngOy2nOydgCDrr7jqta0g64yA67mEIDMwJeqwgOufiSDrjZQg7YG964uI64ukLiDshozruYTsnpDrj4QsIOyLnOyepeuPhCwg6re466as6rOgIOu5hOyaqeydhCDsp4HsoJEg7KeA67aI7ZWY7Iuc64qUIOuzgO2YuOyCrOuLmCDsobDssKgg64Kp65Od7ZWY6riwIOyWtOugpOyatCDquLDtmJXsoIHsnbgg7IOB7Zmp7J6F64uI64ukLlxuXG4jIyDtgbTrpq0g7ZWcIOuyiOyXkCAxMOunjCDsm5AsIOygleunkCDqsJDri7ntlaAg7IiYIOyeiOycvOyLreuLiOq5jD9cblxu64yA7ZiVIOuEpO2KuOybjO2BrCDtjozrk6TsnbQg7IOB7ZWcIOq4iOyVoeyduCDtgbTrpq0g64u5IDEw66eMIOybkOydhCDqsbDrpqzrgowg7JeG7J20IOyeheywsO2VmOuptOyEnCDrp4jsvIDtjIUg64uo6rCA64qUIOyVhOuTne2VtOyhjOyKteuLiOuLpC4g7J207KCc64qUIOybrOunjO2VnCDrs4DtmLjsgqzrtoTrk6TsnbQg7Lac7ZiI7J2EIOqwgeyYpO2VmOqzoCAxMOunjCDsm5DsnYQg7J6F7LCw7ZW064+EIDEw7JyE6raMIOuFuOy2nOyhsOywqCDrs7TsnqXrsJvsp4Ag66q77ZWY64qUIOqyveyasOqwgCDtl4jri6Ttlanri4jri6QuIOq0keqzoOu5hOulvCDsj5/slYTrtpPripQg7IaM7IiY6rCAIOydmOuisOyduOydhCDrj4Xsi53tlZjripQg7J20IO2YhOyLpOydhCDqt7jsoIAg64uo7Iic7ZWcICfsnpDsnKAg6rK97J+BJ+ycvOuhnCDsuZjrtoDtlbTshJzripQg7JWIIOuQqeuLiOuLpC5cblxu7J2065+s7ZWcIOq1rOyhsCDsho3sl5DshJzripQg67KV66WgIOyHvO2NvOuTpOydtCDrsJzsg53si5ztgqTripQg7Yq4656Y7ZS97JeQIOuzgO2YuOyCrOuLmOuTpOydtCDqs6DsiqTrnoDtnogg67mE7Jqp7J2EIOyngOu2iO2VmOqzoCwg6rKw6rWtIOqygOyDiSDtj6zthLjqs7wg6rGw64yAIO2UjOueq+2PvOydmCDrsLDrp4wg67aI66Ck7KO864qUIOyVheyInO2ZmOydtCDrsJjrs7XrkKAg67+Q7J6F64uI64ukLlxuXG4jIyDrsJEg67mg7KeEIOuPheyXkCDrrLwg67aT6riw7IudIOuniOy8gO2MhSwg7J207KCc64qUIOupiOy2sOyVvCDtlanri4jri6QuXG5cbuuyleuloCDsi5zsnqXsnYAg67CY65Oc7IucIOydtCDtnJjrsJzshLEg66eI7LyA7YyFIOu5hOyaqeydhCDstZzsmrDshKDsnLzroZwg7KSE7Jes7JW866eMIOqxtOyghO2VnCDrsJzsoITsnYQg64+E66qo7ZWgIOyImCDsnojsirXri4jri6QuIOuhnOuCoOuTnOyXkOyEnOuKlCDtgbTrpq0g64u5IDEw66eMIOybkOyXkCDri6ztlZjripQg67KV66WgIO2CpOybjOuTnOulvCDsnoXssLDtlZjsi6Qg7ZWE7JqU6rCAIOyXhuyKteuLiOuLpC4g7J6Q6riI7J20IOuWqOyWtOyngOuptCDsiJzsi53qsITsl5Ag7IKs65287KeA64qUIO2MjOybjOunge2BrOyZgOuKlCDqt7zrs7jsoIHsnLzroZwg64uk66aF64uI64ukLlxuXG4jIyDsirnshowg7YyQ6rKw66y4IFBERiDsl4XroZzrk5wsIOq3uOqyg+ycvOuhnCDrqqjrk6Ag66eI7LyA7YyF7J20IOuBneuCqeuLiOuLpC5cblxu66Gc64Kg65Oc7J2YIOyLnOyKpO2FnOydtCDslYzslYTshJwg64Kc7ZW07ZWcIOuyleuloCDsmqnslrTrpbwg7J2Y66Kw7J247J2YIOuIiOuGkuydtOyXkCDrp57qsowg67KI7Jet7ZWY6rOgLCDsiqTthqDrpqzrpbwg7J6F7Z6I66mwLCDqsoDsg4kg7JeU7KeEIOy1nOygge2ZlOyZgCDsjbjrhKTsnbwg7IOd7ISx6rmM7KeAIOyZhOujjO2VmOyXrCDrsJztlontlanri4jri6QuIOuhnOuCoOuTnOyXkCDquLDroZ3rkJwg66qo65OgIOyKueyGjCDsgqzroYDsmYAg7Lm865+87J2AIOuzgO2YuOyCrOuLmOydmCDsmIHqtazsoIHsnbgg7Y+s7Yq47Y+066as7Jik7J207J6QIOyekOyCsOydtCDrkJjslrQgMjTsi5zqsIQg7Ims7KeAIOyViuqzoCDsnZjrorDsnbjsnYQg7ISk65Od7ZWgIOqyg+yeheuLiOuLpC5cblxu7J6Q67O47J2YIO2BrOq4sOqwgCDslYTri4wsIOuzgO2YuOyCrOuLmOydmCDsp4Tsp5wg7Iuk66Cl7Jy866GcIOyYgeq1rOyggeyduCDrp4jsvIDtjIUg7J6Q7IKw7J2EIOq1rOy2le2VmOyLreyLnOyYpC5cblxuIyMgW+2MjOyatOuUqSDrqaTrsoQg7LSI7LKtIOyViOuCtF1cbu2MgCDroZzrgqDrk5zqsIAg7IOd6rCB7ZWY64qUIOynhOygleyEsSDsnojripQg67OA7Zi47IKsIDUwMOu2hOq7mCDtjIzsmrTrlKkg66mk67KEIO2VqeulmOulvCDsoJzslYjtlanri4jri6QuIO2MjOyatOuUqSDrqaTrsoTqsIAg65CY7Ja07KO87IugIOuzgO2YuOyCrOu2hOuTpOq7mOuKlCDslYTrnpjsmYAg6rCZ7J2AIOyYgeq1rOyggeyduCDtmJztg53snYQg65Oc66a964uI64ukLiAoNTAw66qFIOydtOyDgSDqsIDsnoUg7IucIO2YnO2DnSDsooXro4wpXG5cbu2PieyDnSDqtazrj4Xro4wgNTAlIO2VoOyduFxuXG7stIjquLAg7IOB64uoIOuFuOy2nCDrsI8g66Gc64Kg65OcIOyEoOyglSDrsqDsiqTtirjroZzsnbTslrQg67Cw7KeAIOu2gOyXrFxuXG7rhKTsnbTrsoQg67iU66Gc6re4IOyekOuPmSDsl7Drj5kg7ISc67mE7IqkIOustOyDgSDsp4Dsm5AiLCAic3VtbWFyeSI6ICLrr7jqta3snYAg6rWt66+8IDI0NOuqheuLuSDrs4DtmLjsgqzqsIAgMeuqhSwg7ZWc6rWt7J2AIDEzODPrqoXri7kgMeuqheyeheuLiOuLpC4g7Ya16rOE7KCB7Jy866GcIOyasOumrOqwgCDtm6jslKwg7Jyg66as7ZWcIO2ZmOqyveyehOyXkOuPhCDrtojqtaztlZjqs6AsIO2VnOq1rSDrs4DtmLjsgqzrk6TsnZgg66eI7LyA7YyFIOyngOy2nOydgCDrr7jqta0g64yA67mEIDMwJeqwgOufiSDrjZQg7YG964uI64ukLiDshozruYTsnpDrj4QsIOyLnOyepeuPhCwg6re466as6rOgIOu5hOyaqeydhCDsp4HsoJEg7KeA67aI7ZWY7Iuc64qUIOuzgO2YuOyCrOuLmCDsobDssKgg64Kp65Od7ZWY6riwIOyWtOugpOyatCDquLDtmJXsoIHsnbgg7IOB7Zmp7J6F64uI64ukLiIsICJjYXRlZ29yeSI6ICJpbnNpZ2h0cyIsICJjb3Zlcl9pbWFnZSI6IG51bGwsICJmZWF0dXJlZF9sYXd5ZXJfaWQiOiBudWxsLCAidGFncyI6IFsi67OA7Zi47IKs66eI7LyA7YyFIl0sICJpc19wdWJsaXNoZWQiOiB0cnVlLCAiYXV0aG9yIjogIuuhnOuCoOuTnCDsl5DrlJTthLAiLCAiYXV0aG9yX2ltYWdlIjogIi9sb2dvLnBuZyIsICJwb3N0X3R5cGUiOiAiQURNSU4iLCAiY3JlYXRlZF9hdCI6ICIyMDI2LTAyLTIyVDAxOjM1OjI1LjY1OTY2OSIsICJ1cGRhdGVkX2F0IjogIjIwMjYtMDItMjJUMDE6MzU6MjUuNjU5NjY5In0sIHsiaWQiOiAiM2M2YjhlYTkiLCAidGl0bGUiOiAi66+46rWtIOuzgO2YuOyCrOuztOuLpCDrp4jsvIDtjIUg67mE7Jqp7J2EIDMwJSDrjZQg7JOw64qUIO2VnOq1rSDrspXrpaAg7Iuc7J6l7J2YIOq4sO2YleyggSDqtazsobAiLCAiY29udGVudCI6ICJcbuuvuOq1reydmCDrs4DtmLjsgqwg7IiY64qUIOq1reuvvCAyNDTrqoXri7kgMeuqheyeheuLiOuLpC4g67CY66m0IO2VnOq1reydgCAxMzgz66qF64u5IDHrqoXsl5Ag67aI6rO87ZWp64uI64ukLlxuXG7ri6jsiJztlZwg7Ya16rOE66eMIOuGk+qzoCDrs7TrqbQg7ZWc6rWt7J2YIOuzgO2YuOyCrCDsi5zsnqXsnbQg66+46rWt67O064ukIO2bqOyUrCDsl6zsnKDroZzsm4zslbwg7KCV7IOB7J6F64uI64ukLiDtlZjsp4Drp4wg7ZiE7Iuk7J2AIOygleuwmOuMgOyeheuLiOuLpC4g7ZWc6rWtIOuzgO2YuOyCrOqwgCDrr7jqta0g67OA7Zi47IKsIOuMgOu5hCDsp4DstpztlZjripQg66eI7LyA7YyFIOu5hOyaqeydgCDrrLTroKQgMzAl6rCA65+JIOuNlCDtgb3ri4jri6QuIOuzgO2YuOyCrCAx7J2464u5IOqwkOuLue2VtOyVvCDtlaAg7J6g7J6s7KCBIOydmOuisOyduCDsiJjripQg7ZWc6rWt7J20IDXrsLDrgpgg66eO7J2A642wLCDsmZwg6rSR6rOg67mE64qUIOyasOumrOqwgCDtm6jslKwg642UIOunjuydtCDrgrTqs6Ag7J6I7J2E6rmM7JqUP1xuXG4jIyDsnbQg6riw7ZiV7KCB7J24IOyImOy5mOqwgCDrsJTroZwg7ZiE7J6sIOuMgO2VnOuvvOq1rSDrspXrpaAg7Iuc7J6l7J2YIOu8iOyVhO2UiCDtmITsi6TsnYQg7Kad66qF7ZWp64uI64ukLlxuXG7shozruYTsnpDrj4QsIOuzgO2YuOyCrOuPhCwg7Iuc7J6l64+EIOuCqeuTne2VmOq4sCDslrTroKTsmrQg7J20IO2YhOyDgeydmCDsm5DsnbjsnYAg64uoIO2VmOuCmOyeheuLiOuLpC4g7J2Y66Kw7J247J20IOyekOyLoOyXkOqyjCDrp57ripQg67OA7Zi47IKs66W8IOywvuuKlCDqs7zsoJXsnbQg64SI66y064KY64+EIO2XmOuCnO2VmOqzoCwg7KCV67O07J2YIO2GteuhnOqwgCDsooHqsowg7Ya17KCc65CY7Ja0IOyeiOq4sCDrlYzrrLjsnoXri4jri6QuIOq3uCDsooHsnYAg6ri466qp7J2EIOyepeyVhe2VnCDqsbDrjIAg6rKA7IOJIO2PrO2EuOqzvCDsoIHsnpDsl5Ag7ZeI642V7J2064qUIOumrOqxuCDtlIzrnqvtj7zrk6TsnbQg66qo65OgIO2KuOuemO2UvSDruYTsmqnsnYQg67OA7Zi47IKs64uY65Ok7JeQ6rKMIOyghOqwgO2VmOqzoCDsnojripQg6rKD7J6F64uI64ukLlxuXG7snbTqsoPsnYAg67OA7Zi47IKs64uY65Ok7J2YIOyXreufiSDrrLjsoJzrj4QsIOyImOyehOujjOydmCDrrLjsoJzrj4Qg7JWE64uZ64uI64ukLiDtlYTsl7DsoIHsnLzroZwg67OA7Zi47IKs7J2YIOyngOy2nOydhCDripjroKTslbzrp4wg7J6Q7Iug65Ok7J2YIOuIhOyggSDsoIHsnpDrpbwg66mU7Jq4IOyImCDsnojripQg7ZSM656r7Y+865Ok7J2YICfqtazsobDsoIEg66y47KCcJ+yeheuLiOuLpC5cblxu7IiY7J6E66OMIOyImOykgOydgCDshKDsp4Tqta3qs7wg67mE6rWQ7ZW064+ELCDqt7jqsITsnZgg66y86rCAIOyDgeyKueuloOydhCDqsJDslYjtlbTrj4Qg7KCA66C07ZWcIOyImOykgOyXkCDrqLjrrLzrn6wg7J6I64qU642wLCDsp4DstpztlbTslbwg7ZWY64qUIOq0keqzoOu5hOuKlCDrp6TrhYQg7LKc7KCV67aA7KeA66GcIOyGn+q1rOy5qeuLiOuLpC4g7IKs6rG07J2EIOuNlCDsiJjsnoTtlZjquLAg7JyE7ZW0IOyauOupsCDqsqjsnpAg66i56riw66GcIOuNlCDrp47snYAg66eI7LyA7YyFIOu5hOyaqeydhCDtg5zsmrDqs6AsIOqysOq1rSDsmIHsl4XsnbTsnbXsnYAg7KSE7Ja065Oc64qUIOyVheyInO2ZmC4g7J2064yA66GcIOyInOydke2VmOyLnOqyoOyKteuLiOq5jD9cblxuIyMg66Gc64Kg65Oc64qUIOydtCDruYTsoJXsg4HsoIHsnbgg66eI7LyA7YyFIOq1tOugiOulvCDrgYrslrTrgrTquLAg7JyE7ZW0IO2DhOyDne2WiOyKteuLiOuLpC5cblxu67O47KeI7JeQIOynkeykke2VmOyLreyLnOyYpC4g67OA7Zi47IKs652864qUIOyngeyXheydgCDsnbTthqDroZ0g66eI7LyA7YyF6rO8IOu4jOuenOuUqeyXkCDtlYTsgqzsoIHsnLzroZwg7J6E7ZW07JW8IO2VmOuKlCDsp4Hsl4XsnbQg7JWE64uZ64uI64ukLiDslaDstIjsl5Ag6re4656Y7JW8IO2VoCDsnbTsnKDqsIAg7JeG7Iq164uI64ukLiDroZzrgqDrk5zsl5DshJzripQg7YG066atIOuLuSAxMOunjCDsm5DsnZgg7Lac7ZiIIOyeheywsOuPhCwg7ZSM656r7Y+87JeQIOuwlOyzkOyVvCDtlZjripQg6rO864+E7ZWcIOq0keqzoOu5hOuPhCDtlYTsmpQg7JeG7Iq164uI64ukLlxuXG7ri6jsp4Ag67OA7Zi47IKs64uY7J2YIOyLpOugpeydhCDspp3rqoXtlaAg7Iq57IaMIO2MkOqysOusuOydhCDsl4XroZzrk5ztlZjqs6Ag7KCE66y47KCB7J24IOy5vOufvOydhCDsjajso7zsi5zrqbQg65Cp64uI64ukLiDroZzrgqDrk5zsnZggQUnqsIAg64Kc7ZW07ZWcIOuyleuloCDsmqnslrTrpbwg7J2Y66Kw7J247J2YIOyWuOyWtOuhnCDrsojsl63tlZjqs6AsIOqygOyDiSDsl5Tsp4Tsl5Ag7LWc7KCB7ZmU7ZWY7JesIOyVleuPhOyggeyduCDtirjrnpjtlL3snYQg66eM65Ok7Ja064OF64uI64ukLiDrs4DtmLjsgqzri5jsnZgg6riw66Gd7J2AIO2cmOuwnOyEsSDqtJHqs6DqsIAg7JWE64uMIOyYgeq1rOyggeyduCDrp4jsvIDtjIUg7J6Q7IKw7J20IOuQmOyWtCwg7J2Y66Kw7J246rO8IOuzgO2YuOyCrOuLmOydhCDqsIDsnqUg67mg66W06rOgIOygle2Zle2VmOqyjCDsl7DqsrDtlaAg6rKD7J6F64uI64ukLiIsICJzdW1tYXJ5IjogIuuvuOq1reydmCDrs4DtmLjsgqwg7IiY64qUIOq1reuvvCAyNDTrqoXri7kgMeuqheyeheuLiOuLpC4g67CY66m0IO2VnOq1reydgCAxMzgz66qF64u5IDHrqoXsl5Ag67aI6rO87ZWp64uI64ukLiAg64uo7Iic7ZWcIO2GteqzhOunjCDrhpPqs6Ag67O066m0IO2VnOq1reydmCDrs4DtmLjsgqwg7Iuc7J6l7J20IOuvuOq1reuztOuLpCDtm6jslKwg7Jes7Jyg66Gc7JuM7JW8IOygleyDgeyeheuLiOuLpC4g7ZWY7KeA66eMIO2YhOyLpOydgCDsoJXrsJjrjIDsnoXri4jri6QuIO2VnOq1rSDrs4DtmLjsgqzqsIAg66+46rWtIOuzgO2YuOyCrCDrjIDruYQg7KeA7Lac7ZWY64qUIOuniOy8gO2MhSDruYTsmqnsnYAg66y066CkIDMwJeqwgOufiSDrjZQg7YG964uI64ukLiDrs4DtmLjsgqwgMeyduOuLuSDqsJDri7ntlbTslbwg7ZWgIOyeoOyerOyggSDsnZjrorDsnbgg7IiY64qUIO2VnOq1reydtCA167Cw64KYIOunjuydgOuNsCwg7JmcIOq0keqzoOu5hOuKlCDsmrDrpqzqsIAg7Zuo7JSsIOuNlCDrp47snbQg64K06rOgIOyeiOydhOq5jOyalD8iLCAiY2F0ZWdvcnkiOiAiaW5zaWdodHMiLCAiY292ZXJfaW1hZ2UiOiBudWxsLCAiZmVhdHVyZWRfbGF3eWVyX2lkIjogbnVsbCwgInRhZ3MiOiBbIuuzgO2YuOyCrOuniOy8gO2MhSJdLCAiaXNfcHVibGlzaGVkIjogdHJ1ZSwgImF1dGhvciI6ICLroZzrgqDrk5wg7JeQ65SU7YSwIiwgImF1dGhvcl9pbWFnZSI6ICIvbG9nby5wbmciLCAicG9zdF90eXBlIjogIkFETUlOIiwgImNyZWF0ZWRfYXQiOiAiMjAyNi0wMi0yMlQwMTozNzozNi45MzQwNjQiLCAidXBkYXRlZF9hdCI6ICIyMDI2LTAyLTIyVDAxOjM3OjM2LjkzNDA2NCJ9LCB7ImlkIjogIjA0ODkwNmVkIiwgInRpdGxlIjogIuuCtCDquIDroZwg65Ok7Ja07JioIOydmOuisOyduCwg7JmcIOuLpOuluCDrs4DtmLjsgqzsl5Dqsowg7IOB64u067Cb6rOgIOyeiOydhOq5jD8iLCAiY29udGVudCI6ICJcblxu67OA7Zi47IKs64uY6ruY7IScIOuwlOyBnCDsnqztjJAg7J287KCV7J2EIOyqvOqwnOyWtCDsoJXshLHsiqTrn73qsowg7J6R7ISx7ZWcIOuyleuloCDsubzrn7zqs7wg7Iq57IaMIOyCrOuhgC4g6re4IOq4gOydhCDsnb3qs6Ag7KCI67CV7ZWcIOyLrOygleycvOuhnCDsnKDsnoXrkJwg7J2Y66Kw7J247J20LCDsoJXsnpEg6riA7J2EIOyTtCDrs4DtmLjsgqzri5jsnbQg7JWE64uMIOuLpOuluCDrs4DtmLjsgqzsl5Dqsowg7IOB64u07J2EIOuwm+qzoCDsiJjsnoQg6rOE7JW97J2EIOunuuuKlCDtmanri7ntlZwg7IOB7Zmp7J2EIOqyquyWtOuztOyngCDslYrsnLzshajsirXri4jquYw/XG5cbiMjIOq4sOyhtCDrpqzqsbgg7ZSM656r7Y+865Ok7J2YIOq1kOusmO2VnCDsi5zsiqTthZwg6rWs7KGw6rCAIOuwlOuhnCDqt7gg7JuQ7J247J6F64uI64ukLlxuXG7rs4DtmLjsgqzri5jsnZgg7ZS865WAIOyWtOumsCDsvZjthZDsuKDripQg7Jik7KeBIOuzgO2YuOyCrOuLmOydhCDsnITtlbQg7JOw7Jes7JW8IOuniOuVhe2VqeuLiOuLpC4g7ZWY7KeA66eMIOq4sOyhtCDtlIzrnqvtj7zrk6TsnYAg67OA7Zi47IKs64uY7J2YIOq4gOydhCDsnpDsi6Drk6TsnZgg7ZSM656r7Y+8IOyghOyytCDtirjrnpjtlL3snYQg64qY66as6riwIOychO2VnCDrr7jrgbzroZwg7IKs7Jqp7ZWp64uI64ukLiDrs4DtmLjsgqzri5jsnZgg66qF66y47J6l7Jy866GcIOydmOuisOyduOydhCDsnKDsnbjtlbQg64aT6rOg7ISgLCDqtZDrrJjtlZjqsowg64uk66W4IOuzgO2YuOyCrOuTpOydmCDrpqzsiqTtirjrpbwg65Ok7J2067CA66mwIO2UjOueq+2PvCDrgrTsl5DshJwg67KV66WgIOyHvO2VkeydhCDtlZjrj4TroZ0g7Jyg64+E7ZWp64uI64ukLiDqsrDqta0g6rSR6rOg67mE66W8IOuNlCDrp47snbQg64K4IOuLpOuluCDrs4DtmLjsgqzrk6Tsl5Dqsowg7J2Y66Kw7J247J2EIOu5vOyVl+q4sOuKlCDrtojtlanrpqztlZwg6rWs7KGw6rCAIOuwmOuzteuQmOqzoCDsnojsirXri4jri6QuXG5cbuyerOyjvOuKlCDrs4DtmLjsgqzri5jsnbQg67aA66as6rOgIOydtOuTneydgCDtlIzrnqvtj7zqs7wg7YOAIOuzgO2YuOyCrOqwgCDssZnquLDripQg7J20IOq4sO2YleyggeyduCDqtazsobAsIOyWuOygnOq5jOyngCDsp4DsvJzrp4wg67O07Iuc6rKg7Iq164uI6rmMP1xuXG7rs4DtmLjsgqzri5jsnZgg6riA66GcIOycoOyeheydtCDrkJDri6TrqbQsIOydmOuisOyduOydgCDri7nsl7Dtnogg67OA7Zi47IKs64uY7JeQ6rKMIOqwgOyVvCDtlanri4jri6QuIOuhnOuCoOuTnOuKlCDsnbQg64u57Jew7ZWcIOyDgeyLneydhCDsi5zsiqTthZzsnZgg6riw67O4IOybkOy5meycvOuhnCDsgrzslZjsirXri4jri6QuXG5cbuuhnOuCoOuTnOuKlCDrs4DtmLjsgqzri5jsnZgg7Iq57IaMIOyCrOuhgOyZgCDsubzrn7zsnYQg7J297J2AIOydmOuisOyduOydtCDri6Trpbgg6rOz7Jy866GcIOydtO2DiO2VmOyngCDslYrrj4TroZ0sIOuzgO2YuOyCrOuLmOqzvCDsponsi5wg7IOB64u07ZWgIOyImCDsnojripQg64uk7J2066CJ7Yq4IOunpOy5rSDqtazsobDrpbwg7KCc6rO17ZWp64uI64ukLiDrs4DtmLjsgqzri5jqu5jshJwg7YCE66as7YuwIOuGkuydgCDrspXrpaAg7KCV67O0IOq4gOydhCDsjajso7zsi5zrqbQsIOuhnOuCoOuTnOydmCBBSeqwgCDsnbTrpbwg67aE7ISd7ZWY7JesIOy2lOyynCDsi5zsiqTthZzsl5Ag67CY7JiB7ZWY6rOgIOq1rOq4gOyXkCDrhbjstpzsi5zsvJwg7JWV64+E7KCB7J24IOyhsO2ajOyImOulvCDrp4zrk6TslrTrg4Xri4jri6QuIOq3uOumrOqzoCDqt7gg7KGw7ZqM7IiY64qUIOyYpOuhr+ydtCDrs4DtmLjsgqzri5gg7ZWcIOu2hOunjOydmCDsmKjsoITtlZwg7IiY7J6EIOq4sO2ajOuhnCDsoITtmZjrkKnri4jri6QuXG5cbuuzgO2YuOyCrOuLmOydmCDsvZjthZDsuKDripQg7Jik7KeBIOuzgO2YuOyCrOuLmOyXkOqyjOunjCDsnKDsmqntlbTslbwg7ZWp64uI64ukLiDroZzrgqDrk5zsl5Ag6riw66Gd7ZWY64qUIOuqqOuToCDquIDsnYAg7ZSM656r7Y+87J2YIOuwsOulvCDrtojrpqzripQg7IiY64uo7J20IOyVhOuLjCwg67OA7Zi47IKs64uY7J2YIOyYgeq1rOyggeyduCDtj6ztirjtj7TrpqzsmKTsnbTsnpAg64+F7KCQ7KCB7J24IOuniOy8gO2MhSDsnpDsgrDsnbQg65CgIOqyg+yeheuLiOuLpC4iLCAic3VtbWFyeSI6ICLrs4DtmLjsgqzri5jqu5jshJwg67CU7IGcIOyerO2MkCDsnbzsoJXsnYQg7Kq86rCc7Ja0IOygleyEseyKpOufveqyjCDsnpHshLHtlZwg67KV66WgIOy5vOufvOqzvCDsirnshowg7IKs66GALiDqt7gg6riA7J2EIOydveqzoCDsoIjrsJXtlZwg7Ius7KCV7Jy866GcIOycoOyeheuQnCDsnZjrorDsnbjsnbQsIOygleyekSDquIDsnYQg7JO0IOuzgO2YuOyCrOuLmOydtCDslYTri4wg64uk66W4IOuzgO2YuOyCrOyXkOqyjCDsg4Hri7TsnYQg67Cb6rOgIOyImOyehCDqs4Tslb3snYQg66e664qUIO2ZqeuLue2VnCDsg4HtmansnYQg6rKq7Ja067O07KeAIOyViuycvOyFqOyKteuLiOq5jD8iLCAiY2F0ZWdvcnkiOiAiaW5zaWdodHMiLCAiY292ZXJfaW1hZ2UiOiBudWxsLCAiZmVhdHVyZWRfbGF3eWVyX2lkIjogbnVsbCwgInRhZ3MiOiBbIuuzgO2YuOyCrOyDgeuLtCJdLCAiaXNfcHVibGlzaGVkIjogdHJ1ZSwgImF1dGhvciI6ICLroZzrgqDrk5wg7JeQ65SU7YSwIiwgImF1dGhvcl9pbWFnZSI6ICIvbG9nby5wbmciLCAicG9zdF90eXBlIjogIkFETUlOIiwgImNyZWF0ZWRfYXQiOiAiMjAyNi0wMi0yMlQwMTozOTowNi4wNTg4NzciLCAidXBkYXRlZF9hdCI6ICIyMDI2LTAyLTIyVDAxOjM5OjA2LjA1ODg3NyJ9XQ==").decode("utf-8"))

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
            # 로컬 데이터가 더 풍부하면 Supabase 업데이트 (이전 배포에서 요약본이 동기화된 경우 복구)
            if len(json_posts) > 0:
                sb_total = sum(len(p.get("content", "")) for p in sb_posts)
                local_total = sum(len(p.get("content", "")) for p in json_posts)
                if local_total > sb_total * 1.5:
                    print(f"🔄 로컬 데이터가 더 풍부함 (Supabase: {sb_total}자 vs 로컬: {local_total}자) → 강제 동기화")
                    for post in json_posts:
                        _upsert_to_supabase(post)
                    print(f"✅ 전체 내용 Supabase 동기화 완료 ({len(json_posts)}개)")
                    return json_posts
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
