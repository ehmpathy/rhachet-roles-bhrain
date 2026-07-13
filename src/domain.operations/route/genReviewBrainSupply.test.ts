import type { BrainChoice, ContextBrain } from 'rhachet';
import { given, then, useThen, when } from 'test-fns';

import { genReviewBrainSupply } from './genReviewBrainSupply';

/**
 * .what = unit tests for the lazy, memoize-on-success brain supplier
 * .why = the supplier's whole value is its build discipline: never build until needed
 *        (lazy), build at most once on success (memoize), and never poison the cache on a
 *        transient failure (retry-after-throw). these are the semantics the fictional
 *        withSimpleCache would NOT have guaranteed — so they are proven here explicitly.
 *
 * .note = the injected `build` spy stands in for genContextBrain; we assert on call counts,
 *         never on a real brain (this is a pure closure test — no i/o).
 */

// a stand-in brain value; identity is all these tests check
const fakeBrain = { brain: {} } as unknown as ContextBrain<BrainChoice>;

const buildInput = {
  choice: 'fireworks/deepseek/v4-flash',
  creds: { keyrack: { owner: 'ehmpath', env: 'test' } },
};

describe('genReviewBrainSupply', () => {
  given('[case1] a supplier built with a spy maker', () => {
    when('[t0] before getReviewBrain is ever called', () => {
      then('the maker is NOT invoked (lazy — no build until needed)', () => {
        let calls = 0;
        genReviewBrainSupply(buildInput, {
          build: async () => {
            calls += 1;
            return fakeBrain;
          },
        });
        expect(calls).toBe(0);
      });
    });
  });

  given('[case2] a supplier whose maker succeeds', () => {
    when('[t0] getReviewBrain is called twice', () => {
      const result = useThen('both calls succeed', async () => {
        let calls = 0;
        const supply = genReviewBrainSupply(buildInput, {
          build: async () => {
            calls += 1;
            return fakeBrain;
          },
        });
        const first = await supply.getReviewBrain();
        const second = await supply.getReviewBrain();
        return { calls, first, second };
      });

      then('the maker is invoked exactly once (memoize-on-success)', () => {
        expect(result.calls).toBe(1);
      });

      then('both calls return the same brain instance', () => {
        expect(result.first).toBe(result.second);
        expect(result.first).toBe(fakeBrain);
      });
    });
  });

  given('[case3] a maker that throws on first call, succeeds on second', () => {
    when('[t0] getReviewBrain is called, rejects, then called again', () => {
      const result = useThen('the second call recovers', async () => {
        let calls = 0;
        const supply = genReviewBrainSupply(buildInput, {
          build: async () => {
            calls += 1;
            if (calls === 1) throw new Error('transient build failure');
            return fakeBrain;
          },
        });

        // first call rejects
        let firstThrew = false;
        try {
          await supply.getReviewBrain();
        } catch {
          firstThrew = true;
        }

        // second call retries and succeeds (no poisoned cache)
        const second = await supply.getReviewBrain();
        return { calls, firstThrew, second };
      });

      then('the first call throws (build failure propagates)', () => {
        expect(result.firstThrew).toBe(true);
      });

      then('the second call retries and succeeds (NO memoize-on-throw)', () => {
        expect(result.calls).toBe(2);
        expect(result.second).toBe(fakeBrain);
      });
    });
  });
});
