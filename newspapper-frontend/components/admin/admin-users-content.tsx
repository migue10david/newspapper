'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/auth-store';
import { useAdminAuthors, useAdminUsers, useCreateUserMutation, useUpdateUserAuthorMutation, useUpdateUserRoleMutation } from '@/lib/admin-queries';
import type { UserRole } from '@/lib/users-api';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';

const roles = ['author', 'editor', 'admin'] as const;
const roleLabels: Record<UserRole, string> = { author: 'Autor', editor: 'Editor', admin: 'Administrador' };
const userSchema = z.object({ email: z.string().email('Introduce un email válido.'), password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'), role: z.enum(roles) });
type UserForm = z.infer<typeof userSchema>;

export function AdminUsersContent() {
  const currentEmail = useAuthStore((state) => state.email);
  const currentRole = useAuthStore((state) => state.role);
  const users = useAdminUsers();
  const authors = useAdminAuthors();
  const create = useCreateUserMutation();
  const updateRole = useUpdateUserRoleMutation();
  const updateAuthor = useUpdateUserAuthorMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { email: '', password: '', role: 'author' } });

  if (currentRole !== 'admin') return null;
  const error = users.error ?? authors.error ?? create.error ?? updateRole.error ?? updateAuthor.error;
  const onCreate = handleSubmit(async (input) => { await create.mutateAsync(input); reset({ email: '', password: '', role: 'author' }); });

  return <section className="space-y-8"><PageHeader eyebrow="Administración" title="Usuarios y roles" description="Controla quién puede escribir, editar y administrar el periódico." />{error ? <Alert variant="danger" title="No se pudo completar la operación">{getErrorMessage(error)}</Alert> : null}{create.isSuccess || updateRole.isSuccess || updateAuthor.isSuccess ? <Alert variant="success">Los cambios se guardaron correctamente.</Alert> : null}<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"><section className="rounded-lg border border-border bg-surface shadow-card"><div className="border-b border-border px-5 py-4"><h2 className="font-bold text-foreground">Usuarios registrados</h2><p className="mt-1 text-sm text-muted">{users.data?.length ?? 0} usuarios</p></div>{users.isPending ? <p className="p-6 text-sm text-muted">Cargando usuarios…</p> : <div className="divide-y divide-border">{(users.data ?? []).map((user) => { const isCurrent = user.email === currentEmail; const busy = updateRole.isPending || updateAuthor.isPending; return <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between" key={user.id}><div className="min-w-0"><p className="truncate font-semibold text-foreground">{user.email}</p><p className="mt-1 truncate font-mono text-xs text-muted">{user.id}</p>{isCurrent ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">Tu cuenta</p> : null}{user.role === 'author' ? <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted"><span>Perfil editorial</span><select className="rounded-md border border-border bg-surface px-2 py-2 text-xs text-foreground" disabled={busy} onChange={(event) => void updateAuthor.mutateAsync({ id: user.id, authorId: event.target.value || null })} value={user.authorId ?? ''}><option value="">Sin vincular</option>{(authors.data ?? []).map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}</select></label> : null}</div><select className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 font-semibold text-foreground" disabled={isCurrent || busy} onChange={(event) => void updateRole.mutateAsync({ id: user.id, role: event.target.value as UserRole })} value={user.role}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></div>; })}</div>}</section><section className="rounded-lg border border-border bg-surface-muted p-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Nueva cuenta</p><h2 className="mt-2 font-display-editorial text-2xl font-bold text-foreground">Crear usuario</h2><form className="mt-6 space-y-4" noValidate onSubmit={onCreate}><Field label="Email" errorId="user-email-error" error={errors.email?.message}><input {...register('email')} id="user-email" aria-describedby={errors.email ? 'user-email-error' : undefined} aria-invalid={errors.email ? 'true' : 'false'} className={inputClass} type="email" /></Field><Field label="Contraseña" errorId="user-password-error" error={errors.password?.message}><input {...register('password')} id="user-password" aria-describedby={errors.password ? 'user-password-error' : undefined} aria-invalid={errors.password ? 'true' : 'false'} className={inputClass} type="password" /></Field><Field label="Rol" errorId="user-role-error" error={errors.role?.message}><select {...register('role')} id="user-role" aria-describedby={errors.role ? 'user-role-error' : undefined} aria-invalid={errors.role ? 'true' : 'false'} className={inputClass}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></Field><button className="min-h-11 w-full rounded-md bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-60" disabled={create.isPending} type="submit">{create.isPending ? 'Creando…' : 'Crear usuario'}</button></form></section></div></section>;
}

const inputClass = 'mt-2 w-full rounded-md border border-border bg-surface px-3 py-3 font-normal text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-foreground">{label}{children}{error ? <span className="mt-1 block text-sm font-normal text-danger" id={errorId} role="alert">{error}</span> : null}</label>; }
function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : 'No se pudo completar la operación.'; }
