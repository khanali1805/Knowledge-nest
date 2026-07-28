import { getArticleExcerpt, getPublishedArticles } from "@/lib/queries/article-queries";
import { getSiteUrl } from "@/lib/site-url";
import { escapeXmlText } from "@/lib/xml";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const siteUrl = getSiteUrl();
  const articles = await getPublishedArticles(100);
  const items = articles
    .map((article) => {
      const articleUrl = `${siteUrl}/article/${article.slug}`;
      const publishedAt = article.publishedAt ?? article.updatedAt;
      return `
        <item>
          <title>${escapeXmlText(article.title)}</title>
          <link>${escapeXmlText(articleUrl)}</link>
          <guid isPermaLink="true">${escapeXmlText(articleUrl)}</guid>
          <description>${escapeXmlText(getArticleExcerpt(article))}</description>
          <category>${escapeXmlText(article.categoryName ?? "Articles")}</category>
          <pubDate>${publishedAt.toUTCString()}</pubDate>
        </item>
      `;
    })
    .join("");
  const latestPublishedDate =
    articles.length > 0
      ? new Date(
          Math.max(
            ...articles.map((article) =>
              (article.publishedAt ?? article.updatedAt).getTime(),
            ),
          ),
        ).toUTCString()
      : new Date().toUTCString();
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Knowledge Nest</title>
        <link>${escapeXmlText(siteUrl)}</link>
        <description>Latest published articles from Knowledge Nest.</description>
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
