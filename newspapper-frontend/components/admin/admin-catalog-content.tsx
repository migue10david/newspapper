'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaxonomyManager } from './taxonomy-manager';
import { useAuthStore } from '@/lib/auth-store';
import { PageHeader } from '@/components/ui/page-header';

export function AdminCatalogContent() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (role !== 'editor' && role !== 'admin') router.replace('/');
  }, [role, router]);

  if (role !== 'editor' && role !== 'admin') return null;

  return <section className="space-y-8"><PageHeader eyebrow="Administración editorial" title="Catálogo" description="Ordena las categorías y tags que dan contexto a cada noticia." /><TaxonomyManager /></section>;
}
