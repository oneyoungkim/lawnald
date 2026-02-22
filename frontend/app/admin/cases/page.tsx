"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";

interface PiiWarning {
    type: string;
    msg: string;
}

interface CaseOriginal {
    id: string;
    lawyer_id: string;
    client_name: string;
    client_phone: string;
    case_number: string;
    judge_name: string;
    full_text: string;
    submitted_at: string;
    status: string;
}

interface CaseDeid {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    case_type: string;
    field: string;
    result: string;
    stage: string;
    facts: string[];
    legal_points: string[];
    outcome_reason: string;
    deid_level: string;
    is_public: boolean;
}

interface AdminCaseData {
    original: CaseOriginal;
    deid: CaseDeid | null;
    pii_warnings: PiiWarning[];
}

export default function CaseAdminPage() {
    const [cases, setCases] = useState<AdminCaseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<AdminCaseData | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/cases/admin`);
            if (res.ok) {
                const data = await res.json();
                setCases(data);
            }
        } catch (error) {
            console.error("Failed to fetch cases", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleUpdateStatus = async (caseId: string, status: string, feedback?: string) => {
        if (!confirm(`사례 상태를 '${status}'(으)로 변경하시겠습니까?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/cases/${caseId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback })
            });
            if (res.ok) {
                alert("상태가 변경되었습니다.");
                fetchCases();
                setSelectedCase(null);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const filteredCases = cases.filter(c => {
        if (filterStatus !== "all" && c.original.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                c.original.lawyer_id.toLowerCase().includes(q) ||
                (c.deid?.title.toLowerCase().includes(q) || "") ||
                (c.deid?.summary.toLowerCase().includes(q) || "")
            );
        }
        return true;
    });

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1d1d1f] dark:text-gray-100 p-8 font-sans">
            <header className="flex justify-between items-center max-w-7xl mx-auto mb-10">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Case Admin</h1>
                    <p className="text-[#86868b] font-medium text-sm mt-1">승소사례 비식별 데이터 관리</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/dashboard" className="px-5 py-2.5 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                        대시보드
                    </Link>
                    <button onClick={fetchCases} className="p-2.5 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex gap-6 h-[80vh]">

                {/* Left: Filter & List */}
                <div className="w-1/3 flex flex-col gap-4">
                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl shadow-sm flex flex-col gap-3">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="변호사ID, 제목, 내용 검색"
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/50 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 text-sm overflow-x-auto pb-1">
                            {["all", "pending", "approved", "rejected"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-colors ${filterStatus === s
                                        ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-black font-semibold"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Case List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {filteredCases.map((item) => (
                            <div
                                key={item.original.id}
                                onClick={() => setSelectedCase(item)}
                                className={`p-5 rounded-2xl cursor-pointer transition-all border-2 ${selectedCase?.original.id === item.original.id
                                    ? "bg-white dark:bg-[#1c1c1e] border-[#007aff] shadow-md"
                                    : "bg-white dark:bg-[#1c1c1e] border-transparent hover:border-gray-200 dark:hover:border-zinc-700 shadow-sm"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.original.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        item.original.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {item.original.status}
                                    </span>
                                    <span className="text-xs text-gray-400">{item.original.submitted_at.substring(0, 10)}</span>
                                </div>
                                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">
                                    {item.deid?.title || "제목 없음"}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2 truncate">{item.original.lawyer_id}</p>

                                {item.pii_warnings.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit">
                                        <ExclamationTriangleIcon className="w-3 h-3" />
                                        PII 경고 {item.pii_warnings.length}건
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Comparision View */}
                <div className="w-2/3 bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-lg border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col">
                    {selectedCase ? (
                        <>
                            {/* Toolbar */}
                            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                                <h2 className="font-semibold">검토 및 승인</h2>
                                <div className="flex gap-2">
                                    {selectedCase.original.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedCase.original.id, "approved")}
                                                className="px-4 py-2 bg-[#34c759] text-white rounded-lg text-sm font-semibold hover:bg-[#2dbb50] flex items-center gap-1.5"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" /> 승인
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedCase.original.id, "rejected", "개인정보 포함")}
                                                className="px-4 py-2 bg-[#ff3b30] text-white rounded-lg text-sm font-semibold hover:bg-[#d63028] flex items-center gap-1.5"
                                            >
                                                <XCircleIcon className="w-4 h-4" /> 반려
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
                                {/* Original (Sensitive) */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-2 mb-4 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">원본 데이터 (관리자용)</h3>
                                    </div>

                                    <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">의뢰인</label>
                                                <div className="font-medium bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">{selectedCase.original.client_name}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">연락처</label>
                                                <div className="font-medium bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">{selectedCase.original.client_phone}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">사건번호</label>
                                                <div className="font-medium bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">{selectedCase.original.case_number}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">판사</label>
                                                <div className="font-medium bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">{selectedCase.original.judge_name}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1 font-bold">전문 (Full Text)</label>
                                            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl leading-relaxed whitespace-pre-wrap border border-gray-100 dark:border-zinc-700 text-xs">
                                                {selectedCase.original.full_text}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-[1px] bg-gray-200 dark:bg-zinc-700 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1c1c1e] p-2 border border-gray-200 dark:border-zinc-700 rounded-full">
                                        <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* De-identified (Public) */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-2 mb-4 bg-green-50 dark:bg-green-900/10 p-2 rounded-lg border border-green-100 dark:border-green-900/20">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        <h3 className="font-bold text-green-700 dark:text-green-400 text-sm">비식별 노출용 (공개)</h3>
                                    </div>

                                    {selectedCase.pii_warnings.length > 0 && (
                                        <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 mb-4">
                                            <p className="font-bold flex items-center gap-1.5 mb-2">
                                                <ExclamationTriangleIcon className="w-4 h-4" />
                                                재식별 위험 감지
                                            </p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {selectedCase.pii_warnings.map((w, i) => (
                                                    <li key={i}>{w.msg} ({w.type})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedCase.deid ? (
                                        <div className="space-y-5 text-sm">
                                            <div>
                                                <div className="text-xl font-bold mb-2">{selectedCase.deid.title}</div>
                                                <div className="text-gray-600 dark:text-gray-400">{selectedCase.deid.summary}</div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {selectedCase.deid.tags.map(t => (
                                                    <span key={t} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium">#{t}</span>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                                                    <span className="text-gray-500 block mb-1">분야</span>
                                                    <span className="font-semibold">{selectedCase.deid.field}</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                                                    <span className="text-gray-500 block mb-1">결과</span>
                                                    <span className="font-semibold text-blue-600">{selectedCase.deid.result}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                                                <h4 className="font-bold mb-2">핵심 쟁점</h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                    {selectedCase.deid.facts.map((f, i) => <li key={i}>{f}</li>)}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold mb-2">법리적 포인트</h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                    {selectedCase.deid.legal_points.map((p, i) => <li key={i}>{p}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-gray-300">
                                            비식별 데이터가 생성되지 않았습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col text-[#86868b] gap-4">
                            <AdjustmentsHorizontalIcon className="w-12 h-12 opacity-20" />
                            <p>좌측 목록에서 검토할 사례를 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
