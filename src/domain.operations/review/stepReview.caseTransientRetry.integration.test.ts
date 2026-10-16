import * as fs from 'fs';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';

import { NAME_OF_RUN_ARTIFACT } from './asRunArtifactPath';
import { stepReview } from './stepReview';

/**
 * .what = the verdict the fake brain returns once it answers
 */
const VERDICT = {
  done: true,
  blockers: [],
  nitpicks: [],
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
 * .what = a socket the provider closed mid-stream — transient, and possibly billed
 */
const asFaultSocketDrop = (): Error =>
  Object.assign(new Error('terminated'), { code: 'UND_ERR_SOCKET' });

/**
 * .what = a rate-limit refusal the provider rejected before any work — transient, and unbilled
 * .why = a `BadRequestError` is the one class `isFaultOfUnbilledCall` grades free
 */
const asFaultRefusal = (): Error =>
  Object.assign(new BadRequestError('429 rate limited'), { status: 429 });

/**
 * .what = a brain context whose first ask throws the given fault, then answers
 *
 * .mock = the brain's `ask`, alone
 * .why = a provider fault mid-stream cannot be summoned on demand
 *        (rule.forbid.integration.mocks, its documented-exception clause). every other
 *        layer — scope, render, the deadline, the retry, the artifact writes — runs real
 * .real = the live brain contract is exercised by `stepReview.integration.test.ts`
 *
 * .note = deliberate mutation, in a scoped zone: `asks` counts each call via push
 */
const genBrainThatFaultsOnce = (input: {
  fault: Error;
}): { brain: ContextBrain<BrainChoice>; asks: number[] } => {
  const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
  const asks: number[] = [];
  const choice = {
    slug: atom.slug,
    spec: atom.spec,
    ask: async () => {
      asks.push(asks.length);
      if (asks.length === 1) throw input.fault;
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
 * .what = the filenames the latest review run landed in its log dir
 */
const getAllArtifactsOfLatestRun = (input: { cwd: string }): string[] => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  const latest = runs[runs.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError('no review log dir under the fixture', {
      root,
      hint: 'the review never minted a log dir; check the stepReview call ran under this cwd',
    });
  return fs.readdirSync(path.join(root, latest)).sort();
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
 * .note = deliberate mutation, in a scoped zone: `lines` and `linesOut` accumulate via push,
 *         and the console spies restore in a `finally` so no other case inherits them
 */
const runOneReview = async (input: { slug: string; fault: Error }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  setOneFile({
    at: path.join(cwd, 'rules/rule.name-the-actor.md'),
    text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
  });
  setOneFile({
    at: path.join(cwd, 'src/paddleOut.ts'),
    text: 'export const paddleOut = 1;\n',
  });
  const fake = genBrainThatFaultsOnce({ fault: input.fault });
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
    const result = await stepReview(
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
    );
    return {
      result,
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
 * .what = a transient fault the run's retry swallows, then a second ask that answers
 * .why = 🔴 CLAMP. the retry cures the lane, yet the first ask may have been billed before
 *        its socket closed, and it reports no figures. a run that read the answer alone
 *        would state a cost too low, beside a meter that has no record of the first ask.
 *        so a swallowed fault that may have been billed makes the run's spend unknown; a
 *        refusal no brain billed leaves it measured (`0.wish`: never under-report)
 */
describe('stepReview — a transient fault its retry swallows', () => {
  given(
    '[case1] the first ask drops its socket mid-stream, then the retry answers',
    () => {
      const run = useBeforeAll(async () =>
        runOneReview({
          slug: 'review-transient-drop',
          fault: asFaultSocketDrop(),
        }),
      );

      when('[t0] the review runs', () => {
        then('it returns the verdict of the second ask', () => {
          expect(run.result.outcome).toEqual('reviewed');
          expect(run.asks.length).toEqual(2);
        });

        then('🔴 the sdk return carries no cost — unknown, never low', () => {
          expect(run.result.metrics.realized.cost).toEqual(null);
          // the dropped ask sent its prompt too, so the answer's input count alone reads low
          expect(run.result.metrics.realized.tokens).toEqual(null);
        });

        then(
          '🔴 no realized record is written, so the meter grades the run unknown',
          () => {
            expect(run.artifacts).not.toContain(NAME_OF_RUN_ARTIFACT.realized);
            expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.prompt);
          },
        );

        then('stderr says why the spend is unmeasured', () => {
          expect(run.stderr).toContain('spend is unmeasured');
        });

        // .why = the phrase above pins what the aside SAYS; this pins how it is laid out —
        //        the rails, the branch order, the clause's own words
        then('the assembled stderr matches the snapshot', () => {
          expect(
            asRenderStable({ text: run.stderr, cwd: run.cwd }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] the first ask is refused unbilled, then the retry answers',
    () => {
      const run = useBeforeAll(async () =>
        runOneReview({
          slug: 'review-transient-refusal',
          fault: asFaultRefusal(),
        }),
      );

      when('[t0] the review runs', () => {
        then('it returns the verdict of the second ask', () => {
          expect(run.result.outcome).toEqual('reviewed');
          expect(run.asks.length).toEqual(2);
        });

        then('the cost stays measured — a refusal billed naught', () => {
          expect(run.result.metrics.realized.cost?.total).toEqual(
            asIsoPriceHuman('USD 0.02'),
          );
          expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.realized);
        });

        // .why = the same emission path as [case1]; pinned whole, it shows the unbilled
        //        refusal earns no unmeasured aside
        then('the assembled stderr matches the snapshot', () => {
          expect(run.stderr).not.toContain('spend is unmeasured');
          expect(
            asRenderStable({ text: run.stderr, cwd: run.cwd }),
          ).toMatchSnapshot();
        });
      });
    },
  );
});
