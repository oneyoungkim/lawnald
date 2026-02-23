"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import { CheckIcon, XMarkIcon, ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import AdminMenu from "../../components/AdminMenu";

interface Submission {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    type: string;
    title: string;
    summary: string;
    content: string;
    topic_tags: string[];
    date: string;
    status: string;
}

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const [subRes, lawyerRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/submissions?status=pending`),
                fetch(`${API_BASE}/api/admin/lawyers/pending`)
            ]);

            if (subRes.ok) {
                const data = await subRes.json();
                setSubmissions(data);
            }
            if (lawyerRes.ok) {
                const data = await lawyerRes.json();
                setPendingLawyers(data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/submissions/${id}/${action}`, {
                method: "POST"
            });
            if (res.ok) {
                // Remove from list
                setSubmissions(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error(`Failed to ${action}`, error);
        }
    };

    const handleVerifyLawyer = async (id: string) => {
        if (!confirm("이 변호사를 승인하시겠습니까?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${id}/verify`, {
                method: "POST"
            });
            if (res.ok) {
                setPendingLawyers(prev => prev.filter(l => l.id !== id));
                alert("승인되었습니다.");
            }
        } catch (error) {
            console.error("Failed to verify", error);
        }
    }

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <AdminMenu />

            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center max-w-6xl mx-auto mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-main font-serif italic">Dashboard</h1>
                        <p className="text-zinc-500 font-medium text-sm mt-1">통합 관리 현황</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/" className="px-5 py-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-sm font-semibold hover:bg-point/5 transition-colors text-main border border-point/20">
                            사이트 바로가기
                        </Link>
                        <Link href="/admin/pipeline" className="px-5 py-2.5 bg-main text-white rounded-xl shadow-sm text-sm font-semibold hover:bg-main/90 transition-colors">
                            Pipeline (New)
                        </Link>
                        <button
                            onClick={fetchSubmissions}
                            className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-point/5 transition-colors border border-point/20"
                            title="새로고침"
                        >
                            <ArrowPathIcon className={`w-5 h-5 text-main ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto space-y-12">
                    {/* 0. Key Metrics */}
                    <AdminStats />

                    {/* 1. Pending Signup Approvals */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-main">
                            <span className="w-1.5 h-6 bg-point rounded-full"></span>
                            가입 승인 대기 ({pendingLawyers.length})
                        </h2>

                        {pendingLawyers.length === 0 ? (
                            <div className="bg-white p-10 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center text-zinc-400 font-medium border border-point/10">
                                대기 중인 가입 변호사가 없습니다.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pendingLawyers.map(lawyer => (
                                    <div key={lawyer.id} className="bg-white p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-6 border border-point/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-semibold text-lg text-main">{lawyer.name} 변호사</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-point/10 text-point rounded-full font-bold uppercase">심사 중</span>
                                            </div>
                                            <p className="text-sm text-zinc-500">
                                                {lawyer.firm} | {lawyer.id} | {lawyer.phone}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-1">{lawyer.career}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {lawyer.licenseImageUrl && (
                                                <a
                                                    href={`${API_BASE}${lawyer.licenseImageUrl}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                                                >
                                                    자격증 확인
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleVerifyLawyer(lawyer.id)}
                                                className="px-6 py-3 bg-main text-white rounded-xl font-semibold hover:bg-main/90 transition-colors shadow-sm whitespace-nowrap text-sm"
                                            >
                                                승인하기
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Recent AI Blog Drafts */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-main">
                            <DocumentTextIcon className="w-6 h-6 text-point" />
                            최근 생성된 AI 블로그 초안
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "음주운전 처벌 기준 강화, 어떻게 대응해야 할까?", lawyer_name: "김철수", lawyer_id: "cheolsoo_kim", date: "2024.03.15", status: "review_needed", content: "최근 개정된 도로교통법에 따르면 음주운전 처벌 기준이 대폭 강화되었습니다. 특히 혈중알코올농도 0.03% 이상..." },
                                { title: "전세사기 피해 예방을 위한 5가지 체크리스트", lawyer_name: "이영희", lawyer_id: "younghee_lee", date: "2024.03.14", status: "approved", content: "전세 계약 전 반드시 확인해야 할 사항들을 정리했습니다. 등기부등본 확인은 기본이며, 집주인의 세금 체납 여부도..." },
                                { title: "이혼 소송 시 재산분할, 이것만은 꼭 알아두세요", lawyer_name: "박민수", lawyer_id: "minsoo_park", date: "2024.03.13", status: "rejected", content: "재산분할은 이혼 소송에서 가장 치열하게 다투는 부분 중 하나입니다. 기여도를 입증하는 것이 무엇보다 중요한데..." },
                            ].map((item, index) => (
                                <div key={index} className="bg-white p-6 rounded-[24px] border border-point/20 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            {item.status === 'review_needed' && <span className="inline-block px-2 py-1 bg-point/10 text-[10px] font-bold rounded-md uppercase mb-2 text-point">Review Needed</span>}
                                            {item.status === 'approved' && <span className="inline-block px-2 py-1 bg-green-100 text-[10px] font-bold rounded-md uppercase mb-2 text-green-600">Approved</span>}
                                            {item.status === 'rejected' && <span className="inline-block px-2 py-1 bg-red-100 text-[10px] font-bold rounded-md uppercase mb-2 text-red-600">Rejected</span>}

                                            <h3 className="text-xl font-serif font-bold mb-1 tracking-tight text-main line-clamp-1">{item.title}</h3>
                                            <p className="text-xs text-zinc-500 font-medium">
                                                변호사: <span className="text-main font-semibold">{item.lawyer_name}</span> ({item.lawyer_id}) | 요청일: {item.date}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-background p-5 rounded-2xl mb-5 text-sm leading-relaxed text-foreground line-clamp-3">
                                        {item.content}
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-xl border border-point/20 hover:bg-point/5 text-zinc-500 transition-colors">
                                            미리보기
                                        </button>
                                        <button className="flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-xl bg-main text-white hover:bg-main/90 transition-colors shadow-sm">
                                            {item.status === 'review_needed' ? '검토하기' : '상세보기'}
                                        </button>
                                    </div>
                                    <details className="mt-4 text-xs text-zinc-400 cursor-pointer">
                                        <summary className="font-medium hover:text-main transition-colors">전체 본문 보기</summary>
                                        <p className="mt-3 p-5 bg-background rounded-2xl text-foreground leading-relaxed">{item.content}</p>
                                    </details>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Content Submission Approvals */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[#1d1d1f] dark:text-white">
                            <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                            콘텐츠 승인 대기 ({submissions.length})
                        </h2>

                        {loading ? (
                            <div className="text-center py-20 text-[#86868b] animate-pulse">데이터 로딩 중...</div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                <p className="text-lg text-[#86868b] font-medium">대기 중인 승인 요청이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {submissions.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row transition-transform duration-300 hover:scale-[1.01]">
                                        {/* Left Status Bar */}
                                        <div className="w-full md:w-2 bg-yellow-400" />

                                        <div className="p-8 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="inline-block px-2 py-1 bg-[#F5F5F7] dark:bg-zinc-800 text-[10px] font-bold rounded-md uppercase mb-2 text-[#86868b]">
                                                        {item.type}
                                                    </span>
                                                    <h3 className="text-xl font-semibold mb-1 tracking-tight text-[#1d1d1f] dark:text-white">{item.title}</h3>
                                                    <p className="text-sm text-[#86868b] font-medium">
                                                        변호사: <span className="text-[#1d1d1f] dark:text-gray-300">{item.lawyer_name}</span> ({item.lawyer_id}) | 요청일: {item.date}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-[#F5F5F7] dark:bg-zinc-800 p-5 rounded-2xl mb-5 text-sm leading-relaxed text-[#1d1d1f] dark:text-gray-300">
                                                <p className="font-bold text-[10px] text-[#86868b] mb-1.5 uppercase tracking-wide">Summary</p>
                                                {item.summary}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {item.topic_tags.map(tag => (
                                                    <span key={tag} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#007aff] text-xs rounded-lg font-medium">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {item.content.startsWith("http") ? (
                                                <a href={item.content} target="_blank" rel="noreferrer" className="text-[#007aff] hover:underline text-sm flex items-center gap-1 font-medium">
                                                    🔗 원문 링크 확인하기
                                                </a>
                                            ) : (
                                                <details className="cursor-pointer text-sm text-[#86868b] group">
                                                    <summary className="font-medium hover:text-[#1d1d1f] transition-colors">전체 본문 보기</summary>
                                                    <p className="mt-3 p-5 bg-[#F5F5F7] dark:bg-zinc-800 rounded-2xl text-[#1d1d1f] dark:text-gray-300 leading-relaxed">{item.content}</p>
                                                </details>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="p-6 bg-[#F5F5F7]/50 dark:bg-zinc-800/20 flex md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-zinc-800">
                                            <button
                                                onClick={() => handleAction(item.id, "approve")}
                                                className="flex-1 md:flex-none px-5 py-2.5 bg-[#34c759] text-white rounded-xl font-semibold hover:bg-[#2dbb50] transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                                            >
                                                <CheckIcon className="w-4 h-4" /> 승인
                                            </button>
                                            <button
                                                onClick={() => handleAction(item.id, "reject")}
                                                className="flex-1 md:flex-none px-5 py-2.5 bg-[#ff3b30]/10 text-[#ff3b30] dark:bg-red-900/20 dark:text-red-400 rounded-xl font-semibold hover:bg-[#ff3b30]/20 transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <XMarkIcon className="w-4 h-4" /> 거절
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function AdminStats() {
    const [stats, setStats] = useState<any>(null);
    const [crawlerStats, setCrawlerStats] = useState<any>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));
        fetch(`${API_BASE}/api/admin/crawler/today-count`)
            .then(res => res.json())
            .then(data => setCrawlerStats(data))
            .catch(err => console.error(err));
    }, []);

    if (!stats) return <div className="h-32 bg-gray-100 animate-pulse rounded-2xl mb-8"></div>;

    const items = [
        { label: "오늘 상담수", value: stats.today_consultations, unit: "건", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "오늘 방문자", value: stats.visitors ? stats.visitors.toLocaleString() : 0, unit: "명", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
        { label: "페이지 뷰", value: stats.page_views ? stats.page_views.toLocaleString() : 0, unit: "회", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        { label: "평균 체류시간", value: stats.avg_duration, unit: "", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
        { label: "오늘 수집 파트너", value: crawlerStats?.today_count ?? 0, unit: "명", color: "text-indigo-500", bg: "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20", extra: crawlerStats ? `총 ${crawlerStats.total}명` : "" },
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${item.bg}`}>
                        <div className={`w-6 h-6 ${item.color} font-bold text-center`}>●</div>
                    </div>
                    <div>
                        <p className="text-sm text-[#86868b] font-medium mb-1">{item.label}</p>
                        <p className="text-2xl font-bold text-[#1d1d1f] dark:text-white">
                            {item.value}<span className="text-sm font-normal text-[#86868b] ml-1">{item.unit}</span>
                        </p>
                        {(item as any).extra && <p className="text-[10px] text-[#86868b] mt-0.5">{(item as any).extra}</p>}
                    </div>
                </div>
            ))}
        </section>
    );
}
