"use client";
import { useEffect } from "react";
type ArticleViewTrackerProps = {
  slug: string;
};
const ENGAGED_VIEW_DELAY_MS = 8_000;
const SESSION_KEY_PREFIX = "knowledge-nest:view:";
export function ArticleViewTracker({ slug }: ArticleViewTrackerProps) {
  useEffect(() => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      return;
    }
    const storageKey = `${SESSION_KEY_PREFIX}${normalizedSlug}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") {
        return;
      }
    } catch {
      // View tracking can still operate when sessionStorage is unavailable.
    }
    let cancelled = false;
    let timeoutId: number | null = null;
    const recordView = async () => {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      try {
        const response = await fetch("/api/article-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: normalizedSlug,
          }),
          credentials: "same-origin",
          keepalive: true,
        });
        if (!response.ok) {
          return;
        }
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // Successful server recording must not depend on local storage.
        }
      } catch {
        // View tracking must never interrupt article reading.
      }
    };
    const scheduleView = () => {
      if (cancelled || timeoutId !== null || document.visibilityState !== "visible") {
        return;
      }
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        void recordView();
      }, ENGAGED_VIEW_DELAY_MS);
    };
    const cancelPendingView = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleView();
      } else {
        cancelPendingView();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleView();
    return () => {
      cancelled = true;
      cancelPendingView();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [slug]);
  return null;
}
