import { JsonLd } from "@/components/site/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";
type ArticleJsonLdProps = {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  categoryName: string;
};
export function ArticleJsonLd({
  title,
  excerpt,
  slug,
  publishedAt,
  categoryName,
}: ArticleJsonLdProps) {
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/article/${slug}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: excerpt,
        datePublished: publishedAt,
        dateModified: publishedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        articleSection: categoryName,
        author: {
          "@type": "Organization",
          name: "Knowledge Nest",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Knowledge Nest",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/icon.svg`,
          },
        },
      }}
    />
  );
}
