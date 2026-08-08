import { getGoogleAdsTxtLine } from "@/lib/adsense";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const declaration = getGoogleAdsTxtLine();
  const body = declaration
    ? `${declaration}\n`
    : [
        "# Knowledge Nest ads.txt",
        "# Google AdSense publisher ID is not configured yet.",
        "",
      ].join("\n");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": declaration
        ? "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=300, s-maxage=300",
    },
  });
}
