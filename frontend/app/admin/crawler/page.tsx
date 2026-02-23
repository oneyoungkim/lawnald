"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import {
    EnvelopeIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    PlayIcon,
    MagnifyingGlassIcon,
    TagIcon,
} from "@heroicons/react/24/solid";
import AdminMenu from "../../components/AdminMenu";

interface LawyerContact {
    id: string;
    name: string;
    firm: string;
    email: string;
    source: string;
    source_url?: string;
    collected_at: string;
    tags?: string[];
    search_keyword?: string;
    youtube_channel?: string;
    subscribers?: number;
    subscribers_display?: string;
}

interface CrawlerStatus {
    running: boolean;
    source: string;
    progress: string;
    last_run: string | null;
    last_result: {
        added: number;
        skipped: number;
        total: number;
        source: string;
        duration: number;
        collected_raw: number;
        today_count: number;
    } | null;
}

const LEGAL_CATEGORIES = [
    { id: "이혼", label: "이혼", emoji: "💔" },
    { id: "전세사기", label: "전세사기", emoji: "🏠" },
    { id: "형사", label: "형사", emoji: "⚖️" },
    { id: "부동산", label: "부동산", emoji: "🏢" },
    { id: "상속", label: "상속", emoji: "📜" },
    { id: "노동", label: "노동", emoji: "👷" },
    { id: "교통사고", label: "교통사고", emoji: "🚗" },
    { id: "의료", label: "의료", emoji: "🏥" },
    { id: "민사", label: "민사", emoji: "📋" },
    { id: "기업", label: "기업", emoji: "🏭" },
];

const TAG_COLORS: Record<string, string> = {
    "이혼": "bg-pink-50 text-pink-600",
    "전세사기": "bg-amber-50 text-amber-700",
    "형사": "bg-red-50 text-red-600",
    "부동산": "bg-emerald-50 text-emerald-600",
    "상속": "bg-violet-50 text-violet-600",
    "노동": "bg-orange-50 text-orange-600",
    "교통사고": "bg-sky-50 text-sky-600",
    "의료": "bg-teal-50 text-teal-600",
    "민사": "bg-indigo-50 text-indigo-600",
    "기업": "bg-slate-50 text-slate-600",
};

