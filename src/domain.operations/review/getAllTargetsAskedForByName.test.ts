import { given, then, useThen, when } from 'test-fns';

import { getAllTargetsAskedForByName } from './getAllTargetsAskedForByName';

const ROUTE = '.behavior/v2026_09_20.review-cost-meter';

/**
 * .what = clamps WHICH polluters survive the default drop
 * .why = 🔴 the exemption is the one thing between the polluter default and a
 *        silent scope deletion on every lane whose SUBJECT is a route's own
 *        deliverable — 78 binds across 38 guards in this repo alone.
 *
 *        and it is the one thing between a catch-all glob and a total bypass of
 *        that default. so both halves get cases, and they must be graded
 *        together: a change that exempts the whole world passes half a suite
 *        that only grades the deliberate bind.
 */
describe('getAllTargetsAskedForByName', () => {
  given('[case1] a lane that names a route deliverable', () => {
    /**
     * 🔴 the measured shape: `--paths-with '$route/3.3.blueprint.*.md'`, expanded
     *    by the guard before `stepReview` sees it. every file it matches is a
     *    route artifact, so a side-blind drop empties the scope outright.
     */
    const targets = [
      `${ROUTE}/3.3.blueprint.product.md`,
      `${ROUTE}/3.3.blueprint.contract.md`,
    ];

    when('[t0] the exemption is computed', () => {
      then('🔴 both are asked for by name, so both survive', () => {
        expect(
          getAllTargetsAskedForByName({
            targets,
            globs: [`${ROUTE}/3.3.blueprint.*.md`],
          }).sort(),
        ).toEqual([...targets].sort());
      });
    });
  });

  given('[case2] a lane whose glob ALSO reaches ordinary source', () => {
    /**
     * 🔴 the bound that makes the exemption safe. a catch-all matched source
     *    AND paperwork, so it named no subject in particular — and a total
     *    exemption here would void the default on the widest lanes, which are
     *    exactly the ones it exists for.
     */
    const targets = [
      'src/paddleOut.ts',
      `${ROUTE}/0.wish.md`,
      '.dream/v2026_09_24.fix.a-defect.md',
    ];

    when('[t0] the exemption is computed', () => {
      then('🔴 not one file is exempt — the glob named no subject', () => {
        expect(getAllTargetsAskedForByName({ targets, globs: ['**'] })).toEqual(
          [],
        );
      });
    });
  });

  given('[case3] a lane bound to source alone', () => {
    when('[t0] the exemption is computed', () => {
      then('no file is exempt — and none needed to be', () => {
        expect(
          getAllTargetsAskedForByName({
            targets: ['src/paddleOut.ts', 'src/waveReport.ts'],
            globs: ['src/**'],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] two globs, one specific and one broad', () => {
    /**
     * 🟡 the composition case. a guard may carry several `--paths-with` flags,
     *    and each is graded ALONE — so a broad neighbour must not poison the
     *    specific one, nor the specific one launder the broad.
     */
    const targets = [
      `${ROUTE}/.reviews/peer/1.vision._.given.by_peer.md`,
      'src/paddleOut.ts',
      '.dream/v2026_09_24.fix.a-defect.md',
    ];
    const globs = [`${ROUTE}/.reviews/peer/**`, 'src/**'];

    when('[t0] the exemption is computed', () => {
      const exempt = useThen('it computes', () => ({
        list: getAllTargetsAskedForByName({ targets, globs }),
      }));

      then('🔴 only the specifically-named review survives', () => {
        expect(exempt.list).toEqual([
          `${ROUTE}/.reviews/peer/1.vision._.given.by_peer.md`,
        ]);
      });

      then('🟡 and the dream is NOT exempt — no glob named it', () => {
        expect(exempt.list).not.toContain('.dream/v2026_09_24.fix.a-defect.md');
      });
    });
  });

  given('[case5] a lane with no positive globs at all', () => {
    /**
     * 🔴 the commonest guard shape in this repo: `--diffs since-main` alone.
     *    every target RODE IN, so not one is exempt — which is the case the
     *    whole polluter default was measured against.
     */
    when('[t0] the exemption is computed', () => {
      then('not one file is exempt', () => {
        expect(
          getAllTargetsAskedForByName({
            targets: [`${ROUTE}/0.wish.md`, 'pnpm-lock.yaml'],
            globs: [],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case6] a glob that matches no target in scope', () => {
    when('[t0] the exemption is computed', () => {
      then('it exempts naught — an unmatched glob names no subject', () => {
        expect(
          getAllTargetsAskedForByName({
            targets: [`${ROUTE}/0.wish.md`],
            globs: ['docs/**'],
          }),
        ).toEqual([]);
      });
    });
  });
});
