"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    FolderOpenIcon,
    CalendarDaysIcon,
    ChatBubbleLeftIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    PaperAirplaneIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface Activity {
    id: string;
    type: string;
    content: string;
    date: string;
}

interface Matter {
    id: string;
    title: string;
    case_number: string;
    court: string;
    area: string;
    status: string;
    next_deadline: string;
    next_deadline_label: string;
    created_at: string;
    updated_at: string;
    activities: Activity[];
}

interface PortalData {
    client_name: string;
    matters: Matter[];
    leads: { stage: string; area: string; timestamp: string }[];
    total_matters: number;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    active: { label: "진행 중", icon: <ClockIcon className="w-4 h-4" />, color: "text-blue-600 bg-blue-50" },
    on_hold: { label: "보류", icon: <ExclamationTriangleIcon className="w-4 h-4" />, color: "text-amber-600 bg-amber-50" },
    closed: { label: "종결", icon: <CheckCircleIcon className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
    archived: { label: "보관", icon: <FolderOpenIcon className="w-4 h-4" />, color: "text-zinc-400 bg-zinc-50" },
};

const STAGE_LABELS: Record<string, string> = {
    inquiry: "문의 접수", consultation: "상담 진행", contract: "계약 검토", retained: "수임 확정", closed: "완료",
};

const ACTIVITY_ICONS: Record<string, string> = {
    event: "⚖️", deadline: "📅", client_message: "💬",
};

export default function ClientPortalPage() {
    const [portal, setPortal] = useState<PortalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
    const [message, setMessage] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientId, setClientId] = useState("");
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("client_user");
        if (stored) {
            const user = JSON.parse(stored);
            setClientId(user.id);
            setClientName(user.name || "");
            loadPortal(user.id);
        } else {
            setLoading(false);
        }
    }, []);

    const loadPortal = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/client/${id}/portal`);
            if (res.ok) {
                const data = await res.json();
                setPortal(data);
                if (data.matters.length > 0 && !selectedMatter) {
                    setSelectedMatter(data.matters[0]);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const sendMessage = async () => {
        if (!message.trim() || !selectedMatter) return;
        try {
            const res = await fetch(`${API_BASE}/api/matters/${selectedMatter.id}/client-messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ client_name: clientName || "의뢰인", content: message }),
            });
            if (res.ok) {
                const result = await res.json();
                setSelectedMatter(prev => prev ? {
                    ...prev,
                    activities: [result.activity, ...prev.activities],
                } : null);
                setMessage("");
            }
        } catch (err) { console.error(err); }
    };

    const handleLogout = () => {
        localStorage.removeItem("client_user");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (!clientId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-6">
                <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-3">로그인이 필요합니다</h1>
                    <p className="text-sm text-zinc-500 mb-6">의뢰인 포털에 접속하려면 먼저 로그인하세요.</p>
                    <button onClick={() => router.push("/login")} className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm">로그인</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-extrabold text-xs">L</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">나의 사건 포털</h1>
                            <p className="text-[11px] text-zinc-400">{portal?.client_name || clientName}님 환영합니다</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-red-500 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> 로그아웃
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="총 사건" value={portal?.total_matters || 0} icon="📋" />
                    <StatCard label="진행 중" value={portal?.matters.filter(m => m.status === "active").length || 0} icon="🔵" />
                    <StatCard label="종결" value={portal?.matters.filter(m => m.status === "closed").length || 0} icon="✅" />
                    <StatCard label="상담 진행" value={portal?.leads.length || 0} icon="💼" />
                </div>

                {/* Lead Progress (if any) */}
                {portal?.leads && portal.leads.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">상담 진행 상태</h2>
                        {portal.leads.map((lead, i) => {
                            const stages = ["inquiry", "consultation", "contract", "retained", "closed"];
                            const currentIdx = stages.indexOf(lead.stage);
                            return (
                                <div key={i} className="mb-4 last:mb-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        {lead.area && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{lead.area}</span>}
                                        <span className="text-xs text-zinc-400">{lead.timestamp?.split(" ")[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {stages.map((s, idx) => (
                                            <div key={s} className="flex items-center flex-1">
                                                <div className={`flex-1 h-2 rounded-full ${idx <= currentIdx ? "bg-blue-500" : "bg-zinc-100 dark:bg-zinc-800"}`} />
                                                {idx < stages.length - 1 && <div className="w-1" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-1.5">
                                        {stages.map(s => (
                                            <span key={s} className="text-[9px] text-zinc-400">{STAGE_LABELS[s]}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex gap-6">
                    {/* Matter List */}
                    <div className="w-[340px] flex-shrink-0 space-y-3">
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">내 사건 목록</h2>
                        {(!portal?.matters || portal.matters.length === 0) ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-300">
                                <FolderOpenIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">등록된 사건이 없습니다</p>
                                <p className="text-xs mt-1">변호사가 사건을 등록하면 여기에 표시됩니다</p>
                            </div>
                        ) : (
                            portal.matters.map(matter => {
                                const st = STATUS_MAP[matter.status] || STATUS_MAP.active;
                                const isSelected = selectedMatter?.id === matter.id;
                                const daysLeft = matter.next_deadline ? Math.ceil((new Date(matter.next_deadline).getTime() - Date.now()) / 86400000) : null;

                                return (
                                    <div
                                        key={matter.id}
                                        onClick={() => setSelectedMatter(matter)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${isSelected
                                            ? "bg-white dark:bg-zinc-800 border-blue-300 shadow-lg shadow-blue-50"
                                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex-1 mr-2">{matter.title}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color} whitespace-nowrap flex items-center gap-1`}>
                                                {st.icon} {st.label}
                                            </span>
                                        </div>
                                        {matter.area && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{matter.area}</span>}
                                        {daysLeft !== null && (
                                            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${daysLeft <= 3 ? "text-red-500" : "text-zinc-400"}`}>
                                                <CalendarDaysIcon className="w-3.5 h-3.5" />
                                                {matter.next_deadline_label || "기일"}: {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? "D-Day" : `D+${Math.abs(daysLeft)}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Matter Detail */}
                    <div className="flex-1 min-w-0">
                        {!selectedMatter ? (
                            <div className="h-[400px] flex items-center justify-center text-zinc-300">
                                <div className="text-center">
                                    <FolderOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-bold">사건을 선택하세요</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                {/* Case Info Header */}
                                <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{selectedMatter.title}</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <InfoCell label="사건번호" value={selectedMatter.case_number || "-"} />
                                        <InfoCell label="법원" value={selectedMatter.court || "-"} />
                                        <InfoCell label="분야" value={selectedMatter.area || "-"} />
                                    </div>
                                    {selectedMatter.next_deadline && (
                                        <div className="mt-4 flex items-center gap-2 text-sm">
                                            <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {selectedMatter.next_deadline_label || "다음 기일"}: {selectedMatter.next_deadline}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Activity Timeline */}
                                <div className="px-8 py-6">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">사건 경과</h3>
                                    {(!selectedMatter.activities || selectedMatter.activities.length === 0) ? (
                                        <div className="text-center py-8 text-zinc-300">
                                            <p className="text-sm">아직 공유된 진행 사항이 없습니다</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mb-6">
                                            {selectedMatter.activities.map(a => (
                                                <div key={a.id} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                    <span className="text-lg flex-shrink-0">{ACTIVITY_ICONS[a.type] || "📝"}</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{a.content}</p>
                                                        <p className="text-[10px] text-zinc-400 mt-1">{a.date || a.created_at}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Send Message */}
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">변호사에게 메시지 보내기</h3>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                                                placeholder="궁금한 점이나 전달할 내용을 입력하세요..."
                                                className="flex-1 text-sm px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!message.trim()}
                                                className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <PaperAirplaneIcon className="w-4 h-4" /> 전송
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{value}</div>
        </div>
    );
}
