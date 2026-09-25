import { given, then, when } from 'test-fns';

import { isArticulationStale } from './isArticulationStale';

const ASKED_AT = new Date('2026-09-18T12:00:00Z');

describe('isArticulationStale', () => {
  given('[case1] an ask on record', () => {
    when('[t0] the file was written before the ask', () => {
      then('it is stale', () => {
        // .why = the leftover from a prior round. it cannot answer a question that had
        //        not been asked when it was written
        expect(
          isArticulationStale({
            articulatedAt: new Date('2026-09-18T11:59:00Z'),
            askedAt: ASKED_AT,
          }),
        ).toBe(true);
      });
    });

    when('[t1] the file was written after the ask', () => {
      then('it is fresh', () => {
        expect(
          isArticulationStale({
            articulatedAt: new Date('2026-09-18T12:05:00Z'),
            askedAt: ASKED_AT,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case2] the boundary', () => {
    when('[t0] the file and the ask carry the same mtime', () => {
      then('the comparison is strict, so it is NOT stale', () => {
        // .why = pins which side of `<` the boundary falls on. a swap to `<=` would refuse
        //        a file written in the same tick as the ask, which is a real order on a
        //        coarse filesystem clock
        expect(
          isArticulationStale({
            articulatedAt: ASKED_AT,
            askedAt: ASKED_AT,
          }),
        ).toBe(false);
      });
    });
  });
});

// .note = 🔴 there is no `no ask on record` case here, deliberately. `askedAt` is typed
//         non-null, so the absent ask is refused at compile time by the caller's own
//         `challenge:unasked` precondition. a runtime case for it would assert a state the
//         type forbids, and would read to a maintainer as though the state were reachable.
