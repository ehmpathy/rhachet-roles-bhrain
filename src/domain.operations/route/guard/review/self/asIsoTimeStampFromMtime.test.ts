import { given, then, when } from 'test-fns';

import { asIsoTimeStampFromMtime } from './asIsoTimeStampFromMtime';

describe('asIsoTimeStampFromMtime', () => {
  given('[case1] an mtime that carries sub-second precision', () => {
    when('[t0] the cast is applied across the half-second boundary', () => {
      /**
       * 🔴 .why = the cut is to the second BELOW, never the nearest — and a `Math.round`
       *           here passes every CALLER's test, since a stale message still renders a
       *           stamp. it reports `…:08Z` for an event at `…:07.900Z`, so the stamp a
       *           driver reads would be LATER than the event it names, and the freshness
       *           confrontation would read backwards.
       *           ⇒ the samples straddle `500`, which is the one value that parts floor
       *             from round. this clamp goes red under either.
       */
      then('truncates to the second below, for every millisecond value', () => {
        const samples = [0, 1, 137, 499, 500, 501, 900, 999];
        samples.forEach((ms) => {
          expect(
            asIsoTimeStampFromMtime(
              new Date(Date.UTC(2026, 8, 17, 14, 30, 7, ms)),
            ),
          ).toEqual('2026-09-17T14:30:07Z');
        });
      });
    });
  });

  given('[case2] an mtime already on a whole second', () => {
    when('[t0] the cast is applied', () => {
      /**
       * .why = `asIsoTimeStamp` refuses sub-second precision outright, so the cut must be a
       *        no-op here rather than a second pass that shifts the value.
       */
      then('the value is unchanged', () => {
        expect(
          asIsoTimeStampFromMtime(new Date('2026-09-17T14:30:07.000Z')),
        ).toEqual('2026-09-17T14:30:07Z');
      });
    });
  });

  given('[case3] an mtime on a second that ends a minute', () => {
    when('[t0] the cast is applied', () => {
      /**
       * .why = the cut is arithmetic on epoch millis, so a carry across a minute, an hour,
       *        or a day is where an off-by-one would surface. this pins the one that is
       *        cheapest to get wrong.
       */
      then('does not carry into the next minute', () => {
        expect(
          asIsoTimeStampFromMtime(new Date('2026-09-17T14:30:59.999Z')),
        ).toEqual('2026-09-17T14:30:59Z');
      });
    });
  });
});
