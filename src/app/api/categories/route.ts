import { NextResponse } from "next/server";
import { getPublishedCategories } from "@/lib/queries/article-queries";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const categories = await getPublishedCategories();
    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("Failed to load published categories:", error);
    return NextResponse.json(
      {
        categories: [],
      },
      {
        status: 500,
      },
    );
  }
}
