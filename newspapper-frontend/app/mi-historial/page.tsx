import type { Metadata } from 'next';
import { ReadingHistoryContent } from '@/components/news/reader-library-content';

export const metadata: Metadata = {
  title: 'Mi historial',
  description: 'Retoma las noticias que has leído.',
};

export default function ReadingHistoryPage() {
  return <ReadingHistoryContent />;
}
