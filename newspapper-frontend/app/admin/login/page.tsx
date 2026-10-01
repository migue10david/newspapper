'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      const role = useAuthStore.getState().role;
      router.replace(role === 'admin' ? '/admin' : '/');
    } catch {
      setError('No se pudo iniciar sesión. Revisa tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-5xl items-center gap-10 py-10 lg:grid-cols-[1fr_400px]">
      <div className="hidden border-l-4 border-red-700 pl-8 lg:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-700">
          Sala editorial
        </p>
        <h1 className="max-w-xl text-5xl font-black tracking-[-0.05em] text-zinc-950">
          Las noticias empiezan detrás de escena.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600">
          Accede al backoffice para coordinar la edición y publicación del periódico.
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-6 shadow-[12px_12px_0_#991b1b] sm:p-8">
        <div className="mb-8 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Periódico
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Iniciar sesión
          </h2>
        </div>

        <Suspense fallback={null}>
          <RegistrationSuccessMessage />
        </Suspense>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800" htmlFor="email">
              Email
            </label>
            <input
              required
              autoComplete="email"
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground transition"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800" htmlFor="password">
              Contraseña
            </label>
            <input
              required
              autoComplete="current-password"
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground transition"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="min-h-11 w-full rounded-md bg-brand px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿No tienes una cuenta?{' '}
          <Link className="font-semibold text-red-700 underline underline-offset-4" href="/registro">
            Regístrate
          </Link>
        </p>
      </div>
    </section>
  );
}

function RegistrationSuccessMessage() {
  const searchParams = useSearchParams();

  if (searchParams.get('registered') !== '1') {
    return null;
  }

  return (
    <p className="mb-5 border-l-2 border-emerald-700 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
      Cuenta creada correctamente. Ya puedes iniciar sesión.
    </p>
  );
}
