import * as fs from 'fs';
import {
  getError,
  MalfunctionError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import { asIsoPriceHuman, priceMultiply, priceSum } from 'iso-price';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';
import {
  BASIS_OF_RUNAWAY_ASK,
  type ReviewRunMetricsRealized,
} from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

import { NAME_OF_RUN_ARTIFACT } from './asRunArtifactPath';
import { ReviewBrainCallError } from './ReviewBrainCallError';
import { stepReview } from './stepReview';

/**
 * .what = the verdict the fake brain returns once it answers
 */
const VERDICT = {
  done: true,
  blockers: [],
  nitpicks: [
    {
      rule: 'rule.name-the-actor',
      title: 'name the actor',
      description: 'the wave was caught by whom?',
      locations: ['src/paddleOut.ts:1'],
      snippet: { lang: 'ts', code: 'export const paddleOut = 1;' },
    },
  ],
};

/**
 * .what = the metrics the fake brain reports when it answers
 */
const METRICS = {
  size: {
    tokens: { input: 100, output: 10, cache: { get: 0, set: 0 } },
    chars: { input: 400, output: 40, cache: { get: 0, set: 0 } },
  },
  cost: {
    time: { seconds: 1 },
    cash: {
      total: 'USD 0.02',
      deets: {
        input: 'USD 0.01',
        output: 'USD 0.01',
        cache: { get: 'USD 0.00', set: 'USD 0.00' },
      },
    },
  },
} as BrainOutputMetrics; // a plain literal of the declared shape; the class adds no field

/**
 * .what = the rate card of the real test brain, which the fake brain carries
 * .why = a runaway ask is priced off it, so the expected cost is computed from it too
 */
const RATES = genBrainAtom({ slug: DEFAULT_TEST_BRAIN }).spec.cost.cash;

/**
 * .what = the fault the brain package throws on a reply cut at the output limit
 * .why = shaped as `rhachet-brains-openrouter@0.1.3` builds it (`getOneReplyDefectError`):
 *        a MalfunctionError whose metadata carries `finishReason: 'length'`, an empty
 *        content, and the full output limit spent — the i018 r002 / r017 runaways verbatim
 */
const asFaultRunaway = (input: {
  generationId: string;
  tokensOutput: number | null;
}) =>
  new MalfunctionError(
    "openrouter's reply was cut off at the output limit (finish_reason=length), after 131072 output tokens. the partial reply is withheld.",
    {
      finishReason: 'length',
      provider: 'InferenceNet',
      generationId: input.generationId,
      contentLength: 0,
      tokensOutput: input.tokensOutput,
      errorMessage: null,
    },
  );

/**
 * .what = a brain context whose ask runs away the given number of times, then answers
 *
 * .mock = the brain's `ask`, alone
 * .why = a runaway think cannot be summoned on demand: measured 2026-10-07, four of ~90
 *        asks on route 5.1 ran away, and a replay of two of those exact prompts did not
 *        (rule.forbid.integration.mocks, its documented-exception clause). every other
 *        layer — scope, render, the deadline, the artifact writes — runs real. the spec is
 *        the REAL test brain's, so the window is the window production measures against
 * .real = the live brain contract is exercised by `stepReview.integration.test.ts`
 *
 * .note = deliberate mutation, in a scoped zone: `asks` counts each call via push
 */
const genBrainThatRunsAway = (input: {
  runaways: number;
  tokensOutput: number | null;
}): { brain: ContextBrain<BrainChoice>; asks: string[] } => {
  const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
  const asks: string[] = [];
  const choice = {
    slug: atom.slug,
    spec: atom.spec,
    ask: async () => {
      asks.push(`gen-${asks.length + 1}`);
      if (asks.length <= input.runaways)
        throw asFaultRunaway({
          generationId: `gen-${asks.length}`,
          tokensOutput: input.tokensOutput,
        });
      return { output: VERDICT, metrics: METRICS };
    },
  };
  return {
    brain: { brain: { choice } } as unknown as ContextBrain<BrainChoice>, // a fake reads only slug, spec, and ask
    asks,
  };
};

/**
 * .what = writes a file, parents and all
 */
const setOneFile = (input: { at: string; text: string }): void => {
  fs.mkdirSync(path.dirname(input.at), { recursive: true });
  fs.writeFileSync(input.at, input.text, 'utf-8');
};

/**
 * .what = the latest review run's log dir under the fixture, its filenames, and its
 *         realized metrics where written
 */
const getAllArtifactsOfLatestRun = (input: {
  cwd: string;
}): { names: string[]; realized: ReviewRunMetricsRealized | null } => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  const latest = runs[runs.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError('no review log dir under the fixture', {
      root,
      hint: 'the review never minted a log dir; check the stepReview call ran under this cwd',
    });
  const dir = path.join(root, latest);
  const names = fs.readdirSync(dir).sort();
  const realized = names.includes(NAME_OF_RUN_ARTIFACT.realized)
    ? (JSON.parse(
        fs.readFileSync(path.join(dir, NAME_OF_RUN_ARTIFACT.realized), 'utf-8'),
      ) as ReviewRunMetricsRealized) // the file this run's own writer just wrote
    : null;
  return { names, realized };
};

/**
 * .what = a render with its per-run parts masked: the temp dir and the log-dir stamp
 * .why = the rest of the render is a contract with the driver who reads it, so it is
 *        pinned whole; only the parts that vary per run are masked
 */
const asRenderStable = (input: { text: string; cwd: string }): string =>
  input.text
    .split(input.cwd)
    .join('$CWD')
    .replace(/\d{4}-\d{2}-\d{2}T[0-9-]+Z[.\w-]*/g, '$STAMP');

/**
 * .what = runs one review over a small fixture, with stderr and stdout captured
 *
 * .note = deliberate mutation, in a scoped zone: `lines` and `linesOut` accumulate via push, and the
 *         console spies restore in a `finally` so no other case inherits them
 */
const runOneReview = async (input: {
  slug: string;
  runaways: number;
  tokensOutput: number | null;
}) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  setOneFile({
    at: path.join(cwd, 'rules/rule.name-the-actor.md'),
    text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
  });
  setOneFile({
    at: path.join(cwd, 'src/paddleOut.ts'),
    text: 'export const paddleOut = 1;\n',
  });
  const fake = genBrainThatRunsAway({
    runaways: input.runaways,
    tokensOutput: input.tokensOutput,
  });
  const lines: string[] = [];
  const linesOut: string[] = [];
  const spyErr = jest
    .spyOn(console, 'error')
    .mockImplementation(
      (...args: unknown[]) => void lines.push(args.join(' ')),
    );
  const spyLog = jest
    .spyOn(console, 'log')
    .mockImplementation(
      (...args: unknown[]) => void linesOut.push(args.join(' ')),
    );
  try {
    const outcome = await stepReview(
      {
        rules: 'rules/*.md',
        paths: 'src/**/*.ts',
        mode: 'apply',
        output: path.join(cwd, 'review.md'),
        focus: 'push',
        goal: 'representative',
        cwd,
      },
      { brain: fake.brain },
    ).then(
      (result) => ({ result, error: null }),
      (error: unknown) => ({ result: null, error }),
    );
    return {
      ...outcome,
      cwd,
      asks: fake.asks,
      stderr: lines.join('\n'),
      stdout: linesOut.join('\n'),
      artifacts: getAllArtifactsOfLatestRun({ cwd }),
    };
  } finally {
    spyErr.mockRestore();
    spyLog.mockRestore();
  }
};

