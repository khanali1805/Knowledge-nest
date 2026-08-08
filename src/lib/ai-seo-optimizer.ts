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
export function optimizeAISEO(request: SEOOptimizationRequest): SEOOptimizationResult {
  const keyword =
    request.focusKeyword?.trim() ||
    request.title.toLowerCase().split(" ").slice(0, 3).join(" ");
  const score = calculateScore(request.title, request.content);
  return {
    score,
    suggestedTitle: `${request.title} - Complete Guide`,
    metaTitle: `${request.title} | Knowledge Nest`,
    metaDescription: `Discover complete information about ${request.title} with expert insights, guides and useful knowledge.`,
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
