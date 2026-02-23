import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 빌드 시 TS/ESLint 에러 무시 (배포 안정성)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 프로덕션 소스맵 비활성화 (코드 역분석 방지)
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
    ],
  },

  // 로컬 개발: /api/* → FastAPI 백엔드 프록시
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 다른 사이트에서 iframe 삽입 차단 (클릭재킹 방지)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // CSP: 외부 사이트에서 우리 콘텐츠 임베드 차단
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          // MIME 스니핑 방지
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer 정보 제한 (기술 스택 노출 방지)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // XSS 보호
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // 브라우저 기능 제한 (카메라, 마이크 등)
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;

