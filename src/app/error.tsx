"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function AppError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "knowledge-nest",
        level: "error",
        event: "application_render_failure",
        errorType: error.name || "Error",
        digest: error.digest ?? null,
      }),
    );
  }, [error]);
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Knowledge Nest
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">
          This page could not load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A temporary application error occurred. You can retry the request safely.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900"
          >
            Go to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
