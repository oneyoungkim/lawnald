"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background gradient orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-lg w-full text-center space-y-10 relative z-10"
            >
                {/* Logo & Header */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 font-medium tracking-wide uppercase"
                    >
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        지금 시작하기
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        회원가입
                    </h1>
                    <p className="text-white/40 text-base md:text-lg leading-relaxed">
                        Lawnald에 오신 것을 환영합니다.<br />
                        <span className="text-white/60">가입 유형</span>을 선택해주세요.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid gap-5">
                    {/* Client Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Link
                            href="/signup/client"
                            className="group relative block p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 text-left overflow-hidden"
                        >
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-500 rounded-2xl" />

                            <div className="relative flex items-center gap-5">
                                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:border-blue-500/40 transition-all duration-300">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors">
                                        일반 회원가입
                                    </h3>
                                    <p className="text-white/40 text-sm mt-0.5">
                                        법률 상담이 필요하신 분
                                    </p>
                                </div>
                                <div className="flex-shrink-0 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Lawyer Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                    >
                        <Link
                            href="/signup/founder"
                            className="group relative block p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 text-left overflow-hidden"
                        >
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-amber-500/0 group-hover:from-violet-500/5 group-hover:to-amber-500/5 transition-all duration-500 rounded-2xl" />

                            <div className="relative flex items-center gap-5">
                                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:border-violet-500/40 transition-all duration-300">
                                    <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-white group-hover:text-violet-300 transition-colors">
                                            변호사 회원가입
                                        </h3>
                                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-600/80 to-blue-500/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            🔥 HYPE
                                        </span>
                                    </div>
                                    <p className="text-white/40 text-sm mt-0.5">
                                        파운딩 멤버 선착순 300명 · 3개월 무료
                                    </p>
                                </div>
                                <div className="flex-shrink-0 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="pt-2"
                >
                    <p className="text-sm text-white/30">
                        이미 계정이 있으신가요?{" "}
                        <Link href="/login" className="text-white/60 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/50 transition-colors">
                            로그인
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </main>
    );
}
