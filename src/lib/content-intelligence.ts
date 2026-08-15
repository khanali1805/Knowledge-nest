export type ContentIntelligenceArticle = {
  id: string;
  slug?: string | null;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  focusKeyword?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  tags?: readonly string[];
  isFeatured?: boolean;
  viewCount?: number;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};
export type ContentRelevanceReason =
  | "same-category"
  | "shared-focus-keyword"
  | "shared-topic"
  | "shared-tag"
  | "title-overlap"
  | "excerpt-overlap"
  | "featured"
  | "popular"
  | "recent";
export type ContentRelevanceResult<T extends ContentIntelligenceArticle> = {
  article: T;
  score: number;
  reasons: ContentRelevanceReason[];
};
export type TopicCluster = {
  key: string;
  label: string;
  articleIds: string[];
  articleCount: number;
};
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "can",
  "do",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "more",
  "most",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);
function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function normalizeTopic(value: string | null | undefined): string {
  return normalizeText(value);
}
function tokenize(value: string | null | undefined): Set<string> {
  const normalized = normalizeText(value);
  if (!normalized) {
    return new Set();
  }
  return new Set(
    normalized
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}
function intersectionSize(left: Set<string>, right: Set<string>): number {
  let matches = 0;
  for (const token of left) {
    if (right.has(token)) {
      matches += 1;
    }
  }
  return matches;
}
function getArticleTopicTokens(article: ContentIntelligenceArticle): Set<string> {
  return tokenize(
    [
      article.title,
      article.focusKeyword ?? "",
      article.categoryName ?? "",
      ...(article.tags ?? []),
    ].join(" "),
  );
}
function hasSharedTag(
  source: ContentIntelligenceArticle,
  candidate: ContentIntelligenceArticle,
): boolean {
  const sourceTags = new Set((source.tags ?? []).map(normalizeTopic).filter(Boolean));
  if (sourceTags.size === 0) {
    return false;
  }
  return (candidate.tags ?? []).some((tag) => sourceTags.has(normalizeTopic(tag)));
}
function sameFocusKeyword(
  source: ContentIntelligenceArticle,
  candidate: ContentIntelligenceArticle,
): boolean {
  const sourceKeyword = normalizeTopic(source.focusKeyword);
  const candidateKeyword = normalizeTopic(candidate.focusKeyword);
  return Boolean(sourceKeyword && candidateKeyword && sourceKeyword === candidateKeyword);
}
function calculateRecencyScore(article: ContentIntelligenceArticle): number {
  const date = article.publishedAt ?? article.updatedAt;
  if (!date) {
    return 0;
  }
  const age = Date.now() - date.getTime();
  if (age < 0) {
    return 0;
  }
  const days = age / 86_400_000;
  if (days <= 30) {
    return 2;
  }
  if (days <= 180) {
    return 1;
  }
  return 0;
}
export function scoreContentRelevance<T extends ContentIntelligenceArticle>(
  source: T,
  candidate: T,
): ContentRelevanceResult<T> {
  if (source.id === candidate.id) {
    return {
      article: candidate,
      score: Number.NEGATIVE_INFINITY,
      reasons: [],
    };
  }
  let score = 0;
  const reasons: ContentRelevanceReason[] = [];
  if (
    source.categoryId &&
    candidate.categoryId &&
    source.categoryId === candidate.categoryId
  ) {
    score += 12;
    reasons.push("same-category");
  }
  if (sameFocusKeyword(source, candidate)) {
    score += 14;
    reasons.push("shared-focus-keyword");
  }
  if (hasSharedTag(source, candidate)) {
    score += 10;
    reasons.push("shared-tag");
  }
  const sourceTopics = getArticleTopicTokens(source);
  const candidateTopics = getArticleTopicTokens(candidate);
  const topicOverlap = intersectionSize(sourceTopics, candidateTopics);
  if (topicOverlap > 0) {
    score += Math.min(topicOverlap * 3, 12);
    reasons.push("shared-topic");
  }
  const titleOverlap = intersectionSize(
    tokenize(source.title),
    tokenize(candidate.title),
  );
  if (titleOverlap > 0) {
    score += Math.min(titleOverlap * 3, 9);
    reasons.push("title-overlap");
  }
  const excerptOverlap = intersectionSize(
    tokenize(source.excerpt),
    tokenize(candidate.excerpt),
  );
  if (excerptOverlap > 0) {
    score += Math.min(excerptOverlap, 4);
    reasons.push("excerpt-overlap");
  }
  if (candidate.isFeatured) {
    score += 2;
    reasons.push("featured");
  }
  if ((candidate.viewCount ?? 0) > 0) {
    score += Math.min(Math.log10((candidate.viewCount ?? 0) + 1), 3);
    reasons.push("popular");
  }
  const recencyScore = calculateRecencyScore(candidate);
  if (recencyScore > 0) {
    score += recencyScore;
    reasons.push("recent");
  }
  return {
    article: candidate,
    score,
    reasons,
  };
}
export function rankRelatedContent<T extends ContentIntelligenceArticle>(
  source: T,
  candidates: readonly T[],
  limit = 3,
): ContentRelevanceResult<T>[] {
  const safeLimit = Math.max(0, Math.min(Math.trunc(limit), 24));
  if (safeLimit === 0) {
    return [];
  }
  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => scoreContentRelevance(source, candidate))
    .filter((result) => Number.isFinite(result.score))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const rightViews = right.article.viewCount ?? 0;
      const leftViews = left.article.viewCount ?? 0;
      if (rightViews !== leftViews) {
        return rightViews - leftViews;
      }
      const rightDate =
        right.article.publishedAt?.getTime() ?? right.article.updatedAt?.getTime() ?? 0;
      const leftDate =
        left.article.publishedAt?.getTime() ?? left.article.updatedAt?.getTime() ?? 0;
      return rightDate - leftDate;
    })
    .slice(0, safeLimit);
}
export function buildTopicClusters<T extends ContentIntelligenceArticle>(
  articles: readonly T[],
  limit = 8,
): TopicCluster[] {
  const clusterMap = new Map<
    string,
    {
      label: string;
      articleIds: Set<string>;
    }
  >();
  for (const article of articles) {
    const candidates = [...(article.tags ?? []), article.focusKeyword ?? ""];
    for (const candidate of candidates) {
      const key = normalizeTopic(candidate);
      if (!key || key.length < 3) {
        continue;
      }
      const existing = clusterMap.get(key);
      if (existing) {
        existing.articleIds.add(article.id);
        continue;
      }
      clusterMap.set(key, {
        label: candidate.trim(),
        articleIds: new Set([article.id]),
      });
    }
  }
  return Array.from(clusterMap.entries())
    .map(([key, cluster]) => ({
      key,
      label: cluster.label,
      articleIds: Array.from(cluster.articleIds),
      articleCount: cluster.articleIds.size,
    }))
    .filter((cluster) => cluster.articleCount > 0)
    .sort((left, right) => {
      if (right.articleCount !== left.articleCount) {
        return right.articleCount - left.articleCount;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, Math.max(0, Math.min(Math.trunc(limit), 24)));
}
export function selectPillarArticles<T extends ContentIntelligenceArticle>(
  articles: readonly T[],
  limit = 3,
): T[] {
  const safeLimit = Math.max(0, Math.min(Math.trunc(limit), 12));
  return [...articles]
    .sort((left, right) => {
      if (Boolean(right.isFeatured) !== Boolean(left.isFeatured)) {
        return Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
      }
      const viewDifference = (right.viewCount ?? 0) - (left.viewCount ?? 0);
      if (viewDifference !== 0) {
        return viewDifference;
      }
      const rightDate = right.publishedAt?.getTime() ?? right.updatedAt?.getTime() ?? 0;
      const leftDate = left.publishedAt?.getTime() ?? left.updatedAt?.getTime() ?? 0;
      return rightDate - leftDate;
    })
    .slice(0, safeLimit);
}
export type ContextualInternalLink<T extends ContentIntelligenceArticle> = {
  article: T;
  href: string;
  anchorText: string;
  score: number;
  reasons: ContentRelevanceReason[];
};
export type ContentGraphNode = {
  id: string;
  slug: string | null;
  title: string;
  categoryId: string | null;
  categorySlug: string | null;
};
export type ContentGraphEdge = {
  sourceId: string;
  targetId: string;
  score: number;
  reasons: ContentRelevanceReason[];
};
export type ContentGraph = {
  nodes: ContentGraphNode[];
  edges: ContentGraphEdge[];
};
export function buildContextualInternalLinks<T extends ContentIntelligenceArticle>(
  source: T,
  candidates: readonly T[],
  limit = 5,
): ContextualInternalLink<T>[] {
  const safeLimit = Math.max(0, Math.min(Math.trunc(limit), 12));
  if (safeLimit === 0) {
    return [];
  }
  return rankRelatedContent(source, candidates, safeLimit * 2)
    .filter((result) => {
      const slug = result.article.slug?.trim();
      return Boolean(slug && result.score > 0);
    })
    .map((result) => ({
      article: result.article,
      href: `/article/${result.article.slug!.trim()}`,
      anchorText: result.article.title.trim(),
      score: result.score,
      reasons: result.reasons,
    }))
    .filter(
      (link, index, links) =>
        links.findIndex((candidate) => candidate.href === link.href) === index,
    )
    .slice(0, safeLimit);
}
export function buildContentGraph<T extends ContentIntelligenceArticle>(
  articles: readonly T[],
  linksPerArticle = 5,
): ContentGraph {
  const safeLinksPerArticle = Math.max(0, Math.min(Math.trunc(linksPerArticle), 12));
  const nodes: ContentGraphNode[] = articles.map((article) => ({
    id: article.id,
    slug: article.slug?.trim() || null,
    title: article.title,
    categoryId: article.categoryId ?? null,
    categorySlug: article.categorySlug ?? null,
  }));
  if (safeLinksPerArticle === 0) {
    return {
      nodes,
      edges: [],
    };
  }
  const edges: ContentGraphEdge[] = [];
  for (const article of articles) {
    const related = rankRelatedContent(article, articles, safeLinksPerArticle);
    for (const result of related) {
      if (
        !Number.isFinite(result.score) ||
        result.score <= 0 ||
        result.article.id === article.id
      ) {
        continue;
      }
      edges.push({
        sourceId: article.id,
        targetId: result.article.id,
        score: result.score,
        reasons: result.reasons,
      });
    }
  }
  return {
    nodes,
    edges,
  };
}
