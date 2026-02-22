"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewColumnPage() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: ""
    });

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            setLawyer(JSON.parse(stored));
        } else {
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lawyer.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "column",
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags.split(",").map(s => s.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                alert("법률 칼럼이 등록 접수되었습니다. 관리자 승인 후 매거진에 발행됩니다.");
                router.push("/lawyer/dashboard");
            } else {
                alert("등록 실패");
            }
        } catch (error) {
            console.error(error);
            alert("오류 발생");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-6 pb-24">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">법률 칼럼 작성</h1>
                    <Link href="/lawyer/dashboard" className="text-sm text-neutral-500 hover:text-black">
                        취소하고 돌아가기
                    </Link>
                </header>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800 p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-1">칼럼 제목</label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-lg font-bold"
                            placeholder="예: 전세사기 피해 예방을 위한 3가지 체크리스트"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">본문 내용</label>
                        <textarea
                            required
                            rows={15}
                            className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-200 leading-relaxed"
                            placeholder="법률 지식, 판례 분석, 실무 경험 등을 자유롭게 작성해주세요."
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">관련 키워드 (태그)</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                            placeholder="부동산, 전세, 임대차보호법 등 (콤마로 구분)"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity mt-4"
                    >
                        {loading ? "발행 신청 중..." : "칼럼 발행 신청하기"}
                    </button>
                </form>
            </div>
        </main>
    );
}
