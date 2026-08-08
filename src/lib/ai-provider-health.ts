import "server-only";
const VERIFICATION_TIMEOUT_MS = 20_000;
export type AIProviderId = "openai" | "gemini" | "claude" | "deepseek" | "grok";
export type AIProviderConnectionStatus =
  | "connected"
  | "missing"
  | "invalid-key"
  | "forbidden"
  | "rate-limited"
  | "unavailable"
  | "timeout"
  | "network-error";
export type AIProviderHealth = {
  id: AIProviderId;
  label: string;
  model: string;
  configured: boolean;
  status: AIProviderConnectionStatus;
  message: string;
  verifiedAt: string;
};
type ProviderConfiguration = {
  id: AIProviderId;
  label: string;
  keyVariable: string;
  modelVariable: string;
  fallbackModel: string;
  url: (apiKey: string) => string;
  headers: (apiKey: string) => HeadersInit;
};
function readEnvironmentValue(variableName: string): string | undefined {
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
const PROVIDERS: ProviderConfiguration[] = [
  {
    id: "openai",
    label: "OpenAI / ChatGPT",
    keyVariable: "OPENAI_API_KEY",
    modelVariable: "OPENAI_ARTICLE_MODEL",
    fallbackModel: "gpt-5",
    url: () => "https://api.openai.com/v1/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
  },
  {
    id: "gemini",
    label: "Google Gemini",
    keyVariable: "GEMINI_API_KEY",
    modelVariable: "GEMINI_ARTICLE_MODEL",
    fallbackModel: "gemini-3.6-flash",
    url: (apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
        apiKey,
      )}`,
    headers: () => ({}),
  },
  {
    id: "claude",
    label: "Anthropic Claude",
    keyVariable: "ANTHROPIC_API_KEY",
    modelVariable: "ANTHROPIC_ARTICLE_MODEL",
    fallbackModel: "claude-sonnet-4-20250514",
    url: () => "https://api.anthropic.com/v1/models",
    headers: (apiKey) => ({
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyVariable: "DEEPSEEK_API_KEY",
    modelVariable: "DEEPSEEK_ARTICLE_MODEL",
    fallbackModel: "deepseek-v4-flash",
    url: () => "https://api.deepseek.com/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
  },
  {
    id: "grok",
    label: "xAI Grok",
    keyVariable: "XAI_API_KEY",
    modelVariable: "XAI_ARTICLE_MODEL",
    fallbackModel: "grok-4",
    url: () => "https://api.x.ai/v1/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
  },
];
function getFailureStatus(status: number): AIProviderConnectionStatus {
  if (status === 401) {
    return "invalid-key";
  }
  if (status === 403) {
    return "forbidden";
  }
  if (status === 429) {
    return "rate-limited";
  }
  return "unavailable";
}
async function readResponseMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `HTTP ${response.status}`;
  }
  try {
    const data = JSON.parse(text) as {
      error?: {
        message?: string;
      };
      message?: string;
    };
    return data.error?.message ?? data.message ?? `HTTP ${response.status}`;
  } catch {
    return text.slice(0, 180);
  }
}
async function verifyProvider(
  provider: ProviderConfiguration,
): Promise<AIProviderHealth> {
  const verifiedAt = new Date().toISOString();
  const apiKey = readEnvironmentValue(provider.keyVariable);
  const model = readEnvironmentValue(provider.modelVariable) ?? provider.fallbackModel;
  if (!apiKey) {
    return {
      id: provider.id,
      label: provider.label,
      model,
      configured: false,
      status: "missing",
      message: `${provider.keyVariable} missing hai.`,
      verifiedAt,
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, VERIFICATION_TIMEOUT_MS);
  try {
    const response = await fetch(provider.url(apiKey), {
      method: "GET",
      headers: provider.headers(apiKey),
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.ok) {
      return {
        id: provider.id,
        label: provider.label,
        model,
        configured: true,
        status: "connected",
        message: "API connection successful.",
        verifiedAt,
      };
    }
    return {
      id: provider.id,
      label: provider.label,
      model,
      configured: true,
      status: getFailureStatus(response.status),
      message: await readResponseMessage(response),
      verifiedAt,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        id: provider.id,
        label: provider.label,
        model,
        configured: true,
        status: "timeout",
        message: "Provider verification timeout.",
        verifiedAt,
      };
    }
    return {
      id: provider.id,
      label: provider.label,
      model,
      configured: true,
      status: "network-error",
      message: error instanceof Error ? error.message : "Provider network error.",
      verifiedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
export function getAIProviderConfiguration() {
  return PROVIDERS.map((provider) => {
    const apiKey = readEnvironmentValue(provider.keyVariable);
    return {
      id: provider.id,
      label: provider.label,
      configured: Boolean(apiKey),
      model: readEnvironmentValue(provider.modelVariable) ?? provider.fallbackModel,
    };
  });
}
export async function verifyAIProviders(): Promise<AIProviderHealth[]> {
  return Promise.all(PROVIDERS.map((provider) => verifyProvider(provider)));
}
