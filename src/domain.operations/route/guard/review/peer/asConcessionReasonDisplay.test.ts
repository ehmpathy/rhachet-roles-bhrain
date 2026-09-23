import { given, then, when } from 'test-fns';

import { asConcessionReasonDisplay } from './asConcessionReasonDisplay';
import {
  genRouteGuardExhaustedReason,
  REASON_TEXT_CONCESSION_BETTER,
  REASON_TEXT_CONCESSION_URGENT,
  WARN_TEXT_CONCESSION_URGENT,
} from './genRouteGuardExhaustedReason';

describe('asConcessionReasonDisplay', () => {
  given('[case1] a plain (non-concession) budget-exhaustion reason', () => {
    const reason = genRouteGuardExhaustedReason({
      slugs: ['limited'],
      concession: 'none',
    });

    when('[t0] decoded', () => {
      const result = asConcessionReasonDisplay({ reason });

      then('the reason passes through unchanged', () => {
        expect(result.reasonText).toEqual(reason);
      });

      then('no urgent warn is surfaced', () => {
        expect(result.warnText).toEqual(null);
      });
    });
  });

  given('[case2] a BETTER concession exhaustion reason', () => {
    const reason = genRouteGuardExhaustedReason({
      slugs: ['limited'],
      concession: 'better',
    });

    when('[t0] decoded', () => {
      const result = asConcessionReasonDisplay({ reason });

      then('the raw marker is replaced by the human concession line', () => {
        expect(result.reasonText).toEqual(REASON_TEXT_CONCESSION_BETTER);
        expect(result.reasonText).not.toContain('budget exhausted');
      });

      // 🔴 the line names the FIX and no round at all. a `better` grade earns none past the
      //    meter (F04), so a reason that promised one would report a remedy the gate refuses
      then('it promises no budget — the fix is the whole remedy', () => {
        expect(result.reasonText).not.toContain('budget');
      });

      then(
        'no urgent warn is surfaced — a better concession earns no round',
        () => {
          expect(result.warnText).toEqual(null);
        },
      );
    });
  });

  given('[case3] an URGENT concession exhaustion reason', () => {
    const reason = genRouteGuardExhaustedReason({
      slugs: ['limited'],
      concession: 'urgent',
    });

    when('[t0] decoded', () => {
      const result = asConcessionReasonDisplay({ reason });

      then('the raw marker is replaced by the human concession line', () => {
        expect(result.reasonText).toEqual(REASON_TEXT_CONCESSION_URGENT);
      });

      // ⚠️ the two severities take DIFFERENT lines, and this is the clamp on that split. the
      //    urgent one still names the round, because urgent is the one grade that earns it —
      //    so a merge back to one literal would put a false promise on every better halt
      then(
        'and it is NOT the better line — the two say different things',
        () => {
          expect(result.reasonText).not.toEqual(REASON_TEXT_CONCESSION_BETTER);
          expect(result.reasonText).toContain('budget');
        },
      );

      then('the urgent warn is surfaced — the stone owes more budget', () => {
        expect(result.warnText).toEqual(WARN_TEXT_CONCESSION_URGENT);
      });
    });
  });

  given('[case4] a null reason (no halt to decode)', () => {
    when('[t0] decoded', () => {
      const result = asConcessionReasonDisplay({ reason: null });

      then('the reason passes through as null', () => {
        expect(result.reasonText).toEqual(null);
      });

      then('no urgent warn is surfaced', () => {
        expect(result.warnText).toEqual(null);
      });
    });
  });

  // 🔴 r1 b2 — `isConcession` spans BOTH severities, and that is what a surface reads to
  //    decide its REASON LINE. a surface that instead re-derived the decode with the
  //    better-only predicate printed `peer reviewer budget exhausted` on an urgent halt,
  //    where the emit printed the concession words for the same persisted reason
  given('[case5] the isConcession flag, across every severity', () => {
    when('[t0] a plain exhaustion', () => {
      then('it is false — no concession caused this halt', () => {
        expect(
          asConcessionReasonDisplay({
            reason: genRouteGuardExhaustedReason({
              slugs: ['limited'],
              concession: 'none',
            }),
          }).isConcession,
        ).toBe(false);
      });
    });

    when('[t1] a better concession', () => {
      then('it is true', () => {
        expect(
          asConcessionReasonDisplay({
            reason: genRouteGuardExhaustedReason({
              slugs: ['limited'],
              concession: 'better',
            }),
          }).isConcession,
        ).toBe(true);
      });
    });

    when('[t2] an URGENT concession', () => {
      then('it is true too — the severity does not change WHAT it is', () => {
        expect(
          asConcessionReasonDisplay({
            reason: genRouteGuardExhaustedReason({
              slugs: ['limited'],
              concession: 'urgent',
            }),
          }).isConcession,
        ).toBe(true);
      });
    });

    when('[t3] a null reason', () => {
      then('it is false', () => {
        expect(asConcessionReasonDisplay({ reason: null }).isConcession).toBe(
          false,
        );
      });
    });
  });
});
