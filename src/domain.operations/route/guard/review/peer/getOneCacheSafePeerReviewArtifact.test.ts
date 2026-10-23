import { given, then, useThen, when } from 'test-fns';

import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getOneCacheSafePeerReviewArtifact } from './getOneCacheSafePeerReviewArtifact';

/**
 * .what = a cached peer-review artifact at one rung, authored by one slug
 * .why = every case below varies only the rung, the slug, and the blocker count, so the
 *        rest of the entity is derived rather than pasted
 */
const asCachedReview = (input: {
  index: number;
  slug: string;
  blockers: number;
  iteration?: number;
  exitClass?: 'passed' | 'constraint' | 'malfunction';
}): RouteStoneGuardReviewArtifact =>
  new RouteStoneGuardReviewArtifact({
    stone: { path: '.behavior/demo/5.1.execution.stone' },
    hash: 'h1',
    iteration: input.iteration ?? 7,
    index: input.index,
    path: `.behavior/demo/.reviews/peer/5.1.execution._.review.i${String(
      input.iteration ?? 7,
    ).padStart(3, '0')}.h1.r${String(input.index).padStart(
      3,
      '0',
    )}._.given.by_peer.${input.slug}.md`,
    blockers: input.blockers,
    nitpicks: 0,
    tallier: 'deterministic',
    talliedBy: null,
    exitCode: input.blockers > 0 ? 2 : 0,
    exitClass: input.exitClass ?? 'passed',
    stdout: '',
    stderr: '',
    durationMs: 1000,
  });

describe('getOneCacheSafePeerReviewArtifact', () => {
  given('[case1] a rung whose tenant did NOT change', () => {
    const cachedReviews = [
      asCachedReview({ index: 1, slug: 'architect', blockers: 0 }),
      asCachedReview({ index: 2, slug: 'mechanic', blockers: 3 }),
    ];

    when('[t0] the same reviewer asks for its own cache', () => {
      then('it is returned', () => {
        const cached = getOneCacheSafePeerReviewArtifact({
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
          getOneCacheSafePeerReviewArtifact({
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
          getOneCacheSafePeerReviewArtifact({
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
          getOneCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 2,
            slug: 'architect',
          }),
        ).toEqual(null);
        expect(
          getOneCacheSafePeerReviewArtifact({
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
        const cached = getOneCacheSafePeerReviewArtifact({
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
      // the useThen block itself is the no-throw assertion: a throw fails it
      const read = useThen(
        'it does NOT throw — a hot-path parse must stay lenient',
        async () => ({
          cached: getOneCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'architect',
          }),
        }),
      );

      then('🔴 it is treated as a MISMATCH, never as a match', () => {
        expect(read.cached).toEqual(null);
      });
    });
  });

  /**
   * 🔴 the clamp for a round re-run at an UNMOVED hash. a `.guard` edit or a brain outage
   *    re-runs every lane with the artifact hash fixed, so one rung holds a given per round.
   *    a first-match read returned the OLDEST — a 412 malfunction from before the account
   *    was restored — and the tree painted `malfunction 💥` on lanes that had just run clean.
   */
  given(
    '[case6] one rung holds a given from two rounds at the same hash',
    () => {
      const cachedReviews = [
        asCachedReview({
          index: 1,
          slug: 'repo-rules',
          blockers: 0,
          iteration: 3,
          exitClass: 'malfunction',
        }),
        asCachedReview({
          index: 1,
          slug: 'repo-rules',
          blockers: 1,
          iteration: 4,
        }),
      ];

      when('[t0] the reviewer asks for its cache', () => {
        then('🔴 the LATEST round is returned, never the first found', () => {
          const cached = getOneCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'repo-rules',
          });
          expect(cached?.iteration).toEqual(4);
          expect(cached?.exitClass).toEqual('passed');
        });
      });
    },
  );

  /**
   * 🔴 the clamp for a TIE on iteration. a max over iteration alone keeps whichever arrived
   *    first, which is glob order, which differs per machine. the path breaks the tie.
   */
  given('[case8] one rung holds two givens tied on iteration', () => {
    const reviewOnHashA = asCachedReview({
      index: 1,
      slug: 'repo-rules',
      blockers: 0,
      iteration: 5,
    });
    const reviewOnHashB = new RouteStoneGuardReviewArtifact({
      ...asCachedReview({
        index: 1,
        slug: 'repo-rules',
        blockers: 2,
        iteration: 5,
      }),
      path: reviewOnHashA.path.replace('.h1.r', '.h2.r'),
    });

    when('[t0] the inputs arrive in either order', () => {
      then('🔴 the same artifact wins both times — the later path', () => {
        const pickedForward = getOneCacheSafePeerReviewArtifact({
          cachedReviews: [reviewOnHashA, reviewOnHashB],
          index: 1,
          slug: 'repo-rules',
        });
        const pickedReverse = getOneCacheSafePeerReviewArtifact({
          cachedReviews: [reviewOnHashB, reviewOnHashA],
          index: 1,
          slug: 'repo-rules',
        });
        expect(pickedForward?.path).toEqual(reviewOnHashB.path);
        expect(pickedReverse?.path).toEqual(reviewOnHashB.path);
      });
    });
  });

  given('[case7] a retired tenant wrote a LATER round at the same rung', () => {
    // the other tenant's file sorts FIRST, so a first-match read lands on it and discards
    const cachedReviews = [
      asCachedReview({ index: 1, slug: 'departed', blockers: 0, iteration: 4 }),
      asCachedReview({
        index: 1,
        slug: 'repo-rules',
        blockers: 1,
        iteration: 3,
      }),
    ];

    when('[t0] the current tenant asks for its cache', () => {
      then(
        'its own round is returned, and the other slug never masks it',
        () => {
          const cached = getOneCacheSafePeerReviewArtifact({
            cachedReviews,
            index: 1,
            slug: 'repo-rules',
          });
          expect(cached?.iteration).toEqual(3);
        },
      );
    });
  });
});
