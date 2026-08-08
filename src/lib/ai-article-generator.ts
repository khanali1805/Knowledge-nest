import "server-only";
export type AIArticleGenerationRequest = {
  topic: string;
  categorySlug: string;
  categoryName: string;
  focusKeyword?: string;
  instructions?: string;
};
export type AIArticleGenerationResult = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
};
export type AIArticleProvider = "openai" | "gemini" | "claude" | "deepseek" | "grok";
export type AIArticleDraft = {
  id: string;
  provider: AIArticleProvider;
  providerLabel: string;
  model: string;
  article: AIArticleGenerationResult;
};
export type AIArticleFailure = {
  provider: AIArticleProvider;
  providerLabel: string;
  model: string;
  message: string;
  attemptedAt: string;
  durationMs: number;
};
export type AIArticleProviderAttempt = {
  provider: AIArticleProvider;
  providerLabel: string;
  model: string;
  status: "success" | "failed" | "skipped";
  message: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
};
export type MultiAIArticleGenerationResult = {
  drafts: AIArticleDraft[];
  failures: AIArticleFailure[];
  attempts: AIArticleProviderAttempt[];
  configuredProviders: AIArticleProvider[];
  successfulProvider: AIArticleProvider | null;
  manualFallbackRequired: boolean;
};
type ProviderDefinition = {
  id: AIArticleProvider;
  label: string;
  apiKey?: string;
  model: string;
  generate: (
    request: AIArticleGenerationRequest,
    apiKey: string,
    model: string,
  ) => Promise<AIArticleGenerationResult>;
};
const REQUEST_TIMEOUT_MS = 120_000;
function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function createPrompt(request: AIArticleGenerationRequest): string {
  const keyword = request.focusKeyword?.trim() || request.topic.trim();
  return `
Create a complete, original, publication-ready blog article.
Topic: ${request.topic}
Category: ${request.categoryName}
Category slug: ${request.categorySlug}
Focus keyword: ${keyword}
Additional instructions: ${
    request.instructions?.trim() ||
    "Write a useful, detailed and reader-friendly article."
  }
Return only one valid JSON object with exactly these fields:
{
  "title": "SEO-friendly article title",
  "slug": "lowercase-url-slug",
  "excerpt": "150 to 220 character summary",
  "content": "Complete Markdown article with introduction, multiple useful H2 and H3 sections, practical details, conclusion and FAQ section",
  "focusKeyword": "${keyword}",
  "metaTitle": "SEO title no longer than 60 characters",
  "metaDescription": "SEO description between 140 and 160 characters",
  "tags": ["tag one", "tag two", "tag three", "tag four", "tag five"]
}
Requirements:
- Produce a complete article, not an outline.
- Target approximately 1200 to 1800 words.
- Use natural headings and readable paragraphs.
- Do not include fake quotations or invented statistics.
- Do not mention being an AI.
- Do not wrap the JSON inside Markdown code fences.
- The content field must contain Markdown text.
- Return valid JSON only.
`.trim();
}
function createSystemPrompt(): string {
  return `
You are a senior editorial writer and SEO specialist for Knowledge Nest.
Generate accurate, useful and original educational articles.
Return valid JSON only.
Never return explanatory text outside the JSON object.
`.trim();
}
function extractJsonObject(value: string): unknown {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("AI provider ne valid JSON article return nahi kiya.");
    }
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}
function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`AI article field missing: ${key}`);
  }
  return value.trim();
}
function normalizeArticle(
  value: unknown,
  request: AIArticleGenerationRequest,
): AIArticleGenerationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI provider ne invalid article object return kiya.");
  }
  const record = value as Record<string, unknown>;
  const title = requireString(record, "title");
  const content = requireString(record, "content");
  if (content.length < 500) {
    throw new Error("AI provider ka generated article bohat chhota hai.");
  }
  const focusKeyword =
    typeof record.focusKeyword === "string" && record.focusKeyword.trim()
      ? record.focusKeyword.trim()
      : request.focusKeyword?.trim() || request.topic.trim();
  const rawTags = record.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
        .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
        .map((tag) => tag.trim())
        .slice(0, 10)
    : [];
  return {
    title,
    slug:
      typeof record.slug === "string" && record.slug.trim()
        ? createSlug(record.slug)
        : createSlug(title),
    excerpt: requireString(record, "excerpt"),
    content,
    focusKeyword,
    metaTitle: requireString(record, "metaTitle"),
    metaDescription: requireString(record, "metaDescription"),
    tags: tags.length > 0 ? tags : [request.categoryName, focusKeyword, "Knowledge Nest"],
  };
}
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}
async function readErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `HTTP ${response.status}`;
  }
  try {
    const parsed = JSON.parse(text) as {
      error?: {
        message?: string;
      };
      message?: string;
    };
    return parsed.error?.message || parsed.message || `HTTP ${response.status}`;
  } catch {
    return text.slice(0, 300);
  }
}
async function generateWithOpenAI(
  request: AIArticleGenerationRequest,
  apiKey: string,
  model: string,
): Promise<AIArticleGenerationResult> {
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: createSystemPrompt(),
        },
        {
          role: "user",
          content: createPrompt(request),
        },
      ],
      max_output_tokens: 7000,
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };
  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n") ||
    "";
  return normalizeArticle(extractJsonObject(text), request);
}
async function generateWithGemini(
  request: AIArticleGenerationRequest,
  apiKey: string,
  model: string,
): Promise<AIArticleGenerationResult> {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: createSystemPrompt(),
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: createPrompt(request),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 7000,
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
  return normalizeArticle(extractJsonObject(text), request);
}
async function generateWithClaude(
  request: AIArticleGenerationRequest,
  apiKey: string,
  model: string,
): Promise<AIArticleGenerationResult> {
  const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 7000,
      system: createSystemPrompt(),
      messages: [
        {
          role: "user",
          content: createPrompt(request),
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const data = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
  const text =
    data.content
      ?.filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n") ?? "";
  return normalizeArticle(extractJsonObject(text), request);
}
async function generateOpenAICompatibleChat(
  request: AIArticleGenerationRequest,
  configuration: {
    url: string;
    apiKey: string;
    model: string;
    extraBody?: Record<string, unknown>;
  },
): Promise<AIArticleGenerationResult> {
  const response = await fetchWithTimeout(configuration.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${configuration.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: configuration.model,
      messages: [
        {
          role: "system",
          content: createSystemPrompt(),
        },
        {
          role: "user",
          content: createPrompt(request),
        },
      ],
      max_tokens: 7000,
      response_format: {
        type: "json_object",
      },
      ...configuration.extraBody,
    }),
  });
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return normalizeArticle(extractJsonObject(text), request);
}
async function generateWithDeepSeek(
  request: AIArticleGenerationRequest,
  apiKey: string,
  model: string,
): Promise<AIArticleGenerationResult> {
  return generateOpenAICompatibleChat(request, {
    url: "https://api.deepseek.com/chat/completions",
    apiKey,
    model,
    extraBody: {
      thinking: {
        type: "disabled",
      },
    },
  });
}
async function generateWithGrok(
  request: AIArticleGenerationRequest,
  apiKey: string,
  model: string,
): Promise<AIArticleGenerationResult> {
  return generateOpenAICompatibleChat(request, {
    url: "https://api.x.ai/v1/chat/completions",
    apiKey,
    model,
  });
}
function readAIEnvironmentValue(variableName: string): string | undefined {
  const rawValue = process.env[variableName];
  if (typeof rawValue !== "string") {
    return undefined;
  }
  let value = rawValue.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  value = value.replace(/\\\$/g, "$");
  if (
    !value ||
    /^(undefined|null|none|empty)$/i.test(value) ||
    /^(your-|replace-|enter-|paste-)/i.test(value) ||
    value.includes("YOUR_API_KEY")
  ) {
    return undefined;
  }
  return value;
}
function readAIModel(variableName: string, fallback: string): string {
  return readAIEnvironmentValue(variableName) ?? fallback;
}
function getProviderDefinitions(): ProviderDefinition[] {
  return [
    {
      id: "openai",
      label: "OpenAI / ChatGPT",
      apiKey: readAIEnvironmentValue("OPENAI_API_KEY"),
      model: readAIModel("OPENAI_ARTICLE_MODEL", "gpt-5"),
      generate: generateWithOpenAI,
    },
    {
      id: "gemini",
      label: "Google Gemini",
      apiKey: readAIEnvironmentValue("GEMINI_API_KEY"),
      model: readAIModel("GEMINI_ARTICLE_MODEL", "gemini-3.6-flash"),
      generate: generateWithGemini,
    },
    {
      id: "claude",
      label: "Anthropic Claude",
      apiKey: readAIEnvironmentValue("ANTHROPIC_API_KEY"),
      model: readAIModel("ANTHROPIC_ARTICLE_MODEL", "claude-sonnet-4-20250514"),
      generate: generateWithClaude,
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      apiKey: readAIEnvironmentValue("DEEPSEEK_API_KEY"),
      model: readAIModel("DEEPSEEK_ARTICLE_MODEL", "deepseek-v4-flash"),
      generate: generateWithDeepSeek,
    },
    {
      id: "grok",
      label: "xAI Grok",
      apiKey: readAIEnvironmentValue("XAI_API_KEY"),
      model: readAIModel("XAI_ARTICLE_MODEL", "grok-4"),
      generate: generateWithGrok,
    },
  ];
}
function getFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "AI request timeout ho gayi.";
    }
    return error.message;
  }
  return "Unknown AI provider error.";
}
export function getConfiguredAIProviders(): Array<{
  id: AIArticleProvider;
  label: string;
  model: string;
}> {
  return getProviderDefinitions()
    .filter(
      (
        provider,
      ): provider is ProviderDefinition & {
        apiKey: string;
      } => typeof provider.apiKey === "string" && provider.apiKey.trim().length > 0,
    )
    .map((provider) => ({
      id: provider.id,
      label: provider.label,
      model: provider.model,
    }));
}
export async function generateMultiAIArticleDrafts(
  request: AIArticleGenerationRequest,
): Promise<MultiAIArticleGenerationResult> {
  const configuredProviders = getProviderDefinitions().filter(
    (
      provider,
    ): provider is ProviderDefinition & {
      apiKey: string;
    } => typeof provider.apiKey === "string" && provider.apiKey.trim().length > 0,
  );
  if (configuredProviders.length === 0) {
    return {
      drafts: [],
      failures: [],
      attempts: [],
      configuredProviders: [],
      successfulProvider: null,
      manualFallbackRequired: true,
    };
  }
  const drafts: AIArticleDraft[] = [];
  const failures: AIArticleFailure[] = [];
  const attempts: AIArticleProviderAttempt[] = [];
  for (const provider of configuredProviders) {
    const startedAt = new Date().toISOString();
    const startedTimestamp = Date.now();
    console.info(`[AI FALLBACK] Starting ${provider.label} using ${provider.model}`);
    try {
      const article = await provider.generate(request, provider.apiKey, provider.model);
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startedTimestamp;
      const draft: AIArticleDraft = {
        id: `${provider.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        provider: provider.id,
        providerLabel: provider.label,
        model: provider.model,
        article,
      };
      drafts.push(draft);
      attempts.push({
        provider: provider.id,
        providerLabel: provider.label,
        model: provider.model,
        status: "success",
        message: "Article successfully generate hua.",
        startedAt,
        completedAt,
        durationMs,
      });
      console.info(`[AI FALLBACK] ${provider.label} succeeded in ${durationMs}ms`);
      break;
    } catch (error) {
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startedTimestamp;
      const message = getFailureMessage(error);
      failures.push({
        provider: provider.id,
        providerLabel: provider.label,
        model: provider.model,
        message,
        attemptedAt: completedAt,
        durationMs,
      });
      attempts.push({
        provider: provider.id,
        providerLabel: provider.label,
        model: provider.model,
        status: "failed",
        message,
        startedAt,
        completedAt,
        durationMs,
      });
      console.warn(
        `[AI FALLBACK] ${provider.label} failed after ${durationMs}ms: ${message}`,
      );
    }
  }
  const successfulProvider = drafts.length > 0 ? drafts[0].provider : null;
  return {
    drafts,
    failures,
    attempts,
    configuredProviders: configuredProviders.map((provider) => provider.id),
    successfulProvider,
    manualFallbackRequired: drafts.length === 0,
  };
}
export async function generateAIArticleDraft(
  request: AIArticleGenerationRequest,
): Promise<AIArticleGenerationResult> {
  const result = await generateMultiAIArticleDrafts(request);
  return result.drafts[0].article;
}
