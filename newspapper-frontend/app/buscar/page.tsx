/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { api, type NewsListItem, type PublicTaxonomyItem } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-api";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Buscar noticias",
  description: "Busca noticias publicadas por texto y filtros editoriales.",
};

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

interface Filters {
  page: number;
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
  from?: string;
  to?: string;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters = readFilters(params ?? {});
  const [result, categories, tags] = await Promise.all([
    api.listNews({ ...filters, size: PAGE_SIZE }).then(
      (value) => ({ value, error: null as string | null }),
      (reason: unknown) => ({ value: emptyResult(filters.page), error: getErrorMessage(reason) }),
    ),
    api.listCategories().catch(() => [] as PublicTaxonomyItem[]),
    api.listTags().catch(() => [] as PublicTaxonomyItem[]),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.value.total / result.value.size));

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Archivo editorial" title="Buscar noticias" description="Encuentra publicaciones por tema, catálogo, autor o fecha." />

      <form className="rounded-lg border border-border bg-surface-muted p-5 sm:p-6" method="get">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 lg:col-span-4">
            <span className="text-sm font-semibold">Texto libre</span>
            <Input className="mt-2" defaultValue={filters.q} name="q" placeholder="Título, resumen o autor" />
          </label>
          <label><span className="text-sm font-semibold">Categoría</span><Select className="mt-2" defaultValue={filters.category} name="category"><option value="">Todas</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label>
          <label><span className="text-sm font-semibold">Tag</span><Select className="mt-2" defaultValue={filters.tag} name="tag"><option value="">Todos</option>{tags.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label>
          <label><span className="text-sm font-semibold">Autor (UUID)</span><Input className="mt-2" defaultValue={filters.author} name="author" placeholder="Identificador del autor" /></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-semibold">Desde</span><Input className="mt-2" defaultValue={filters.from} name="from" type="date" /></label><label><span className="text-sm font-semibold">Hasta</span><Input className="mt-2" defaultValue={filters.to} name="to" type="date" /></label></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="inline-flex min-h-11 items-center rounded-md bg-brand px-5 font-semibold text-white hover:bg-brand-strong" type="submit">Buscar</button>
          <Link className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-muted hover:text-brand" href="/buscar">Limpiar filtros</Link>
        </div>
      </form>

      {result.error ? <Alert variant="danger" title="No se pudo completar la búsqueda">{result.error}</Alert> : null}
      <section aria-live="polite" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Resultados</p><h2 className="mt-1 font-display-editorial text-2xl font-bold">Noticias encontradas</h2></div>
          <Badge variant="secondary">{result.value.total} noticias</Badge>
        </div>
        {result.value.items.length === 0 ? <EmptyState title="No encontramos noticias" description="Prueba con otros términos o elimina algún filtro." action={<Link className="font-semibold text-brand hover:underline" href="/">Volver a la portada</Link>} /> : result.value.items.map((item) => <SearchResult key={item.id} item={item} />)}
      </section>
      <Pagination currentPage={filters.page} totalPages={totalPages} createHref={(page) => createSearchHref(filters, page)} />
    </div>
  );
}

function SearchResult({ item }: { item: NewsListItem }) {
  return <article className="group border-b border-border pb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{formatDate(item.publishedAt)}</p><h3 className="mt-2 font-display-editorial text-2xl font-bold leading-tight group-hover:text-brand"><Link href={`/noticia/${item.slug}`}>{item.title}</Link></h3>{resolveMediaUrl(item.imageUrl) ? <img className="mt-4 aspect-[16/7] w-full rounded-md object-cover" src={resolveMediaUrl(item.imageUrl) ?? undefined} alt={item.imageAlt ?? item.title} /> : null}<p className="mt-3 max-w-3xl text-base leading-7 text-muted">{item.summary}</p><Link className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand hover:underline" href={`/noticia/${item.slug}`}>Leer noticia →</Link></article>;
}

function readFilters(params: Record<string, string | string[] | undefined>): Filters {
  const value = (key: string) => { const item = params[key]; return Array.isArray(item) ? item[0] : item; };
  const parsedPage = Number(value("page"));
  return { page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1, q: value("q"), category: value("category"), tag: value("tag"), author: value("author"), from: value("from"), to: value("to") };
}

function createSearchHref(filters: Filters, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (key !== "page" && value) query.set(key, String(value));
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/buscar?${queryString}` : "/buscar";
}

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date); }
function emptyResult(page: number) { return { items: [], page, size: PAGE_SIZE, total: 0 }; }
function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : "No se pudo conectar con la API."; }
