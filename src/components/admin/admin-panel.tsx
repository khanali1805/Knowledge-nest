import type { HTMLAttributes, ReactNode } from "react";
type AdminPanelProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};
export function AdminPanel({
  title,
  description,
  actions,
  children,
  className = "",
  ...props
}: AdminPanelProps) {
  return (
    <section
      className={[
        "border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-bold tracking-tight">{title}</h2> : null}
            {description ? (
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
