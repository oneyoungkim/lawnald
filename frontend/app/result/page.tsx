"use client";

import { API_BASE } from "@/lib/api";

import { motion, AnimatePresence } from "framer-motion";
import TypingText from "../components/TypingText";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import LawyerCard from "../components/LawyerCard";
import StickyCardWrapper from "../components/StickyCardWrapper";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";

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
    const lawyerListRef = useRef<HTMLDivElement>(null);
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
    }, [query, selectedGender, selectedEducation, selectedCareer, selectedLocation]);

    // Auto-scroll to lawyer list after briefing is shown
    useEffect(() => {
        if (!loading && lawyers.length > 0 && lawyerListRef.current) {
            const timer = setTimeout(() => {
                lawyerListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [loading, lawyers]);

    return (
        <div className="min-h-screen bg-white text-black pt-24 pb-20" style={{ colorScheme: 'light' }}>
            <h1 className="sr-only">AI 변호사 추천 결과</h1>
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="mb-4 flex items-center justify-between">
                    <Link href="/" className="text-sm font-medium text-[#64748B] hover:text-[#1E293B] dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                        &larr; 다시 검색하기
                    </Link>
                </div>

                <AnimatePresence mode="wait">
                    {/* Loading State */}
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-16 h-16 border-4 border-[#1E293B]/20 border-t-[#1E293B] rounded-full animate-spin mb-8" />
                            <h2 className="text-2xl font-bold text-[#1E293B] dark:text-white mb-2">AI 로날드가 법률 데이터를 분석 중입니다</h2>
                            <TypingText
                                text="판례 데이터베이스 대조 중... 유사 승소 사례 검색 중... 변호사 전문성 매칭 중..."
                                className="text-[#64748B] dark:text-zinc-400 text-sm font-mono"
                                speed={0.05}
                            />
                        </motion.div>
                    )}

                    {/* Error State */}
                    {error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* AI Case Insight (Briefing Style) */}
                    {!loading && !error && analysisDetails && (
                        <motion.div
                            key="insight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="mb-16"
                        >
                            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100">
                                {/* Header: Core Summary */}
                                <div className="mb-10 text-center max-w-3xl mx-auto">
                                    <h2 className="text-3xl md:text-3xl font-serif font-medium text-main leading-tight tracking-tight mb-4 break-keep">
                                        {analysisDetails.one_line_summary || analysis}
                                    </h2>
                                    <p className="text-[#86868b] text-sm font-medium tracking-wide uppercase">
                                        AI Legal Briefing • {analysisDetails.urgency} 상황입니다
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 border-t border-gray-100 pt-10">
                                    {/* Left: Key Issues */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
                                            핵심 쟁점
                                        </h3>
                                        <ul className="space-y-4">
                                            {(analysisDetails.key_issues?.length ? analysisDetails.key_issues : [analysisDetails.core_risk].filter(Boolean)).map((issue: string, idx: number) => (
                                                <li key={idx} className="flex cross-start gap-3 text-[15px] leading-relaxed text-[#424245]">
                                                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1d1d1f] mt-2.5" />
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Right: Action Plan */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
                                            대응 및 행동 제안
                                        </h3>
                                        <div className="space-y-5">
                                            {(analysisDetails.action_checklist?.length ? analysisDetails.action_checklist : [analysisDetails.time_strategy].filter(Boolean)).map((action: string, idx: number) => (
                                                <div key={idx} className="flex gap-4 items-start group">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mt-0.5">
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors">{idx + 1}</span>
                                                    </div>
                                                    <p className="text-[15px] leading-relaxed text-[#424245] break-keep">
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters — Pill/Chip Style */}
                <div className="mb-8 space-y-3">
                    {/* Location */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-12 shrink-0">지역</span>
                        {[{ v: "", l: "전체" }, { v: "서울", l: "서울" }, { v: "경기", l: "경기" }, { v: "인천", l: "인천" }, { v: "부산", l: "부산" }, { v: "대구", l: "대구" }, { v: "광주", l: "광주" }, { v: "대전", l: "대전" }].map(o => (
                            <button key={o.v} type="button" onClick={() => setSelectedLocation(o.v)}
                                className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${selectedLocation === o.v ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'}`}
                            >{o.l}</button>
                        ))}
                    </div>
                    {/* Gender */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-12 shrink-0">성별</span>
                        {[{ v: "", l: "전체" }, { v: "Male", l: "남성" }, { v: "Female", l: "여성" }].map(o => (
                            <button key={o.v} type="button" onClick={() => setSelectedGender(o.v)}
                                className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${selectedGender === o.v ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'}`}
                            >{o.l}</button>
                        ))}
                    </div>
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

                <div ref={lawyerListRef} className="relative">
                    {lawyers.map((lawyer, index) => (
                        <StickyCardWrapper key={lawyer.id} index={index} total={lawyers.length}>
                            <LawyerCard lawyer={lawyer} query={query || ""} index={index} />
                        </StickyCardWrapper>
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
