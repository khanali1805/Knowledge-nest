const DEVELOPMENT_SITE_URL = "http://localhost:3000";
function normalizeSiteUrl(value: string): string {
  const normalizedValue = value.trim().replace(/\/+$/, "");
  const parsedUrl = new URL(normalizedValue);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
  }
  return parsedUrl.toString().replace(/\/+$/, "");
}
export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    return normalizeSiteUrl(configuredUrl);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is missing. Add the production website URL to the deployment environment.",
    );
  }
  return DEVELOPMENT_SITE_URL;
}
