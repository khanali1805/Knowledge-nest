import { type NextRequest, NextResponse } from "next/server";
import {
  applyArticleSaveAction,
  hasArticleErrors,
  type ArticleEditorData,
  type ArticleSaveAction,
  validateArticleData,
} from "@/lib/article-publishing-workflow";
import {
  findArticleById,
  findArticleBySlug,
  saveArticleToStore,
} from "@/lib/article-store";
import { revalidateArticlePublishingPaths } from "@/lib/article-publication-cache";
export const dynamic = "force-dynamic";
type SaveArticleRequest = {
  action?: ArticleSaveAction;
  article?: Partial<ArticleEditorData>;
};
function isValidAction(value: unknown): value is ArticleSaveAction {
  return value === "save-draft" || value === "publish" || value === "update";
}
export async function POST(request: NextRequest) {
  let body: SaveArticleRequest;
  try {
    body = (await request.json()) as SaveArticleRequest;
  } catch {
    // PHASE_10_ARTICLE_REVALIDATION
    revalidateArticlePublishingPaths();

    return NextResponse.json(
      {
        success: false,
        message: "Invalid article request.",
      },
      {
        status: 400,
      },
    );
  }
  const action = isValidAction(body.action) ? body.action : "save-draft";
  const input = body.article ?? {};
  const existingArticle = input.id ? await findArticleById(input.id) : null;
  const errors = validateArticleData(input, action);
  if (hasArticleErrors(errors)) {
    // PHASE_10_ARTICLE_REVALIDATION
    revalidateArticlePublishingPaths();

    return NextResponse.json(
      {
        success: false,
        message: "Please correct the article form.",
        errors,
      },
      {
        status: 422,
      },
    );
  }
  const preparedArticle = applyArticleSaveAction(
    {
      ...existingArticle,
      ...input,
    },
    action,
    existingArticle?.status,
  );
  const slugOwner = await findArticleBySlug(preparedArticle.slug);
  if (slugOwner && slugOwner.id !== preparedArticle.id) {
    // PHASE_10_ARTICLE_REVALIDATION
    revalidateArticlePublishingPaths();

    return NextResponse.json(
      {
        success: false,
        message: "An article with this slug already exists.",
        errors: {
          slug: "Use a unique article slug.",
        },
      },
      {
        status: 409,
      },
    );
  }
  const savedArticle = await saveArticleToStore(preparedArticle);
  // PHASE_10_ARTICLE_REVALIDATION
  revalidateArticlePublishingPaths();

  return NextResponse.json({
    success: true,
    message:
      savedArticle.status === "published"
        ? "Article published successfully."
        : "Article draft saved successfully.",
    article: savedArticle,
  });
}
