import { NextResponse } from 'next/server';

interface Article {
    id: string;
    title: string;
    summary: string;
    date: string;
    lawyer_name: string;
    type: string;
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

export async function GET() {
    const articles = await getArticles();
    const siteUrl = 'https://lawnald.com';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Lawnald Magazine</title>
    <link>${siteUrl}</link>
    <description>Legal insights and success cases from top lawyers.</description>
    <language>ko-KR</language>
    ${articles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}/magazine/${article.id}</link>
      <description><![CDATA[${article.summary}]]></description>
      <author>${article.lawyer_name}</author>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <guid>${siteUrl}/magazine/${article.id}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'text/xml',
        },
    });
}
