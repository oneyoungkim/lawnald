"use client";

import { API_BASE } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPostActions({ postId }: { postId: string }) {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (token) setIsAdmin(true);
    }, []);

    if (!isAdmin) return null;

    const handleDelete = async () => {
        if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
        setDeleting(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(`${API_BASE}/api/admin/blog/manage/${postId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                alert("삭제되었습니다");
                router.push("/insights");
            } else {
                alert("삭제 실패");
            }
        } catch {
            alert("서버 연결 실패");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f] border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Admin</span>
            <button
                onClick={() => router.push(`/admin/blog/write?edit=${postId}`)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
                ✏️ 수정
            </button>
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
            >
                {deleting ? "삭제 중..." : "🗑️ 삭제"}
            </button>
        </div>
    );
}
