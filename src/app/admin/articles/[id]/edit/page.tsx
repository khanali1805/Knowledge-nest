import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { db } from "@/db";
import { articles, articleTags, tags } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      content: articles.content,
      categoryId: articles.categoryId,
      status: articles.status,
      isFeatured: articles.isFeatured,
      seoTitle: articles.seoTitle,
      seoDescription: articles.seoDescription,
      focusKeyword: articles.focusKeyword,
      featuredImageId: articles.featuredImageId,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (!article) {
    notFound();
  }
  const articleTagRows = await db
    .select({
      name: tags.name,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, id))
    .orderBy(asc(tags.name));
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.18em] text-slate-500 uppercase">
          Articles
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Edit Article
        </h1>
      </div>
      <ArticleEditorForm
        mode="edit"
        initialArticle={{
          ...article,
          tags: articleTagRows.map((tag) => tag.name),
        }}
      />
    </main>
  );
}
