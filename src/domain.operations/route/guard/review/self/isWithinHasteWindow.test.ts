import { given, then, when } from 'test-fns';

import { SELF_REVIEW_HASTE_WINDOW_MS } from './getSelfReviewChallengeDecision';
import { isWithinHasteWindow } from './isWithinHasteWindow';

/**
 * 🔴 .why = imported, never re-typed. this file declared its own `const WINDOW_MS = 30 * 1000`
 *           until 2026-09-20 — a second hand-written copy of the one number `F06` may move.
 *           the operation under test takes `windowMs` as an argument, so a stale copy here
 *           would grade 30 forever while the gate ran on whatever the council ruled, and no
 *           assertion would say so.
 */
const WINDOW_MS = SELF_REVIEW_HASTE_WINDOW_MS;

describe('isWithinHasteWindow', () => {
  given('[case1] the first adjudication of a slug', () => {
    when('[t0] the promise lands inside the window of the ask', () => {
      then('the cue fires', () => {
        expect(
          isWithinHasteWindow({
            firstAdjudication: true,
            askedAt: new Date(Date.now() - 8 * 1000),
            windowMs: WINDOW_MS,
          }),
        ).toBe(true);
      });
    });

    when('[t1] the promise lands well outside the window', () => {
      then('the cue is silent', () => {
        // .why = the thorough driver. forty minutes of read, one command, no paragraph
        expect(
          isWithinHasteWindow({
            firstAdjudication: true,
            askedAt: new Date(Date.now() - 39 * 60 * 1000),
            windowMs: WINDOW_MS,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case2] a later adjudication of the same slug', () => {
    when('[t0] the promise lands inside the window', () => {
      then('the cue is silent anyway', () => {
        // .why = this is the "at most once per slug" bound. without it the cue becomes
        //        a wall: a driver who re-promises at once meets it again, forever
        expect(
          isWithinHasteWindow({
            firstAdjudication: false,
            askedAt: new Date(Date.now() - 1 * 1000),
            windowMs: WINDOW_MS,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case3] the window boundary', () => {
    when('[t0] elapsed sits at or past the window', () => {
      then('the comparison is strict, so the boundary is outside', () => {
        // .why = pins which side of `<` the boundary falls on, so a later swap to `<=`
        //        cannot silently widen who meets the paragraph
        expect(
          isWithinHasteWindow({
            firstAdjudication: true,
            askedAt: new Date(Date.now() - WINDOW_MS),
            windowMs: WINDOW_MS,
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
