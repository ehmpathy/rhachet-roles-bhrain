import { given, then, when } from 'test-fns';

import {
  asBrainDispatchClaim,
  asBrainDispatchClaimPath,
  BRAIN_DISPATCH_CLAIM_WINDOW_MS,
  BrainDispatchClaim,
  isBrainDispatchClaimLive,
} from './BrainDispatchClaim';

/**
 * .what = unit clamps for the dispatch claim's parse and its liveness predicate
 * .why = the claim bounds two concurrent `clone say` children on one pty. a loose parse or
 *        a loose liveness test suppresses a real dispatch; a tight one lets the race back in
 *
 * .note = the claim carries NO timestamp (`rule.forbid.timestamps-in-route-artifacts`); its
 *         age is the file's mtime, passed to the predicate as a separate input
 */
describe('BrainDispatchClaim', () => {
  const NOW = 1_700_000_000_000;

  given('[case1] the claim path', () => {
    when('[t0] it is derived for a route', () => {
      then('it sits beside the blocker state, under `.route/`', () => {
        // .why = one derivation, so findsert and clear cannot drift; the dir is the one
        //        `mutateDriveBlockerState` already makes for its lock
        expect(asBrainDispatchClaimPath({ route: '/r' })).toEqual(
          '/r/.route/.brain.dispatch.latest.json',
        );
      });
    });
  });

  given('[case2] a claim read off disk', () => {
    when('[t0] the file is absent', () => {
      then('it reads as NO claim, so a dispatch runs', () => {
        expect(asBrainDispatchClaim({ text: null })).toEqual(null);
      });
    });

    const REJECTED: { label: string; text: string }[] = [
      { label: 'not json at all', text: 'half a write' },
      { label: 'json, but a bare number', text: '7' },
      { label: 'json, but an array', text: '["1", 2]' },
      { label: 'json null', text: 'null' },
      { label: 'a stone of the wrong type', text: '{"stone":3}' },
      { label: 'an empty stone', text: '{"stone":""}' },
      { label: 'no fields at all', text: '{}' },
    ];

    REJECTED.forEach((thisCase) => {
      when(`[t1] the file holds ${thisCase.label}`, () => {
        then('it reads as NO claim, and never throws', () => {
          // .why every shape = `?? default` passes a WRONG-TYPED value through; `{"stone":3}`
          //    would read as "a peer holds a different stone" and silently un-arm the claim
          // .why it degrades, never throws = a claim only suppresses a redundant dispatch,
          //    so an unreadable one lets the dispatch run rather than halt a well route
          expect(asBrainDispatchClaim({ text: thisCase.text })).toEqual(null);
        });
      });
    });

    when('[t2] the file holds a well-formed claim', () => {
      then('it reads back the stone, and carries no time at all', () => {
        // .why full equality = an assert on `.stone` alone stays green if an `at` field
        //    returns; the bare `{ stone }` literal pins that no time is persisted
        expect(asBrainDispatchClaim({ text: '{"stone":"1.vision"}' })).toEqual(
          new BrainDispatchClaim({ stone: '1.vision' }),
        );
      });

      then('a stray `at` in the file changes naught', () => {
        // .why = an older build wrote one; it is neither read nor refused
        expect(
          asBrainDispatchClaim({ text: '{"stone":"1.vision","at":42}' }),
        ).toEqual(new BrainDispatchClaim({ stone: '1.vision' }));
      });
    });
  });

  given('[case3] the liveness predicate', () => {
    const claim = new BrainDispatchClaim({ stone: '1' });

    when('[t0] there is no claim at all', () => {
      then('it is not live', () => {
        expect(
          isBrainDispatchClaimLive({
            claim: null,
            mtimeMs: NOW,
            stone: '1',
            now: NOW,
          }),
        ).toEqual(false);
      });
    });

    when('[t1] the claim names a DIFFERENT stone', () => {
      then('it is not live, so the new prescription dispatches', () => {
        // .why keyed on the stone = an unkeyed claim would suppress a genuine stone change
        //    within the window — the silent no-op the wish forbids
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: NOW,
            stone: '2',
            now: NOW,
          }),
        ).toEqual(false);
      });
    });

    when('[t2] the claim is fresh for this stone', () => {
      then('it is live at the instant it was taken', () => {
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: NOW,
            stone: '1',
            now: NOW,
          }),
        ).toEqual(true);
      });

      then('it is still live one millisecond before the window closes', () => {
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: NOW,
            stone: '1',
            now: NOW + BRAIN_DISPATCH_CLAIM_WINDOW_MS - 1,
          }),
        ).toEqual(true);
      });
    });

    when('[t3] the window has closed exactly', () => {
      then('it is stale, so a later entry dispatches', () => {
        // .why both sides = the window matches `clone say`'s submit-verify timeout; an
        //    off-by-one would re-open the pty race and leave the asserts above green
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: NOW,
            stone: '1',
            now: NOW + BRAIN_DISPATCH_CLAIM_WINDOW_MS,
          }),
        ).toEqual(false);
      });
    });

    when('[t3b] the claim OUTLIVED the process that wrote it', () => {
      // .what = the ORPHANED claim — its writer killed before it dispatched (a hook is
      //    killable at its 25s cap; `F-d`)
      // .why = an orphan reads identical to a live claim, so it does suppress a real
      //    dispatch; what makes that acceptable is that the suppression is BOUNDED
      // 🟡 .note = a NAMING clamp, never a regression one: it drives the same axis as [t2]
      //    and [t3], so no mutation reds it alone. it gives a build that makes orphans
      //    detectable (a pid, a heartbeat) a named row to edit
      const crashedAt = NOW;

      then(
        'the orphan SUPPRESSES a real dispatch, exactly as a live one would',
        () => {
          expect(
            isBrainDispatchClaimLive({
              claim,
              mtimeMs: crashedAt,
              stone: '1',
              now: crashedAt + 1,
            }),
          ).toEqual(true);
        },
      );

      then(
        'and the suppression LAPSES — it is bounded, never permanent',
        () => {
          expect(
            isBrainDispatchClaimLive({
              claim,
              mtimeMs: crashedAt,
              stone: '1',
              now: crashedAt + BRAIN_DISPATCH_CLAIM_WINDOW_MS,
            }),
          ).toEqual(false);
        },
      );
    });

    when('[t4] the mtime is in the FUTURE', () => {
      then('it is stale, so the dispatch runs', () => {
        // .why = a backward clock step or a skewed mount would keep a claim live for as
        //    long as the skew lasts, unbounded; so it fails toward a dispatch
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: NOW,
            stone: '1',
            now: NOW - 1,
          }),
        ).toEqual(false);
      });
    });

    when('[t5] the claim parses and the file has NO readable mtime', () => {
      then('it is not live, so the dispatch runs', () => {
        // .why = claim and mtime are separate reads, so a parsed claim may lack a stat; a
        //    suppression on an unreadable deadline would be a silent no-op
        expect(
          isBrainDispatchClaimLive({
            claim,
            mtimeMs: null,
            stone: '1',
            now: NOW,
          }),
        ).toEqual(false);
      });
    });
  });
});
