"use client";
import { useState } from "react";
type SEOResult = {
  score: number;
  suggestedTitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  improvements: string[];
};
type AISEOOptimizationPanelProps = {
  title: string;
  content: string;
  focusKeyword?: string;
  category?: string;
  onOptimized: (result: SEOResult) => void;
};
export function AISEOOptimizationPanel({
  title,
  content,
  focusKeyword,
  category,
  onOptimized,
}: AISEOOptimizationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const optimizeSEO = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/articles/seo-optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          focusKeyword,
          category,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || "SEO optimization failed.");
        return;
      }
      onOptimized(result.seo);
      setMessage("SEO optimization loaded.");
    } catch {
      setMessage("Unable to optimize SEO.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        AI SEO
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Optimize Article SEO</h2>
      <button
        type="button"
        disabled={loading}
        onClick={optimizeSEO}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Optimizing..." : "Run SEO Optimization"}
      </button>
      {message ? (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
    </section>
  );
}
