import Image from "next/image";
import Link from "next/link";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PhoneIcon, GlobeAltIcon, ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/solid";
import { ScaleIcon } from "@heroicons/react/24/outline";
import UserChatWidget from "./chat/UserChatWidget";

interface LawyerProps {
    id: string;
    name: string;
    firm: string;
    location: string;
    career: string;
    education?: string;
    careerTags?: string[];
    gender?: string;
    expertise: string[];
    imageUrl?: string;
    cutoutImageUrl?: string;
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
    bgRemoveStatus?: string;
    practiceScore?: number;
    analysis_reason?: string;
    content_highlights?: string;
    phone?: string;
    homepage?: string;
    kakao_id?: string;
    isOnline?: boolean;
}

const FALLBACK_IMAGES = [
    "/lawyers/lawyer_male_1_1770727915967.png",
    "/lawyers/lawyer_male_2_1770727949695.png",
    "/lawyers/lawyer_male_senior_1770728016740.png",
    "/lawyers/lawyer_female_1_1770727931596.png",
    "/lawyers/lawyer_female_2_1770727964339.png",
    "/lawyers/lawyer_female_senior_1770728034922.png"
];

function Counter({ value }: { value: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    // Use spring for smooth counting
    const springValue = useSpring(0, {
        stiffness: 50,
        damping: 15,
        duration: 2
    });

    useEffect(() => {
        if (inView) {
            springValue.set(value);
        }
    }, [inView, value, springValue]);

    const displayValue = useTransform(springValue, (current) => Math.round(current));

    return <motion.span ref={ref}>{displayValue}</motion.span>;
}

export default function LawyerCard({ lawyer, query }: { lawyer: LawyerProps, query?: string }) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    let displayImage = lawyer.cutoutImageUrl || lawyer.imageUrl;

    // Fallback if no image provided from backend
    if (!displayImage) {
        // Simple hash to pick a consistent image for the same lawyer ID
        const index = lawyer.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % FALLBACK_IMAGES.length;
        displayImage = FALLBACK_IMAGES[index];
    }

    const matchPercentage = Math.round(lawyer.matchScore * 100);

    const handleContactClick = async (type: string) => {
        if (!query) return;
        try {
            await fetch(`http://localhost:8000/api/lawyers/${lawyer.id}/leads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    case_summary: query,
                    contact_type: type
                }),
            });
            console.log("Lead reported:", type);
        } catch (error) {
            console.error("Failed to report lead:", error);
        }
    };

    // 📞 전화 상담 핸들러: 모바일이면 바로 전화, 웹이면 번호 표시
    const handlePhoneClick = () => {
        if (!lawyer.phone) return;
        handleContactClick("phone");

        const isMobile = typeof window !== 'undefined' && (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.innerWidth < 768
        );

        if (isMobile) {
            window.location.href = `tel:${lawyer.phone}`;
        } else {
            setShowPhoneModal(true);
        }
    };

    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-20% 0px -20% 0px", amount: 0.5 });
    const [hasEntered, setHasEntered] = useState(false);

    useEffect(() => {
        if (isInView) setHasEntered(true);
    }, [isInView]);

    const animationState = isInView ? "visible" : (hasEntered ? "dimmed" : "hidden");

    return (
        <motion.div
            ref={ref}
            className="w-full bg-white dark:bg-[#1c1c1e] rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-transparent transition-colors duration-500"
            initial="hidden"
            animate={animationState}
            variants={{
                hidden: { opacity: 0, y: 30, scale: 0.96 },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    borderColor: "rgba(0,0,0,0.05)",
                    transition: {
                        type: "spring",
                        stiffness: 50,
                        damping: 20,
                        duration: 0.6,
                        staggerChildren: 0.15,
                        delayChildren: 0.1
                    }
                },
                dimmed: {
                    opacity: 0.5,
                    y: 0,
                    scale: 0.96,
                    borderColor: "transparent",
                    transition: { duration: 0.5, ease: "easeOut" }
                }
            }}
        >
            {/* LEFT: Portrait Area (32%) */}
            <div className="relative w-full md:w-[32%] h-[400px] md:h-auto md:self-stretch bg-[#F5F5F7] dark:bg-zinc-800 shrink-0 overflow-hidden group cursor-pointer">
                <Link href={`/lawyer/${lawyer.id}`}>
                    <motion.div className="w-full h-full relative" variants={{ hidden: { opacity: 0, scale: 1.05 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } }, dimmed: { opacity: 0.8 } }}>
                        <Image
                            src={displayImage!}
                            alt={lawyer.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 32vw"
                            className="object-cover object-top transition-transform duration-700 ease-in-out hover:scale-105"
                            unoptimized={displayImage!.startsWith("http")}
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                </Link>
                {/* Online Status Badge */}
                {lawyer.isOnline && (
                    <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800 flex items-center gap-1.5 shadow-sm backdrop-blur-sm z-10 pointer-events-none">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        상담 가능
                    </div>
                )}
            </div>

            {/* RIGHT: Info Area (68%) */}
            <div className="w-full md:w-[68%] p-8 md:p-10 flex flex-col bg-white dark:bg-[#1c1c1e] relative">

                {/* Header: Name & Match Score */}
                <div className="flex justify-between items-start mb-6">
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, dimmed: { opacity: 0.5 } }}>
                        <Link href={`/lawyer/${lawyer.id}`} className="group">
                            <h2 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] dark:text-white mb-1 group-hover:opacity-70 transition-opacity">
                                {lawyer.name}
                            </h2>
                        </Link>
                        <p className="text-sm text-[#86868b] font-medium flex items-center gap-2">
                            <span>{lawyer.firm}</span>
                            <span className="w-1 h-1 bg-[#86868b] rounded-full" />
                            <span>{lawyer.location}</span>
                        </p>
                    </motion.div>

                    <motion.div
                        className="text-right"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, scale: 1.05 },
                            dimmed: { opacity: 0.6, scale: 1 }
                        }}
                    >
                        <span className="text-sm font-medium text-[#86868b] dark:text-gray-400 block mb-0.5">Match</span>
                        <span className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                            <Counter value={matchPercentage} />%
                        </span>
                    </motion.div>
                </div>

                {/* Best Case & Best Content Section */}
                <motion.div className="mb-8" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, dimmed: { opacity: 0.8 } }}>
                    {/* Best Case (Existing) */}
                    {lawyer.bestCase && (
                        <div className="mb-4 bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <ScaleIcon className="w-4 h-4 text-lawnald" />
                                <span className="text-xs font-semibold text-lawnald uppercase tracking-wide">AI 추천 유사 승소 사례</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{lawyer.bestCase.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {lawyer.bestCase.summary}
                            </p>
                        </div>
                    )}

                    {/* Best Content (New Magazine Integration) */}
                    {lawyer.bestContent && (
                        <Link href="#" className="block mb-4 group/content">
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 hover:border-blue-200 dark:hover:border-blue-700/50 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                        관련 전문 칼럼
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover/content:text-blue-600 dark:group-hover/content:text-blue-400 transition-colors line-clamp-1">
                                    {lawyer.bestContent.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {lawyer.bestContent.summary}
                                </p>
                            </div>
                        </Link>
                    )}
                </motion.div>

                <div className="flex-1" />

                {/* Details Grid */}
                <motion.div
                    className="grid grid-cols-2 gap-y-4 gap-x-8 border-t border-gray-100 dark:border-point/20 pt-6"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }, dimmed: { opacity: 0.8 } }}
                >
                    <div>
                        <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">주요 경력</h4>
                        <p className="text-sm font-medium text-zinc-500 truncate" title={lawyer.career}>
                            {lawyer.career || "이력 정보가 없습니다."}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide mb-1">전문 분야</h4>
                        <div className="flex flex-wrap gap-2">
                            {lawyer.expertise.slice(0, 3).map((field, i) => (
                                <span key={i} className="text-sm font-medium text-zinc-600 bg-point/10 px-2 py-0.5 rounded">
                                    #{field}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* 🟢 Online: Real-time Chat Available Banner */}
                {lawyer.isOnline && (
                    <motion.div
                        className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-700/40"
                        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { delay: 0.3 } }, dimmed: { opacity: 0.6 } }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-800/40 rounded-full flex items-center justify-center">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                    현재 접속 중 · 즉시 상담 가능
                                </p>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                                    지금 바로 실시간 채팅으로 사건을 상담할 수 있습니다
                                </p>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-200 dark:shadow-none"
                            >
                                💬 즉시 채팅
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Contact Actions (Subtle) */}
                <motion.div
                    className="flex gap-3 mt-8"
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, dimmed: { opacity: 0.5 } }}
                >
                    <Link
                        href={`/lawyer/${lawyer.id}`}
                        className="flex-1 bg-point/10 hover:bg-point/20 text-main text-sm font-semibold py-3.5 rounded-xl transition-colors text-center flex items-center justify-center"
                    >
                        프로필 보기
                    </Link>

                    <button
                        onClick={() => setIsChatOpen(true)}
                        className={`flex-1 bg-main text-white border border-transparent hover:bg-main/90 rounded-[14px] text-sm font-semibold transition-all shadow-lg shadow-main/20 active:scale-[0.98] flex items-center justify-center gap-1.5 ${lawyer.isOnline ? 'ring-2 ring-emerald-500/20 border-emerald-500/30' : ''}`}
                    >
                        <span className="text-lg">💬</span> {lawyer.isOnline ? "즉시 상담" : "1:1 채팅"}
                    </button>

                    {/* Contact Icons Group */}
                    <div className="flex gap-2">
                        {lawyer.phone && (
                            <button
                                onClick={handlePhoneClick}
                                className="w-12 h-full flex items-center justify-center bg-white border border-point/20 hover:bg-point/5 rounded-xl transition-colors tooltip-trigger"
                                aria-label="전화 상담"
                            >
                                <PhoneIcon className="w-5 h-5 text-[#1d1d1f] dark:text-white" />
                            </button>
                        )}
                        {lawyer.homepage && (
                            <a
                                href={lawyer.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleContactClick("homepage")}
                                className="w-12 h-full flex items-center justify-center bg-[#F5F5F7] hover:bg-[#E8E8ED] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] rounded-xl transition-colors"
                                aria-label="홈페이지"
                            >
                                <GlobeAltIcon className="w-5 h-5 text-[#1d1d1f] dark:text-white" />
                            </a>
                        )}
                        {lawyer.kakao_id && (
                            <button
                                onClick={() => handleContactClick("kakao")}
                                className="w-12 h-full flex items-center justify-center bg-[#FBE54D] hover:bg-[#FAD400] text-[#3B1E1E] rounded-xl transition-colors"
                                aria-label="카카오톡 상담"
                            >
                                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            <UserChatWidget
                lawyerId={lawyer.id}
                lawyerName={lawyer.name}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />

            {/* 📞 전화번호 모달 (데스크톱) */}
            {showPhoneModal && lawyer.phone && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowPhoneModal(false)}>
                    <div className="bg-white dark:bg-[#2c2c2e] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PhoneIcon className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {lawyer.name?.endsWith('변호사') ? lawyer.name : `${lawyer.name} 변호사`}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">전화 상담 연결</p>

                            <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl p-5 mb-6">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-wider font-mono">
                                    {lawyer.phone}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(lawyer.phone || '');
                                        alert('전화번호가 복사되었습니다.');
                                    }}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition-colors"
                                >
                                    📋 번호 복사
                                </button>
                                <a
                                    href={`tel:${lawyer.phone}`}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors text-center"
                                >
                                    📞 전화 걸기
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPhoneModal(false)}
                            className="w-full py-4 border-t border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
