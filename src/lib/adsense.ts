const adsensePublisherIdPattern = /^pub-\d{16}$/;
const adsenseClientIdPattern = /^ca-pub-\d{16}$/;
const adsenseSlotIdPattern = /^\d+$/;
export function normalizeGoogleAdsensePublisherId(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim() ?? "";
  if (adsensePublisherIdPattern.test(normalized)) {
    return normalized;
  }
  if (adsenseClientIdPattern.test(normalized)) {
    return normalized.slice(3);
  }
  return null;
}
export function getGoogleAdsensePublisherId(): string | null {
  return normalizeGoogleAdsensePublisherId(process.env.GOOGLE_ADSENSE_PUBLISHER_ID);
}
export function getGoogleAdsenseClientId(): string | null {
  const publisherId = getGoogleAdsensePublisherId();
  if (!publisherId) {
    return null;
  }
  return `ca-${publisherId}`;
}
export function getGoogleAdsTxtLine(): string | null {
  const publisherId = getGoogleAdsensePublisherId();
  if (!publisherId) {
    return null;
  }
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
}
export function isGoogleAdsenseSlotId(value: string | null | undefined): value is string {
  return adsenseSlotIdPattern.test(value?.trim() ?? "");
}
function normalizeSlot(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return isGoogleAdsenseSlotId(normalized) ? normalized : null;
}
export function getGoogleAdsenseHomeSlot(): string | null {
  return normalizeSlot(process.env.GOOGLE_ADSENSE_HOME_SLOT);
}
export function getGoogleAdsenseArticleSlot(): string | null {
  return normalizeSlot(process.env.GOOGLE_ADSENSE_ARTICLE_SLOT);
}
