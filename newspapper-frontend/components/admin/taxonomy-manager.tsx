'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type TaxonomyInput,
  type TaxonomyItem,
  type TaxonomyKind,
} from '@/lib/taxonomy-api';
import { useAdminTaxonomy, useTaxonomyMutation } from '@/lib/admin-queries';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';

const taxonomySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(100),
  slug: z
    .string()
    .min(1, 'El slug es obligatorio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones.'),
});

type TaxonomyForm = z.infer<typeof taxonomySchema>;

const labels: Record<TaxonomyKind, { singular: string; plural: string }> = {
  categories: { singular: 'categoría', plural: 'categorías' },
  tags: { singular: 'tag', plural: 'tags' },
};

export function TaxonomyManager() {
  const [kind, setKind] = useState<TaxonomyKind>('categories');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const size = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxonomyForm>({
    resolver: zodResolver(taxonomySchema),
    defaultValues: { name: '', slug: '' },
  });

  const query = useAdminTaxonomy(kind, { page, size, search });
  const mutations = useTaxonomyMutation();
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total]);
  const isLoading = query.isPending;
  const mutationPending = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  function selectKind(nextKind: TaxonomyKind) {
    setKind(nextKind);
    setPage(1);
    setSearch('');
    setSearchInput('');
    cancelEditing();
  }

  function startEditing(item: TaxonomyItem) {
    setEditing(item);
    reset({ name: item.name, slug: item.slug });
    setError(null);
    setSuccess(null);
  }

  function cancelEditing() {
    setEditing(null);
    reset({ name: '', slug: '' });
  }

  const onSubmit = handleSubmit(async (input: TaxonomyForm) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const payload: TaxonomyInput = input;
    try {
      if (editing) {
        await mutations.update.mutateAsync({ kind, id: editing.id, input: payload });
        setSuccess(`${capitalize(labels[kind].singular)} actualizada correctamente.`);
      } else {
        await mutations.create.mutateAsync({ kind, input: payload });
        setSuccess(`${capitalize(labels[kind].singular)} creada correctamente.`);
      }
      cancelEditing();
      setPage(1);
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    } finally {
      setIsSaving(false);
    }
  });

  async function remove(item: TaxonomyItem) {
    if (!window.confirm(`¿Eliminar ${labels[kind].singular} «${item.name}»?`)) return;
    setDeletingId(item.id);
    setError(null);
    setSuccess(null);
    try {
      await mutations.remove.mutateAsync({ kind, id: item.id });
      setSuccess(`${capitalize(labels[kind].singular)} eliminada correctamente.`);
      const nextPage = page > 1 && items.length === 1 ? page - 1 : page;
      setPage(nextPage);
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    } finally {
      setDeletingId(null);
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const currentLabel = labels[kind];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card" aria-labelledby="taxonomy-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display-editorial text-xl font-bold text-foreground" id="taxonomy-list-title">Catálogo editorial</h2>
            <p className="mt-1 text-sm text-muted">{total} {currentLabel.plural}</p>
          </div>
          <div className="flex rounded-md border border-border bg-surface-muted p-1" role="tablist" aria-label="Tipo de catálogo">
            {(['categories', 'tags'] as const).map((option) => (
              <button
                className={`min-h-11 rounded px-3 py-2 text-sm font-semibold transition ${kind === option ? 'bg-brand text-white' : 'text-muted hover:text-brand'}`}
                key={option}
                onClick={() => selectKind(option)}
                role="tab"
                type="button"
                aria-selected={kind === option}
              >
                {capitalize(labels[option].plural)}
              </button>
            ))}
          </div>
        </div>
        <form className="flex flex-wrap gap-2 border-b border-border p-5" onSubmit={submitSearch}>
          <Input
            className="mt-0 flex-1"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o slug"
            value={searchInput}
          />
          <Button size="sm" type="submit">Buscar</Button>
        </form>
        {isLoading ? <LoadingState label="Cargando catálogo" /> : items.length === 0 ? <EmptyState className="m-5" title="No hay resultados" description="Prueba con otro nombre o slug." /> : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted">/{item.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEditing(item)} type="button">Editar</Button>
                  <Button size="sm" variant="destructive" disabled={deletingId === item.id} onClick={() => void remove(item)} type="button">{deletingId === item.id ? 'Eliminando…' : 'Eliminar'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1 || isLoading || mutationPending} onClick={() => setPage((value) => value - 1)} type="button">← Anterior</Button>
          <span className="text-muted">Página {page} de {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)} type="button">Siguiente →</Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface-muted p-5" aria-labelledby="taxonomy-form-title">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Edición rápida</p>
        <h2 className="mt-2 font-display-editorial text-xl font-bold text-foreground" id="taxonomy-form-title">{editing ? `Editar ${currentLabel.singular}` : `Nueva ${currentLabel.singular}`}</h2>
        <form className="mt-5 space-y-4" noValidate onSubmit={onSubmit}>
          <Field label="Nombre" errorId="taxonomy-name-error" error={errors.name?.message}><input {...register('name')} id="taxonomy-name" aria-describedby={errors.name ? 'taxonomy-name-error' : undefined} aria-invalid={errors.name ? 'true' : 'false'} className={inputClass} /></Field>
          <Field label="Slug" errorId="taxonomy-slug-error" error={errors.slug?.message}><input {...register('slug')} id="taxonomy-slug" aria-describedby={errors.slug ? 'taxonomy-slug-error' : undefined} aria-invalid={errors.slug ? 'true' : 'false'} className={inputClass} placeholder="ejemplo-editorial" /></Field>
          <div className="flex gap-2">
            <Button disabled={isSaving} isLoading={isSaving} type="submit">{editing ? 'Guardar cambios' : 'Crear'}</Button>
            {editing ? <Button variant="outline" onClick={cancelEditing} type="button">Cancelar</Button> : null}
          </div>
        </form>
        <p className="mt-6 border-l-2 border-brand px-3 text-xs leading-5 text-muted">Los slugs son únicos y forman parte de las URLs públicas del periódico.</p>
      </section>
      {error || query.error ? <Alert className="lg:col-span-2" variant="danger">{getErrorMessage(error ?? query.error)}</Alert> : null}
      {success ? <Alert className="lg:col-span-2" variant="success">{success}</Alert> : null}
    </div>
  );
}

const inputClass = 'mt-2 w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-foreground">{label}{children}{error ? <span className="mt-1 block text-xs font-normal text-danger" id={errorId} role="alert">{error}</span> : null}</label>;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'No se pudo completar la operación.';
}
