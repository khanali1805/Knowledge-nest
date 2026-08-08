import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createActivityCsv,
  createActivityJson,
  createSafeExportFilename,
} from "@/lib/article-activity-export";
import { filterArticleActivities } from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const exportInputSchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  actions: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  usernames: z.array(z.string().trim().min(1).max(150)).max(50).optional(),
  search: z.string().trim().max(300).optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
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
    const parsedInput = exportInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Audit export filters valid nahi hain.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const { id } = await context.params;
    const exportResult = await filterArticleActivities({
      articleId: id,
      filters: {
        actions: parsedInput.data.actions,
        usernames: parsedInput.data.usernames,
        search: parsedInput.data.search,
        dateFrom: parsedInput.data.dateFrom
          ? new Date(parsedInput.data.dateFrom)
          : undefined,
        dateTo: parsedInput.data.dateTo ? new Date(parsedInput.data.dateTo) : undefined,
        limit: 100,
        offset: 0,
        sortDirection: parsedInput.data.sortDirection,
      },
    });
    const allActivities = [...exportResult.activities];
    let nextOffset = exportResult.offset + exportResult.activities.length;
    while (nextOffset < exportResult.total) {
      const nextPage = await filterArticleActivities({
        articleId: id,
        filters: {
          actions: parsedInput.data.actions,
          usernames: parsedInput.data.usernames,
          search: parsedInput.data.search,
          dateFrom: parsedInput.data.dateFrom
            ? new Date(parsedInput.data.dateFrom)
            : undefined,
          dateTo: parsedInput.data.dateTo ? new Date(parsedInput.data.dateTo) : undefined,
          limit: 100,
          offset: nextOffset,
          sortDirection: parsedInput.data.sortDirection,
        },
      });
      allActivities.push(...nextPage.activities);
      if (nextPage.activities.length === 0) {
        break;
      }
      nextOffset += nextPage.activities.length;
    }
    const format = parsedInput.data.format;
    const filename = createSafeExportFilename({
      articleId: id,
      format,
    });
    const content =
      format === "json"
        ? createActivityJson(allActivities)
        : createActivityCsv(allActivities);
    const contentType =
      format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Audit export create nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
