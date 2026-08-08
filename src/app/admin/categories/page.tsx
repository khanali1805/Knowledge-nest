import { eq, sql } from "drizzle-orm";
import {
  TaxonomyManager,
  type TaxonomyItem,
} from "@/components/admin/taxonomy/taxonomy-manager";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
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
    .orderBy(categories.name);
  const initialItems: TaxonomyItem[] = categoryRows;
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Organize articles into primary website sections.
        </p>
      </div>
      <TaxonomyManager type="category" initialItems={initialItems} />
    </div>
  );
}
