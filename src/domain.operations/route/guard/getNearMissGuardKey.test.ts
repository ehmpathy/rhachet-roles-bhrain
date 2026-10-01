import { given, then, when } from 'test-fns';

import { getNearMissGuardKey } from './getNearMissGuardKey';

/**
 * .what = unit tests for the near-miss detector
 * .why = it is a pure transformer, and `rule.require.test-coverage-by-grain` puts a
 *        transformer at the UNIT grain. the integration suite reaches it only through
 *        `parseStoneGuard`, which exercises exactly two of its inputs
 *
 * .note = every case below clamps a DECLARED THRESHOLD rather than a sample value.
 *         `DISTANCE_MAX = 2` and `LENGTH_MIN = 4` each carry a `.why` that argues for
 *         that exact number — and an argued number with no test either side of it is
 *         an assertion, never a bound (`rule.require.clamp-edge-cases`)
 */
describe('getNearMissGuardKey', () => {
  given('[case1] a key the parser already knows', () => {
    when('[t0] it is judged', () => {
      then('it is NOT a near miss of itself', () => {
        // .why = an exact match must return null, or the parser would warn about every
        //        key it successfully handled
        expect(getNearMissGuardKey({ key: 'brain' })).toEqual(null);
        expect(getNearMissGuardKey({ key: 'artifacts' })).toEqual(null);
        expect(getNearMissGuardKey({ key: 'reviews' })).toEqual(null);
        expect(getNearMissGuardKey({ key: 'judges' })).toEqual(null);
        expect(getNearMissGuardKey({ key: 'protect' })).toEqual(null);
      });
    });
  });

  given('[case2] a key ONE edit from a known key', () => {
    when('[t0] it is judged', () => {
      then('the known key is named', () => {
        // .why = a single-character slip is the commonest typo shape
        expect(getNearMissGuardKey({ key: 'brai' })).toEqual('brain');
        expect(getNearMissGuardKey({ key: 'judgers' })).toEqual('judges');
        expect(getNearMissGuardKey({ key: 'review' })).toEqual('reviews');
      });
    });
  });

  given(
    '[case3] a key TWO edits from a known key — the threshold itself',
    () => {
      when('[t0] it is judged', () => {
        then('the known key is named', () => {
          // .why = `brian` is the transposition case=4 [t8] names verbatim, and it is
          //        exactly DISTANCE_MAX away. the threshold was chosen to catch it, so
          //        this case is what makes that choice checkable
          expect(getNearMissGuardKey({ key: 'brian' })).toEqual('brain');
        });
      });
    },
  );

  given('[case4] a key THREE edits away — one past the threshold', () => {
    when('[t0] it is judged', () => {
      then('it is SILENT', () => {
        // .why = the F4 verdict kept the key set OPEN, so a key that is merely
        //        unrecognized must not warn — only one near enough to be a typo of a
        //        real key does. `brainiac` is 3 inserts from `brain`, so it sits one
        //        step outside, and this is the case that proves the wall exists
        expect(getNearMissGuardKey({ key: 'brainiac' })).toEqual(null);
      });
    });
  });

  given('[case5] a key SHORTER than the length floor', () => {
    when('[t0] it is judged', () => {
      then('it is SILENT, even though it sits inside the distance', () => {
        // .why = `bra` is 2 edits from `brain` — inside DISTANCE_MAX — and is refused
        //        anyway, because at 3 characters a distance of 2 rewrites most of the
        //        word. without this case the LENGTH_MIN floor is unreachable code
        expect(getNearMissGuardKey({ key: 'bra' })).toEqual(null);
      });
    });

    then('the floor is INCLUSIVE — 4 characters is judged', () => {
      // .why = the two cases together pin the boundary. one alone would pass against
      //        an off-by-one in either direction
      expect(getNearMissGuardKey({ key: 'brai' })).toEqual('brain');
    });
  });

  given('[case6] a key whose case differs', () => {
    when('[t0] it is judged', () => {
      then('it is matched case-insensitively', () => {
        // .why = a guard is hand-written prose, so a capitalized key is a live typo
        //        shape. the detector lowercases before it compares
        expect(getNearMissGuardKey({ key: 'BRIAN' })).toEqual('brain');
        expect(getNearMissGuardKey({ key: 'Brain' })).toEqual(null);
      });
    });
  });

  given(
    '[case7] a key near the `model` ALIAS rather than near a known key',
    () => {
      when('[t0] it is judged', () => {
        then('it is SILENT — `model` is not a target of this detector', () => {
          // .why = `model` carries its own alias warn, which names `brain:` outright.
          //        a near-miss warn would say only "this looks like a key", which is
          //        strictly weaker — so `model` is deliberately absent from KEYS_KNOWN
          //
          // .note = this case is HONEST about what it proves: `modle` is also far from
          //         every real key, so the distance and the exclusion agree here. it
          //         clamps the observable behavior, never the reason behind it
          expect(getNearMissGuardKey({ key: 'modle' })).toEqual(null);
        });
      });
    },
  );
});
