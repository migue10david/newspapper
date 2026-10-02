'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import {
  useRecordReadingMutation,
  useRemoveSavedNewsMutation,
  useSaveNewsMutation,
  useSavedNews,
} from '@/lib/engagement-queries';

export function ReaderEngagementActions({ newsId }: { newsId: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initialize = useAuthStore((state) => state.initialize);
  const savedQuery = useSavedNews({ page: 1, size: 50 });
  const saveNews = useSaveNewsMutation();
  const removeSavedNews = useRemoveSavedNewsMutation();
  const recordReading = useRecordReadingMutation();
  const hasRecordedReading = useRef(false);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isInitialized) void initialize();
  }, [initialize, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !accessToken || hasRecordedReading.current) return;
    hasRecordedReading.current = true;
    void recordReading.mutateAsync(newsId).catch(() => undefined);
  }, [accessToken, isInitialized, newsId, recordReading]);

  const savedFromQuery = Boolean(savedQuery.data?.items.some((item) => item.id === newsId));
  const isSaved = savedOverride ?? savedFromQuery;
  const isSaving = saveNews.isPending || removeSavedNews.isPending;

  async function toggleSavedNews() {
    if (!accessToken) return;
    try {
      if (isSaved) {
        await removeSavedNews.mutateAsync(newsId);
        setSavedOverride(false);
      } else {
        await saveNews.mutateAsync(newsId);
        setSavedOverride(true);
      }
    } catch {
      // The mutation error is shown below without interrupting the article.
    }
  }

  if (!isInitialized) {
    return <div className="mt-8 rounded-lg border border-dashed border-border p-4 text-sm text-muted">Comprobando tu sesión…</div>;
  }

  if (!accessToken) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-muted p-4">
        <p className="text-sm text-muted">Inicia sesión para guardar esta noticia y registrar tu lectura.</p>
        <Link className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong" href="/admin/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const error = saveNews.error ?? removeSavedNews.error;
  return (
    <div className="mt-8 space-y-3 rounded-lg border border-border bg-surface-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Tu lectura</p>
          <p className="mt-1 text-sm text-muted">Guarda esta noticia para volver a ella cuando quieras.</p>
        </div>
        <Button disabled={isSaving} isLoading={isSaving} onClick={() => void toggleSavedNews()} type="button" variant={isSaved ? 'secondary' : 'default'}>
          {isSaved ? 'Quitar de guardados' : 'Guardar noticia'}
        </Button>
      </div>
      {error ? <Alert variant="danger">{getErrorMessage(error)}</Alert> : null}
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
