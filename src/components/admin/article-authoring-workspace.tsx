"use client";
import { FilePenLine, Sparkles } from "lucide-react";
import { useState } from "react";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { MultiAIDraftWorkspace } from "@/components/admin/multi-ai-draft-workspace";
type WriterMode = "ai" | "manual";
export function ArticleAuthoringWorkspace() {
  const [writerMode, setWriterMode] = useState<WriterMode>("manual");
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setWriterMode("ai")}
            className={[
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              writerMode === "ai"
                ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100"
                : "border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <Sparkles className="mt-0.5 h-5 w-5 text-violet-600" />
            <span>
              <span className="block font-black text-slate-950">AI Article Writer</span>
              <span className="mt-1 block text-sm text-slate-600">
                AI draft generate karein aur rich editor mein edit karke publish karein.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setWriterMode("manual")}
            className={[
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              writerMode === "manual"
                ? "border-slate-900 bg-slate-50 ring-2 ring-slate-100"
                : "border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <FilePenLine className="mt-0.5 h-5 w-5 text-slate-800" />
            <span>
              <span className="block font-black text-slate-950">
                Manual Article Writer
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Article manually likhein aur complete formatting tools use karein.
              </span>
            </span>
          </button>
        </div>
      </section>
      {writerMode === "ai" ? <MultiAIDraftWorkspace /> : null}
      <section id="article-editor" className="scroll-mt-24">
        <ArticleEditorForm mode="new" />
      </section>
    </div>
  );
}
