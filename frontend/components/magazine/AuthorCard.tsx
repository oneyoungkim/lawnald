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
    return (
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-white/50 border border-point/20 rounded-2xl my-16 shadow-sm">
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                <Image
                    src={image || "/placeholder.png"}
                    alt={name}
                    width={128}
                    height={128}
                    className="object-cover rounded-full border-2 border-white shadow-md"
                    unoptimized={image?.startsWith("http") || false}
                />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-serif font-medium mb-1 text-main">{name} <span className="font-sans text-base text-zinc-500">변호사</span></h3>
                <p className="text-sm text-point font-bold mb-4">{firm}</p>
                <p className="text-zinc-600 mb-6 leading-relaxed text-sm">
                    {description || "법률 문제는 전문가와 상의하세요. 당신의 권리를 지키는 가장 확실한 방법입니다."}
                </p>
                <div className="flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                    <Link
                        href={`/blog/${lawyerId}`}
                        className="px-6 py-3 bg-white border border-point/30 text-main text-sm font-semibold rounded-xl hover:bg-point/5 transition-colors text-center"
                    >
                        변호사 블로그 가기
                    </Link>
                    <Link
                        href={`/lawyer/${lawyerId}/consult`}
                        className="px-6 py-3 bg-main hover:bg-main/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-main/20 flex items-center justify-center gap-2"
                    >
                        <span>💬</span> 변호사 상담하기
                    </Link>
                </div>
            </div>
        </div>
    );
}
