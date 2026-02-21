import { NextRequest, NextResponse } from 'next/server';

// 차단할 봇 User-Agent 패턴 (스크래퍼/크롤러)
const BLOCKED_BOTS = [
    'HTTrack',
    'wget',
    'curl',
    'python-requests',
    'scrapy',
    'Go-http-client',
    'Java/',
    'libwww-perl',
    'Mechanize',
    'PhantomJS',
    'HeadlessChrome',
    'Puppeteer',
    'Selenium',
    'SiteCloner',
    'WebCopier',
    'WebZIP',
    'Teleport',
    'LinksCrawler',
    'Offline Explorer',
    'httpx',
];

// 요청 속도 제한 (간이 인메모리 — 프로덕션에서는 Redis 사용 권장)
const rateMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 60;        // 60 requests
const RATE_WINDOW = 60_000;   // per 60 seconds

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateMap.get(ip);

    if (!entry || (now - entry.ts) > RATE_WINDOW) {
        rateMap.set(ip, { count: 1, ts: now });
        return true;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT) {
        return false;
    }
    return true;
}

// 주기적 정리 (메모리 누수 방지)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of rateMap.entries()) {
            if ((now - entry.ts) > RATE_WINDOW * 2) {
                rateMap.delete(ip);
            }
        }
    }, RATE_WINDOW);
}

export function middleware(request: NextRequest) {
    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '0.0.0.0';
    const path = request.nextUrl.pathname;

    // 1. 봇/스크래퍼 차단
    const isBlocked = BLOCKED_BOTS.some(bot =>
        ua.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBlocked) {
        return new NextResponse('Access Denied', { status: 403 });
    }

    // 2. API 요청 속도 제한
    if (path.startsWith('/api/') || path.startsWith('/_next/')) {
        if (!checkRateLimit(ip)) {
            return new NextResponse(
                JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // 3. /.env, /.git 등 민감 파일 접근 차단
    const blocked = ['.env', '.git', 'wp-admin', 'wp-login', '.php'];
    if (blocked.some(p => path.includes(p))) {
        return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.next();
}

// 미들웨어 적용 경로 (정적 파일 제외)
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|logo.png|icon-v2.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
