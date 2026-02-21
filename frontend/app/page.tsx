import Image from "next/image";
import SearchForm from "./components/SearchForm";
import TypingText from "./components/TypingText";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-[var(--background)] text-[var(--foreground)] relative selection:bg-accent selection:text-white">
      <header className="absolute top-0 right-0 p-6 flex gap-4 text-sm font-medium z-50">
        <a href="/login" className="px-4 py-2 hover:bg-point/10 rounded-full transition-colors text-main font-semibold">로그인</a>
        <a href="/signup" className="px-4 py-2 bg-main text-white rounded-full hover:bg-main/90 transition-opacity shadow-lg shadow-main/20">회원가입</a>
      </header>

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
        <div className="flex flex-col items-center text-center max-w-2xl px-4 -mt-12">
          <TypingText
            text={`AI 로날드는 광고비를 많이 쓰는 변호사가 아닌\n당신의 사건에 가장 경험과 지식이 많은 변호사를 추천합니다.`}
            className="text-lg md:text-2xl font-serif text-primary leading-relaxed font-medium"
            speed={0.08}
          />
        </div>


        <SearchForm />
      </div>

      <footer className="absolute bottom-8 text-xs text-slate-400 font-light tracking-wider uppercase">
        AI Legal Match
      </footer>
    </main>
  );
}
