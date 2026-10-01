'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAdminComments,
  useModerateCommentMutation,
} from '@/lib/admin-queries';
import type { CommentStatus, ManageComment } from '@/lib/interactions-api';

const statusLabels: Record<CommentStatus, string> = {
  pending: 'Pendiente',
  published: 'Publicado',
  hidden: 'Oculto',
};

const statusVariants: Record<CommentStatus, BadgeProps['variant']> = {
  pending: 'warning',
  published: 'success',
  hidden: 'secondary',
};

function getStatusLabel(comment: ManageComment): string {
  return comment.deletedAt ? 'Eliminado' : statusLabels[comment.status];
}

function getStatusVariant(comment: ManageComment): BadgeProps['variant'] {
  return comment.deletedAt ? 'danger' : statusVariants[comment.status];
}

export function AdminCommentsContent() {
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const [status, setStatus] = useState<CommentStatus | undefined>('pending');
  const [page, setPage] = useState(1);
  const params = { page, size: 20, ...(status ? { status } : {}) };
  const query = useAdminComments(params);
  const moderation = useModerateCommentMutation();

  useEffect(() => {
    if (role && role !== 'editor' && role !== 'admin') {
      router.replace('/admin/news');
    }
  }, [role, router]);

  if (!role || (role !== 'editor' && role !== 'admin')) {
    return <LoadingState label="Verificando permisos…" />;
  }

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.size)) : 1;

  async function changeStatus(comment: ManageComment, nextStatus: CommentStatus) {
    try {
      await moderation.mutateAsync({ id: comment.id, status: nextStatus, version: comment.version });
    } catch {
      // The mutation error is shown in the alert below.
    }
  }

  return <section className="space-y-8">
    <PageHeader eyebrow="Conversación editorial" title="Moderación de comentarios" description="Revisa la conversación que acompaña a las noticias y decide qué merece aparecer publicado." actions={<label className="block min-w-48 text-sm font-semibold" htmlFor="comment-status">Filtrar por estado<Select className="mt-2" id="comment-status" onChange={(event) => { setStatus(event.target.value ? event.target.value as CommentStatus : undefined); setPage(1); }} value={status ?? ''}><option value="pending">Pendientes</option><option value="published">Publicados</option><option value="hidden">Ocultos</option><option value="">Todos</option></Select></label>} />
    {query.error || moderation.error ? <Alert variant="danger" title="No se pudo completar la operación">{getErrorMessage(query.error ?? moderation.error)}</Alert> : null}
    {query.isPending ? <LoadingState label="Cargando comentarios…" /> : null}
    {query.data && query.data.items.length === 0 ? <EmptyState title="No hay comentarios en este estado" description="Prueba otro filtro o vuelve más tarde para revisar nuevas participaciones." /> : null}
    {query.data && query.data.items.length > 0 ? <>
      <div className="grid gap-4 lg:grid-cols-2" aria-live="polite">
        {query.data.items.map((comment) => <ModerationCard comment={comment} isBusy={moderation.isPending} key={comment.id} onStatusChange={changeStatus} />)}
      </div>
      <nav aria-label="Paginación de comentarios" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted">Página {query.data.page} de {totalPages} · {query.data.total} comentarios</p>
        <div className="flex gap-2"><Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} size="sm" type="button" variant="outline">Anterior</Button><Button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} size="sm" type="button" variant="outline">Siguiente</Button></div>
      </nav>
    </> : null}
  </section>;
}

function ModerationCard({ comment, isBusy, onStatusChange }: { comment: ManageComment; isBusy: boolean; onStatusChange: (comment: ManageComment, status: CommentStatus) => Promise<void> }) {
  const action = comment.status === 'published' ? 'hidden' : 'published';
  const actionLabel = action === 'published' ? 'Publicar comentario' : 'Ocultar comentario';
  return <article className="rounded-lg border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-md sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{comment.newsTitle}</p><p className="mt-1 font-semibold">{comment.authorName}</p></div><Badge variant={getStatusVariant(comment)}>{getStatusLabel(comment)}</Badge></div>
    <blockquote className="mt-5 border-l-2 border-brand pl-4 leading-7 text-foreground">“{comment.body}”</blockquote>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><time className="text-xs text-muted" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>{!comment.deletedAt ? <div className="flex flex-wrap gap-2"><Button disabled={isBusy} isLoading={isBusy} onClick={() => void onStatusChange(comment, action)} size="sm" type="button" variant={action === 'published' ? 'default' : 'outline'}>{actionLabel}</Button>{comment.status !== 'pending' ? <Button disabled={isBusy} onClick={() => void onStatusChange(comment, 'pending')} size="sm" type="button" variant="ghost">Devolver a pendiente</Button> : null}</div> : <span className="text-xs text-muted">Conservado para trazabilidad</span>}</div>
  </article>;
}

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es', { day: '2-digit', month: 'long', year: 'numeric' }).format(date); }
function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'No se pudo completar la operación.'; }
