'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/auth-store';
import { useAdminSettings, useUpdateSettingsMutation } from '@/lib/admin-queries';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'El nombre es obligatorio.').max(120),
  description: z.string().min(1, 'La descripción es obligatoria.').max(500),
  logoUrl: z.union([
    z.string().regex(/^(?:https?:\/\/|\/)/i, 'Introduce una URL válida.'),
    z.literal(''),
  ]),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export function AdminSettingsContent() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const query = useAdminSettings();
  const mutation = useUpdateSettingsMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { siteName: '', description: '', logoUrl: '' },
  });
  const values = useMemo(() => query.data ? { ...query.data, logoUrl: query.data.logoUrl ?? '' } : undefined, [query.data]);

  useEffect(() => {
    if (role !== 'admin') router.replace('/');
  }, [role, router]);
  useEffect(() => {
    if (values) reset(values);
  }, [reset, values]);

  if (role !== 'admin') return null;
  const error = query.error ?? mutation.error;

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow="Administración" title="Configuración del sitio" description="Define la identidad que verán los lectores en la portada y el encabezado." />
      {error ? <Alert variant="danger" title="No se pudo guardar la configuración">{getErrorMessage(error)}</Alert> : null}
      {mutation.isSuccess ? <Alert variant="success">Configuración guardada correctamente.</Alert> : null}
      <form className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-card" noValidate onSubmit={handleSubmit((input) => mutation.mutate({ ...input, logoUrl: input.logoUrl || null }))}>
        <Field label="Nombre del sitio" errorId="settings-site-name-error" error={errors.siteName?.message}><Input {...register('siteName')} id="settings-site-name" aria-describedby={errors.siteName ? 'settings-site-name-error' : undefined} aria-invalid={errors.siteName ? 'true' : 'false'} disabled={query.isPending || mutation.isPending} /></Field>
        <Field label="Descripción" errorId="settings-description-error" error={errors.description?.message}><textarea {...register('description')} id="settings-description" aria-describedby={errors.description ? 'settings-description-error' : undefined} aria-invalid={errors.description ? 'true' : 'false'} className={`${inputClass} min-h-32`} disabled={query.isPending || mutation.isPending} /></Field>
        <Field label="URL del logo (opcional)" errorId="settings-logo-error" error={errors.logoUrl?.message}><Input {...register('logoUrl')} id="settings-logo" aria-describedby={errors.logoUrl ? 'settings-logo-error' : undefined} aria-invalid={errors.logoUrl ? 'true' : 'false'} disabled={query.isPending || mutation.isPending} placeholder="https://… o /uploads/…" type="url" /></Field>
        <div className="flex justify-end"><Button disabled={query.isPending || mutation.isPending} isLoading={mutation.isPending} type="submit">Guardar configuración</Button></div>
      </form>
    </section>
  );
}

const inputClass = 'mt-2 w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-foreground">{label}{children}{error ? <span className="mt-1 block text-xs font-normal text-danger" id={errorId} role="alert">{error}</span> : null}</label>; }
function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : 'No se pudo completar la operación.'; }
