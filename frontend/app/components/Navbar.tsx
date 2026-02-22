"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { href: "/magazine", label: "매거진" },
    { href: "/pricing", label: "요금제" },
];

export default function Navbar() {
    const pathname = usePathname();

    // Hide global navbar on lawyer profile pages (they have their own)
    if (pathname?.startsWith("/lawyer/") && !pathname.includes("/dashboard")) return null;

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-serif italic font-black text-xl text-main tracking-tight">
                    Lawnald.
                </Link>

                {/* Center links */}
                <div className="hidden sm:flex items-center gap-6">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors ${pathname === link.href
                                    ? "text-main"
                                    : "text-gray-400 hover:text-main"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right auth */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="px-4 py-1.5 text-sm font-semibold text-main hover:bg-gray-50 rounded-full transition-colors"
                    >
                        로그인
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-1.5 text-sm font-semibold bg-main text-white rounded-full hover:bg-main/90 transition-colors shadow-sm"
                    >
                        회원가입
                    </Link>
                </div>
            </div>
        </nav>
    );
}
