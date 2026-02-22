import Image from "next/image";
import Link from "next/link";
import SearchForm from "./components/SearchForm";
import TypingText from "./components/TypingText";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-white text-[var(--foreground)] relative selection:bg-accent selection:text-white">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-end gap-3 px-6 py-4 z-20">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          로그인
        </Link>
        <Link href="/signup/client" className="text-sm bg-[var(--main)] text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
          회원가입
        </Link>
      </div>

      <div className="z-10 max-w-5xl w-full items-center justify-center text-sm flex flex-col gap-24">

        {/* Logo Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4 opacity-90">
            <Image
              src="/logo.png"
              alt="Lawnald Logo"
              fill
              className="object-contain grayscale animate-spin-slow"
              priority
            />
          </div>

        </div>

        {/* Slogan */}
        <div className="flex flex-col items-center text-center max-w-4xl px-4 -mt-12">
          <TypingText
            text={`당신의 사건에 가장 적합한 변호사\nAI 로날드가 찾아드립니다.`}
            className="text-sm sm:text-lg md:text-2xl font-serif text-primary leading-relaxed font-medium"
            speed={0.08}
          />
        </div>


        <SearchForm />
      </div>
    </main>
  );
}
