import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getCacheSafePeerReviewArtifact } from './getCacheSafePeerReviewArtifact';

/**
 * .what = a cached peer-review artifact at one rung, authored by one slug
 * .why = every case below varies only the rung, the slug, and the blocker count, so the
 *        rest of the entity is derived rather than pasted
 */
const asCachedReview = (input: {
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
    exitCode: input.blockers > 0 ? 2 : 0,
    exitClass: 'passed',
    stdout: '',
    stderr: '',
    durationMs: 1000,
  });

describe('getCacheSafePeerReviewArtifact', () => {
  given('[case1] a rung whose tenant did NOT change', () => {
    const cachedReviews = [
      asCachedReview({ index: 1, slug: 'architect', blockers: 0 }),
      asCachedReview({ index: 2, slug: 'mechanic', blockers: 3 }),
    ];

    when('[t0] the same reviewer asks for its own cache', () => {
      then('it is returned', () => {
        const cached = getCacheSafePeerReviewArtifact({
          cachedReviews,
          index: 2,
          slug: 'mechanic',
        });
        expect(cached?.blockers).toEqual(3);
      });
    });

    when('[t1] no cache exists at that rung', () => {
      then('null is returned', () => {
        expect(
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 9,
            slug: 'ergonomist',
          }),
        ).toEqual(null);
      });
    });
  });

  /**
   * 🔴 the clamp. without the slug guard this case returns the predecessor's `0 blockers`,
   *    and the caller's reuse branch then SKIPS the round outright and reports approved —
   *    a reviewer that never spoke, a stone that passes on a verdict nobody gave.
   */
  given('[case2] a rung whose tenant was SWAPPED, predecessor approved', () => {
    const cachedReviews = [
      asCachedReview({ index: 1, slug: 'architect', blockers: 0 }),
    ];

    when('[t0] a different reviewer now holds rung 1', () => {
      then('🔴 the predecessor cache is DISCARDED', () => {
        expect(
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'mech-test-intent-asserts',
          }),
        ).toEqual(null);
      });
    });
  });

  /**
   * 🔴 an INSERT is worse than a swap and easier to do unnoticed — you remove no one, and
   *    every later rung shifts by one at once.
   */
  given('[case3] a reviewer INSERTED above two extant lanes', () => {
    const cachedReviews = [
      asCachedReview({ index: 1, slug: 'architect', blockers: 0 }),
      asCachedReview({ index: 2, slug: 'mechanic', blockers: 0 }),
    ];

    when('[t0] every lane below the insert has shifted by one', () => {
      then('🔴 both shifted lanes discard their inherited caches', () => {
        expect(
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 2,
            slug: 'architect',
          }),
        ).toEqual(null);
        expect(
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'newcomer',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case4] a slug that carries a path separator', () => {
    const cachedReviews = [
      asCachedReview({
        index: 1,
        slug: '.test-mock-review.sh',
        blockers: 0,
      }),
    ];

    when('[t0] the caller passes the RAW config slug', () => {
      then('it still matches — both sides are sanitized', () => {
        const cached = getCacheSafePeerReviewArtifact({
          cachedReviews,
          index: 1,
          slug: '.test/mock-review.sh',
        });
        expect(cached?.index).toEqual(1);
      });
    });
  });

  given('[case5] a cached artifact whose filename breaks the grammar', () => {
    const cachedReviews = [
      new RouteStoneGuardReviewArtifact({
        ...asCachedReview({ index: 1, slug: 'architect', blockers: 0 }),
        path: '.behavior/demo/.reviews/peer/some-stray-file.md',
      }),
    ];

    when('[t0] the slug cannot be read from the path', () => {
      then('🔴 it is treated as a MISMATCH, never as a match', () => {
        expect(
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'architect',
          }),
        ).toEqual(null);
      });

      then('it does NOT throw — a hot-path parse must stay lenient', () => {
        expect(() =>
          getCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'architect',
          }),
        ).not.toThrow();
      });
    });
  });
});
