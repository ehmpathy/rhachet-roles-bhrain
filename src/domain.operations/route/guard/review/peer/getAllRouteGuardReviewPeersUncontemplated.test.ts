import { given, then, when } from 'test-fns';

import { getAllRouteGuardReviewPeersUncontemplated } from './getAllRouteGuardReviewPeersUncontemplated';

const HASH = 'abc123';

describe('getAllRouteGuardReviewPeersUncontemplated', () => {
  given(
    '[case1] every given that holds blockers has a current-hash taken',
    () => {
      when('[t0] the uncontemplated set is computed', () => {
        then('returns an empty array', () => {
          const result = getAllRouteGuardReviewPeersUncontemplated({
            hashCurrent: HASH,
            givens: [
              { slug: 'arch', blockers: 2 },
              { slug: 'mech', blockers: 1 },
            ],
            takens: [
              { slug: 'arch', hash: HASH },
              { slug: 'mech', hash: HASH },
            ],
          });
          expect(result).toEqual([]);
        });
      });
    },
  );

  given('[case2] a given that holds blockers with no taken at all', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('tags the slug as absent', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          hashCurrent: HASH,
          givens: [{ slug: 'arch', blockers: 2 }],
          takens: [],
        });
        expect(result).toEqual([{ slug: 'arch', tag: 'absent' }]);
      });
    });
  });

  given(
    '[case3] a given with blockers whose only taken is at a prior hash',
    () => {
      when('[t0] the uncontemplated set is computed', () => {
        then('tags the slug as stale', () => {
          const result = getAllRouteGuardReviewPeersUncontemplated({
            hashCurrent: HASH,
            givens: [{ slug: 'arch', blockers: 2 }],
            takens: [{ slug: 'arch', hash: 'oldhash' }],
          });
          expect(result).toEqual([{ slug: 'arch', tag: 'stale' }]);
        });
      });
    },
  );

  given('[case4] a clean reviewer (0 blockers, 0 nitpicks)', () => {
    when('[t0] the uncontemplated set is computed', () => {
      then('does not require contemplation', () => {
        const result = getAllRouteGuardReviewPeersUncontemplated({
          hashCurrent: HASH,
          givens: [{ slug: 'arch', blockers: 0 }],
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
          hashCurrent: HASH,
          givens: [{ slug: 'mech', blockers: 0 }],
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
          hashCurrent: HASH,
          givens: [
            { slug: 'paired', blockers: 1 },
            { slug: 'absent', blockers: 1 },
            { slug: 'stale', blockers: 1 },
            { slug: 'clean', blockers: 0 },
          ],
          takens: [
            { slug: 'paired', hash: HASH },
            { slug: 'stale', hash: 'oldhash' },
          ],
        });
        expect(result).toEqual([
          { slug: 'absent', tag: 'absent' },
          { slug: 'stale', tag: 'stale' },
        ]);
      });
    });
  });
});
