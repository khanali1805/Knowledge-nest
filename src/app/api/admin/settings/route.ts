import { NextResponse } from "next/server";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings/site-settings-store";
import { siteSettingsInputSchema } from "@/lib/settings/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function createErrorResponse(error: unknown, fallbackMessage: string) {
  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : fallbackMessage,
    },
    {
      status: 500,
    },
  );
}
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      settings,
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to load site settings.");
  }
}
export async function PUT(request: Request) {
  try {
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "The settings request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = siteSettingsInputSchema.safeParse(requestBody);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          message: "Site settings validation failed.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const settings = await saveSiteSettings(parsedInput.data);
    return NextResponse.json({
      settings,
      message: "Site settings saved successfully.",
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to save site settings.");
  }
}
export async function PATCH(request: Request) {
  return PUT(request);
}
