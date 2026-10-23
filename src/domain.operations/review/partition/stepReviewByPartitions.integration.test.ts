import * as fs from 'fs';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewOverflowRefusedError } from '@src/domain.operations/review/ReviewOverflowRefusedError';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { stepReviewByPartitions } from './stepReviewByPartitions';

const OUTPUT =
  '.behavior/v2026_10_04.feat/.reviews/peer/5.3.verification._.review.i003.ee09cef13102f22c3a.r001._.given.by_peer.repo-rules.report.md';

/** the route a guarded run was driven from */
const ROUTE = '.behavior/v2026_10_04.feat';

/** the route spec both partitions carry — the common file the prime writes once */
const VISION = '.behavior/v2026_10_04.feat/1.vision.md';

/**
 * .what = how many times a needle occurs in a text
 * .why = a lane-wide cause must be stated ONCE; a `toContain` cannot tell once from twice
 */
const asCountOfOccurrences = (input: {
  text: string;
  needle: string;
}): number => input.text.split(input.needle).length - 1;

/**
 * .what = a lane clock that begins now, with a bound far ahead
 * .why = these cases test the split and the merge, never the bound; a wide bound leaves
 *        every retry its time, so the bound never decides an outcome here
 */
const asClockOfTest = () => ({
  msOfReviewStart: Date.now(),
  brainCallTimeoutMs: 10 * 60_000,
});

/**
 * .what = a partition run that never calls a brain — it echoes its scope as its verdict
 * .why = `options.runOne` is the caller's choice of run step, so the split and the merge
 *        are testable with no brain cost; the review step it stands in for has its own tests
 */
const asRunOneFake =
  (input: { cwd: string; seen: StepReviewInput[] }) =>
  async (review: StepReviewInput): Promise<StepReviewResult> => {
    input.seen.push(review);
    const blockersCount = review.partition?.name === 'src' ? 2 : 0;
    const outputAbsolute = path.join(input.cwd, review.output);
    fs.mkdirSync(path.dirname(outputAbsolute), { recursive: true });
    fs.writeFileSync(outputAbsolute, `verdict of ${review.partition?.name}`);
    console.log(`${blockersCount} blockers`);
    return {
      outcome: 'reviewed',
      review: { formatted: `- blocker in ${review.partition?.name}` },
      log: { dir: path.join(input.cwd, '.log', review.partition?.name ?? '') },
      output: { path: outputAbsolute },
      summary: { blockersCount, nitpicksCount: 1 },
      metrics: {
        files: {
          rulesCount: 1,
          refsCount: 0,
          conversationCount: 0,
          targetsCount: 2,
        },
        expected: {
          tokens: { estimate: 1000, contextWindowPercent: 40 },
          cost: { estimate: asIsoPriceHuman('USD 0.01') },
        },
        realized: {
          tokens: {
            input: 100,
            inputCacheCreation: 0,
            inputCacheRead: 900,
            output: 50,
          },
          cost: {
            input: asIsoPriceHuman('USD 0.01'),
            cacheWrite: asIsoPriceHuman('USD 0.00'),
            cacheRead: asIsoPriceHuman('USD 0.001'),
            output: asIsoPriceHuman('USD 0.02'),
            total: asIsoPriceHuman('USD 0.031'),
          },
          time: { seconds: 30 },
        },
      },
    };
  };

/**
 * .mock = console.error + console.log, captured or silenced per case
 * .why = the split's whole contract is which lines land on stdout (one merged
 *        blockers/nitpicks pair) and which on stderr, so the capture IS the observation.
 *        console is an in-process global, never the remote boundary this suite
 *        integrates (the fs, and the injected runOne fake)
 * .real = `blackbox/review.partition.acceptance.test.ts` and
 *         `blackbox/driver.route.partition-journey.acceptance.test.ts` read the real
 *         stdout of a split lane
 */
