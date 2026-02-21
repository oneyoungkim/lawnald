"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    HomeIcon,
    UserGroupIcon,
    DocumentTextIcon,
    PencilSquareIcon,
    ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function AdminMenu() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
        router.push("/admin");
    };

    const menuItems = [
        { label: "대시보드", href: "/admin/dashboard", icon: HomeIcon },
        { label: "변호사 관리", href: "/admin/lawyers", icon: UserGroupIcon },
        { label: "승소사례 관리", href: "/admin/cases", icon: DocumentTextIcon },
        { label: "매거진 관리", href: "/admin/magazine", icon: DocumentTextIcon },
        { label: "공식 블로그 글쓰기", href: "/admin/blog/write", icon: PencilSquareIcon },
    ];

    return (
        <aside className="w-64 bg-background border-r border-point/20 min-h-screen fixed left-0 top-0 flex flex-col z-50">
            <div className="p-8 border-b border-point/20">
                <h1 className="text-xl font-bold tracking-tight text-main font-serif italic">LAWNALD Admin</h1>
                <p className="text-xs text-zinc-500 mt-1">Super Administrator</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? "bg-main text-white font-semibold shadow-md shadow-main/20"
                                : "text-zinc-500 hover:bg-point/10 hover:text-main"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-point/20">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-semibold"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    로그아웃
                </button>
            </div>
        </aside>
    );
}
