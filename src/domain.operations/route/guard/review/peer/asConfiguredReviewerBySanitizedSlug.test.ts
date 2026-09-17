import { given, then, when } from 'test-fns';

import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asConfiguredReviewerBySanitizedSlug } from './asConfiguredReviewerBySanitizedSlug';

describe('asConfiguredReviewerBySanitizedSlug', () => {
  given('[case1] a peer whose slug holds a path separator', () => {
    const peerReviews = [
      { slug: '.test/mock-review.sh', level: 1, budget: 3 },
    ] as RouteStoneGuardReviewPeer[];

    when('[t0] looked up by the sanitized form', () => {
      then('it returns the full reviewer object', () => {
        const map = asConfiguredReviewerBySanitizedSlug({ peerReviews });
        expect(map.get('.test-mock-review.sh')).toEqual({
          slug: '.test/mock-review.sh',
          level: 1,
          budget: 3,
        });
      });
    });
  });

  given('[case2] a slug with no path separator', () => {
    const peerReviews = [
      { slug: 'mechanic', level: 2, budget: 5 },
    ] as RouteStoneGuardReviewPeer[];

    when('[t0] looked up by its own value', () => {
      then('the sanitize is a no-op, and the reviewer is found', () => {
        const map = asConfiguredReviewerBySanitizedSlug({ peerReviews });
        expect(map.get('mechanic')?.budget).toEqual(5);
      });
    });
  });

  given('[case3] no peer reviews configured', () => {
    when('[t0] the map is built', () => {
      then('it is empty', () => {
        const map = asConfiguredReviewerBySanitizedSlug({ peerReviews: [] });
        expect(map.size).toEqual(0);
      });
    });
  });
});
