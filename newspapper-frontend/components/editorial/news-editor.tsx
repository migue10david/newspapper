/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth-store';
import { mediaApi, resolveMediaUrl } from '@/lib/media-api';
import { type ImageBlock, type ManagedNews, type NewsBodyBlock, type NewsStatus, type NewsInput } from '@/lib/news-api';
import { canTransition } from '@/lib/news-permissions';
import { useAdminCategories, useCreateNewsMutation, useTransitionNewsMutation, useUpdateNewsMutation } from '@/lib/admin-queries';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const newsSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio.').max(300),
  summary: z.string().min(1, 'El resumen es obligatorio.').max(500),
  categoryId: z.string().uuid('Selecciona una categoría.'),
  publishedAt: z.string().optional(),
});

const imageBlockSchema = z.object({ type: z.literal('image'), url: z.string().min(1), alt: z.string().min(1, 'El texto alternativo es obligatorio.') });
type NewsForm = z.infer<typeof newsSchema>;
type EditorBlock = NewsBodyBlock & { id: string; file?: File; previewUrl?: string };

interface NewsEditorProps { news?: ManagedNews; }

export function NewsEditor({ news }: NewsEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(resolveMediaUrl(news?.imageUrl));
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(news?.imageId ?? null);
  const [featuredAlt, setFeaturedAlt] = useState(news?.imageAlt ?? '');
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks(news));
  const categoriesQuery = useAdminCategories();
  const createMutation = useCreateNewsMutation();
  const updateMutation = useUpdateNewsMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<NewsForm>({
    resolver: zodResolver(newsSchema),
    defaultValues: { title: news?.title ?? '', summary: news?.summary ?? '', categoryId: news?.categoryId ?? '', publishedAt: news?.publishedAt ? news.publishedAt.slice(0, 16) : '' },
  });

  function onFeaturedChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (validation) { setError(validation); return; }
    setError(null); setFeaturedFile(file); setFeaturedImageId(null); setFeaturedPreview(URL.createObjectURL(file));
  }

  function addBlock(type: EditorBlock['type']) {
    if (type === 'image') setBlocks((current) => [...current, { id: createBlockId(), type, url: '', alt: '' }]);
    if (type === 'paragraph') setBlocks((current) => [...current, { id: createBlockId(), type, text: '' }]);
    if (type === 'heading') setBlocks((current) => [...current, { id: createBlockId(), type, text: '' }]);
    if (type === 'list') setBlocks((current) => [...current, { id: createBlockId(), type, items: [''] }]);
  }

  function updateBlock(id: string, patch: Partial<EditorBlock>) { setBlocks((current) => current.map((block) => block.id === id ? { ...block, ...patch } as EditorBlock : block)); }
  function removeBlock(id: string) { setBlocks((current) => current.filter((block) => block.id !== id)); }
  function moveBlock(id: string, direction: -1 | 1) { setBlocks((current) => { const index = current.findIndex((block) => block.id === id); const nextIndex = index + direction; if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current; const result = [...current]; [result[index], result[nextIndex]] = [result[nextIndex], result[index]]; return result; }); }

  async function uploadBlockImage(block: EditorBlock & { type: 'image' }): Promise<ImageBlock> {
    if (!block.file) return { type: 'image', url: block.url, alt: block.alt };
    const asset = await mediaApi.upload(block.file, block.alt);
    return { type: 'image', url: asset.url, alt: asset.alt ?? block.alt };
  }

  const onSubmit = handleSubmit(async (input) => {
    setError(null);
    if (featuredFile && !featuredAlt.trim()) {
      setError('La imagen principal nueva debe tener un texto alternativo.');
      return;
    }
    const invalidImage = blocks.find((block) => block.type === 'image' && (!block.alt.trim() || (!block.url && !block.file) || !imageBlockSchema.safeParse({ type: 'image', url: block.url || (block.file ? 'pending-upload' : ''), alt: block.alt }).success));
    if (invalidImage) { setError('Cada imagen debe tener un archivo y un texto alternativo.'); return; }
    if (!blocks.length) { setError('Añade al menos una sección al contenido.'); return; }
    setIsUploading(true);
    try {
      const uploadedFeatured = featuredFile ? await mediaApi.upload(featuredFile, featuredAlt) : null;
      const body: NewsBodyBlock[] = [];
      for (const block of blocks) {
        if (block.type === 'image') body.push(await uploadBlockImage(block));
        else if (block.type === 'list') body.push({ type: 'list', items: block.items.filter((item) => item.trim()) });
        else body.push({ type: block.type, text: block.text });
      }
      const payload: NewsInput = { title: input.title, summary: input.summary, body, categoryId: input.categoryId, tagIds: [], imageId: uploadedFeatured?.id ?? featuredImageId, ...(input.publishedAt ? { publishedAt: new Date(input.publishedAt).toISOString() } : {}), ...(news ? { version: news.version } : {}) };
      const saved = news ? await updateMutation.mutateAsync({ id: news.id, input: payload }) : await createMutation.mutateAsync(payload);
      if (!saved.id) throw new Error('La API no devolvió el identificador de la noticia.');
      router.replace(`/admin/news/${saved.id}`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la noticia.');
    } finally { setIsUploading(false); }
  });

  const isSaving = isUploading || createMutation.isPending || updateMutation.isPending;

  return <section className="mx-auto max-w-4xl space-y-8">
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline" href="/admin/news">← Volver a noticias</Link>
    <PageHeader eyebrow="Sala editorial" title={news ? 'Editar noticia' : 'Nueva noticia'} description="Construye una pieza clara, verificable y lista para el siguiente paso editorial." />
    {error || categoriesQuery.error || createMutation.error || updateMutation.error ? <Alert variant="danger" title="No se pudo guardar la noticia">{getErrorMessage(error ?? categoriesQuery.error ?? createMutation.error ?? updateMutation.error)}</Alert> : null}
    <form className="space-y-7 rounded-lg border border-border bg-surface p-5 shadow-card sm:p-7" noValidate onSubmit={onSubmit}>
      <Field label="Título" error={errors.title?.message}><Input {...register('title')} id="news-title" aria-describedby={errors.title ? 'news-title-error' : undefined} aria-invalid={errors.title ? 'true' : 'false'} /> </Field>
      <Field label="Resumen" error={errors.summary?.message}><textarea {...register('summary')} id="news-summary" aria-describedby={errors.summary ? 'news-summary-error' : undefined} aria-invalid={errors.summary ? 'true' : 'false'} className={inputClass + ' min-h-28'} /></Field>
      <section className="rounded-md border border-border bg-surface-muted p-5" aria-labelledby="featured-image-title">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Imagen principal</p><h2 className="mt-1 font-display-editorial text-xl font-bold" id="featured-image-title">Destaca la noticia</h2></div><Badge variant="secondary">JPG, PNG o WEBP · máx. 5 MB</Badge></div>
        {featuredPreview ? <img className="mt-5 aspect-[16/8] w-full rounded-md object-cover" src={featuredPreview} alt={featuredAlt || 'Vista previa de imagen principal'} /> : <div className="mt-5 flex aspect-[16/8] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted">Sin imagen principal</div>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Archivo<Input className="mt-2" accept="image/jpeg,image/png,image/webp" onChange={onFeaturedChange} type="file" /></label><label className="text-sm font-semibold">Texto alternativo<Input className="mt-2" value={featuredAlt} onChange={(event) => setFeaturedAlt(event.target.value)} placeholder="Describe la imagen" /></label></div>
        {featuredPreview || featuredImageId ? <Button className="mt-4" onClick={() => { setFeaturedFile(null); setFeaturedImageId(null); setFeaturedPreview(null); }} type="button" variant="outline">Quitar imagen principal</Button> : null}
      </section>
      <section aria-labelledby="body-editor-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Cuerpo</p><h2 className="mt-1 font-display-editorial text-2xl font-bold" id="body-editor-title">Secciones de la noticia</h2></div><div className="flex flex-wrap gap-2"><Button onClick={() => addBlock('paragraph')} size="sm" type="button" variant="outline">+ Párrafo</Button><Button onClick={() => addBlock('heading')} size="sm" type="button" variant="outline">+ Encabezado</Button><Button onClick={() => addBlock('list')} size="sm" type="button" variant="outline">+ Lista</Button><Button onClick={() => addBlock('image')} size="sm" type="button" variant="outline">+ Imagen</Button></div></div>
        <div className="mt-5 space-y-4">{blocks.map((block, index) => <BlockEditor block={block} index={index} key={block.id} onChange={updateBlock} onMove={moveBlock} onRemove={removeBlock} />)}</div>
        {!blocks.length ? <div className="mt-5 rounded-md border border-dashed border-border p-8 text-center text-sm text-muted">Añade un párrafo, encabezado, lista o imagen para comenzar.</div> : null}
      </section>
      <div className="grid gap-6 md:grid-cols-2"><Field label="Categoría" error={errors.categoryId?.message}><Select {...register('categoryId')} id="news-category" aria-describedby={errors.categoryId ? 'news-category-error' : undefined} aria-invalid={errors.categoryId ? 'true' : 'false'}><option value="">Selecciona una categoría</option>{(categoriesQuery.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field><Field label="Fecha de publicación (opcional)" error={errors.publishedAt?.message}><Input {...register('publishedAt')} type="datetime-local" /></Field></div>
      <Button disabled={isSaving} isLoading={isSaving} type="submit">{isUploading ? 'Subiendo imágenes…' : 'Guardar borrador'}</Button>
    </form>
  </section>;
}

function BlockEditor({ block, index, onChange, onMove, onRemove }: { block: EditorBlock; index: number; onChange: (id: string, patch: Partial<EditorBlock>) => void; onMove: (id: string, direction: -1 | 1) => void; onRemove: (id: string) => void }) {
  const label = block.type === 'image' ? 'Imagen' : block.type === 'heading' ? 'Encabezado' : block.type === 'list' ? 'Lista' : 'Párrafo';
  return <article className="rounded-md border border-border bg-surface-muted p-4" aria-label={`${label} ${index + 1}`}><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">{label}</Badge><div className="flex gap-1"><Button aria-label="Subir bloque" disabled={index === 0} onClick={() => onMove(block.id, -1)} size="icon" type="button" variant="ghost">↑</Button><Button aria-label="Bajar bloque" onClick={() => onMove(block.id, 1)} size="icon" type="button" variant="ghost">↓</Button><Button aria-label={`Eliminar ${label.toLowerCase()}`} onClick={() => onRemove(block.id)} size="icon" type="button" variant="ghost">×</Button></div></div>{block.type === 'image' ? <ImageBlockEditor block={block} onChange={onChange} /> : block.type === 'list' ? <textarea className={inputClass + ' mt-4 min-h-28'} aria-label="Elementos de la lista, uno por línea" value={block.items.join('\n')} onChange={(event) => onChange(block.id, { items: event.target.value.split('\n') })} placeholder="Un elemento por línea" /> : <textarea className={inputClass + ' mt-4 min-h-28'} aria-label={label} value={block.text} onChange={(event) => onChange(block.id, { text: event.target.value })} placeholder={block.type === 'heading' ? 'Título de sección' : 'Escribe el contenido de esta sección'} />}</article>;
}

function ImageBlockEditor({ block, onChange }: { block: EditorBlock & { type: 'image' }; onChange: (id: string, patch: Partial<EditorBlock>) => void }) {
  function handleFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const validation = validateImage(file); if (validation) return; onChange(block.id, { file, url: '', previewUrl: URL.createObjectURL(file) }); }
  const preview = block.previewUrl ?? resolveMediaUrl(block.url);
  return <div className="mt-4 grid gap-4 sm:grid-cols-2"><div>{preview ? <img className="aspect-video w-full rounded-md object-cover" src={preview} alt={block.alt || 'Vista previa de sección'} /> : <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border text-sm text-muted">Sin imagen</div>}<label className="mt-3 block text-sm font-semibold">Archivo<Input className="mt-2" accept="image/jpeg,image/png,image/webp" onChange={handleFile} type="file" /></label></div><label className="text-sm font-semibold">Texto alternativo<Input className="mt-2" value={block.alt} onChange={(event) => onChange(block.id, { alt: event.target.value })} placeholder="Describe la imagen" /></label></div>;
}

function toEditorBlocks(news?: ManagedNews): EditorBlock[] {
  if (!news) return [{ id: createBlockId(), type: 'paragraph', text: '' }];
  return news.body.map((block) => {
    if (block.type === 'image') return { id: createBlockId(), type: 'image', url: block.url ?? '', alt: block.alt ?? '' };
    if (block.type === 'list') return { id: createBlockId(), type: 'list', items: block.items ?? [''] };
    return { id: createBlockId(), type: block.type === 'heading' ? 'heading' : 'paragraph', text: block.text ?? '' };
  });
}

function createBlockId(): string { return `block-${Math.random().toString(36).slice(2)}`; }
function validateImage(file: File): string | null { if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Solo se permiten imágenes JPG, PNG o WEBP.'; if (file.size > MAX_IMAGE_SIZE) return 'La imagen no puede superar los 5 MB.'; return null; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { const errorId = `${label.toLowerCase().replaceAll(' ', '-')}-error`; return <label className="block text-sm font-semibold text-foreground">{label}{children}{error ? <span className="mt-1 block text-xs font-normal text-danger" id={errorId} role="alert">{error}</span> : null}</label>; }
function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : 'No se pudo completar la operación.'; }

export { canTransition } from '@/lib/news-permissions';

export function NewsTransitionActions({ news, onUpdated }: { news: ManagedNews; onUpdated: (news: ManagedNews) => void }) {
  const role = useAuthStore((state) => state.role);
  const [busyTarget, setBusyTarget] = useState<NewsStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const transitionMutation = useTransitionNewsMutation();
  const targets: Array<{ target: NewsStatus; label: string; className: string }> = [];
  if (canTransition(role, news.status, 'inReview')) targets.push({ target: 'inReview', label: 'Enviar a revisión', className: 'bg-zinc-950 text-white hover:bg-brand' });
  if (canTransition(role, news.status, 'published')) targets.push({ target: 'published', label: 'Publicar', className: 'bg-brand text-white hover:bg-brand-strong' });
  if (canTransition(role, news.status, 'draft')) targets.push({ target: 'draft', label: 'Devolver a borrador', className: 'border border-border text-foreground hover:border-brand' });
  if (!targets.length) return null;
  async function transition(target: NewsStatus) { setError(null); setBusyTarget(target); try { onUpdated(await transitionMutation.mutateAsync({ id: news.id, target, version: news.version })); } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado.'); } finally { setBusyTarget(null); } }
  return <section className="rounded-lg border border-border bg-surface-muted p-5" aria-labelledby="transition-title"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Flujo editorial</p><h2 className="mt-2 font-display-editorial text-xl font-bold" id="transition-title">Estado: {statusLabels[news.status]}</h2><div className="mt-4 flex flex-wrap gap-3">{targets.map(({ target, label, className }) => <button className={`inline-flex min-h-11 items-center rounded-md px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${className}`} disabled={busyTarget !== null} key={target} onClick={() => void transition(target)} type="button">{busyTarget === target ? 'Guardando…' : label}</button>)}</div>{error ? <Alert className="mt-4" variant="danger">{error}</Alert> : null}</section>;
}

const inputClass = 'w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
const statusLabels: Record<NewsStatus, string> = { draft: 'Borrador', inReview: 'En revisión', scheduled: 'Programada', published: 'Publicada', archived: 'Archivada' };
