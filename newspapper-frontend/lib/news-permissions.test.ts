import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canTransition } from './news-permissions';

describe('news permissions', () => {
  it('allows authors and admins to send drafts to review', () => {
    assert.equal(canTransition('author', 'draft', 'inReview'), true);
    assert.equal(canTransition('admin', 'draft', 'inReview'), true);
    assert.equal(canTransition('editor', 'draft', 'inReview'), false);
  });

  it('allows editors and admins to publish reviewed news', () => {
    assert.equal(canTransition('editor', 'inReview', 'published'), true);
    assert.equal(canTransition('admin', 'inReview', 'published'), true);
    assert.equal(canTransition('author', 'inReview', 'published'), false);
  });
});
