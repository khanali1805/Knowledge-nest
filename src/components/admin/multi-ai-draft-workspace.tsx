"use client";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
type ProviderId = "openai" | "gemini" | "claude" | "deepseek" | "grok";
type ProviderConnectionStatus =
  | "connected"
  | "missing"
  | "invalid-key"
  | "forbidden"
  | "rate-limited"
  | "unavailable"
  | "timeout"
  | "network-error";
type ProviderHealth = {
  id: ProviderId;
  label: string;
  model: string;
  configured: boolean;
  status: ProviderConnectionStatus;
  message: string;
  verifiedAt?: string;
};
type ProviderStatusResponse = {
  success: boolean;
  verified: boolean;
  configuredCount: number;
  connectedCount: number | null;
  providers: ProviderHealth[];
};
type GeneratedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
};
type ArticleDraft = {
  id: string;
  provider: ProviderId;
  providerLabel: string;
  model: string;
  article: GeneratedArticle;
};
type ArticleFailure = {
  provider: ProviderId;
  providerLabel: string;
  model?: string;
  message: string;
  attemptedAt?: string;
  durationMs?: number;
};
type ProviderAttempt = {
  provider: ProviderId;
  providerLabel: string;
  model: string;
  status: "success" | "failed" | "skipped";
  message: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
};
type GenerateResponse = {
  success: boolean;
  message?: string;
  manualFallbackRequired?: boolean;
  article?: GeneratedArticle;
  selectedDraftId?: string;
  drafts?: ArticleDraft[];
  failures?: ArticleFailure[];
  attempts?: ProviderAttempt[];
  configuredProviders?: ProviderId[];
  successfulProvider?: ProviderId | null;
};
type CategoryOption = {
  slug: string;
  name: string;
};
const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
  },
  {
    slug: "automobile",
    name: "Automobile",
  },
  {
    slug: "business",
    name: "Business",
  },
  {
    slug: "education",
    name: "Education",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
  },
  {
    slug: "fashion",
    name: "Fashion",
  },
  {
    slug: "finance",
    name: "Finance",
  },
  {
    slug: "fitness",
    name: "Fitness",
  },
  {
    slug: "food",
    name: "Food",
  },
  {
    slug: "gaming",
    name: "Gaming",
  },
  {
    slug: "health",
    name: "Health",
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
  },
  {
    slug: "news",
    name: "News",
  },
  {
    slug: "science",
    name: "Science",
  },
  {
    slug: "sports",
    name: "Sports",
  },
  {
    slug: "technology",
    name: "Technology",
  },
  {
    slug: "travel",
    name: "Travel",
  },
];
const PROVIDER_BADGES: Record<
  ProviderId,
  {
    shortLabel: string;
    badgeClassName: string;
  }
