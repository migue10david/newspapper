'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { NavIcon } from '@/components/navigation/nav-icon';
import { useAuthStore } from '@/lib/auth-store';
import { getAdminNavigationGroups, type AdminNavigationItem } from '@/lib/navigation-config';

const roleLabels = { admin: 'Administrador', editor: 'Editor', author: 'Autor' } as const;
type UserRole = keyof typeof roleLabels;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const role = useAuthStore((state) => state.role);
  const email = useAuthStore((state) => state.email);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (pathname === '/admin/login') return children;

  const groups = getAdminNavigationGroups(role);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setIsOpen(false);
      router.replace('/admin/login');
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <Link className="font-display-editorial text-xl font-bold tracking-tight hover:text-brand" href="/admin">Periódico <span className="text-brand">/</span> Panel</Link>
          <button aria-controls={menuId} aria-expanded={isOpen} aria-label={isOpen ? 'Cerrar navegación del panel' : 'Abrir navegación del panel'} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border text-lg font-bold hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={() => setIsOpen((open) => !open)} type="button"><span aria-hidden="true">{isOpen ? '×' : '☰'}</span></button>
        </div>
      </header>

      {isOpen ? <button aria-label="Cerrar navegación" className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setIsOpen(false)} type="button" /> : null}
      <div className="mx-auto flex w-full max-w-[92rem]">
        <aside aria-label="Navegación del panel" className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-border bg-surface px-4 py-5 shadow-elevated transition-transform motion-reduce:transition-none lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} id={menuId}>
          <div className="flex items-start justify-between gap-3 border-b border-border px-2 pb-5">
            <div>
              <Link className="font-display-editorial text-2xl font-bold tracking-tight hover:text-brand" href="/admin">Periódico <span className="text-brand">/</span> Panel</Link>
              <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">Redacción digital</p>
            </div>
            <button aria-label="Cerrar navegación" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-xl text-muted hover:bg-surface-muted hover:text-foreground lg:hidden" onClick={() => setIsOpen(false)} type="button">×</button>
          </div>
          <div className="flex items-center gap-3 border-b border-border px-2 py-4">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{getInitials(email ?? 'Usuario')}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{email ?? 'Usuario autenticado'}</p>{role ? <Badge className="mt-1" variant="secondary">{roleLabels[role as UserRole]}</Badge> : null}</div>
          </div>
          <nav className="flex-1 overflow-y-auto py-5" aria-label="Secciones del panel">
            {groups.map((group) => <div className="mb-6 last:mb-0" key={group.label}><p className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">{group.label}</p><div className="space-y-1">{group.items.filter((item) => item.visible).map((item) => <AdminNavLink item={item} isActive={isActive(pathname, item.href)} key={item.href} onSelect={() => setIsOpen(false)} />)}</div></div>)}
          </nav>
          <button className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={() => void handleLogout()} type="button"><span aria-hidden="true">↪</span>Cerrar sesión</button>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function AdminNavLink({ item, isActive, onSelect }: { item: AdminNavigationItem; isActive: boolean; onSelect: () => void }) {
  return <Link aria-current={isActive ? 'page' : undefined} className={`group flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${isActive ? 'border-brand bg-brand-soft text-brand-strong' : 'border-transparent text-muted hover:border-border-strong hover:bg-surface-muted hover:text-foreground'}`} href={item.href} onClick={onSelect}><NavIcon name={item.icon} /><span>{item.label}</span>{isActive ? <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" /> : null}</Link>;
}

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

function getInitials(value: string): string {
  const initials = value.split(/[@.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'U';
}
