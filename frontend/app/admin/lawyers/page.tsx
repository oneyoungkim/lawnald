"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/solid";

interface Lawyer {
    id: string;
    name: string;
    firm: string;
    location: string;
    phone?: string;
    homepage?: string;
    kakao_id?: string;
    career: string;
    education?: string;
    expertise: string[];
    content_highlights: string;
}

export default function AdminLawyersPage() {
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit Modal State
    const [editingLawyer, setEditingLawyer] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        firm: "",
        location: "",
        phone: "",
        homepage: "",
        kakao_id: "",
        career: "",
        education: "",
        expertise: ""
    });

    const handleSaveProfile = async () => {
        if (!editingLawyer) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${editingLawyer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editForm.name,
                    firm: editForm.firm,
                    location: editForm.location,
                    phone: editForm.phone,
                    homepage: editForm.homepage,
                    kakao_id: editForm.kakao_id,
                    career: editForm.career,
                    education: editForm.education,
                    expertise: editForm.expertise.split(",").map(s => s.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                alert("수정되었습니다.");
                setEditingLawyer(null);
                fetchLawyers();
            } else {
                alert("수정 실패");
            }
        } catch (error) {
            console.error(error);
            alert("서버 통신 오류");
        }
    };

    const fetchLawyers = async () => {
        setLoading(true);
        try {
            // Use the direct admin endpoint to get ALL lawyers (raw DB)
            const res = await fetch("${API_BASE}/api/admin/lawyers");
            if (res.ok) {
                const data = await res.json();
                setLawyers(data); // Endpoint returns List[LawyerModel] directly
            }
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLawyers();
    }, []);

    const handleInject = async (lawyerId: string, type: string, count: number) => {
        if (!confirm(`${type} ${count}건을 강제로 추가하시겠습니까?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${lawyerId}/content/inject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, count })
            });
            if (res.ok) {
                alert("추가되었습니다.");
                fetchLawyers(); // Refresh to see updated highlights
            }
        } catch (error) {
            alert("Error: " + error);
        }
    };

    const filteredLawyers = lawyers.filter(l =>
        l.name.includes(searchTerm) || l.id.includes(searchTerm)
    );

    return (
        <main className="min-h-screen bg-neutral-100 dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 p-8 font-sans">
            <header className="flex justify-between items-center max-w-6xl mx-auto mb-8">
                <div>
                    <h1 className="text-3xl font-bold">변호사 데이터 관리</h1>
                    <p className="text-neutral-500">콘텐츠 강제 주입 및 데이터 수정</p>
                </div>
                <Link href="/admin/dashboard" className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm text-sm font-medium">
                    <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> 승인 대시보드
                </Link>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="이름 또는 ID 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-800"
                    />
                </div>

                <div className="grid gap-4">
                    {filteredLawyers.map(lawyer => (
                        <div key={lawyer.id} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{lawyer.name} <span className="text-xs text-neutral-400 font-normal">({lawyer.id})</span></h3>
                                <p className="text-sm text-neutral-500">{lawyer.firm}</p>
                                <p className="text-xs text-blue-600 mt-1">{lawyer.content_highlights || "콘텐츠 없음"}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingLawyer(lawyer);
                                        setEditForm({
                                            name: lawyer.name,
                                            firm: lawyer.firm,
                                            location: lawyer.location,
                                            phone: lawyer.phone || "",
                                            homepage: lawyer.homepage || "",
                                            kakao_id: lawyer.kakao_id || "",
                                            career: lawyer.career,
                                            education: lawyer.education || "",
                                            expertise: lawyer.expertise.join(", ")
                                        });
                                    }}
                                    className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded hover:bg-neutral-200 flex items-center gap-1"
                                >
                                    ✏️ 수정
                                </button>
                                <button
                                    onClick={() => handleInject(lawyer.id, "case", 5)}
                                    className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded hover:bg-red-100 flex items-center gap-1"
                                >
                                    <PlusIcon className="w-3 h-3" /> 승소 +5
                                </button>
                                <button
                                    onClick={() => handleInject(lawyer.id, "book", 1)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 flex items-center gap-1"
                                >
                                    <PlusIcon className="w-3 h-3" /> 저서 +1
                                </button>
                                <button
                                    onClick={() => handleInject(lawyer.id, "column", 3)}
                                    className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded hover:bg-green-100 flex items-center gap-1"
                                >
                                    <PlusIcon className="w-3 h-3" /> 칼럼 +3
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {editingLawyer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <div className="p-6 border-b border-neutral-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <h2 className="text-xl font-bold">변호사 정보 수정</h2>
                            <button onClick={() => setEditingLawyer(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                                <PlusIcon className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-1">이름</label>
                                    <input
                                        className="w-full p-3 bg-neutral-50 border rounded-lg"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-1">소속 로펌</label>
                                    <input
                                        className="w-full p-3 bg-neutral-50 border rounded-lg"
                                        value={editForm.firm}
                                        onChange={e => setEditForm({ ...editForm, firm: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-1">활동 지역</label>
                                <input
                                    className="w-full p-3 bg-neutral-50 border rounded-lg"
                                    value={editForm.location}
                                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-1">전화번호</label>
                                    <input
                                        className="w-full p-3 bg-neutral-50 border rounded-lg"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-1">홈페이지 URL</label>
                                    <input
                                        className="w-full p-3 bg-neutral-50 border rounded-lg"
                                        value={editForm.homepage}
                                        onChange={e => setEditForm({ ...editForm, homepage: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-1">카카오ID</label>
                                    <input
                                        className="w-full p-3 bg-neutral-50 border rounded-lg"
                                        value={editForm.kakao_id}
                                        onChange={e => setEditForm({ ...editForm, kakao_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-1">전문 분야 (콤마로 구분)</label>
                                <input
                                    className="w-full p-3 bg-neutral-50 border rounded-lg"
                                    placeholder="형사법 전문, 이혼 전문 등"
                                    value={editForm.expertise}
                                    onChange={e => setEditForm({ ...editForm, expertise: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-1">주요 경력</label>
                                <textarea
                                    className="w-full p-3 bg-neutral-50 border rounded-lg h-24"
                                    value={editForm.career}
                                    onChange={e => setEditForm({ ...editForm, career: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-1">학력</label>
                                <textarea
                                    className="w-full p-3 bg-neutral-50 border rounded-lg h-24"
                                    value={editForm.education}
                                    onChange={e => setEditForm({ ...editForm, education: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-neutral-100 dark:border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
                            <button
                                onClick={() => setEditingLawyer(null)}
                                className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-bold text-neutral-600"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30"
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
