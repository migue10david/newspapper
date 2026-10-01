'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initialize = useAuthStore((state) => state.initialize);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && !isInitialized) {
      void initialize();
    }
  }, [initialize, isInitialized, isLoginPage]);

  useEffect(() => {
    if (isLoginPage || !isInitialized) {
      return;
    }

    if (!accessToken) {
      router.replace('/admin/login');
      return;
    }

  }, [accessToken, isInitialized, isLoginPage, role, router]);

  if (isLoginPage) {
    return children;
  }

  if (!isInitialized || !accessToken || !role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status" aria-live="polite">
        Verificando sesión…
      </div>
    );
  }

  return children;
}
