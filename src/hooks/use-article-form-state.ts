/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createArticleSlug,
  EMPTY_ARTICLE_DATA,
  type ArticleEditorData,
  type ArticleSaveAction,
  type ArticleValidationErrors,
} from "@/lib/article-publishing-workflow";
type SaveResponse = {
  success: boolean;
  message: string;
  article?: ArticleEditorData;
  errors?: ArticleValidationErrors;
};
export function useArticleFormState(initialArticle?: Partial<ArticleEditorData>) {
  const initialData = useMemo(
    () => ({
      ...EMPTY_ARTICLE_DATA,
      ...initialArticle,
    }),
    [initialArticle],
  );
  const storageKey = initialData.id
    ? `knowledge-nest-article-${initialData.id}`
    : "knowledge-nest-new-article";
  const [article, setArticle] = useState<ArticleEditorData>(initialData);
  const [errors, setErrors] = useState<ArticleValidationErrors>({});
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<ArticleEditorData>;
        setArticle({
          ...initialData,
          ...parsed,
          id: initialData.id,
          status: initialData.status,
          createdAt: initialData.createdAt,
          publishDate: initialData.publishDate,
        });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setRestored(true);
  }, [initialData, storageKey]);
  useEffect(() => {
    if (!restored) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(article));
  }, [article, restored, storageKey]);
  const updateField = useCallback(
    <K extends keyof ArticleEditorData>(field: K, value: ArticleEditorData[K]) => {
      setArticle((current) => {
        const next = {
          ...current,
          [field]: value,
        };
        if (
          field === "title" &&
          !current.id &&
          (!current.slug || current.slug === createArticleSlug(current.title))
        ) {
          next.slug = createArticleSlug(String(value));
        }
        return next;
      });
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
      setMessage("");
    },
    [],
  );
  const clearPreservedState = useCallback(() => {
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);
  const saveArticle = useCallback(
    async (action: ArticleSaveAction) => {
      setIsSaving(true);
      setErrors({});
      setMessage("");
      try {
        const response = await fetch("/api/admin/articles/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            article,
          }),
        });
        const result = (await response.json()) as SaveResponse;
        if (!response.ok || !result.success) {
          setErrors(result.errors ?? {});
          setMessage(result.message || "Unable to save article.");
          return null;
        }
        if (result.article) {
          setArticle(result.article);
        }
        clearPreservedState();
        setMessage(result.message);
        return result.article ?? null;
      } catch {
        setMessage("Unable to save article. Please try again.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [article, clearPreservedState],
  );
  return {
    article,
    errors,
    message,
    isSaving,
    updateField,
    saveArticle,
    setArticle,
    clearPreservedState,
  };
}
