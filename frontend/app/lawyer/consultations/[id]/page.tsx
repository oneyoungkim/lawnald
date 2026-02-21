"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentListIcon,
    ChatBubbleLeftRightIcon,
    PhoneIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { Consultation } from "../../types";
import ChatRoom from "../../../components/chat/ChatRoom"; // Import ChatRoom

export default function ConsultationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState("summary");

    // Define tabs
    const tabs = [
        { id: 'summary', label: '요약 및 분석' },
        { id: 'checklist', label: '체크리스트 & 전략' },
        { id: 'messages', label: '실시간 채팅' },
        { id: 'original', label: '상담 원문' }
    ];

    useEffect(() => {
        const fetchDetail = async () => {
            const stored = localStorage.getItem("lawyer_user");
            if (!stored) {
                router.push("/login");
                return;
            }
            const lawyer = JSON.parse(stored);

            try {
                // Fetch all for this lawyer and filter client-side
                // (Since we haven't implemented a specific GET /id endpoint yet)
                const res = await fetch(`http://localhost:8000/api/consultations?lawyer_id=${lawyer.id}`);
                if (res.ok) {
                    const data: Consultation[] = await res.json();
                    const found = data.find((c) => c.id === params.id);
                    if (found) {
                        setConsultation(found);
                    } else {
                        // alert("Consultation not found");
                        // router.push("/lawyer/consultations");
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchDetail();
        }
    }, [params.id, router]);

    const handleStatusChange = async (newStatus: string) => {
        if (!consultation) return;

        // Optimistic update
        const prevStatus = consultation.status;
        setConsultation({ ...consultation, status: newStatus });

        try {
            const res = await fetch(`http://localhost:8000/api/consultations/${consultation.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                throw new Error("Failed to update status");
            }

            // Optional: Update local list or re-fetch if needed, but optimistic update handles UI
            console.log("Status updated to:", newStatus);
        } catch (error) {
            console.error("Error updating status:", error);
            // Revert on failure
            setConsultation({ ...consultation, status: prevStatus });
            alert("상태 변경에 실패했습니다.");
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">로딩 중...</div>;
    if (!consultation) return <div className="p-12 text-center text-gray-500">상담 데이터를 찾을 수 없습니다.</div>;

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-8">
                <Link
                    href="/lawyer/consultations"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" /> 목록으로 돌아가기
                </Link>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${consultation.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                consultation.status === 'reviewing' ? 'bg-purple-100 text-purple-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {consultation.status === 'new' ? '신규' : consultation.status}
                            </span>
                            <span className="text-gray-400 text-sm">{consultation.created_at}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {consultation.case_title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <select
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium"
                            value={consultation.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="new">신규 (New)</option>
                            <option value="reviewing">검토 중</option>
                            <option value="waiting_client">의뢰인 대기</option>
                            <option value="proceeding">진행 중</option>
                            <option value="closed">종료</option>
                        </select>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">AI 분석 신뢰도</div>
                            <div className="text-2xl font-bold text-green-600">
                                {Math.round(consultation.confidence * 100)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-gray-200 dark:border-zinc-800">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Main Analysis) */}
                <div className="lg:col-span-2 space-y-6">

                    {activeTab === 'summary' && (
                        <>
                            {/* Summary Card */}
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />
                                    사건 요약
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {consultation.summary}
                                </p>
                            </div>

                            {/* Key Facts & Issues */}
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">주요 사실 관계</h3>
                                <ul className="space-y-3 mb-8">
                                    {consultation.key_facts.map((fact, i) => (
                                        <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <span>{fact}</span>
                                        </li>
                                    ))}
                                </ul>

                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">핵심 쟁점</h3>
                                <div className="flex flex-wrap gap-2">
                                    {consultation.key_issues.map((issue, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30">
                                            {issue}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'checklist' && (
                        <>
                            {/* Action Checklist */}
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    대응 체크리스트
                                </h2>
                                <ul className="space-y-3">
                                    {consultation.checklist.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                            <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Strategy / Next Steps */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-800">
                                <h2 className="text-lg font-bold mb-4 text-blue-900 dark:text-blue-100">AI 제안 전략</h2>
                                <ol className="list-decimal list-inside space-y-3 text-blue-800 dark:text-blue-200 font-medium">
                                    {consultation.next_steps.map((step, i) => (
                                        <li key={i} className="pl-2">{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </>
                    )}

                    {activeTab === 'messages' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800 overflow-hidden h-[600px]">
                            {consultation.chat_client_id ? (
                                <ChatRoom
                                    lawyerId={JSON.parse(localStorage.getItem("lawyer_user") || '{}').id}
                                    clientId={consultation.chat_client_id}
                                    onClose={() => { }} // No close button needed here
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <p>연결된 채팅 내역이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'original' && (
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                            <h2 className="text-lg font-bold mb-4">📝 상담 신청 원문</h2>
                            <div className="bg-gray-50 dark:bg-zinc-800 p-5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-gray-300 font-mono">
                                {consultation.original_text}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column (Client Info & Risks) */}
                <div className="space-y-6">

                    {/* Client Card */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">의뢰인 정보</h2>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-400">
                                <UserIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-gray-900 dark:text-white">{consultation.client_name}</div>
                                <div className="text-sm text-gray-500">신규 문의</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <a href={`tel:${consultation.client_phone}`} className="flex items-center gap-2 p-3 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-xl hover:bg-green-100 transition-colors text-sm font-bold justify-center">
                                <PhoneIcon className="w-4 h-4" />
                                전화
                            </a>
                            <button className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-xl hover:bg-yellow-100 transition-colors text-sm font-bold justify-center">
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                문자
                            </button>
                        </div>
                        {/* Start Chat Button */}
                        <button
                            onClick={() => {
                                if (consultation.chat_client_id) {
                                    setActiveTab('messages');
                                } else {
                                    alert("이 상담은 실시간 채팅으로 접수되지 않았거나, 채팅 정보가 없습니다.");
                                }
                            }}
                            className="w-full mt-3 flex items-center gap-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold justify-center shadow-lg shadow-blue-500/20"
                        >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            실시간 채팅으로 대화하기
                        </button>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <div className="text-xs text-gray-400 mb-1">연락처</div>
                            <div className="font-mono text-sm text-gray-600 dark:text-gray-300">{consultation.client_phone}</div>
                        </div>
                    </div>

                    {/* Risk Analysis */}
                    {consultation.risk_notes.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                위험 요소
                            </h2>
                            <ul className="space-y-3 text-red-700 dark:text-red-300 text-sm">
                                {consultation.risk_notes.map((risk, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="mt-1">•</span>
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Missing Info */}
                    {consultation.missing_questions.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                                추가 확인 필요
                            </h2>
                            <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-sm">
                                {consultation.missing_questions.map((q, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-orange-500 font-bold">?</span>
                                        <span>{q}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </main >
    );
}
