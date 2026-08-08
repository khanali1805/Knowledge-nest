import { NextResponse } from "next/server";
import { getAIProviderConfiguration, verifyAIProviders } from "@/lib/ai-provider-health";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const shouldVerify = requestUrl.searchParams.get("verify") === "1";
  if (!shouldVerify) {
    const providers = getAIProviderConfiguration();
    return NextResponse.json(
      {
        success: true,
        verified: false,
        configuredCount: providers.filter((provider) => provider.configured).length,
        connectedCount: null,
        providers,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  const providers = await verifyAIProviders();
  const configuredCount = providers.filter((provider) => provider.configured).length;
  const connectedCount = providers.filter(
    (provider) => provider.status === "connected",
  ).length;
  return NextResponse.json(
    {
      success: true,
      verified: true,
      configuredCount,
      connectedCount,
      providers,
      verifiedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
