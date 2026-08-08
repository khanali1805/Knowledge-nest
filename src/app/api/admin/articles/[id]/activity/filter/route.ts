import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  filterArticleActivities,
  getArticleActivityFilterOptions,
} from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const filterInputSchema = z.object({
  actions: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  usernames: z.array(z.string().trim().min(1).max(150)).max(50).optional(),
  search: z.string().trim().max(300).optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});
export async function GET(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Admin authentication required.",
      },
      {
        status: 401,
      },
    );
  }
  const { id } = await context.params;
  const options = await getArticleActivityFilterOptions(id);
  return NextResponse.json({
    success: true,
    options,
  });
}
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin authentication required.",
        },
        {
          status: 401,
        },
      );
    }
    const body: unknown = await request.json();
    const parsedInput = filterInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity filter data valid nahi hai.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const { id } = await context.params;
    const result = await filterArticleActivities({
      articleId: id,
      filters: {
        actions: parsedInput.data.actions,
        usernames: parsedInput.data.usernames,
        search: parsedInput.data.search,
        dateFrom: parsedInput.data.dateFrom
          ? new Date(parsedInput.data.dateFrom)
          : undefined,
        dateTo: parsedInput.data.dateTo ? new Date(parsedInput.data.dateTo) : undefined,
        limit: parsedInput.data.limit,
        offset: parsedInput.data.offset,
        sortDirection: parsedInput.data.sortDirection,
      },
    });
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Activity filters apply nahi hue.",
      },
      {
        status: 500,
      },
    );
  }
}
