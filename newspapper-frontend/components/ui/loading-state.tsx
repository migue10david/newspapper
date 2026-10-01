import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Cargando contenido", className }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-surface-subtle px-6 py-10 text-center", className)} role="status" aria-live="polite">
      <span aria-hidden="true" className="ui-loading h-3 w-32 rounded-full" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
