"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LawyerProfilePage() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firm: "",
        location: "",
        phone: "",
        homepage: "",
        career: "",
        education: "",
        expertise: "", // comma separated string for UI
        introduction_short: "",
        introduction_long: ""
    });

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            const data = JSON.parse(stored);
            setLawyer(data);
            setFormData({
                firm: data.firm || "",
                location: data.location || "",
                phone: data.phone || "",
                homepage: data.homepage || "",
                career: data.career || "",
                education: data.education || "",
                expertise: (data.expertise || []).join(", "),
                introduction_short: data.introduction_short || "",
                introduction_long: data.introduction_long || ""
            });
        } else {
            router.push("/login");
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!lawyer.id) {
                alert("로그인 정보가 올바르지 않습니다.");
                return;
            }

            const encodedId = encodeURIComponent(lawyer.id);
            // Use admin endpoint for updates
            console.log("Updating profile for:", encodedId);

            const res = await fetch(`http://localhost:8000/api/admin/lawyers/${encodedId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firm: formData.firm,
                    location: formData.location,
                    phone: formData.phone,
                    homepage: formData.homepage,
                    career: formData.career,
                    education: formData.education,
                    expertise: formData.expertise.split(",").map(s => s.trim()).filter(Boolean),
                    introduction_short: formData.introduction_short,
                    introduction_long: formData.introduction_long
                })
            });

            if (res.ok) {
                const updated = await res.json();
                // Update local storage
                localStorage.setItem("lawyer_user", JSON.stringify(updated.lawyer));
                setLawyer(updated.lawyer);
                alert("프로필이 수정되었습니다.");
                router.push("/lawyer/dashboard");
            } else {
                const errorData = await res.text();
                console.error("Update failed:", errorData);
                alert(`수정 실패: ${errorData}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 연결 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        if (!lawyer.id) return;
        const encodedId = encodeURIComponent(lawyer.id);

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/api/lawyers/${encodedId}/upload-photo`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                // Merge updates
                const updatedLawyer = { ...lawyer, ...data.lawyer, cutoutImageUrl: data.cutoutImageUrl, imageUrl: data.cutoutImageUrl };
                // Fix: API returns cutoutImageUrl and status, but we might want to refresh full lawyer object or manual patch

                // Let's manually patch the image URLs to be sure
                const timestamp = new Date().getTime();
                const newImageUrl = `${data.cutoutImageUrl}?t=${timestamp}`;

                updatedLawyer.cutoutImageUrl = newImageUrl;
                updatedLawyer.imageUrl = newImageUrl;

                setLawyer(updatedLawyer);
                localStorage.setItem("lawyer_user", JSON.stringify(updatedLawyer));
                alert("사진이 업로드되었습니다.");
            } else {
                const errorData = await res.text();
                console.error("Upload failed:", errorData);
                alert(`사진 업로드 실패: ${errorData}`);
            }
        } catch (error) {
            console.error(error);
            alert("업로드 중 서버 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    if (!lawyer) return null;

    return (
        <main className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/lawyer/dashboard" className="text-sm font-bold text-gray-400 hover:text-[#1E293B] mb-8 inline-block">
                    &larr; 대시보드로 돌아가기
                </Link>

                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                        <h1 className="text-2xl font-bold text-[#1E293B]">변호사 프로필 수정</h1>
                        <button
                            type="submit"
                            form="profile-form"
                            disabled={loading}
                            className="bg-[#1E293B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                        >
                            {loading ? "저장 중..." : "변경사항 저장"}
                        </button>
                    </div>
                    {/* Photo Section */}
                    <section className="flex flex-col sm:flex-row gap-8 items-center sm:items-start border-b border-neutral-100 dark:border-zinc-800 pb-8">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                            {lawyer.cutoutImageUrl ? (
                                <Image
                                    src={
                                        (lawyer.cutoutImageUrl.startsWith("http")
                                            ? lawyer.cutoutImageUrl
                                            : `http://127.0.0.1:8000${lawyer.cutoutImageUrl}`
                                        ).replace("localhost", "127.0.0.1")
                                    }
                                    alt="Profile"
                                    width={128}
                                    height={128}
                                    className="object-cover rounded-full"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">No Image</div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <h3 className="font-bold text-lg">프로필 사진</h3>
                            <p className="text-sm text-neutral-500">
                                배경이 깔끔한 정면 사진을 권장합니다.<br />
                                <span className="text-blue-600 font-bold">권장 사이즈: 800 x 1200px (3:4 비율, 세로형)</span>
                            </p>
                            <label className="inline-block px-4 py-2 bg-black text-white text-sm rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                                <span>사진 변경하기</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </section>

                    {/* Info Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-1">소속 (로펌)</label>
                                <input type="text" name="firm" value={formData.firm} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">활동 지역</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">연락처</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">홈페이지/블로그 URL</label>
                                <input type="text" name="homepage" value={formData.homepage} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="https://" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">주력 분야 (콤마로 구분)</label>
                            <input type="text" name="expertise" value={formData.expertise} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="형사, 이혼, 부동산 등" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">한줄 소개 (Hero Section)</label>
                            <input type="text" name="introduction_short" value={formData.introduction_short} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="예: 당신의 복잡한 법률 문제를 명쾌하게 해결합니다." />
                            <p className="text-xs text-neutral-400 mt-1">프로필 최상단 이름 옆에 표시되는 짧은 문구입니다.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">상세 소개 (About Tab)</label>
                            <textarea name="introduction_long" value={formData.introduction_long} onChange={handleChange} rows={6} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="변호사님을 상세히 소개하는 글을 작성해주세요."></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">주요 경력</label>
                            <textarea name="career" value={formData.career} onChange={handleChange} rows={4} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="예: 무죄 판결 다수 이력, OO지방검찰청 검사 출신 등"></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">학력</label>
                            <textarea name="education" value={formData.education} onChange={handleChange} rows={3} className="w-full p-3 bg-neutral-50 rounded-lg border border-neutral-200" placeholder="예: 서울대학교 법과대학 졸업"></textarea>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors">
                                {loading ? "저장 중..." : "변경사항 저장"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
