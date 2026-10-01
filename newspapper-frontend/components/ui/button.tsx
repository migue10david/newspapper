import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand text-white shadow-sm hover:bg-brand-strong",
  secondary: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-700",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
  destructive: "bg-danger text-white shadow-sm hover:bg-red-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-11 px-4 py-2",
  sm: "min-h-11 px-3 py-2 text-sm sm:min-h-9",
  lg: "min-h-12 px-6 py-3 text-base",
  icon: "h-11 w-11 p-0 sm:h-9 sm:w-9",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200",
        "disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {isLoading ? <span className="sr-only">Cargando</span> : null}
      {children}
    </button>
  );
}
