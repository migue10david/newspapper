'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { NavIcon, type NavIconName } from '@/components/navigation/nav-icon';
import { useAuthStore } from '@/lib/auth-store';

const roleLabels = { admin: 'Administrador', author: 'Autor', editor: 'Editor' } as const;

export function AuthNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const accessToken = useAuthStore((state) => state.accessToken);
  const email = useAuthStore((state) => state.email);
  const role = useAuthStore((state) => state.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) void initialize();
  }, [initialize, isInitialized]);

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setIsOpen(false);
      router.replace('/');
    }
  }

  if (!isInitialized) return <span className="text-sm text-muted">Cargando…</span>;

  const isAuthenticated = Boolean(accessToken && role);
  const displayName = email ?? 'Usuario autenticado';
  const initials = getInitials(displayName);

  return (
    <div className="relative z-50 flex items-center gap-2">
      {isAuthenticated ? (
        <div className="hidden items-center gap-2 sm:flex">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials}</span>
          <span className="hidden max-w-32 truncate text-right text-xs font-semibold text-foreground md:block" title={displayName}>{displayName}</span>
        </div>
      ) : null}
      {!isAuthenticated ? <Link className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" href="/admin/login">Iniciar sesión</Link> : null}
      <button aria-controls={menuId} aria-expanded={isOpen} aria-haspopup="menu" className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${isOpen ? 'border-brand bg-brand-soft text-brand-strong' : 'border-border bg-surface hover:border-brand hover:text-brand'}`} onClick={() => setIsOpen((open) => !open)} type="button">
        {isAuthenticated ? <span aria-hidden="true" className="sm:hidden">{initials}</span> : null}
        <span>Más</span>
        <span aria-hidden="true" className={`text-xs transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {isOpen ? <>
        <button aria-label="Cerrar menú" className="fixed inset-0 z-40 cursor-default bg-black/10 sm:bg-transparent" onClick={() => setIsOpen(false)} type="button" />
        <div className="nav-menu-enter fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-elevated sm:absolute sm:right-0 sm:top-14 sm:inset-x-auto sm:w-80" id={menuId} role="menu">
          {isAuthenticated ? <div className="border-b border-border px-3 pb-3 sm:hidden"><p className="font-semibold">{displayName}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{role ? roleLabels[role] : ''}</p></div> : null}
          {isAuthenticated ? <>
            <MenuSection label="Tu espacio">
              <MenuLink href="/admin" icon="chart" label="Panel editorial" active={pathname.startsWith('/admin')} onSelect={() => setIsOpen(false)} />
              <MenuLink href="/admin/news" icon="book" label="Noticias" active={pathname.startsWith('/admin/news')} onSelect={() => setIsOpen(false)} />
            </MenuSection>
            <MenuSection label="Tu lectura">
              <MenuLink href="/mis-noticias-guardadas" icon="bookmark" label="Noticias guardadas" active={pathname === '/mis-noticias-guardadas'} onSelect={() => setIsOpen(false)} />
              <MenuLink href="/mi-historial" icon="history" label="Historial de lectura" active={pathname === '/mi-historial'} onSelect={() => setIsOpen(false)} />
            </MenuSection>
            {role === 'editor' || role === 'admin' ? <MenuSection label="Gestión"><MenuLink href="/admin/catalog" icon="grid" label="Catálogo" active={pathname.startsWith('/admin/catalog')} onSelect={() => setIsOpen(false)} /></MenuSection> : null}
            {role === 'admin' ? <MenuSection label="Administración"><MenuLink href="/admin/users" icon="users" label="Usuarios" active={pathname.startsWith('/admin/users')} onSelect={() => setIsOpen(false)} /><MenuLink href="/admin/settings" icon="settings" label="Configuración" active={pathname.startsWith('/admin/settings')} onSelect={() => setIsOpen(false)} /></MenuSection> : null}
            <button className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={() => void handleLogout()} role="menuitem" type="button"><span aria-hidden="true">↪</span>Cerrar sesión</button>
          </> : <MenuSection label="Cuenta"><MenuLink href="/registro" icon="users" label="Crear una cuenta" onSelect={() => setIsOpen(false)} /><p className="px-3 pb-2 pt-3 text-xs leading-5 text-muted">Guarda noticias, consulta tu historial y participa en la conversación editorial.</p></MenuSection>}
        </div>
      </> : null}
    </div>
  );
}

function MenuSection({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-b border-border py-2 last:border-b-0"><p className="px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>{children}</div>;
}

function MenuLink({ href, label, icon, active, onSelect }: { href: string; label: string; icon: NavIconName; active?: boolean; onSelect: () => void }) {
  return <Link aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${active ? 'bg-brand-soft text-brand-strong' : 'text-foreground hover:bg-surface-muted hover:text-brand'}`} href={href} onClick={onSelect} role="menuitem"><NavIcon name={icon} />{label}{active ? <span aria-hidden="true" className="ml-auto text-brand">•</span> : null}</Link>;
}

function getInitials(value: string): string {
  const initials = value.split(/[@.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'U';
}
