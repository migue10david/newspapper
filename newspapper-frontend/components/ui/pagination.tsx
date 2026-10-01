import Link from "next/link";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  createHref: (page: number) => string;
  className?: string;
}

export function Pagination({ currentPage, totalPages, createHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {currentPage > 1 ? <PaginationLink href={createHref(currentPage - 1)}>Anterior</PaginationLink> : null}
      <span className="px-2 text-sm text-muted" aria-current="page">Página {currentPage} de {totalPages}</span>
      {currentPage < totalPages ? <PaginationLink href={createHref(currentPage + 1)}>Siguiente</PaginationLink> : null}
    </nav>
  );
}

function PaginationLink({ href, children }: { href: string; children: string }) {
  return (
    <Link className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-muted sm:min-h-9" href={href} scroll={false}>
      {children}
    </Link>
  );
}
