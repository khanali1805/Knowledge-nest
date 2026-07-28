import { getSiteUrl } from "@/lib/site-url";
export async function GET() {
  const siteUrl = getSiteUrl();
  const securityText = [
    `Contact: ${siteUrl}/contact-us`,
    `Policy: ${siteUrl}/privacy-policy`,
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    "Preferred-Languages: en",
    "",
  ].join("\n");
  return new Response(securityText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
