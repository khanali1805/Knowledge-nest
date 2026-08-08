"use client";
import { ProductionReadinessPanel } from "@/components/admin/production-readiness-panel";
export function ProductionReadinessSection() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <ProductionReadinessPanel />
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
          Deployment
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Production Readiness Summary
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          All production validation modules are connected into a single deployment
          readiness workflow. The application can now present configuration status,
          readiness checks, warnings and the final production summary from one interface.
        </p>
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-lg font-black text-emerald-700">
            Final Production Validation Workflow Connected
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            Environment • Database • Storage • API • Security
          </p>
        </div>
      </section>
    </div>
  );
}
