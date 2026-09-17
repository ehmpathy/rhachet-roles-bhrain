import { getError, given, then, when } from 'test-fns';

import { assertAbsorptionHasSubject } from './assertAbsorptionHasSubject';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';

/**
 * .what = clamps the PERMITTED half of a stance — a readable concern on a lane that still counts
 *         toward the tally is a real subject, regardless of the lane's verdict
 * .why = the `reviewed?` judge tallies nitpicks STONE-WIDE, so an approved lane's nitpicks still
 *        count. EVERY concern must be disputable regardless of reviewer status, or the driver
 *        holds no lever to shed an approved lane's concern from a tally it pushes over the floor
 *        (a fundamental invariant, 2026-09-15). the three refusals that remain are NOT reviewer
 *        verdicts: a forgiven level (excluded from the tally), no given, an unreadable malfunction.
 */
const asGiven = (
  input: Partial<RouteGuardReviewPeerGiven>,
): RouteGuardReviewPeerGiven => ({
  slug: 'architect',
  blockers: 3,
  nitpicks: 0,
  unreadable: false,
  iteration: 1,
  pathGiven: 'g1',
  ...input,
});

describe('assertAbsorptionHasSubject', () => {
  const ambient = {
    slug: 'architect',
    isLevelForgiven: false,
  };

  given('[case1] a forgiven level', () => {
    when('[t0] a stance is attempted', () => {
      then('it is refused — a human already lifted the gate', () => {
        const error = getError(() =>
          assertAbsorptionHasSubject(asGiven({ blockers: 3 }), {
            ...ambient,
            isLevelForgiven: true,
          }),
        );
        expect(error.message).toContain('already forgiven');
      });
    });
  });

  given('[case2] no given — the reviewer has not spoken', () => {
    when('[t0] a stance is attempted', () => {
      then('it is refused — there is no concern to take a stance on', () => {
        const error = getError(() => assertAbsorptionHasSubject(null, ambient));
        expect(error.message).toContain('has not spoken');
      });
    });
  });

  given('[case3] an UNREADABLE given — a malfunction, never a verdict', () => {
    // its 1-blocker count is FABRICATED. a malfunction is answered by a RE-RUN, never a stance
    // (rule.always.diagnose-reviewer-malfunctions), and the entrance gate skips it for the same
    // reason — so this set-path guard must refuse it, or the two gates disagree (F030)
    when('[t0] a stance is attempted', () => {
      then('it is refused — diagnose and re-run, do not take a stance', () => {
        const error = getError(() =>
          assertAbsorptionHasSubject(
            asGiven({ blockers: 1, unreadable: true }),
            ambient,
          ),
        );
        expect(error.message).toContain('malfunctioned');
        expect(error.message).toContain('re-arrive');
      });
    });
  });

  given(
    '[case4] an APPROVED verdict — a readable concern on a lane that still counts',
    () => {
      // 🔴 the clamp for the fundamental invariant: the judge tallies STONE-WIDE, so an approved
      //    lane's nitpicks count against the threshold. the driver MUST be able to dispute them to
      //    shed them from the tally — so an approved lane is a real subject, not a refusal
      //    (2026-09-15; was a `does not hold the road` throw before the fix)
      when('[t0] a stance is attempted on an approved lane', () => {
        then(
          'it passes — the concern counts toward the tally, so it is disputable',
          () => {
            const subject = assertAbsorptionHasSubject(
              asGiven({ blockers: 0, nitpicks: 2 }),
              ambient,
            );
            expect(subject.nitpicks).toEqual(2);
          },
        );
      });

      when('[t1] a fully clean lane — no concern raised', () => {
        // assertAbsorptionHasSubject confirms a readable verdict exists; the ORDINAL bound
        // (setStoneAsConcernAbsorbed) is what refuses `nitpick.1` against a 0-nitpick lane, so a clean lane
        // passes THIS guard and is caught downstream
        then('it passes — the readable verdict is the subject', () => {
          expect(() =>
            assertAbsorptionHasSubject(
              asGiven({ blockers: 0, nitpicks: 0 }),
              ambient,
            ),
          ).not.toThrow();
        });
      });
    },
  );

  given('[case5] a REJECTED, readable verdict — a real subject', () => {
    when('[t0] a stance is attempted', () => {
      then('it passes — there is a verdict to take a stance on', () => {
        expect(() =>
          assertAbsorptionHasSubject(
            asGiven({ blockers: 3, nitpicks: 0 }),
            ambient,
          ),
        ).not.toThrow();
      });
    });

    when('[t1] a nitpick-only rejection over the allowance', () => {
      then(
        'it passes — a strict allowance makes the nitpicks a real verdict',
        () => {
          expect(() =>
            assertAbsorptionHasSubject(
              asGiven({ blockers: 0, nitpicks: 8 }),
              ambient,
            ),
          ).not.toThrow();
        },
      );
    });
  });

  // r10 b3 — the three refusals above are asserted with `toContain` alone, so a reword
  // that keeps one fragment and wrecks the shape passes review. these pin the bytes
  given('[case6] the rendered refusals, whole', () => {
    when('[t0] the level is forgiven', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() =>
          assertAbsorptionHasSubject(asGiven({ blockers: 3 }), {
            ...ambient,
            isLevelForgiven: true,
          }),
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] the reviewer has not spoken', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() => assertAbsorptionHasSubject(null, ambient));
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] the given is unreadable — a malfunction', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() =>
          assertAbsorptionHasSubject(
            asGiven({ blockers: 1, unreadable: true }),
            ambient,
          ),
        );
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