> = {
  openai: {
    shortLabel: "OpenAI",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  gemini: {
    shortLabel: "Gemini",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
  },
  claude: {
    shortLabel: "Claude",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-800",
  },
  deepseek: {
    shortLabel: "DeepSeek",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  grok: {
    shortLabel: "Grok",
    badgeClassName: "border-slate-300 bg-slate-100 text-slate-800",
  },
};
function getStatusClasses(status: ProviderConnectionStatus): string {
  if (status === "connected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "missing") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  if (status === "rate-limited" || status === "timeout") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-red-200 bg-red-50 text-red-800";
}
function getStatusLabel(status: ProviderConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "missing":
      return "Not configured";
    case "invalid-key":
      return "Invalid key";
    case "forbidden":
      return "Forbidden";
    case "rate-limited":
      return "Rate limited";
    case "timeout":
      return "Timeout";
    case "network-error":
      return "Network error";
    default:
      return "Unavailable";
  }
}
function findFormControl(
  names: string[],
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
  for (const name of names) {
    const escapedName =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(name)
        : name;
    const selectors = [
      `[name="${escapedName}"]`,
      `#${escapedName}`,
      `[data-field="${escapedName}"]`,
    ];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        return element;
      }
    }
  }
  return null;
}
function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  if (element instanceof HTMLSelectElement) {
    element.value = value;
    element.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
    return;
  }
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(
    new Event("input", {
      bubbles: true,
    }),
  );
  element.dispatchEvent(
    new Event("change", {
      bubbles: true,
    }),
  );
}
function setContentEditableValue(value: string): boolean {
  const selectors = [
    '[contenteditable="true"][data-field="content"]',
    '[contenteditable="true"][data-placeholder*="article" i]',
    '[contenteditable="true"][aria-label*="content" i]',
    ".ProseMirror",
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement && element.isContentEditable) {
      element.innerHTML = value;
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: value,
        }),
      );
      return true;
    }
  }
  return false;
}
function selectCategory(categorySlug: string, categoryName: string): boolean {
  const select = findFormControl([
    "categoryId",
    "categorySlug",
    "category",
    "articleCategory",
  ]);
  if (!(select instanceof HTMLSelectElement)) {
    return false;
  }
  const normalizedSlug = categorySlug.trim().toLowerCase();
  const normalizedName = categoryName.trim().toLowerCase();
  const matchingOption = Array.from(select.options).find((option) => {
    const value = option.value.trim().toLowerCase();
    const text = option.text.trim().toLowerCase();
    return (
      value === normalizedSlug ||
      text === normalizedName ||
      text.includes(normalizedName) ||
      value.includes(normalizedSlug)
    );
  });
  if (!matchingOption) {
    return false;
  }
  setNativeValue(select, matchingOption.value);
  return true;
}
function fillArticleEditor(
  article: GeneratedArticle,
  categorySlug: string,
  categoryName: string,
) {
  const fieldValues: Array<{
    names: string[];
    value: string;
  }> = [
    {
      names: ["title", "articleTitle"],
      value: article.title,
    },
    {
      names: ["slug", "articleSlug"],
      value: article.slug,
    },
    {
      names: ["excerpt", "description"],
      value: article.excerpt,
    },
    {
      names: ["focusKeyword", "focus_keyword", "keyword"],
      value: article.focusKeyword,
    },
    {
      names: ["seoTitle", "metaTitle", "seo_title"],
      value: article.metaTitle,
    },
    {
      names: ["seoDescription", "metaDescription", "seo_description"],
      value: article.metaDescription,
    },
    {
      names: ["tags", "tagNames"],
      value: article.tags.join(", "),
    },
  ];
  let updatedFieldCount = 0;
  for (const field of fieldValues) {
    const control = findFormControl(field.names);
    if (control) {
      setNativeValue(control, field.value);
      updatedFieldCount += 1;
    }
  }
  const contentControl = findFormControl(["content", "articleContent", "body"]);
  if (contentControl) {
    setNativeValue(contentControl, article.content);
    updatedFieldCount += 1;
  } else if (setContentEditableValue(article.content)) {
    updatedFieldCount += 1;
  }
  const categoryUpdated = selectCategory(categorySlug, categoryName);
  if (categoryUpdated) {
    updatedFieldCount += 1;
  }
  const selectedDraft = {
    article,
    categorySlug,
    categoryName,
    selectedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    "knowledge-nest:selected-ai-draft",
    JSON.stringify(selectedDraft),
  );
  window.dispatchEvent(
    new CustomEvent("knowledge-nest:ai-draft-selected", {
      detail: selectedDraft,
    }),
  );
  return updatedFieldCount;
}
function DraftPreview({ article }: { article: GeneratedArticle }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          Article title
        </p>
        <h4 className="mt-2 text-xl font-bold tracking-tight">{article.title}</h4>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          Excerpt
        </p>
        <p className="mt-2 text-sm leading-6">{article.excerpt}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border rounded-xl border p-3">
          <p className="text-muted-foreground text-xs">Focus keyword</p>
          <p className="mt-1 text-sm font-semibold break-words">{article.focusKeyword}</p>
        </div>
        <div className="border-border rounded-xl border p-3">
          <p className="text-muted-foreground text-xs">Slug</p>
          <p className="mt-1 text-sm font-semibold break-all">{article.slug}</p>
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          SEO title
        </p>
        <p className="mt-2 text-sm font-medium">{article.metaTitle}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          SEO description
        </p>
        <p className="mt-2 text-sm leading-6">{article.metaDescription}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          Tags
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="border-border bg-muted rounded-full border px-3 py-1 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.14em] uppercase">
          Full article preview
        </p>
        <div
          className="prose prose-sm mt-3 max-h-[520px] max-w-none overflow-y-auto rounded-xl border p-4"
          dangerouslySetInnerHTML={{
            __html: article.content,
          }}
        />
      </div>
    </div>
  );
}
export function MultiAIDraftWorkspace() {
  const [topic, setTopic] = useState("");
  const [categorySlug, setCategorySlug] = useState("technology");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [instructions, setInstructions] = useState("");
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [failures, setFailures] = useState<ArticleFailure[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [expandedDraftIds, setExpandedDraftIds] = useState<string[]>([]);
  const [isCheckingProviders, setIsCheckingProviders] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const selectedCategory = useMemo(
    () =>
      CATEGORY_OPTIONS.find((category) => category.slug === categorySlug) ??
      CATEGORY_OPTIONS[0],
    [categorySlug],
  );
  const connectedProviders = providers.filter(
    (provider) => provider.status === "connected",
  );
  const loadProviders = useCallback(async (verify: boolean) => {
    setIsCheckingProviders(true);
    try {
      const response = await fetch(
        `/api/admin/ai/providers${verify ? "?verify=1" : ""}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      const result = (await response.json()) as ProviderStatusResponse;
      if (!response.ok || !result.success) {
        throw new Error("AI provider status load nahi hua.");
      }
      setProviders(result.providers);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "AI provider status load nahi hua.",
      );
    } finally {
      setIsCheckingProviders(false);
    }
  }, []);
  useEffect(() => {
    const providerLoadTimer = window.setTimeout(() => {
      void loadProviders(true);
    }, 0);
    return () => {
      window.clearTimeout(providerLoadTimer);
    };
  }, [loadProviders]);
  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGenerating) {
      return;
    }
    const normalizedTopic = topic.trim();
    if (!normalizedTopic) {
      setErrorMessage("Article topic enter karein.");
      return;
    }
    setIsGenerating(true);
    setMessage("");
    setErrorMessage("");
    setDrafts([]);
    setFailures([]);
    setSelectedDraftId(null);
    setExpandedDraftIds([]);
    try {
      const response = await fetch("/api/admin/articles/ai-generate", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: normalizedTopic,
          categorySlug,
          focusKeyword: focusKeyword.trim() || undefined,
          instructions: instructions.trim() || undefined,
        }),
      });
      const result = (await response.json()) as GenerateResponse;
      if (!response.ok || !result.success) {
        setFailures(result.failures ?? []);
        if (result.manualFallbackRequired) {
          throw new Error(
            result.message ?? "AI providers unavailable hain. Manual Writer use karein.",
          );
        }
        throw new Error(result.message ?? "AI drafts generate nahi hue.");
      }
      const generatedDrafts =
        result.drafts ??
        (result.article
          ? [
              {
                id: result.selectedDraftId ?? `draft-${Date.now()}`,
                provider: "openai" as const,
                providerLabel: "Generated Article",
                model: "AI model",
                article: result.article,
              },
            ]
          : []);
      if (generatedDrafts.length === 0) {
        throw new Error("AI response mein koi draft nahi mila.");
      }
      setDrafts(generatedDrafts);
      setFailures(result.failures ?? []);
      setExpandedDraftIds([generatedDrafts[0].id]);
      setMessage(`${generatedDrafts.length} AI article drafts generate hue.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "AI drafts generate nahi hue.",
      );
    } finally {
      setIsGenerating(false);
    }
  }
  function toggleDraft(draftId: string) {
    setExpandedDraftIds((current) =>
      current.includes(draftId)
        ? current.filter((item) => item !== draftId)
        : [...current, draftId],
    );
  }
  async function copyDraft(draft: ArticleDraft) {
    const plainContent = draft.article.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const copyText = [
      draft.article.title,
      "",
      draft.article.excerpt,
      "",
      plainContent,
    ].join("\n");
    await navigator.clipboard.writeText(copyText);
    setMessage(`${draft.providerLabel} draft clipboard par copy ho gaya.`);
  }
  function applyDraft(draft: ArticleDraft) {
    const updatedFields = fillArticleEditor(
      draft.article,
      selectedCategory.slug,
      selectedCategory.name,
    );
    setSelectedDraftId(draft.id);
    if (updatedFields > 0) {
      setMessage(
        `${draft.providerLabel} draft article editor mein apply ho gaya. Neeche editor review karke Save ya Publish karein.`,
      );
    } else {
      setMessage(
        `${draft.providerLabel} draft select ho gaya. Draft browser storage mein save hai.`,
      );
    }
    window.setTimeout(() => {
      const editorControl = findFormControl(["title", "articleTitle"]);
      editorControl?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  }
  return (
    <section className="space-y-6">
      <div className="border-border bg-background overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border bg-muted/20 border-b p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="bg-foreground text-background inline-flex h-10 w-10 items-center justify-center rounded-xl">
                  <WandSparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-muted-foreground text-xs font-bold tracking-[0.16em] uppercase">
                    Phase 10 Multi-AI
                  </p>
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Generate and compare article drafts
                  </h2>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-6">
                OpenAI, Gemini, Claude, DeepSeek aur Grok se multiple drafts generate
                karein. Pasand ka draft select karke neeche article editor mein apply
                karein.
              </p>
            </div>
            <button
              type="button"
              disabled={isCheckingProviders}
              onClick={() => {
                void loadProviders(true);
              }}
              className="border-border hover:bg-muted inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={["h-4 w-4", isCheckingProviders ? "animate-spin" : ""].join(
                  " ",
                )}
                aria-hidden="true"
              />
              Verify providers
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {providers.length === 0 ? (
              <div className="border-border text-muted-foreground col-span-full rounded-xl border border-dashed p-4 text-sm">
                AI provider status load ho raha hai.
              </div>
            ) : (
              providers.map((provider) => (
                <article
                  key={provider.id}
                  className={[
                    "rounded-xl border p-3",
                    getStatusClasses(provider.status),
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{provider.label}</p>
                      <p className="mt-1 truncate text-xs opacity-75">{provider.model}</p>
                    </div>
                    {provider.status === "connected" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold">
                    {getStatusLabel(provider.status)}
                  </p>
                </article>
              ))
            )}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Connected providers:{" "}
            <span className="text-foreground font-bold">{connectedProviders.length}</span>
            {" / "}
            {providers.length}
          </p>
        </div>
        <form onSubmit={handleGenerate} className="grid gap-5 p-5 sm:p-6 xl:grid-cols-2">
          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="multi-ai-topic" className="text-sm font-semibold">
              Article topic
            </label>
            <input
              id="multi-ai-topic"
              type="text"
              required
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
              }}
              placeholder="Example: Future of artificial intelligence in education"
              className="border-border bg-background focus:border-ring h-12 w-full rounded-xl border px-4 text-sm transition outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="multi-ai-category" className="text-sm font-semibold">
              Category
            </label>
            <select
              id="multi-ai-category"
              value={categorySlug}
              onChange={(event) => {
                setCategorySlug(event.target.value);
              }}
              className="border-border bg-background focus:border-ring h-12 w-full rounded-xl border px-4 text-sm transition outline-none"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="multi-ai-keyword" className="text-sm font-semibold">
              Focus keyword
            </label>
            <input
              id="multi-ai-keyword"
              type="text"
              value={focusKeyword}
              onChange={(event) => {
                setFocusKeyword(event.target.value);
              }}
              placeholder="Optional SEO keyword"
              className="border-border bg-background focus:border-ring h-12 w-full rounded-xl border px-4 text-sm transition outline-none"
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="multi-ai-instructions" className="text-sm font-semibold">
              Extra instructions
            </label>
            <textarea
              id="multi-ai-instructions"
              rows={4}
              value={instructions}
              onChange={(event) => {
                setInstructions(event.target.value);
              }}
              placeholder="Optional: tone, audience, length ya special instructions"
              className="border-border bg-background focus:border-ring w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 transition outline-none"
            />
          </div>
          <div className="xl:col-span-2">
            <button
              type="submit"
              disabled={isGenerating || connectedProviders.length === 0}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  All connected AIs generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Generate Multi-AI Drafts
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {message ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        </div>
      ) : null}
      {isGenerating ? (
        <section
          aria-label="AI drafts generating"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {connectedProviders.map((provider) => (
            <article
              key={provider.id}
              className="border-border bg-background animate-pulse rounded-2xl border p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-32 rounded" />
                  <div className="bg-muted h-3 w-24 rounded" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="bg-muted h-5 w-4/5 rounded" />
                <div className="bg-muted h-4 w-full rounded" />
                <div className="bg-muted h-4 w-11/12 rounded" />
                <div className="bg-muted h-4 w-3/4 rounded" />
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {drafts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold tracking-[0.16em] uppercase">
                Multi-AI results
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Compare generated drafts
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {drafts.length} successful draft
              {drafts.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {drafts.map((draft) => {
              const isExpanded = expandedDraftIds.includes(draft.id);
              const isSelected = selectedDraftId === draft.id;
              const providerBadge = PROVIDER_BADGES[draft.provider];
              return (
                <article
                  key={draft.id}
                  className={[
                    "border-border bg-background overflow-hidden rounded-2xl border shadow-sm transition",
                    isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : "",
                  ].join(" ")}
                >
                  <div className="border-border bg-muted/20 border-b p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                              providerBadge.badgeClassName,
                            ].join(" ")}
                          >
                            {providerBadge.shortLabel}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                              <Check className="h-3 w-3" aria-hidden="true" />
                              Selected
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-lg font-bold tracking-tight">
                          {draft.article.title}
                        </h3>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {draft.providerLabel}
                          {" • "}
                          {draft.model}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          toggleDraft(draft.id);
                        }}
                        className="border-border hover:bg-muted inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition"
                      >
                        {isExpanded ? "Hide preview" : "Full preview"}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    {!isExpanded ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground line-clamp-4 text-sm leading-6">
                          {draft.article.excerpt}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="border-border rounded-xl border p-3">
                            <p className="text-muted-foreground text-xs">Focus keyword</p>
                            <p className="mt-1 line-clamp-1 text-sm font-semibold">
                              {draft.article.focusKeyword}
                            </p>
                          </div>
                          <div className="border-border rounded-xl border p-3">
                            <p className="text-muted-foreground text-xs">Tags</p>
                            <p className="mt-1 line-clamp-1 text-sm font-semibold">
                              {draft.article.tags.slice(0, 3).join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <DraftPreview article={draft.article} />
                    )}
                    <div className="border-border mt-5 flex flex-col gap-2 border-t pt-5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          applyDraft(draft);
                        }}
                        className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Use This Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void copyDraft(draft);
                        }}
                        className="border-border hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copy
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {failures.length > 0 ? (
        <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h2 className="text-lg font-bold">Provider failures</h2>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Baqi successful providers ke drafts upar available hain.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {failures.map((failure) => (
              <article
                key={`${failure.provider}-${failure.message}`}
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
              >
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold">{failure.providerLabel}</p>
                    <p className="mt-1 text-xs leading-5 break-words">
                      {failure.message}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
export default MultiAIDraftWorkspace;
