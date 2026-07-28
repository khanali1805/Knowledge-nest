import { JsonLd } from "@/components/site/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";
type BreadcrumbItem = {
  name: string;
  path: string;
};
type BreadcrumbJsonLdProps = {
  items: BreadcrumbItem[];
};
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteUrl = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteUrl}${item.path}`,
        })),
      }}
    />
  );
}
