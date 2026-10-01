/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { api, type NewsListItem } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-api";

const PAGE_SIZE = 10;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = formatCategoryName(slug);
  const description = `Noticias publicadas de la categoría ${categoryName}.`;
  return { title: categoryName, description, alternates: { canonical: getSiteUrl(`/categoria/${encodeURIComponent(slug)}`) }, openGraph: { title: `${categoryName} | Periódico`, description, url: getSiteUrl(`/categoria/${encodeURIComponent(slug)}`), siteName: "Periódico", locale: "es_ES", type: "website" } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const currentPage = normalizePage(resolvedSearchParams?.page);
  const categoryName = formatCategoryName(slug);
  const news = await api.listNews({ category: slug, page: currentPage, size: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(news.total / news.size));

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Sección" title={categoryName} description={`${news.total} noticias publicadas en esta categoría.`} />
      {news.items.length > 0 ? <section aria-label={`Noticias de ${categoryName}`} className="grid gap-x-8 gap-y-7 md:grid-cols-2">{news.items.map((item) => <CategoryNewsArticle key={item.id} item={item} />)}</section> : <EmptyState title="No hay noticias en esta categoría" description="Prueba otra categoría o vuelve a la portada para consultar todas las noticias." action={<Link className="font-semibold text-brand hover:underline" href="/">Ir a la portada</Link>} />}
      <Pagination currentPage={currentPage} totalPages={totalPages} createHref={(page) => createPageHref(slug, page)} />
    </div>
  );
}

function CategoryNewsArticle({ item }: { item: NewsListItem }) {
  return <article className="group border-b border-border pb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{formatDate(item.publishedAt)}</p><h2 className="mt-2 font-display-editorial text-2xl font-bold leading-tight group-hover:text-brand"><Link href={`/noticia/${item.slug}`}>{item.title}</Link></h2>{resolveMediaUrl(item.imageUrl) ? <img className="mt-4 aspect-[16/9] w-full rounded-md object-cover" src={resolveMediaUrl(item.imageUrl) ?? undefined} alt={item.imageAlt ?? item.title} /> : null}<p className="mt-3 text-base leading-7 text-muted">{item.summary}</p><Link className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand hover:underline" href={`/noticia/${item.slug}`}>Leer noticia →</Link></article>;
}

function normalizePage(page: string | string[] | undefined): number { const value = Array.isArray(page) ? page[0] : page; const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }
function createPageHref(slug: string, page: number): string { const path = `/categoria/${encodeURIComponent(slug)}`; return page <= 1 ? path : `${path}?page=${page}`; }
function formatCategoryName(slug: string): string { return decodeURIComponent(slug).split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date); }
function getSiteUrl(path: string): string { const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"; return `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}${path}`; }
