import type { ReactNode } from 'react';
import { AdminAuthGuard } from '@/components/auth/admin-auth-guard';
import { AdminQueryProvider } from '@/components/providers/admin-query-provider';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminQueryProvider>
      <AdminAuthGuard><AdminShell>{children}</AdminShell></AdminAuthGuard>
    </AdminQueryProvider>
  );
}
