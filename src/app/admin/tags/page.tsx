import { eq, sql } from "drizzle-orm";
import {
  TaxonomyManager,
  type TaxonomyItem,
} from "@/components/admin/taxonomy/taxonomy-manager";
import { db } from "@/db";
import { articleTags, tags } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function TagsPage() {
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
    .orderBy(tags.name);
  const initialItems: TaxonomyItem[] = tagRows;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tags</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Add supporting labels for article discovery and organization.
        </p>
      </div>
      <TaxonomyManager type="tag" initialItems={initialItems} />
    </div>
  );
}
