const adsensePublisherIdPattern = /^pub-\d{16}$/;
export async function GET() {
  const publisherId = process.env.GOOGLE_ADSENSE_PUBLISHER_ID?.trim();
  if (!publisherId || !adsensePublisherIdPattern.test(publisherId)) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  const adsTxt = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
  return new Response(`${adsTxt}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
