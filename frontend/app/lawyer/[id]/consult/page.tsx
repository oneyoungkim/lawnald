"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface LawyerDetail {
    id: string;
    name: string;
    firm: string;
    location: string;
    imageUrl?: string;
    introduction_short?: string;
}

export default function ConsultationRequestPage() {
    const params = useParams();
    const router = useRouter();
    const lawyerId = params.id as string;

    const [lawyer, setLawyer] = useState<LawyerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        client_name: "",
        client_phone: "",
        text: ""
    });

    useEffect(() => {
        if (!lawyerId) return;

        const fetchLawyer = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/public/lawyers/${lawyerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLawyer(data);
                }
            } catch (e) {
                console.error("Failed to fetch lawyer", e);
            } finally {
                setLoading(false);
            }
        };

        fetchLawyer();
    }, [lawyerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.client_name || !formData.client_phone || !formData.text) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("http://localhost:8000/api/consultations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lawyer_id: lawyerId,
                    ...formData,
                    chat_client_id: localStorage.getItem("lawnald_chat_client_id") // Include chat ID if available
                })
            });

            if (res.ok) {
                alert("상담 신청이 완료되었습니다. 변호사가 곧 연락드릴 예정입니다.");
                router.push(`/lawyer/${lawyerId}`);
            } else {
                alert("상담 신청 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error("Error submitting consultation", e);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    if (!lawyer) return <div className="min-h-screen flex items-center justify-center">변호사를 찾을 수 없습니다.</div>;

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 font-sans p-6 md:p-12">
            <div className="max-w-2xl mx-auto">
                <Link
                    href={`/lawyer/${lawyerId}`}
                    className="inline-flex items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    프로필로 돌아가기
                </Link>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
                    {/* Lawyer Info Header */}
                    <div className="flex items-center gap-6 mb-10 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="relative w-20 h-20 shrink-0">
                            <Image
                                src={lawyer.imageUrl || "/placeholder.png"}
                                alt={lawyer.name}
                                width={80}
                                height={80}
                                className="object-cover rounded-full border border-zinc-200 dark:border-zinc-700"
                                unoptimized={lawyer.imageUrl?.startsWith("http") || false}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold mb-1">{lawyer.name} 변호사에게 상담 신청</h1>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                {lawyer.firm} · {lawyer.location}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    신청자 성함
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="홍길동"
                                    value={formData.client_name}
                                    onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    연락처
                                </label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="010-1234-5678"
                                    value={formData.client_phone}
                                    onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                상담 내용 / 사연
                            </label>
                            <textarea
                                className="w-full h-48 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none leading-relaxed"
                                placeholder="현재 겪고 계신 법률 문제나 궁금한 점을 자세히 적어주세요. 변호사가 내용을 미리 검토하고 연락드립니다."
                                value={formData.text}
                                onChange={e => setFormData({ ...formData, text: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-main hover:bg-main/90 disabled:bg-zinc-300 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-main/20 hover:shadow-main/30 transform hover:-translate-y-0.5"
                            >
                                {submitting ? "신청 처리 중..." : "상담 신청하기"}
                            </button>
                            <p className="text-center text-xs text-zinc-400 mt-4">
                                신청하신 내용은 변호사에게 직접 전달되며, 비밀이 철저히 보장됩니다.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
