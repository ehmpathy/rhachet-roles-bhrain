import { given, then, when } from 'test-fns';

import { getAllRouteGuardReviewPeersUncontemplated } from './getAllRouteGuardReviewPeersUncontemplated';

const H1 = 'aaa111';
const H2 = 'bbb222';

/**
 * .what = builds a peer conversation path from its coordinates
 * .why = the pair is matched on the PATH now, so a test that passes bare hashes
 *        cannot exercise the real key. the grammar is spelled out here verbatim
 *        rather than derived through getRouteGuardReviewPeerPathTaken — a test that
 *        built its expected path with the same transform under test would assert
 *        only that the transform equals itself
 */
const asPath = (input: {
  kind: 'given' | 'taken';
  iteration: number;
  hash: string;
  index: number;
  slug: string;
}): string => {
  const infix =
    input.kind === 'given' ? '._.given.by_peer.' : '._.taken.by_self.';
  const iter = String(input.iteration).padStart(3, '0');
  const idx = String(input.index).padStart(3, '0');
  return `/repo/.reviews/peer/1.execute._.review.i${iter}.${input.hash}.r${idx}${infix}${input.slug}.md`;
};

/**
 * .note = case3 INVERTED under P2, deliberately. it asserted that a taken at a
 *         prior hash tags `stale` — that was the old (slug, hashCurrent) key, and
 *         it is the exact behavior the wish calls defect D2: an edit to the artifact
 *         moved the hash, so the driver's answer went stale and the debt cleared as
 *         a side effect. under P2 a taken pairs its OWN given, so an answer stays an
 *         answer however many times the artifact changes after it.
 *         the `stale` tag survives with a new, sharper sense: the REVIEWER spoke
 *         again (case8, case9), which is the only way an answered reviewer becomes owed.
 */
