"use client";
import { useState } from "react";
type QualityResult = {
  score: number;
  readabilityScore: number;
  structureScore: number;
  engagementScore: number;
  suggestions: string[];
};
type AIContentQualityPanelProps = {
  title: string;
  content: string;
  onAnalyzed: (result: QualityResult) => void;
};
export function AIContentQualityPanel({
  title,
  content,
  onAnalyzed,
}: AIContentQualityPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const analyzeContent = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/articles/quality-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || "Analysis failed.");
        return;
      }
      onAnalyzed(result.quality);
      setMessage("Content quality analyzed successfully.");
    } catch {
      setMessage("Unable to analyze content.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        AI Quality
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Analyze Content Quality</h2>
      <button
        type="button"
        disabled={loading}
        onClick={analyzeContent}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Run Quality Check"}
      </button>
      {message ? (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
    </section>
  );
}
