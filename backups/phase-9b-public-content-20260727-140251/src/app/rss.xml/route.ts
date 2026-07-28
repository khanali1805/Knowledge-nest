import { publicArticles } from "@/data/public-content";
import { getSiteUrl } from "@/lib/site-url";
import { escapeXmlText } from "@/lib/xml";
export async function GET() {
  const siteUrl = getSiteUrl();
  const items = [...publicArticles]
    .sort(
      (firstArticle, secondArticle) =>
        new Date(secondArticle.publishedAt).getTime() -
        new Date(firstArticle.publishedAt).getTime(),
    )
    .map((article) => {
      const articleUrl = `${siteUrl}/article/${article.slug}`;
      return `
        <item>
          <title>${escapeXmlText(article.title)}</title>
          <link>${escapeXmlText(articleUrl)}</link>
          <guid isPermaLink="true">${escapeXmlText(articleUrl)}</guid>
          <description>${escapeXmlText(article.excerpt)}</description>
          <category>${escapeXmlText(article.category.name)}</category>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
        </item>
      `;
    })
    .join("");
  const latestPublishedDate =
    publicArticles.length > 0
      ? new Date(
          Math.max(
            ...publicArticles.map((article) => new Date(article.publishedAt).getTime()),
          ),
        ).toUTCString()
      : new Date().toUTCString();
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Knowledge Nest</title>
        <link>${escapeXmlText(siteUrl)}</link>
        <description>Educational articles across finance, science, technology, health, education and other knowledge categories.</description>
        <language>en</language>
        <lastBuildDate>${latestPublishedDate}</lastBuildDate>
        <generator>Knowledge Nest</generator>
        <atom:link
          xmlns:atom="http://www.w3.org/2005/Atom"
          href="${escapeXmlText(`${siteUrl}/rss.xml`)}"
          rel="self"
          type="application/rss+xml"
        />
        ${items}
      </channel>
    </rss>`;
  return new Response(rssXml.trim(), {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
