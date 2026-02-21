"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LawyerSignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        licenseId: "", // 변호사 자격 번호
        firm: "",
        phone: ""
    });
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!licenseFile) {
            alert("변호사 자격증 사진을 업로드해주세요.");
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });
            data.append("licenseImage", licenseFile);

            const res = await fetch("http://localhost:8000/api/auth/signup/lawyer", {
                method: "POST",
                body: data
            });

            if (res.ok) {
                alert("가입 신청이 완료되었습니다. 관리자 승인 후 활동이 가능합니다.");
                router.push("/");
            } else {
                const errorData = await res.json();
                alert(`가입 실패: ${errorData.detail || "오류가 발생했습니다."}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-6">
            <div className="max-w-lg w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-800">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">변호사 회원가입</h1>
                    <p className="text-sm text-neutral-500">변호사 인증을 위해 정확한 정보를 입력해주세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">이름</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-neutral-100 dark:bg-zinc-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">이메일 (아이디)</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-neutral-100 dark:bg-zinc-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">비밀번호</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-neutral-100 dark:bg-zinc-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 mt-2">
                        <label className="block text-sm font-bold mb-1 text-blue-600">대한변호사협회 등록번호</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                placeholder="예: 12345"
                                className="w-1/2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.licenseId}
                                onChange={e => setFormData({ ...formData, licenseId: e.target.value })}
                            />
                            <div className="w-1/2">
                                <label className="block text-xs font-bold mb-1 text-blue-600">자격증 사진 첨부 (필수)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setLicenseFile(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full text-xs text-slate-500
                                      file:mr-2 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-xs file:font-semibold
                                      file:bg-blue-50 file:text-blue-700
                                      hover:file:bg-blue-100
                                    "
                                />
                            </div>
                        </div>
                        <p className="text-xs text-blue-500 mt-1">
                            * 변호사 자격 확인을 위해 자격증 사진을 반드시 업로드해주세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">소속 (로펌/법률사무소)</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-neutral-100 dark:bg-zinc-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.firm}
                                onChange={e => setFormData({ ...formData, firm: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">연락처</label>
                            <input
                                type="text"
                                required
                                placeholder="010-0000-0000"
                                className="w-full bg-neutral-100 dark:bg-zinc-800 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl mt-6 hover:opacity-90 transition-opacity"
                    >
                        {loading ? "가입 신청 중..." : "변호사 가입 신청하기"}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm">
                    <Link href="/signup" className="text-neutral-500 hover:text-black">이전으로</Link>
                </div>
            </div>
        </main>
    );
}
