import { ArticleEditor } from "@/components/admin/articles/article-editor";
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  return <ArticleEditor mode="edit" articleId={id} />;
}
