import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getOneReviewPeerVerdictOfPass } from './getOneReviewPeerVerdictOfPass';

/**
 * .what = a peer-review artifact at one rung, authored by one slug
 * .why = every case varies only the rung, the slug, and the tally
 */
const asReview = (input: {
  index: number;
  slug: string;
  blockers: number;
}): RouteStoneGuardReviewArtifact =>
  new RouteStoneGuardReviewArtifact({
    stone: { path: '.behavior/demo/5.1.execution.stone' },
    hash: 'h1',
    iteration: 7,
    index: input.index,
    path: `.behavior/demo/.reviews/peer/5.1.execution._.review.i007.h1.r${String(
      input.index,
    ).padStart(3, '0')}._.given.by_peer.${input.slug}.md`,
    blockers: input.blockers,
    nitpicks: 0,
    tallier: 'deterministic',
    talliedBy: null,
    exitCode: input.blockers > 0 ? 2 : 0,
    exitClass: 'passed',
    stdout: '',
    stderr: '',
    durationMs: null,
  });

const LANE = { index: 1, slug: 'arch', budget: 3 };
const THRESHOLDS = { allowBlockers: 0, allowNitpicks: 0 };

describe('getOneReviewPeerVerdictOfPass', () => {
  given('[case1] a lane that ran this pass, over a stale cache', () => {
    when('[t0] the fresh artifact is clean and the cache is dirty', () => {
      const verdict = getOneReviewPeerVerdictOfPass({
        lane: LANE,
        rounds: 2,
        reviews: [asReview({ index: 1, slug: 'arch', blockers: 0 })],
        cachedReviews: [asReview({ index: 1, slug: 'arch', blockers: 3 })],
        exhaustedSlugs: [],
        ...THRESHOLDS,
      });

      then('the fresh artifact wins', () => {
        expect(verdict).toEqual('approved');
      });
    });
  });

  given('[case2] a lane that did not run this pass', () => {
    when('[t0] its cache is dirty', () => {
      const verdict = getOneReviewPeerVerdictOfPass({
        lane: LANE,
        rounds: 2,
        reviews: [],
        cachedReviews: [asReview({ index: 1, slug: 'arch', blockers: 3 })],
        exhaustedSlugs: [],
        ...THRESHOLDS,
      });

      then('the cache decides', () => {
        expect(verdict).toEqual('rejected');
      });
    });

    when('[t1] its rung was cached by another slug', () => {
      const verdict = getOneReviewPeerVerdictOfPass({
        lane: LANE,
        rounds: 0,
        reviews: [],
        cachedReviews: [asReview({ index: 1, slug: 'ergo', blockers: 0 })],
        exhaustedSlugs: [],
        ...THRESHOLDS,
      });

      then(
        '🔴 the foreign cache is refused, never read as a clean pass',
        () => {
          expect(verdict).toEqual('queued');
        },
      );
    });
  });

  given('[case3] a lane skipped for want of budget', () => {
    when('[t0] its last artifact rejected', () => {
      const verdict = getOneReviewPeerVerdictOfPass({
        lane: LANE,
        rounds: 3,
        reviews: [],
        cachedReviews: [asReview({ index: 1, slug: 'arch', blockers: 2 })],
        exhaustedSlugs: ['arch'],
        ...THRESHOLDS,
      });

      then('it reads exhausted', () => {
        expect(verdict).toEqual('exhausted');
      });
    });
  });
});
