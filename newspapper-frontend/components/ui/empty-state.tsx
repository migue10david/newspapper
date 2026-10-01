import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle px-6 py-10 text-center", className)}>
      <span aria-hidden="true" className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">—</span>
      <h2 className="font-display-editorial text-xl font-bold">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