/**
 * .what = a reply that runs to the output limit asks once more, inside the brain call
 * .why = 🔴 CLAMP. at 5.1 i018, lanes r002 and r017 each ran their think to the 131,072-token
 *        output limit on InferenceNet with no content, and each malfunctioned the lane: a
 *        blocker, a whole re-arrive round, and a full output limit billed for naught. the
 *        same lanes completed on every other round, so the runaway is sampled — one more
 *        ask is the cure, and it costs one lane's wait instead of a round
 */
describe('stepReview — a reply that runs to the output limit', () => {
  given('[case1] the brain runs away once, then answers', () => {
    const run = useBeforeAll(async () =>
      runOneReview({
        slug: 'review-runaway-once',
        runaways: 1,
        tokensOutput: 131072,
      }),
    );

    when('[t0] the review runs', () => {
      then('it returns the verdict of the second ask', () => {
        expect(run.error).toEqual(null);
        expect(run.result?.outcome).toEqual('reviewed');
        expect(run.asks.length).toEqual(2);
      });

      then(
        'it names the runaway ask on stderr — its spend, host, and generation',
        () => {
          expect(run.stderr).toContain(
            "the brain's reply ran to its output limit with no verdict",
          );
          expect(run.stderr).toContain('131,072 output tokens billed');
          expect(run.stderr).toContain('provider InferenceNet');
          expect(run.stderr).toContain('generation gen-1');
        },
      );

      // .why = the phrases above pin what the aside SAYS; this pins how it is laid out —
      //        the rails, the branch order, the fault clause's own words
      then('the assembled stderr matches the snapshot', () => {
        expect(
          asRenderStable({ text: run.stderr, cwd: run.cwd }),
        ).toMatchSnapshot();
      });

      then(
        '🔴 the realized tokens bill BOTH asks — the runaway output and the answer',
        () => {
          // 131,072 output tokens of the runaway, plus the answer's 10
          expect(run.result?.metrics.realized.tokens?.output).toEqual(
            131072 + 10,
          );
          expect(run.artifacts.realized?.tokens.output).toEqual(131072 + 10);

          // the runaway sent the same 100-token prompt, at the full input rate
          expect(run.artifacts.realized?.tokens.input).toEqual(100 + 100);
        },
      );

      then(
        '🔴 the realized cost bills both asks, at the brain rate card for the runaway',
        () => {
          const costRunaway = asIsoPriceHuman(
            priceSum([
              priceMultiply({ of: RATES.input, by: 100 }),
              priceMultiply({ of: RATES.output, by: 131072 }),
            ]),
          );
          const costTotal = asIsoPriceHuman(
            priceSum([asIsoPriceHuman('USD 0.02'), costRunaway]),
          );
          expect(run.result?.metrics.realized.cost?.total).toEqual(costTotal);
          expect(run.artifacts.realized?.cost.total).toEqual(costTotal);
        },
      );

      then(
        'the artifact attributes the runaway beside the total, with its basis',
        () => {
          expect(run.artifacts.realized?.runaways).toEqual([
            {
              supply: { provider: 'InferenceNet', generationId: 'gen-1' },
              tokens: { input: 100, output: 131072 },
              cost: {
                input: asIsoPriceHuman(
                  priceMultiply({ of: RATES.input, by: 100 }),
                ),
                output: asIsoPriceHuman(
                  priceMultiply({ of: RATES.output, by: 131072 }),
                ),
                total: asIsoPriceHuman(
                  priceSum([
                    priceMultiply({ of: RATES.input, by: 100 }),
                    priceMultiply({ of: RATES.output, by: 131072 }),
                  ]),
                ),
              },
              basis: BASIS_OF_RUNAWAY_ASK,
            },
          ]);
        },
      );
    });
  });

  given('[case3] the brain answers at once', () => {
    const run = useBeforeAll(async () =>
      runOneReview({
        slug: 'review-runaway-never',
        runaways: 0,
        tokensOutput: 131072,
      }),
    );

    when('[t0] the review runs', () => {
      then('the realized metrics carry the answer alone, no runaway', () => {
        expect(run.artifacts.realized?.tokens.output).toEqual(10);
        expect(run.artifacts.realized?.cost.total).toEqual(
          asIsoPriceHuman('USD 0.02'),
        );
        expect(run.artifacts.realized?.runaways).toEqual([]);
      });
    });
  });

  given('[case2] the brain runs away on every ask', () => {
    const run = useBeforeAll(async () =>
      runOneReview({
        slug: 'review-runaway-always',
        runaways: 9,
        tokensOutput: 131072,
      }),
    );

    when('[t0] the review runs', () => {
      then('it stops after two asks — never a third full output limit', () => {
        expect(run.asks.length).toEqual(2);
      });

      then('🔴 the lane still malfunctions, with the cause named', async () => {
        const error = await getError(async () => {
          throw run.error;
        });
        expect(error).toBeInstanceOf(ReviewBrainCallError);
        expect(error.message).toContain('💥 MalfunctionError:');
        expect(error.message).toContain(
          'the brain ran to its output limit on two asks in a row',
        );
      });

      then(
        'no realized metrics are written, so the meter grades the run unknown — absent, never $0',
        () => {
          // .note = as for every failed brain call (caseProviderOutage): the prompt is on
          //         disk, the realized file is not, and `getOneReviewRunGrade` reads that
          //         pair as `unknown`, whose cost renders absent rather than low
          expect(run.artifacts.names).toContain(NAME_OF_RUN_ARTIFACT.prompt);
          expect(run.artifacts.names).not.toContain(
            NAME_OF_RUN_ARTIFACT.realized,
          );
        },
      );
    });
  });

  /**
   * .what = a runaway whose output count the brain package did not report
   * .why = 🔴 CLAMP. its spend cannot be priced, so the artifact writer refuses to state a
   *        total and the meter grades the run `unknown`. stdout and the sdk return once still
   *        stated the answered ask's cost alone — a number too low, beside a meter that said
   *        absent. no surface may state a number the artifact writer refused to write
   */
  given(
    '[case4] the brain runs away once with no output count, then answers',
    () => {
      const run = useBeforeAll(async () =>
        runOneReview({
          slug: 'review-runaway-unmeasured',
          runaways: 1,
          tokensOutput: null,
        }),
      );

      when('[t0] the review runs', () => {
        then('it returns the verdict of the second ask', () => {
          expect(run.error).toEqual(null);
          expect(run.result?.outcome).toEqual('reviewed');
          expect(run.asks.length).toEqual(2);
        });

        then(
          'no realized metrics are written, so the meter grades it unknown',
          () => {
            expect(run.artifacts.names).not.toContain(
              NAME_OF_RUN_ARTIFACT.realized,
            );
          },
        );

        then('🔴 the sdk return carries no cost — unknown, never low', () => {
          expect(run.result?.metrics.realized.cost).toEqual(null);
        });

        then('🔴 stdout states no cost total — it renders absent', () => {
          expect(run.stdout).not.toMatch(/total: \$/);
          expect(run.stdout).toContain(
            '├─ spend: unmeasured 🟡 the brain reported no usage — unknown, not $0',
          );
        });

        then(
          '🔴 the sdk return carries no token count — the answer alone would read low, the input side as much as the output',
          () => {
            // the runaway sent the same prompt, so the answer's input count alone reads low
            expect(run.result?.metrics.realized.tokens).toEqual(null);
          },
        );

        then(
          '🔴 stdout states no input-side token count — each renders absent, never the answer alone',
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

        // .why = the regexes above pin which figures render absent; this pins the whole
        //        stdout a driver reads — the rails, the row order, each absent marker
        then('the assembled stdout matches the snapshot', () => {
          expect(
            asRenderStable({ text: run.stdout, cwd: run.cwd }),
          ).toMatchSnapshot();
        });
      });
    },
  );
});
