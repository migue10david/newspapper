'use client';

import Link from 'next/link';

import { Alert } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/lib/auth-store';
import { useAdminComments, useManagedNews } from '@/lib/admin-queries';
import type { ManagedNews, NewsStatus } from '@/lib/news-api';

const statusLabels: Record<NewsStatus, string> = {
  draft: 'Borradores',
  inReview: 'En revisión',
  scheduled: 'Programadas',
  published: 'Publicadas',
  archived: 'Archivadas',
};

const statusVariants: Record<NewsStatus, BadgeProps['variant']> = {
  draft: 'secondary',
  inReview: 'warning',
  scheduled: 'outline',
  published: 'success',
  archived: 'secondary',
};

const trackedStatuses: NewsStatus[] = ['draft', 'inReview', 'scheduled', 'published'];

export function AdminDashboardContent() {
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);
  const canModerate = role === 'editor' || role === 'admin';
  const newsQuery = useManagedNews();
  const commentsQuery = useAdminComments({ page: 1, size: 5, status: 'pending' }, canModerate);
  const news = newsQuery.data ?? [];
  const counts = countByStatus(news);
  const recentNews = [...news].sort((left, right) => getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt)).slice(0, 5);
  const displayName = email?.split('@')[0] ?? 'equipo editorial';
  const hasError = newsQuery.error || (canModerate ? commentsQuery.error : null);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Centro de operaciones"
        title={`Buenos días, ${displayName}`}
        description="Una vista rápida del trabajo editorial y de las decisiones que necesitan tu atención."
        actions={<Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-brand-strong" href="/admin/news/new">Nueva noticia <span aria-hidden="true">+</span></Link>}
      />

      {hasError ? <Alert variant="danger" title="No se pudo cargar todo el resumen">Actualiza la página o abre directamente la sección que necesitas para continuar trabajando.</Alert> : null}

      {newsQuery.isPending ? <LoadingState label="Preparando resumen editorial…" /> : null}

      {!newsQuery.isPending ? <>
        <section aria-label="Resumen de noticias" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trackedStatuses.map((status) => <StatusCard count={counts[status]} label={statusLabels[status]} status={status} key={status} />)}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.75fr)]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-surface-subtle sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Actividad reciente</p><CardTitle className="mt-2">Últimas historias actualizadas</CardTitle></div>
              <Link className="text-sm font-semibold text-brand hover:underline" href="/admin/news">Ver todas →</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentNews.length > 0 ? <div className="divide-y divide-border">{recentNews.map((item) => <RecentNewsItem item={item} key={item.id} />)}</div> : <EmptyState className="rounded-none border-0" title="Aún no hay historias" description="Crea la primera noticia para comenzar el flujo editorial." action={<Link className="font-semibold text-brand hover:underline" href="/admin/news/new">Crear una noticia</Link>} />}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-brand/30 bg-brand-soft/40">
              <CardHeader><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Trabajo pendiente</p><CardTitle className="mt-2">Lo que merece atención</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <AttentionRow label="Historias en revisión" value={counts.inReview} href="/admin/news?status=inReview" />
                <AttentionRow label="Borradores" value={counts.draft} href="/admin/news?status=draft" />
                {canModerate ? <AttentionRow label="Comentarios pendientes" value={commentsQuery.data?.total ?? 0} href="/admin/comments" /> : null}
                {counts.inReview === 0 && counts.draft === 0 && (!canModerate || commentsQuery.data?.total === 0) ? <p className="text-sm leading-6 text-muted">No hay tareas urgentes. Puedes preparar una nueva historia o consultar el catálogo.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Accesos rápidos</p><CardTitle className="mt-2">Sigue trabajando</CardTitle></CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <QuickLink href="/admin/news" label="Abrir sala editorial" detail="Buscar y filtrar historias" />
                {role === 'editor' || role === 'admin' ? <QuickLink href="/admin/catalog" label="Gestionar catálogo" detail="Categorías y tags" /> : null}
                {role === 'admin' ? <QuickLink href="/admin/users" label="Revisar usuarios" detail="Roles y perfiles" /> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </> : null}
    </section>
  );
}

function StatusCard({ count, label, status }: { count: number; label: string; status: NewsStatus }) {
  return <Card className="relative overflow-hidden"><div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${status === 'inReview' ? 'bg-warning' : status === 'published' ? 'bg-success' : 'bg-brand'}`} /><CardHeader className="pb-3"><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">{label}</CardTitle><Badge variant={statusVariants[status]}>{status === 'inReview' ? 'Atención' : 'Estado'}</Badge></div></CardHeader><CardContent><p className="font-display-editorial text-4xl font-bold leading-none">{count}</p><Link className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline" href={`/admin/news?status=${status}`}>Ver historias <span aria-hidden="true" className="ml-1">→</span></Link></CardContent></Card>;
}

function RecentNewsItem({ item }: { item: ManagedNews }) {
  return <article className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariants[item.status]}>{statusLabels[item.status]}</Badge><span className="text-xs text-muted">{item.categoryName}</span></div><h3 className="mt-2 truncate font-display-editorial text-xl font-bold leading-tight">{item.title}</h3><p className="mt-1 text-sm text-muted">{item.authorName} · Actualizada {formatDate(item.updatedAt)}</p></div><Link className="inline-flex min-h-11 shrink-0 items-center self-start rounded-md border border-border px-3 text-sm font-semibold hover:border-brand hover:text-brand sm:self-center" href={`/admin/news/${item.id}`}>Abrir</Link></article>;
}

function AttentionRow({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-brand/15 bg-surface/70 px-3 py-2 transition-colors hover:border-brand hover:bg-surface" href={href}><span className="text-sm font-semibold">{label}</span><span className="font-display-editorial text-2xl font-bold text-brand">{value}</span></Link>;
}

function QuickLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return <Link className="group rounded-md border border-border px-3 py-3 transition-colors hover:border-brand hover:bg-brand-soft/40" href={href}><span className="block text-sm font-semibold group-hover:text-brand">{label} <span aria-hidden="true">↗</span></span><span className="mt-1 block text-xs text-muted">{detail}</span></Link>;
}

function countByStatus(news: ManagedNews[]): Record<NewsStatus, number> {
  return news.reduce<Record<NewsStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { draft: 0, inReview: 0, scheduled: 0, published: 0, archived: 0 });
}

function getTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'fecha no disponible' : new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(date);
}
