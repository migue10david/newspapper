'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buildCanonicalNewsUrl, getShareLinks } from '@/lib/share-utils';

export function ShareActions({ slug, title }: { slug: string; title: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  async function copyLink() {
    const url = buildCanonicalNewsUrl(window.location.origin, slug);
    try {
      await copyText(url);
      setHasError(false);
      setMessage('Enlace copiado.');
    } catch {
      setHasError(true);
      setMessage('No se pudo copiar el enlace. Puedes seleccionarlo desde la barra del navegador.');
    }
  }

  async function shareNews() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title,
        text: `Lee: ${title}`,
        url: buildCanonicalNewsUrl(window.location.origin, slug),
      });
      setHasError(false);
      setMessage('Compartido correctamente.');
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setHasError(true);
      setMessage('No se pudo abrir el menú de compartir.');
    }
  }

  const canonicalUrl = typeof window === 'undefined'
    ? `/noticia/${encodeURIComponent(slug)}`
    : buildCanonicalNewsUrl(window.location.origin, slug);
  const shareLinks = getShareLinks(canonicalUrl, title);

  return (
    <section className="mt-8 border-y border-border py-5" aria-labelledby="share-title">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-2 text-sm font-bold uppercase tracking-[0.14em]" id="share-title">Compartir noticia</h2>
        <Button onClick={() => void copyLink()} size="sm" type="button" variant="outline">Copiar enlace</Button>
        <Button onClick={() => void shareNews()} size="sm" type="button" variant="outline">Compartir</Button>
        <a className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-brand hover:text-brand" href={shareLinks.whatsapp} rel="noreferrer" target="_blank">WhatsApp</a>
        <a className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-brand hover:text-brand" href={shareLinks.x} rel="noreferrer" target="_blank">X</a>
      </div>
      {message ? <div className="mt-3" aria-live="polite"><Alert variant={hasError ? 'danger' : 'success'}>{message}</Alert></div> : null}
    </section>
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy command failed');
}
