export type ContentPerformanceRequest = {
  title: string;
  content: string;
  views?: number;
  comments?: number;
  shares?: number;
};
export type ContentPerformanceResult = {
  performanceScore: number;
  engagementScore: number;
  readabilityScore: number;
  recommendations: string[];
};
function calculateEngagement(views: number, comments: number, shares: number) {
  let score = 50;
  if (views > 1000) {
    score += 20;
  }
  if (comments > 50) {
    score += 15;
  }
  if (shares > 20) {
    score += 15;
  }
  return Math.min(score, 100);
}
function calculateReadability(content: string) {
  if (content.length >= 1000) {
    return 90;
  }
  if (content.length >= 500) {
    return 75;
  }
  return 60;
}
export function analyzeContentPerformance(
  request: ContentPerformanceRequest,
): ContentPerformanceResult {
  const engagementScore = calculateEngagement(
    request.views || 0,
    request.comments || 0,
    request.shares || 0,
  );
  const readabilityScore = calculateReadability(request.content);
  const performanceScore = Math.round((engagementScore + readabilityScore) / 2);
  return {
    performanceScore,
    engagementScore,
    readabilityScore,
    recommendations: [
      "Improve audience engagement",
      "Add stronger content hooks",
      "Increase article depth",
      "Optimize reader interaction",
    ],
  };
}
