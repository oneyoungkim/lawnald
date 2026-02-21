"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import StatsCharts from "../../components/dashboard/StatsCharts";
import BlogImportModal from "../../../components/BlogImportModal"; // Import Modal

interface Lead {
    id: string;
    contact_type: 'phone' | 'chat';
    case_summary: string;
    timestamp: string;
}

interface Consultation {
    id: string;
    status: 'new' | 'reviewing' | 'completed';
    case_title: string;
    primary_area: string;
    updated_at: string;
}

interface ActionSuggestion {
    title: string;
    description: string;
    cta_link: string;
    cta_label: string;
}


import ChatList from "../../components/chat/ChatList";
import ChatRoom from "../../components/chat/ChatRoom";
import LawyerMenu from "../../components/LawyerMenu";

// Import Notification Context
import { NotificationProvider, useNotification } from "../../context/NotificationContext";
import SubscriptionBadge from "../../components/SubscriptionBadge";

function LawyerDashboardContent() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]); // New State
    const [actions, setActions] = useState<ActionSuggestion[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"inquiries" | "crm" | "messages" | "drafts">("inquiries");
    const [loading, setLoading] = useState(true);
    const [selectedChatClient, setSelectedChatClient] = useState<string | null>(null);

    // Notification Hook
    const { unreadCount, lastMessage, isConnected, resetUnread } = useNotification();

    // Smart Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('action') === 'import') {
            setShowImportModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            const parsedLawyer = JSON.parse(stored);
            setLawyer(parsedLawyer);

            Promise.all([
                fetch(`http://localhost:8000/api/lawyers/${parsedLawyer.id}/leads`).then(res => res.json()),
                fetch(`http://localhost:8000/api/consultations?lawyer_id=${parsedLawyer.id}`).then(res => res.json()),
                fetch(`http://localhost:8000/api/cases/my?lawyer_id=${parsedLawyer.id}`).then(res => res.json()), // Fetch My Cases (includes pending)
                fetch(`http://localhost:8000/api/dashboard/actions?lawyer_id=${parsedLawyer.id}`).then(res => res.json()),
                fetch(`http://localhost:8000/api/stats/monthly`).then(res => res.json())
            ]).then(([leadsData, consultsData, casesData, actionsData, statsData]) => {
                setLeads(leadsData);
                setConsultations(consultsData);
                // Filter for pending status
                setDrafts(casesData.filter((c: any) => c.status === 'pending'));
                setActions(actionsData);
                setStats(statsData);
                setLoading(false);
            }).catch(err => {
                console.error("Dashboard data fetch error:", err);
                setLoading(false);
            });
        } else {
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        // Handle Deep Linking for Chat
        const chatClientId = searchParams.get('chat_client_id');
        if (chatClientId) {
            setActiveTab("messages");
            setSelectedChatClient(chatClientId);
        }
    }, [searchParams]);

    // Refresh data when lastMessage changes (if needed for instant list update)
    useEffect(() => {
        if (lastMessage && activeTab === 'messages') {
            // If currently viewing messages, refresh logic is handled by ChatList or polling
        }
    }, [lastMessage, activeTab]);


    const handleSmartImport = (data: any) => {
        // Save to localStorage to be picked up by the Write page
        localStorage.setItem('pendingImport', JSON.stringify(data));
        router.push('/lawyer/magazine/write');
    };

    if (!lawyer) return null;

    // Derived Stats
    const today = new Date().toISOString().split('T')[0];
    const todayConsultations = consultations.filter(c => c.updated_at?.startsWith(today)).length;
    const pendingConsultations = consultations.filter(c => ['new', 'reviewing'].includes(c.status)).length;

    // Top Priority Action for Hero
    const heroAction = actions.length > 0 ? actions[0] : null;

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <LawyerMenu />
            {/* 1. Global Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-point/20 px-6 py-4">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-main rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            L
                        </div>
                        <span className="font-semibold text-main tracking-tight font-serif italic">Lawnald Dashboard</span>
                        {lawyer.verified && (
                            <span className="px-2 py-0.5 bg-point/10 text-point text-[10px] font-bold uppercase tracking-wider rounded-md">
                                Verified
                            </span>
                        )}
                        {/* Monitor Connection Status (Debug) */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-zinc-800 rounded-md border border-gray-100 dark:border-zinc-700">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {isConnected ? 'Live' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <SubscriptionBadge lawyerId={lawyer.id} />


                        {/* User Menu */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-medium text-main">{lawyer.name}</div>
                                <div className="text-[10px] text-zinc-400">{lawyer.firm}</div>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("lawyer_user");
                                    router.push("/login");
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-point/20 flex items-center justify-center text-zinc-400 hover:text-main hover:bg-point/5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                {/* 2. KPI Section */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="오늘 상담" value={todayConsultations} unit="건" />
                    <KpiCard label="미처리 건" value={pendingConsultations} unit="건" highlight={pendingConsultations > 0} />
                    <KpiCard label="최근 7일 노출" value={0} unit="회" />
                    <KpiCard label="프로필 전환율" value={0} unit="%" />
                </section>

                {/* 3. Hero Section (AI Recommendation) */}
                {heroAction && (
                    <section className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <div className="bg-[#F5F5F7] dark:bg-zinc-800 rounded-[20px] px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[#007aff] bg-white dark:bg-black/20 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm uppercase tracking-wide">AI Insight</span>
                                    <h2 className="text-xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{heroAction.title}</h2>
                                </div>
                                <p className="text-[#86868b] dark:text-gray-400 text-sm max-w-xl leading-relaxed font-medium">
                                    {heroAction.description}
                                </p>
                            </div>
                            <Link
                                href={heroAction.cta_link}
                                className="whitespace-nowrap px-6 py-3.5 bg-[#007aff] hover:bg-[#0062cc] text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                            >
                                {heroAction.cta_label}
                            </Link>
                        </div>
                    </section>
                )}

                {/* 4. Unified List Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main List Box */}
                    <div className="md:col-span-2 bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[400px]">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-zinc-800 px-6 pt-6 gap-8">
                            <button
                                onClick={() => setActiveTab("inquiries")}
                                className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'inquiries' ? 'text-[#1d1d1f] dark:text-white border-b-2 border-[#1d1d1f] dark:border-white -mb-px' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-gray-300'}`}
                            >
                                최근 상담 요청
                                {leads.length > 0 && <span className="ml-2 bg-[#F5F5F7] dark:bg-zinc-800 text-[#1d1d1f] dark:text-gray-300 px-2 py-0.5 rounded-full text-[10px]">{leads.length}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab("crm")}
                                className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'crm' ? 'text-[#1d1d1f] dark:text-white border-b-2 border-[#1d1d1f] dark:border-white -mb-px' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-gray-300'}`}
                            >
                                상담 관리 (CRM)
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("messages");
                                    resetUnread();
                                }}
                                className={`pb-4 text-sm font-semibold transition-colors relative flex items-center ${activeTab === 'messages' ? 'text-[#1d1d1f] dark:text-white border-b-2 border-[#1d1d1f] dark:border-white -mb-px' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-gray-300'}`}
                            >
                                메시지
                                {unreadCount > 0 ? (
                                    <span className="ml-2 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                                        {unreadCount}
                                    </span>
                                ) : (
                                    <span className="ml-2 w-2 h-2 rounded-full bg-gray-300"></span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("drafts")}
                                className={`pb-4 text-sm font-semibold transition-colors relative flex items-center ${activeTab === 'drafts' ? 'text-[#1d1d1f] dark:text-white border-b-2 border-[#1d1d1f] dark:border-white -mb-px' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-gray-300'}`}
                            >
                                승인 대기
                                {drafts.length > 0 && <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{drafts.length}</span>}
                            </button>
                        </div>

                        {/* List Content */}
                        <div className="p-2 flex-1 relative h-full flex flex-col">
                            {activeTab === 'inquiries' && (
                                <div className="space-y-1 p-2">
                                    {leads.length === 0 ? (
                                        <EmptyState message="아직 접수된 상담 요청이 없습니다." />
                                    ) : (
                                        leads.map((lead) => (
                                            <div key={lead.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${lead.contact_type === 'phone' ? 'bg-[#F8FAFC] text-[#1E293B]' : 'bg-[#F8FAFC] text-[#3B82F6]'}`}>
                                                        {lead.contact_type === 'phone' ? '📞' : '💬'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{lead.case_summary}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">{lead.timestamp}</div>
                                                    </div>
                                                </div>
                                                <button className="text-xs font-semibold text-[#64748B] group-hover:text-[#1E293B] bg-white group-hover:bg-[#F8FAFC] border border-gray-100 group-hover:border-[#E2E8F0] px-3 py-1.5 rounded-lg transition-all">
                                                    상세보기
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'crm' && (
                                <div className="space-y-1 p-2">
                                    {consultations.length === 0 ? (
                                        <EmptyState
                                            message="등록된 상담이 없습니다."
                                            action={<Link href="/lawyer/consultations" className="text-[#1E293B] font-bold text-sm hover:underline">+ 첫 상담 기록하기</Link>}
                                        />
                                    ) : (
                                        consultations.map((c) => (
                                            <Link key={c.id} href={`/lawyer/consultations/${c.id}`} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${c.status === 'new' ? 'bg-[#3B82F6]' : 'bg-gray-300'}`} />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{c.case_title}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{c.primary_area}</span>
                                                            <span className="text-xs text-gray-400">{c.updated_at.split(' ')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-gray-400">→</span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'drafts' && (
                                <div className="space-y-1 p-2">
                                    {drafts.length === 0 ? (
                                        <EmptyState
                                            message="승인 대기 중인 콘텐츠가 없습니다."
                                            action={<Link href="/lawyer/dashboard/cases/upload" className="text-[#1E293B] font-bold text-sm hover:underline">+ 새 승소사례 등록</Link>}
                                        />
                                    ) : (
                                        drafts.map((d) => (
                                            <div key={d.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-lg">
                                                        ⏳
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{d.title}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-orange-500 font-medium">관리자 승인 대기중</span>
                                                            <span className="text-xs text-gray-400">• {d.timestamp?.split(' ')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'messages' && (
                                <div className="h-full flex flex-col">
                                    {selectedChatClient ? (
                                        <div className="h-[450px]">
                                            <ChatRoom
                                                lawyerId={lawyer.id}
                                                clientId={selectedChatClient}
                                                onClose={() => setSelectedChatClient(null)}
                                            />
                                        </div>
                                    ) : (
                                        <ChatList
                                            lawyerId={lawyer.id}
                                            onSelectChat={setSelectedChatClient}
                                            refreshTrigger={lastMessage}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: New Suggestion Area */}
                    <div className="flex flex-col gap-6">
                        {/* ... (Keep existing right column content) ... */}
                        <div className="bg-[#1d1d1f] dark:bg-zinc-800 rounded-[24px] p-8 text-white text-center flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] min-h-[220px] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            {/* ... (Keep existing AI Report content) ... */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                                <span className="text-[#1d1d1f] bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-wide">AI Report</span>
                                <span className="text-[10px] text-white/60 font-medium">{new Date().toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-3 leading-tight relative z-10">
                                이번 달 상담 전환율<br />
                                <span className="text-[#2997ff] text-2xl">15% 상승</span>
                            </h3>
                            <p className="text-white/60 text-xs mb-6 relative z-10 font-medium">AI 매칭 알고리즘 최적화 효과</p>
                            <button
                                onClick={() => router.push('/lawyer/statistics')}
                                className="whitespace-nowrap px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl text-xs transition-all border border-white/10 relative z-10"
                            >
                                통계 상세보기
                            </button>
                        </div>

                        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                            <h3 className="text-sm font-semibold text-[#86868b] mb-4 uppercase tracking-wide">도움말</h3>
                            <ul className="space-y-4 text-sm text-[#1d1d1f] dark:text-gray-300 font-medium">
                                <li>
                                    <Link href="/lawyer/help/case-guide" className="hover:text-[#007aff] transition-colors flex items-center justify-between group">
                                        <span className="flex items-center gap-2">
                                            <span className="text-base">📝</span>
                                            승소사례, 이렇게 쓰면 의뢰인이 먼저 연락합니다
                                        </span>
                                        <span className="text-gray-300 group-hover:text-[#007aff] transition-colors">→</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/lawyer/help/profile-boost" className="hover:text-[#007aff] transition-colors flex items-center justify-between group">
                                        <span className="flex items-center gap-2">
                                            <span className="text-base">🚀</span>
                                            AI 추천 순위를 높이는 5가지 핵심 전략
                                        </span>
                                        <span className="text-gray-300 group-hover:text-[#007aff] transition-colors">→</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/lawyer/help/faq" className="hover:text-[#007aff] transition-colors flex items-center justify-between group">
                                        <span className="flex items-center gap-2">
                                            <span className="text-base">❓</span>
                                            자주 묻는 질문 (FAQ)
                                        </span>
                                        <span className="text-gray-300 group-hover:text-[#007aff] transition-colors">→</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 5. Market Insights (New Stats Section) */}
                <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">마켓 인사이트 (최근 30일)</h2>
                        <span className="bg-[#007aff]/10 text-[#007aff] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
                    </div>

                    {stats ? (
                        <div className="space-y-6">
                            <StatsCharts
                                casesData={stats.cases.top_categories}
                                consultsData={stats.consultations.top_categories}
                            />
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                            데이터 로딩 중...
                        </div>
                    )}
                </section>
            </div>

            {/* Smart Import Modal */}
            <BlogImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleSmartImport}
            />

            {/* Custom Dashboard Toast */}
            {lastMessage && unreadCount > 0 && activeTab !== 'messages' && (
                <div className="fixed bottom-4 right-4 bg-white dark:bg-zinc-800 border-l-4 border-l-[#007aff] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-xl p-4 z-[100] animate-slide-in-right max-w-sm cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => {
                        setActiveTab("messages");
                        resetUnread();
                        // Open Chat if client_id is available in the message
                        if (lastMessage.client_id) {
                            setSelectedChatClient(lastMessage.client_id);
                        }
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💬</div>
                        <div>
                            <h4 className="font-bold text-sm text-[#1d1d1f] dark:text-white">새로운 메시지</h4>
                            <p className="text-xs text-[#86868b] mt-1 line-clamp-2 leading-relaxed">
                                {lastMessage.message?.content || "상담 요청이 도착했습니다."}
                            </p>
                            <div className="mt-2 text-[10px] font-bold text-[#007aff]">
                                클릭하여 확인하기 →
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main >
    );
}

export default function LawyerDashboard() {
    return (
        <NotificationProvider>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                </div>
            }>
                <LawyerDashboardContent />
            </Suspense>
        </NotificationProvider>
    );
}

// Sub-components
function KpiCard({ label, value, unit, highlight = false }: { label: string, value: number, unit: string, highlight?: boolean }) {
    return (
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform duration-300">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-semibold ${highlight ? 'text-[#007aff]' : 'text-[#1d1d1f] dark:text-white'} tracking-tight`}>
                    {value.toLocaleString()}
                </span>
                <span className="text-sm text-[#86868b] font-medium">{unit}</span>
            </div>
        </div>
    );
}

function EmptyState({ message, action }: { message: string, action?: React.ReactNode }) {
    return (
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <span className="text-gray-300 text-xl">Inbox</span>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-2">{message}</p>
            {action}
        </div>
    );
}
