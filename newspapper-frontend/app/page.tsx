/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { api, type NewsListItem } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-api";

const PAGE_SIZE = 10;
const SITE_DESCRIPTION = "Últimas noticias publicadas por el periódico, ordenadas por fecha de publicación.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portada",
  description: SITE_DESCRIPTION,
  alternates: { canonical: getSiteUrl("/") },
  openGraph: {
    title: "Portada | Periódico",
    description: SITE_DESCRIPTION,
    url: getSiteUrl("/"),
    siteName: "Periódico",
    locale: "es_ES",
    type: "website",
  },
};

interface HomeProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const currentPage = normalizePage(params?.page);
  const news = await api.listNews({ page: currentPage, size: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(news.total / news.size));
  const lead = news.items[0];
  const secondaryItems = news.items.slice(1);

  return (
    <div className="space-y-14 pb-4 sm:space-y-16">
      <header className="relative overflow-hidden border-y-2 border-foreground py-7 sm:py-9">
        <div className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden="true" />
        <div className="grid gap-8 pl-4 sm:pl-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end lg:gap-12">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
              <span>Portada</span>
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              <span className="text-muted">Edición del día</span>
            </div>
            <h1 className="max-w-5xl font-display-editorial text-[clamp(3rem,8vw,6.75rem)] font-bold leading-[0.88] tracking-[-0.045em]">
              Las noticias, reunidas para leer sin ruido.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Actualidad, contexto y criterio editorial en una portada pensada para descubrir lo importante.
            </p>
          </div>
          <div className="flex items-end justify-between gap-5 border-t border-border pt-4 text-sm text-muted lg:block lg:border-l lg:border-t-0 lg:pb-1 lg:pl-5 lg:pt-0">
            <div>
              <p className="font-display-editorial text-4xl font-bold leading-none text-foreground">{news.total}</p>
              <p className="mt-2 font-medium uppercase tracking-[0.12em]">Noticias publicadas</p>
            </div>
            <p className="text-right lg:mt-8 lg:text-left">Página {news.page} de {totalPages}</p>
          </div>
        </div>
      </header>

      {lead ? (
        <section aria-labelledby="featured-heading" className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
          <FeaturedArticle item={lead} />
          <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">En esta edición</p>
            <div className="mt-5 space-y-5">
              {secondaryItems.slice(0, 3).map((item, index) => <CompactArticle item={item} index={index} key={item.id} />)}
            </div>
          </aside>
        </section>
      ) : (
        <EmptyState title="No hay noticias publicadas" description="Cuando el equipo editorial publique contenido, aparecerá aquí." action={<Link className="font-semibold text-brand hover:underline" href="/buscar">Explorar búsqueda</Link>} />
      )}

      {secondaryItems.length > 3 ? (
        <section aria-labelledby="latest-heading" className="space-y-6">
          <div className="flex items-end justify-between border-b-2 border-foreground pb-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">Actualidad</p>
              <h2 id="latest-heading" className="font-display-editorial text-3xl font-bold tracking-tight sm:text-4xl">Más noticias</h2>
            </div>
            <span className="hidden text-sm text-muted sm:block">Lectura rápida</span>
          </div>
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {secondaryItems.slice(3).map((item) => <LatestArticle item={item} key={item.id} />)}
          </div>
        </section>
      ) : null}

      <Pagination currentPage={currentPage} totalPages={totalPages} createHref={createPageHref} />
    </div>
  );
}

function FeaturedArticle({ item }: { item: NewsListItem }) {
  const imageUrl = resolveMediaUrl(item.imageUrl);

  return (
    <article className="group border-b border-border pb-8">
      <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        <Badge className="rounded-none px-2.5 py-1">Principal</Badge>
        <span className="h-px w-5 bg-border" aria-hidden="true" />
        <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
      </div>
      <h2 id="featured-heading" className="max-w-4xl font-display-editorial text-[clamp(2.5rem,5.5vw,5rem)] font-bold leading-[0.94] tracking-[-0.035em]">
        <Link className="transition-colors group-hover:text-brand focus-visible:text-brand" href={`/noticia/${item.slug}`}>{item.title}</Link>
      </h2>
      {imageUrl ? <figure className="relative mt-7 overflow-hidden rounded-sm bg-surface-muted"><span className="sr-only">Imagen principal</span><img className="aspect-[16/8] w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.02]" src={imageUrl} alt={item.imageAlt ?? item.title} /></figure> : <div className="mt-7 flex min-h-24 items-center border-y border-dashed border-border bg-surface-muted px-5 text-sm font-medium uppercase tracking-[0.14em] text-muted">Lectura destacada de la edición</div>}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-3xl text-lg leading-8 text-muted sm:text-xl">{item.summary}</p>
        <Link className="inline-flex min-h-11 shrink-0 items-center rounded-sm bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" href={`/noticia/${item.slug}`}>Leer noticia <span className="ml-2" aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}

function CompactArticle({ item, index }: { item: NewsListItem; index?: number }) {
  const imageUrl = resolveMediaUrl(item.imageUrl);

  return (
    <article className="group border-b border-border pb-5 last:border-b-0">
      <div className="flex items-start gap-3">
        {index !== undefined ? <span className="font-display-editorial text-2xl font-bold leading-none text-brand" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span> : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{formatDate(item.publishedAt)}</p>
          <h3 className="mt-2 font-display-editorial text-xl font-bold leading-tight transition-colors group-hover:text-brand sm:text-2xl">
            <Link href={`/noticia/${item.slug}`}>{item.title}</Link>
          </h3>
        </div>
      </div>
      {imageUrl ? <img className="mt-4 aspect-[16/8] w-full rounded-sm object-cover" src={imageUrl} alt={item.imageAlt ?? item.title} /> : null}
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.summary}</p>
    </article>
  );
}

function LatestArticle({ item }: { item: NewsListItem }) {
  const imageUrl = resolveMediaUrl(item.imageUrl);

  return (
    <article className="group grid gap-4 border-b border-border pb-6 sm:grid-cols-[9rem_1fr] sm:gap-5">
      {imageUrl ? <img className="aspect-[16/10] w-full rounded-sm object-cover sm:row-span-2" src={imageUrl} alt={item.imageAlt ?? item.title} /> : <div className="hidden aspect-[16/10] items-center justify-center border border-dashed border-border bg-surface-muted text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted sm:flex">Sin imagen</div>}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{formatDate(item.publishedAt)}</p>
        <h3 className="mt-2 font-display-editorial text-xl font-bold leading-tight transition-colors group-hover:text-brand sm:text-2xl">
          <Link href={`/noticia/${item.slug}`}>{item.title}</Link>
        </h3>
      </div>
      <p className="line-clamp-2 text-sm leading-6 text-muted sm:col-start-2">{item.summary}</p>
    </article>
  );
}

function normalizePage(page: string | string[] | undefined): number {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function createPageHref(page: number): string {
  return page <= 1 ? "/" : `/?page=${page}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function getSiteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}${path}`;
}
