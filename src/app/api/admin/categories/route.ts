import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().default(""),
});
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
export async function GET() {
  try {
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        articleCount: sql<number>`count(${articles.id})::int`,
      })
      .from(categories)
      .leftJoin(articles, eq(articles.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug, categories.description)
      .orderBy(asc(categories.name));
    return NextResponse.json({
      categories: categoryRows,
      count: categoryRows.length,
    });
  } catch (error) {
    return errorResponse(error);
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
          message: "The category request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = categoryInputSchema.safeParse(requestBody);
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
    const [createdCategory] = await db
      .insert(categories)
      .values({
        name: parsedInput.data.name,
        slug: parsedInput.data.slug,
        description: parsedInput.data.description || null,
      })
      .returning();
    return NextResponse.json(
      {
        category: {
          ...createdCategory,
          articleCount: 0,
        },
        message: "Category created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
