import type { ReactNode } from "react";
type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl min-w-0">
          {eyebrow ? (
            <p className="text-muted-foreground text-xs font-bold tracking-[0.16em] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description ? (
            <p className="text-muted-foreground mt-2 text-sm leading-6 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
