import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex min-h-11 w-full rounded-md border bg-surface px-3 py-2 text-base text-foreground shadow-sm transition-colors placeholder:text-muted",
        "border-border focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm",
        hasError ? "border-danger focus-visible:border-danger" : null,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
