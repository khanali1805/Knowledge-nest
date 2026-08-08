import { NextRequest, NextResponse } from "next/server";
import { assistAIContent } from "@/lib/ai-content-assistant";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      action?: "rewrite" | "improve" | "expand" | "simplify";
    };
    if (!body.title || !body.content || !body.action) {
      throw new Error("Title, content and action are required.");
    }
    const result = assistAIContent({
      title: body.title,
      content: body.content,
      action: body.action,
    });
    return NextResponse.json({
      success: true,
      message: "AI content assistance completed.",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to assist content.",
      },
      {
        status: 400,
      },
    );
  }
}
