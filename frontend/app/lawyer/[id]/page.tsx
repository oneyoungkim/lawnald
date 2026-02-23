
import { API_BASE } from "@/lib/api";
import { AcademicCapIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { LawyerDetail } from "../types";

async function getLawyer(id: string): Promise<LawyerDetail | null> {
    try {
        // Try local API first, then production
        const urls = [
            `${API_BASE}/api/lawyers/${id}`,
            `http://127.0.0.1:8000/api/lawyers/${id}`,
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) return res.json();
            } catch { }
        }
        return null;
    } catch (e) {
        return null;
    }
}

export default async function LawyerPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const lawyer = await getLawyer(resolvedParams.id);

    if (!lawyer) return null;

    // Check if career is just a license number default
    const isDefaultCareer = !lawyer.career || lawyer.career.startsWith("변호사 자격증 번호:");
    const isDefaultEducation = !lawyer.education;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            <div>
                <h3 className="text-2xl font-serif font-bold text-main mb-8">전문 분야</h3>
                <div className="flex flex-wrap gap-2 mb-12">
                    {lawyer.expertise.map(exp => (
                        <span key={exp} className="px-4 py-2 bg-white border border-point/20 rounded-lg text-sm font-bold text-main shadow-sm">
                            {exp}
                        </span>
                    ))}
                </div>

                <h3 className="text-2xl font-serif font-bold text-main mb-8">경력 사항</h3>
                <ul className="space-y-6">
                    <li className="flex gap-4">
                        <div className="mt-1 p-2 bg-white border border-point/20 rounded-lg shadow-sm">
                            <BriefcaseIcon className="w-5 h-5 text-point" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-main mb-1">경력</p>
                            {isDefaultCareer ? (
                                <p className="text-zinc-400 italic">대시보드에서 경력을 입력해주세요</p>
                            ) : (
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-line">{lawyer.career}</p>
                            )}
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <div className="mt-1 p-2 bg-white border border-point/20 rounded-lg shadow-sm">
                            <AcademicCapIcon className="w-5 h-5 text-point" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-main mb-1">학력</p>
                            {isDefaultEducation ? (
                                <p className="text-zinc-400 italic">대시보드에서 학력을 입력해주세요</p>
                            ) : (
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-line">{lawyer.education}</p>
                            )}
                        </div>
                    </li>
                </ul>
            </div>
            {lawyer.introduction_long && (
                <div className="bg-white border border-point/10 p-10 rounded-3xl shadow-sm">
                    <h3 className="text-xl font-bold text-main mb-6">변호사 소개</h3>
                    <div className="text-zinc-600 leading-loose text-lg whitespace-pre-wrap">
                        {lawyer.introduction_long}
                    </div>
                </div>
            )}

            {/* Recent Cases Section - only show if lawyer has real content_items */}
            {lawyer.content_items && lawyer.content_items.filter((i: any) => i.type === 'case').length > 0 && (
                <div className="col-span-full mt-12">
                    <h3 className="text-2xl font-serif font-bold text-main mb-8">주요 승소 사례</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lawyer.content_items.filter((i: any) => i.type === 'case').slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl border border-point/20 hover:border-point/40 transition-colors group shadow-sm hover:shadow-md">
                                <h4 className="text-lg font-bold text-main mb-4 group-hover:text-point transition-colors line-clamp-1">{item.title}</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed line-clamp-4">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
