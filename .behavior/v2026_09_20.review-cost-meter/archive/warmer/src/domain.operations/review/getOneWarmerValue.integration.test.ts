import { asIsoPrice, asIsoPriceShape, priceSub } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.operations/review/ReviewRunMeter';

import { getOneWarmerValue } from './getOneWarmerValue';

/**
 * .what = one guard run of a lane, at a chosen round, with a chosen warmer and saved amount
 * .why = the law turns on three fields alone — the lane, the round order, and the two
 *        prices — so a case states those and naught else
 */
const asRun = (input: {
  root?: string;
  slug?: string;
  stone?: string;
  iteration: number;
  warmerCost?: string;
  cacheSaved?: string | null;
  grade?: ReviewRunMeter['grade'];
  head?: string;
  brain?: string | null;
  lastAt?: string | null;
}): ReviewRunMeter => {
  const grade = input.grade ?? 'metered';
  return {
    dir: `${input.root ?? '/tree/a/.log/bhrain/review'}/2026-09-26T0${input.iteration}-00-00-000Z.pid1.${input.slug ?? 'repo-rules'}`,
    head: input.head ?? null,
    brain: input.brain ?? null,
    identity: {
      route: '.behavior/v2026_09_20.review-cost-meter',
      stone: input.stone ?? '5.1.execution.from_vision',
      iteration: input.iteration,
      hash: 'a1b2c3d',
      index: 1,
      slug: input.slug ?? 'repo-rules',
    },
    defect: null,
    scope: null,
    // the figures key on the grade: measured where metered, absent elsewhere
    ...(grade === 'metered'
      ? {
          grade,
          tokens: { input: 1_000, cacheSet: 0, cacheGet: 0, output: 10 },
          cost: {
            total: asIsoPrice('USD 0.01'),
            cacheSaved:
              input.cacheSaved === null
                ? null
                : asIsoPrice(input.cacheSaved ?? 'USD 0'),
          },
        }
      : { grade, tokens: null, cost: null }),
    warmer: input.warmerCost
      ? {
          pokes: 5,
          hits: 4,
          cost: asIsoPrice(input.warmerCost),
          faults: 0,
          truncated: false,
          lastAt: input.lastAt ?? null,
        }
      : null,
    prompt: null,
  };
};

/**
 * .what = the instant every case weighs a lapse against
 */
const NOW = new Date('2026-09-26T12:00:00.000Z');

/**
 * .what = whether a price equals an expected figure, whatever its precision
 */
const isPriceOf = (input: { of: string; expected: string }): boolean =>
  asIsoPriceShape(priceSub(input.of, input.expected)).amount === 0n;

