import { desc } from "drizzle-orm";
import { PagesManager, type WebsitePage } from "@/components/admin/pages/pages-manager";
import { db } from "@/db";
import { pages } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function PagesPage() {
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
  const initialPages: WebsitePage[] = pageRows;
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pages</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage permanent website information and policy pages.
        </p>
      </div>
      <PagesManager initialPages={initialPages} />
    </div>
  );
}
