"use client";

import { API_BASE } from "@/lib/api";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    CloudArrowUpIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

interface ParsedCase {
    index: number;
    filename: string;
    status: "success" | "error" | "duplicate";
    error?: string;
    data?: {
        case_number: string;
        court: string;
        title: string;
        introduction: string;
        strategy: string;
        verdict: string;
        client_story: string;
        client_story_raw?: string;
        ai_tags: string;
        summary: string;
        full_text: string;
        file_hash: string;
        detected_names: string[];
        has_name_warning: boolean;
    };
    // User edits
    confirmed: boolean;
}

export default function CaseUploadPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState<ParsedCase[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        if (files.length > 20) {
            setError("최대 20개 파일까지 업로드 가능합니다.");
            return;
        }

        // Filter PDFs only
        const pdfFiles = files.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (pdfFiles.length === 0) {
            setError("PDF 파일만 업로드 가능합니다.");
            return;
        }

        setError(null);
        setLoading(true);
        setProgress({ current: 0, total: pdfFiles.length });
        setResults([]);

        const formData = new FormData();
        pdfFiles.forEach(f => formData.append("files", f));

        try {
            const res = await fetch(`${API_BASE}/api/cases/bulk-upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "업로드 실패");
            }

            const data = await res.json();
            const parsedResults: ParsedCase[] = data.results.map((r: any) => ({
                ...r,
                confirmed: r.status === "success" && !r.data?.has_name_warning,
            }));
            setResults(parsedResults);
            setProgress({ current: data.total, total: data.total });

            if (data.name_warnings > 0) {
                setError(`⚠️ ${data.name_warnings}건에서 실명이 감지되었습니다. 확인 후 수정해주세요.`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateField = (index: number, field: string, value: string) => {
        setResults(prev =>
            prev.map(r =>
                r.index === index && r.data
                    ? { ...r, data: { ...r.data, [field]: value } }
                    : r
            )
        );
    };

    const handleToggleConfirm = (index: number) => {
        setResults(prev =>
            prev.map(r =>
                r.index === index ? { ...r, confirmed: !r.confirmed } : r
            )
        );
    };

    const handleRemove = (index: number) => {
        setResults(prev => prev.filter(r => r.index !== index));
    };

    const handleBulkPublish = async () => {
        const confirmed = results.filter(r => r.confirmed && r.data);
        if (confirmed.length === 0) {
            alert("게시할 사례를 선택해주세요.");
            return;
        }

        // Check for unresolved name warnings
        const unresolved = confirmed.filter(r => r.data?.has_name_warning);
        if (unresolved.length > 0) {
            if (!confirm(`⚠️ ${unresolved.length}건에 실명 경고가 있습니다. 그대로 게시하시겠습니까?`)) {
                return;
            }
        }

        setPublishing(true);
        try {
            const lawyerId = "welder49264@naver.com"; // TODO: 실제 로그인 변호사 ID

            const payload = {
                lawyer_id: lawyerId,
                cases: confirmed.map(r => ({
                    case_number: r.data!.case_number,
                    court: r.data!.court,
                    title: r.data!.title,
                    story: r.data!.client_story,
                    full_text: r.data!.full_text,
                    file_hash: r.data!.file_hash,
                    ai_tags: r.data!.ai_tags,
                    summary: r.data!.summary,
                })),
            };

            const res = await fetch(`${API_BASE}/api/cases/bulk-publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "게시 실패");
            }

            const data = await res.json();
            alert(`${data.published}건이 접수되었습니다. 관리자 승인 후 게시됩니다.`);
            router.push("/lawyer/dashboard");
        } catch (err: any) {
            alert(`오류: ${err.message}`);
        } finally {
            setPublishing(false);
        }
    };

    const successResults = results.filter(r => r.status === "success");
    const confirmedCount = results.filter(r => r.confirmed).length;

    // --- Initial Upload View ---
    if (results.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold font-serif text-zinc-900 dark:text-white mb-3">승소사례 일괄 등록</h1>
                    <p className="text-zinc-500 text-lg">판결문 PDF를 최대 20개까지 한꺼번에 업로드하면<br />AI가 자동으로 블로그 포스팅을 작성합니다.</p>
                </header>

                <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-all shadow-xl shadow-zinc-200/50 dark:shadow-none">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <CloudArrowUpIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">판결문 PDF 일괄 업로드</h3>
                    <p className="text-zinc-500 mb-3 max-w-md mx-auto">
                        AI가 각 판결문을 정밀 분석하여 변호사님의 전략이 돋보이는 승소사례 리포트를 자동 생성합니다.
                    </p>
                    <p className="text-xs text-zinc-400 mb-8">최대 20개 · PDF 형식만 가능 · 실명 자동 검출</p>

                    <label className="cursor-pointer px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                        <span>파일 선택하기 (다중 선택 가능)</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            multiple
                            onChange={handleFilesSelected}
                        />
                    </label>

                    {loading && (
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                                AI 분석 중... ({progress.current}/{progress.total})
                            </div>
                            <div className="w-64 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%" }}
                                />
                            </div>
                            <p className="text-xs text-zinc-400">파일 수에 따라 1~5분 소요될 수 있습니다</p>
                        </div>
                    )}

                    {error && <p className="mt-6 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>}
                </div>
            </div>
        );
    }

    // --- Results View ---
    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">AI 분석 완료</h1>
                        <p className="text-zinc-500 mt-1">
                            {successResults.length}건 성공 · {confirmedCount}건 선택됨
                            {results.filter(r => r.status === "error").length > 0 &&
                                ` · ${results.filter(r => r.status === "error").length}건 실패`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setResults([]); setError(null); }}
                            className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                        >
                            다시 업로드
                        </button>
                        <button
                            onClick={handleBulkPublish}
                            disabled={confirmedCount === 0 || publishing}
                            className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 ${confirmedCount === 0 || publishing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {publishing ? "게시 중..." : `${confirmedCount}건 일괄 게시 요청`}
                            {!publishing && <CheckCircleIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                {error && <p className="mt-4 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">{error}</p>}
            </header>

            <div className="space-y-4">
                {results.map((result) => (
                    <div
                        key={result.index}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm transition-all ${result.status === "error" ? "border-red-200 bg-red-50/30" :
                                result.status === "duplicate" ? "border-amber-200 bg-amber-50/30" :
                                    result.data?.has_name_warning ? "border-orange-300 bg-orange-50/30" :
                                        result.confirmed ? "border-green-300 bg-green-50/20" :
                                            "border-zinc-200 dark:border-zinc-800"
                            }`}
                    >
                        {/* Card Header */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Status Icon */}
                                {result.status === "error" ? (
                                    <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                                ) : result.status === "duplicate" ? (
                                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                ) : result.data?.has_name_warning ? (
                                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 flex-shrink-0" />
                                ) : result.confirmed ? (
                                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : (
                                    <DocumentTextIcon className="w-6 h-6 text-zinc-400 flex-shrink-0" />
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-zinc-900 dark:text-white truncate">
                                        {result.data?.title || result.filename}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs text-zinc-400">{result.filename}</span>
                                        {result.status === "error" && (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">실패</span>
                                        )}
                                        {result.status === "duplicate" && (
                                            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">중복</span>
                                        )}
                                        {result.data?.has_name_warning && (
                                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                                                ⚠ 실명 {result.data.detected_names.length}건 감지
                                            </span>
                                        )}
                                    </div>
                                    {result.error && (
                                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {result.status === "success" && (
                                    <>
                                        <button
                                            onClick={() => setExpandedIndex(expandedIndex === result.index ? null : result.index)}
                                            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            {expandedIndex === result.index ? "접기" : "상세보기"}
                                        </button>
                                        <button
                                            onClick={() => handleToggleConfirm(result.index)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${result.confirmed
                                                    ? "bg-green-500 text-white"
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-green-50 hover:text-green-600"
                                                }`}
                                        >
                                            {result.confirmed ? "✓ 확인됨" : "확인"}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleRemove(result.index)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Detail */}
                        {expandedIndex === result.index && result.data && (
                            <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-5">
                                {/* Name Warning */}
                                {result.data.has_name_warning && (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl p-4">
                                        <p className="font-bold text-orange-700 text-sm mb-2">⚠️ 실명 감지</p>
                                        <p className="text-xs text-orange-600 mb-2">다음 실명이 본문에서 감지되었습니다. 익명 처리가 완료되었는지 확인해주세요:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.data.detected_names.map((name, i) => (
                                                <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-300">
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">포스팅 제목</label>
                                    <input
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-lg font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                        value={result.data.title}
                                        onChange={(e) => handleUpdateField(result.index, "title", e.target.value)}
                                    />
                                </div>

                                {/* Story */}
                                <div>
                                    <label className="flex justify-between items-center text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                                        <span>승소 사례 본문</span>
                                        <span className="text-blue-600 normal-case font-bold">{result.data.client_story?.length || 0}자</span>
                                    </label>
                                    <textarea
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-base leading-relaxed border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none min-h-[300px]"
                                        value={result.data.client_story}
                                        onChange={(e) => handleUpdateField(result.index, "client_story", e.target.value)}
                                    />
                                </div>

                                {/* Meta Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">사건 번호</label>
                                        <input
                                            className="w-full bg-transparent font-mono font-bold text-zinc-900 dark:text-zinc-100"
                                            value={result.data.case_number}
                                            onChange={(e) => handleUpdateField(result.index, "case_number", e.target.value)}
                                        />
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">법원</label>
                                        <input
                                            className="w-full bg-transparent font-bold text-zinc-900 dark:text-zinc-100"
                                            value={result.data.court}
                                            onChange={(e) => handleUpdateField(result.index, "court", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">검색 태그</label>
                                    <input
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-2 border-transparent focus:border-blue-500 transition-all outline-none"
                                        value={result.data.ai_tags}
                                        onChange={(e) => handleUpdateField(result.index, "ai_tags", e.target.value)}
                                        placeholder="쉼표로 태그를 구분하세요"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 flex items-center justify-between p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800">
                <div className="text-blue-900 dark:text-blue-100">
                    <p className="font-bold">승인 요청 후 영업일 기준 1~2일 소요됩니다.</p>
                    <p className="text-sm opacity-80">관리자 검수를 통해 매거진에 노출되며, 승인 시 변호사 적합도 점수가 상승합니다.</p>
                </div>
                <button
                    onClick={handleBulkPublish}
                    disabled={confirmedCount === 0 || publishing}
                    className={`px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2 whitespace-nowrap ${confirmedCount === 0 || publishing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {publishing ? "등록 중..." : `${confirmedCount}건 일괄 게시`}
                    {!publishing && <CheckCircleIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}
