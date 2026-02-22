"use client";

import { API_BASE } from "@/lib/api";

import { motion, AnimatePresence } from "framer-motion";
import TypingText from "../components/TypingText";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import LawyerCard from "../components/LawyerCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Lawyer {
    id: string;
    name: string;
    firm: string;
    location: string;
    career: string;
    education?: string;
    careerTags?: string[];
    gender?: string;
    expertise: string[];
    matchScore: number;
    bestCase: {
        title: string;
        summary: string;
    };
    bestContent?: { // Added for magazine integration
        title: string;
        summary: string;
        type: string;
        topic_tags: string[];
    };
    imageUrl?: string;
    cutoutImageUrl?: string;
    bgRemoveStatus?: string;
    practiceScore?: number;
    analysis_reason?: string;
    content_items?: any[];
    content_highlights?: string;
    phone?: string;
    homepage?: string;
    kakao_id?: string;
    isOnline?: boolean;
}

interface AnalysisDetails {
    case_nature: string;
    category: string;
    core_risk: string;
    time_strategy: string;
    urgency: string;
    procedure: string;
    necessity_score: number;
    cost_range: string;
    one_line_summary?: string;
    key_issues?: string[];
    action_checklist?: string[];
}

function ResultPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [analysis, setAnalysis] = useState("");
    const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDetails, setShowDetails] = useState(true);

    // Filter States
    const [selectedGender, setSelectedGender] = useState("");
    const [selectedEducation, setSelectedEducation] = useState("");
    const [selectedCareer, setSelectedCareer] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(""); // Added Location State

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const fetchLawyers = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("q", query);
                if (selectedGender) params.append("gender", selectedGender);
                if (selectedEducation) params.append("education", selectedEducation);
                if (selectedCareer) params.append("career", selectedCareer);
                if (selectedLocation) params.append("location", selectedLocation); // Added Location Param

                const res = await fetch(`${API_BASE}/api/recommend?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch recommendations");
                const data = await res.json();

                // Handle new response format { lawyers: [], analysis: "" }
                if (data.lawyers) {
                    setLawyers(data.lawyers);
                    setAnalysis(data.analysis || "");
                    setAnalysisDetails(data.analysis_details || null);
                } else {
                    // Fallback for old format (List[Lawyer])
                    setLawyers(data);
                }
            } catch (err) {
                console.error(err);
                setError("추천 결과를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchLawyers();
    }, [query, selectedGender, selectedEducation, selectedCareer, selectedLocation]); // Added selectedLocation dependency

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <h1 className="sr-only">AI 변호사 추천 결과</h1>
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="mb-4 flex items-center justify-between">
                    <Link href="/" className="text-sm font-medium text-[#64748B] hover:text-[#1E293B] dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                        &larr; 다시 검색하기
                    </Link>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                        <div className="w-16 h-16 border-4 border-[#1E293B]/20 border-t-[#1E293B] rounded-full animate-spin mb-8" />
                        <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-2">AI 로날드가 법률 데이터를 분석 중입니다</h2>
                        <TypingText
                            text="판례 데이터베이스 대조 중... 유사 승소 사례 검색 중... 변호사 전문성 매칭 중..."
                            className="text-[#64748B] dark:text-zinc-400 text-sm font-mono"
                            speed={0.05}
                        />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-center animate-fade-in-up">
                        {error}
                    </div>
                )}

                {/* AI Case Insight (Briefing Style) */}
                {!loading && !error && analysisDetails && (
                    <div className="mb-16 animate-fade-in-up">
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-zinc-800">
                            {/* Header: Core Summary */}
                            <div className="mb-10 text-center max-w-3xl mx-auto">
                                <h2 className="text-3xl md:text-3xl font-serif font-medium text-main leading-tight tracking-tight mb-4 break-keep">
                                    {analysisDetails.one_line_summary || analysis}
                                </h2>
                                <p className="text-[#86868b] text-sm font-medium tracking-wide uppercase">
                                    AI Legal Briefing • {analysisDetails.urgency} 상황입니다
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 border-t border-gray-100 dark:border-zinc-800 pt-10">
                                {/* Left: Key Issues */}
                                <div>
                                    <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2">
                                        핵심 쟁점
                                    </h3>
                                    <ul className="space-y-4">
                                        {(analysisDetails.key_issues || [analysisDetails.core_risk]).map((issue, idx) => (
                                            <li key={idx} className="flex cross-start gap-3 text-[15px] leading-relaxed text-[#424245] dark:text-zinc-300">
                                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1d1d1f] dark:bg-zinc-500 mt-2.5" />
                                                <span>{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Right: Action Plan */}
                                <div>
                                    <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2">
                                        대응 및 행동 제안
                                    </h3>
                                    <div className="space-y-5">
                                        {(analysisDetails.action_checklist || [analysisDetails.time_strategy]).map((action, idx) => (
                                            <div key={idx} className="flex gap-4 items-start group">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-300 dark:border-zinc-700 flex items-center justify-center mt-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 transition-colors">{idx + 1}</span>
                                                </div>
                                                <p className="text-[15px] leading-relaxed text-[#424245] dark:text-zinc-300 break-keep">
                                                    {action}
                                                </p>
                                            </div>
                                        ))}

                                        {/* Fallback/Additional Time Strategy if not in checklist */}
                                        {!analysisDetails.action_checklist && analysisDetails.time_strategy && (
                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-sm text-[#6e6e73] dark:text-zinc-400 leading-relaxed">
                                                💡 {analysisDetails.time_strategy}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-3 py-2 text-sm border-0 rounded-lg bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-lawnald"
                    >
                        <option value="">지역 전체</option>
                        <option value="서울">서울</option>
                        <option value="경기">경기</option>
                        <option value="인천">인천</option>
                        <option value="부산">부산</option>
                        <option value="대구">대구</option>
                        <option value="광주">광주</option>
                        <option value="대전">대전</option>
                    </select>

                    <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="px-3 py-2 text-sm border-0 rounded-lg bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-lawnald"
                    >
                        <option value="">성별 전체</option>
                        <option value="Male">남성</option>
                        <option value="Female">여성</option>
                    </select>

                    <select
                        value={selectedEducation}
                        onChange={(e) => setSelectedEducation(e.target.value)}
                        className="px-3 py-2 text-sm border-0 rounded-lg bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-lawnald"
                    >
                        <option value="">출신 전체</option>
                        <option value="법학전문대학원">로스쿨</option>
                    </select>

                    <select
                        value={selectedCareer}
                        onChange={(e) => setSelectedCareer(e.target.value)}
                        className="px-3 py-2 text-sm border-0 rounded-lg bg-white dark:bg-zinc-800 focus:ring-1 focus:ring-lawnald"
                    >
                        <option value="">경력 전체</option>
                        <option value="대형 로펌 출신">대형 로펌 출신</option>
                    </select>
                </div>



                {error && (
                    <div className="text-center py-20 text-red-500">
                        {error}
                    </div>
                )}

                {!loading && !error && lawyers.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        검색 결과가 없습니다. 필터를 변경하거나 다른 사연으로 시도해보세요.
                    </div>
                )}

                <div className="space-y-4">
                    {lawyers.map((lawyer) => (
                        <div
                            key={lawyer.id}
                        >
                            <LawyerCard lawyer={lawyer} query={query || ""} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
        }>
            <ResultPageContent />
        </Suspense>
    );
}
