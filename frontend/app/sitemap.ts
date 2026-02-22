import { MetadataRoute } from 'next';

// Define Article interface matching backend response
interface Article {
    id: string;
    date: string;
}

interface LawyerSitemapItem {
    id: string;
    content_items: {
        id: string;
        slug: string;
        date: string;
        type: string;
    }[];
}

async function getArticles(): Promise<Article[]> {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/magazine');
        if (!res.ok) return [];
        return res.json();
    } catch (e) {
        return [];
    }
}

async function getLawyerSitemapData(): Promise<LawyerSitemapItem[]> {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/public/lawyers');
        if (!res.ok) return [];
        return res.json();
    } catch {
        // Expected during build — no backend server running
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const articles = await getArticles();
    const lawyers = await getLawyerSitemapData();
    const baseUrl = 'https://lawnald.com';

    // Static routes
    const routes = [
        '',
        '/magazine',
        '/search',
        '/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (Magazine Articles)
    const articleRoutes = articles.map((article) => ({
        url: `${baseUrl}/magazine/${article.id}`,
        lastModified: article.date,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Dynamic routes (Lawyer Profiles & Blogs)
    let lawyerRoutes: MetadataRoute.Sitemap = [];

    lawyers.forEach(lawyer => {
        // Lawyer Profile
        lawyerRoutes.push({
            url: `${baseUrl}/lawyer/${lawyer.id}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        });

        // Lawyer Blog List
        lawyerRoutes.push({
            url: `${baseUrl}/lawyer/${lawyer.id}/blog`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        });

        // Lawyer Blog Posts
        lawyer.content_items.forEach(post => {
            lawyerRoutes.push({
                url: `${baseUrl}/lawyer/${lawyer.id}/blog/${post.slug || post.id}`,
                lastModified: post.date,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            });
        });
    });

    return [...routes, ...articleRoutes, ...lawyerRoutes];
}
