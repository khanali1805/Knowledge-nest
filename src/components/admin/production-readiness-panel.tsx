"use client";
import { useState } from "react";
type ReadinessChecks = {
  environment: boolean;
  database: boolean;
  storage: boolean;
  api: boolean;
  security: boolean;
};
type ReadinessResult = {
  valid: boolean;
  checks: ReadinessChecks;
  warnings: string[];
};
export function ProductionReadinessPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const runValidation = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/system/production-readiness", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || "Production validation failed.");
        return;
      }
      setReadiness(result.readiness);
      setMessage(result.message);
    } catch {
      setMessage("Unable to validate production readiness.");
    } finally {
      setLoading(false);
    }
  };
  const checkItems = readiness ? Object.entries(readiness.checks) : [];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
        Production Readiness
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Final System Validation</h2>
      <p className="mt-3 text-sm text-slate-600">
        Validate the environment, database, storage, API and security configuration.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={runValidation}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Validating..." : "Run Production Validation"}
      </button>
      {message ? (
        <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </p>
      ) : null}
      {readiness ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-100 p-5">
            <p className="text-sm font-bold text-slate-500">Overall Status</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {readiness.valid ? "Production Ready" : "Attention Required"}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {checkItems.map(([name, status]) => (
              <div key={name} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-700 capitalize">{name}</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {status ? "Ready" : "Not Ready"}
                </p>
              </div>
            ))}
          </div>
          {readiness.warnings.length > 0 ? (
            <div>
              <h3 className="text-lg font-black text-slate-950">Warnings</h3>
              <ul className="mt-3 space-y-3">
                {readiness.warnings.map((warning, index) => (
                  <li
                    key={`${warning}-${index}`}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
