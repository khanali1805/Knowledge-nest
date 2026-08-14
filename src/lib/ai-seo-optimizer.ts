export type SEOOptimizationRequest = {
  title: string;
  content: string;
  focusKeyword?: string;
  category?: string;
};
export type SEOOptimizationResult = {
  score: number;
  suggestedTitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  improvements: string[];
};
function calculateScore(title: string, content: string) {
  let score = 50;
  if (title.length >= 30) {
    score += 15;
  }
  if (content.length >= 500) {
    score += 20;
  }
  if (content.includes("##")) {
    score += 10;
  }
  return Math.min(score, 100);
}
function cleanSeoEnding(value: string): string {
  return value
    .replace(/[,:;.!?-]+$/g, "")
    .replace(/\b(?:and|or|with|for|to|of|the|a|an|in|on|at|by)$/i, "")
    .replace(/[,:;.!?-]+$/g, "")
    .trim();
}

function fitSeoText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  const candidate = normalized.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxLength * 0.7)) {
    return cleanSeoEnding(candidate.slice(0, lastSpace));
  }
  return cleanSeoEnding(normalized.slice(0, maxLength));
}
export function optimizeAISEO(request: SEOOptimizationRequest): SEOOptimizationResult {
  const keyword =
    request.focusKeyword?.trim() ||
    request.title.toLowerCase().split(" ").slice(0, 3).join(" ");
  const score = calculateScore(request.title, request.content);
  const cleanTitle = request.title.replace(/\s+/g, " ").trim();
  const metaTitle = fitSeoText(`${cleanTitle}: Complete Guide`, 60);
  const metaDescription = fitSeoText(
    `Explore ${cleanTitle} with practical tips, useful guidance, expert insights and clear steps designed to help you make informed decisions with confidence.`,
    160,
  );
  return {
    score,
    suggestedTitle: `${request.title} - Complete Guide`,
    metaTitle,
    metaDescription,
    keywords: [
      keyword,
      request.category || "",
      "knowledge",
      "guide",
      "latest information",
    ].filter(Boolean),
    improvements: [
      "Improve keyword placement",
      "Add more detailed sections",
      "Increase content depth",
      "Optimize headings",
    ],
  };
}
