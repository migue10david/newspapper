'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { BarChart3, BookOpen, Bookmark, Grid2X2, History, MessageCircle, Settings, Users, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/auth-store';
import { getAdminNavigationGroups, type AdminNavigationItem } from '@/lib/navigation-config';

const roleLabels = { admin: 'Administrador', editor: 'Editor', author: 'Autor' } as const;
type UserRole = keyof typeof roleLabels;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') return children;

  return <SidebarProvider><AdminShellContent>{children}</AdminShellContent></SidebarProvider>;
}

function AdminShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const email = useAuthStore((state) => state.email);
  const logout = useAuthStore((state) => state.logout);
  const { setOpenMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const groups = getAdminNavigationGroups(role);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setOpenMobile(false);
      router.replace('/admin/login');
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <Link className="block truncate px-2 py-2 font-display-editorial text-2xl font-bold tracking-tight hover:text-brand group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-xl" href="/admin">Periódico <span className="group-data-[collapsible=icon]:hidden"><span className="text-brand">/</span> Panel</span></Link>
          <p className="px-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted group-data-[collapsible=icon]:hidden">Redacción digital</p>
          <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface-subtle p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{getInitials(email ?? 'Usuario')}</span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold">{email ?? 'Usuario autenticado'}</p>{role ? <Badge className="mt-1" variant="secondary">{roleLabels[role as UserRole]}</Badge> : null}</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.filter((item) => item.visible).map((item) => <AdminNavLink item={item} isActive={isActive(pathname, item.href)} key={item.href} />)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Cerrar sesión" className="text-danger hover:bg-danger-soft hover:text-danger">
                <button aria-label="Cerrar sesión" disabled={isLoggingOut} onClick={() => void handleLogout()} type="button"><span aria-hidden="true">↪</span><span>{isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span></button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-md md:hidden">
          <SidebarTrigger />
          <Link className="font-display-editorial text-xl font-bold tracking-tight hover:text-brand" href="/admin">Periódico <span className="text-brand">/</span> Panel</Link>
        </header>
        <div className="w-full min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
          <div className="mb-8 hidden items-center justify-between border-b border-border pb-4 md:flex">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Workspace editorial</p>
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}

function AdminNavLink({ item, isActive }: { item: AdminNavigationItem; isActive: boolean }) {
  const { setOpenMobile } = useSidebar();

  return <SidebarMenuItem><SidebarMenuButton asChild isActive={isActive} tooltip={item.label}><Link aria-current={isActive ? 'page' : undefined} href={item.href} onClick={() => setOpenMobile(false)}><AdminNavIcon name={item.icon} /><span>{item.label}</span></Link></SidebarMenuButton></SidebarMenuItem>;
}

const adminIcons: Record<AdminNavigationItem['icon'], LucideIcon> = {
  book: BookOpen,
  chart: BarChart3,
  comment: MessageCircle,
  grid: Grid2X2,
  history: History,
  settings: Settings,
  users: Users,
  bookmark: Bookmark,
};

function AdminNavIcon({ name }: { name: AdminNavigationItem['icon'] }) {
  const Icon = adminIcons[name];
  return <Icon aria-hidden="true" size={18} strokeWidth={1.8} />;
}

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

function getInitials(value: string): string {
  const initials = value.split(/[@.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'U';
}
