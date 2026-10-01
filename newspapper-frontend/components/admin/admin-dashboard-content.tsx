'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export function AdminDashboardContent() {
  return <section className="space-y-8"><PageHeader eyebrow="Backoffice" title="Panel editorial" description="Gestiona el ciclo editorial según tus permisos." /><div className="grid gap-5 md:grid-cols-3"><Card><CardHeader><CardTitle>Noticias</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted">Crea, revisa y publica historias con el flujo editorial.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-semibold text-white hover:bg-brand-strong" href="/admin/news">Abrir noticias</Link></CardContent></Card><Card><CardHeader><CardTitle>Trabajo pendiente</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted">Consulta los borradores y contenidos en revisión desde la sala editorial.</p><Link className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand hover:underline" href="/admin/news">Ver actividad →</Link></CardContent></Card><Card><CardHeader><CardTitle>Accesos</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted">La navegación se adapta automáticamente a tu rol.</p></CardContent></Card></div></section>;
}
