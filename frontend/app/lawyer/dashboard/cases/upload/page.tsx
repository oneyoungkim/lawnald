
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function CaseUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.type !== "application/pdf") {
                setError("PDF 파일만 업로드 가능합니다.");
                return;
            }
            setFile(selected);
            setError(null);
            // Auto upload for preview
            handleUpload(selected);
        }
    };

    const handleUpload = async (uploadFile: File) => {
        setLoading(true);
        const formData = new FormData();
        formData.append("file", uploadFile);

        try {
            const res = await fetch("http://localhost:8000/api/cases/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Upload failed");
            }

            const data = await res.json();
            setPreview(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview) return;

        try {
            setLoading(true);
            const lawyerId = "welder49264@naver.com"; // Hardcoded for this context

            const payload = {
                case_number: preview.case_number,
                court: preview.court,
                title: preview.title,
                story: preview.client_story, // The narrative
                full_text: preview.full_text,
                lawyer_id: lawyerId,
                file_hash: preview.file_hash,
                ai_tags: preview.ai_tags,
                summary: preview.summary // Short excerpt
            };

            const res = await fetch("http://localhost:8000/api/cases/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Publishing failed");
            }

            alert("승소사례가 성공적으로 접수되었습니다. 관리자 승인 후 게시됩니다.");
            router.push("/lawyer/dashboard");

        } catch (err: any) {
            console.error(err);
            alert(`등록 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewChange = (field: string, value: string) => {
        setPreview((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold font-serif text-zinc-900 dark:text-white mb-3">승소사례 등록</h1>
                <p className="text-zinc-500 text-lg">판결문을 업로드하면 AI가 의뢰인의 마음을 움직이는 스토리를 작성해 드립니다.</p>
            </header>

            {!preview ? (
                <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-all shadow-xl shadow-zinc-200/50 dark:shadow-none">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <CloudArrowUpIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">판결문 PDF 드롭</h3>
                    <p className="text-zinc-500 mb-8 max-w-xs mx-auto">AI가 판결문을 정밀 분석하여 변호사님의 전략이 돋보이는 글을 추출합니다.</p>

                    <label className="cursor-pointer px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                        <span>파일 선택하기</span>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    </label>

                    {loading && (
                        <div className="mt-8 flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                            AI 스토리텔러가 글을 작성하고 있습니다...
                        </div>
                    )}
                    {error && <p className="mt-6 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-zinc-100 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-50 dark:border-zinc-800">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                                AI가 작성한 승소 스토리
                            </h2>
                            <button onClick={() => setPreview(null)} className="text-sm font-bold text-zinc-400 hover:text-red-500 transition-colors">
                                취소 및 다시 업로드
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">포스팅 제목</label>
                                <input
                                    className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xl font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    value={preview.title}
                                    onChange={(e) => handlePreviewChange("title", e.target.value)}
                                    placeholder="매력적인 제목을 입력하세요"
                                />
                            </div>

                            <div>
                                <label className="flex justify-between items-center text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                                    <span>승소 사례 본문 (약 1000자)</span>
                                    <span className="text-blue-600 normal-case font-bold">{preview.client_story?.length || 0}자</span>
                                </label>
                                <textarea
                                    className="w-full p-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-lg leading-relaxed border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none min-h-[400px]"
                                    value={preview.client_story}
                                    onChange={(e) => handlePreviewChange("client_story", e.target.value)}
                                    placeholder="AI가 생성한 스토리를 다듬어보세요."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">사건 번호</label>
                                    <input
                                        className="w-full bg-transparent font-mono font-bold text-zinc-900 dark:text-zinc-100"
                                        value={preview.case_number}
                                        onChange={(e) => handlePreviewChange("case_number", e.target.value)}
                                    />
                                </div>
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">법원</label>
                                    <input
                                        className="w-full bg-transparent font-bold text-zinc-900 dark:text-zinc-100"
                                        value={preview.court}
                                        onChange={(e) => handlePreviewChange("court", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">검색 태그</label>
                                <input
                                    className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm border-2 border-transparent focus:border-blue-500 transition-all outline-none"
                                    value={preview.ai_tags}
                                    onChange={(e) => handlePreviewChange("ai_tags", e.target.value)}
                                    placeholder="쉼표로 태그를 구분하세요 (예: 음주운전, 무죄, 집행유예)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800">
                        <div className="text-blue-900 dark:text-blue-100">
                            <p className="font-bold">승인 요청 후 영업일 기준 1~2일 소요됩니다.</p>
                            <p className="text-sm opacity-80">관리자 검수를 통해 매거진에 노출되며, 승인 시 변호사 적합도 점수가 상승합니다.</p>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className={`px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? "등록 중..." : "승인 요청 및 등록"}
                            {!loading && <CheckCircleIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
