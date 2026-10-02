'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

const roleLabels = {
  admin: 'Administrador',
  author: 'Autor',
  editor: 'Editor',
} as const;

export function AuthNavbar() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [initialize, isInitialized]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace('/');
    }
  }

  if (!isInitialized) {
    return <span className="text-sm text-muted">Cargando…</span>;
  }

  if (!accessToken || !role) {
    return (
      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <Link className="inline-flex min-h-11 items-center px-2 font-semibold hover:text-brand" href="/admin/login">
          Iniciar sesión
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-md bg-brand px-3 py-2 font-semibold text-white transition-colors hover:bg-brand-strong"
          href="/registro"
        >
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="max-w-48 truncate font-semibold text-foreground" title={email ?? undefined}>
          {email ?? 'Usuario autenticado'}
        </p>
        <p className="text-xs uppercase tracking-[0.12em] text-muted">
          {roleLabels[role]}
        </p>
      </div>
      <>
        <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand" href="/admin/news">
          Noticias
        </Link>
        <Link className="hidden min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand lg:inline-flex" href="/mis-noticias-guardadas">
          Guardadas
        </Link>
        <Link className="hidden min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand xl:inline-flex" href="/mi-historial">
          Historial
        </Link>
        {role === 'editor' || role === 'admin' ? (
          <Link className="hidden min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand lg:inline-flex" href="/admin/catalog">
            Catálogo
          </Link>
        ) : null}
        {role === 'admin' ? (
          <>
            <Link className="hidden min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand md:inline-flex" href="/admin/users">
              Usuarios
            </Link>
            <Link className="hidden min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand xl:inline-flex" href="/admin/settings">
              Configuración
            </Link>
          </>
        ) : null}
      </>
      <button
        className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 font-semibold hover:border-brand hover:text-brand"
        onClick={() => void handleLogout()}
        type="button"
      >
        Salir
      </button>
    </div>
  );
}
