"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import {
    PhoneIcon,
    ChatBubbleLeftIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface Lead {
    id: string;
    lawyer_id: string;
    case_summary: string;
    contact_type: "phone" | "chat";
    timestamp: string;
    stage: string;
    client_name: string;
    client_phone: string;
    client_email: string;
    notes: string;
    priority: string;
    area: string;
}

const STAGES = [
    { key: "inquiry", label: "신규 문의", emoji: "📩", color: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200" },
    { key: "consultation", label: "상담 예약", emoji: "📅", color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200" },
    { key: "contract", label: "계약 대기", emoji: "📝", color: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200" },
    { key: "retained", label: "수임 완료", emoji: "✅", color: "bg-green-500", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200" },
    { key: "closed", label: "종결", emoji: "📁", color: "bg-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-800", border: "border-zinc-200" },
];

const PRIORITIES: Record<string, { label: string; color: string }> = {
    urgent: { label: "긴급", color: "bg-red-500 text-white" },
    high: { label: "높음", color: "bg-orange-100 text-orange-700" },
    normal: { label: "보통", color: "bg-zinc-100 text-zinc-600" },
    low: { label: "낮음", color: "bg-zinc-50 text-zinc-400" },
};

export default function LeadKanbanPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [lawyerId, setLawyerId] = useState("");

    // Load leads
    const loadLeads = useCallback(async (lid: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lid}/leads`);
            if (res.ok) {
                const data = await res.json();
                setLeads(data.map((l: any) => ({ ...l, stage: l.stage || "inquiry" })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            const lawyer = JSON.parse(stored);
            setLawyerId(lawyer.id);
            loadLeads(lawyer.id);
        }
    }, [loadLeads]);

    // Move lead to next/prev stage
    const moveStage = async (leadId: string, direction: "next" | "prev") => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        const currentIdx = STAGES.findIndex(s => s.key === lead.stage);
        const newIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= STAGES.length) return;
        const newStage = STAGES[newIdx].key;

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));

        try {
            await fetch(`${API_BASE}/api/leads/${leadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage: newStage }),
            });
        } catch { /* revert? */ }
    };

    // Update lead field
    const updateLead = async (leadId: string, updates: Partial<Lead>) => {
        try {
            const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const data = await res.json();
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data.lead } : l));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Delete lead
    const deleteLead = async (leadId: string) => {
        if (!confirm("이 리드를 삭제하시겠습니까?")) return;
        setLeads(prev => prev.filter(l => l.id !== leadId));
        try {
            await fetch(`${API_BASE}/api/leads/${leadId}`, { method: "DELETE" });
        } catch { /* ignore */ }
    };

    // Add new lead
    const addLead = async (summary: string, area: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lawyerId}/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ case_summary: summary, contact_type: "chat" }),
            });
            if (res.ok) {
                loadLeads(lawyerId);
                setShowAddForm(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">잠재 고객 관리</h1>
                        <p className="text-sm text-zinc-500 mt-1">문의부터 수임까지 고객 여정을 한눈에 관리하세요</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-400">총 {leads.length}건</span>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-lg"
                        >
                            <PlusIcon className="w-4 h-4" /> 새 리드 추가
                        </button>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="flex gap-5 overflow-x-auto pb-4">
                    {STAGES.map((stage) => {
                        const stageLeads = leads.filter(l => l.stage === stage.key);
                        return (
                            <div key={stage.key} className="flex-shrink-0 w-[280px]">
                                {/* Column Header */}
                                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${stage.bg} border ${stage.border} border-b-0`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{stage.emoji}</span>
                                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{stage.label}</span>
                                    </div>
                                    <span className={`w-6 h-6 rounded-full ${stage.color} text-white text-xs font-bold flex items-center justify-center`}>
                                        {stageLeads.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className={`min-h-[200px] border ${stage.border} border-t-0 rounded-b-2xl bg-white/50 dark:bg-zinc-900/50 p-3 space-y-3`}>
                                    {stageLeads.length === 0 && (
                                        <div className="text-center py-12 text-zinc-300 text-sm">
                                            비어있음
                                        </div>
                                    )}
                                    {stageLeads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            stageIndex={STAGES.findIndex(s => s.key === lead.stage)}
                                            totalStages={STAGES.length}
                                            onMoveNext={() => moveStage(lead.id, "next")}
                                            onMovePrev={() => moveStage(lead.id, "prev")}
                                            onEdit={() => setEditingLead(lead)}
                                            onDelete={() => deleteLead(lead.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {editingLead && (
                <LeadEditModal
                    lead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSave={(updates) => {
                        updateLead(editingLead.id, updates);
                        setEditingLead(null);
                    }}
                />
            )}

            {/* Add Form Modal */}
            {showAddForm && (
                <AddLeadModal
                    onClose={() => setShowAddForm(false)}
                    onAdd={addLead}
                />
            )}
        </div>
    );
}

// --- Sub-components ---

function LeadCard({
    lead, stageIndex, totalStages, onMoveNext, onMovePrev, onEdit, onDelete
}: {
    lead: Lead;
    stageIndex: number;
    totalStages: number;
    onMoveNext: () => void;
    onMovePrev: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const priority = PRIORITIES[lead.priority] || PRIORITIES.normal;

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
            {/* Top: Priority + Contact Type */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priority.color}`}>{priority.label}</span>
                    {lead.contact_type === "phone" ? (
                        <PhoneIcon className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                        <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-blue-400" />
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded">
                        <PencilIcon className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    <button onClick={onDelete} className="p-1 hover:bg-red-50 rounded">
                        <TrashIcon className="w-3.5 h-3.5 text-red-400" />
                    </button>
                </div>
            </div>

            {/* Client Name */}
            {lead.client_name && (
                <p className="text-xs font-bold text-zinc-900 dark:text-white mb-1">{lead.client_name}</p>
            )}

            {/* Case Summary */}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-3">
                {lead.case_summary}
            </p>

            {/* Area Tag */}
            {lead.area && (
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded font-medium">
                    {lead.area}
                </span>
            )}

            {/* Notes */}
            {lead.notes && (
                <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 italic">
                    📝 {lead.notes}
                </p>
            )}

            {/* Timestamp + Move Buttons */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-50 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-400">{lead.timestamp?.split(" ")[0]}</span>
                <div className="flex items-center gap-1">
                    {stageIndex > 0 && (
                        <button onClick={onMovePrev} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors" title="이전 단계">
                            <ChevronLeftIcon className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}
                    {stageIndex < totalStages - 1 && (
                        <button onClick={onMoveNext} className="p-1 hover:bg-blue-50 rounded transition-colors" title="다음 단계">
                            <ChevronRightIcon className="w-4 h-4 text-blue-500" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LeadEditModal({ lead, onClose, onSave }: { lead: Lead; onClose: () => void; onSave: (u: Partial<Lead>) => void }) {
    const [form, setForm] = useState({
        client_name: lead.client_name || "",
        client_phone: lead.client_phone || "",
        client_email: lead.client_email || "",
        case_summary: lead.case_summary || "",
        notes: lead.notes || "",
        priority: lead.priority || "normal",
        area: lead.area || "",
        stage: lead.stage || "inquiry",
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">리드 정보 수정</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">이름</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="의뢰인명" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">연락처</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} placeholder="010-0000-0000" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">이메일</label>
                        <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">분야</label>
                            <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="형사, 이혼, 부동산..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">우선순위</label>
                            <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="low">낮음</option>
                                <option value="normal">보통</option>
                                <option value="high">높음</option>
                                <option value="urgent">긴급</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">단계</label>
                        <select className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                            {STAGES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건 개요</label>
                        <textarea className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" value={form.case_summary} onChange={e => setForm({ ...form, case_summary: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">메모</label>
                        <textarea className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="상담 내용, 특이사항 등..." />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={() => onSave(form)} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg">저장</button>
                </div>
            </div>
        </div>
    );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (summary: string, area: string) => void }) {
    const [summary, setSummary] = useState("");
    const [area, setArea] = useState("");

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">새 리드 추가</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건 개요</label>
                        <textarea className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" value={summary} onChange={e => setSummary(e.target.value)} placeholder="의뢰인이 문의한 사건 내용을 요약하세요..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">분야</label>
                        <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={area} onChange={e => setArea(e.target.value)} placeholder="형사, 이혼, 부동산..." />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={() => summary.trim() && onAdd(summary, area)} disabled={!summary.trim()} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">추가</button>
                </div>
            </div>
        </div>
    );
}
