"use client";

import { API_BASE } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminApprovalsPage() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("${API_BASE}/api/admin/drafts")
            .then(res => res.json())
            .then(data => {
                setDrafts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleStatusUpdate = async (caseId: string, lawyerId: string, newStatus: "published" | "rejected") => {
        if (!confirm(`${newStatus === "published" ? "승인" : "반려"} 하시겠습니까?`)) return;

        try {
            // For approval, use the new specific endpoint
            if (newStatus === "published") {
                const res = await fetch(`${API_BASE}/api/admin/cases/approve`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ case_id: caseId, lawyer_id: lawyerId })
                });
                if (res.ok) {
                    alert("성공적으로 승인 및 게시되었습니다.");
                    setDrafts(drafts.filter(d => d.id !== caseId));
                } else {
                    alert("승인 실패");
                }
            } else {
                // For rejection, we could add an endpoint later or just mock it here
                alert("반려 기능은 현재 개발 중입니다.");
            }
        } catch (e) {
            console.error(e);
            alert("서버 오류");
        }
    };

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 p-8 font-sans text-zinc-900 dark:text-zinc-100">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">승소사례 승인 관리</h1>
                        <p className="text-zinc-500">AI가 작성한 이야기를 검토하고 적합도 점수를 부여하세요.</p>
                    </div>
                    <Link href="/admin/dashboard" className="px-6 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold shadow-sm hover:bg-zinc-50 transition-all">
                        대시보드
                    </Link>
                </header>

                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium">승인 대기 건을 불러오는 중...</p>
                    </div>
                ) : drafts.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 p-20 rounded-3xl text-center text-zinc-400 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
                        <p className="text-lg">현재 승인 대기 중인 승소사례가 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl shadow-zinc-200/40 dark:shadow-none border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-50 dark:border-zinc-800">
                                    <div className="max-w-[70%]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                                                WINNING CASE
                                            </span>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {draft.lawyer_name} 변호사
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {draft.timestamp || draft.date}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold leading-tight">{draft.title}</h2>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(draft.id, draft.lawyer_id, "rejected")}
                                            className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all text-sm font-black"
                                        >
                                            반려
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(draft.id, draft.lawyer_id, "published")}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm font-black active:scale-95"
                                        >
                                            검토 완료 및 게시
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                        <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-4">AI NARRATIVE STORY</p>
                                        <div className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {draft.content}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs">
                                            <span className="text-zinc-400 block mb-1">Court & Case Number</span>
                                            <span className="font-bold text-zinc-700 dark:text-zinc-300">{draft.court} {draft.case_number}</span>
                                        </div>
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs">
                                            <span className="text-zinc-400 block mb-1">Tags</span>
                                            <span className="font-bold text-blue-600">{(draft.tags || []).join(", ")}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                        <details>
                                            <summary className="text-[10px] font-black text-red-600 cursor-pointer uppercase tracking-widest">View Sensitive Original Text (Anonymized)</summary>
                                            <div className="mt-4 text-[10px] text-zinc-500 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                {draft.full_text}
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
