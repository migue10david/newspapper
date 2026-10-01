import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-brand">{eyebrow}</p> : null}
        <h1 className="font-display-editorial text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
