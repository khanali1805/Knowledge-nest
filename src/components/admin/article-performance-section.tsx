"use client";
import { useState } from "react";
import { AIContentPerformancePanel } from "@/components/admin/ai-content-performance-panel";
type PerformanceResult = {
  performanceScore: number;
  engagementScore: number;
  readabilityScore: number;
  recommendations: string[];
};
type ArticlePerformanceSectionProps = {
  title: string;
  content: string;
};
export function ArticlePerformanceSection({
  title,
  content,
}: ArticlePerformanceSectionProps) {
  const [performance, setPerformance] = useState<PerformanceResult | null>(null);
  return (
    <div className="space-y-6 sm:space-y-8">
      <AIContentPerformancePanel
        title={title}
        content={content}
        onAnalyzed={setPerformance}
      />
      {performance ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
            Analysis Results
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Content Performance Overview
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-bold text-slate-500">Performance Score</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {performance.performanceScore}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-bold text-slate-500">Engagement Score</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {performance.engagementScore}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-sm font-bold text-slate-500">Readability Score</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {performance.readabilityScore}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-black text-slate-950">AI Recommendations</h3>
            <ul className="mt-4 space-y-3">
              {performance.recommendations.map((recommendation, index) => (
                <li
                  key={`${recommendation}-${index}`}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
