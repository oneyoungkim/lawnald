"use client";

import { API_BASE } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LawyerMenu from "../../components/LawyerMenu";
import Image from "next/image";

const EXPERTISE_OPTIONS = [
    "이혼·가사", "형사", "민사", "부동산", "행정", "노동", "의료", "교통사고",
    "성범죄", "마약", "상속", "채권추심", "손해배상", "회사법", "지식재산권",
    "파산·회생", "국가배상", "소비자", "국제", "군형법", "기타"
];

export default function LawyerProfilePage() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form fields
    const [name, setName] = useState("");
    const [firm, setFirm] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [career, setCareer] = useState("");
    const [education, setEducation] = useState("");
    const [expertise, setExpertise] = useState<string[]>([]);
    const [introShort, setIntroShort] = useState("");
    const [introLong, setIntroLong] = useState("");
    const [homepage, setHomepage] = useState("");
    const [kakaoId, setKakaoId] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (!stored) {
            router.push("/login");
            return;
        }
        const parsed = JSON.parse(stored);

        // Fetch latest data from server
        fetch(`${API_BASE}/api/lawyers/${parsed.id}`)
            .then(res => res.json())
            .then(data => {
                setLawyer(data);
                setName(data.name || "");
                setFirm(data.firm || "");
                setPhone(data.phone || "");
                setLocation(data.location || "");
                // Don't show default career from signup
                const c = data.career || "";
                setCareer(c.startsWith("변호사 자격증 번호:") ? "" : c);
                setEducation(data.education || "");
                setExpertise(data.expertise?.filter((e: string) => e !== "일반") || []);
                setIntroShort(data.introduction_short || "");
                setIntroLong(data.introduction_long || "");
                setHomepage(data.homepage || "");
                setKakaoId(data.kakao_id || "");
                setImageUrl(data.imageUrl || "");
                setLoading(false);
            })
            .catch(() => {
                setLawyer(parsed);
                setLoading(false);
            });
    }, [router]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !lawyer) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lawyer.id}/upload-photo`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.imageUrl) {
                setImageUrl(data.imageUrl);
            }
        } catch (err) {
            console.error("Photo upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const toggleExpertise = (exp: string) => {
        setExpertise(prev =>
            prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
        );
    };

    const handleSave = async () => {
        if (!lawyer) return;
        setSaving(true);
        setSaved(false);

        const updateData: any = {
            name,
            firm,
            phone,
            location,
            career: career || undefined,
            education: education || undefined,
            expertise: expertise.length > 0 ? expertise : ["일반"],
            introduction_short: introShort || undefined,
            introduction_long: introLong || undefined,
            homepage: homepage || undefined,
            kakao_id: kakaoId || undefined,
        };

        try {
            const res = await fetch(`${API_BASE}/api/admin/lawyers/${lawyer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            if (res.ok) {
                const result = await res.json();
                // Update localStorage
                const stored = localStorage.getItem("lawyer_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const updated = { ...parsed, ...updateData };
                    localStorage.setItem("lawyer_user", JSON.stringify(updated));
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a]">
                <LawyerMenu />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0a] font-sans">
            <LawyerMenu />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">프로필 설정</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${saved
                            ? "bg-green-500 text-white"
                            : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
                            } disabled:opacity-50`}
                    >
                        {saving ? "저장 중..." : saved ? "✓ 저장됨" : "저장"}
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
                {/* Profile Photo */}
                <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">프로필 사진</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700">
                            {imageUrl ? (
                                <Image
                                    src={imageUrl.startsWith("/") ? `${API_BASE}${imageUrl}` : imageUrl}
                                    alt="프로필"
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">👤</div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                            >
                                사진 변경
                            </button>
                            <p className="text-xs text-gray-400 mt-2">정사각형 사진 권장 (최대 5MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </div>
                    </div>
                </section>

                {/* Basic Info */}
                <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="이름" value={name} onChange={setName} placeholder="홍길동" />
                        <Field label="소속" value={firm} onChange={setFirm} placeholder="법무법인 OO" />
                        <Field label="전화번호" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
                        <Field label="지역" value={location} onChange={setLocation} placeholder="서울 강남구" />
                        <Field label="홈페이지" value={homepage} onChange={setHomepage} placeholder="https://..." />
                        <Field label="카카오톡 ID" value={kakaoId} onChange={setKakaoId} placeholder="카카오 상담 ID" />
                    </div>
                </section>

                {/* Career & Education */}
                <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">경력 및 학력</h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">경력</label>
                            <textarea
                                value={career}
                                onChange={(e) => setCareer(e.target.value)}
                                placeholder={"법무법인 OO (2018~현재)\n서울중앙지방법원 사법연수원 (47기)\n법무법인 △△ (2015~2018)"}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none resize-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">줄바꿈으로 항목을 구분해주세요</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">학력</label>
                            <textarea
                                value={education}
                                onChange={(e) => setEducation(e.target.value)}
                                placeholder={"서울대학교 법학전문대학원 (J.D.)\n고려대학교 법학과 (학사)"}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none resize-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Expertise */}
                <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">전문 분야</h2>
                    <p className="text-xs text-gray-400 mb-5">해당되는 분야를 모두 선택해주세요</p>
                    <div className="flex flex-wrap gap-2">
                        {EXPERTISE_OPTIONS.map(exp => (
                            <button
                                key={exp}
                                type="button"
                                onClick={() => toggleExpertise(exp)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${expertise.includes(exp)
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm"
                                    : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500"
                                    }`}
                            >
                                {exp}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Introduction */}
                <section className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">변호사 소개</h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">한줄 소개</label>
                            <input
                                type="text"
                                value={introShort}
                                onChange={(e) => setIntroShort(e.target.value)}
                                placeholder="의뢰인의 권리를 최우선으로 생각하는 변호사입니다."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">상세 소개</label>
                            <textarea
                                value={introLong}
                                onChange={(e) => setIntroLong(e.target.value)}
                                placeholder={"안녕하세요, OO 법무법인의 OOO 변호사입니다.\n\n풍부한 실무 경험을 바탕으로 의뢰인에게 최적의 법률 서비스를 제공합니다.\n복잡한 법률 문제도 명쾌하게 해결해 드리겠습니다."}
                                rows={6}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none resize-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">프로필 페이지에 표시되는 소개글입니다</p>
                        </div>
                    </div>
                </section>

                {/* Save Button (Bottom) */}
                <div className="flex justify-end pb-10">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${saved
                            ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                            : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 shadow-lg shadow-gray-900/10"
                            } disabled:opacity-50`}
                    >
                        {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "변경사항 저장"}
                    </button>
                </div>
            </div>
        </main>
    );
}

// Reusable Field Component
function Field({ label, value, onChange, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none transition-all"
            />
        </div>
    );
}
