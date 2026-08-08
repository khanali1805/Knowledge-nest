import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiAIArticleDrafts,
  getConfiguredAIProviders,
} from "@/lib/ai-article-generator";
import { MASTER_CATEGORIES } from "@/lib/categories";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
type GenerateArticleBody = {
  topic?: string;
  categorySlug?: string;
  focusKeyword?: string;
  instructions?: string;
};
export async function GET() {
  const providers = getConfiguredAIProviders();
  return NextResponse.json(
    {
      success: true,
      providers,
      providerCount: providers.length,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateArticleBody;
    const topic = body.topic?.trim();
    const categorySlug = body.categorySlug?.trim();
    if (!topic || !categorySlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Topic aur category required hain.",
        },
        {
          status: 400,
        },
      );
    }
    const category = MASTER_CATEGORIES.find((item) => item.slug === categorySlug);
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category.",
        },
        {
          status: 400,
        },
      );
    }
    const result = await generateMultiAIArticleDrafts({
      topic,
      categorySlug: category.slug,
      categoryName: category.name,
      focusKeyword: body.focusKeyword?.trim(),
      instructions: body.instructions?.trim(),
    });
    if (result.manualFallbackRequired || result.drafts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          manualFallbackRequired: true,
          message:
            "Filhal koi AI provider article generate nahi kar saka. Manual Writer use karein ya provider billing aur access verify karein.",
          drafts: [],
          failures: result.failures,
          attempts: result.attempts,
          configuredProviders: result.configuredProviders,
          successfulProvider: null,
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }
    const selectedDraft = result.drafts[0];
    return NextResponse.json(
      {
        success: true,
        manualFallbackRequired: false,
        message: `${result.drafts.length} real AI article draft generate hua.`,
        article: selectedDraft.article,
        selectedDraftId: selectedDraft.id,
        drafts: result.drafts,
        failures: result.failures,
        attempts: result.attempts,
        configuredProviders: result.configuredProviders,
        successfulProvider: result.successfulProvider,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Real AI article generate nahi hua.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
