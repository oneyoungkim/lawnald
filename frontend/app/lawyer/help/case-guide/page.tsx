"use client";

import Link from "next/link";
import LawyerMenu from "../../../components/LawyerMenu";

export default function CaseGuidePage() {
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
                    <div className="inline-flex items-center gap-2 bg-[#007aff]/10 text-[#007aff] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                        📝 가이드
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                        승소 사례, 이렇게 쓰면<br />
                        <span className="text-[#007aff]">의뢰인이 먼저 연락합니다</span>
                    </h1>
                    <p className="text-lg text-[#86868b] leading-relaxed">
                        로날드 AI는 변호사님의 승소 사례를 분석하여, 유사한 고민을 가진 의뢰인에게 자동으로 추천합니다.
                        좋은 사례 하나가 수십 건의 상담 문의로 이어질 수 있습니다.
                    </p>
                </div>

                {/* Content */}
                <article className="space-y-10">

                    {/* Section 1 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#007aff] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            제목은 '결과'로 시작하세요
                        </h2>
                        <p className="text-[#86868b] leading-relaxed mb-4">
                            의뢰인은 자신과 비슷한 상황에서 <strong className="text-[#1d1d1f] dark:text-white">어떤 결과가 나왔는지</strong>에 가장 관심이 많습니다.
                            "무죄 판결", "양육권 취득", "손해배상 3억 인용" 등 결과 중심으로 제목을 작성하면
                            AI 매칭률과 클릭률이 모두 높아집니다.
                        </p>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
                            <p className="text-xs font-bold text-[#86868b] mb-2 uppercase tracking-wide">예시</p>
                            <p className="text-red-400 text-sm line-through mb-1">❌ 형사 사건 변호 사례</p>
                            <p className="text-emerald-500 text-sm font-medium">✅ 음주운전 2회 적발, 집행유예로 실형 면한 사례</p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#007aff] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                            '상황 → 전략 → 결과' 3단 구조를 지키세요
                        </h2>
                        <p className="text-[#86868b] leading-relaxed mb-4">
                            AI가 사례를 분석할 때 이 세 가지 요소를 추출합니다. 구조가 명확할수록 유사 사건 매칭 정확도가 올라갑니다.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 text-center">
                                <div className="text-2xl mb-2">😰</div>
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">상황</p>
                                <p className="text-xs text-[#86868b]">의뢰인의 문제와 감정</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30 text-center">
                                <div className="text-2xl mb-2">⚖️</div>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">전략</p>
                                <p className="text-xs text-[#86868b]">핵심 법리와 접근법</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 text-center">
                                <div className="text-2xl mb-2">🏆</div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">결과</p>
                                <p className="text-xs text-[#86868b]">승소·합의 등 구체적 수치</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#007aff] text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                            승소 사례가 많을수록 AI 점수가 높아집니다
                        </h2>
                        <p className="text-[#86868b] leading-relaxed mb-4">
                            로날드 추천 알고리즘은 변호사님의 <strong className="text-[#1d1d1f] dark:text-white">승소 사례 수</strong>와
                            <strong className="text-[#1d1d1f] dark:text-white">전문 콘텐츠</strong>를 합산하여 점수를 매깁니다.
                            사례가 쌓일수록 더 많은 의뢰인에게 노출됩니다.
                        </p>
                        <div className="bg-gradient-to-r from-[#007aff]/5 to-emerald-500/5 rounded-xl p-5 border border-[#007aff]/10">
                            <p className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-3">📊 콘텐츠별 AI 점수 가중치</p>
                            <div className="space-y-2">
                                {[
                                    { label: "저서 (책)", score: "5점", bar: "100%" },
                                    { label: "강의·세미나", score: "3점", bar: "60%" },
                                    { label: "칼럼·매거진", score: "2점", bar: "40%" },
                                    { label: "블로그·유튜브", score: "1점", bar: "20%" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs text-[#86868b] w-24 shrink-0">{item.label}</span>
                                        <div className="flex-1 h-5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#007aff] to-emerald-500 rounded-full" style={{ width: item.bar }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-[#007aff] w-8">{item.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center py-8">
                        <p className="text-[#86868b] text-sm mb-6">
                            지금 바로 승소 사례를 등록하고, 의뢰인의 연락을 받아보세요.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/lawyer/submit" className="bg-[#007aff] text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#0066d6] transition-colors shadow-lg shadow-[#007aff]/20">
                                승소 사례 등록하기
                            </Link>
                            <Link href="/lawyer/magazine" className="bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white px-8 py-3.5 rounded-xl font-semibold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                매거진 칼럼 쓰기
                            </Link>
                        </div>
                    </section>
                </article>
            </div>
        </main>
    );
}
