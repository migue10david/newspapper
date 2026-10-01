'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import {
  useCreateComment,
  usePublicInteractions,
  useRemoveComment,
  useRemoveReaction,
  useSetReaction,
  useUpdateComment,
} from '@/lib/interaction-queries';
import type { PublicComment, ReactionType } from '@/lib/interactions-api';

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Escribe un comentario.').max(2000, 'El comentario no puede superar los 2000 caracteres.'),
});
type CommentForm = z.infer<typeof commentSchema>;

const reactionLabels: Record<ReactionType, string> = { like: 'Me gusta', useful: 'Útil' };

export function PublicInteractions({ newsId, slug }: { newsId: string; slug: string }) {
  const query = usePublicInteractions(slug);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.userId);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initialize = useAuthStore((state) => state.initialize);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (!isInitialized) void initialize();
  }, [initialize, isInitialized]);

  const createComment = useCreateComment(slug);
  const setReaction = useSetReaction(slug);
  const removeReaction = useRemoveReaction(slug);
  const isMutatingReaction = setReaction.isPending || removeReaction.isPending;

  async function handleReaction(type: ReactionType) {
    if (!accessToken) return;
    try {
      if (activeReaction === type) {
        await removeReaction.mutateAsync(newsId);
        setActiveReaction(null);
      } else {
        await setReaction.mutateAsync({ newsId, type });
        setActiveReaction(type);
      }
    } catch {
      // The mutation error is rendered below without interrupting the article.
    }
  }

  return (
    <section className="mt-12 border-t-4 border-brand pt-8 sm:mt-16" aria-labelledby="interactions-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">La conversación</p>
          <h2 className="mt-2 font-display-editorial text-3xl font-bold tracking-tight" id="interactions-title">¿Qué te dejó esta noticia?</h2>
        </div>
        <Badge variant="secondary">{query.data?.totalComments ?? 0} comentarios</Badge>
      </div>

      <div className="mt-6 flex flex-wrap gap-3" aria-label="Reacciones">
        {(['like', 'useful'] as const).map((type) => (
          <button
            aria-pressed={activeReaction === type}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeReaction === type ? 'border-brand bg-brand text-white' : 'border-border bg-surface hover:border-brand hover:text-brand'} ${!accessToken ? 'cursor-not-allowed opacity-60' : ''}`}
            disabled={!accessToken || isMutatingReaction}
            key={type}
            onClick={() => void handleReaction(type)}
            type="button"
          >
            <span aria-hidden="true">{type === 'like' ? '♥' : '✦'}</span>
            {reactionLabels[type]}
            <span className="tabular-nums">{query.data?.reactions[type] ?? 0}</span>
          </button>
        ))}
      </div>

      {!isInitialized ? <p className="mt-3 text-sm text-muted">Comprobando tu sesión…</p> : null}
      {isInitialized && !accessToken ? <p className="mt-3 text-sm text-muted">Inicia sesión para participar en la conversación. <Link className="font-semibold text-brand underline underline-offset-4" href="/admin/login">Entrar</Link></p> : null}
      {setReaction.error || removeReaction.error ? <Alert className="mt-4" variant="danger">{getErrorMessage(setReaction.error ?? removeReaction.error)}</Alert> : null}

      <CommentComposer newsId={newsId} mutation={createComment} />

      <div className="mt-8 space-y-4">
        {query.isPending ? <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted">Cargando comentarios…</p> : null}
        {query.error ? <Alert variant="danger" title="No se pudieron cargar las interacciones">{getErrorMessage(query.error)}</Alert> : null}
        {query.data && query.data.comments.length === 0 ? <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted">Todavía no hay comentarios publicados. Sé la primera persona en participar.</p> : null}
        {query.data?.comments.map((comment) => <CommentCard comment={comment} key={comment.id} slug={slug} userId={userId} />)}
      </div>
    </section>
  );
}

function CommentComposer({ newsId, mutation }: { newsId: string; mutation: ReturnType<typeof useCreateComment> }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });
  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync({ newsId, body: values.body });
    reset();
  });

  if (!accessToken) return null;
  return <form className="mt-8 rounded-lg border border-border bg-surface-muted p-5" noValidate onSubmit={onSubmit}>
    <label className="text-sm font-semibold" htmlFor="new-comment">Añade tu comentario</label>
    <textarea {...register('body')} aria-describedby={errors.body ? 'new-comment-error' : undefined} aria-invalid={errors.body ? 'true' : 'false'} className="mt-3 min-h-28 w-full rounded-md border border-border bg-surface px-3 py-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" id="new-comment" placeholder="Escribe una opinión respetuosa…" />
    {errors.body ? <p className="mt-2 text-sm text-danger" id="new-comment-error" role="alert">{errors.body.message}</p> : null}
    {mutation.error ? <Alert className="mt-3" variant="danger">{getErrorMessage(mutation.error)}</Alert> : null}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Tu comentario quedará pendiente de moderación.</p><Button disabled={mutation.isPending} isLoading={mutation.isPending} type="submit">Publicar comentario</Button></div>
  </form>;
}

function CommentCard({ comment, slug, userId }: { comment: PublicComment; slug: string; userId: string | null }) {
  const isOwner = Boolean(userId && comment.author.id === userId);
  const updateMutation = useUpdateComment(slug);
  const removeMutation = useRemoveComment(slug);
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>({ resolver: zodResolver(commentSchema), defaultValues: { body: comment.body } });

  async function update(values: CommentForm) {
    await updateMutation.mutateAsync({ id: comment.id, body: values.body, version: comment.version });
    reset(values);
    setIsEditing(false);
  }

  async function remove() {
    if (!window.confirm('¿Quieres retirar este comentario?')) return;
    await removeMutation.mutateAsync(comment.id);
  }

  return <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{comment.author.displayName}</p><time className="text-xs uppercase tracking-[0.12em] text-muted" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div>{isOwner ? <div className="flex gap-2"><Button onClick={() => setIsEditing((value) => !value)} size="sm" type="button" variant="ghost">{isEditing ? 'Cancelar' : 'Editar'}</Button><Button disabled={removeMutation.isPending} onClick={() => void remove()} size="sm" type="button" variant="ghost">Retirar</Button></div> : null}</div>
    {isEditing ? <form className="mt-4" onSubmit={handleSubmit(update)}><textarea {...register('body')} className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-3 text-base" />{errors.body ? <p className="mt-2 text-sm text-danger">{errors.body.message}</p> : null}<Button className="mt-3" size="sm" type="submit">Guardar cambio</Button></form> : <p className="mt-4 whitespace-pre-wrap leading-7 text-foreground">{comment.body}</p>}
    {updateMutation.error || removeMutation.error ? <Alert className="mt-3" variant="danger">{getErrorMessage(updateMutation.error ?? removeMutation.error)}</Alert> : null}
  </article>;
}

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es', { day: '2-digit', month: 'long', year: 'numeric' }).format(date); }
function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'No se pudo completar la operación.'; }
