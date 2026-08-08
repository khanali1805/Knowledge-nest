export type ContentQualityRequest = {
  title: string;
  content: string;
};
export type ContentQualityResult = {
  score: number;
  readabilityScore: number;
  structureScore: number;
  engagementScore: number;
  suggestions: string[];
};
function calculateLengthScore(content: string) {
  if (content.length >= 1000) {
    return 90;
  }
  if (content.length >= 500) {
    return 75;
  }
  return 50;
}
function calculateStructureScore(content: string) {
  let score = 50;
  if (content.includes("##")) {
    score += 20;
  }
  if (content.includes("-")) {
    score += 15;
  }
  return Math.min(score, 100);
}
export function analyzeContentQuality(
  request: ContentQualityRequest,
): ContentQualityResult {
  const readabilityScore = calculateLengthScore(request.content);
  const structureScore = calculateStructureScore(request.content);
  const engagementScore = request.title.length > 20 ? 80 : 60;
  const score = Math.round((readabilityScore + structureScore + engagementScore) / 3);
  return {
    score,
    readabilityScore,
    structureScore,
    engagementScore,
    suggestions: [
      "Improve article introduction",
      "Add more detailed sections",
      "Use clearer headings",
      "Increase reader engagement",
    ],
  };
}
