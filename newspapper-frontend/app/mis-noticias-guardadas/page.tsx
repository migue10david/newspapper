import type { Metadata } from 'next';
import { SavedNewsContent } from '@/components/news/reader-library-content';

export const metadata: Metadata = {
  title: 'Noticias guardadas',
  description: 'Consulta las noticias que has guardado.',
};

export default function SavedNewsPage() {
  return <SavedNewsContent />;
}
