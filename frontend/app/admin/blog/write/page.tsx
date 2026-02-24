"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const CATEGORIES = [
    { value: "insights", label: "인사이트" },
    { value: "lawyer-spotlight", label: "변호사 스포트라이트" },
    { value: "legal-trends", label: "법률 트렌드" },
    { value: "platform-news", label: "플랫폼 소식" },
];

// ── SEO Analysis Engine ──
interface SeoCheckResult {
    label: string;
    status: "good" | "warn" | "bad" | "info";
    message: string;
    score: number; // 0-100
}

function analyzeSeo(title: string, summary: string, content: string, tags: string): SeoCheckResult[] {
    const checks: SeoCheckResult[] = [];
    const plainContent = content.replace(/[#*>\-\[\]()!`]/g, "").trim();
    const wordCount = plainContent.length;
    const headingMatches = content.match(/^#{2,3}\s+.+$/gm) || [];
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || [];
    const linkMatches = content.match(/\[.*?\]\(.*?\)/g) || [];
    const internalLinks = linkMatches.filter(l => l.includes("/lawyer") || l.includes("/insights") || l.includes("lawnald"));
    const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

    // 1. Title length
    if (title.length === 0) {
        checks.push({ label: "제목", status: "bad", message: "제목을 입력하세요", score: 0 });
    } else if (title.length < 10) {
        checks.push({ label: "제목", status: "warn", message: `${title.length}자 — 최소 10자 이상 권장`, score: 40 });
    } else if (title.length > 60) {
        checks.push({ label: "제목", status: "warn", message: `${title.length}자 — 60자 이내 권장 (검색 결과 잘림)`, score: 60 });
    } else {
        checks.push({ label: "제목", status: "good", message: `${title.length}자 — 적절한 길이 ✓`, score: 100 });
    }

    // 2. Meta description (summary)
    if (summary.length === 0) {
        checks.push({ label: "메타 설명", status: "bad", message: "요약을 입력하세요 (검색 결과에 노출)", score: 0 });
    } else if (summary.length < 50) {
        checks.push({ label: "메타 설명", status: "warn", message: `${summary.length}자 — 50~160자 권장`, score: 50 });
    } else if (summary.length > 160) {
        checks.push({ label: "메타 설명", status: "warn", message: `${summary.length}자 — 160자 초과 시 잘림`, score: 70 });
    } else {
        checks.push({ label: "메타 설명", status: "good", message: `${summary.length}자 — 최적 길이 ✓`, score: 100 });
    }

    // 3. Content length
    if (wordCount === 0) {
        checks.push({ label: "본문 길이", status: "bad", message: "본문을 작성하세요", score: 0 });
    } else if (wordCount < 300) {
        checks.push({ label: "본문 길이", status: "warn", message: `${wordCount}자 — 최소 300자 이상 권장`, score: 30 });
    } else if (wordCount < 800) {
        checks.push({ label: "본문 길이", status: "warn", message: `${wordCount}자 — 800자 이상이면 SEO에 유리`, score: 60 });
    } else if (wordCount < 2000) {
        checks.push({ label: "본문 길이", status: "good", message: `${wordCount}자 — 적정 분량 ✓`, score: 90 });
    } else {
        checks.push({ label: "본문 길이", status: "good", message: `${wordCount}자 — 풍부한 콘텐츠 ✓`, score: 100 });
    }

    // 4. Headings
    if (headingMatches.length === 0 && wordCount > 200) {
        checks.push({ label: "소제목 (H2/H3)", status: "warn", message: "소제목이 없습니다 — 읽기 쉽도록 분할 권장", score: 20 });
    } else if (headingMatches.length >= 2) {
        checks.push({ label: "소제목 (H2/H3)", status: "good", message: `${headingMatches.length}개 — 구조적 ✓`, score: 100 });
    } else if (headingMatches.length === 1) {
        checks.push({ label: "소제목 (H2/H3)", status: "warn", message: "1개 — 2개 이상이면 더 좋습니다", score: 60 });
    } else {
        checks.push({ label: "소제목 (H2/H3)", status: "info", message: "짧은 글에서는 선택사항", score: 80 });
    }

    // 5. Images
    if (imageMatches.length === 0 && wordCount > 300) {
        checks.push({ label: "이미지", status: "warn", message: "이미지가 없습니다 — 시각적 요소 추가 권장", score: 30 });
    } else if (imageMatches.length > 0) {
        checks.push({ label: "이미지", status: "good", message: `${imageMatches.length}개 포함 ✓`, score: 100 });
    }

    // 6. Tags (keywords)
    if (tagList.length === 0) {
        checks.push({ label: "태그/키워드", status: "warn", message: "태그를 추가하면 검색 노출에 도움", score: 20 });
    } else if (tagList.length < 2) {
        checks.push({ label: "태그/키워드", status: "warn", message: `${tagList.length}개 — 2~5개 권장`, score: 50 });
    } else if (tagList.length > 5) {
        checks.push({ label: "태그/키워드", status: "warn", message: `${tagList.length}개 — 5개 이내 권장`, score: 70 });
    } else {
        checks.push({ label: "태그/키워드", status: "good", message: `${tagList.length}개 ✓`, score: 100 });
    }

    // 7. Keyword in title
    if (tagList.length > 0 && title.length > 0) {
        const found = tagList.some(t => title.includes(t));
        if (found) {
            checks.push({ label: "제목 키워드", status: "good", message: "핵심 키워드가 제목에 포함됨 ✓", score: 100 });
        } else {
            checks.push({ label: "제목 키워드", status: "warn", message: "태그 키워드를 제목에 포함시키면 SEO 향상", score: 40 });
        }
    }

    // 8. Internal links
    if (wordCount > 500 && internalLinks.length === 0) {
        checks.push({ label: "내부 링크", status: "info", message: "변호사 프로필 등 내부 링크 추가 권장", score: 50 });
    } else if (internalLinks.length > 0) {
        checks.push({ label: "내부 링크", status: "good", message: `${internalLinks.length}개 포함 ✓`, score: 100 });
    }

    // 9. Paragraph length check
    const longParas = paragraphs.filter(p => p.replace(/[#*>\-\[\]()!`\n]/g, "").length > 300);
    if (longParas.length > 0) {
        checks.push({ label: "문단 길이", status: "info", message: `긴 문단 ${longParas.length}개 — 짧게 분할하면 가독성 ↑`, score: 60 });
    }

    return checks;
}


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
    const [seoOpen, setSeoOpen] = useState(true);
    const [uploading, setUploading] = useState(false);

    // ── Clipboard image paste handler ──
    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) return;

                const token = localStorage.getItem("admin_token");
                if (!token) { alert("관리자 로그인이 필요합니다"); return; }

                const textarea = document.getElementById("editor") as HTMLTextAreaElement;
                const cursorPos = textarea?.selectionStart ?? content.length;

                // Insert placeholder
                const placeholder = `\n![업로드 중...](uploading)\n`;
                const before = content.substring(0, cursorPos);
                const after = content.substring(cursorPos);
                setContent(before + placeholder + after);
                setUploading(true);

                try {
                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await fetch(`${API_BASE}/api/admin/blog/upload-image`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const imageMarkdown = `\n![이미지](${data.url})\n`;
                        setContent((prev) => prev.replace(placeholder, imageMarkdown));
                    } else {
                        const err = await res.json().catch(() => ({ detail: "업로드 실패" }));
                        alert(err.detail || "이미지 업로드 실패");
                        setContent((prev) => prev.replace(placeholder, ""));
                    }
                } catch {
                    alert("이미지 업로드 중 오류 발생");
                    setContent((prev) => prev.replace(placeholder, ""));
                } finally {
                    setUploading(false);
                }
                return;
            }
        }
    };

    // 수정 모드: 기존 글 데이터 로드
    useEffect(() => {
        if (!editId) return;
        setLoading(true);
        fetch(`${API_BASE}/api/admin/blog/posts/${editId}`)
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

    // ── Real-time SEO analysis ──
    const seoChecks = useMemo(() => analyzeSeo(title, summary, content, tags), [title, summary, content, tags]);
    const seoScore = useMemo(() => {
        if (seoChecks.length === 0) return 0;
        return Math.round(seoChecks.reduce((sum, c) => sum + c.score, 0) / seoChecks.length);
    }, [seoChecks]);

    const seoColor = seoScore >= 80 ? "text-emerald-400" : seoScore >= 50 ? "text-amber-400" : "text-red-400";
    const seoRingColor = seoScore >= 80 ? "stroke-emerald-400" : seoScore >= 50 ? "stroke-amber-400" : "stroke-red-400";
    const seoLabel = seoScore >= 80 ? "우수" : seoScore >= 50 ? "보통" : "개선 필요";

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
                ? `${API_BASE}/api/admin/blog/manage/${editId}`
                : `${API_BASE}/api/admin/blog/manage`;
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

    const statusIcon = (status: SeoCheckResult["status"]) => {
        switch (status) {
            case "good": return "✅";
            case "warn": return "⚠️";
            case "bad": return "❌";
            case "info": return "💡";
        }
    };

    const statusColor = (status: SeoCheckResult["status"]) => {
        switch (status) {
            case "good": return "text-emerald-400";
            case "warn": return "text-amber-400";
            case "bad": return "text-red-400";
            case "info": return "text-blue-400";
        }
    };

    // Circle progress
    const circumference = 2 * Math.PI * 36;
    const dashOffset = circumference - (seoScore / 100) * circumference;

    return (
        <main className="min-h-screen bg-[#0a0f1c] text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0f1c]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                            ← Admin
                        </Link>
                        <span className="text-white/20">|</span>
                        <span className="font-serif italic font-bold text-lg">{isEditMode ? "글 수정" : "공식 블로그 작성"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* SEO Score Badge */}
                        <div className={`px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold ${seoColor} flex items-center gap-1.5`}>
                            <span>SEO</span>
                            <span>{seoScore}</span>
                        </div>
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

            <div className="max-w-6xl mx-auto px-6 py-10">
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
                            <div className="relative">
                                <textarea
                                    id="editor"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder={"Markdown으로 본문을 작성하세요...\n\n## 소제목\n본문 내용을 여기에 작성합니다.\n\n**강조할 내용**은 볼드 처리합니다.\n\n> 인용문도 사용할 수 있습니다.\n\n💡 이미지를 캡쳐 후 Ctrl+V로 바로 붙여넣기 가능!"}
                                    className="w-full min-h-[500px] bg-white/5 rounded-2xl p-6 border border-white/10 outline-none text-sm leading-relaxed placeholder-white/15 font-mono resize-y"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <div className="flex items-center gap-3 bg-[#0d1527] px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
                                            <span className="text-sm font-medium text-white/80">이미지 업로드 중...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* ── SEO Advisor Panel ── */}
                        <div className="bg-gradient-to-b from-[#0d1527] to-[#0a0f1c] rounded-2xl border border-white/10 overflow-hidden">
                            <button
                                onClick={() => setSeoOpen(!seoOpen)}
                                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🔍</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">SEO 어드바이저</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${seoColor}`}>{seoScore}점</span>
                                    <span className="text-white/30 text-xs">{seoOpen ? "▲" : "▼"}</span>
                                </div>
                            </button>

                            {seoOpen && (
                                <div className="px-5 pb-5 space-y-4">
                                    {/* Score Circle */}
                                    <div className="flex items-center justify-center py-3">
                                        <div className="relative w-24 h-24">
                                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                                                <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" className="stroke-white/[0.06]" />
                                                <circle
                                                    cx="40" cy="40" r="36" fill="none" strokeWidth="4"
                                                    strokeLinecap="round"
                                                    className={`${seoRingColor} transition-all duration-500`}
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={dashOffset}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold ${seoColor}`}>{seoScore}</span>
                                                <span className="text-[9px] text-white/40 font-bold uppercase">{seoLabel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Check Items */}
                                    <div className="space-y-2">
                                        {seoChecks.map((check, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                            >
                                                <span className="text-sm mt-0.5 flex-shrink-0">{statusIcon(check.status)}</span>
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-bold text-white/70">{check.label}</div>
                                                    <div className={`text-[10px] leading-snug ${statusColor(check.status)} opacity-80`}>
                                                        {check.message}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick Tips */}
                                    {seoScore < 80 && (
                                        <div className="mt-3 p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
                                            <p className="text-[10px] text-blue-300/80 leading-relaxed">
                                                <strong>💡 Tip:</strong> 제목에 핵심 키워드를 넣고, 본문에 소제목(H2)을 2개 이상 사용하면 SEO 점수가 크게 오릅니다.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
