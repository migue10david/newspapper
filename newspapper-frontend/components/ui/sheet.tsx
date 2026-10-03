'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetPortal({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Portal>{children}</DialogPrimitive.Portal>;
}

export function SheetOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-out data-[state=open]:fade-in', className)} {...props} />;
}

export function SheetContent({ className, children, side = 'left', ...props }: ComponentProps<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }) {
  return <SheetPortal><SheetOverlay /><DialogPrimitive.Content className={cn('fixed inset-y-0 z-50 flex w-[min(20rem,88vw)] flex-col border-border bg-surface p-0 shadow-elevated outline-none transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300', side === 'right' ? 'right-0 border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0' : 'left-0 border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0', className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><X aria-hidden="true" size={18} /><span className="sr-only">Cerrar</span></DialogPrimitive.Close></DialogPrimitive.Content></SheetPortal>;
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2 p-4', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('font-display-editorial text-lg font-bold', className)} {...props} />;
}

export function SheetDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted', className)} {...props} />;
}
