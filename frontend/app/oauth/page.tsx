// OAuth 메인 페이지 — /oauth/callback 으로 리다이렉트 처리됨
import { redirect } from "next/navigation";
export default function OAuthPage() {
    redirect("/login");
}
