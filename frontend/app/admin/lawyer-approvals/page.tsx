"use client";

import { API_BASE } from "@/lib/api";

import { useEffect, useState } from "react";
import { CheckIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import AdminMenu from "../../../components/AdminMenu";

interface PendingLawyer {
    id: string;
    name: string;
    firm: string;
    phone: string;
    career: string;
    licenseImageUrl?: string;
    location?: string;
    expertise?: string[];
    created_at?: string;
}

export default function LawyerApprovalsPage() {
    const [pendingLawyers, setPendingLawyers] = useState<PendingLawyer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchProcessing, setBatchProcessing] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/pending`);
            if (res.ok) {
                const data = await res.json();
                setPendingLawyers(data);
            }
        } catch (error) {
            console.error("Failed to fetch pending lawyers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    // Selection handlers
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pendingLawyers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingLawyers.map(l => l.id)));
        }
    };

    // Individual actions
    const handleVerify = async (id: string) => {
        if (!confirm("이 변호사를 승인하시겠습니까?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${id}/verify`, { method: "POST" });
            if (res.ok) {
                setPendingLawyers(prev => prev.filter(l => l.id !== id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                alert("승인되었습니다.");
            }
        } catch (error) {
            console.error("Failed to verify", error);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("이 변호사의 가입을 반려하시겠습니까?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${id}/reject`, { method: "POST" });
            if (res.ok) {
                setPendingLawyers(prev => prev.filter(l => l.id !== id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                alert("반려되었습니다.");
            }
        } catch (error) {
            console.error("Failed to reject", error);
        }
    };

    // Batch actions
    const handleBatchVerify = async () => {
        if (selectedIds.size === 0) return alert("선택된 변호사가 없습니다.");
        if (!confirm(`${selectedIds.size}명의 변호사를 일괄 승인하시겠습니까?`)) return;

        setBatchProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/batch-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lawyer_ids: Array.from(selectedIds) }),
            });
            if (res.ok) {
                const result = await res.json();
                setPendingLawyers(prev => prev.filter(l => !selectedIds.has(l.id)));
                setSelectedIds(new Set());
                alert(result.message);
            }
        } catch (error) {
            console.error("Batch verify failed", error);
            alert("일괄 승인 중 오류가 발생했습니다.");
        } finally {
            setBatchProcessing(false);
        }
    };

    const handleBatchReject = async () => {
        if (selectedIds.size === 0) return alert("선택된 변호사가 없습니다.");
        if (!confirm(`${selectedIds.size}명의 변호사를 일괄 반려하시겠습니까?`)) return;

        setBatchProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/batch-reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lawyer_ids: Array.from(selectedIds) }),
            });
            if (res.ok) {
                const result = await res.json();
                setPendingLawyers(prev => prev.filter(l => !selectedIds.has(l.id)));
                setSelectedIds(new Set());
                alert(result.message);
            }
        } catch (error) {
            console.error("Batch reject failed", error);
            alert("일괄 반려 중 오류가 발생했습니다.");
        } finally {
            setBatchProcessing(false);
        }
    };

    const allSelected = pendingLawyers.length > 0 && selectedIds.size === pendingLawyers.length;

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <AdminMenu />

            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center max-w-5xl mx-auto mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-main font-serif italic">변호사 가입 승인</h1>
                        <p className="text-zinc-500 font-medium text-sm mt-1">
                            신규 가입 변호사 심사 및 승인 관리
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* Batch Action Buttons */}
                        {selectedIds.size > 0 && (
                            <>
                                <span className="text-sm font-semibold text-point">
                                    {selectedIds.size}명 선택
                                </span>
                                <button
                                    onClick={handleBatchReject}
                                    disabled={batchProcessing}
                                    className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                    일괄 반려
                                </button>
                                <button
                                    onClick={handleBatchVerify}
                                    disabled={batchProcessing}
                                    className="px-5 py-2.5 bg-main text-white rounded-xl text-sm font-semibold hover:bg-main/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <CheckIcon className="w-4 h-4" />
                                    일괄 승인
                                </button>
                            </>
                        )}
                        <button
                            onClick={fetchPending}
                            className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-point/5 transition-colors border border-point/20"
                            title="새로고침"
                        >
                            <ArrowPathIcon className={`w-5 h-5 text-main ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-point/10 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-50">
                                <div className="w-6 h-6 text-amber-500 font-bold text-center">⏳</div>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400 font-medium">대기 중</p>
                                <p className="text-2xl font-bold text-main">{pendingLawyers.length}<span className="text-sm font-normal text-zinc-400 ml-1">명</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-point/10 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50">
                                <div className="w-6 h-6 text-blue-500 font-bold text-center">✓</div>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400 font-medium">선택됨</p>
                                <p className="text-2xl font-bold text-main">{selectedIds.size}<span className="text-sm font-normal text-zinc-400 ml-1">명</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-point/10 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-50">
                                <div className="w-6 h-6 text-green-500 font-bold text-center">🛡</div>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400 font-medium">금일 승인</p>
                                <p className="text-2xl font-bold text-main">—</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-zinc-400 animate-pulse font-medium">
                            데이터 로딩 중...
                        </div>
                    ) : pendingLawyers.length === 0 ? (
                        <div className="bg-white p-20 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center border border-point/10">
                            <div className="text-5xl mb-4">🎉</div>
                            <p className="text-lg text-zinc-400 font-medium">대기 중인 가입 변호사가 없습니다.</p>
                            <p className="text-sm text-zinc-300 mt-1">모든 가입 신청이 처리되었습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header with Select All */}
                            <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-t-2xl border border-point/10 border-b-0">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4.5 h-4.5 rounded-md border-2 border-zinc-300 text-main focus:ring-main/30 cursor-pointer accent-[#1d1d1f]"
                                    />
                                    <span className="text-sm font-semibold text-zinc-500 group-hover:text-main transition-colors">
                                        전체 선택 ({pendingLawyers.length}명)
                                    </span>
                                </label>
                            </div>

                            {/* Lawyer List */}
                            <div className="grid gap-0 border border-point/10 rounded-b-2xl overflow-hidden">
                                {pendingLawyers.map((lawyer, idx) => (
                                    <div
                                        key={lawyer.id}
                                        className={`bg-white p-6 flex items-center gap-6 transition-all duration-200 hover:bg-point/3 ${idx < pendingLawyers.length - 1 ? "border-b border-point/10" : ""
                                            } ${selectedIds.has(lawyer.id) ? "bg-blue-50/50 ring-1 ring-inset ring-blue-200/50" : ""}`}
                                    >
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(lawyer.id)}
                                            onChange={() => toggleSelect(lawyer.id)}
                                            className="w-4.5 h-4.5 rounded-md border-2 border-zinc-300 text-main focus:ring-main/30 cursor-pointer flex-shrink-0 accent-[#1d1d1f]"
                                        />

                                        {/* Lawyer Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-semibold text-lg text-main">{lawyer.name} 변호사</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold uppercase">심사 중</span>
                                            </div>
                                            <p className="text-sm text-zinc-500 truncate">
                                                {lawyer.firm} | {lawyer.id} | {lawyer.phone}
                                            </p>
                                            {lawyer.career && (
                                                <p className="text-xs text-zinc-400 mt-1 truncate">{lawyer.career}</p>
                                            )}
                                            {lawyer.expertise && lawyer.expertise.length > 0 && (
                                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                                    {lawyer.expertise.slice(0, 5).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] rounded-md font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            {lawyer.licenseImageUrl && (
                                                <a
                                                    href={`${API_BASE}${lawyer.licenseImageUrl}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-semibold hover:bg-zinc-200 transition-colors text-sm"
                                                >
                                                    자격증 확인
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleReject(lawyer.id)}
                                                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm"
                                            >
                                                반려
                                            </button>
                                            <button
                                                onClick={() => handleVerify(lawyer.id)}
                                                className="px-5 py-2.5 bg-main text-white rounded-xl font-semibold hover:bg-main/90 transition-colors shadow-sm text-sm"
                                            >
                                                승인
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
