import { NextResponse } from "next/server";
import { publicArticles } from "@/data/public-content";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (!query) {
    return NextResponse.json([]);
  }
  const results = publicArticles
    .filter((article) => {
      const text = [article.title, article.excerpt, article.category.name]
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    })
    .slice(0, 10)
    .map((article) => ({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category.name,
    }));
  return NextResponse.json(results);
}
