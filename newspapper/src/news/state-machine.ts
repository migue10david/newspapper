import { ConflictException, Injectable } from '@nestjs/common';

export const NEWS_STATUSES = [
  'draft',
  'inReview',
  'scheduled',
  'published',
  'archived',
] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

const TRANSITIONS: Readonly<Record<NewsStatus, readonly NewsStatus[]>> = {
  draft: ['inReview', 'archived'],
  inReview: ['draft', 'published', 'scheduled'],
  scheduled: ['draft', 'published'],
  published: ['archived'],
  archived: [],
};

@Injectable()
export class StateMachine {
  assertTransition(from: NewsStatus, to: NewsStatus): void {
    if (!TRANSITIONS[from].includes(to)) {
      throw new ConflictException(
        `Invalid news status transition: ${from} -> ${to}`,
      );
    }
  }

  allowedTargets(from: NewsStatus): readonly NewsStatus[] {
    return TRANSITIONS[from];
  }
}