export default function CrawlerPage() {
    const [contacts, setContacts] = useState<LawyerContact[]>([]);
    const [status, setStatus] = useState<CrawlerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTag, setFilterTag] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "subscribers">("date");
    const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    const showNotification = (type: "success" | "error" | "info", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/crawler/results`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/crawler/status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                setRunning(data.running);
            }
        } catch (err) {
            console.error("Failed to fetch status", err);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchStatus();
    }, [fetchContacts, fetchStatus]);

    useEffect(() => {
        if (!running) return;
        const interval = setInterval(() => { fetchStatus(); }, 3000);
        return () => clearInterval(interval);
    }, [running, fetchStatus]);

    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId)
                ? prev.filter(c => c !== catId)
                : [...prev, catId]
        );
    };

    const handleRunCrawler = async () => {
        if (running) return;
        setRunning(true);
        showNotification("info", `${sourceLabel(selectedSource)} 크롤링을 시작합니다...`);

        try {
            const res = await fetch(`${API_BASE}/api/admin/crawler/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: selectedSource,
                    legal_categories: selectedCategories.length > 0 ? selectedCategories : null,
                }),
            });
            if (res.ok) {
                const result = await res.json();
                showNotification("success", `✅ 완료! ${result.added}건 추가, ${result.skipped}건 중복 (총 ${result.total}건, 오늘 ${result.today_count}건)`);
                fetchContacts();
                fetchStatus();
            } else {
                showNotification("error", "크롤링 중 오류가 발생했습니다.");
            }
        } catch (err) {
            showNotification("error", "서버 연결에 실패했습니다.");
        } finally {
            setRunning(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/crawler/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `lawyer_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showNotification("success", "CSV 파일이 다운로드됩니다.");
            }
        } catch (err) {
            showNotification("error", "내보내기에 실패했습니다.");
        }
    };

    const handleExportJSON = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/crawler/results`);
            if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `lawyer_contacts_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showNotification("success", "JSON 파일이 다운로드됩니다.");
            }
        } catch (err) {
            showNotification("error", "내보내기에 실패했습니다.");
        }
    };

    const sourceLabel = (source: string) => {
        switch (source) {
            case "koreanbar": return "대한변호사협회";
            case "naver": return "네이버 블로그";
            case "youtube": return "유튜브";
            case "portal": return "법률 포털";
            case "all": return "전체";
            default: return source;
        }
    };

    // 필터링 + 정렬
    const filteredContacts = contacts
        .filter((c) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match =
                    c.name.toLowerCase().includes(q) ||
                    c.firm.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q) ||
                    c.source.toLowerCase().includes(q) ||
                    (c.youtube_channel || "").toLowerCase().includes(q);
                if (!match) return false;
            }
            if (filterTag) {
                if (!c.tags || !c.tags.includes(filterTag)) return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "subscribers") {
                return (b.subscribers || 0) - (a.subscribers || 0);
            }
            return (b.collected_at || "").localeCompare(a.collected_at || "");
        });

    // 태그별 통계
    const tagStats: Record<string, number> = {};
    contacts.forEach(c => {
        (c.tags || []).forEach(tag => {
            tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
    });

    // 오늘 수집 수
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = contacts.filter(c => (c.collected_at || "").startsWith(todayStr)).length;

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <AdminMenu />

            <main className="flex-1 ml-64 p-8">
                {/* Notification */}
                {notification && (
                    <div
                        className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-[slideIn_0.3s_ease-out] ${notification.type === "success" ? "bg-green-500 text-white"
                                : notification.type === "error" ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white"
                            }`}
                    >
                        {notification.message}
                    </div>
                )}

                <header className="flex justify-between items-center max-w-6xl mx-auto mb-10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-main font-serif italic flex items-center gap-3">
                            <EnvelopeIcon className="w-8 h-8 text-point" />
                            변호사 이메일 수집
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm mt-1">
                            로날드 프로젝트 — 변호사 연락처 DB 구축 v2
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* 오늘 수집 현황 뱃지 */}
                        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-sm text-sm font-bold flex items-center gap-2">
                            📊 오늘 수집: <span className="text-lg">{todayCount}</span>명
                        </div>
                        <button
                            onClick={() => { fetchContacts(); fetchStatus(); }}
                            className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-point/5 transition-colors border border-point/20"
                            title="새로고침"
                        >
                            <ArrowPathIcon className={`w-5 h-5 text-main ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto space-y-8">

                    {/* ── 요약 카드 ── */}
                    <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: "총 수집", value: contacts.length, unit: "명", color: "text-blue-500", bg: "bg-blue-50" },
                            { label: "오늘 수집", value: todayCount, unit: "명", color: "text-green-500", bg: "bg-green-50" },
                            { label: "네이버 블로그", value: contacts.filter(c => c.source === "네이버 블로그").length, unit: "명", color: "text-emerald-500", bg: "bg-emerald-50" },
                            { label: "유튜브", value: contacts.filter(c => c.source === "유튜브").length, unit: "명", color: "text-red-500", bg: "bg-red-50" },
                            { label: "태그 분류", value: Object.keys(tagStats).length, unit: "개", color: "text-purple-500", bg: "bg-purple-50" },
                        ].map((stat, idx) => (
                            <div key={idx} className={`${stat.bg} p-4 rounded-xl`}>
                                <p className="text-[11px] text-zinc-500 font-medium mb-1">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>
                                    {stat.value}<span className="text-xs font-normal text-zinc-400 ml-1">{stat.unit}</span>
                                </p>
                            </div>
                        ))}
                    </section>

                    {/* ── 크롤러 실행 패널 ── */}
                    <section className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 border border-point/10">
                        <h2 className="text-lg font-semibold text-main mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-point rounded-full"></span>
                            크롤러 실행
                        </h2>

                        {/* 소스 선택 + 실행 버튼 */}
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
                                    수집 소스
                                </label>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="w-full px-4 py-3 bg-background rounded-xl border border-point/20 text-main font-medium text-sm focus:outline-none focus:ring-2 focus:ring-point/30"
                                    disabled={running}
                                >
                                    <option value="all">🌐 전체 (변협 + 네이버 + 유튜브 + 포털)</option>
                                    <option value="koreanbar">🏛️ 대한변호사협회</option>
                                    <option value="naver">📗 네이버 블로그 (mainFrame)</option>
                                    <option value="youtube">🎬 유튜브 (Description + 댓글)</option>
                                    <option value="portal">⚖️ 법률 포털</option>
                                </select>
                            </div>

                            <button
                                onClick={handleRunCrawler}
                                disabled={running}
                                className={`px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap shadow-sm ${running
                                        ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                                        : "bg-main text-white hover:bg-main/90 hover:shadow-md"
                                    }`}
                            >
                                {running ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        수집 중...
                                    </>
                                ) : (
                                    <>
                                        <PlayIcon className="w-4 h-4" />
                                        수집 시작
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 법률 카테고리 선택 (태그 전략) */}
                        <div className="mt-6">
                            <label className="block text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide flex items-center gap-1">
                                <TagIcon className="w-3.5 h-3.5" />
                                법률 분야 키워드 (선택: 미선택시 전체)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {LEGAL_CATEGORIES.map(cat => {
                                    const isSelected = selectedCategories.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleCategory(cat.id)}
                                            disabled={running}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${isSelected
                                                    ? "bg-main text-white border-main shadow-sm"
                                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-main/40 hover:text-main"
                                                }`}
                                        >
                                            {cat.emoji} {cat.label}
                                            {tagStats[cat.id] ? ` (${tagStats[cat.id]})` : ""}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 진행 상태 */}
                        {running && status && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="text-sm font-medium text-blue-700">
                                        {status.progress || "수집 진행 중..."}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 마지막 실행 결과 */}
                        {status?.last_result && !running && (
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: "수집(원본)", value: status.last_result.collected_raw, unit: "건", color: "text-blue-500", bg: "bg-blue-50" },
                                    { label: "추가됨", value: status.last_result.added, unit: "건", color: "text-green-500", bg: "bg-green-50" },
                                    { label: "중복 건너뜀", value: status.last_result.skipped, unit: "건", color: "text-orange-500", bg: "bg-orange-50" },
                                    { label: "소요시간", value: `${status.last_result.duration}`, unit: "초", color: "text-purple-500", bg: "bg-purple-50" },
                                    { label: "오늘 누적", value: status.last_result.today_count, unit: "명", color: "text-indigo-500", bg: "bg-indigo-50" },
                                ].map((stat, idx) => (
                                    <div key={idx} className={`${stat.bg} p-4 rounded-xl`}>
                                        <p className="text-xs text-zinc-500 font-medium mb-1">{stat.label}</p>
                                        <p className={`text-xl font-bold ${stat.color}`}>
                                            {stat.value}<span className="text-sm font-normal text-zinc-400 ml-1">{stat.unit}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── 수집 결과 테이블 ── */}
                    <section className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 border border-point/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="text-lg font-semibold text-main flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                수집 결과
                                <span className="text-sm font-normal text-zinc-400 ml-2">
                                    {filteredContacts.length} / {contacts.length}건
                                </span>
                            </h2>

                            <div className="flex gap-3 items-center flex-wrap">
                                {/* 태그 필터 */}
                                <select
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="px-3 py-2.5 bg-background rounded-xl border border-point/20 text-sm text-main"
                                >
                                    <option value="">🏷️ 전체 태그</option>
                                    {Object.entries(tagStats).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
                                        <option key={tag} value={tag}>#{tag} ({count})</option>
                                    ))}
                                </select>

                                {/* 정렬 */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "date" | "subscribers")}
                                    className="px-3 py-2.5 bg-background rounded-xl border border-point/20 text-sm text-main"
                                >
                                    <option value="date">📅 최신순</option>
                                    <option value="subscribers">👑 구독자순</option>
                                </select>

                                {/* 검색 */}
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="이름, 소속, 이메일..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 bg-background rounded-xl border border-point/20 text-sm text-main focus:outline-none focus:ring-2 focus:ring-point/30 w-52"
                                    />
                                </div>

                                {/* Export */}
                                <button onClick={handleExportCSV} className="px-4 py-2.5 bg-background rounded-xl border border-point/20 text-sm font-semibold text-main hover:bg-point/5 transition-colors flex items-center gap-2">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> CSV
                                </button>
                                <button onClick={handleExportJSON} className="px-4 py-2.5 bg-background rounded-xl border border-point/20 text-sm font-semibold text-main hover:bg-point/5 transition-colors flex items-center gap-2">
                                    <ArrowDownTrayIcon className="w-4 h-4" /> JSON
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-zinc-400 animate-pulse">데이터 로딩 중...</div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-20">
                                <EnvelopeIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                <p className="text-zinc-400 font-medium">
                                    {contacts.length === 0
                                        ? "아직 수집된 연락처가 없습니다. 위에서 크롤러를 실행해주세요."
                                        : "검색 결과가 없습니다."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-100">
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">#</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">이름</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">소속</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">이메일</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">출처</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">구독자</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">태그</th>
                                            <th className="text-left py-3 px-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide">수집일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredContacts.map((contact, idx) => (
                                            <tr
                                                key={contact.id || idx}
                                                className="border-b border-zinc-50 hover:bg-point/5 transition-colors"
                                            >
                                                <td className="py-3.5 px-3 text-zinc-400 font-mono text-xs">{idx + 1}</td>
                                                <td className="py-3.5 px-3 font-semibold text-main">{contact.name}</td>
                                                <td className="py-3.5 px-3 text-zinc-600 text-xs">{contact.firm || "-"}</td>
                                                <td className="py-3.5 px-3">
                                                    <a href={`mailto:${contact.email}`} className="text-blue-500 hover:text-blue-700 hover:underline font-mono text-xs">
                                                        {contact.email}
                                                    </a>
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${contact.source === "대한변호사협회" ? "bg-blue-50 text-blue-600"
                                                            : contact.source === "네이버 블로그" ? "bg-green-50 text-green-600"
                                                                : contact.source === "유튜브" ? "bg-red-50 text-red-600"
                                                                    : "bg-purple-50 text-purple-600"
                                                        }`}>
                                                        {contact.source}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    {contact.subscribers && contact.subscribers > 0 ? (
                                                        <span className="font-semibold text-xs text-amber-600">
                                                            👑 {contact.subscribers_display || contact.subscribers.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-300 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(contact.tags || []).map(tag => (
                                                            <span
                                                                key={tag}
                                                                onClick={() => setFilterTag(tag)}
                                                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer hover:opacity-80 ${TAG_COLORS[tag] || "bg-zinc-100 text-zinc-500"}`}
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-3 text-zinc-400 text-[10px] whitespace-nowrap">
                                                    {contact.collected_at
                                                        ? new Date(contact.collected_at).toLocaleDateString("ko-KR", {
                                                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                                        })
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* ── 안내사항 ── */}
                    <section className="bg-amber-50 rounded-[24px] p-6 border border-amber-100">
                        <h3 className="font-semibold text-amber-800 mb-3 text-sm flex items-center gap-2">⚠️ 크롤링 안내사항</h3>
                        <ul className="text-xs text-amber-700 space-y-1.5 leading-relaxed">
                            <li>• 본 도구는 <strong>공개된 정보</strong>만 수집하며, 개인정보보호법을 준수합니다.</li>
                            <li>• 차단 방지를 위해 요청 간 <strong>3~8초 랜덤 딜레이</strong>가 자동 적용됩니다.</li>
                            <li>• 네이버 블로그: mainFrame(PostView) 내부 본문을 직접 접근합니다.</li>
                            <li>• 유튜브: 영상 Description + 고정 댓글에서 이메일을 추출합니다.</li>
                            <li>• 키워드별 <strong>자동 태그</strong>가 부여되어 분야별 타겟 영업이 가능합니다.</li>
                            <li>• 유튜브 <strong>구독자 수 기반 우선순위</strong>로 영향력 높은 변호사를 먼저 확인할 수 있습니다.</li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}
