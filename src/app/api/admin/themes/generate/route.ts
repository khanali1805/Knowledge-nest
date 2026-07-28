import { NextResponse } from "next/server";
import { generateThemeConfiguration } from "@/lib/theme/ai-generator";
import { saveTheme } from "@/lib/theme/theme-store";
import type { ThemeConfiguration } from "@/lib/theme/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type GenerateThemeRequest = {
  prompt?: string;
  theme?: ThemeConfiguration;
};
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateThemeRequest;
    if (!body.theme) {
      return NextResponse.json(
        {
          message: "A base theme is required.",
        },
        {
          status: 400,
        },
      );
    }
    const prompt = body.prompt?.trim() ?? "";
    if (prompt.length < 10) {
      return NextResponse.json(
        {
          message: "Theme prompt kam az kam 10 characters ka hona chahiye.",
        },
        {
          status: 400,
        },
      );
    }
    const generatedTheme = await generateThemeConfiguration(
      body.theme,
      prompt,
    );
    const savedTheme = await saveTheme(generatedTheme);
    return NextResponse.json(
      {
        theme: savedTheme,
        message: "Unique AI theme successfully generate ho gayi.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate the AI theme.";
    const isConfigurationError = message.includes("OPENAI_API_KEY");
    return NextResponse.json(
      {
        message,
      },
      {
        status: isConfigurationError ? 503 : 400,
      },
    );
  }
}