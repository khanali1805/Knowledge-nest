export type ContentAssistantRequest = {
  title: string;
  content: string;
  action: "rewrite" | "improve" | "expand" | "simplify";
};
export type ContentAssistantResult = {
  title: string;
  content: string;
  suggestions: string[];
};
export function assistAIContent(
  request: ContentAssistantRequest,
): ContentAssistantResult {
  let content = request.content;
  if (request.action === "expand") {
    content +=
      "\n\n## Additional Insights\n\nMore detailed information can improve reader understanding.";
  }
  if (request.action === "improve") {
    content = `Improved Version:\n\n${content}`;
  }
  if (request.action === "simplify") {
    content = content.replace(/\b(important|significant)\b/gi, "key");
  }
  return {
    title: request.title,
    content,
    suggestions: [
      "Improve article flow",
      "Add stronger introduction",
      "Use clearer explanations",
      "Increase reader engagement",
    ],
  };
}
