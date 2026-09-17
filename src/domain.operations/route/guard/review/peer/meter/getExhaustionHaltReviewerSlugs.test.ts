import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getExhaustionHaltReviewerSlugs } from './getExhaustionHaltReviewerSlugs';

const asMeter = (input: {
  slug: string;
  level: number;
  verdict: ReviewPeerVerdict;
  skippedByDispute?: boolean;
}): GuardPeerMeterStatus => ({
  // .why a constant is honest here = `index` is the reviewer's declared identity key,
  //      and this transformer reads slug + verdict + skippedByDispute only
  index: 1,
  slug: input.slug,
  level: input.level,
  verdict: input.verdict,
  rounds: 0,
  budget: 3,
  awaits: false,
  overruled: false,
  skippedByDispute: input.skippedByDispute ?? false,
  disputed: { blockers: 0, nitpicks: 0 },
  blockers: 0,
  nitpicks: 0,
  path: null,
});

/**
 * .what = clamps that a DISPUTED exhausted lane does NOT halt passage
 * .why = a dispute lets the road drive on this generation (S15). before the fix, a fully-disputed,
 *        exhausted lane still triggered the exhaustion halt — the dispute's "drive on" was defeated
 *        at the exhaustion gate. this suite goes RED without the dispute subtraction.
 */
describe('getExhaustionHaltReviewerSlugs', () => {
  given(
    '[case1] an exhausted lane the driver DISPUTED, plus a plain exhausted lane',
    () => {
      const meters = [
        asMeter({
          slug: 'disputed-lane',
          level: 3,
          verdict: 'exhausted',
          skippedByDispute: true,
        }),
        asMeter({ slug: 'plain-lane', level: 3, verdict: 'exhausted' }),
      ];

      when('[t0] the exhaustion halt set is computed', () => {
        then(
          'the DISPUTED lane is excluded — it drives on this generation',
          () => {
            // 🔴 red without the dispute subtraction: `disputed-lane` would halt the road the dispute
            //    was meant to grant (S15)
            const halt = getExhaustionHaltReviewerSlugs({
              meters,
              overruledLevels: new Set<number>(),
            });
            expect(halt).not.toContain('disputed-lane');
          },
        );

        then(
          'the plain exhausted lane still halts — its exhaustion is real',
          () => {
            const halt = getExhaustionHaltReviewerSlugs({
              meters,
              overruledLevels: new Set<number>(),
            });
            expect(halt).toEqual(['plain-lane']);
          },
        );
      });
    },
  );

  given('[case2] every exhausted lane is disputed', () => {
    const meters = [
      asMeter({
        slug: 'a',
        level: 3,
        verdict: 'exhausted',
        skippedByDispute: true,
      }),
      asMeter({
        slug: 'b',
        level: 1,
        verdict: 'exhausted',
        skippedByDispute: true,
      }),
    ];

    when('[t0] the exhaustion halt set is computed', () => {
      then('the set is empty — the road drives on, no halt', () => {
        expect(
          getExhaustionHaltReviewerSlugs({
            meters,
            overruledLevels: new Set<number>(),
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] an exhausted lane at an overruled level', () => {
    const meters = [
      asMeter({ slug: 'forgiven', level: 1, verdict: 'exhausted' }),
      asMeter({ slug: 'live', level: 3, verdict: 'exhausted' }),
    ];

    when('[t0] the level is overruled', () => {
      then(
        'the forgiven lane is excluded too — a human waved it through',
        () => {
          expect(
            getExhaustionHaltReviewerSlugs({
              meters,
              overruledLevels: new Set<number>([1]),
            }),
          ).toEqual(['live']);
        },
      );
    });
  });
});
