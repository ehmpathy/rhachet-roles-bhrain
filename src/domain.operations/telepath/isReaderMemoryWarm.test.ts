import { given, then, when } from 'test-fns';

import {
  isReaderMemoryWarm,
  READER_MEMORY_WARM_MS,
} from './isReaderMemoryWarm';

const NOW = new Date('2026-09-06T21:00:00.000Z');
const agoMs = (ms: number): Date => new Date(NOW.getTime() - ms);

describe('isReaderMemoryWarm', () => {
  given('[case1] a human spoke inside the window', () => {
    when('[t0] they spoke a moment ago', () => {
      then('warm — they hold the state, so the nudge rests', () => {
        expect(isReaderMemoryWarm({ spokeAt: agoMs(1_000), now: NOW })).toEqual(
          true,
        );
      });
    });

    when('[t1] they spoke one millisecond inside the boundary', () => {
      then('warm — the boundary is exclusive of the window itself', () => {
        expect(
          isReaderMemoryWarm({
            spokeAt: agoMs(READER_MEMORY_WARM_MS - 1),
            now: NOW,
          }),
        ).toEqual(true);
      });
    });
  });

  given('[case2] the human has been away for the whole window', () => {
    when('[t0] they spoke exactly one window ago', () => {
      then('cold — an autonomous stretch earns the summary', () => {
        expect(
          isReaderMemoryWarm({
            spokeAt: agoMs(READER_MEMORY_WARM_MS),
            now: NOW,
          }),
        ).toEqual(false);
      });
    });

    when('[t1] they spoke far outside it', () => {
      then('cold', () => {
        expect(
          isReaderMemoryWarm({ spokeAt: agoMs(60 * 60_000), now: NOW }),
        ).toEqual(false);
      });
    });
  });

  given('[case3] the last utterance cannot be read', () => {
    when('[t0] spokeAt is null', () => {
      then('cold — it FAILS TOWARD the nudge, never toward silence', () => {
        // a throttle that silences on its own bad input is indistinguishable from a
        // hook that works, which is the exact defect rule.forbid.failhide names
        expect(isReaderMemoryWarm({ spokeAt: null, now: NOW })).toEqual(false);
      });
    });
  });

  given('[case4] a clock skew puts the utterance in the future', () => {
    when('[t0] spokeAt is after now', () => {
      then(
        'warm — a negative age reads as "just spoke", never as an absence',
        () => {
          expect(
            isReaderMemoryWarm({
              spokeAt: new Date(NOW.getTime() + 60_000),
              now: NOW,
            }),
          ).toEqual(true);
        },
      );
    });
  });
});
