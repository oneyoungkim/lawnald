"use client";

import Link from "next/link";
import LawyerMenu from "../../../components/LawyerMenu";

export default function ProfileBoostGuidePage() {
    return (
        <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] text-[#1d1d1f] dark:text-white font-sans">
            <LawyerMenu />
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Back */}
                <Link href="/lawyer/dashboard" className="text-sm text-[#86868b] hover:text-[#007aff] transition-colors mb-8 inline-flex items-center gap-1">
                    ← 대시보드로 돌아가기
                </Link>

                {/* Hero */}
                <div className="mt-6 mb-12">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                        🚀 성장 전략
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                        AI 추천 순위를 높이는<br />
                        <span className="text-emerald-500">5가지 핵심 전략</span>
                    </h1>
                    <p className="text-lg text-[#86868b] leading-relaxed">
                        로날드는 변호사님의 전문성을 AI가 자동으로 평가합니다.
                        아래 다섯 가지만 실천하면, 같은 분야 변호사 중 상위에 노출됩니다.
                    </p>
                </div>

                {/* Content */}
                <article className="space-y-6">

                    {/* Strategy 1: 접속 상태 유지 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[80px]"></div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                🟢
                            </div>
                            <div>
                                <h2 className="text-lg font-bold mb-2">전략 1. 대시보드에 접속해두세요</h2>
                                <p className="text-[#86868b] leading-relaxed text-sm mb-3">
                                    대시보드에 접속 중인 변호사는 <strong className="text-emerald-600 dark:text-emerald-400">AI 추천 점수가 10% 가산</strong>됩니다.
                                    의뢰인 화면에는 <span className="text-emerald-600 dark:text-emerald-400 font-medium">"현재 접속 중 · 즉시 상담 가능"</span> 배지가 표시됩니다.
                                </p>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        💡 <strong>TIP:</strong> 업무 시간에 대시보드 탭을 열어둬도 자동으로 접속 상태가 유지됩니다.
                                        실시간 채팅 알림도 바로 받을 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Strategy 2: 승소 사례 등록 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                ⚖️
                            </div>
                            <div>
                                <h2 className="text-lg font-bold mb-2">전략 2. 승소 사례를 꾸준히 등록하세요</h2>
                                <p className="text-[#86868b] leading-relaxed text-sm mb-3">
                                    의뢰인이 사연을 입력하면, AI가 변호사님의 승소 사례와 <strong className="text-[#1d1d1f] dark:text-white">유사도를 계산</strong>합니다.
                                    사례가 많을수록 다양한 쿼리에 매칭될 확률이 높아집니다.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Link href="/lawyer/submit" className="text-xs font-bold text-[#007aff] bg-[#007aff]/10 px-3 py-1.5 rounded-lg hover:bg-[#007aff]/20 transition-colors">
                                        사례 등록하기 →
                                    </Link>
                                    <Link href="/lawyer/help/case-guide" className="text-xs font-bold text-[#86868b] bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        작성 가이드 보기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Strategy 3: 매거진 칼럼 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                📰
                            </div>
                            <div>
                                <h2 className="text-lg font-bold mb-2">전략 3. 전문 칼럼을 발행하세요</h2>
                                <p className="text-[#86868b] leading-relaxed text-sm mb-3">
                                    매거진 칼럼은 <strong className="text-[#1d1d1f] dark:text-white">AI 점수 2점</strong>을 받습니다.
                                    네이버 블로그에 이미 쓴 글이 있다면 <strong className="text-[#1d1d1f] dark:text-white">"스마트 불러오기"</strong>로
                                    URL만 붙여넣으면 AI가 자동으로 윤문·편집·삽화 생성까지 해드립니다.
                                </p>
                                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                                    <p className="text-xs text-purple-700 dark:text-purple-400">
                                        💡 <strong>TIP:</strong> 블로그 URL 하나로 30초 만에 프리미엄 매거진 칼럼이 완성됩니다.
                                        별도 글쓰기가 필요 없습니다.
                                    </p>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Link href="/lawyer/magazine" className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors">
                                        매거진 관리 →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Strategy 4: 프로필 완성 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                👤
                            </div>
                            <div>
                                <h2 className="text-lg font-bold mb-2">전략 4. 프로필 사진과 소개글을 채우세요</h2>
                                <p className="text-[#86868b] leading-relaxed text-sm mb-3">
                                    사진이 있는 변호사 카드는 신뢰도가 높아 의뢰인의 클릭률이 <strong className="text-[#1d1d1f] dark:text-white">3배 이상</strong> 높습니다.
                                    소개글에는 전문 분야와 경력, 그리고 변호사님만의 철학을 1~2줄로 적어주세요.
                                </p>
                                <Link href="/lawyer/profile" className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
                                    프로필 수정하기 →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Strategy 5: 빠른 응답 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                ⚡
                            </div>
                            <div>
                                <h2 className="text-lg font-bold mb-2">전략 5. 채팅에 빠르게 응답하세요</h2>
                                <p className="text-[#86868b] leading-relaxed text-sm">
                                    의뢰인은 여러 변호사에게 동시에 문의합니다.
                                    <strong className="text-[#1d1d1f] dark:text-white">가장 먼저 답변하는 변호사</strong>가
                                    실제 수임으로 이어질 확률이 압도적으로 높습니다.
                                    대시보드에서 실시간 알림을 받고 바로 응답하세요.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Summary Score Table */}
                    <section className="bg-gradient-to-br from-[#007aff]/5 to-emerald-500/5 rounded-2xl p-8 border border-[#007aff]/10">
                        <h3 className="text-lg font-bold mb-4 text-center">📈 로날드 AI 추천 점수 구성</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[#86868b] border-b border-gray-200 dark:border-white/10">
                                        <th className="text-left py-2 font-medium">요소</th>
                                        <th className="text-center py-2 font-medium">비중</th>
                                        <th className="text-left py-2 font-medium">높이는 방법</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#1d1d1f] dark:text-gray-300">
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 font-medium">사례 유사도</td>
                                        <td className="py-3 text-center font-bold text-[#007aff]">75%</td>
                                        <td className="py-3 text-[#86868b]">다양한 승소 사례 등록</td>
                                    </tr>
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 font-medium">전문 분야 매칭</td>
                                        <td className="py-3 text-center font-bold text-[#007aff]">25%</td>
                                        <td className="py-3 text-[#86868b]">전문 분야 정확히 설정</td>
                                    </tr>
                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 font-medium">콘텐츠 보너스</td>
                                        <td className="py-3 text-center font-bold text-emerald-500">+10%</td>
                                        <td className="py-3 text-[#86868b]">칼럼, 블로그, 유튜브 등</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-medium">접속 보너스</td>
                                        <td className="py-3 text-center font-bold text-emerald-500">+10%</td>
                                        <td className="py-3 text-[#86868b]">대시보드에 접속 중일 때</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </article>
            </div>
        </main>
    );
}
