"use client";

import { API_BASE } from "@/lib/api";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

function ConsultationListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lawyer, setLawyer] = useState<any>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("");
    const [areaFilter, setAreaFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            setLawyer(JSON.parse(stored));
        } else {
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        if (!lawyer) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("lawyer_id", lawyer.id);
                if (statusFilter) params.append("status", statusFilter);
                if (areaFilter) params.append("area", areaFilter);
                if (searchQuery) params.append("search", searchQuery);

                // Fetch Consultations and Chats in parallel
                const [consultRes, chatRes] = await Promise.all([
                    fetch(`${API_BASE}/api/consultations?${params.toString()}`),
                    fetch(`${API_BASE}/api/lawyers/${lawyer.id}/chats`)
                ]);

                let consultationsData: any[] = [];
                let chatsData: any[] = [];

                if (consultRes.ok) {
                    consultationsData = await consultRes.json();
                }
                if (chatRes.ok) {
                    chatsData = await chatRes.json();
                }

                // Create a Set of chat_client_ids linked to existing consultations
                const linkedChatIds = new Set(consultationsData.map(c => c.chat_client_id).filter(Boolean));

                // Filter chats that are NOT linked to any consultation
                const orphanChats = chatsData.filter(chat => !linkedChatIds.has(chat.client_id));

                // Map orphan chats to Consultation-like structure for display
                const chatItems = orphanChats.map(chat => {
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    return {
                        id: `chat_${chat.client_id}`, // Prefix to distinguish
                        is_chat_only: true,
                        client_id: chat.client_id, // Store client_id for navigation
                        status: 'in_chat',
                        primary_area: '채팅 문의',
                        case_title: `1:1 채팅 문의 (${chat.client_id.slice(0, 4)}...)`,
                        summary: lastMsg ? lastMsg.content : "대화 내용 없음",
                        created_at: chat.last_updated,
                        tags: ['실시간채팅'],
                        chat_client_id: chat.client_id
                    };
                });

                // Apply filters to chat items if needed (basic search)
                const filteredChatItems = chatItems.filter(item => {
                    if (statusFilter && statusFilter !== 'in_chat') return false;
                    if (areaFilter && areaFilter !== '기타') return false;
                    if (searchQuery && !item.summary.includes(searchQuery)) return false;
                    return true;
                });

                // Merge and Sort by Date (descending)
                const merged = [...consultationsData, ...filteredChatItems].sort((a, b) => {
                    return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
                });

                setConsultations(merged);

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [lawyer, statusFilter, areaFilter, searchQuery]);

    if (!lawyer) return null;

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans p-8">
            <header className="max-w-6xl mx-auto mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">상담 관리 (CRM)</h1>
                        <p className="text-neutral-500">모든 상담 내역과 실시간 채팅 문의를 통합 관리하세요.</p>
                    </div>
                    <Link href="/lawyer/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                        &larr; 대시보드로 돌아가기
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="사건명, 요약 내용 검색..."
                            className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                    >
                        <option value="">모든 분야</option>
                        <option value="가사">가사</option>
                        <option value="형사">형사</option>
                        <option value="민사">민사</option>
                        <option value="부동산">부동산</option>
                        <option value="행정">행정</option>
                        <option value="노동">노동</option>
                        <option value="의료">의료</option>
                        <option value="기타">기타</option>
                    </select>
                    <select
                        className="px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">모든 상태</option>
                        <option value="new">신규 (New)</option>
                        <option value="in_chat">채팅 문의</option>
                        <option value="reviewing">검토 중</option>
                        <option value="waiting_client">의뢰인 대기</option>
                        <option value="proceeding">진행 중</option>
                        <option value="closed">종료</option>
                    </select>
                </div>
            </header>

            <div className="max-w-6xl mx-auto space-y-4">
                {loading ? (
                    <div className="text-center py-12">로딩 중...</div>
                ) : consultations.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">조건에 맞는 상담 내역이 없습니다.</p>
                    </div>
                ) : (
                    consultations.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => {
                                if (c.is_chat_only) {
                                    // For chat-only items, go to Dashboard Chat
                                    router.push(`/lawyer/dashboard?tab=messages&chat_client_id=${c.client_id}`);
                                } else {
                                    // Regular consultation
                                    router.push(`/lawyer/consultations/${c.id}`);
                                }
                            }}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800 hover:border-blue-400 cursor-pointer transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                        {c.primary_area}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                        c.status === 'in_chat' ? 'bg-yellow-100 text-yellow-700' :
                                            c.status === 'reviewing' ? 'bg-purple-100 text-purple-700' :
                                                c.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-green-100 text-green-700'
                                        }`}>
                                        {c.status === 'new' ? '신규' :
                                            c.status === 'in_chat' ? '채팅 문의' :
                                                c.status === 'reviewing' ? '검토 중' :
                                                    c.status === 'waiting_client' ? '대기' :
                                                        c.status === 'proceeding' ? '진행' : '종료'}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {c.created_at}
                                    </span>
                                </div>
                                <div className="text-gray-300 group-hover:text-[#1E293B]">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#1E293B] transition-colors">
                                {c.case_title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                                {c.summary}
                            </p>

                            <div className="mt-4 flex gap-2">
                                {c.tags.map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs text-gray-600 dark:text-gray-400">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}

export default function ConsultationListPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
        }>
            <ConsultationListContent />
        </Suspense>
    );
}