describe('getAllRouteGuardReviewPeersUncontemplated', () => {
  given('[case1] every given that holds blockers has a paired taken', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('returns an empty array', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          givens: [
            {
              slug: 'arch',
              blockers: 2,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'arch',
              }),
            },
            {
              slug: 'mech',
              blockers: 1,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 2,
                slug: 'mech',
              }),
            },
          ],
          takens: [
            {
              slug: 'arch',
              pathTaken: asPath({
                kind: 'taken',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'arch',
              }),
            },
            {
              slug: 'mech',
              pathTaken: asPath({
                kind: 'taken',
                iteration: 1,
                hash: H1,
                index: 2,
                slug: 'mech',
              }),
            },
          ],
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] a given that holds blockers with no taken at all', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('tags the slug as absent', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          givens: [
            {
              slug: 'arch',
              blockers: 2,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'arch',
              }),
            },
          ],
          takens: [],
        });
        expect(result).toEqual([{ slug: 'arch', tag: 'absent' }]);
      });
    });
  });

  given(
    '[case3] a carried given, answered at its own hash, after the artifact moved',
    () => {
      when('[t0] the uncontemplated set is computed', () => {
        then('the answer still counts — no debt (this is P2)', () => {
          // the driver answered the H1 given, then edited the artifact (hash → H2).
          // the reviewer has NOT spoken since, so its H1 given is still the latest.
          // under the old (slug, hashCurrent) key this tagged `stale` and the debt
          // was discharged by the edit — the cheapest exit from a blocker (D2).
          const result = getAllRouteGuardReviewPeersUncontemplated({
            givens: [
              {
                slug: 'arch',
                blockers: 2,
                pathGiven: asPath({
                  kind: 'given',
                  iteration: 1,
                  hash: H1,
                  index: 1,
                  slug: 'arch',
                }),
              },
            ],
            takens: [
              {
                slug: 'arch',
                pathTaken: asPath({
                  kind: 'taken',
                  iteration: 1,
                  hash: H1,
                  index: 1,
                  slug: 'arch',
                }),
              },
            ],
          });
          expect(result).toEqual([]);
        });
      });
    },
  );

  given('[case4] a clean reviewer (0 blockers, 0 nitpicks)', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('does not require contemplation', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          givens: [
            {
              slug: 'arch',
              blockers: 0,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'arch',
              }),
            },
          ],
          takens: [],
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case5] a nitpick-only reviewer (0 blockers, N nitpicks)', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('does not require contemplation (the fourth quadrant)', () => {
        // blockers is the only gate; nitpicks are informational everywhere
        const result = getAllRouteGuardReviewPeersUncontemplated({
          givens: [
            {
              slug: 'mech',
              blockers: 0,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'mech',
              }),
            },
          ],
          takens: [],
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case6] a mix — one paired, one absent, one stale, one clean', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('returns only the absent and stale, tagged distinctly', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          givens: [
            {
              slug: 'paired',
              blockers: 1,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'paired',
              }),
            },
            {
              slug: 'absent',
              blockers: 1,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 2,
                slug: 'absent',
              }),
            },
            // this reviewer spoke again at H2; its old answer was to the H1 given
            {
              slug: 'stale',
              blockers: 1,
              pathGiven: asPath({
                kind: 'given',
                iteration: 2,
                hash: H2,
                index: 3,
                slug: 'stale',
              }),
            },
            {
              slug: 'clean',
              blockers: 0,
              pathGiven: asPath({
                kind: 'given',
                iteration: 1,
                hash: H1,
                index: 4,
                slug: 'clean',
              }),
            },
          ],
          takens: [
            {
              slug: 'paired',
              pathTaken: asPath({
                kind: 'taken',
                iteration: 1,
                hash: H1,
                index: 1,
                slug: 'paired',
              }),
            },
            {
              slug: 'stale',
              pathTaken: asPath({
                kind: 'taken',
                iteration: 1,
                hash: H1,
                index: 3,
                slug: 'stale',
              }),
            },
          ],
        });
        expect(result).toEqual([
          { slug: 'absent', tag: 'absent' },
          { slug: 'stale', tag: 'stale' },
        ]);
      });
    });
  });

  given(
    '[case7] a taken at the CURRENT hash that answers no given at that hash',
    () => {
      when('[t0] the uncontemplated set is computed', () => {
        then('does not discharge the live given', () => {
          // the inverse of case3, and the direction a naive `taken.hash === hashCurrent`
          // key gets WRONG in the other direction: a taken written against some other
          // generation must not satisfy the given that is actually live
          const result = getAllRouteGuardReviewPeersUncontemplated({
            givens: [
              {
                slug: 'arch',
                blockers: 2,
                pathGiven: asPath({
                  kind: 'given',
                  iteration: 2,
                  hash: H2,
                  index: 1,
                  slug: 'arch',
                }),
              },
            ],
            takens: [
              {
                slug: 'arch',
                pathTaken: asPath({
                  kind: 'taken',
                  iteration: 1,
                  hash: H1,
                  index: 1,
                  slug: 'arch',
                }),
              },
            ],
          });
          expect(result).toEqual([{ slug: 'arch', tag: 'stale' }]);
        });
      });
    },
  );

  given(
    '[case8] both directions at once — a carried answer AND a fresh blocker',
    () => {
      when('[t0] the uncontemplated set is computed', () => {
        then('the carried answer holds while the fresh blocker gates', () => {
          // each direction fails under a DIFFERENT wrong key, so one case cannot
          // cover both (1.vision.yield.md, case=8 [t3]→[t6]):
          //   - `taken.hash === hashCurrent` would wrongly gate `carried`
          //   - a key that ignores the hash entirely would wrongly clear `fresh`
          const result = getAllRouteGuardReviewPeersUncontemplated({
            givens: [
              {
                slug: 'carried',
                blockers: 3,
                pathGiven: asPath({
                  kind: 'given',
                  iteration: 1,
                  hash: H1,
                  index: 1,
                  slug: 'carried',
                }),
              },
              {
                slug: 'fresh',
                blockers: 1,
                pathGiven: asPath({
                  kind: 'given',
                  iteration: 2,
                  hash: H2,
                  index: 2,
                  slug: 'fresh',
                }),
              },
            ],
            takens: [
              {
                slug: 'carried',
                pathTaken: asPath({
                  kind: 'taken',
                  iteration: 1,
                  hash: H1,
                  index: 1,
                  slug: 'carried',
                }),
              },
            ],
          });
          expect(result).toEqual([{ slug: 'fresh', tag: 'absent' }]);
        });
      });
    },
  );

  given(
    '[case9] the reviewer re-runs at the SAME hash and refuses the answer',
    () => {
      // the honest convergence loop, and the one every other case misses:
      // a .taken write does NOT move the artifact hash (the hash covers the
      // `artifacts:` set only), so a reviewer that re-runs after it was answered
      // writes its fresh given at the SAME hash, one iteration later.
      //
      // 🔴 (slug, hash) cannot tell the two givens apart, so it hands the i002
      // critique the i001 answer and opens the gate on an unanswered blocker —
      // the wish's defect #1, reached through the most common honest operation
      // in the loop rather than through any attempt to escape.
      const scene = {
        givenAnswered: {
          slug: 'arch',
          blockers: 2,
          pathGiven: asPath({
            kind: 'given',
            iteration: 1,
            hash: H1,
            index: 1,
            slug: 'arch',
          }),
        },
        givenReRaised: {
          slug: 'arch',
          blockers: 2,
          pathGiven: asPath({
            kind: 'given',
            iteration: 2,
            hash: H1,
            index: 1,
            slug: 'arch',
          }),
        },
        takenForI001: {
          slug: 'arch',
          pathTaken: asPath({
            kind: 'taken',
            iteration: 1,
            hash: H1,
            index: 1,
            slug: 'arch',
          }),
        },
      };

      when(
        '[t0] the re-raised given is the latest, answered only at i001',
        () => {
          then('the fresh critique still gates, tagged stale', () => {
            const result = getAllRouteGuardReviewPeersUncontemplated({
              givens: [scene.givenReRaised],
              takens: [scene.takenForI001],
            });
            expect(result).toEqual([{ slug: 'arch', tag: 'stale' }]);
          });
        },
      );

      when('[t1] the driver answers the re-raise at its own iteration', () => {
        then('the debt discharges', () => {
          const result = getAllRouteGuardReviewPeersUncontemplated({
            givens: [scene.givenReRaised],
            takens: [
              scene.takenForI001,
              {
                slug: 'arch',
                pathTaken: asPath({
                  kind: 'taken',
                  iteration: 2,
                  hash: H1,
                  index: 1,
                  slug: 'arch',
                }),
              },
            ],
          });
          expect(result).toEqual([]);
        });
      });

      when(
        '[t2] the answered given is still the latest — no re-raise yet',
        () => {
          then(
            'the answer holds, so the same hash does not gate by itself',
            () => {
              // the guard against an over-correction: it must be the ITERATION that
              // separates them, never the hash, or case3 breaks
              const result = getAllRouteGuardReviewPeersUncontemplated({
                givens: [scene.givenAnswered],
                takens: [scene.takenForI001],
              });
              expect(result).toEqual([]);
            },
          );
        },
      );
    },
  );
});
