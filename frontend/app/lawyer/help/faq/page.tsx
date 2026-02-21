"use client";

import { useState } from "react";
import Link from "next/link";
import LawyerMenu from "../../../components/LawyerMenu";

const faqs = [
    {
        category: "시작하기",
        items: [
            {
                q: "로날드는 어떤 서비스인가요?",
                a: "로날드는 AI가 의뢰인의 사연을 분석하여, 해당 사건에 가장 적합한 변호사를 자동으로 추천하는 서비스입니다. 기존 광고비 입찰 방식이 아닌, 변호사님의 실제 전문성과 승소 사례를 기반으로 매칭합니다. 변호사님은 별도 광고비 없이 양질의 의뢰인을 확보할 수 있습니다."
            },
            {
                q: "비용이 발생하나요?",
                a: "기본 프로필 등록과 승소 사례 게시는 무료입니다. 프리미엄 플랜에 가입하시면 상세 통계, 우선 매칭, 마케팅 도구 등 추가 기능을 이용하실 수 있습니다. 대시보드의 구독 관리에서 플랜을 확인하세요."
            },
            {
                q: "어떻게 의뢰인을 받게 되나요?",
                a: "의뢰인이 자신의 법률 문제를 입력하면, AI가 변호사님의 승소 사례·전문 분야·콘텐츠를 분석하여 추천 순위를 매깁니다. 추천된 의뢰인은 1:1 채팅을 통해 직접 상담을 요청합니다. 대시보드에 접속 중이시면 실시간으로 알림을 받을 수 있습니다."
            },
        ]
    },
    {
        category: "추천 알고리즘",
        items: [
            {
                q: "추천 순위는 어떻게 결정되나요?",
                a: "로날드 AI는 (1) 의뢰인 사연과 변호사님 승소 사례의 유사도(75%), (2) 전문 분야 매칭(25%), (3) 콘텐츠 보너스(+10%), (4) 접속 상태 보너스(+10%)를 종합하여 최종 점수를 산출합니다. 광고비나 가입 순서는 점수에 전혀 영향을 주지 않습니다."
            },
            {
                q: "접속 중이면 정말 유리한가요?",
                a: "네. 대시보드에 접속 중인 변호사는 AI 추천 점수에 10%의 가산점을 받습니다. 또한 의뢰인 화면에 '현재 접속 중 · 즉시 상담 가능' 배지가 표시되어, 의뢰인이 즉시 채팅 상담을 시작할 수 있습니다. 실제로 접속 중인 변호사의 상담 전환율이 약 3배 높습니다."
            },
            {
                q: "승소 사례를 더 많이 올리면 유리한가요?",
                a: "맞습니다. 다만 양보다는 질이 중요합니다. AI는 의뢰인 사연과의 '유사도'를 계산하므로, 다양한 유형의 사례를 구체적으로 작성할수록 더 많은 의뢰인에게 매칭됩니다. 자세한 작성법은 '승소사례 작성 가이드'를 참고하세요."
            },
        ]
    },
    {
        category: "콘텐츠 관리",
        items: [
            {
                q: "블로그 글을 가져올 수 있나요?",
                a: "네! 대시보드 상단의 '스마트 블로그 불러오기' 기능을 사용하면, 네이버 블로그 URL을 붙여넣기만 하면 AI가 자동으로 내용을 분석하여 SEO 최적화된 제목, 카테고리, 키워드, 그리고 AI 삽화까지 자동 생성합니다. 약 30초면 프리미엄 매거진 칼럼이 완성됩니다."
            },
            {
                q: "매거진 칼럼은 어디에 노출되나요?",
                a: "발행된 칼럼은 로날드 인사이트 매거진 섹션에 공개됩니다. 또한 관련 사건의 의뢰인에게 변호사 카드 내에서 '관련 전문 칼럼'으로 자동 노출됩니다. SEO 최적화가 되어 있어 네이버, 구글 검색에서도 유입이 발생합니다."
            },
            {
                q: "콘텐츠별 AI 점수가 다른가요?",
                a: "네. 저서(책) 5점, 강의·세미나 3점, 칼럼·매거진 2점, 블로그·유튜브 1점으로 차등 적용됩니다. 점수가 높을수록 AI 추천에서 유리하지만, 어떤 콘텐츠든 없는 것보다는 있는 것이 훨씬 좋습니다."
            },
        ]
    },
    {
        category: "채팅 상담",
        items: [
            {
                q: "의뢰인과의 채팅은 어떻게 하나요?",
                a: "대시보드 좌측 메뉴의 '채팅 관리'에서 모든 채팅 이력을 확인하고 응답할 수 있습니다. 새 채팅이 도착하면 화면 하단에 실시간 알림이 표시됩니다. 빠른 응답이 수임 전환율을 높이는 핵심 요소입니다."
            },
            {
                q: "채팅 내용은 안전한가요?",
                a: "모든 채팅 내용은 암호화되어 전송되며, 변호사님과 해당 의뢰인만 열람할 수 있습니다. 로날드 운영진은 채팅 내용에 접근하지 않습니다."
            },
        ]
    },
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

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
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                        ❓ FAQ
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        자주 묻는 질문
                    </h1>
                    <p className="text-lg text-[#86868b] leading-relaxed">
                        로날드 이용에 대해 궁금한 점을 모았습니다.
                    </p>
                </div>

                {/* FAQ Sections */}
                <div className="space-y-8">
                    {faqs.map((section, si) => (
                        <section key={si}>
                            <h2 className="text-sm font-semibold text-[#86868b] uppercase tracking-wide mb-3">{section.category}</h2>
                            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
                                {section.items.map((faq, fi) => {
                                    const key = `${si}-${fi}`;
                                    const isOpen = openIndex === key;
                                    return (
                                        <div key={fi}>
                                            <button
                                                onClick={() => setOpenIndex(isOpen ? null : key)}
                                                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <span className="text-sm font-medium">{faq.q}</span>
                                                <svg
                                                    className={`w-4 h-4 text-[#86868b] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-5">
                                                    <p className="text-sm text-[#86868b] leading-relaxed">{faq.a}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Contact CTA */}
                <section className="mt-12 bg-gradient-to-br from-[#007aff]/5 to-purple-500/5 rounded-2xl p-8 text-center border border-[#007aff]/10">
                    <h3 className="text-xl font-bold mb-2">답변을 찾지 못하셨나요?</h3>
                    <p className="text-sm text-[#86868b] mb-6">
                        운영팀이 근무 시간 내 빠르게 답변드립니다.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <a href="mailto:support@lawnald.com" className="bg-[#007aff] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0066d6] transition-colors shadow-lg shadow-[#007aff]/20">
                            ✉️ 이메일 문의
                        </a>
                        <a href="tel:02-123-4567" className="bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white px-6 py-3 rounded-xl font-semibold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            📞 전화 상담 (평일 10-18시)
                        </a>
                    </div>
                </section>
            </div>
        </main>
    );
}
