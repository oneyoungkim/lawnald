"use client";

import Link from "next/link";

export default function SignupPage() {
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">회원가입</h1>
                    <p className="text-neutral-500">Lawnald에 오신 것을 환영합니다.<br />가입 유형을 선택해주세요.</p>
                </div>

                <div className="grid gap-4">
                    <Link href="/signup/user" className="group relative block p-6 border-2 border-neutral-200 dark:border-zinc-800 rounded-2xl hover:border-[#1E293B] dark:hover:border-gray-400 transition-all bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <span className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-2xl group-hover:scale-110 transition-transform">👤</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-[#1E293B]">일반 회원가입</h3>
                                <p className="text-gray-500 text-sm">법률 상담이 필요하신가요?</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/signup/lawyer" className="group relative block p-6 border-2 border-neutral-200 dark:border-zinc-800 rounded-2xl hover:border-[#1E293B] dark:hover:border-gray-400 transition-all bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <span className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-2xl group-hover:scale-110 transition-transform">⚖️</span>
                            <div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-[#1E293B]">변호사 회원가입</h3>
                                <p className="text-gray-500 text-sm">변호사 회원이신가요?</p>
                            </div>
                        </div>
                    </Link>
                </div>

                <p className="mt-8 text-center text-sm text-gray-500">
                    이미 계정이 있으신가요? <Link href="/login" className="text-[#1E293B] underline">로그인</Link>
                </p>
            </div>
        </main>
    );
}
