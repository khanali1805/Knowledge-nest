import { NextRequest, NextResponse } from "next/server";
import { optimizeAISEO } from "@/lib/ai-seo-optimizer";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      focusKeyword?: string;
      category?: string;
    };
    if (!body.title || !body.content) {
      throw new Error("Title and content are required.");
    }
    const result = optimizeAISEO({
      title: body.title,
      content: body.content,
      focusKeyword: body.focusKeyword,
      category: body.category,
    });
    return NextResponse.json({
      success: true,
      message: "SEO optimization completed.",
      seo: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to optimize SEO.",
      },
      {
        status: 400,
      },
    );
  }
}
