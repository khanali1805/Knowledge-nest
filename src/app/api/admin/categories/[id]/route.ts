import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const categoryIdSchema = z.uuid();
const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().default(""),
});
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
async function parseCategoryId(context: RouteContext) {
  const { id } = await context.params;
  return categoryIdSchema.safeParse(id);
}
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to process category.";
  const normalizedMessage = message.toLowerCase();
  const status =
    normalizedMessage.includes("unique") || normalizedMessage.includes("duplicate")
      ? 409
      : 500;
  return NextResponse.json(
    {
      message: status === 409 ? "A category with this slug already exists." : message,
    },
    {
      status,
    },
  );
}
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const parsedId = await parseCategoryId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid category ID is required.",
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
          message: "The category request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = categoryUpdateSchema.safeParse(requestBody);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          message: "Category validation failed.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: parsedInput.data.name,
        slug: parsedInput.data.slug,
        description: parsedInput.data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, parsedId.data))
      .returning();
    if (!updatedCategory) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }
    const [articleCountResult] = await db
      .select({
        articleCount: sql<number>`count(${articles.id})::int`,
      })
      .from(articles)
      .where(eq(articles.categoryId, parsedId.data));
    return NextResponse.json({
      category: {
        ...updatedCategory,
        articleCount: articleCountResult?.articleCount ?? 0,
      },
      message: "Category updated successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parseCategoryId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid category ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [articleCountResult] = await db
      .select({
        articleCount: sql<number>`count(${articles.id})::int`,
      })
      .from(articles)
      .where(eq(articles.categoryId, parsedId.data));
    if ((articleCountResult?.articleCount ?? 0) > 0) {
      return NextResponse.json(
        {
          message: "This category cannot be deleted because articles are assigned to it.",
        },
        {
          status: 409,
        },
      );
    }
    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.id, parsedId.data))
      .returning({
        id: categories.id,
      });
    if (!deletedCategory) {
      return NextResponse.json(
        {
          message: "Category not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
