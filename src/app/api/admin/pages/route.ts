import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageInputSchema } from "@/lib/pages/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function createErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalizedMessage = message.toLowerCase();
  const status =
    normalizedMessage.includes("unique") || normalizedMessage.includes("duplicate")
      ? 409
      : 500;
  return NextResponse.json(
    {
      message: status === 409 ? "A page with this URL slug already exists." : message,
    },
    {
      status,
    },
  );
}
export async function GET() {
  try {
    const pageRows = await db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        status: pages.status,
        publishedAt: pages.publishedAt,
        createdAt: pages.createdAt,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .orderBy(desc(pages.updatedAt));
    return NextResponse.json({
      pages: pageRows,
      count: pageRows.length,
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to load pages.");
  }
}
export async function POST(request: Request) {
  try {
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "The page request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = pageInputSchema.safeParse(requestBody);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          message: "Page validation failed.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const input = parsedInput.data;
    const now = new Date();
    const [createdPage] = await db
      .insert(pages)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        status: input.status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        publishedAt: input.status === "published" ? now : null,
        updatedAt: now,
      })
      .returning();
    if (!createdPage) {
      throw new Error("The page was not created.");
    }
    return NextResponse.json(
      {
        page: createdPage,
        message:
          createdPage.status === "published"
            ? "Page published successfully."
            : "Draft saved successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return createErrorResponse(error, "Unable to create the page.");
  }
}
