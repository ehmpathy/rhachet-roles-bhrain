import { given, then, when } from 'test-fns';

import {
  getStoneYieldGlob,
  getStoneYieldGlobLegacy,
} from './getStoneYieldGlob';

describe('getStoneYieldGlob', () => {
  given('[case1] a stone name', () => {
    when('[t0] the yield glob is built', () => {
      /**
       * .why = the pattern is now owned in one place, so a change to it is a change to all
       *        four readers at once. this pins it as a literal, so an edit to the convention
       *        shows up in a diff as a deliberate act rather than a drift.
       * 🔴 .note = a literal is the RIGHT grain here, and only because the derivations are
       *            gone. while four call sites hand-typed it, a literal pin would have
       *            graded one of the five copies and stayed green as the other four drifted —
       *            the agreement was the property, and a literal could not see it. the
       *            extraction is what makes the pattern the whole contract.
       */
      then('it is the stone name with a `.yield` prefix-match', () => {
        expect(getStoneYieldGlob({ stone: '1.vision' })).toEqual(
          '1.vision.yield*',
        );
      });
    });

    when('[t1] the legacy glob is built', () => {
      /**
       * .why = the legacy pattern is a SECOND answer to one question — which files are this
       *        stone's outputs? — and two of the four readers carry both. to own one and
       *        leave the other hand-typed would re-create the split at half scale.
       */
      then('it is the stone name with a `.md` suffix-match', () => {
        expect(getStoneYieldGlobLegacy({ stone: '1.vision' })).toEqual(
          '1.vision*.md',
        );
      });
    });
  });

  given('[case2] the two globs side by side', () => {
    when('[t0] both are built for one stone', () => {
      /**
       * 🔴 .why = every reader that carries both DEDUPES their matches, and the reason is
       *           this overlap: a `1.vision.yield.md` satisfies each pattern. a change that
       *           made the two disjoint would make the dedupe dead code, and a reader who
       *           later dropped it would be correct for the wrong reason.
       */
      then('they are distinct patterns, so a dedupe is owed', () => {
        expect(getStoneYieldGlob({ stone: '1.vision' })).not.toEqual(
          getStoneYieldGlobLegacy({ stone: '1.vision' }),
        );
      });

      then('each carries the stone name at its head', () => {
        expect(getStoneYieldGlob({ stone: '5.1.execution' })).toContain(
          '5.1.execution',
        );
        expect(getStoneYieldGlobLegacy({ stone: '5.1.execution' })).toContain(
          '5.1.execution',
        );
      });
    });
  });
});
