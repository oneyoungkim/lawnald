"use client";

import { API_BASE } from "@/lib/api";
import { useLawyerAuth } from "@/lib/useLawyerAuth";

import { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import StatsCharts from "../../components/dashboard/StatsCharts";
import BlogImportModal from "../../../components/BlogImportModal";

interface Lead {
    id: string;
    contact_type: 'phone' | 'chat';
    case_summary: string;
    timestamp: string;
    status?: 'new' | 'responded' | 'accepted' | 'rejected';
    area?: string;
    location?: string;
    urgency?: 'normal' | 'urgent';
    detail_length?: number;
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
import { NotificationProvider, useNotification } from "../../context/NotificationContext";
import SubscriptionBadge from "../../components/SubscriptionBadge";

function LawyerDashboardContent() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [actions, setActions] = useState<ActionSuggestion[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"inquiries" | "crm" | "messages" | "drafts">("inquiries");
    const [loading, setLoading] = useState(true);
    const [selectedChatClient, setSelectedChatClient] = useState<string | null>(null);
    const { unreadCount, lastMessage, isConnected, resetUnread } = useNotification();
    const [showImportModal, setShowImportModal] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('action') === 'import') setShowImportModal(true);
    }, [searchParams]);

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            try {
                const parsedLawyer = JSON.parse(stored);
                setLawyer(parsedLawyer);
                fetch(`${API_BASE}/api/lawyers/${parsedLawyer.id}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(serverData => {
                        if (serverData) {
                            const updatedLawyer = { ...parsedLawyer, ...serverData };
                            setLawyer(updatedLawyer);
                            localStorage.setItem("lawyer_user", JSON.stringify(updatedLawyer));
                        }
                    })
                    .catch(() => { });
                Promise.all([
                    fetch(`${API_BASE}/api/lawyers/${parsedLawyer.id}/leads`).then(res => res.json()).catch(() => []),
                    fetch(`${API_BASE}/api/consultations?lawyer_id=${parsedLawyer.id}`).then(res => res.json()).catch(() => []),
                    fetch(`${API_BASE}/api/cases/my?lawyer_id=${parsedLawyer.id}`).then(res => res.json()).catch(() => []),
                    fetch(`${API_BASE}/api/dashboard/actions?lawyer_id=${parsedLawyer.id}`).then(res => res.json()).catch(() => []),
                    fetch(`${API_BASE}/api/stats/monthly`).then(res => res.json()).catch(() => null)
                ]).then(([leadsData, consultsData, casesData, actionsData, statsData]) => {
                    setLeads(leadsData || []);
                    setConsultations(consultsData || []);
                    setDrafts((casesData || []).filter((c: any) => c.status === 'pending'));
                    setActions(actionsData || []);
                    setStats(statsData);
                    setLoading(false);
                }).catch(err => {
                    console.error("Dashboard data fetch error:", err);
                    setLoading(false);
                });
            } catch {
                setLoading(false);
                router.push("/login");
            }
        } else {
            setLoading(false);
            router.push("/login");
        }
    }, []);

    useEffect(() => {
        const chatClientId = searchParams.get('chat_client_id');
        if (chatClientId) {
            setActiveTab("messages");
            setSelectedChatClient(chatClientId);
        }
    }, [searchParams]);

    const handleSmartImport = (data: any) => {
        localStorage.setItem('pendingImport', JSON.stringify(data));
        router.push('/lawyer/magazine/write');
    };

    /* ── Derived KPIs ── */
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7); // "2026-02"

    const kpi = useMemo(() => {
        const todayLeads = leads.filter(l => l.timestamp?.startsWith(today)).length;
        const unanswered = leads.filter(l => !l.status || l.status === 'new').length;
        const last7days = leads.filter(l => l.timestamp?.split(' ')[0] >= sevenDaysAgo).length;
        const thisMonthConversions = consultations.filter(c => c.status === 'completed' && c.updated_at?.startsWith(thisMonth)).length;
        const totalLeads = leads.length || 1;
        const responseRate = leads.length > 0 ? Math.round(((leads.length - unanswered) / totalLeads) * 100) : 0;
        const conversionRate = leads.length > 0 ? Math.round((thisMonthConversions / totalLeads) * 100) : 0;
        return { todayLeads, unanswered, last7days, thisMonthConversions, responseRate, conversionRate };
    }, [leads, consultations, today, sevenDaysAgo, thisMonth]);

    /* ── Priority-sorted leads: urgent first, then unanswered, then by recency ── */
    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => {
            // Urgency first
            if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
            if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
            // Unanswered next
            const aNew = !a.status || a.status === 'new';
            const bNew = !b.status || b.status === 'new';
            if (aNew && !bNew) return -1;
            if (!aNew && bNew) return 1;
            // Then by timestamp descending
            return (b.timestamp || '').localeCompare(a.timestamp || '');
        });
    }, [leads]);

    /* ── Quick Actions ── */
    const handleLeadAction = async (leadId: string, action: 'accepted' | 'rejected' | 'responded') => {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: action } : l));
        try {
            await fetch(`${API_BASE}/api/lawyers/${lawyer?.id}/leads/${leadId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
            });
        } catch { }
    };

    if (!lawyer) return null;

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 text-foreground font-sans">
            <LawyerMenu />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs">L</div>
                        <span className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">대시보드</span>
                        {lawyer.verified && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase rounded">Verified</span>
                        )}
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: isConnected ? '#f0fdf4' : '#fef2f2', color: isConnected ? '#16a34a' : '#dc2626' }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isConnected ? 'Live' : 'Offline'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SubscriptionBadge lawyerId={lawyer.id} />
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-bold text-zinc-900 dark:text-white">{lawyer.name}</div>
                            <div className="text-[10px] text-zinc-400">{lawyer.firm}</div>
                        </div>
                        <button onClick={() => { localStorage.removeItem("lawyer_user"); router.push("/login"); }} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 text-xs">
                            ↗
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">

                {/* ═══ 1. KPI Summary Cards — mobile scroll, desktop grid ═══ */}
                <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:overflow-visible scrollbar-hide">
                    <KpiCard label="오늘 신규 상담" value={kpi.todayLeads} unit="건" icon="📥" />
                    <KpiCard label="미응답 상담" value={kpi.unanswered} unit="건" highlight={kpi.unanswered > 0} icon="🔴" />
                    <KpiCard label="최근 7일 상담" value={kpi.last7days} unit="건" icon="📊" />
                    <KpiCard label="이달 전환 건수" value={kpi.thisMonthConversions} unit="건" icon="✅" />
                </section>

                {/* ═══ 2. Conversion Analytics Mini ═══ */}
                <section className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">응답률</div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.responseRate}%</span>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${kpi.responseRate}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">계약 전환율</div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.conversionRate}%</span>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${kpi.conversionRate}%` }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ 3. Main Content ═══ */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main List */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col min-h-[420px]">
                        {/* Tabs */}
                        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-4 gap-1">
                            {[
                                { key: "inquiries" as const, label: "상담 요청", count: leads.length, urgent: kpi.unanswered },
                                { key: "crm" as const, label: "CRM", count: consultations.length },
                                { key: "messages" as const, label: "메시지", count: unreadCount },
                                { key: "drafts" as const, label: "승인대기", count: drafts.length },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => { setActiveTab(tab.key); if (tab.key === "messages") resetUnread(); }}
                                    className={`px-3 pb-3 text-xs font-bold transition-colors relative ${activeTab === tab.key ? 'text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white -mb-px' : 'text-zinc-400 hover:text-zinc-600'}`}
                                >
                                    {tab.label}
                                    {(tab.count || 0) > 0 && (
                                        <span className={`ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black ${tab.key === "messages" && unreadCount > 0 ? "bg-red-500 text-white" : tab.key === "inquiries" && (tab.urgent || 0) > 0 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'inquiries' && (
                                <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                    {sortedLeads.length === 0 ? (
                                        <EmptyState message="아직 접수된 상담 요청이 없습니다." />
                                    ) : sortedLeads.map((lead) => {
                                        const isUnanswered = !lead.status || lead.status === 'new';
                                        const isUrgent = lead.urgency === 'urgent';
                                        const summaryLen = (lead.case_summary || '').length;
                                        const detailLevel = summaryLen > 200 ? '상세' : summaryLen > 80 ? '보통' : '간략';

                                        return (
                                            <div
                                                key={lead.id}
                                                className={`px-4 py-3 transition-colors ${isUnanswered ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                                            >
                                                {/* Row 1: Main info — compressed for mobile */}
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : lead.contact_type === 'phone' ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                                        {isUrgent ? '🚨' : lead.contact_type === 'phone' ? '📞' : '💬'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {isUnanswered && <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded">미응답</span>}
                                                            {isUrgent && <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded">긴급</span>}
                                                            {lead.area && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{lead.area}</span>}
                                                            {lead.location && <span className="text-[9px] text-zinc-400">{lead.location}</span>}
                                                        </div>
                                                        <p className="text-sm font-medium text-zinc-900 dark:text-white mt-1 line-clamp-2 leading-snug">{lead.case_summary}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-zinc-400">{lead.timestamp}</span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${detailLevel === '상세' ? 'bg-emerald-50 text-emerald-600' : detailLevel === '보통' ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                                                                {detailLevel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Row 2: Inline action buttons */}
                                                {isUnanswered && (
                                                    <div className="flex gap-2 mt-2 ml-11">
                                                        <button onClick={() => handleLeadAction(lead.id, 'responded')} className="text-[10px] font-bold px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity">
                                                            ✏️ 답변
                                                        </button>
                                                        <button onClick={() => handleLeadAction(lead.id, 'accepted')} className="text-[10px] font-bold px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                                                            ✅ 수락
                                                        </button>
                                                        <button onClick={() => handleLeadAction(lead.id, 'rejected')} className="text-[10px] font-bold px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-200 transition-colors">
                                                            ❌ 거절
                                                        </button>
                                                        {lead.contact_type === 'phone' && (
                                                            <a href={`tel:${lead.id}`} className="text-[10px] font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                                                📞 전화
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'crm' && (
                                <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                    {consultations.length === 0 ? (
                                        <EmptyState message="등록된 상담이 없습니다." action={<Link href="/lawyer/consultations" className="text-blue-600 font-bold text-xs hover:underline">+ 첫 상담 기록하기</Link>} />
                                    ) : consultations.map(c => (
                                        <Link key={c.id} href={`/lawyer/consultations/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'new' ? 'bg-blue-500' : c.status === 'reviewing' ? 'bg-amber-400' : 'bg-zinc-300'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.case_title}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded font-bold">{c.primary_area}</span>
                                                    <span className="text-[10px] text-zinc-400">{c.updated_at?.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                            <span className="text-zinc-300 text-xs">→</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'drafts' && (
                                <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                    {drafts.length === 0 ? (
                                        <EmptyState message="승인 대기 중인 콘텐츠가 없습니다." action={<Link href="/lawyer/dashboard/cases/upload" className="text-blue-600 font-bold text-xs hover:underline">+ 새 승소사례 등록</Link>} />
                                    ) : drafts.map(d => (
                                        <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm">⏳</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">{d.title}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-amber-500 font-bold">관리자 승인 대기중</span>
                                                    <span className="text-[10px] text-zinc-400">{d.timestamp?.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'messages' && (
                                <div className="h-full flex flex-col">
                                    {selectedChatClient ? (
                                        <div className="h-[450px]">
                                            <ChatRoom lawyerId={lawyer.id} clientId={selectedChatClient} onClose={() => setSelectedChatClient(null)} />
                                        </div>
                                    ) : (
                                        <ChatList lawyerId={lawyer.id} onSelectChat={setSelectedChatClient} refreshTrigger={lastMessage} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">
                        {/* AI Insight */}
                        {actions.length > 0 && (
                            <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-5 text-white relative overflow-hidden">
                                <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">AI Insight</span>
                                <h3 className="font-bold text-base mt-2 leading-tight">{actions[0].title}</h3>
                                <p className="text-white/60 text-xs mt-1 line-clamp-2">{actions[0].description}</p>
                                <Link href={actions[0].cta_link} className="inline-block mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">
                                    {actions[0].cta_label}
                                </Link>
                            </div>
                        )}

                        {/* Quick Stats Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">이달 실적 요약</h3>
                            <div className="space-y-3">
                                <StatRow label="상담 요청" value={leads.length} suffix="건" />
                                <StatRow label="응답 완료" value={leads.filter(l => l.status && l.status !== 'new').length} suffix="건" />
                                <StatRow label="수락/계약" value={kpi.thisMonthConversions} suffix="건" />
                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <StatRow label="응답률" value={kpi.responseRate} suffix="%" bold />
                                    <StatRow label="전환율" value={kpi.conversionRate} suffix="%" bold />
                                </div>
                            </div>
                        </div>

                        {/* Help */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">도움말</h3>
                            <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                {[
                                    { icon: "📝", text: "승소사례 작성 가이드", href: "/lawyer/help/case-guide" },
                                    { icon: "🚀", text: "AI 추천 순위 높이는 전략", href: "/lawyer/help/profile-boost" },
                                    { icon: "❓", text: "자주 묻는 질문", href: "/lawyer/help/faq" },
                                ].map(item => (
                                    <li key={item.href}>
                                        <Link href={item.href} className="flex items-center justify-between hover:text-blue-600 transition-colors">
                                            <span className="flex items-center gap-2">{item.icon} {item.text}</span>
                                            <span className="text-zinc-300">→</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ═══ 4. Market Insights ═══ */}
                {stats && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">마켓 인사이트 (30일)</h2>
                            <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Beta</span>
                        </div>
                        <StatsCharts casesData={stats.cases.top_categories} consultsData={stats.consultations.top_categories} />
                    </section>
                )}
            </div>

            {/* Import Modal */}
            <BlogImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleSmartImport} />

            {/* Toast */}
            {lastMessage && unreadCount > 0 && activeTab !== 'messages' && (
                <div
                    className="fixed bottom-4 right-4 bg-white dark:bg-zinc-800 border-l-4 border-l-blue-500 shadow-xl rounded-xl p-3 z-[100] max-w-xs cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => { setActiveTab("messages"); resetUnread(); if (lastMessage.client_id) setSelectedChatClient(lastMessage.client_id); }}
                >
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💬</span>
                        <div>
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white">새 메시지</h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{lastMessage.message?.content || "상담 요청"}</p>
                            <span className="text-[9px] font-bold text-blue-500 mt-1 inline-block">확인하기 →</span>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function LawyerDashboard() {
    return (
        <NotificationProvider>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                    <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
                </div>
            }>
                <LawyerDashboardContent />
            </Suspense>
        </NotificationProvider>
    );
}

/* ─── Sub-components ─── */
function KpiCard({ label, value, unit, highlight = false, icon }: { label: string; value: number; unit: string; highlight?: boolean; icon: string }) {
    return (
        <div className={`min-w-[140px] sm:min-w-0 bg-white dark:bg-zinc-900 p-4 rounded-2xl border flex flex-col justify-between h-[88px] flex-shrink-0 ${highlight ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10' : 'border-zinc-100 dark:border-zinc-800'}`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
                <span className="text-sm">{icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black tracking-tight ${highlight ? 'text-amber-600' : 'text-zinc-900 dark:text-white'}`}>{value}</span>
                <span className="text-[10px] text-zinc-400 font-bold">{unit}</span>
            </div>
        </div>
    );
}

function StatRow({ label, value, suffix, bold = false }: { label: string; value: number; suffix: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className={`text-xs ${bold ? 'font-black text-zinc-900 dark:text-white' : 'font-bold text-zinc-700 dark:text-zinc-300'}`}>
                {value}{suffix}
            </span>
        </div>
    );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
    return (
        <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                <span className="text-zinc-300 text-sm">📭</span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mb-2">{message}</p>
            {action}
        </div>
    );
}
