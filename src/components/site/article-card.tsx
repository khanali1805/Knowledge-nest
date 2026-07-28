import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import {
  createContentSlug,
  getArticleExcerpt,
  type PublishedArticleRecord,
} from "@/lib/queries/article-queries";
type ArticleCardProps = {
  article: PublishedArticleRecord;
};
export function ArticleCard({ article }: ArticleCardProps) {
  const categoryName = article.categoryName ?? "Uncategorised";
  const categorySlug = article.categorySlug ?? createContentSlug(categoryName);
  const publishedDate = article.publishedAt ?? article.updatedAt;
  return (
    <article className="border-border bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-muted relative flex aspect-[16/9] items-center justify-center overflow-hidden p-6">
        {article.featuredImageUrl ? (
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground text-center text-sm font-semibold tracking-wider uppercase">
            {categoryName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/category/${categorySlug}`}
          className="text-muted-foreground hover:text-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {categoryName}
        </Link>
        <h2 className="mt-3 text-xl leading-snug font-bold">
          <Link href={`/article/${article.slug}`} className="hover:underline">
            {article.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
          {getArticleExcerpt(article)}
        </p>
        <div className="text-muted-foreground mt-5 flex items-center justify-between gap-3 text-xs">
          <span>
            {publishedDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTimeMinutes} min read
          </span>
        </div>
        <Link
          href={`/article/${article.slug}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
        >
          Read Article
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
