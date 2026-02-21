"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function LawyerSubmitPage() {
    const [step, setStep] = useState(1);
    const [lawyerId, setLawyerId] = useState("");
    const [formData, setFormData] = useState({
        type: "column",
        title: "",
        summary: "",
        content: "",
        topic_tags: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // meaningful validation would happen here
        if (lawyerId.length > 5) { // Simple mock check
            setStep(2);
            setError("");
        } else {
            setError("유효한 변호사 ID를 입력해주세요.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const tags = formData.topic_tags.split(",").map(t => t.trim()).filter(t => t);

            const res = await fetch(`http://localhost:8000/api/lawyers/${lawyerId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    topic_tags: tags
                })
            });

            if (!res.ok) throw new Error("제출 실패. 변호사 ID를 확인해주세요.");

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 p-6 flex justify-center items-center font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 md:p-12 border border-neutral-200 dark:border-zinc-800"
            >
                <div className="mb-8">
                    <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 flex items-center gap-1 mb-4">
                        <ArrowLeftIcon className="w-4 h-4" /> 메인으로 돌아가기
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">전문 콘텐츠 등록</h1>
                    <p className="text-neutral-500 text-sm">
                        승소 사례, 법률 칼럼, 블로그 포스트를 등록하여 전문성을 입증하세요.<br />
                        관리자 승인 후 프로필에 노출됩니다.
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-10">
                        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2">제출 완료</h2>
                        <p className="text-neutral-500 mb-8">
                            콘텐츠가 성공적으로 제출되었습니다.<br />
                            관리자 심사 후 반영됩니다.
                        </p>
                        <button
                            onClick={() => { setSuccess(false); setFormData({ type: "column", title: "", summary: "", content: "", topic_tags: "" }); }}
                            className="bg-neutral-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                        >
                            추가 등록하기
                        </button>
                    </div>
                ) : step === 1 ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">변호사 ID 입력</label>
                            <input
                                type="text"
                                value={lawyerId}
                                onChange={(e) => setLawyerId(e.target.value)}
                                placeholder="제공된 변호사 고유 ID"
                                className="w-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
                                required
                            />
                            <p className="text-xs text-neutral-400 mt-2">
                                * 테스트용 ID 예시: lawyer_1, lawyer_2...
                            </p>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full bg-[#1E293B] text-white p-3 rounded-lg font-bold hover:bg-[#0f172a] transition-colors">
                            인증하고 시작하기
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex gap-4">
                            <label className="flex-1">
                                <span className="block text-sm font-bold mb-2">콘텐츠 유형</span>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg p-3"
                                >
                                    <option value="column">법률 칼럼</option>
                                    <option value="case">승소 사례</option>
                                    <option value="blog">블로그 포스트</option>
                                    <option value="lecture">강연/세미나</option>
                                    <option value="book">저서</option>
                                </select>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">제목</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg p-3"
                                placeholder="예: 전세사기 피해 예방을 위한 법률 가이드"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">요약 (3~4줄)</label>
                            <textarea
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                className="w-full bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg p-3 h-24 resize-none"
                                placeholder="검색 결과 및 추천에 활용될 핵심 내용을 요약해주세요."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">본문 내용 또는 링크 URL</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg p-3 h-40"
                                placeholder="전체 텍스트를 입력하거나, 외부 블로그/기사 링크를 입력하세요."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">관련 태그 (콤마로 구분)</label>
                            <input
                                type="text"
                                value={formData.topic_tags}
                                onChange={(e) => setFormData({ ...formData, topic_tags: e.target.value })}
                                className="w-full bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg p-3"
                                placeholder="예: 부동산, 전세사기, 임대차보호법"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-400 p-3 rounded-lg font-bold"
                            >
                                뒤로
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] bg-[#1E293B] text-white p-3 rounded-lg font-bold hover:bg-[#0f172a] transition-colors disabled:opacity-50"
                            >
                                {loading ? "제출 중..." : "제출하기"}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </main>
    );
}
