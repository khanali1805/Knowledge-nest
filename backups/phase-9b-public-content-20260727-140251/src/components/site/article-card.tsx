import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { PublicArticle } from "@/data/public-content";
type ArticleCardProps = {
  article: PublicArticle;
};
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="border-border bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-muted flex aspect-[16/9] items-center justify-center p-6">
        <span className="text-muted-foreground text-center text-sm font-semibold tracking-wider uppercase">
          {article.category.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/category/${article.category.slug}`}
          className="text-muted-foreground hover:text-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {article.category.name}
        </Link>
        <h2 className="mt-3 text-xl leading-snug font-bold">
          <Link href={`/article/${article.slug}`} className="hover:underline">
            {article.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
          {article.excerpt}
        </p>
        <div className="text-muted-foreground mt-5 flex items-center justify-between gap-3 text-xs">
          <span>
            {new Date(article.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTime}
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
