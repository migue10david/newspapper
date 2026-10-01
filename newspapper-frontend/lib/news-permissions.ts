import type { NewsStatus } from './news-api';

export function canTransition(
  role: string | null,
  status: NewsStatus,
  target: NewsStatus,
): boolean {
  if ((role === 'author' || role === 'admin') && target === 'inReview') {
    return status === 'draft';
  }
  if (role === 'editor' || role === 'admin') {
    return status === 'inReview' && ['draft', 'published', 'scheduled'].includes(target);
  }
  return false;
}
