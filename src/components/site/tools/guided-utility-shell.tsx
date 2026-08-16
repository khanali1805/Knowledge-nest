"use client";
import { useMemo, useState, type ReactNode } from "react";
export type GuidedUtilityStep = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  helper: string;
};
type GuidedUtilityShellProps = {
  categoryName: string;
  title: string;
  description: string;
  steps: readonly GuidedUtilityStep[];
  stepContent?: readonly ReactNode[];
  children: ReactNode;
};
export function GuidedUtilityShell({
  categoryName,
  title,
  description,
  steps,
  stepContent,
  children,
}: GuidedUtilityShellProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const safeSteps =
    steps.length > 0
      ? steps
      : [
          {
            id: "plan",
            eyebrow: "Step 1",
            title: "Build your plan",
            description: "Add the details that matter to your goal.",
            helper: "Use the planner below to shape your next practical action.",
          },
        ];
  const currentStep = safeSteps[currentStepIndex] ?? safeSteps[0];
  const currentStepContent = stepContent?.[currentStepIndex] ?? null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === safeSteps.length - 1;
  const progress = useMemo(
    () => Math.round(((currentStepIndex + 1) / safeSteps.length) * 100),
    [currentStepIndex, safeSteps.length],
  );
  function goBack() {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  }
  function goForward() {
    setCurrentStepIndex((index) => Math.min(safeSteps.length - 1, index + 1));
  }
  return (
    <div className="space-y-8">
      <section className="via-background dark:via-background overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 p-5 shadow-sm sm:p-7 dark:border-violet-900 dark:from-violet-950/30 dark:to-fuchsia-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              {categoryName} guided workspace
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              {description}
            </p>
          </div>
          <div className="bg-background/90 min-w-40 rounded-2xl border border-violet-200 px-4 py-3 dark:border-violet-900">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Progress
            </p>
            <p className="mt-1 text-2xl font-bold">{progress}%</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Step {currentStepIndex + 1} of {safeSteps.length}
            </p>
          </div>
        </div>
        <div
          className="mt-6 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {safeSteps.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            const isComplete = index < currentStepIndex;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(index)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={[
                    "h-full w-full rounded-2xl border p-4 text-left transition",
                    isCurrent
                      ? "border-violet-500 bg-violet-100/80 dark:bg-violet-950/50"
                      : isComplete
                        ? "bg-background border-violet-200 dark:border-violet-900"
                        : "border-border bg-background/70 hover:border-violet-300",
                  ].join(" ")}
                >
                  <span className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase">
                    {step.eyebrow}
                  </span>
                  <span className="mt-1 block text-sm font-bold">{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="bg-background mt-6 rounded-2xl border border-violet-200 p-5 sm:p-6 dark:border-violet-900">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            {currentStep.eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{currentStep.title}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {currentStep.description}
          </p>
          <div className="bg-muted/50 mt-4 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wide uppercase">
              What to do here
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {currentStep.helper}
            </p>
          </div>
          {currentStepContent ? <div className="mt-5">{currentStepContent}</div> : null}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirstStep}
              className="border-border rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={goForward}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Continue
              </button>
            ) : stepContent ? (
              <span className="rounded-xl bg-violet-100 px-5 py-2.5 text-center text-sm font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                Final step
              </span>
            ) : (
              <a
                href="#utility-workspace"
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-700"
              >
                Open planner workspace
              </a>
            )}
          </div>
        </div>
      </section>
      {stepContent ? null : (
        <section id="utility-workspace" className="scroll-mt-24">
          {children}
        </section>
      )}
    </div>
  );
}
