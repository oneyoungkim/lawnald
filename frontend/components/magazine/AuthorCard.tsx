import Link from "next/link";
import Image from "next/image";

interface AuthorCardProps {
    lawyerId: string;
    name: string;
    firm: string;
    image?: string;
    description?: string;
}

export default function AuthorCard({ lawyerId, name, firm, image, description }: AuthorCardProps) {
    const displayName = name?.endsWith('변호사') ? name : `${name} 변호사`;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B2A4A] to-[#0f1b33] p-[1px] my-16 shadow-2xl shadow-[#1B2A4A]/20">
            <div className="relative rounded-[23px] bg-gradient-to-br from-[#1B2A4A] to-[#162240] p-8 md:p-10">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }} />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Profile Image */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#C5A86C] to-[#8B7340] rounded-full opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
                        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden ring-2 ring-[#C5A86C]/40">
                            <Image
                                src={image || "/placeholder.png"}
                                alt={displayName}
                                width={144}
                                height={144}
                                className="object-cover w-full h-full"
                                unoptimized={image?.startsWith("http") || false}
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">{displayName}</h3>
                        </div>
                        <p className="text-[#C5A86C] font-semibold text-sm mb-4 tracking-wide">{firm}</p>
                        <p className="text-blue-200/70 mb-8 leading-relaxed text-sm max-w-md">
                            {description || "법률 문제는 전문가와 상의하세요. 당신의 권리를 지키는 가장 확실한 방법입니다."}
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                            <Link
                                href={`/lawyer/${lawyerId}`}
                                className="group px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                                프로필 보기
                            </Link>
                            <Link
                                href={`/blog/${lawyerId}`}
                                className="px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                                블로그
                            </Link>
                            <Link
                                href={`/lawyer/${lawyerId}/consult`}
                                className="px-5 py-2.5 bg-gradient-to-r from-[#C5A86C] to-[#A8903F] hover:from-[#d4b87a] hover:to-[#b89d4d] text-[#1B2A4A] text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#C5A86C]/20 flex items-center justify-center gap-2"
                            >
                                💬 상담 신청
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