describe('getOneWarmerValue', () => {
  given('[case1] no run carried a warmer', () => {
    when('[t0] the value is weighed', () => {
      then('there is no value to state — no total, no lanes', () => {
        expect(
          getOneWarmerValue({
            now: NOW,
            runs: [asRun({ iteration: 1 }), asRun({ iteration: 2 })],
          }),
        ).toEqual({ lanes: [], total: null });
      });
    });
  });

  given('[case2] a warmed round, followed by a review that saved less', () => {
    const value = getOneWarmerValue({
      now: NOW,
      runs: [
        asRun({ iteration: 1, warmerCost: 'USD 0.05' }),
        asRun({ iteration: 2, cacheSaved: 'USD 0.02' }),
      ],
    });

    when('[t0] the value is weighed', () => {
      then(
        '🔴 the verdict is a loss — certain, since saved is an upper bound',
        () => {
          expect(value.total?.verdict).toEqual('loss');
        },
      );

      then('net is saved less spent', () => {
        expect(isPriceOf({ of: value.total!.net, expected: 'USD -0.03' })).toBe(
          true,
        );
      });

      then('one lane row, which equals the total', () => {
        expect(value.lanes).toHaveLength(1);
        expect(value.lanes[0]!.verdict).toEqual('loss');
        expect(value.lanes[0]!.key).toEqual('repo-rules');
      });
    });
  });

  given('[case3] a warmed round, followed by a review that saved more', () => {
    when('[t0] the value is weighed', () => {
      then(
        '🟡 the verdict is only `maybe` — the bound cannot prove a gain',
        () => {
          const value = getOneWarmerValue({
            now: NOW,
            runs: [
              asRun({ iteration: 1, warmerCost: 'USD 0.01' }),
              asRun({ iteration: 2, cacheSaved: 'USD 0.20' }),
            ],
          });
          expect(value.total?.verdict).toEqual('maybe');
        },
      );
    });
  });

  given('[case4] two warmed rounds in a row share one next review', () => {
    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [
          asRun({ iteration: 1, warmerCost: 'USD 0.01' }),
          asRun({ iteration: 2, warmerCost: 'USD 0.01', grade: 'unknown' }),
          asRun({ iteration: 3, cacheSaved: 'USD 0.02' }),
        ],
      });

      then('🔴 the shared follower is counted ONCE, never twice', () => {
        expect(value.total?.reviewsCovered).toEqual(1);
        expect(
          isPriceOf({ of: value.total!.saved, expected: 'USD 0.02' }),
        ).toBe(true);
      });

      then('both warmers spent', () => {
        expect(isPriceOf({ of: value.total!.cost, expected: 'USD 0.02' })).toBe(
          true,
        );
      });
    });
  });

  given('[case5] a warmed round with no review after it yet', () => {
    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [asRun({ iteration: 1, warmerCost: 'USD 0.01' })],
      });

      then('🌙 the verdict is unproven — naught to weigh against', () => {
        expect(value.total?.verdict).toEqual('unproven');
      });

      then('the warmed run counts as awaited', () => {
        expect(value.total?.runsUncovered).toEqual(1);
      });
    });
  });

  given(
    '[case5b] 🔴 a finished lane: the settled round lost, and the last warmed round has no follower',
    () => {
      // i1 warmed, i2 followed it and was itself warmed, and no review ever follows
      // i2 — the last round of a lane, which every finished lane has
      const runs = [
        asRun({ iteration: 1, warmerCost: 'USD 0.05' }),
        asRun({ iteration: 2, warmerCost: 'USD 0.05', cacheSaved: 'USD 0.02' }),
      ];
      const value = getOneWarmerValue({ runs, now: NOW });

      when('[t0] the value is weighed', () => {
        then('the net weighs the settled round alone', () => {
          expect(
            isPriceOf({ of: value.total!.net, expected: 'USD -0.03' }),
          ).toBe(true);
        });

        then('the awaited round rides beside the net, never inside it', () => {
          expect(value.total?.runsUncovered).toEqual(1);
          expect(
            isPriceOf({ of: value.total!.costAwaited, expected: 'USD 0.05' }),
          ).toBe(true);
          expect(
            isPriceOf({ of: value.total!.cost, expected: 'USD 0.10' }),
          ).toBe(true);
        });

        then(
          '🔴 the verdict is a loss — the last warmed round cannot hold it out of reach',
          () => {
            expect(value.total?.verdict).toEqual('loss');
          },
        );
      });

      when('[t1] a review follows the last warmed round after all', () => {
        const valueAfter = getOneWarmerValue({
          now: NOW,
          runs: [...runs, asRun({ iteration: 3, cacheSaved: 'USD 0.05' })],
        });

        then('🔴 the loss stands — a settled round is final', () => {
          expect(
            isPriceOf({ of: valueAfter.total!.net, expected: 'USD -0.03' }),
          ).toBe(true);
          expect(valueAfter.total?.verdict).toEqual('loss');
          expect(valueAfter.total?.runsUncovered).toEqual(0);
        });
      });
    },
  );

  given(
    '[case5c] a settled round that paid, beside a warmed round still awaited',
    () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [
          asRun({ iteration: 1, warmerCost: 'USD 0.01' }),
          asRun({
            iteration: 2,
            warmerCost: 'USD 0.05',
            cacheSaved: 'USD 0.02',
          }),
        ],
      });

      when('[t0] the value is weighed', () => {
        then(
          '🟡 the verdict is maybe — the awaited spend does not pull the net down',
          () => {
            expect(
              isPriceOf({ of: value.total!.net, expected: 'USD 0.01' }),
            ).toBe(true);
            expect(value.total?.verdict).toEqual('maybe');
          },
        );
      });
    },
  );

  given('[case6] 🔴 the next review has an UNPRICED amount saved', () => {
    when('[t0] the value is weighed', () => {
      then('it is no follower — never folded in as zero', () => {
        const value = getOneWarmerValue({
          now: NOW,
          runs: [
            asRun({ iteration: 1, warmerCost: 'USD 0.01' }),
            asRun({ iteration: 2, cacheSaved: null }),
          ],
        });
        expect(value.total?.verdict).toEqual('unproven');
        expect(value.total?.runsUncovered).toEqual(1);
      });
    });

    when(
      '[t1] the cache reach has long passed since the warmer last poked',
      () => {
        const value = getOneWarmerValue({
          now: NOW,
          runs: [
            asRun({
              iteration: 1,
              warmerCost: 'USD 0.01',
              lastAt: '2026-09-26T01:00:00.000Z',
            }),
            asRun({ iteration: 2, cacheSaved: null }),
          ],
        });

        then(
          '🔴 it stays unweighed, never lapsed — a review DID read the warmth, and what that saved is unknown',
          () => {
            expect(value.total?.runsLapsed).toEqual(0);
            expect(value.total?.runsUncovered).toEqual(1);
            expect(value.total?.verdict).toEqual('unproven');
          },
        );
      },
    );
  });

  given(
    '[case11] 🔴 a lane superseded by a new head, whose settled round alone paid',
    () => {
      // aaaa: i1 warmed, i2 followed and saved $0.03 and was itself warmed for $0.05.
      // then the rubric changed: i3 runs as bbbb. no review will read aaaa again
      const runs = [
        asRun({ iteration: 1, head: 'aaaa', warmerCost: 'USD 0.01' }),
        asRun({
          iteration: 2,
          head: 'aaaa',
          brain: null,
          warmerCost: 'USD 0.05',
          cacheSaved: 'USD 0.03',
        }),
        asRun({ iteration: 3, head: 'bbbb', cacheSaved: 'USD 0.01' }),
      ];

      when('[t0] the value is weighed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then('the superseded round lapsed, never awaited', () => {
          expect(value.total?.runsLapsed).toEqual(1);
          expect(value.total?.runsUncovered).toEqual(0);
          expect(
            isPriceOf({ of: value.total!.costAwaited, expected: 'USD 0' }),
          ).toBe(true);
        });

        then(
          '🔴 the verdict flips to loss — the lapsed spend outweighs what was saved',
          () => {
            expect(
              isPriceOf({ of: value.total!.net, expected: 'USD -0.03' }),
            ).toBe(true);
            expect(value.total?.verdict).toEqual('loss');
          },
        );
      });

      when('[t1] the same corpus with no new head after it', () => {
        const value = getOneWarmerValue({ runs: runs.slice(0, 2), now: NOW });

        then(
          'the last round is awaited, and the settled round reads maybe',
          () => {
            expect(value.total?.runsUncovered).toEqual(1);
            expect(value.total?.verdict).toEqual('maybe');
          },
        );
      });
    },
  );

  given(
    '[case12] 🔴 a finished lane whose last warmer has passed the cache reach',
    () => {
      // i1 warmed for $0.01; i2 followed, saved $0.03, and was warmed for $0.05.
      // no review follows i2. the settled pair alone reads maybe (+$0.02)
      const asRuns = (input: { lastAt: string }): ReviewRunMeter[] => [
        asRun({ iteration: 1, warmerCost: 'USD 0.01' }),
        asRun({
          iteration: 2,
          warmerCost: 'USD 0.05',
          cacheSaved: 'USD 0.03',
          lastAt: input.lastAt,
        }),
      ];

      when('[t0] the warmer last poked 70 minutes ago', () => {
        const value = getOneWarmerValue({
          runs: asRuns({ lastAt: '2026-09-26T10:50:00.000Z' }),
          now: NOW,
        });

        then('🔴 the last round lapsed, and the verdict flips to loss', () => {
          expect(value.total?.runsLapsed).toEqual(1);
          expect(value.total?.runsUncovered).toEqual(0);
          expect(
            isPriceOf({ of: value.total!.net, expected: 'USD -0.03' }),
          ).toBe(true);
          expect(value.total?.verdict).toEqual('loss');
        });
      });

      when('[t1] the warmer last poked 10 minutes ago', () => {
        const value = getOneWarmerValue({
          runs: asRuns({ lastAt: '2026-09-26T11:50:00.000Z' }),
          now: NOW,
        });

        then(
          'the last round is still awaited, and the verdict reads maybe',
          () => {
            expect(value.total?.runsLapsed).toEqual(0);
            expect(value.total?.runsUncovered).toEqual(1);
            expect(
              isPriceOf({ of: value.total!.net, expected: 'USD 0.02' }),
            ).toBe(true);
            expect(value.total?.verdict).toEqual('maybe');
          },
        );
      });
    },
  );

  given('[case7] 🔴 two worktrees that share a route name', () => {
    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [
          asRun({ root: '/tree/a/.log', iteration: 1, warmerCost: 'USD 0.01' }),
          asRun({ root: '/tree/b/.log', iteration: 2, cacheSaved: 'USD 0.50' }),
        ],
      });

      then(
        'a review in one tree is never credited to a warmer in another',
        () => {
          expect(value.total?.reviewsCovered).toEqual(0);
          expect(value.total?.verdict).toEqual('unproven');
        },
      );
    });
  });

  given('[case9] one slug that moves to the next stone', () => {
    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [
          asRun({
            stone: '5.1.execution',
            iteration: 1,
            warmerCost: 'USD 0.01',
          }),
          asRun({
            stone: '5.2.evaluation',
            iteration: 2,
            cacheSaved: 'USD 0.20',
          }),
        ],
      });

      then(
        'the next stone review is the warmed lane follower, since the prefix is the rubric',
        () => {
          expect(value.total?.reviewsCovered).toEqual(1);
          expect(value.lanes).toHaveLength(1);
        },
      );
    });
  });

  given('[case10] 🔴 one slug whose prompt head changed', () => {
    // a rubric edit between i1 and i2: the warmed head is no prefix of the next run
    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({
        now: NOW,
        runs: [
          asRun({ iteration: 1, head: 'aaaa', warmerCost: 'USD 0.01' }),
          asRun({ iteration: 2, head: 'bbbb', cacheSaved: 'USD 0.20' }),
        ],
      });

      then(
        'the next run of the new head is never the warmed lane follower',
        () => {
          expect(value.total?.reviewsCovered).toEqual(0);
        },
      );

      then(
        '🔴 the old head lane lapsed — settled at $0 saved, its cost inside the net',
        () => {
          expect(value.total?.runsLapsed).toEqual(1);
          expect(value.total?.runsUncovered).toEqual(0);
          expect(
            isPriceOf({ of: value.total!.net, expected: 'USD -0.01' }),
          ).toBe(true);
          expect(value.total?.verdict).toEqual('loss');
        },
      );

      then('each lane row carries its whole lane, head and all', () => {
        expect(value.lanes).toHaveLength(1);
        expect(value.lanes[0]!.lane).toEqual({
          root: '/tree/a/.log/bhrain/review',
          slug: 'repo-rules',
          head: 'aaaa',
          brain: null,
        });
        expect(value.total?.lane).toBeNull();
      });
    });
  });

  given(
    '[case14] 🔴 a review of the lane that started past the cache reach of the last poke',
    () => {
      // the warmer last poked at 01:00; a review at 02:00 is 60m later, one at 03:00 is 120m
      const asRuns = (input: { iteration: number }): ReviewRunMeter[] => [
        asRun({
          iteration: 1,
          warmerCost: 'USD 0.05',
          lastAt: '2026-09-26T01:00:00.000Z',
        }),
        asRun({ iteration: input.iteration, cacheSaved: 'USD 0.20' }),
      ];

      when('[t0] the review started 120 minutes after the last poke', () => {
        const value = getOneWarmerValue({
          now: NOW,
          runs: asRuns({ iteration: 3 }),
        });

        then(
          'it is no follower — the warmed run lapsed at naught saved',
          () => {
            expect(value.total?.runsLapsed).toEqual(1);
            expect(
              isPriceOf({ of: value.total!.saved, expected: 'USD 0' }),
            ).toBe(true);
          },
        );

        then('⛔ the verdict is a loss, never `maybe`', () => {
          expect(value.total?.verdict).toEqual('loss');
        });
      });

      when('[t1] the review started 60 minutes after the last poke', () => {
        const value = getOneWarmerValue({
          now: NOW,
          runs: asRuns({ iteration: 2 }),
        });

        then('it follows within reach, and its cache saved is credited', () => {
          expect(value.total?.runsLapsed).toEqual(0);
          expect(value.total?.verdict).toEqual('maybe');
        });
      });
    },
  );

  given(
    '[case15] 🔴 one warmer, then three unwarmed rounds of the lane within reach',
    () => {
      // the warmer last poked at 03:30 and cost $0.05; rounds at 02:00, 03:00, 04:00
      // each read its warmth and saved $0.02 — $0.06 in all, more than the spend
      const runs = [
        asRun({
          iteration: 1,
          warmerCost: 'USD 0.05',
          lastAt: '2026-09-26T03:30:00.000Z',
        }),
        asRun({ iteration: 2, cacheSaved: 'USD 0.02' }),
        asRun({ iteration: 3, cacheSaved: 'USD 0.02' }),
        asRun({ iteration: 4, cacheSaved: 'USD 0.02' }),
      ];

      when('[t0] the value is weighed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then('🔴 every in-reach round is credited, not the first alone', () => {
          expect(value.total?.reviewsCovered).toEqual(3);
          expect(
            isPriceOf({ of: value.total!.saved, expected: 'USD 0.06' }),
          ).toBe(true);
        });

        then('the verdict reads maybe, never loss', () => {
          expect(
            isPriceOf({ of: value.total!.net, expected: 'USD 0.01' }),
          ).toBe(true);
          expect(value.total?.verdict).toEqual('maybe');
        });
      });
    },
  );

  given('[case16] a round past the reach, after rounds within it', () => {
    // the warmer last poked at 01:30; rounds at 02:00 (in reach) and 03:00 (past it)
    const runs = [
      asRun({
        iteration: 1,
        warmerCost: 'USD 0.05',
        lastAt: '2026-09-26T01:30:00.000Z',
      }),
      asRun({ iteration: 2, cacheSaved: 'USD 0.02' }),
      asRun({ iteration: 3, cacheSaved: 'USD 0.40' }),
    ];

    when('[t0] the value is weighed', () => {
      const value = getOneWarmerValue({ runs, now: NOW });

      then('only the in-reach round is credited', () => {
        expect(value.total?.reviewsCovered).toEqual(1);
        expect(
          isPriceOf({ of: value.total!.saved, expected: 'USD 0.02' }),
        ).toBe(true);
        expect(value.total?.verdict).toEqual('loss');
      });
    });
  });

  given(
    '[case17] a warmer whose last row carries a stamp that does not parse',
    () => {
      when('[t0] the value is weighed', () => {
        const value = getOneWarmerValue({
          now: NOW,
          runs: [
            asRun({
              iteration: 1,
              warmerCost: 'USD 0.05',
              lastAt: 'not-a-stamp',
            }),
          ],
        });

        then('it is read as no instant at all — awaited, never lapsed', () => {
          expect(value.total?.runsUncovered).toEqual(1);
          expect(value.total?.runsLapsed).toEqual(0);
          expect(value.total?.verdict).toEqual('unproven');
        });
      });
    },
  );

  given(
    '[case18] 🔴 a followed warmer read mid-route, while its reach is still open',
    () => {
      // the warmer last poked at 03:50 and cost $0.05; the 02:00 round saved $0.02.
      // a round at 04:30 would still read its warmth, so the pair cannot settle yet
      const runs = [
        asRun({
          iteration: 1,
          warmerCost: 'USD 0.05',
          lastAt: '2026-09-26T03:50:00.000Z',
        }),
        asRun({ iteration: 2, cacheSaved: 'USD 0.02' }),
      ];

      when('[t0] the value is weighed 10 minutes after the last poke', () => {
        const value = getOneWarmerValue({
          runs,
          now: new Date('2026-09-26T04:00:00.000Z'),
        });

        then(
          '🔴 the verdict is never a loss — a later round may yet pay',
          () => {
            expect(value.total?.verdict).not.toEqual('loss');
            expect(value.total?.verdict).toEqual('unproven');
          },
        );

        then('the spend sits in costAwaited, outside net', () => {
          expect(value.total?.runsUncovered).toEqual(1);
          expect(
            isPriceOf({ of: value.total!.costAwaited, expected: 'USD 0.05' }),
          ).toBe(true);
        });
      });

      when('[t1] the same corpus is weighed once the reach has closed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then('the pair settles on its follower, and the loss is final', () => {
          expect(value.total?.reviewsCovered).toEqual(1);
          expect(value.total?.verdict).toEqual('loss');
        });
      });
    },
  );

  given(
    '[case19] a window that holds one priced and one unpriced follower',
    () => {
      // the warmer last poked at 03:30; the 02:00 round saved $0.02, the 03:00 round
      // is unpriced. both read the warmth, so the pair's saved is unknown in full
      const runs = [
        asRun({
          iteration: 1,
          warmerCost: 'USD 0.05',
          lastAt: '2026-09-26T03:30:00.000Z',
        }),
        asRun({ iteration: 2, cacheSaved: 'USD 0.02' }),
        asRun({ iteration: 3, cacheSaved: null }),
      ];

      when('[t0] the value is weighed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then(
          'the pair is unweighed whole — a partial sum is never a net',
          () => {
            expect(value.total?.runsUncovered).toEqual(1);
            expect(value.total?.reviewsCovered).toEqual(0);
            expect(value.total?.verdict).toEqual('unproven');
          },
        );
      });
    },
  );

  given(
    '[case20] 🔴 the follower in reach timed out, so its grade is `unknown`',
    () => {
      // the warmer last poked at 03:50 for $0.05. the lane's next review started at
      // 04:00, compiled its prompt (so it may well have read the warmth), then timed out
      // before it wrote metrics. its saved is UNRECORDED, never $0
      const runs = [
        asRun({
          iteration: 1,
          warmerCost: 'USD 0.05',
          lastAt: '2026-09-26T03:50:00.000Z',
        }),
        asRun({ iteration: 4, grade: 'unknown' }),
      ];

      when('[t0] the value is weighed long after the reach closed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then(
          '🔴 the pair is unweighed, never lapsed at $0 saved — an unknown is not a zero',
          () => {
            expect(value.total?.runsUncovered).toEqual(1);
            expect(value.total?.runsLapsed).toEqual(0);
            expect(value.total?.verdict).toEqual('unproven');
          },
        );
      });

      when('[t1] the same follower is `refused` instead', () => {
        const value = getOneWarmerValue({
          runs: [runs[0]!, asRun({ iteration: 4, grade: 'refused' })],
          now: NOW,
        });

        then(
          'it never reached the brain, so the warmth lapsed unread — a FACT',
          () => {
            expect(value.total?.runsLapsed).toEqual(1);
          },
        );
      });
    },
  );

  given('[case8] the two production folds that must not disagree', () => {
    // 🔴 an extracted decision binds only the call sites someone wired, so what
    //    is asserted here is the DELEGATION, never the arithmetic above
    when('[t0] each fold module is read as source', () => {
      const readOne = (path: string): string =>
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('fs').readFileSync(
          require('path').join(__dirname, path),
          'utf8',
        ) as string;

      then('the `tree` fold delegates to this operation', () => {
        expect(readOne('./meter/genReviewMeterReport.ts')).toContain(
          'getOneWarmerValue(',
        );
      });

      then('the `grove` fold delegates to this operation', () => {
        expect(readOne('./grove/genReviewGroveReport.ts')).toContain(
          'getOneWarmerValue(',
        );
      });

      then('both renders delegate to the one shared renderer', () => {
        expect(readOne('./meter/genReviewMeterStdout.ts')).toContain(
          'asWarmerValueLines(',
        );
        expect(readOne('./grove/genReviewGroveStdout.ts')).toContain(
          'asWarmerValueLines(',
        );
      });
    });
  });

  given(
    '[case13] 🔴 a warmed run, then a review of the same head on another brain',
    () => {
      // the warmer poked one provider's cache; the next review read another's. its
      // cache saved was never the warmer's doing, so the two must not pair
      const runs = [
        asRun({
          iteration: 1,
          head: 'aaaa',
          brain: 'openrouter/deepseek/flash',
          warmerCost: 'USD 0.02',
          lastAt: '2026-09-26T01:10:00.000Z',
        }),
        asRun({
          iteration: 2,
          head: 'aaaa',
          brain: 'anthropic/claude/sonnet/v5',
          cacheSaved: 'USD 0.05',
        }),
      ];

      when('[t0] the value is weighed', () => {
        const value = getOneWarmerValue({ runs, now: NOW });

        then('no review is credited to the warmer', () => {
          expect(value.total?.reviewsCovered).toEqual(0);
          expect(isPriceOf({ of: value.total!.saved, expected: 'USD 0' })).toBe(
            true,
          );
        });

        then(
          'the warmed run lapsed — its brain is sent by no later run',
          () => {
            expect(value.total?.runsLapsed).toEqual(1);
            expect(value.total?.verdict).toEqual('loss');
          },
        );
      });
    },
  );
});
