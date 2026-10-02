/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicInteractions } from "@/components/news/public-interactions";
import { ReaderEngagementActions } from "@/components/news/reader-engagement-actions";
import { ShareActions } from "@/components/news/share-actions";
import { api, type RichTextBlock } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-api";

interface NewsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await api.getNewsBySlug(slug);
  if (!news) notFound();
  const canonicalPath = `/noticia/${encodeURIComponent(news.slug)}`;
  return { title: news.title, description: news.summary, alternates: { canonical: getSiteUrl(canonicalPath) }, openGraph: { title: news.title, description: news.summary, url: getSiteUrl(canonicalPath), siteName: "Periódico", locale: "es_ES", type: "article", publishedTime: news.publishedAt, section: news.category.name, tags: news.tags.map((tag) => tag.name) } };
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { slug } = await params;
  const news = await api.getNewsBySlug(slug);
  if (!news) notFound();

  return (
    <article className="mx-auto max-w-5xl">
      <header className="border-b border-border pb-8">
        <Link className="text-xs font-bold uppercase tracking-[0.2em] text-brand hover:underline" href={`/categoria/${encodeURIComponent(news.category.slug)}`}>{news.category.name}</Link>
        <h1 className="mt-5 max-w-4xl font-display-editorial text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.98] tracking-tight">{news.title}</h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-muted sm:text-2xl">{news.summary}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 border-brand pl-4 text-sm text-muted">
          <span className="font-semibold text-foreground">{news.author.name}</span>
          <span aria-hidden="true" className="text-brand">·</span>
          <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time>
        </div>
      </header>

      {resolveMediaUrl(news.imageUrl) ? <figure className="mt-8"><img className="aspect-[16/7] w-full rounded-lg object-cover" src={resolveMediaUrl(news.imageUrl) ?? undefined} alt={news.imageAlt ?? news.title} /><figcaption className="mt-2 text-sm text-muted">{news.imageAlt ?? news.title}</figcaption></figure> : null}

      <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:py-14">
        <div className="min-w-0">
          <RichTextBody blocks={news.body} />
          {news.tags.length > 0 ? <div className="mt-12 border-t border-border pt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Etiquetas</p><ul className="mt-3 flex flex-wrap gap-2" aria-label="Etiquetas de la noticia">{news.tags.map((tag) => <li key={tag.id}><Badge variant="outline">{tag.name}</Badge></li>)}</ul></div> : null}
        </div>
        <aside className="lg:pt-2">
          <Card className="bg-surface-muted">
            <CardHeader><CardTitle>Sobre el autor</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{news.author.name}</p>
              {news.author.bio ? <p className="mt-2 text-sm leading-6 text-muted">{news.author.bio}</p> : <p className="mt-2 text-sm leading-6 text-muted">Equipo editorial de Periódico.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
      <ReaderEngagementActions newsId={news.id} />
      <ShareActions slug={news.slug} title={news.title} />
      <PublicInteractions newsId={news.id} slug={news.slug} />
    </article>
  );
}

function RichTextBody({ blocks }: { blocks: RichTextBlock[] }) {
  return <div className="max-w-[var(--content-reading)] space-y-7 text-[var(--type-reading-size)] leading-[var(--type-reading-leading)] text-foreground">{blocks.map((block, index) => <RichTextBlockView key={`${block.type}-${index}`} block={block} />)}</div>;
}

function RichTextBlockView({ block }: { block: RichTextBlock }) {
  switch (block.type) {
    case "heading": return <h2 className="pt-5 font-display-editorial text-[var(--type-h2-size)] font-bold leading-[var(--type-h2-leading)]">{block.text}</h2>;
    case "list": return <ul className="list-disc space-y-2 pl-7 marker:text-brand">{block.items?.map((item) => <li key={item}>{item}</li>)}</ul>;
    case "image":
      return block.url ? (
        <figure className="space-y-3">
          <img src={resolveMediaUrl(block.url) ?? block.url} alt={block.alt ?? "Imagen de la noticia"} className="h-auto w-full rounded-lg object-cover" />
          {block.alt ? <figcaption className="text-sm leading-6 text-muted">{block.alt}</figcaption> : null}
        </figure>
      ) : null;
    case "paragraph":
    default: return <p>{block.text}</p>;
  }
}

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(date); }
function getSiteUrl(path: string): string { const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"; return `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}${path}`; }
