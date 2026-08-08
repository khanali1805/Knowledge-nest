import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};
export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="border-border bg-muted/20 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center">
      <span className="border-border bg-background inline-flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm">
        <Icon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
