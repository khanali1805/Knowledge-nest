import "server-only";
import type {
  TravelDiscoveryKind,
  TravelDiscoveryRequest,
  TravelDiscoveryResponse,
  TravelPlaceSuggestion,
  TravelPriceLevel,
  TravelProviderReport,
} from "@/lib/travel-provider-contract";
type GoogleTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: {
      text?: string;
    };
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    primaryType?: string;
  }>;
};
type FoursquareSearchResponse = {
  results?: Array<{
    fsq_place_id?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    location?: {
      formatted_address?: string;
    };
    categories?: Array<{
      name?: string;
    }>;
  }>;
};
type AmadeusTokenResponse = {
  access_token?: string;
};
type AmadeusHotelListResponse = {
  data?: Array<{
    hotelId?: string;
    name?: string;
    geoCode?: {
      latitude?: number;
      longitude?: number;
    };
    address?: {
      lines?: string[];
      cityName?: string;
      countryCode?: string;
    };
  }>;
};
type ProviderResult = {
  suggestions: TravelPlaceSuggestion[];
  report: TravelProviderReport;
};
function normalizeGooglePriceLevel(value: string | undefined): TravelPriceLevel {
  switch (value) {
    case "PRICE_LEVEL_FREE":
      return "free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "inexpensive";
    case "PRICE_LEVEL_MODERATE":
      return "moderate";
    case "PRICE_LEVEL_EXPENSIVE":
      return "expensive";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "very-expensive";
    default:
      return "unknown";
  }
}
function buildGoogleQuery(destination: string, kind: TravelDiscoveryKind): string {
  switch (kind) {
    case "hotel":
      return `hotels in ${destination}`;
    case "restaurant":
      return `restaurants in ${destination}`;
    case "attraction":
      return `tourist attractions in ${destination}`;
    case "local-place":
      return `useful places in ${destination}`;
  }
}
function buildFoursquareQuery(kind: TravelDiscoveryKind): string {
  switch (kind) {
    case "hotel":
      return "hotel";
    case "restaurant":
      return "restaurant";
    case "attraction":
      return "tourist attraction";
    case "local-place":
      return "local places";
  }
}
async function discoverGooglePlaces(
  request: TravelDiscoveryRequest,
): Promise<ProviderResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return {
      suggestions: [],
      report: {
        provider: "google-places",
        status: "not-configured",
        resultCount: 0,
        message: "GOOGLE_PLACES_API_KEY is not configured.",
      },
    };
  }
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
          "places.websiteUri",
          "places.googleMapsUri",
          "places.primaryType",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: buildGoogleQuery(request.destination, request.kind),
        pageSize: request.limit,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return {
        suggestions: [],
        report: {
          provider: "google-places",
          status: "unavailable",
          resultCount: 0,
          message: `Google Places returned HTTP ${response.status}.`,
        },
      };
    }
    const payload = (await response.json()) as GoogleTextSearchResponse;
    const suggestions: TravelPlaceSuggestion[] = (payload.places ?? [])
      .slice(0, request.limit)
      .map((place, index) => ({
        id: place.id ?? `google-${index}`,
        provider: "google-places",
        kind: request.kind,
        name: place.displayName?.text?.trim() || "Unnamed place",
        address: place.formattedAddress?.trim() || null,
        latitude:
          typeof place.location?.latitude === "number" ? place.location.latitude : null,
        longitude:
          typeof place.location?.longitude === "number" ? place.location.longitude : null,
        rating: typeof place.rating === "number" ? place.rating : null,
        reviewCount:
          typeof place.userRatingCount === "number" ? place.userRatingCount : null,
        priceLevel: normalizeGooglePriceLevel(place.priceLevel),
        websiteUrl: place.websiteUri?.trim() || null,
        mapUrl: place.googleMapsUri?.trim() || null,
        primaryType: place.primaryType?.trim() || null,
      }));
    return {
      suggestions,
      report: {
        provider: "google-places",
        status: "ready",
        resultCount: suggestions.length,
        message: null,
      },
    };
  } catch (error) {
    return {
      suggestions: [],
      report: {
        provider: "google-places",
        status: "error",
        resultCount: 0,
        message: error instanceof Error ? error.message : "Google Places request failed.",
      },
    };
  }
}
async function discoverFoursquare(
  request: TravelDiscoveryRequest,
): Promise<ProviderResult> {
  const apiKey = process.env.FOURSQUARE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return {
      suggestions: [],
      report: {
        provider: "foursquare",
        status: "not-configured",
        resultCount: 0,
        message: "FOURSQUARE_PLACES_API_KEY is not configured.",
      },
    };
  }
  try {
    const url = new URL("https://places-api.foursquare.com/places/search");
    url.searchParams.set("query", buildFoursquareQuery(request.kind));
    url.searchParams.set("near", request.destination);
    url.searchParams.set("limit", String(request.limit));
    url.searchParams.set(
      "fields",
      ["fsq_place_id", "name", "latitude", "longitude", "location", "categories"].join(
        ",",
      ),
    );
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": "2025-06-17",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return {
        suggestions: [],
        report: {
          provider: "foursquare",
          status: "unavailable",
          resultCount: 0,
          message: `Foursquare returned HTTP ${response.status}.`,
        },
      };
    }
    const payload = (await response.json()) as FoursquareSearchResponse;
    const suggestions: TravelPlaceSuggestion[] = (payload.results ?? [])
      .slice(0, request.limit)
      .map((place, index) => ({
        id: place.fsq_place_id ?? `foursquare-${index}`,
        provider: "foursquare",
        kind: request.kind,
        name: place.name?.trim() || "Unnamed place",
        address: place.location?.formatted_address?.trim() || null,
        latitude: typeof place.latitude === "number" ? place.latitude : null,
        longitude: typeof place.longitude === "number" ? place.longitude : null,
        rating: null,
        reviewCount: null,
        priceLevel: "unknown",
        websiteUrl: null,
        mapUrl: null,
        primaryType: place.categories?.[0]?.name?.trim() || null,
      }));
    return {
      suggestions,
      report: {
        provider: "foursquare",
        status: "ready",
        resultCount: suggestions.length,
        message: null,
      },
    };
  } catch (error) {
    return {
      suggestions: [],
      report: {
        provider: "foursquare",
        status: "error",
        resultCount: 0,
        message: error instanceof Error ? error.message : "Foursquare request failed.",
      },
    };
  }
}
async function getAmadeusAccessToken(): Promise<string | null> {
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as AmadeusTokenResponse;
  return payload.access_token?.trim() || null;
}
async function discoverAmadeusHotels(
  request: TravelDiscoveryRequest,
): Promise<ProviderResult> {
  if (request.kind !== "hotel") {
    return {
      suggestions: [],
      report: {
        provider: "amadeus",
        status: "ready",
        resultCount: 0,
        message: "Amadeus is reserved for hotel discovery in this provider layer.",
      },
    };
  }
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return {
      suggestions: [],
      report: {
        provider: "amadeus",
        status: "not-configured",
        resultCount: 0,
        message: "AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET are not configured.",
      },
    };
  }
  /*
   * Amadeus hotel discovery needs a city code or geocode.
   *
   * The architecture is intentionally provider-ready here,
   * but we do not guess a city-code resolution strategy.
   *
   * A later provider integration block will resolve the
   * destination through Google/Foursquare coordinates or
   * Amadeus City Search before calling Hotel List / Search.
   */
  try {
    const token = await getAmadeusAccessToken();
    if (!token) {
      return {
        suggestions: [],
        report: {
          provider: "amadeus",
          status: "unavailable",
          resultCount: 0,
          message: "Amadeus authentication could not be established.",
        },
      };
    }
    const placeholderPayload: AmadeusHotelListResponse = {
      data: [],
    };
    const suggestions: TravelPlaceSuggestion[] = (placeholderPayload.data ?? [])
      .slice(0, request.limit)
      .map((hotel, index) => {
        const addressParts = [
          ...(hotel.address?.lines ?? []),
          hotel.address?.cityName,
          hotel.address?.countryCode,
        ].filter((value): value is string => Boolean(value?.trim()));
        return {
          id: hotel.hotelId ?? `amadeus-${index}`,
          provider: "amadeus",
          kind: "hotel",
          name: hotel.name?.trim() || "Unnamed hotel",
          address: addressParts.length > 0 ? addressParts.join(", ") : null,
          latitude:
            typeof hotel.geoCode?.latitude === "number" ? hotel.geoCode.latitude : null,
          longitude:
            typeof hotel.geoCode?.longitude === "number" ? hotel.geoCode.longitude : null,
          rating: null,
          reviewCount: null,
          priceLevel: "unknown",
          websiteUrl: null,
          mapUrl: null,
          primaryType: "hotel",
        };
      });
    return {
      suggestions,
      report: {
        provider: "amadeus",
        status: "ready",
        resultCount: suggestions.length,
        message:
          "Authentication is ready; destination-to-city/geocode resolution is the next Amadeus step.",
      },
    };
  } catch (error) {
    return {
      suggestions: [],
      report: {
        provider: "amadeus",
        status: "error",
        resultCount: 0,
        message: error instanceof Error ? error.message : "Amadeus request failed.",
      },
    };
  }
}
function deduplicateSuggestions(
  suggestions: TravelPlaceSuggestion[],
): TravelPlaceSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = [
      suggestion.name.trim().toLowerCase(),
      suggestion.address?.trim().toLowerCase() ?? "",
    ].join("|");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
export async function discoverTravelPlaces(
  request: TravelDiscoveryRequest,
): Promise<TravelDiscoveryResponse> {
  const providerResults = await Promise.all([
    discoverGooglePlaces(request),
    discoverFoursquare(request),
    discoverAmadeusHotels(request),
  ]);
  const suggestions = deduplicateSuggestions(
    providerResults.flatMap((result) => result.suggestions),
  ).slice(0, Math.max(request.limit, request.limit * 2));
  return {
    destination: request.destination,
    kind: request.kind,
    suggestions,
    providers: providerResults.map((result) => result.report),
  };
}
