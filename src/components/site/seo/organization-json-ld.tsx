import { JsonLd } from "@/components/site/seo/json-ld";
import type { SiteSettingsInput } from "@/lib/settings/validation";
type OrganizationJsonLdProps = {
  settings: SiteSettingsInput;
};
export function OrganizationJsonLd({ settings }: OrganizationJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: settings.siteName,
        url: settings.siteUrl,
        logo: `${settings.siteUrl}/icon.svg`,
      }}
    />
  );
}
