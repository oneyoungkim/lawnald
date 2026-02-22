"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import {
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import LawyerMenu from "../../components/LawyerMenu";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MagazineItem {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    type: string;
    title: string;
    date: string;
    verified: boolean;
    source: string;
    view_count?: number;
}

export default function LawyerMagazinePage() {
    const [items, setItems] = useState<MagazineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [lawyerId, setLawyerId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyerId(parsed.id);
            }
        }
    }, []);

    const fetchItems = async () => {
        if (!lawyerId) return;

        setLoading(true);
        try {
            // Fetch all and filter client-side for now
            const res = await fetch(`${API_BASE}/api/admin/magazine/all`);
            if (res.ok) {
                const data = await res.json();
                // Filter by current lawyer
                const myItems = data.filter((item: MagazineItem) => item.lawyer_id === lawyerId);
                setItems(myItems);
            }
        } catch (error) {
            console.error("Failed to fetch magazine items", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lawyerId) {
            fetchItems();
        }
    }, [lawyerId]);

    const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/content/${id}/toggle-visibility`, {
                method: "POST"
            });
            if (res.ok) {
                setItems(prev => prev.map(item =>
                    item.id === id ? { ...item, verified: !currentStatus } : item
                ));
            }
        } catch (error) {
            alert("상태 변경 실패");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말로 이 콘텐츠를 삭제하시겠습니까? (복구 불가)")) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/content/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setItems(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            alert("삭제 실패");
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F5F5F7] dark:bg-black font-sans">
            <div className="flex min-h-screen bg-background font-sans">
                <LawyerMenu />

                <main className="flex-1 ml-64 p-8">
                    <header className="flex justify-between items-center max-w-6xl mx-auto mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold tracking-tight text-main">매거진 관리</h1>
                            <p className="text-[#86868b] font-medium text-sm mt-1">내가 작성한 칼럼과 콘텐츠를 관리합니다.</p>
                        </div>
                        <Link
                            href="/lawyer/magazine/write"
                            className="flex items-center gap-2 px-5 py-2.5 bg-main hover:bg-main/90 text-white rounded-full font-medium transition-colors shadow-lg shadow-main/20"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            <span>새 글 쓰기</span>
                        </Link>
                    </header>

                    <div className="max-w-6xl mx-auto">
                        {/* Search Bar */}
                        <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm mb-6 flex items-center gap-3">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="제목 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-zinc-800 text-[13px] text-[#86868b] font-medium">
                                        <th className="p-5 pl-8 w-20">유형</th>
                                        <th className="p-5">제목</th>
                                        <th className="p-5 w-32">작성일</th>
                                        <th className="p-5 w-24 text-center">조회수</th>
                                        <th className="p-5 w-24 text-center">상태</th>
                                        <th className="p-5 w-40 text-center">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-[#86868b]">로딩 중...</td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-[#86868b]">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>아직 작성된 글이 없습니다.</span>
                                                    <Link href="/lawyer/magazine/write" className="text-blue-500 hover:underline">
                                                        첫 글 작성하기
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-5 pl-8">
                                                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold rounded text-[#86868b] uppercase">
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <span className="font-medium text-[#1d1d1f] dark:text-gray-200 block truncate max-w-md">
                                                        {item.title}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-sm text-[#86868b]">{item.date}</td>
                                                <td className="p-5 text-center text-sm text-[#86868b]">
                                                    {item.view_count || 0}
                                                </td>
                                                <td className="p-5 text-center">
                                                    {item.verified ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                            <CheckCircleIcon className="w-3 h-3" /> 공개중
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                            <EyeSlashIcon className="w-3 h-3" /> 비공개
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleVisibility(item.id, item.verified)}
                                                        className={`p-2 rounded-lg transition-colors ${item.verified
                                                            ? "text-orange-500 hover:bg-orange-50 bg-orange-50/50"
                                                            : "text-blue-500 hover:bg-blue-50 bg-blue-50/50"}`}
                                                        title={item.verified ? "비공개로 전환" : "공개로 전환"}
                                                    >
                                                        {item.verified ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 bg-red-50/50 rounded-lg transition-colors"
                                                        title="삭제하기"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
