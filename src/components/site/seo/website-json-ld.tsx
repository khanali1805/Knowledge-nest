import { JsonLd } from "@/components/site/seo/json-ld";
import type { SiteSettingsInput } from "@/lib/settings/validation";
type WebsiteJsonLdProps = {
  settings: SiteSettingsInput;
};
export function WebsiteJsonLd({ settings }: WebsiteJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settings.siteName,
        url: settings.siteUrl,
        description: settings.tagline,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${settings.siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
