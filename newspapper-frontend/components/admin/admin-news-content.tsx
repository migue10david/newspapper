'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth-store';
import { useAdminCategories, useAdminTags, useManagedNewsSearch, useTransitionNewsMutation } from '@/lib/admin-queries';
import { canTransition } from '@/lib/news-permissions';
import type { ManagedNews, NewsSearchParams, NewsStatus } from '@/lib/news-api';

const statusLabels: Record<NewsStatus, string> = { draft: 'Borrador', inReview: 'En revisión', scheduled: 'Programada', published: 'Publicada', archived: 'Archivada' };
const statusVariants: Record<NewsStatus, 'secondary' | 'warning' | 'success' | 'danger' | 'default'> = { draft: 'secondary', inReview: 'warning', scheduled: 'default', published: 'success', archived: 'danger' };
const emptyFilters: NewsSearchParams = { page: 1, size: 10 };

export function AdminNewsContent() {
  const role = useAuthStore((state) => state.role);
  const [filters, setFilters] = useState<NewsSearchParams>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<NewsSearchParams>(emptyFilters);
  const query = useManagedNewsSearch(filters);
  const categories = useAdminCategories();
  const tags = useAdminTags();
  const transitionMutation = useTransitionNewsMutation();
  const items = query.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.size ?? 10)));

  function updateDraft(key: keyof NewsSearchParams, value: string) { setDraftFilters((current) => ({ ...current, [key]: value || undefined })); }
  function applyFilters(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFilters({ ...draftFilters, page: 1, size: 10 }); }
  async function transition(item: ManagedNews, target: NewsStatus) { await transitionMutation.mutateAsync({ id: item.id, target, version: item.version }); }

  return <section className="space-y-8"><PageHeader eyebrow="Sala editorial" title="Noticias" description="Escribe, revisa y localiza cada historia hasta su publicación." actions={role === 'author' || role === 'admin' ? <Link className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-semibold text-white hover:bg-brand-strong" href="/admin/news/new">Nueva noticia</Link> : null} />
    {query.error || transitionMutation.error ? <Alert variant="danger" title="No se pudo completar la operación">{getErrorMessage(query.error ?? transitionMutation.error)}</Alert> : null}
    <form className="rounded-lg border border-border bg-surface p-5 shadow-card" onSubmit={applyFilters}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="lg:col-span-2"><span className="text-sm font-semibold">Texto</span><Input className="mt-2" onChange={(event) => updateDraft('q', event.target.value)} value={draftFilters.q ?? ''} placeholder="Título, resumen o autor" /></label><label><span className="text-sm font-semibold">Estado</span><Select className="mt-2" onChange={(event) => updateDraft('status', event.target.value)} value={draftFilters.status ?? ''}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label><span className="text-sm font-semibold">Categoría</span><Select className="mt-2" onChange={(event) => updateDraft('category', event.target.value)} value={draftFilters.category ?? ''}><option value="">Todas</option>{(categories.data ?? []).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label><label><span className="text-sm font-semibold">Tag</span><Select className="mt-2" onChange={(event) => updateDraft('tag', event.target.value)} value={draftFilters.tag ?? ''}><option value="">Todos</option>{(tags.data ?? []).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label><label><span className="text-sm font-semibold">Autor UUID</span><Input className="mt-2" onChange={(event) => updateDraft('author', event.target.value)} value={draftFilters.author ?? ''} /></label><label><span className="text-sm font-semibold">Desde</span><Input className="mt-2" onChange={(event) => updateDraft('from', event.target.value)} value={draftFilters.from ?? ''} type="date" /></label><label><span className="text-sm font-semibold">Hasta</span><Input className="mt-2" onChange={(event) => updateDraft('to', event.target.value)} value={draftFilters.to ?? ''} type="date" /></label></div><div className="mt-5"><Button type="submit">Aplicar filtros</Button></div></form>
    {query.isPending ? <LoadingState label="Cargando noticias" /> : items.length === 0 ? <EmptyState title="No hay noticias para estos filtros" description="Prueba con otro estado, categoría o término de búsqueda." action={<Link className="font-semibold text-brand hover:underline" href="/admin/news/new">Crear una noticia</Link>} /> : <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"><div className="hidden border-b border-border bg-surface-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted md:grid md:grid-cols-[1fr_auto] md:gap-4"><span>Noticia</span><span>Acciones</span></div>{items.map((item) => <article className="flex flex-col gap-5 border-b border-border p-5 last:border-b-0 md:flex-row md:items-center md:justify-between" key={item.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariants[item.status]}>{statusLabels[item.status]}</Badge><span className="text-xs text-muted">v{item.version}</span></div><h2 className="mt-2 font-display-editorial text-xl font-bold leading-tight text-foreground">{item.title}</h2><p className="mt-1 text-sm text-muted">{item.authorName} · {item.categoryName}</p></div><div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold hover:border-brand hover:text-brand" href={`/admin/news/${item.id}`}>Abrir</Link>{canTransition(role, item.status, 'inReview') ? <TransitionButton busy={transitionMutation.isPending} variant="secondary" label="Enviar a revisión" onClick={() => transition(item, 'inReview')} /> : null}{canTransition(role, item.status, 'published') ? <TransitionButton busy={transitionMutation.isPending} variant="default" label="Publicar" onClick={() => transition(item, 'published')} /> : null}{canTransition(role, item.status, 'draft') ? <TransitionButton busy={transitionMutation.isPending} variant="outline" label="Devolver" onClick={() => transition(item, 'draft')} /> : null}</div></article>)}</div>}
    {totalPages > 1 ? <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Paginación de noticias"><Button disabled={(filters.page ?? 1) <= 1 || query.isFetching} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))} type="button" variant="outline" size="sm">← Anterior</Button><span className="text-muted">Página {filters.page ?? 1} de {totalPages}</span><Button disabled={(filters.page ?? 1) >= totalPages || query.isFetching} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))} type="button" variant="outline" size="sm">Siguiente →</Button></nav> : null}
  </section>;
}

function TransitionButton({ busy, label, onClick, variant }: { busy: boolean; label: string; onClick: () => Promise<void>; variant: 'default' | 'secondary' | 'outline' }) { return <Button disabled={busy} isLoading={busy} onClick={() => void onClick()} size="sm" variant={variant} type="button">{label}</Button>; }
function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : 'No se pudo completar la operación.'; }
