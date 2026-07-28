import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articleTags, tags } from "@/db/schema";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const tagIdSchema = z.uuid();
const tagUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().default(""),
});
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
async function parseTagId(context: RouteContext) {
  const { id } = await context.params;
  return tagIdSchema.safeParse(id);
}
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
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const parsedId = await parseTagId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid tag ID is required.",
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
          message: "The tag request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedInput = tagUpdateSchema.safeParse(requestBody);
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
    const [updatedTag] = await db
      .update(tags)
      .set({
        name: parsedInput.data.name,
        slug: parsedInput.data.slug,
        description: parsedInput.data.description || null,
      })
      .where(eq(tags.id, parsedId.data))
      .returning();
    if (!updatedTag) {
      return NextResponse.json(
        {
          message: "Tag not found.",
        },
        {
          status: 404,
        },
      );
    }
    const [articleCountResult] = await db
      .select({
        articleCount: sql<number>`count(${articleTags.articleId})::int`,
      })
      .from(articleTags)
      .where(eq(articleTags.tagId, parsedId.data));
    return NextResponse.json({
      tag: {
        ...updatedTag,
        articleCount: articleCountResult?.articleCount ?? 0,
      },
      message: "Tag updated successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parseTagId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid tag ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [articleCountResult] = await db
      .select({
        articleCount: sql<number>`count(${articleTags.articleId})::int`,
      })
      .from(articleTags)
      .where(eq(articleTags.tagId, parsedId.data));
    if ((articleCountResult?.articleCount ?? 0) > 0) {
      return NextResponse.json(
        {
          message: "This tag cannot be deleted because articles are assigned to it.",
        },
        {
          status: 409,
        },
      );
    }
    const [deletedTag] = await db
      .delete(tags)
      .where(eq(tags.id, parsedId.data))
      .returning({
        id: tags.id,
      });
    if (!deletedTag) {
      return NextResponse.json(
        {
          message: "Tag not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      message: "Tag deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
