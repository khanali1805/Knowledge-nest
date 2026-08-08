import { NextRequest, NextResponse } from "next/server";
import { analyzeContentQuality } from "@/lib/ai-content-quality-analyzer";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
    };
    if (!body.title || !body.content) {
      throw new Error("Title and content are required.");
    }
    const result = analyzeContentQuality({
      title: body.title,
      content: body.content,
    });
    return NextResponse.json({
      success: true,
      message: "Content quality analysis completed.",
      quality: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to analyze content quality.",
      },
      {
        status: 400,
      },
    );
  }
}
