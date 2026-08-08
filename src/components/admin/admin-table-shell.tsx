import type { ReactNode } from "react";
type AdminTableShellProps = {
  children: ReactNode;
};
export function AdminTableShell({ children }: AdminTableShellProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}
