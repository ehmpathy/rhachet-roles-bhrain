import { given, then, when } from 'test-fns';

import { asPeerGivenVerdict } from './asPeerGivenVerdict';

describe('asPeerGivenVerdict', () => {
  given('[case1] a readable verdict with blockers', () => {
    when('[t0] cast', () => {
      then('its counts pass through verbatim, flagged readable', () => {
        expect(
          asPeerGivenVerdict({
            counts: { detected: true, blockers: 3, nitpicks: 2 },
          }),
        ).toEqual({ blockers: 3, nitpicks: 2, unreadable: false });
      });
    });
  });

  given('[case2] a readable verdict that is genuinely clean', () => {
    when('[t0] cast', () => {
      then('it does NOT gate — a real zero is a real zero', () => {
        expect(
          asPeerGivenVerdict({
            counts: { detected: true, blockers: 0, nitpicks: 0 },
          }),
        ).toEqual({ blockers: 0, nitpicks: 0, unreadable: false });
      });
    });
  });

  given('[case3] an UNREADABLE verdict — no numeric count was found', () => {
    // the whole point. contract.reviewer-output: "if it finds no numeric count it
    // can NOT assume zero. a silent 0/0 would look like a clean approval when in
    // truth no verdict was seen." a 0 here is the failhide the ReviewCounts union
    // was shaped to make impossible, so this clamps the one cast that can undo it.
    when('[t0] cast', () => {
      then('it GATES — an absent verdict is never a clean one', () => {
        // .note = `blockers > 0` is not an arbitrary shape to assert; it is verbatim
        //         the gate predicate — computePeerUncontemplatedUnforgiven keeps a
        //         reviewer only while it holds. so this one assertion IS the claim
        //         "the stone is held", and a second test that re-states it as a
        //         boolean adds no coverage (r4 nitpick.1, i002)
        const verdict = asPeerGivenVerdict({ counts: { detected: false } });
        expect(verdict.blockers).toBeGreaterThan(0);
      });
    });

    when('[t1] read for what the count MEANS, not just its value', () => {
      then(
        'the fabrication is flagged, so no surface can print it as fact',
        () => {
          // [t0] clamps the flag's SIDE EFFECT (it gates). it would NOT go red if the
          // flag were dropped and the count left at 1 — which is exactly the state
          // that let the prompt render `1 blocker` as though the reviewer had
          // reported it (r9 nitpick.1, i003). so the flag itself is clamped here.
          //
          // .note = this block was labelled `[t2]` until r7 nitpick.2 (i016). r009
          //         nitpick.1 had folded the original [t1] into [t0] and left the
          //         label unrenumbered, so the sequence read t0, t2 — a gap a reader
          //         cannot part from an accidentally deleted step. the counter resets
          //         per `given` and runs contiguously, so it is [t1]
          expect(asPeerGivenVerdict({ counts: { detected: false } })).toEqual({
            blockers: 1,
            nitpicks: 0,
            unreadable: true,
          });
        },
      );
    });
  });
});
