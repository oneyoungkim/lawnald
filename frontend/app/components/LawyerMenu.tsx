"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    DocumentTextIcon,
    PencilSquareIcon,
    PlayCircleIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    NewspaperIcon,
    BoltIcon,
    PlusCircleIcon
} from "@heroicons/react/24/outline";

export default function LawyerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [lawyerId, setLawyerId] = useState<string | null>(null);

    // Fetch lawyer ID on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyerId(parsed.id);
            }
        }
    });

    const handleLogout = () => {
        localStorage.removeItem("lawyer_user");
        router.push("/login");
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    const menuItems = [
        { label: "대시보드", href: "/lawyer/dashboard", icon: HomeIcon },
        { label: "상담 관리 (CRM)", href: "/lawyer/consultations", icon: ChatBubbleLeftRightIcon },
        { label: "채팅 상담내역", href: "/lawyer/chats", icon: ChatBubbleOvalLeftEllipsisIcon },
        { label: "내 블로그 가기", href: lawyerId ? `/blog/${lawyerId}` : "#", icon: DocumentTextIcon },
        { label: "⚡ 기존블로그 옮겨오기", href: "/lawyer/dashboard?action=import", icon: BoltIcon },
        { label: "📂 승소사례 관리", href: "/lawyer/dashboard/cases", icon: DocumentTextIcon },
        { label: "승소사례 등록 (통합)", href: "/lawyer/dashboard/cases/upload", icon: PlusCircleIcon },
        { label: "승소사례 아카이브", href: "/lawyer/cases/archive", icon: DocumentTextIcon },
        { label: "매거진 관리", href: "/lawyer/magazine", icon: NewspaperIcon },
        { label: "매거진 칼럼 작성", href: "/lawyer/magazine/write", icon: PencilSquareIcon },
        { label: "유튜브 영상 등록", href: "/lawyer/youtube/new", icon: PlayCircleIcon },
        { label: "프로필 설정", href: "/lawyer/profile", icon: UserCircleIcon },
    ];

    return (
        <>
            {/* Toggle Button (Fixed to Top-Right or integrated in header) */}
            {/* We will assume this component is placed nicely in the layout, but let's give it a fixed toggle just in case the parent doesn't provide one. */}
            {/* Actually, for better UX, let's make this a fixed floating button if not integrated. But better to integrate. */}

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-point/20 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-6 flex justify-between items-center border-b border-point/20">
                    <h2 className="font-bold text-lg text-main">Menu</h2>
                    <button
                        onClick={toggleMenu}
                        className="p-2 rounded-full hover:bg-point/10 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6 text-zinc-500" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-point/10 text-zinc-600 hover:text-main transition-all group"
                            onClick={() => setIsOpen(false)}
                        >
                            <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-point transition-colors" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-point/20">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold text-sm"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        로그아웃
                    </button>
                </div>
            </div>

            {/* Floating Toggle Button (If not controlled externally, this is handy) */}
            {!isOpen && (
                <button
                    onClick={toggleMenu}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-main text-white rounded-full shadow-lg shadow-main/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
            )}
        </>
    );
}
