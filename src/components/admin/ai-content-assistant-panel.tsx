"use client";
import { useState } from "react";
type AssistantAction = "rewrite" | "improve" | "expand" | "simplify";
type AIContentAssistantPanelProps = {
  title: string;
  content: string;
  onUpdated: (result: { title: string; content: string; suggestions: string[] }) => void;
};
export function AIContentAssistantPanel({
  title,
  content,
  onUpdated,
}: AIContentAssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const runAssistant = async (action: AssistantAction) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/articles/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          action,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || "AI assistant failed.");
        return;
      }
      onUpdated(result.result);
      setMessage("AI content update completed.");
    } catch {
      setMessage("Unable to run AI assistant.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        AI Assistant
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Smart Content Editing</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          {
            label: "Rewrite",
            action: "rewrite",
          },
          {
            label: "Improve",
            action: "improve",
          },
          {
            label: "Expand",
            action: "expand",
          },
          {
            label: "Simplify",
            action: "simplify",
          },
        ].map((item) => (
          <button
            key={item.action}
            type="button"
            disabled={loading}
            onClick={() => runAssistant(item.action as AssistantAction)}
            className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      {message ? (
        <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
    </section>
  );
}
