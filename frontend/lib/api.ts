// API 기본 URL 설정
// 배포 환경 (Vercel): 같은 도메인이므로 빈 문자열 (상대 경로 /api/...)
// 로컬 개발: NEXT_PUBLIC_API_URL=http://localhost:8000
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
