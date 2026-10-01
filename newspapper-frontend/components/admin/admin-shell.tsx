'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/auth-store';

const roleLabels = { admin: 'Administrador', editor: 'Editor', author: 'Autor' } as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const email = useAuthStore((state) => state.email);
  const logout = useAuthStore((state) => state.logout);

  if (pathname === '/admin/login') return children;

  const links = [
    { href: '/admin', label: 'Resumen', visible: true },
    { href: '/admin/news', label: 'Noticias', visible: true },
    { href: '/admin/comments', label: 'Comentarios', visible: role === 'editor' || role === 'admin' },
    { href: '/admin/catalog', label: 'Catálogo', visible: role === 'editor' || role === 'admin' },
    { href: '/admin/users', label: 'Usuarios', visible: role === 'admin' },
    { href: '/admin/settings', label: 'Configuración', visible: role === 'admin' },
  ];

  async function handleLogout() {
    try { await logout(); } finally { router.replace('/admin/login'); }
  }

  return (
    <div className="min-h-full bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link className="font-display-editorial text-xl font-bold hover:text-brand" href="/admin">Periódico / Panel</Link>
              {role ? <div className="mt-1 flex items-center gap-2"><Badge variant="secondary">{roleLabels[role]}</Badge><span className="max-w-56 truncate text-xs text-muted">{email}</span></div> : null}
            </div>
            <button className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold hover:border-brand hover:text-brand" onClick={() => void handleLogout()} type="button">Cerrar sesión</button>
          </div>
          <nav aria-label="Navegación del panel" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {links.filter((link) => link.visible).map((link) => {
              const isActive = link.href === '/admin' ? pathname === link.href : pathname.startsWith(link.href);
              return <Link className={`inline-flex min-h-11 shrink-0 items-center rounded-md border-b-2 px-3 text-sm font-semibold transition-colors ${isActive ? 'border-brand bg-brand-soft text-brand-strong' : 'border-transparent text-muted hover:border-border-strong hover:text-foreground'}`} href={link.href} key={link.href} aria-current={isActive ? 'page' : undefined}>{link.label}</Link>;
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
