import { JsonLd } from "@/components/site/seo/json-ld";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
type ArticleJsonLdProps = {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  modifiedAt: string;
  categoryName: string;
  imageUrl?: string | null;
};
export async function ArticleJsonLd({
  title,
  excerpt,
  slug,
  publishedAt,
  modifiedAt,
  categoryName,
  imageUrl,
}: ArticleJsonLdProps) {
  const settings = await getPublicSiteSettings();
  const articleUrl = `${settings.siteUrl}/article/${slug}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: excerpt,
        datePublished: publishedAt,
        dateModified: modifiedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        articleSection: categoryName,
        ...(imageUrl
          ? {
              image: [imageUrl],
            }
          : {}),
        author: {
          "@type": "Organization",
          name: settings.siteName,
          url: settings.siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: settings.siteName,
          url: settings.siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${settings.siteUrl}/icon.svg`,
          },
        },
      }}
    />
  );
}
