"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const CATEGORIES = [
    { value: "insights", label: "인사이트" },
    { value: "lawyer-spotlight", label: "변호사 스포트라이트" },
    { value: "legal-trends", label: "법률 트렌드" },
    { value: "platform-news", label: "플랫폼 소식" },
];

export default function AdminBlogWritePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const isEditMode = !!editId;

    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("insights");
    const [coverImage, setCoverImage] = useState("");
    const [featuredLawyerId, setFeaturedLawyerId] = useState("");
    const [tags, setTags] = useState("");
    const [isPublished, setIsPublished] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);
    const [loading, setLoading] = useState(false);

    // 수정 모드: 기존 글 데이터 로드
    useEffect(() => {
        if (!editId) return;
        setLoading(true);
        fetch(`http://localhost:8000/api/admin/blog/posts/${editId}`)
            .then((r) => r.json())
            .then((data) => {
                setTitle(data.title || "");
                setSummary(data.summary || "");
                setContent(data.content || "");
                setCategory(data.category || "insights");
                setCoverImage(data.cover_image || "");
                setFeaturedLawyerId(data.featured_lawyer_id || "");
                setTags((data.tags || []).join(", "));
                setIsPublished(data.is_published ?? true);
            })
            .catch(() => alert("글 데이터를 불러오지 못했습니다"))
            .finally(() => setLoading(false));
    }, [editId]);

    const handleSubmit = async () => {
        if (!title || !content || !summary) {
            alert("제목, 요약, 본문을 모두 입력해주세요");
            return;
        }
        const token = localStorage.getItem("admin_token");
        if (!token) { router.push("/admin"); return; }
        setSaving(true);
        try {
            const url = isEditMode
                ? `http://localhost:8000/api/admin/blog/manage/${editId}`
                : "http://localhost:8000/api/admin/blog/manage";
            const res = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    summary,
                    category,
                    cover_image: coverImage || null,
                    featured_lawyer_id: featuredLawyerId || null,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    is_published: isPublished,
                }),
            });
            if (res.ok) {
                alert(isEditMode ? "✅ 글이 수정되었습니다" : "✅ 글이 등록되었습니다");
                router.push(isEditMode ? `/insights/${editId}` : "/insights");
            } else {
                const data = await res.json();
                alert(data.detail || "저장 실패");
            }
        } catch {
            alert("서버 연결에 실패했습니다");
        } finally {
            setSaving(false);
        }
    };

    // Markdown toolbar helpers
    const insertMarkdown = (prefix: string, suffix: string = "") => {
        const textarea = document.getElementById("editor") as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);
        const newText = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
        setContent(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }, 0);
    };

    return (
        <main className="min-h-screen bg-[#0a0f1c] text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0f1c]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                            ← Admin
                        </Link>
                        <span className="text-white/20">|</span>
                        <span className="font-serif italic font-bold text-lg">{isEditMode ? "글 수정" : "공식 블로그 작성"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPreview(!preview)}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            {preview ? "✏️ 편집" : "👁️ 미리보기"}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
                        >
                            {saving ? "저장 중..." : isEditMode ? "수정 완료" : "발행하기"}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-white/20 font-serif"
                        />

                        <input
                            type="text"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="한 줄 요약 (리스트에 표시됩니다)"
                            className="w-full text-sm bg-transparent border-b border-white/10 pb-3 outline-none placeholder-white/20"
                        />

                        {/* Markdown Toolbar */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-2 border border-white/10">
                            <button onClick={() => insertMarkdown("## ")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 font-bold" title="H2">H2</button>
                            <button onClick={() => insertMarkdown("### ")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 font-bold" title="H3">H3</button>
                            <span className="w-px h-5 bg-white/10" />
                            <button onClick={() => insertMarkdown("**", "**")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 font-bold" title="Bold">B</button>
                            <button onClick={() => insertMarkdown("*", "*")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 italic" title="Italic">I</button>
                            <span className="w-px h-5 bg-white/10" />
                            <button onClick={() => insertMarkdown("- ")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10" title="List">• 목록</button>
                            <button onClick={() => insertMarkdown("> ")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10" title="Quote">❝ 인용</button>
                            <button onClick={() => insertMarkdown("![이미지 설명](", ")")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10" title="Image">🖼️</button>
                            <button onClick={() => insertMarkdown("[링크 텍스트](", ")")} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10" title="Link">🔗</button>
                        </div>

                        {/* Editor / Preview */}
                        {preview ? (
                            <div className="prose prose-invert prose-lg max-w-none bg-white/5 rounded-2xl p-8 border border-white/10 min-h-[500px]">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                id="editor"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Markdown으로 본문을 작성하세요...&#10;&#10;## 소제목&#10;본문 내용을 여기에 작성합니다.&#10;&#10;**강조할 내용**은 볼드 처리합니다.&#10;&#10;> 인용문도 사용할 수 있습니다."
                                className="w-full min-h-[500px] bg-white/5 rounded-2xl p-6 border border-white/10 outline-none text-sm leading-relaxed placeholder-white/15 font-mono resize-y"
                            />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Category */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">카테고리</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none border border-white/10"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value} className="bg-[#0a0f1c]">{c.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Featured Lawyer */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">
                                추천 변호사 ID
                            </label>
                            <input
                                type="text"
                                value={featuredLawyerId}
                                onChange={(e) => setFeaturedLawyerId(e.target.value)}
                                placeholder="변호사 이메일(ID) 입력"
                                className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm outline-none border border-white/10 placeholder-white/20"
                            />
                            <p className="text-[10px] text-white/30 mt-2">
                                글 하단에 해당 변호사 프로필 카드와 상담 CTA가 표시됩니다.
                            </p>
                        </div>

                        {/* Cover Image */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">커버 이미지 URL</label>
                            <input
                                type="text"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm outline-none border border-white/10 placeholder-white/20"
                            />
                        </div>

                        {/* Tags */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">태그</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="이혼, 위자료, 변호사추천 (쉼표 구분)"
                                className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm outline-none border border-white/10 placeholder-white/20"
                            />
                        </div>

                        {/* Publish Toggle */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                    className="w-5 h-5 rounded accent-blue-500"
                                />
                                <span className="text-sm font-medium">즉시 공개</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
