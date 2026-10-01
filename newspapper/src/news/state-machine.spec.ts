import { ConflictException } from '@nestjs/common';
import { NewsStatus, StateMachine } from './state-machine';

describe('StateMachine', () => {
  const machine = new StateMachine();

  const valid: Array<[NewsStatus, NewsStatus]> = [
    ['draft', 'inReview'],
    ['draft', 'archived'],
    ['inReview', 'draft'],
    ['inReview', 'published'],
    ['inReview', 'scheduled'],
    ['scheduled', 'draft'],
    ['scheduled', 'published'],
    ['published', 'archived'],
  ];

  it.each(valid)('allows %s -> %s', (from, to) => {
    expect(() => machine.assertTransition(from, to)).not.toThrow();
  });

  const invalid: Array<[NewsStatus, NewsStatus]> = [
    ['draft', 'published'],
    ['draft', 'scheduled'],
    ['inReview', 'archived'],
    ['scheduled', 'inReview'],
    ['published', 'draft'],
    ['published', 'inReview'],
    ['published', 'published'],
    ['archived', 'draft'],
    ['archived', 'published'],
    ['archived', 'published'],
  ];

  it.each(invalid)('rejects %s -> %s with ConflictException', (from, to) => {
    expect(() => machine.assertTransition(from, to)).toThrow(ConflictException);
  });

  it('archived has no outgoing transitions', () => {
    expect(machine.allowedTargets('archived')).toHaveLength(0);
  });
});
