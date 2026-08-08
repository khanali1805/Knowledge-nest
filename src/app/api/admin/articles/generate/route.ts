import { NextResponse } from "next/server";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const requestSchema = z.object({
  prompt: z.string().trim().min(10).max(2_000),
  title: z.string().trim().max(255).optional().default(""),
  existingContent: z.string().trim().max(20_000).optional().default(""),
  focusKeyword: z.string().trim().max(255).optional().default(""),
});
const generatedArticleSchema = z.object({
  title: z.string().trim().min(3).max(255),
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(100),
  seoTitle: z.string().trim().min(3).max(60),
  seoDescription: z.string().trim().min(20).max(160),
  focusKeyword: z.string().trim().min(2).max(255),
});
type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};
function extractOutputText(response: OpenAiResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  for (const outputItem of response.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string" &&
        contentItem.text.trim()
      ) {
        return contentItem.text;
      }
    }
  }
  throw new Error(
    response.error?.message || "AI provider did not return article content.",
  );
}
export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          message: "OPENAI_API_KEY is not configured in .env.local.",
        },
        {
          status: 503,
        },
      );
    }
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "The AI request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const parsedRequest = requestSchema.safeParse(requestBody);
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          message: "Enter an AI instruction containing at least 10 characters.",
          errors: parsedRequest.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const input = parsedRequest.data;
    const model =
      process.env.OPENAI_ARTICLE_MODEL?.trim() ||
      process.env.OPENAI_THEME_MODEL?.trim() ||
      "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: [
          "You are the senior content editor for Knowledge Nest.",
          "Create original, useful and publication-ready website content.",
          "Use clear headings and readable paragraphs.",
          "Do not use markdown code fences.",
          "Return only data matching the supplied JSON schema.",
          "Keep the SEO title within 60 characters.",
          "Keep the SEO description within 160 characters.",
          "Keep the excerpt within 500 characters.",
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Instruction: ${input.prompt}`,
                  `Current title: ${input.title || "Not provided"}`,
                  `Current focus keyword: ${input.focusKeyword || "Not provided"}`,
                  input.existingContent
                    ? `Existing content to improve or continue:\n${input.existingContent}`
                    : "No existing article content is available.",
                ].join("\n\n"),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "knowledge_nest_article",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "title",
                "excerpt",
                "content",
                "seoTitle",
                "seoDescription",
                "focusKeyword",
              ],
              properties: {
                title: {
                  type: "string",
                  minLength: 3,
                  maxLength: 255,
                },
                excerpt: {
                  type: "string",
                  minLength: 20,
                  maxLength: 500,
                },
                content: {
                  type: "string",
                  minLength: 100,
                },
                seoTitle: {
                  type: "string",
                  minLength: 3,
                  maxLength: 60,
                },
                seoDescription: {
                  type: "string",
                  minLength: 20,
                  maxLength: 160,
                },
                focusKeyword: {
                  type: "string",
                  minLength: 2,
                  maxLength: 255,
                },
              },
            },
          },
        },
      }),
    });
    const responseData = (await response.json()) as OpenAiResponse;
    if (!response.ok) {
      throw new Error(
        responseData.error?.message ||
          `AI provider request failed with status ${response.status}.`,
      );
    }
    const outputText = extractOutputText(responseData);
    let generatedValue: unknown;
    try {
      generatedValue = JSON.parse(outputText);
    } catch {
      throw new Error("AI provider returned invalid article JSON.");
    }
    const parsedArticle = generatedArticleSchema.safeParse(generatedValue);
    if (!parsedArticle.success) {
      throw new Error("AI provider returned incomplete article content.");
    }
    return NextResponse.json({
      article: parsedArticle.data,
      message: "AI article content generated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to generate article content.",
      },
      {
        status: 500,
      },
    );
  }
}
