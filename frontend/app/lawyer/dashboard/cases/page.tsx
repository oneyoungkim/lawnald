"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

// --- Types ---
interface CaseItem {
    id: string;
    title: string;
    caseNumber: string;
    status: 'published' | 'processing' | 'rejected' | 'draft';
    category: string[];
    date: string;
    views: number;
    summary: string; // For preview
}

// --- Dummy Data ---
const DUMMY_CASES: CaseItem[] = [
    {
        id: "1",
        title: "음주운전 3회차 집행유예 방어 성공 사례",
        caseNumber: "2023고단1234",
        status: "published",
        category: ["형사", "교통범죄"],
        date: "2024.02.15",
        views: 128,
        summary: "의뢰인은 과거 2회의 동종 전력이 있었으나, 본 변호인의 조력으로..."
    },
    {
        id: "2",
        title: "이혼 소송 재산분할 70% 인정 승소",
        caseNumber: "2023드합5678",
        status: "published",
        category: ["이혼", "재산분할"],
        date: "2024.02.10",
        views: 85,
        summary: "혼인 기간 10년, 전업주부였던 의뢰인의 기여도를 입증하여..."
    },
    {
        id: "3",
        title: "AI가 분석 중인 판결문입니다...",
        caseNumber: "2024가합9012",
        status: "processing",
        category: ["민사"],
        date: "2024.02.17",
        views: 0,
        summary: "분석 중..."
    },
    {
        id: "4",
        title: "상가 임대차 보증금 반환 청구 소송",
        caseNumber: "2023가단3456",
        status: "draft",
        category: ["부동산", "임대차"],
        date: "2024.02.05",
        views: 0,
        summary: "임대인의 부당한 원상복구 요구에 대하여..."
    },
    {
        id: "5",
        title: "반려된 게시물: 개인정보 포함",
        caseNumber: "2023고합7890",
        status: "rejected",
        category: ["형사", "성범죄"],
        date: "2024.02.01",
        views: 0,
        summary: "비실명화 처리가 미흡하여 반려되었습니다."
    }
];

export default function CaseManagementPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
    const [lawyerId, setLawyerId] = useState<string | null>(null);

    const fetchCases = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${id}/cases`);
            if (res.ok) {
                const data = await res.json();
                // Map API data to CaseItem
                const mapped: CaseItem[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    caseNumber: item.case_number || "사건번호 없음",
                    status: item.status || (item.verified ? 'published' : 'draft'),
                    category: item.topic_tags || [],
                    date: item.date,
                    views: 0, // Mock for now
                    summary: item.summary || ""
                }));
                setCases(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch cases:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Data on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyerId(parsed.id);
                fetchCases(parsed.id);
            } else {
                setLoading(false);
            }
        }
    }, []);

    const handleDelete = async (id: string) => {
        if (!lawyerId) return;
        if (!confirm("정말 이 승소사례를 삭제하시겠습니까? 복구할 수 없습니다.")) return;

        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lawyerId}/content/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setCases(prev => prev.filter(c => c.id !== id));
                if (selectedCase?.id === id) setSelectedCase(null);
                alert("삭제되었습니다.");
            } else {
                alert("삭제 실패");
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("오류가 발생했습니다.");
        }
    };

    // Filters
    const filters = [
        { id: "all", label: "전체" },
        { id: "criminal", label: "형사" },
        { id: "divorce", label: "이혼/가사" },
        { id: "civil", label: "민사" },
        { id: "estate", label: "부동산" }
    ];

    const filteredCases = activeFilter === "all"
        ? cases
        : cases.filter(c => {
            // Simple keyword matching for now since tags are varying
            const tags = c.category.join(" ");
            if (activeFilter === "criminal") return tags.includes("형사") || tags.includes("성범주") || tags.includes("음주");
            if (activeFilter === "divorce") return tags.includes("이혼") || tags.includes("가사") || tags.includes("상간");
            if (activeFilter === "civil") return tags.includes("민사") || tags.includes("손해배상");
            if (activeFilter === "estate") return tags.includes("부동산") || tags.includes("임대차");
            return true;
        });

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1d1d1f] dark:text-gray-100 font-sans pb-20">
            {/* Header */}
            <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mb-2">
                            나의 승소 기록 <span className="text-gray-400 font-medium ml-2 text-xl">{cases.length}건</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            변호사님의 소중한 승소 경험을 체계적으로 관리하고 홍보하세요.
                        </p>
                    </div>
                </div>

                {/* Controls & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-200/50 dark:bg-zinc-800 rounded-xl">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeFilter === filter.id
                                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="사건명, 판례번호 검색"
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <Link
                            href="/lawyer/dashboard/cases/upload"
                            className="flex items-center gap-2 bg-main hover:bg-main/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-main/20 hover:shadow-main/30 transition-all whitespace-nowrap"
                        >
                            + 새 사례 등록
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">상태</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">사건명 / 정보</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">카테고리</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">등록일</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">반응</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {filteredCases.map((item) => (
                                <tr
                                    key={item.id}
                                    className="group hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedCase(item)}
                                >
                                    <td className="px-6 py-5 align-top">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-5">
                                        {item.status === 'processing' ? (
                                            <div className="space-y-2 animate-pulse">
                                                <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/2"></div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-white mb-1 group-hover:text-[#007aff] transition-colors">
                                                    {item.title}
                                                </h3>
                                                <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                    {item.caseNumber}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.category.map((cat, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md">
                                                    #{cat}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <span className="text-sm text-gray-500 font-medium">{item.date}</span>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        {item.status === 'published' && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                <span>👀</span>
                                                <span className="font-semibold">{item.views}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 align-top text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCases.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FunnelIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">해당 조건의 승소사례가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-over / Modal Mockup */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#1c1c1e] shadow-2xl h-full p-8 overflow-y-auto animate-slide-in-right">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">승소사례 미리보기</h2>
                                <p className="text-sm text-gray-500">{selectedCase.caseNumber}</p>
                            </div>
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XCircleIcon className="w-8 h-8 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <span>대표 이미지 영역</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">제목</label>
                                <div className="text-lg font-bold border-b border-gray-100 pb-2">{selectedCase.title}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">요약 내용</label>
                                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                    {selectedCase.summary}
                                </p>
                            </div>

                            <div className="pt-8 flex gap-3">
                                <button className="flex-1 bg-[#007aff] hover:bg-[#0062cc] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">
                                    내용 수정하기
                                </button>
                                <button
                                    className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                    onClick={() => handleDelete(selectedCase.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'published') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                게시중
            </span>
        );
    }
    if (status === 'processing') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[11px] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce"></span>
                AI 분석중
            </span>
        );
    }
    if (status === 'highlight') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
                🔥 인기
            </span>
        )
    }
    if (status === 'rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-bold uppercase tracking-wide">
                반려됨
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wide">
            임시저장
        </span>
    );
}
