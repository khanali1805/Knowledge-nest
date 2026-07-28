import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articleTags, tags } from "@/db/schema";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const tagInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().default(""),
});
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to process tag.";
  const normalizedMessage = message.toLowerCase();
  const status =
    normalizedMessage.includes("unique") || normalizedMessage.includes("duplicate")
      ? 409
      : 500;
  return NextResponse.json(
    {
      message: status === 409 ? "A tag with this slug already exists." : message,
    },
    {
      status,
    },
  );
}
export async function GET() {
  try {
    const tagRows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        articleCount: sql<number>`count(${articleTags.articleId})::int`,
      })
      .from(tags)
      .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
      .groupBy(tags.id, tags.name, tags.slug, tags.description)
      .orderBy(asc(tags.name));
    return NextResponse.json({
      tags: tagRows,
      count: tagRows.length,
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
          message: "The tag request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = tagInputSchema.safeParse(requestBody);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          message: "Tag validation failed.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const [createdTag] = await db
      .insert(tags)
      .values({
        name: parsedInput.data.name,
        slug: parsedInput.data.slug,
        description: parsedInput.data.description || null,
      })
      .returning();
    return NextResponse.json(
      {
        tag: {
          ...createdTag,
          articleCount: 0,
        },
        message: "Tag created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
