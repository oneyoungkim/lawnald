import { API_BASE } from "@/lib/api";
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogClient from './BlogClient';

// --- Types (Same as Client) ---
interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    category: string;
    image: string;
    type: 'case' | 'column';
}

interface LawyerProfile {
    id: string;
    name: string;
    title: string;
    slogan: string;
    bio: string;
    image: string;
    brandColor: string;
    tags: string[];
    career: string;
    office: {
        address: string;
        phone: string;
        email: string;
        hours: string;
    };
    theme: {
        primary: string;
        secondary: string;
        accent: string;
    };
    content: {
        heroDescription: string;
        consultationTitle: string;
        consultationMessage: string;
    };
}

// Helper to fetch lawyer data
async function getLawyerData(id: string): Promise<{ lawyer: LawyerProfile, posts: BlogPost[] } | null> {
    // Fallback Data Definition
    const MOCK_FALLBACK: { lawyer: LawyerProfile, posts: BlogPost[] } = {
        lawyer: {
            id: "welder49264@naver.com",
            name: "김원영",
            title: "형사 전문 변호사",
            slogan: "억울함이 없도록, 끝까지 함께 싸웁니다.",
            bio: "10년 간의 검사 재직 경험을 바탕으로 의뢰인의 사건을 날카롭게 분석합니다. 형사 사건은 초기 대응이 가장 중요합니다. 지금 바로 상담하세요.",
            image: "https://placehold.co/400x400/1e293b/ffffff?text=KWY",
            brandColor: "#0F172A",
            tags: ["#성범죄", "#음주운전", "#사기/횡령", "#기업형사"],
            career: "전) 서울중앙지검 검사\n현) 법무법인 로널드 파트너 변호사\n대한변호사협회 등록 형사법 전문변호사",
            office: {
                address: "서울시 서초구 서초대로 123, 법조타워 10층",
                phone: "02-1234-5678",
                email: "lawyer.kim@lawnald.com",
                hours: "평일 09:00 - 18:00 (야간/주말 예약 가능)"
            },
            theme: {
                primary: "#14213D",
                secondary: "#FAFAFA",
                accent: "#C5A065"
            },
            content: {
                heroDescription: "의뢰인의 삶을 지키는 법률 서비스,<br/><strong>김원영</strong>이 함께하겠습니다.",
                consultationTitle: "무료 법률 상담",
                consultationMessage: "복잡한 법률 문제,<br/>전문가와 직접 이야기하세요."
            }
        },
        posts: [
            {
                id: 1,
                title: "음주운전 3회차, 집행유예 방어 성공 사례",
                excerpt: "음주운전 3회차 적발로 실형 위기에 처했던 의뢰인을 조력하여 집행유예를 이끌어냈습니다.",
                date: "2024.02.15",
                category: "승소사례",
                image: "https://placehold.co/600x400/e2e8f0/1e293b?text=DUI+Case",
                type: 'case' as const
            },
            {
                id: 2,
                title: "전세사기 피해, 보증금 전액 반환받는 법",
                excerpt: "최근 급증하는 전세사기. 임대차보호법의 맹점을 파고드는 사기 수법과 이에 대한 법적 대응 방안을 정리했습니다.",
                date: "2024.02.10",
                category: "법률칼럼",
                image: "https://placehold.co/600x400/e2e8f0/1e293b?text=Real+Estate",
                type: 'column' as const
            }
        ]
    };

    // Decode ID
    const decodedId = decodeURIComponent(id);

    try {
        console.log(`Fetching data for lawyer: ${decodedId}`);
        const res = await fetch(`${API_BASE}/api/public/lawyers/${decodedId}`, { cache: 'no-store' });

        if (!res.ok) {
            console.warn(`Backend fetch failed for ${decodedId} (Status: ${res.status}). Using fallback if applicable.`);
            if (decodedId === 'welder49264@naver.com' || id === 'welder49264@naver.com') {
                return MOCK_FALLBACK;
            }
            return null;
        }

        const data = await res.json();

        // Map API response to Component Props
        const lawyer: LawyerProfile = {
            id: data.id,
            name: data.name,
            title: "파트너 변호사",
            slogan: data.introduction_short || data.tagline || "당신의 든든한 법률 파트너",
            bio: data.introduction_long || data.introduction || "안녕하세요. 변호사 " + data.name + "입니다.",
            image: data.imageUrl || `https://placehold.co/400x400/e2e8f0/1e293b?text=${data.name}`,
            brandColor: data.blog_theme?.primaryColor || "#0F172A",
            tags: data.expertise || ["형사", "민사"],
            career: data.career || "",
            office: {
                address: data.location || "Office Address",
                phone: data.phone || "Contact Number",
                email: data.id,
                hours: "평일 09:00 - 18:00"
            },
            theme: {
                primary: data.blog_theme?.primaryColor || "#14213D",
                secondary: data.blog_theme?.secondaryColor || "#FAFAFA",
                accent: data.blog_theme?.accentColor || "#C5A065",
            },
            content: {
                heroDescription: data.blog_content?.hero_description || `의뢰인의 삶을 지키는 법률 서비스,<br/><strong>${data.name}</strong>이 함께하겠습니다.`,
                consultationTitle: data.blog_content?.consultation_title || "무료 법률 상담",
                consultationMessage: data.blog_content?.consultation_message || "복잡한 법률 문제,<br/>전문가와 직접 이야기하세요."
            }
        };

        const posts: BlogPost[] = (data.content_items || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            excerpt: item.summary || item.title,
            date: item.date,
            category: item.type === 'case' ? '승소사례' : '법률칼럼',
            image: item.cover_image || `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(item.title)}`,
            type: item.type
        }));

        return { lawyer, posts };

    } catch (e) {
        console.error("Failed to fetch lawyer data", e);
        if (decodedId === 'welder49264@naver.com' || id === 'welder49264@naver.com') {
            return MOCK_FALLBACK;
        }
        return null;
    }
}

// --- Metadata Generation ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const data = await getLawyerData(id);
    if (!data) return { title: '변호사를 찾을 수 없습니다' };

    const { lawyer } = data;
    return {
        title: `${lawyer.name} 변호사 블로그 - ${lawyer.slogan}`,
        description: lawyer.bio,
        openGraph: {
            title: `${lawyer.name} 변호사 | ${lawyer.title}`,
            description: lawyer.slogan,
            images: [lawyer.image],
        }
    };
}

// --- Page Component (Server) ---
export default async function LawyerBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getLawyerData(id);

    if (!data) {
        notFound();
    }

    return <BlogClient lawyer={data.lawyer} posts={data.posts} />;
}
