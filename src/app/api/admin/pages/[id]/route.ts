import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageUpdateSchema } from "@/lib/pages/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const pageIdSchema = z.uuid();
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
async function parsePageId(context: RouteContext) {
  const { id } = await context.params;
  return pageIdSchema.safeParse(id);
}
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
export async function GET(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parsePageId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid page ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, parsedId.data))
      .limit(1);
    if (!page) {
      return NextResponse.json(
        {
          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      page,
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to load the page.");
  }
}
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const parsedId = await parsePageId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid page ID is required.",
        },
        {
          status: 400,
        },
      );
    }
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
    const parsedInput = pageUpdateSchema.safeParse(requestBody);
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
    const [existingPage] = await db
      .select({
        id: pages.id,
        publishedAt: pages.publishedAt,
      })
      .from(pages)
      .where(eq(pages.id, parsedId.data))
      .limit(1);
    if (!existingPage) {
      return NextResponse.json(
        {
          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }
    const input = parsedInput.data;
    const now = new Date();
    const publishedAt =
      input.status === "published" && !existingPage.publishedAt
        ? now
        : input.status && input.status !== "published"
          ? null
          : existingPage.publishedAt;
    const [updatedPage] = await db
      .update(pages)
      .set({
        ...input,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(pages.id, parsedId.data))
      .returning();
    if (!updatedPage) {
      throw new Error("The page was not updated.");
    }
    return NextResponse.json({
      page: updatedPage,
      message:
        updatedPage.status === "published"
          ? "Page published successfully."
          : "Draft saved successfully.",
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to update the page.");
  }
}
export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parsePageId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid page ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [deletedPage] = await db
      .delete(pages)
      .where(eq(pages.id, parsedId.data))
      .returning({
        id: pages.id,
      });
    if (!deletedPage) {
      return NextResponse.json(
        {
          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      message: "Page deleted successfully.",
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to delete the page.");
  }
}
