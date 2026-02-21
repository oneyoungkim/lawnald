"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function MyCasesPage() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock lawyer ID for now
        fetch("http://localhost:8000/api/cases/my?lawyer_id=lawyer1@example.com")
            .then(res => res.json())
            .then(data => setCases(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
            <header className="flex justify-between items-center max-w-5xl mx-auto mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">내 성공사례 관리</h1>
                    <p className="text-[#86868b]">직접 진행한 승소사례를 등록하고 아카이브 공개 현황을 관리하세요.</p>
                </div>
                <button className="px-5 py-3 bg-main text-white rounded-full font-semibold shadow-lg shadow-main/20 hover:bg-main/90 transition-all flex items-center gap-2 active:scale-95">
                    <PlusIcon className="w-5 h-5" /> 새 사례 등록
                </button>
            </header>

            <div className="max-w-5xl mx-auto">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 animate-pulse">로딩 중...</div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-32 bg-white dark:bg-[#1c1c1e] rounded-[32px] shadow-sm">
                        <p className="text-xl font-semibold text-[#86868b] mb-4">등록된 사례가 없습니다.</p>
                        <p className="text-sm text-gray-400">성공적인 결과로 의뢰인을 도운 경험을 공유해보세요.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {cases.map(({ original, deid }) => (
                            <div key={original.id} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:scale-[1.01] hover:shadow-md">
                                {/* Status Indicator */}
                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                    {original.status === 'approved' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-green-600 uppercase">승인됨</span>
                                        </>
                                    ) : original.status === 'rejected' ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                                <XCircleIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-red-600 uppercase">반려</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                                                <ClockIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-yellow-600 uppercase">검토중</span>
                                        </>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md">
                                            {deid?.field || "분야 미정"}
                                        </span>
                                        <span className="text-xs text-gray-400 mx-1">•</span>
                                        <span className="text-xs text-gray-400">{original.submitted_at.substring(0, 10)} 제출</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1 truncate text-[#1d1d1f] dark:text-white">
                                        {deid?.title || original.client_name + "님 사건 (제목 미정)"}
                                    </h3>
                                    <p className="text-sm text-[#86868b] line-clamp-2">
                                        {deid?.summary || "요약 내역이 없습니다."}
                                    </p>
                                </div>

                                {/* Stats & Actions */}
                                <div className="flex items-center gap-6 md:border-l md:border-gray-100 dark:md:border-zinc-800 md:pl-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold font-mono">{deid?.view_count || 0}</div>
                                        <div className="text-xs text-gray-400 font-medium uppercase">Views</div>
                                    </div>
                                    <button className="px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                        관리
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
