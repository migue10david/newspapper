export function buildCanonicalNewsUrl(origin: string, slug: string): string {
  const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${normalizedOrigin}/noticia/${encodeURIComponent(slug)}`;
}

export function getShareLinks(url: string, title: string): { whatsapp: string; x: string } {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  };
}
