'use client';

import { use } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NewsEditor, NewsTransitionActions } from '@/components/editorial/news-editor';
import { useManagedNewsDetail } from '@/lib/admin-queries';
import { adminQueryKeys } from '@/lib/admin-queries';
import { Alert } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';

export function AdminNewsDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useManagedNewsDetail(id);
  const queryClient = useQueryClient();
  if (query.error) return <Alert variant="danger" title="No se pudo cargar la noticia">{getErrorMessage(query.error)}</Alert>;
  if (query.isPending || !query.data) return <LoadingState label="Cargando noticia" />;
  return <><NewsEditor news={query.data} /><div className="mx-auto max-w-4xl pb-10"><NewsTransitionActions news={query.data} onUpdated={(updated) => queryClient.setQueryData(adminQueryKeys.newsDetail(id), updated)} /></div></>;
}

function getErrorMessage(reason: unknown): string { return reason instanceof Error ? reason.message : 'No se pudo cargar la noticia.'; }
