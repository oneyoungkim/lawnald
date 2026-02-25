"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    ChatBubbleBottomCenterTextIcon,
    FolderOpenIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface Activity {
    id: string;
    type: string;
    content: string;
    date: string;
    created_at: string;
}

interface Matter {
    id: string;
    title: string;
    case_number: string;
    court: string;
    client_name: string;
    opponent_name: string;
    area: string;
    description: string;
    status: string;
    next_deadline: string;
    next_deadline_label: string;
    created_at: string;
    updated_at: string;
    activities: Activity[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "진행 중", color: "text-green-700", bg: "bg-green-100" },
    on_hold: { label: "보류", color: "text-amber-700", bg: "bg-amber-100" },
    closed: { label: "종결", color: "text-zinc-500", bg: "bg-zinc-100" },
    archived: { label: "보관", color: "text-zinc-400", bg: "bg-zinc-50" },
};

const ACTIVITY_ICONS: Record<string, string> = {
    note: "📝", deadline: "📅", document: "📄", event: "⚖️",
};

export default function MatterManagementPage() {
    const [matters, setMatters] = useState<Matter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [newNote, setNewNote] = useState("");
    const [noteType, setNoteType] = useState("note");

    const loadMatters = useCallback(async () => {
        try {
            const url = filterStatus !== "all" ? `${API_BASE}/api/matters?status=${filterStatus}` : `${API_BASE}/api/matters`;
            const res = await fetch(url);
            if (res.ok) setMatters(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [filterStatus]);

    useEffect(() => { loadMatters(); }, [loadMatters]);

    const createMatter = async (data: Partial<Matter>) => {
        try {
            const res = await fetch(`${API_BASE}/api/matters`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (res.ok) { loadMatters(); setShowCreateForm(false); }
        } catch (err) { console.error(err); }
    };

    const updateMatter = async (id: string, data: Partial<Matter>) => {
        try {
            const res = await fetch(`${API_BASE}/api/matters/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (res.ok) {
                const result = await res.json();
                setMatters(prev => prev.map(m => m.id === id ? { ...m, ...result.matter } : m));
                if (selectedMatter?.id === id) setSelectedMatter({ ...selectedMatter, ...result.matter });
            }
        } catch (err) { console.error(err); }
    };

    const deleteMatter = async (id: string) => {
        if (!confirm("이 사건을 삭제하시겠습니까?")) return;
        try {
            await fetch(`${API_BASE}/api/matters/${id}`, { method: "DELETE" });
            setMatters(prev => prev.filter(m => m.id !== id));
            if (selectedMatter?.id === id) setSelectedMatter(null);
        } catch (err) { console.error(err); }
    };

    const addActivity = async (matterId: string) => {
        if (!newNote.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/api/matters/${matterId}/activities`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: noteType, content: newNote }),
            });
            if (res.ok) {
                const result = await res.json();
                setSelectedMatter(prev => prev ? {
                    ...prev,
                    activities: [result.activity, ...(prev.activities || [])],
                } : null);
                setNewNote("");
            }
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 flex-shrink-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">사건 관리</h1>
                        <p className="text-sm text-zinc-500 mt-1">모든 사건의 문서, 메모, 기일을 한곳에서 관리하세요</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                        >
                            <option value="all">전체</option>
                            <option value="active">진행 중</option>
                            <option value="on_hold">보류</option>
                            <option value="closed">종결</option>
                            <option value="archived">보관</option>
                        </select>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-lg"
                        >
                            <PlusIcon className="w-4 h-4" /> 새 사건 등록
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex gap-6">
                {/* Left: Matter List */}
                <div className="w-[380px] flex-shrink-0 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)]">
                    {matters.length === 0 ? (
                        <div className="text-center py-20 text-zinc-400">
                            <FolderOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold">등록된 사건이 없습니다</p>
                            <p className="text-sm mt-1">"새 사건 등록" 버튼으로 시작하세요</p>
                        </div>
                    ) : (
                        matters.map(matter => {
                            const st = STATUS_MAP[matter.status] || STATUS_MAP.active;
                            const isSelected = selectedMatter?.id === matter.id;
                            const daysLeft = matter.next_deadline ? Math.ceil((new Date(matter.next_deadline).getTime() - Date.now()) / 86400000) : null;

                            return (
                                <div
                                    key={matter.id}
                                    onClick={() => setSelectedMatter(matter)}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${isSelected
                                        ? "bg-white dark:bg-zinc-800 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-100 dark:shadow-none"
                                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight flex-1 mr-2">
                                            {matter.title}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color} whitespace-nowrap`}>
                                            {st.label}
                                        </span>
                                    </div>

                                    {matter.client_name && (
                                        <p className="text-xs text-zinc-500 mb-1">👤 {matter.client_name} {matter.opponent_name ? `vs ${matter.opponent_name}` : ""}</p>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                        {matter.area && (
                                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded font-medium">{matter.area}</span>
                                        )}
                                        {matter.court && (
                                            <span className="text-[10px] text-zinc-400">{matter.court}</span>
                                        )}
                                    </div>

                                    {daysLeft !== null && (
                                        <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-medium ${daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : "text-zinc-400"}`}>
                                            {daysLeft <= 3 && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
                                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                                            {matter.next_deadline_label || "기일"}: {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? "D-Day" : `D+${Math.abs(daysLeft)}`}
                                        </div>
                                    )}

                                    <p className="text-[10px] text-zinc-400 mt-2">{matter.updated_at?.split(" ")[0]}</p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right: Matter Detail */}
                <div className="flex-1 min-w-0">
                    {!selectedMatter ? (
                        <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                            <div className="text-center">
                                <FolderOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-bold">사건을 선택하세요</p>
                                <p className="text-sm mt-1">왼쪽 목록에서 사건을 클릭하면 상세 정보가 표시됩니다</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full flex flex-col max-h-[calc(100vh-140px)]">
                            {/* Detail Header */}
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedMatter.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedMatter.status}
                                            onChange={e => updateMatter(selectedMatter.id, { status: e.target.value })}
                                            className="text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none"
                                        >
                                            <option value="active">진행 중</option>
                                            <option value="on_hold">보류</option>
                                            <option value="closed">종결</option>
                                            <option value="archived">보관</option>
                                        </select>
                                        <button onClick={() => deleteMatter(selectedMatter.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                    <InfoCell label="사건번호" value={selectedMatter.case_number || "-"} />
                                    <InfoCell label="법원" value={selectedMatter.court || "-"} />
                                    <InfoCell label="의뢰인" value={selectedMatter.client_name || "-"} />
                                    <InfoCell label="상대방" value={selectedMatter.opponent_name || "-"} />
                                </div>

                                {selectedMatter.description && (
                                    <p className="text-sm text-zinc-500 mt-4 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl">{selectedMatter.description}</p>
                                )}

                                {/* Deadline Row */}
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDaysIcon className="w-4 h-4 text-zinc-400" />
                                        <label className="text-[10px] font-black text-zinc-400 uppercase">다음 기일</label>
                                        <input
                                            type="date"
                                            value={selectedMatter.next_deadline || ""}
                                            onChange={e => updateMatter(selectedMatter.id, { next_deadline: e.target.value })}
                                            className="text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 outline-none"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={selectedMatter.next_deadline_label || ""}
                                        placeholder="기일 라벨 (예: 제1회 변론기일)"
                                        onChange={e => updateMatter(selectedMatter.id, { next_deadline_label: e.target.value })}
                                        className="flex-1 text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">활동 기록</h3>

                                {/* Add Activity */}
                                <div className="flex gap-2 mb-6">
                                    <select
                                        value={noteType}
                                        onChange={e => setNoteType(e.target.value)}
                                        className="text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none flex-shrink-0"
                                    >
                                        <option value="note">📝 메모</option>
                                        <option value="deadline">📅 기일</option>
                                        <option value="document">📄 문서</option>
                                        <option value="event">⚖️ 사건 경과</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addActivity(selectedMatter.id)}
                                        placeholder="활동 내용을 입력하세요..."
                                        className="flex-1 text-sm px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => addActivity(selectedMatter.id)}
                                        disabled={!newNote.trim()}
                                        className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        추가
                                    </button>
                                </div>

                                {/* Activity Timeline */}
                                <div className="space-y-1">
                                    {(!selectedMatter.activities || selectedMatter.activities.length === 0) ? (
                                        <div className="text-center py-12 text-zinc-300">
                                            <ChatBubbleBottomCenterTextIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">아직 활동 기록이 없습니다</p>
                                            <p className="text-xs mt-1">위에서 메모, 기일, 문서 등을 추가하세요</p>
                                        </div>
                                    ) : (
                                        selectedMatter.activities.map(activity => (
                                            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                                <span className="text-lg flex-shrink-0 mt-0.5">{ACTIVITY_ICONS[activity.type] || "📝"}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-zinc-800 dark:text-zinc-200">{activity.content}</p>
                                                    <p className="text-[10px] text-zinc-400 mt-1">{activity.created_at}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Matter Modal */}
            {showCreateForm && <CreateMatterModal onClose={() => setShowCreateForm(false)} onCreate={createMatter} />}
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

function CreateMatterModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: any) => void }) {
    const [form, setForm] = useState({
        title: "", case_number: "", court: "", client_name: "", opponent_name: "", area: "", description: "",
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">새 사건 등록</h2>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><XMarkIcon className="w-5 h-5 text-zinc-400" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건명 *</label>
                        <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 홍OO 이혼 사건" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건번호</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.case_number} onChange={e => setForm({ ...form, case_number: e.target.value })} placeholder="2024가단12345" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">법원</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.court} onChange={e => setForm({ ...form, court: e.target.value })} placeholder="서울중앙지방법원" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">의뢰인</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">상대방</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.opponent_name} onChange={e => setForm({ ...form, opponent_name: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">분야</label>
                        <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="형사, 이혼, 부동산..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건 개요</label>
                        <textarea className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="사건 개요를 간략히 입력하세요..." />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={() => form.title.trim() && onCreate(form)} disabled={!form.title.trim()} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">등록</button>
                </div>
            </div>
        </div>
    );
}
