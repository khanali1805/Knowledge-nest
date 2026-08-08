"use client";
import { useState } from "react";
type PerformanceResult = {
  performanceScore: number;
  engagementScore: number;
  readabilityScore: number;
  recommendations: string[];
};
type AIContentPerformancePanelProps = {
  title: string;
  content: string;
  onAnalyzed: (result: PerformanceResult) => void;
};
export function AIContentPerformancePanel({
  title,
  content,
  onAnalyzed,
}: AIContentPerformancePanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const analyzePerformance = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/articles/performance-analysis", {
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
        setMessage(result.message || "Performance analysis failed.");
        return;
      }
      onAnalyzed(result.performance);
      setMessage("Content performance analyzed successfully.");
    } catch {
      setMessage("Unable to analyze performance.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        AI Performance
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Analyze Content Performance
      </h2>
      <button
        type="button"
        disabled={loading}
        onClick={analyzePerformance}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Run Performance Analysis"}
      </button>
      {message ? (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
    </section>
  );
}
