import { getSiteUrl } from "@/lib/site-url";
export async function GET() {
  const siteUrl = getSiteUrl();
  const humansText = [
    "/* TEAM */",
    "Website: Knowledge Nest",
    `Contact: ${siteUrl}/contact-us`,
    "",
    "/* SITE */",
    "Language: English",
    "Framework: Next.js",
    "Database: PostgreSQL",
    "ORM: Drizzle ORM",
    "CSS: Tailwind CSS",
    "",
  ].join("\n");
  return new Response(humansText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
