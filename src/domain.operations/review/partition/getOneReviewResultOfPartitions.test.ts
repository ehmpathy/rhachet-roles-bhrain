import { BadRequestError } from 'helpful-errors';
import { asIsoPriceHuman } from 'iso-price';
import { given, then, when } from 'test-fns';

import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { getOneReviewResultOfPartitions } from './getOneReviewResultOfPartitions';

/**
 * .what = one partition's result, with the figures each case varies
 */
const asResult = (input: {
  blockersCount: number;
  windowPercent: number;
  /** null where the run's spend is unmeasured */
  costTotal: string | null;
  seconds: number;
}): StepReviewResult => ({
  outcome: 'reviewed',
  review: { formatted: '' },
  log: { dir: '/log' },
  output: { path: '/out.md' },
  summary: { blockersCount: input.blockersCount, nitpicksCount: 1 },
  metrics: {
    files: {
      rulesCount: 1,
      refsCount: 0,
      conversationCount: 0,
      targetsCount: 3,
    },
    expected: {
      tokens: { estimate: 1000, contextWindowPercent: input.windowPercent },
      cost: { estimate: asIsoPriceHuman('USD 0.01') },
    },
    realized: {
      // an unmeasured spend states no token count at all, as `asReviewRunMetricsRealizedOfResult` writes it
      tokens:
        input.costTotal === null
          ? null
          : {
              input: 100,
              inputCacheCreation: 0,
              inputCacheRead: 900,
              output: 50,
            },
      cost:
        input.costTotal === null
          ? null
          : {
              input: asIsoPriceHuman('USD 0.01'),
              cacheWrite: asIsoPriceHuman('USD 0.00'),
              cacheRead: asIsoPriceHuman('USD 0.001'),
              output: asIsoPriceHuman('USD 0.02'),
              total: asIsoPriceHuman(input.costTotal),
            },
      time: { seconds: input.seconds },
    },
  },
});

