"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // Hide on lawyer profile pages (they have their own layout)
    if (pathname?.startsWith("/lawyer/") && !pathname.includes("/dashboard")) return null;
    // Hide on admin pages
    if (pathname?.startsWith("/admin")) return null;

    return (
        <footer className="w-full border-t border-gray-100 bg-gray-50 mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Business info */}
                <div className="text-xs text-gray-400 leading-relaxed space-y-1">
                    <p>
                        <span className="text-gray-500 font-medium">상호명.</span> 메이크디스원
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-medium">대표.</span> 김정환
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-medium">사업자등록번호.</span> 431-11-01233
                    </p>
                    <p>
                        <span className="text-gray-500 font-medium">Tel.</span> 010 8935 3010
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-medium">Email.</span> incbccc@gmail.com
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-medium">통신판매업신고.</span> 2023-서울동대문-0942
                    </p>
                </div>

                {/* Links + copyright */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex gap-4 text-xs text-gray-400">
                        <a href="#" className="hover:text-gray-600 transition-colors">이용약관</a>
                        <a href="#" className="hover:text-gray-600 transition-colors font-medium text-gray-500">개인정보처리방침</a>
                    </div>
                    <p className="text-xs text-gray-300">
                        Copyright(C)MACDEE. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
