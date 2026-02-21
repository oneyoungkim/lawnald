"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClientUser {
    id: string;
    name: string;
    email: string;
}

interface Story {
    id: string;
    title: string;
    content: string;
    area: string;
    created_at: string;
    status: string;
}

interface OnlineLawyer {
    id: string;
    name: string;
    firm: string;
    expertise: string[];
    imageUrl: string | null;
    status: string;
    location: string;
}

interface ChatItem {
    lawyer_id: string;
    client_id: string;
    lawyer_name: string;
    lawyer_firm: string;
    lawyer_image: string | null;
    messages: { sender: string; content: string; timestamp: string }[];
    last_updated: string;
}

const AREA_OPTIONS = ["가사", "형사", "민사", "부동산", "행정", "노동", "의료", "세금", "기업", "기타"];

export default function ClientDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<ClientUser | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [onlineLawyers, setOnlineLawyers] = useState<OnlineLawyer[]>([]);
    const [chats, setChats] = useState<ChatItem[]>([]);

    // Story form
    const [storyTitle, setStoryTitle] = useState("");
    const [storyContent, setStoryContent] = useState("");
    const [storyArea, setStoryArea] = useState("기타");
    const [submitting, setSubmitting] = useState(false);

    const [activeTab, setActiveTab] = useState<"story" | "lawyers" | "chats">("story");

    useEffect(() => {
        const stored = localStorage.getItem("client_user");
        if (!stored) {
            router.push("/login");
            return;
        }
        const parsed = JSON.parse(stored);
        setUser(parsed);
        loadData(parsed.id);
    }, []);

    const loadData = async (clientId: string) => {
        try {
            const [storiesRes, lawyersRes, chatsRes] = await Promise.all([
                fetch(`http://localhost:8000/api/client/${clientId}/stories`),
                fetch("http://localhost:8000/api/lawyers/online"),
                fetch(`http://localhost:8000/api/client/${clientId}/chats`)
            ]);
            if (storiesRes.ok) setStories(await storiesRes.json());
            if (lawyersRes.ok) setOnlineLawyers(await lawyersRes.json());
            if (chatsRes.ok) setChats(await chatsRes.json());
        } catch {
            console.error("데이터 로드 실패");
        }
    };

    const handleStorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !storyTitle.trim() || !storyContent.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch("http://localhost:8000/api/client/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: user.id,
                    title: storyTitle,
                    content: storyContent,
                    area: storyArea
                })
            });
            if (res.ok) {
                const data = await res.json();
                setStories(prev => [data.story, ...prev]);
                setStoryTitle("");
                setStoryContent("");
                setStoryArea("기타");
            }
        } catch {
            alert("사연 저장에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("client_user");
        router.push("/");
    };

    if (!user) return null;

    return (
        <main className="min-h-screen bg-[#f8f8fa] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-zinc-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-main font-serif italic tracking-tight">LAWNALD</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-500">
                            <span className="font-semibold text-main">{user.name}</span>님
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-red-200"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-main mb-1">
                        안녕하세요, {user.name}님 👋
                    </h1>
                    <p className="text-sm text-zinc-400">AI가 당신에게 꼭 맞는 변호사를 찾아드립니다</p>
                </div>

                {/* Quick Action */}
                <Link
                    href="/"
                    className="block mb-8 bg-gradient-to-r from-main to-main/80 text-white p-6 rounded-2xl shadow-lg shadow-main/10 hover:shadow-main/20 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80 mb-1">새로운 법률 고민이 있으신가요?</p>
                            <p className="text-lg font-bold">AI 변호사 매칭 시작하기 →</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            ⚖️
                        </div>
                    </div>
                </Link>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-white border border-zinc-100 rounded-2xl mb-6 shadow-sm">
                    {[
                        { key: "story" as const, label: "내 사연", icon: "📝", count: stories.length },
                        { key: "lawyers" as const, label: "상담 가능 변호사", icon: "🟢", count: onlineLawyers.length },
                        { key: "chats" as const, label: "상담 내역", icon: "💬", count: chats.length }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab.key
                                ? "bg-main text-white shadow-md shadow-main/20"
                                : "text-zinc-400 hover:text-main"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-zinc-100"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "story" && (
                    <div className="space-y-6">
                        {/* Story Form */}
                        <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
                            <h2 className="text-lg font-bold text-main mb-4 flex items-center gap-2">
                                📝 사연 등록하기
                            </h2>
                            <form onSubmit={handleStorySubmit} className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={storyTitle}
                                            onChange={e => setStoryTitle(e.target.value)}
                                            placeholder="사연 제목 (예: 이혼 소송 관련 상담)"
                                            required
                                            className="w-full p-3.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-point/30 focus:border-point outline-none text-sm placeholder:text-zinc-300"
                                        />
                                    </div>
                                    <select
                                        value={storyArea}
                                        onChange={e => setStoryArea(e.target.value)}
                                        className="px-4 py-3.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 outline-none focus:ring-2 focus:ring-point/30 bg-white"
                                    >
                                        {AREA_OPTIONS.map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    value={storyContent}
                                    onChange={e => setStoryContent(e.target.value)}
                                    placeholder="사연 내용을 자세히 작성해주세요. 상세할수록 정확한 변호사 매칭이 가능합니다."
                                    required
                                    rows={5}
                                    className="w-full p-3.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-point/30 focus:border-point outline-none text-sm placeholder:text-zinc-300 resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-main text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-main/90 active:scale-[0.98] transition-all shadow-md shadow-main/10 flex items-center gap-2"
                                >
                                    {submitting && <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>}
                                    사연 저장하기
                                </button>
                            </form>
                        </div>

                        {/* Saved Stories */}
                        {stories.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-zinc-500 ml-1">저장된 사연</h3>
                                {stories.map(story => (
                                    <div key={story.id} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-main text-sm">{story.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2.5 py-1 bg-point/10 text-point rounded-lg font-medium">{story.area}</span>
                                                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${story.status === "접수완료" ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"}`}>
                                                    {story.status}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{story.content}</p>
                                        <p className="text-xs text-zinc-300">{story.created_at}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-zinc-300">
                                <p className="text-4xl mb-3">📋</p>
                                <p className="text-sm">아직 등록된 사연이 없습니다</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "lawyers" && (
                    <div>
                        {onlineLawyers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {onlineLawyers.map(lawyer => (
                                    <div key={lawyer.id} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-xl overflow-hidden">
                                                {lawyer.imageUrl ? (
                                                    <img src={lawyer.imageUrl} alt={lawyer.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    "👤"
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-main text-sm">{lawyer.name} 변호사</h4>
                                                    <span className={`w-2 h-2 rounded-full ${lawyer.status === "online" ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`}></span>
                                                    <span className="text-xs text-zinc-400">{lawyer.status === "online" ? "상담 가능" : "자리비움"}</span>
                                                </div>
                                                <p className="text-xs text-zinc-400 truncate">{lawyer.firm}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {lawyer.expertise.slice(0, 3).map((exp, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 bg-point/5 text-point/80 rounded-md">{exp}</span>
                                            ))}
                                            {lawyer.location && (
                                                <span className="text-xs px-2 py-0.5 bg-zinc-50 text-zinc-400 rounded-md">📍 {lawyer.location}</span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/lawyer/${lawyer.id}`}
                                            className="block text-center bg-main/5 text-main py-2.5 rounded-xl text-xs font-semibold hover:bg-main/10 transition-colors"
                                        >
                                            프로필 보기 & 채팅 상담
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-zinc-300">
                                <p className="text-4xl mb-3">😴</p>
                                <p className="text-sm mb-1">현재 실시간 상담 가능한 변호사가 없습니다</p>
                                <p className="text-xs text-zinc-300">변호사가 온라인 상태가 되면 이곳에 표시됩니다</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "chats" && (
                    <div>
                        {chats.length > 0 ? (
                            <div className="space-y-3">
                                {chats.map((chat, idx) => {
                                    const lastMsg = chat.messages[chat.messages.length - 1];
                                    return (
                                        <div key={idx} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg overflow-hidden">
                                                    {chat.lawyer_image ? (
                                                        <img src={chat.lawyer_image} alt={chat.lawyer_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        "⚖️"
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-main text-sm">{chat.lawyer_name} 변호사</h4>
                                                    <p className="text-xs text-zinc-400">{chat.lawyer_firm}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-300">{chat.last_updated}</p>
                                                    <p className="text-xs text-zinc-400 mt-0.5">{chat.messages.length}개 메시지</p>
                                                </div>
                                            </div>
                                            {lastMsg && (
                                                <div className="bg-zinc-50 p-3 rounded-xl">
                                                    <p className="text-xs text-zinc-400 mb-1">
                                                        {lastMsg.sender === "user" ? "나" : chat.lawyer_name + " 변호사"}:
                                                    </p>
                                                    <p className="text-sm text-zinc-600 line-clamp-2">{lastMsg.content}</p>
                                                </div>
                                            )}
                                            <Link
                                                href={`/lawyer/${chat.lawyer_id}`}
                                                className="block text-center mt-3 text-xs text-point hover:underline font-medium"
                                            >
                                                대화 이어가기 →
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-zinc-300">
                                <p className="text-4xl mb-3">💬</p>
                                <p className="text-sm mb-1">아직 상담 내역이 없습니다</p>
                                <p className="text-xs text-zinc-300">변호사 프로필에서 실시간 채팅을 시작해보세요</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
