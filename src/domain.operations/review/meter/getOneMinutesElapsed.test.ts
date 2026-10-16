import { given, then, when } from 'test-fns';

import { getOneMinutesElapsed } from './getOneMinutesElapsed';

const AT = (iso: string): Date => new Date(iso);

describe('getOneMinutesElapsed', () => {
  given('[case1] two instants a whole cadence apart', () => {
    when('[t0] the span is measured', () => {
      then('it answers the minutes, never the milliseconds', () => {
        // the clamp on the unit. the inline `/ 60_000` this replaced could
        // have been `/ 1_000` or `/ 3_600_000` and every caller would still
        // compile, because the verdict takes a bare `number` (rule.forbid.any-time)
        expect(
          getOneMinutesElapsed({
            since: AT('2026-09-26T10:00:00Z'),
            until: AT('2026-09-26T10:15:00Z'),
          }),
        ).toEqual(15);
      });
    });

    when('[t1] the span covers hours', () => {
      then('it scales linearly, with no hour rollover', () => {
        // the measured round cadence on this branch runs past 3h, so the operation
        // must stay correct well past the 60-minute mark
        expect(
          getOneMinutesElapsed({
            since: AT('2026-09-26T10:00:00Z'),
            until: AT('2026-09-26T13:05:00Z'),
          }),
        ).toEqual(185);
      });
    });
  });

  given('[case2] a span shorter than a minute', () => {
    when('[t0] the span is measured', () => {
      then('🔴 it answers a FRACTION, never a rounded whole', () => {
        // the verdict subtracts this from the cadence to name its next wait,
        // so a round here drifts the schedule by up to 30s on every wake — 6
        // minutes lost across a 12-poke plan, silently
        expect(
          getOneMinutesElapsed({
            since: AT('2026-09-26T10:00:00Z'),
            until: AT('2026-09-26T10:00:30Z'),
          }),
        ).toEqual(0.5);
      });
    });
  });

  given('[case3] two instants in the same moment', () => {
    when('[t0] the span is measured', () => {
      then('it answers zero rather than a near-zero float', () => {
        expect(
          getOneMinutesElapsed({
            since: AT('2026-09-26T10:00:00Z'),
            until: AT('2026-09-26T10:00:00Z'),
          }),
        ).toEqual(0);
      });
    });
  });

  given('[case4] a clock that went backwards', () => {
    when('[t0] `until` precedes `since`', () => {
      then('🔴 it answers a NEGATIVE, never an absolute value', () => {
        // this reads like a case worth a `Math.abs`, and it is not. the
        // verdict reads `sinceTouchMinutes < cadence` to defer — a negative
        // defers, which is correct where a touch is recorded ahead of the
        // clock (an ntp step, a stamp from another host). `Math.abs` would
        // turn a 30s-ahead stamp into a 30s-stale one and poke at once
        expect(
          getOneMinutesElapsed({
            since: AT('2026-09-26T10:15:00Z'),
            until: AT('2026-09-26T10:00:00Z'),
          }),
        ).toEqual(-15);
      });
    });
  });
});
