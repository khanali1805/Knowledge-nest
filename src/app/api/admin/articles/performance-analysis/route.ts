import { NextRequest, NextResponse } from "next/server";
import { analyzeContentPerformance } from "@/lib/ai-content-performance-analyzer";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      views?: number;
      comments?: number;
      shares?: number;
    };
    if (!body.title || !body.content) {
      throw new Error("Title and content are required.");
    }
    const result = analyzeContentPerformance({
      title: body.title,
      content: body.content,
      views: body.views || 0,
      comments: body.comments || 0,
      shares: body.shares || 0,
    });
    return NextResponse.json({
      success: true,
      message: "Content performance analysis completed.",
      performance: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to analyze performance.",
      },
      {
        status: 400,
      },
    );
  }
}
