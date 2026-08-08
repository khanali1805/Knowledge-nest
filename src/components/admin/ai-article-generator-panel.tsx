"use client";
import { useState } from "react";
import { MASTER_CATEGORIES } from "@/lib/categories";
import type { ArticleEditorData } from "@/lib/article-publishing-workflow";
type AIArticleGeneratorPanelProps = {
  onGenerated: (article: Partial<ArticleEditorData>) => void;
};
type GenerateResponse = {
  success: boolean;
  message?: string;
  article?: Partial<ArticleEditorData>;
};
export function AIArticleGeneratorPanel({ onGenerated }: AIArticleGeneratorPanelProps) {
  const [topic, setTopic] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const generateArticle = async () => {
    if (!topic || !categorySlug) {
      setMessage("Topic and category are required.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/articles/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          categorySlug,
          focusKeyword: keyword,
        }),
      });
      const result = (await response.json()) as GenerateResponse;
      if (!response.ok || !result.success || !result.article) {
        setMessage(result.message || "Unable to generate article.");
        return;
      }
      onGenerated(result.article);
      setMessage("AI article loaded into editor.");
    } catch {
      setMessage("Unable to generate article.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        AI Writer
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Generate Article With AI
      </h2>
      <div className="mt-6 grid gap-4">
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Article topic"
          className="rounded-xl border px-4 py-3"
        />
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">Select category</option>
          {MASTER_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Focus keyword"
          className="rounded-xl border px-4 py-3"
        />
        <button
          type="button"
          disabled={loading}
          onClick={generateArticle}
          className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate AI Article"}
        </button>
        {message ? (
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