describe('getOneReviewResultOfPartitions', () => {
  given('[case1] two partitions of one lane', () => {
    const merged = getOneReviewResultOfPartitions({
      results: [
        asResult({
          blockersCount: 2,
          windowPercent: 60,
          costTotal: 'USD 0.10',
          seconds: 30,
        }),
        asResult({
          blockersCount: 1,
          windowPercent: 45,
          costTotal: 'USD 0.20',
          seconds: 45,
        }),
      ],
      primed: null,
      faults: { ofPour: [], ofSpend: [] },
    });

    when('[t0] the results are merged', () => {
      then('the counts sum into the one tally the guard reads', () => {
        expect(merged.summary).toEqual({ blockersCount: 3, nitpicksCount: 2 });
      });
      then('tokens and files sum — each partition sent its own', () => {
        expect(merged.metrics.realized.tokens?.inputCacheRead).toEqual(1800);
        expect(merged.metrics.realized.tokens?.output).toEqual(100);
        expect(merged.metrics.files.targetsCount).toEqual(6);
      });
      then('cost sums by priceSum, never by float math', () => {
        expect(merged.metrics.realized.cost?.total).toEqual(
          asIsoPriceHuman('USD 0.30'),
        );
      });
      then(
        '🔴 the window share is the max, never a sum — no two partitions share a window',
        () => {
          expect(merged.metrics.expected.tokens.contextWindowPercent).toEqual(
            60,
          );
        },
      );
      then(
        '🔴 time is the longest partition, never the sum — the partitions pour at once',
        () => {
          expect(merged.metrics.realized.time).toEqual({ seconds: 45 });
        },
      );
    });
  });

  given('[case2] two partitions poured after a prime', () => {
    const merged = getOneReviewResultOfPartitions({
      results: [
        asResult({
          blockersCount: 2,
          windowPercent: 60,
          costTotal: 'USD 0.10',
          seconds: 30,
        }),
        asResult({
          blockersCount: 1,
          windowPercent: 45,
          costTotal: 'USD 0.20',
          seconds: 45,
        }),
      ],
      primed: asResult({
        blockersCount: 4,
        windowPercent: 20,
        costTotal: 'USD 0.05',
        seconds: 10,
      }),
      faults: { ofPour: [], ofSpend: [] },
    });

    when('[t0] the results are merged', () => {
      then(
        '🔴 time is the prime, then the longest partition — the prime completes before the pour',
        () => {
          expect(merged.metrics.realized.time).toEqual({ seconds: 55 });
        },
      );
      then("the prime's spend is summed in", () => {
        expect(merged.metrics.realized.cost?.total).toEqual(
          asIsoPriceHuman('USD 0.35'),
        );
      });
      then(
        "🔴 the prime's counts never enter the verdict — a prime grades naught",
        () => {
          // the prime here returns 4 blockers and 1 nitpick; only the partitions count
          expect(merged.summary).toEqual({
            blockersCount: 3,
            nitpicksCount: 2,
          });
        },
      );
    });
  });

  given('[case3] every partition faulted, and no prime ran', () => {
    const merged = getOneReviewResultOfPartitions({
      results: [],
      primed: null,
      faults: { ofPour: [], ofSpend: [] },
    });

    when('[t0] the empty results are merged', () => {
      then('🔴 the window share reads 0, never -Infinity', () => {
        expect(merged.metrics.expected.tokens.contextWindowPercent).toEqual(0);
      });
      then('🔴 the cost reads a nil, never a throw', () => {
        expect(merged.metrics.realized.cost?.total).toEqual(
          asIsoPriceHuman('USD 0'),
        );
      });
      then('the counts and time read zero', () => {
        expect(merged.summary).toEqual({ blockersCount: 0, nitpicksCount: 0 });
        expect(merged.metrics.realized.time).toEqual({ seconds: 0 });
      });
    });
  });

  given(
    '[case4] two partitions, one whose spend is unmeasured (a runaway with no output count)',
    () => {
      const merged = getOneReviewResultOfPartitions({
        results: [
          asResult({
            blockersCount: 2,
            windowPercent: 60,
            costTotal: 'USD 0.10',
            seconds: 30,
          }),
          asResult({
            blockersCount: 1,
            windowPercent: 45,
            costTotal: null,
            seconds: 45,
          }),
        ],
        primed: null,
        faults: { ofPour: [], ofSpend: [] },
      });

      when('[t0] the results are merged', () => {
        then(
          '🔴 the lane cost is unknown — never the measured part alone, which would read low',
          () => {
            expect(merged.metrics.realized.cost).toEqual(null);
          },
        );
        then(
          '🔴 the lane token counts are unknown — the input side as much as the output, never the measured part alone, which would read precise and low',
          () => {
            expect(merged.metrics.realized.tokens).toEqual(null);
          },
        );
        then('the counts still merge', () => {
          expect(merged.summary).toEqual({
            blockersCount: 3,
            nitpicksCount: 2,
          });
        });
      });
    },
  );

  given('[case5] a prime whose spend is unmeasured', () => {
    const merged = getOneReviewResultOfPartitions({
      results: [
        asResult({
          blockersCount: 0,
          windowPercent: 60,
          costTotal: 'USD 0.10',
          seconds: 30,
        }),
      ],
      primed: asResult({
        blockersCount: 0,
        windowPercent: 20,
        costTotal: null,
        seconds: 10,
      }),
      faults: { ofPour: [], ofSpend: [] },
    });

    when('[t0] the results are merged', () => {
      then('🔴 the lane cost is unknown — the prime spent too', () => {
        expect(merged.metrics.realized.cost).toEqual(null);
      });
      then('🔴 the lane token counts are unknown — the prime spent too', () => {
        expect(merged.metrics.realized.tokens).toEqual(null);
      });
    });
  });

  given(
    '[case6] two partitions measured, a third that timed out after its brain was billed',
    () => {
      const merged = getOneReviewResultOfPartitions({
        results: [
          asResult({
            blockersCount: 0,
            windowPercent: 60,
            costTotal: 'USD 0.04',
            seconds: 30,
          }),
          asResult({
            blockersCount: 0,
            windowPercent: 45,
            costTotal: 'USD 0.04',
            seconds: 45,
          }),
        ],
        primed: null,
        faults: {
          ofPour: [{ error: new ReviewTimeoutError({ timeoutMs: 1000 }) }],
          ofSpend: [],
        },
      });

      when('[t0] the results are merged', () => {
        then('the partition that timed out counts as one blocker', () => {
          expect(merged.summary.blockersCount).toEqual(1);
        });
        then(
          '🔴 the lane cost is unknown — never the $0.08 of the two that returned, which would read low',
          () => {
            expect(merged.metrics.realized.cost).toEqual(null);
          },
        );
        then(
          '🔴 the lane token counts are unknown, alongside the cost — never the input of the two that returned, which would read precise and low',
          () => {
            // the two that returned sent 200 input and 1,800 cache-read tokens; the third
            // sent its own prompt too, so either sum would understate what was billed
            expect(merged.metrics.realized.tokens).toEqual(null);
          },
        );
      });
    },
  );

  given(
    '[case7] two partitions measured, a third refused on a constraint before its brain call',
    () => {
      const merged = getOneReviewResultOfPartitions({
        results: [
          asResult({
            blockersCount: 0,
            windowPercent: 60,
            costTotal: 'USD 0.04',
            seconds: 30,
          }),
          asResult({
            blockersCount: 0,
            windowPercent: 45,
            costTotal: 'USD 0.04',
            seconds: 45,
          }),
        ],
        primed: null,
        faults: {
          ofPour: [{ error: new BadRequestError('partition overflows') }],
          ofSpend: [],
        },
      });

      when('[t0] the results are merged', () => {
        then('the partition that refused counts as one blocker', () => {
          expect(merged.summary.blockersCount).toEqual(1);
        });
        then(
          'the lane cost still sums — a refusal no brain billed spent naught',
          () => {
            expect(merged.metrics.realized.cost?.total).toEqual(
              asIsoPriceHuman('USD 0.08'),
            );
            expect(merged.metrics.realized.tokens?.output).toEqual(100);
            expect(merged.metrics.realized.tokens?.input).toEqual(200);
          },
        );
      });
    },
  );

  given(
    '[case8] every partition measured, the prime threw after it was billed',
    () => {
      const merged = getOneReviewResultOfPartitions({
        results: [
          asResult({
            blockersCount: 0,
            windowPercent: 60,
            costTotal: 'USD 0.10',
            seconds: 30,
          }),
        ],
        primed: null,
        faults: {
          ofPour: [],
          ofSpend: [{ error: new ReviewTimeoutError({ timeoutMs: 1000 }) }],
        },
      });

      when('[t0] the results are merged', () => {
        then('🔴 the prime fault is no blocker — a prime grades naught', () => {
          expect(merged.summary.blockersCount).toEqual(0);
        });
        then('🔴 the lane cost is unknown — the prime may have spent', () => {
          expect(merged.metrics.realized.cost).toEqual(null);
        });
        then(
          '🔴 the lane token counts are unknown — the prime may have spent',
          () => {
            expect(merged.metrics.realized.tokens).toEqual(null);
          },
        );
      });
    },
  );

  /**
   * .what = 🔴 CLAMP. the merge owns BOTH sums a fault feeds
   * .why = "a fault counts as one blocker" once lived in two places — this merge summed only
   *        the answered results, and its caller added the partition faults inline. now the
   *        caller hands both fault sets apart, and the rule lives here alone
   */
  given(
    '[case9] one partition answered, two partitions failed, and the prime and a retry each swallowed a fault',
    () => {
      const merged = getOneReviewResultOfPartitions({
        results: [
          asResult({
            blockersCount: 2,
            windowPercent: 60,
            costTotal: 'USD 0.04',
            seconds: 30,
          }),
        ],
        primed: null,
        faults: {
          ofPour: [
            { error: new BadRequestError('partition overflows') },
            { error: new BadRequestError('partition overflows') },
          ],
          ofSpend: [
            { error: new ReviewTimeoutError({ timeoutMs: 1000 }) },
            { error: new ReviewTimeoutError({ timeoutMs: 1000 }) },
          ],
        },
      });

      when('[t0] the results are merged', () => {
        then(
          '🔴 each failed partition is one blocker beside the verdict; no spend-only fault is',
          () => {
            expect(merged.summary.blockersCount).toEqual(4);
          },
        );
        then('🔴 a spend-only fault still voids the lane cost', () => {
          expect(merged.metrics.realized.cost).toEqual(null);
        });
      });
    },
  );
});
