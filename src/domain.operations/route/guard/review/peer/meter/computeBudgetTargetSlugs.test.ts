import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { computeBudgetTargetSlugs } from './computeBudgetTargetSlugs';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';

// build a minimal meter (the transformer reads only slug + level)
const asMeter = (input: {
  slug: string;
  level: number;
  verdict?: ReviewPeerVerdict;
}): GuardPeerMeterStatus => ({
  slug: input.slug,
  level: input.level,
  verdict: input.verdict ?? 'rejected',
  rounds: 0,
  budget: 3,
  awaits: false,
  overruled: false,
  skippedByDispute: false,
  disputed: { blockers: 0, nitpicks: 0 },
  blockers: 0,
  nitpicks: 0,
  path: null,
});

describe('computeBudgetTargetSlugs', () => {
  given('[case1] a two-level ladder — l1 exhausted, l2 in play', () => {
    const meters = [
      asMeter({ slug: 'linter', level: 1, verdict: 'exhausted' }),
      asMeter({ slug: 'spellcheck', level: 1, verdict: 'exhausted' }),
      asMeter({ slug: 'architect', level: 2, verdict: 'rejected' }),
    ];

    when('[t0] a bare bulk add — no --peer, no --level', () => {
      then('scopes to the LATEST level alone (fork E), not every level', () => {
        // 🔴 red under fork A (return null → all peers): the exhausted l1 lanes would
        //    be silently healed, the exact harm F022 fork E forecloses
        const targets = computeBudgetTargetSlugs({
          meters,
          levelFlag: null,
          peerSlug: null,
        });
        expect(targets).toEqual(new Set(['architect']));
      });

      then('excludes the exhausted lower level', () => {
        const targets = computeBudgetTargetSlugs({
          meters,
          levelFlag: null,
          peerSlug: null,
        });
        expect(targets?.has('linter')).toBe(false);
        expect(targets?.has('spellcheck')).toBe(false);
      });
    });

    when('[t1] an explicit --level 1 names the lower level', () => {
      then('scopes to exactly the peers at that level', () => {
        // 🔴 red without the levelFlag branch — a driver could not reach l1 at all
        const targets = computeBudgetTargetSlugs({
          meters,
          levelFlag: 1,
          peerSlug: null,
        });
        expect(targets).toEqual(new Set(['linter', 'spellcheck']));
      });
    });

    when('[t2] a --peer slug already scopes the write', () => {
      then('returns null so the peer filter stands alone', () => {
        const targets = computeBudgetTargetSlugs({
          meters,
          levelFlag: null,
          peerSlug: 'architect',
        });
        expect(targets).toBeNull();
      });
    });

    when('[t3] an explicit --level names a level no lane sits at', () => {
      then('returns an empty set — touch naught', () => {
        // the caller validates + errors before the write; the transformer stays total
        const targets = computeBudgetTargetSlugs({
          meters,
          levelFlag: 9,
          peerSlug: null,
        });
        expect(targets).toEqual(new Set());
      });
    });
  });

  given('[case2] no lane has run yet — empty meters', () => {
    when('[t0] a bare bulk add', () => {
      then(
        'returns null — extant all-peers behavior, no level to scope',
        () => {
          // 🔴 red if the empty case scoped to a set: a pre-run top-up would touch
          //    naught, a bare no-op for the common early-add flow
          const targets = computeBudgetTargetSlugs({
            meters: [],
            levelFlag: null,
            peerSlug: null,
          });
          expect(targets).toBeNull();
        },
      );
    });

    // 🔴 r008 blocker.1, i009 — checked in the OTHER order, an empty meters array short-
    //    circuited to `null` BEFORE the levelFlag branch ran, so a named `--level` on a
    //    never-run stone fell through as "no scope" and `isPeerBudgetLineInScope` read
    //    that as unscoped and extended EVERY configured peer — the exact blanket sweep
    //    F022 fork E forbids
    when('[t1] an explicit --level is named', () => {
      then(
        'returns an EMPTY set, never null — the fail-fast can see it',
        () => {
          const targets = computeBudgetTargetSlugs({
            meters: [],
            levelFlag: 5,
            peerSlug: null,
          });
          expect(targets).toEqual(new Set());
          expect(targets).not.toBeNull();
        },
      );
    });
  });
});
