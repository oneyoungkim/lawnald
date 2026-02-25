"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
    PlusCircleIcon,
    SparklesIcon,
    DocumentArrowUpIcon,
    CpuChipIcon,
    FolderOpenIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    BriefcaseIcon,
    MegaphoneIcon,
    WrenchScrewdriverIcon,
    ArchiveBoxIcon,
    CalendarDaysIcon,
    MagnifyingGlassIcon,
    RectangleGroupIcon,
} from "@heroicons/react/24/outline";

interface MenuGroup {
    key: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    items: { label: string; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[];
}

export default function LawyerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const pathname = usePathname();
    const [lawyerId, setLawyerId] = useState<string | null>(null);

    // Responsive detection
    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1280);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Fetch lawyer ID
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyerId(parsed.id);
            }
        }
    }, []);

    // Desktop body padding
    useEffect(() => {
        document.body.style.paddingLeft = isDesktop ? "260px" : "0px";
        return () => { document.body.style.paddingLeft = "0px"; };
    }, [isDesktop]);

    // Auto-expand group containing active route
    useEffect(() => {
        menuGroups.forEach((g) => {
            if (g.items.some((item) => isActive(item.href))) {
                setExpanded((prev) => ({ ...prev, [g.key]: true }));
            }
        });
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("lawyer_user");
        router.push("/login");
    };

    const toggleGroup = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (href: string) => {
        if (href === "/lawyer/dashboard") return pathname === href;
        return pathname.startsWith(href);
    };

    const sidebarVisible = isDesktop || isOpen;

    const menuGroups: MenuGroup[] = [
        {
            key: "ai",
            label: "AI 실무 자동화",
            icon: WrenchScrewdriverIcon,
            items: [
                { label: "AI 사건 워크스페이스", href: "/lawyer/dashboard/workspace", icon: CpuChipIcon },
                { label: "AI 내용증명 생성기", href: "/lawyer/dashboard/document", icon: SparklesIcon },
                { label: "갑호증 PDF 병합", href: "/lawyer/dashboard/evidence", icon: DocumentArrowUpIcon },
                { label: "유사 판례 검색", href: "/lawyer/dashboard/cases/search", icon: MagnifyingGlassIcon },
            ],
        },
        {
            key: "consult",
            label: "의뢰인 상담 관리",
            icon: BriefcaseIcon,
            items: [
                { label: "잠재 고객 칸반", href: "/lawyer/dashboard/crm", icon: RectangleGroupIcon },
                { label: "사건 관리", href: "/lawyer/dashboard/matters", icon: FolderOpenIcon },
                { label: "상담 관리 (CRM)", href: "/lawyer/consultations", icon: ChatBubbleLeftRightIcon },
                { label: "채팅 상담내역", href: "/lawyer/chats", icon: ChatBubbleOvalLeftEllipsisIcon },
                { label: "캘린더", href: "/lawyer/dashboard/calendar", icon: CalendarDaysIcon },
            ],
        },
        {
            key: "content",
            label: "마케팅 및 콘텐츠",
            icon: MegaphoneIcon,
            items: [
                { label: "승소사례 관리", href: "/lawyer/dashboard/cases", icon: FolderOpenIcon },
                { label: "승소사례 등록 (통합)", href: "/lawyer/dashboard/cases/upload", icon: PlusCircleIcon },
                { label: "승소사례 아카이브", href: "/lawyer/cases/archive", icon: ArchiveBoxIcon },
                { label: "매거진 관리", href: "/lawyer/magazine", icon: NewspaperIcon },
                { label: "매거진 칼럼 작성", href: "/lawyer/magazine/write", icon: PencilSquareIcon },
                { label: "내 블로그 가기", href: lawyerId ? `/blog/${lawyerId}` : "#", icon: DocumentTextIcon },
                { label: "기존블로그 옮겨오기", href: "/lawyer/dashboard?action=import", icon: BoltIcon },
                { label: "유튜브 영상 등록", href: "/lawyer/youtube/new", icon: PlayCircleIcon },
            ],
        },
    ];

    return (
        <>
            {/* Mobile hamburger — top-left */}
            {!isDesktop && !isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-3.5 left-4 z-50 w-10 h-10 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 hover:shadow-md active:scale-95 transition-all"
                    aria-label="메뉴 열기"
                >
                    <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            )}

            {/* Mobile overlay */}
            {!isDesktop && (
                <div
                    className={`fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full z-[70]
                    w-[260px] bg-white dark:bg-[#18181b]
                    border-r border-gray-150 dark:border-zinc-800
                    transition-transform duration-300 ease-in-out
                    flex flex-col
                    ${isDesktop
                        ? "translate-x-0"
                        : sidebarVisible
                            ? "translate-x-0 shadow-2xl"
                            : "-translate-x-full"
                    }
                `}
            >
                {/* Brand */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
                    <Link
                        href="/lawyer/dashboard"
                        className="flex items-center gap-2.5"
                        onClick={() => !isDesktop && setIsOpen(false)}
                    >
                        <div className="w-7 h-7 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
                            <span className="text-white dark:text-gray-900 font-extrabold text-[11px] leading-none">L</span>
                        </div>
                        <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight">
                            Lawnald
                        </span>
                    </Link>
                    {!isDesktop && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* ① Dashboard (standalone) */}
                <div className="px-3 pt-3 pb-1">
                    <Link
                        href="/lawyer/dashboard"
                        onClick={() => !isDesktop && setIsOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[13px] ${pathname === "/lawyer/dashboard"
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold"
                            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 font-medium"
                            }`}
                    >
                        <HomeIcon className="w-4 h-4 flex-shrink-0" />
                        대시보드
                    </Link>
                </div>

                {/* ②③④ Accordion Groups */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                    {menuGroups.map((group) => {
                        const isGroupActive = group.items.some((item) => isActive(item.href));
                        const isExpanded = expanded[group.key] ?? false;

                        return (
                            <div key={group.key}>
                                {/* Group header — clickable toggle */}
                                <button
                                    onClick={() => toggleGroup(group.key)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[13px] ${isGroupActive
                                        ? "text-gray-900 dark:text-white font-semibold"
                                        : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 font-medium"
                                        }`}
                                >
                                    <group.icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 text-left truncate">{group.label}</span>
                                    <ChevronRightIcon
                                        className={`w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                                            }`}
                                    />
                                </button>

                                {/* Sub-items — collapsible with indent */}
                                <div
                                    className="overflow-hidden transition-all duration-200 ease-in-out"
                                    style={{
                                        maxHeight: isExpanded ? `${group.items.length * 40}px` : "0px",
                                        opacity: isExpanded ? 1 : 0,
                                    }}
                                >
                                    <div className="pl-4 pr-1 pt-0.5 pb-1 space-y-px">
                                        {group.items.map((item) => {
                                            const active = isActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => !isDesktop && setIsOpen(false)}
                                                    className={`flex items-center gap-2.5 px-3 py-[7px] rounded-md transition-all text-[12.5px] border-l-2 ${active
                                                        ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white font-semibold"
                                                        : "border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 font-medium"
                                                        }`}
                                                >
                                                    <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-gray-700 dark:text-zinc-300" : "text-gray-400 dark:text-zinc-600"
                                                        }`} />
                                                    <span className="truncate">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ⑤ Profile Settings (standalone) + Logout */}
                <div className="flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 p-3 space-y-0.5">
                    <Link
                        href="/lawyer/profile"
                        onClick={() => !isDesktop && setIsOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[13px] ${pathname.startsWith("/lawyer/profile")
                            ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold"
                            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 font-medium"
                            }`}
                    >
                        <Cog6ToothIcon className="w-4 h-4 flex-shrink-0" />
                        프로필 설정
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-[13px] font-medium"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 flex-shrink-0" />
                        로그아웃
                    </button>
                </div>
            </aside>
        </>
    );
}