describe('stepReviewByPartitions', () => {
  given('[case1] an overflowed lane split into two partitions', () => {
    const cwd = genTempDir({ slug: 'review-by-partitions' });
    const seen: StepReviewInput[] = [];

    when('[t0] the split runs', () => {
      const run = useThen('it merges the partitions', async () => {
        const stdout: string[] = [];
        const logOriginal = console.log;
        const spyErr = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        console.log = (...args: unknown[]) => stdout.push(args.join(' '));
        try {
          const result = await stepReviewByPartitions(
            {
              review: {
                rules: 'rules/*.md',
                output: OUTPUT,
                focus: 'push',
                goal: 'exhaustive',
                partitions: [
                  'src={src/**,.behavior/**}',
                  'docs={readme.md,.behavior/**}',
                ],
              },
              partitions: [
                {
                  name: 'src',
                  globs: ['src/**', '.behavior/**'],
                  common: [VISION],
                  narrow: ['src/a.ts'],
                  commonGraded: [VISION],
                },
                {
                  name: 'docs',
                  globs: ['readme.md', '.behavior/**'],
                  common: [VISION],
                  narrow: ['readme.md'],
                  commonGraded: [],
                },
              ],
              logDir: path.join(cwd, '.log/whole'),
              clock: asClockOfTest(),
              cwd,
              route: ROUTE,
            },
            { runOne: asRunOneFake({ cwd, seen }) },
          );
          return {
            result,
            stdout: stdout.join('\n'),
            merged: fs.readFileSync(path.join(cwd, OUTPUT), 'utf-8'),
          };
        } finally {
          console.log = logOriginal;
          spyErr.mockRestore();
        }
      });

      then(
        '🔴 the common prefix is primed first, with no target of its own to grade',
        () => {
          expect(seen[0]?.partition?.name).toEqual('(prime)');
          expect(seen[0]?.prime).toEqual(true);
          expect(seen[0]?.partition?.common).toEqual([VISION]);
          expect(seen[0]?.partition?.narrow).toEqual([]);
        },
      );

      then(
        'each partition then runs once, with its own scope and its own output',
        () => {
          expect(seen.map((review) => review.partition?.name)).toEqual([
            '(prime)',
            'src',
            'docs',
          ]);
          expect(seen[1]?.output).toContain('/.reviews/peer/.partition=1.src/');
          expect(seen[2]?.output).toContain(
            '/.reviews/peer/.partition=2.docs/',
          );
        },
      );

      then(
        '🔴 each partition is told its peers — every other partition, never itself — and the prime none',
        () => {
          const peersOf = seen.map((review) =>
            review.partition ? review.peers.map((peer) => peer.name) : null,
          );
          expect(peersOf).toEqual([[], ['docs'], ['src']]);
          const peersOfSrc = seen[1]?.partition ? seen[1].peers : null;
          expect(peersOfSrc).toEqual([
            { name: 'docs', globs: ['readme.md', '.behavior/**'] },
          ]);
        },
      );

      then(
        "🔴 stdout holds ONE tally — the merged sum — never a partition's own",
        () => {
          expect(run.stdout.match(/\d+ blockers?/g)).toEqual(['2 blockers']);
          expect(run.stdout.match(/\d+ nitpicks?/g)).toEqual(['2 nitpicks']);
        },
      );

      // .why = the regexes pin the counts; this pins the render around them —
      //        rails, row order, and the report lines. the temp dir varies per run,
      //        so it is masked first
      then('the merged stdout matches the snapshot', () => {
        const text = run.stdout.split(cwd).join('$CWD');
        expect(text).toContain('🦉 needs your talons');
        expect(text).toContain('├─ 2 blockers 🔴');
        expect(text).toContain('└─ total: $0.093');
        expect(text).toMatchSnapshot();
      });

      then(
        "the counts are summed over the partitions; tokens and cost include the prime's spend",
        () => {
          expect(run.result.summary).toEqual({
            blockersCount: 2,
            nitpicksCount: 2,
          });
          expect(run.result.metrics.realized.tokens?.inputCacheRead).toEqual(
            2700,
          );
          expect(run.result.metrics.realized.cost?.total).toEqual('$0.093');
        },
      );

      then(
        "the merged report holds one section per partition, under the lane's own output",
        () => {
          expect(run.merged).toContain('## partition: src');
          expect(run.merged).toContain('## partition: docs');
          expect(run.merged).not.toContain('## partition: (prime)');
          expect(run.merged).toContain(
            '1 narrow target + 1 common target (1 graded here, 0 read as context)',
          );
          expect(run.merged).toContain(
            '1 narrow target + 1 common target (0 graded here, 1 read as context)',
          );
          expect(run.merged).toContain('2 blockers');
        },
      );
    });
  });

  given(
    '[case2] a split whose later partition drops its brain call once',
    () => {
      const cwd = genTempDir({ slug: 'review-by-partitions-drop' });
      const seen: StepReviewInput[] = [];

      when('[t0] the split runs', () => {
        const run = useThen('it still merges both partitions', async () => {
          const runOneFake = asRunOneFake({ cwd, seen });
          const drops: string[] = [];
          const spyErr = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
          const spyLog = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});
          try {
            return await stepReviewByPartitions(
              {
                review: {
                  rules: 'rules/*.md',
                  output: OUTPUT,
                  focus: 'push',
                  goal: 'exhaustive',
                  partitions: ['src=src/**', 'docs=readme.md'],
                },
                partitions: [
                  {
                    name: 'src',
                    globs: ['src/**'],
                    common: [],
                    narrow: ['src/a.ts'],
                    commonGraded: [],
                  },
                  {
                    name: 'docs',
                    globs: ['readme.md'],
                    common: [],
                    narrow: ['readme.md'],
                    commonGraded: [],
                  },
                ],
                logDir: path.join(cwd, '.log/whole'),
                clock: asClockOfTest(),
                cwd,
                route: ROUTE,
              },
              {
                // the (rest) partition's first call drops its socket, as a provider would
                runOne: async (review) => {
                  if (review.partition?.name === 'docs' && drops.length === 0) {
                    drops.push(review.partition.name);
                    throw new ReviewBrainCallError({
                      error: new Error('terminated'),
                    });
                  }
                  return runOneFake(review);
                },
              },
            );
          } finally {
            spyErr.mockRestore();
            spyLog.mockRestore();
          }
        });

        then(
          '🔴 the dropped partition runs once more, and the earlier verdict is kept',
          () => {
            expect(seen.map((review) => review.partition?.name)).toEqual([
              'src',
              'docs',
            ]);
            expect(run.summary).toEqual({ blockersCount: 2, nitpicksCount: 2 });
          },
        );

        // .why = the dropped first call may have been billed before its socket closed, and
        //        it reports no figures. a sum over the survivors alone would read low, beside
        //        a meter that grades that first run `unknown` (`0.wish`: never under-report)
        then(
          '🔴 the lane cost is unknown, never the survivors alone — the swallowed fault may have been billed',
          () => {
            expect(run.metrics.realized.cost).toEqual(null);
            // the input side too: the dropped call sent its prompt, so a survivor sum reads low
            expect(run.metrics.realized.tokens).toEqual(null);
          },
        );

        then(
          '🟡 while every verdict is still kept, so the clamp is not vacuous',
          () => {
            expect(run.outcome).toEqual('reviewed');
          },
        );
      });
    },
  );

  /**
   * .what = runs a two-partition split whose prime throws the given error
   * .why = the prime's catch must part a fault it survives from a defect it rethrows; one
   *        harness serves both cases, so they differ only in what the prime throws
   */
  const runSplitWithPrimeThrow = async (input: {
    slug: string;
    error: unknown;
  }): Promise<{
    stderr: string[];
    seen: StepReviewInput[];
    result: unknown;
    cwd: string;
  }> => {
    const cwd = genTempDir({ slug: input.slug });
    const seen: StepReviewInput[] = [];
    const runOneFake = asRunOneFake({ cwd, seen });
    const stderr: string[] = [];
    const spyErr = jest
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        stderr.push(args.join(' '));
      });
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const result = await stepReviewByPartitions(
        {
          review: {
            rules: 'rules/*.md',
            output: OUTPUT,
            focus: 'push',
            goal: 'exhaustive',
            partitions: [
              'src={src/**,.behavior/**}',
              'docs={readme.md,.behavior/**}',
            ],
          },
          partitions: [
            {
              name: 'src',
              globs: ['src/**', '.behavior/**'],
              common: [VISION],
              narrow: ['src/a.ts'],
              commonGraded: [VISION],
            },
            {
              name: 'docs',
              globs: ['readme.md', '.behavior/**'],
              common: [VISION],
              narrow: ['readme.md'],
              commonGraded: [],
            },
          ],
          logDir: path.join(cwd, '.log/whole'),
          clock: asClockOfTest(),
          cwd,
          route: ROUTE,
        },
        {
          runOne: async (review) => {
            if (review.prime) throw input.error;
            return runOneFake(review);
          },
        },
      ).catch((error: unknown) => error);
      return { stderr, seen, result, cwd };
    } finally {
      spyErr.mockRestore();
      spyLog.mockRestore();
    }
  };

  given('[case3] a split whose prime meets a provider fault', () => {
    when('[t0] the split runs', () => {
      const run = useThen('it pours cold', async () =>
        runSplitWithPrimeThrow({
          slug: 'review-by-partitions-prime-fault',
          error: new ReviewBrainCallError({ error: new Error('terminated') }),
        }),
      );

      then(
        '🔴 every partition still runs, and the merged verdict returns',
        () => {
          expect(run.seen.map((review) => review.partition?.name)).toEqual([
            'src',
            'docs',
          ]);
          expect(run.result).not.toBeInstanceOf(Error);
        },
      );

      then('stderr names the fault as a MalfunctionError', () => {
        expect(
          run.stderr.some((line) =>
            line.startsWith(
              '💥 MalfunctionError: the prime of the shared prefix failed',
            ),
          ),
        ).toEqual(true);
      });

      then(
        '🔴 the fault line holds the inner headline alone — one line, no metadata block, no repeated class label',
        () => {
          const line = run.stderr.find((each) =>
            each.includes('the prime of the shared prefix failed'),
          );
          expect(line).toEqual(
            '💥 MalfunctionError: the prime of the shared prefix failed (the brain call failed — terminated); its peer partitions pour cold',
          );
        },
      );

      then('the fault stderr reads as a driver meets it', () => {
        const text = run.stderr.join('\n').split(run.cwd).join('$CWD');
        expect(text).toContain('split into 2 declared partitions');
        expect(text).toContain('its peer partitions pour cold');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case4] a split whose prime meets a defect in our own code', () => {
    when('[t0] the split runs', () => {
      const run = useThen('it fails loud', async () =>
        runSplitWithPrimeThrow({
          slug: 'review-by-partitions-prime-defect',
          error: new TypeError('cannot read properties of undefined'),
        }),
      );

      then('🔴 the defect rethrows as itself, never as a cold pour', () => {
        expect(run.result).toBeInstanceOf(TypeError);
        expect(
          run.stderr.some((line) =>
            line.includes('its peer partitions pour cold'),
          ),
        ).toEqual(false);
      });

      then('no partition runs on a defect', () => {
        expect(run.seen).toEqual([]);
      });
    });
  });

  given('[case5] a split whose partition faults on its retry too', () => {
    const cwd = genTempDir({ slug: 'review-by-partitions-fault-section' });
    const seen: StepReviewInput[] = [];

    when('[t0] the split runs', () => {
      const run = useThen('it merges a fault section', async () => {
        const runOneFake = asRunOneFake({ cwd, seen });
        const spyErr = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        try {
          const result = await stepReviewByPartitions(
            {
              review: {
                rules: 'rules/*.md',
                output: OUTPUT,
                focus: 'push',
                goal: 'exhaustive',
                partitions: ['src=src/**', 'docs=readme.md'],
              },
              partitions: [
                {
                  name: 'src',
                  globs: ['src/**'],
                  common: [],
                  narrow: ['src/a.ts'],
                  commonGraded: [],
                },
                {
                  name: 'docs',
                  globs: ['readme.md'],
                  common: [],
                  narrow: ['readme.md'],
                  commonGraded: [],
                },
              ],
              logDir: path.join(cwd, '.log/whole'),
              clock: asClockOfTest(),
              cwd,
              route: ROUTE,
            },
            {
              // the docs partition drops its socket on both attempts
              runOne: async (review) => {
                if (review.partition?.name === 'docs')
                  throw new ReviewBrainCallError({
                    error: new Error('terminated'),
                  });
                return runOneFake(review);
              },
            },
          );
          return {
            result,
            merged: fs.readFileSync(path.join(cwd, OUTPUT), 'utf-8'),
          };
        } finally {
          spyErr.mockRestore();
          spyLog.mockRestore();
        }
      });

      then('the fault counts as one blocker beside the kept verdict', () => {
        expect(run.result.summary.blockersCount).toEqual(3);
      });

      then(
        '🔴 the fault section names the inner headline under one qualified class — no metadata block, no second class label',
        () => {
          expect(run.merged).toContain(
            '💥 MalfunctionError: the partition failed before it returned a verdict: the brain call failed — terminated\n',
          );
          expect(run.merged).not.toContain('"hint"');
          expect(run.merged).not.toContain('verdict: 💥');
        },
      );

      then('the merged report matches the snapshot', () => {
        expect(run.merged).toContain('├─ 3 blockers 🔴');
        expect(run.merged).toContain(
          '# blocker.1 — this partition did not review',
        );
        expect(run.merged).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = runs a two-partition split whose every partition overflows alone
   * .why = the lane-wide refusal must read the same shape on a route run and a hand run, and
   *        differ only in the lever it names; one harness serves both cases
   */
  const runSplitWhereEveryPartitionOverflows = async (input: {
    slug: string;
    route: string | null;
  }): Promise<{ result: StepReviewResult; merged: string }> => {
    const cwd = genTempDir({ slug: input.slug });
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const result = await stepReviewByPartitions(
        {
          review: {
            rules: 'rules/*.md',
            output: OUTPUT,
            focus: 'push',
            goal: 'exhaustive',
            partitions: ['src=src/**', 'docs=readme.md'],
          },
          partitions: [
            {
              name: 'src',
              globs: ['src/**'],
              common: [],
              narrow: ['src/a.ts'],
              commonGraded: [],
            },
            {
              name: 'docs',
              globs: ['readme.md'],
              common: [],
              narrow: ['readme.md'],
              commonGraded: [],
            },
          ],
          logDir: path.join(cwd, '.log/whole'),
          clock: asClockOfTest(),
          cwd,
          route: input.route,
        },
        {
          // every partition overflows alone, as the review step refuses one
          runOne: async () => {
            throw new ReviewOverflowRefusedError();
          },
        },
      );
      return {
        result,
        merged: fs.readFileSync(path.join(cwd, OUTPUT), 'utf-8'),
      };
    } finally {
      spyErr.mockRestore();
      spyLog.mockRestore();
    }
  };

  given(
    '[case6] a split whose every partition refuses on the same overflow',
    () => {
      when('[t0] the split runs', () => {
        const run = useThen('it merges a refusal per partition', async () =>
          runSplitWhereEveryPartitionOverflows({
            slug: 'review-by-partitions-all-refuse',
            route: ROUTE,
          }),
        );

        then('each refusal counts as one blocker', () => {
          expect(run.result.summary.blockersCount).toEqual(2);
          expect(
            asCountOfOccurrences({
              text: run.merged,
              needle: '# blocker.1 — this partition did not review',
            }),
          ).toEqual(2);
        });

        then('🔴 the report never advises a re-run, which cannot help', () => {
          expect(run.merged).not.toContain('re-arrive to re-run');
        });

        then('the report names the lane-wide cause and its fix', () => {
          expect(run.merged).toContain(
            'every partition of this lane refused on this same constraint',
          );
          expect(run.merged).toContain(
            'narrow each partition, or split each in two',
          );
        });

        // .note = clamp: the lane-wide diagnosis was once printed under EVERY partition, so a
        //         driver read N copies of one cause. it is stated once, ahead of them all
        then(
          '🔴 the lane-wide cause and its fix are stated exactly once, ahead of every partition',
          () => {
            expect(
              asCountOfOccurrences({
                text: run.merged,
                needle:
                  'every partition of this lane refused on this same constraint',
              }),
            ).toEqual(1);
            expect(
              asCountOfOccurrences({
                text: run.merged,
                needle: 'narrow each partition, or split each in two',
              }),
            ).toEqual(1);
            expect(
              run.merged.indexOf('## lane: every partition refused'),
            ).toBeLessThan(run.merged.indexOf('## partition: src'));
          },
        );

        then('each partition points to the one cause above', () => {
          expect(
            asCountOfOccurrences({
              text: run.merged,
              needle:
                'this partition refused with the lane — the cause and its fix are stated once, above.',
            }),
          ).toEqual(2);
        });

        then('the merged report matches the snapshot', () => {
          expect(run.merged).toContain(
            'every partition of this lane refused on this same constraint',
          );
          expect(run.merged).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = a split whose one partition's spend is unmeasured
   * .why = 🔴 CLAMP. that partition's run writes no realized artifact, so the meter grades
   *        it `unknown`. the lane's one cost line once summed the measured partitions alone
   *        and printed a total too low. one unknown part makes the lane's cost unknown
   */
  given('[case7] a split whose one partition has an unmeasured spend', () => {
    const cwd = genTempDir({ slug: 'review-by-partitions-unmeasured' });
    const seen: StepReviewInput[] = [];

    when('[t0] the split runs', () => {
      const run = useThen('it merges both partitions', async () => {
        const runOneFake = asRunOneFake({ cwd, seen });
        const stdout: string[] = [];
        const logOriginal = console.log;
        const spyErr = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        console.log = (...args: unknown[]) => stdout.push(args.join(' '));
        try {
          const result = await stepReviewByPartitions(
            {
              review: {
                rules: 'rules/*.md',
                output: OUTPUT,
                focus: 'push',
                goal: 'exhaustive',
                partitions: ['src=src/**', 'docs=readme.md'],
              },
              partitions: [
                {
                  name: 'src',
                  globs: ['src/**'],
                  common: [],
                  narrow: ['src/a.ts'],
                  commonGraded: [],
                },
                {
                  name: 'docs',
                  globs: ['readme.md'],
                  common: [],
                  narrow: ['readme.md'],
                  commonGraded: [],
                },
              ],
              logDir: path.join(cwd, '.log/whole'),
              clock: asClockOfTest(),
              cwd,
              route: ROUTE,
            },
            {
              // the docs partition ran away with no output count, so its spend is unmeasured
              runOne: async (review) => {
                const result = await runOneFake(review);
                if (review.partition?.name !== 'docs') return result;
                return {
                  ...result,
                  metrics: {
                    ...result.metrics,
                    // as `asReviewRunMetricsRealizedOfResult` writes an unmeasured spend
                    realized: {
                      ...result.metrics.realized,
                      tokens: null,
                      cost: null,
                    },
                  },
                };
              },
            },
          );
          return { result, stdout: stdout.join('\n') };
        } finally {
          console.log = logOriginal;
          spyErr.mockRestore();
        }
      });

      then('🔴 the merged result carries no cost — unknown, never low', () => {
        expect(run.result.metrics.realized.cost).toEqual(null);
      });

      then('🔴 stdout states no cost total — it renders absent', () => {
        expect(run.stdout).not.toMatch(/total: \$/);
        expect(run.stdout).toContain(
          '├─ spend: unmeasured 🟡 the brain reported no usage — unknown, not $0',
        );
      });

      then(
        '🔴 the merged result carries no token count — the measured partition alone would read low, the input side as much as the output',
        () => {
          expect(run.result.metrics.realized.tokens).toEqual(null);
        },
      );

      then(
        '🔴 stdout states no input-side token count — each renders absent, never the measured partition alone',
        () => {
          expect(run.stdout).not.toMatch(/│ {2}├─ input: \d/);
          expect(run.stdout).not.toMatch(/│ {2}├─ cache\.(set|get): \d/);
          // the whole realized spend collapses into one row, so no token branch renders there
          expect(run.stdout).toContain(
            '✨ metrics.realized\n   ├─ spend: unmeasured 🟡 the brain reported no usage — unknown, not $0\n   └─ time',
          );
        },
      );

      then(
        '🔴 stdout states no output count and no token total — the caveat appears once',
        () => {
          // the token rows sit under `│`; the time row does not, so it is never matched
          expect(run.stdout).not.toMatch(/│ {2}├─ output: \d/);
          expect(run.stdout).not.toMatch(/│ {2}└─ total: \d/);
          expect(run.stdout.match(/unknown, not \$0/g)?.length).toEqual(1);
        },
      );

      then('the tally still merges both partitions', () => {
        expect(run.result.summary).toEqual({
          blockersCount: 2,
          nitpicksCount: 2,
        });
      });

      // .why = the regexes pin each absent figure; this pins the whole render around them —
      //        the rails, the row order, and the absent-figure marks. the temp dir varies per
      //        run, so it is masked first
      then('the merged stdout matches the snapshot', () => {
        expect(run.stdout.split(cwd).join('$CWD')).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = a hand run (`rhx review --partition ...`, no route bound) whose every partition
   *         overflows
   * .why = 🔴 CLAMP. the fault section once phrased every recovery in route terms — re-arrive,
   *        and declare the set on a route guard — which is a dead end with no route bound
   */
  given(
    '[case8] a hand run whose every partition refuses on the same overflow',
    () => {
      when('[t0] the split runs', () => {
        const run = useThen('it merges a refusal per partition', async () =>
          runSplitWhereEveryPartitionOverflows({
            slug: 'review-by-partitions-hand-run',
            route: null,
          }),
        );

        then(
          '🔴 the fix names the --partition flags of this review line, never a route',
          () => {
            expect(run.merged).toContain(
              'narrow the --partition declarations on this review line, then run it again.',
            );
            expect(run.merged).not.toContain('re-arrive');
            expect(run.merged).not.toContain('route.guard.partition');
          },
        );

        then('each refusal still counts as one blocker', () => {
          expect(run.result.summary.blockersCount).toEqual(2);
        });

        then('the merged report matches the snapshot', () => {
          expect(run.merged).toContain('## lane: every partition refused');
          expect(run.merged).toMatchSnapshot();
        });
      });
    },
  );
});
