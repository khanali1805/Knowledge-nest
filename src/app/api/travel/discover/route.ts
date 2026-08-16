import { NextResponse } from "next/server";
import {
  isTravelDiscoveryKind,
  normalizeTravelDestination,
  normalizeTravelDiscoveryLimit,
} from "@/lib/travel-provider-contract";
import { discoverTravelPlaces } from "@/lib/travel-provider-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = normalizeTravelDestination(url.searchParams.get("destination"));
  const kind = url.searchParams.get("kind");
  const limit = normalizeTravelDiscoveryLimit(url.searchParams.get("limit"));
  if (destination.length < 2) {
    return jsonError("A destination with at least 2 characters is required.", 400);
  }
  if (!isTravelDiscoveryKind(kind)) {
    return jsonError("A valid travel discovery kind is required.", 400);
  }
  const result = await discoverTravelPlaces({
    destination,
    kind,
    limit,
  });
  return NextResponse.json(
    {
      success: true,
      ...result,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
