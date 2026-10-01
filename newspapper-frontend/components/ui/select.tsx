import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ className, hasError = false, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex min-h-11 w-full appearance-none rounded-md border bg-surface px-3 py-2 text-base text-foreground shadow-sm transition-colors",
        "border-border focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm",
        hasError ? "border-danger focus-visible:border-danger" : null,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
