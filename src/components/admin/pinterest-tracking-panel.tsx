"use client";
import { CheckCircle2, ChevronDown, ChevronUp, Clipboard, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
type PinterestArticle = {
  id: string;
  title: string;
  slug: string;
  status: string;
};
type PinterestTrackingPanelProps = {
  articles: PinterestArticle[];
  siteUrl: string;
};
type CopiedTimes = Record<string, number>;
const COPY_STATUS_DURATION_MS = 60 * 60 * 1000;
const STORAGE_KEY = "knowledge-nest:pinterest-copied-links:v1";
function getTrackingUrl(siteUrl: string, article: PinterestArticle) {
  const url = new URL(`/article/${encodeURIComponent(article.slug)}`, siteUrl);
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "knowledge_nest");
  url.searchParams.set("utm_content", article.id);
  return url.toString();
}
function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}
function readStoredCopiedTimes(): CopiedTimes {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }
    const now = Date.now();
    const validEntries: CopiedTimes = {};
    for (const [articleId, copiedAt] of Object.entries(parsedValue)) {
      if (
        typeof copiedAt === "number" &&
        Number.isFinite(copiedAt) &&
        now - copiedAt < COPY_STATUS_DURATION_MS
      ) {
        validEntries[articleId] = copiedAt;
      }
    }
    return validEntries;
  } catch {
    return {};
  }
}
function saveCopiedTimes(value: CopiedTimes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Clipboard tracking is convenience-only.
    // A storage failure must not block copying the article URL.
  }
}
export function PinterestTrackingPanel({
  articles,
  siteUrl,
}: PinterestTrackingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedTimes, setCopiedTimes] = useState<CopiedTimes>({});
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [copyError, setCopyError] = useState("");
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCopiedTimes(readStoredCopiedTimes());
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      setCopiedTimes((current) => {
        let changed = false;
        const next: CopiedTimes = {};
        for (const [articleId, copiedAt] of Object.entries(current)) {
          if (now - copiedAt < COPY_STATUS_DURATION_MS) {
            next[articleId] = copiedAt;
          } else {
            changed = true;
          }
        }
        if (changed) {
          saveCopiedTimes(next);
          return next;
        }
        return current;
      });
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const publishedCount = useMemo(
    () => articles.filter((article) => article.status === "published").length,
    [articles],
  );
  async function handleCopy(article: PinterestArticle) {
    if (article.status !== "published") {
      return;
    }
    setCopyError("");
    try {
      const trackingUrl = getTrackingUrl(siteUrl, article);
      await copyText(trackingUrl);
      const copiedAt = currentTime;
      setCurrentTime(copiedAt);
      setCopiedTimes((current) => {
        const next = {
          ...current,
          [article.id]: copiedAt,
        };
        saveCopiedTimes(next);
        return next;
      });
    } catch {
      setCopyError(
        "Link clipboard mein copy nahi hua. Browser clipboard permission check karein.",
      );
    }
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">
              Pinterest Tracking Links
            </h2>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
              {publishedCount} published
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Article link copy karein. Pinterest tracking parameters automatically add
            honge.
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
        )}
      </button>
      {isOpen ? (
        <div className="border-t border-slate-200">
          {copyError ? (
            <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {copyError}
            </div>
          ) : null}
          {articles.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Abhi koi article available nahi hai.
            </div>
          ) : (
            <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
              {articles.map((article) => {
                const copiedAt = copiedTimes[article.id];
                const remainingTime =
                  typeof copiedAt === "number"
                    ? COPY_STATUS_DURATION_MS - (currentTime - copiedAt)
                    : 0;
                const isCopied = remainingTime > 0;
                const isPublished = article.status === "published";
                return (
                  <div
                    key={article.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-950">{article.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize">{article.status}</span>
                        <span className="truncate">/article/{article.slug}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isPublished}
                      onClick={() => void handleCopy(article)}
                      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                        isCopied
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                          : isPublished
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Copied
                          <Clock3 className="ml-1 h-3.5 w-3.5" />
                          {formatRemainingTime(remainingTime)}
                        </>
                      ) : isPublished ? (
                        <>
                          <Clipboard className="h-4 w-4" />
                          Copy Link
                        </>
                      ) : (
                        "Publish first"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">
            Copied status sirf is browser mein save hota hai aur 1 hour ke baad
            automatically remove ho jata hai. Database mein koi tracking state save nahi
            hoti.
          </div>
        </div>
      ) : null}
    </section>
  );
}
