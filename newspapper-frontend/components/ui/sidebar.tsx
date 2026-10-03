'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeftIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextValue = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.');
  return context;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function readSidebarCookie(defaultOpen: boolean): boolean {
  if (typeof document === 'undefined') return defaultOpen;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`))?.split('=')[1];
  return value === undefined ? defaultOpen : value !== 'false';
}

export function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange, className, style, children, ...props }: React.ComponentProps<'div'> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(() => readSidebarCookie(defaultOpen));
  const open = openProp ?? internalOpen;
  const setOpen = React.useCallback((value: boolean | ((open: boolean) => boolean)) => {
    const nextOpen = typeof value === 'function' ? value(open) : value;
    onOpenChange?.(nextOpen);
    if (!onOpenChange) setInternalOpen(nextOpen);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextOpen}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, [onOpenChange, open]);
  const toggleSidebar = React.useCallback(() => isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value), [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state: SidebarContextValue['state'] = open ? 'expanded' : 'collapsed';
  const contextValue = React.useMemo(() => ({ state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar }), [state, open, setOpen, openMobile, isMobile, toggleSidebar]);

  return <SidebarContext.Provider value={contextValue}><TooltipProvider delayDuration={0}><div className={cn('group/sidebar-wrapper flex min-h-screen w-full', className)} style={{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties} {...props}>{children}</div></TooltipProvider></SidebarContext.Provider>;
}

export function Sidebar({ side = 'left', variant = 'sidebar', collapsible = 'icon', className, children, ...props }: React.ComponentProps<'div'> & { side?: 'left' | 'right'; variant?: 'sidebar' | 'floating' | 'inset'; collapsible?: 'offcanvas' | 'icon' | 'none' }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') return <div className={cn('flex h-full w-[var(--sidebar-width)] flex-col bg-surface', className)} {...props}>{children}</div>;

  if (isMobile) {
    return <Sheet open={openMobile} onOpenChange={setOpenMobile}><SheetContent aria-describedby="sidebar-description" data-mobile="true" side={side} style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}><SheetHeader className="sr-only"><SheetTitle>Menú del panel</SheetTitle><SheetDescription id="sidebar-description">Navegación principal del backoffice.</SheetDescription></SheetHeader><div className="flex h-full w-full flex-col">{children}</div></SheetContent></Sheet>;
  }

  const collapsed = state === 'collapsed' && collapsible === 'icon';
  const offcanvas = state === 'collapsed' && collapsible === 'offcanvas';
  return <div className="group hidden shrink-0 md:block" data-collapsible={collapsed ? 'icon' : offcanvas ? 'offcanvas' : ''} data-side={side} data-state={state}><div className={cn('relative w-[var(--sidebar-width)] transition-[width] duration-200', collapsed && 'w-[var(--sidebar-width-icon)]', offcanvas && 'w-0', variant !== 'sidebar' && 'p-2', side === 'right' && 'rotate-180')} /><div className={cn('fixed inset-y-0 z-40 hidden h-screen w-[var(--sidebar-width)] transition-[left,right,width] duration-200 md:flex', side === 'left' ? 'left-0 border-r border-border' : 'right-0 border-l border-border', collapsed && 'w-[var(--sidebar-width-icon)]', offcanvas && (side === 'left' ? '-left-[var(--sidebar-width)]' : '-right-[var(--sidebar-width)]'), variant === 'floating' && 'p-2', className)} {...props}><div className={cn('flex h-full w-full flex-col bg-surface', variant === 'floating' && 'rounded-lg border border-border shadow-card', side === 'right' && 'rotate-180')}>{children}</div></div></div>;
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return <main className={cn('relative flex min-h-screen w-full min-w-0 flex-1 basis-0 flex-col overflow-x-hidden bg-surface-muted', className)} {...props} />;
}

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return <Button aria-label="Alternar sidebar" data-sidebar="trigger" onClick={(event) => { onClick?.(event); toggleSidebar(); }} size="icon" variant="ghost" className={cn('size-11', className)} {...props}><PanelLeftIcon size={18} /><span className="sr-only">Alternar sidebar</span></Button>;
}

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();
  return <button aria-label="Alternar sidebar" className={cn('absolute inset-y-0 right-0 z-20 hidden w-4 translate-x-1/2 cursor-e-resize hover:bg-brand/10 md:block', className)} onClick={toggleSidebar} title="Alternar sidebar" type="button" {...props} />;
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('flex flex-col gap-2 p-3', className)} {...props} />; }
export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('flex flex-col gap-2 border-t border-border p-3', className)} {...props} />; }
export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto', className)} {...props} />; }
export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('relative flex w-full min-w-0 flex-col p-2', className)} {...props} />; }
export function SidebarGroupLabel({ className, asChild = false, ...props }: React.ComponentProps<'div'> & { asChild?: boolean }) { const Comp = asChild ? Slot : 'div'; return <Comp className={cn('flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-bold uppercase tracking-[0.14em] text-muted transition-opacity group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0', className)} {...props} />; }
export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('w-full text-sm', className)} {...props} />; }
export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) { return <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props} />; }
export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) { return <li className={cn('group/menu-item relative', className)} {...props} />; }

const sidebarMenuButtonVariants = cva('peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-left text-sm font-semibold outline-none transition-[width,height,padding] hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand active:bg-surface-muted disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span:last-child]:hidden', { variants: { variant: { default: '', outline: 'border border-border' }, size: { default: 'min-h-11', sm: 'min-h-9 text-xs', lg: 'min-h-12' } }, defaultVariants: { variant: 'default', size: 'default' } });

export function SidebarMenuButton({ asChild = false, isActive = false, tooltip, variant, size, className, ...props }: React.ComponentProps<'button'> & { asChild?: boolean; isActive?: boolean; tooltip?: string | React.ComponentProps<typeof TooltipContent> } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const Comp = asChild ? Slot : 'button';
  const button = <Comp aria-current={isActive ? 'page' : undefined} data-active={isActive} data-sidebar="menu-button" className={cn(sidebarMenuButtonVariants({ variant, size }), isActive && 'bg-brand-soft text-brand-strong', className)} {...props} />;
  if (!tooltip) return button;
  const content = typeof tooltip === 'string' ? { children: tooltip } : tooltip;
  return <Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent side="right" hidden={state !== 'collapsed' || isMobile} {...content} /></Tooltip>;
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('pointer-events-none absolute right-2 top-2 flex min-h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium', className)} {...props} />; }
