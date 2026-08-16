export type TravelDiscoveryKind = "hotel" | "restaurant" | "attraction" | "local-place";
export type TravelProviderId = "google-places" | "foursquare" | "amadeus";
export type TravelProviderStatus = "ready" | "not-configured" | "unavailable" | "error";
export type TravelPriceLevel =
  "free" | "inexpensive" | "moderate" | "expensive" | "very-expensive" | "unknown";
export type TravelPlaceSuggestion = {
  id: string;
  provider: TravelProviderId;
  kind: TravelDiscoveryKind;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: TravelPriceLevel;
  websiteUrl: string | null;
  mapUrl: string | null;
  primaryType: string | null;
};
export type TravelProviderReport = {
  provider: TravelProviderId;
  status: TravelProviderStatus;
  resultCount: number;
  message: string | null;
};
export type TravelDiscoveryRequest = {
  destination: string;
  kind: TravelDiscoveryKind;
  limit: number;
};
export type TravelDiscoveryResponse = {
  destination: string;
  kind: TravelDiscoveryKind;
  suggestions: TravelPlaceSuggestion[];
  providers: TravelProviderReport[];
};
const DISCOVERY_KINDS = new Set<TravelDiscoveryKind>([
  "hotel",
  "restaurant",
  "attraction",
  "local-place",
]);
export function isTravelDiscoveryKind(value: unknown): value is TravelDiscoveryKind {
  return typeof value === "string" && DISCOVERY_KINDS.has(value as TravelDiscoveryKind);
}
export function normalizeTravelDiscoveryLimit(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return 8;
  }
  return Math.max(1, Math.min(20, Math.round(parsed)));
}
export function normalizeTravelDestination(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}
