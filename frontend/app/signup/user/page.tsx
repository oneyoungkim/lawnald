"use client";

import Link from "next/link";

export default function UserSignupPage() {
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800 text-center">
                <span className="text-4xl mb-4 block">🚧</span>
                <h1 className="text-2xl font-bold mb-2">일반 회원가입</h1>
                <p className="text-neutral-500 mb-6">일반 회원가입 기능은 준비 중입니다.<br />현재는 변호사 회원가입만 가능합니다.</p>
                <Link href="/signup" className="text-blue-600 underline">돌아가기</Link>
            </div>
        </main>
    );
}
