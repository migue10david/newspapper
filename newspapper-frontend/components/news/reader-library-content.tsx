'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/lib/auth-store';
import {
  useClearReadingHistoryMutation,
  useReadingHistory,
  useRemoveReadingHistoryMutation,
  useSavedNews,
} from '@/lib/engagement-queries';
import { resolveMediaUrl } from '@/lib/media-api';
import type { EngagementNewsItem } from '@/lib/engagement-api';

const PAGE_SIZE = 10;

export function SavedNewsContent() {
  return <ReaderLibraryContent mode="saved" />;
}

export function ReadingHistoryContent() {
  return <ReaderLibraryContent mode="history" />;
}

function ReaderLibraryContent({ mode }: { mode: 'saved' | 'history' }) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialize = useAuthStore((state) => state.initialize);
  const [page, setPage] = useState(1);
  const savedQuery = useSavedNews({ page, size: PAGE_SIZE });
  const historyQuery = useReadingHistory({ page, size: PAGE_SIZE });
  const removeReading = useRemoveReadingHistoryMutation();
  const clearHistory = useClearReadingHistoryMutation();
  const query = mode === 'saved' ? savedQuery : historyQuery;
  const title = mode === 'saved' ? 'Noticias guardadas' : 'Mi historial de lectura';
  const description = mode === 'saved'
    ? 'Tu selección personal para volver a las historias que quieres conservar.'
    : 'Retoma las noticias que has leído recientemente.';

  useEffect(() => {
    if (!isInitialized) void initialize();
  }, [initialize, isInitialized]);

  if (!isInitialized) {
    return <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted">Comprobando tu sesión…</p>;
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Área personal" title={title} description={description} />
        <Alert title="Necesitas iniciar sesión">Inicia sesión para consultar tu actividad de lectura. <Link className="font-semibold text-brand underline underline-offset-4" href="/admin/login">Entrar</Link></Alert>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Área personal" title={title} description={description} />
      {query.isPending ? <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted">Cargando tus noticias…</p> : null}
      {query.error ? <Alert variant="danger" title="No se pudo cargar tu actividad">{getErrorMessage(query.error)}</Alert> : null}
      {mode === 'history' && query.data && query.data.total > 0 ? (
        <div className="flex justify-end"><Button disabled={clearHistory.isPending} isLoading={clearHistory.isPending} onClick={() => void clearHistory.mutateAsync()} type="button" variant="outline">Limpiar historial</Button></div>
      ) : null}
      {query.data && query.data.items.length === 0 ? <EmptyState title={mode === 'saved' ? 'Todavía no tienes noticias guardadas' : 'Tu historial está vacío'} description={mode === 'saved' ? 'Guarda una noticia desde su página para encontrarla aquí.' : 'Cuando leas una noticia publicada aparecerá en este espacio.'} action={<Link className="font-semibold text-brand hover:underline" href="/">Volver a la portada</Link>} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        {query.data?.items.map((item) => <ReaderNewsCard key={item.id} item={item} mode={mode} onRemove={mode === 'history' ? () => void removeReading.mutateAsync(item.id) : undefined} isRemoving={removeReading.isPending} />)}
      </div>
      {totalPages > 1 ? <div className="flex items-center justify-center gap-3" aria-label="Paginación"><Button disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button" variant="outline">Anterior</Button><span className="text-sm text-muted">Página {page} de {totalPages}</span><Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} type="button" variant="outline">Siguiente</Button></div> : null}
    </div>
  );
}

function ReaderNewsCard({ item, mode, onRemove, isRemoving }: { item: EngagementNewsItem; mode: 'saved' | 'history'; onRemove?: () => void; isRemoving: boolean }) {
  const imageUrl = resolveMediaUrl(item.imageUrl);
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      {imageUrl ? <img className="aspect-[16/8] w-full object-cover" src={imageUrl} alt={item.imageAlt ?? item.title} /> : <div className="flex aspect-[16/8] items-center justify-center bg-surface-muted text-xs font-bold uppercase tracking-[0.16em] text-muted">Sin imagen</div>}
      <div className="space-y-3 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{mode === 'saved' ? `Guardada ${formatDate(item.savedAt)}` : `Leída ${formatDate(item.lastReadAt)}`}</p>
        <h2 className="font-display-editorial text-2xl font-bold leading-tight"><Link className="hover:text-brand" href={`/noticia/${item.slug}`}>{item.title}</Link></h2>
        <p className="line-clamp-3 text-sm leading-6 text-muted">{item.summary}</p>
        <div className="flex flex-wrap items-center justify-between gap-3"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline" href={`/noticia/${item.slug}`}>Leer noticia →</Link>{onRemove ? <Button disabled={isRemoving} onClick={onRemove} size="sm" type="button" variant="ghost">Quitar</Button> : null}</div>
      </div>
    </article>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return 'ahora';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ahora' : new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo conectar con la API.';
}
