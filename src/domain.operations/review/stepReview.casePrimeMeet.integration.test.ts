import * as fs from 'fs';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';
import { ENV_OF_REVIEW_SUBPROCESS } from '@src/domain.operations/isReviewSubprocess';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS } from '@src/domain.operations/review/getOneReviewBrainCallTimeoutMsFromEnv';
import { asReviewPrefixPrimeKey } from '@src/domain.operations/review/prime/asReviewPrefixPrimeKey';
import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';
import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';

import type { StepReviewResult } from './StepReviewResult';
import { stepReview } from './stepReview';

/**
 * .what = the verdict the fake brain returns, the same on every ask
 * .why = this suite grades the prime meet ahead of the brain call, never the verdict
 */
const VERDICT = { done: true, blockers: [], nitpicks: [] };

/**
 * .what = the metrics the fake brain reports, the same on every ask
 * .why = fixed, so a run's spend is measured and its realized artifact is written
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
 * .what = a brain context whose ask returns a fixed verdict, with no network call
 *
 * .mock = the brain's `ask`, alone
 * .why = this suite asserts how `stepReview` meets its pour's peers on the prime watermark —
 *        a decision made before the brain is reached. a live provider would add cost and
 *        variance and settle naught here. the spec is the REAL test brain's
 * .real = the live brain contract is exercised by `stepReview.integration.test.ts`
 */
const genBrainFixedVerdict = (): ContextBrain<BrainChoice> => {
  const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
  const choice = {
    slug: atom.slug,
    spec: atom.spec,
    ask: async () => ({ output: VERDICT, metrics: METRICS }),
  };
  return { brain: { choice } } as unknown as ContextBrain<BrainChoice>; // a fake reads only slug, spec, and ask
};

/**
 * .what = a temp repo with one rule and one small target
 * .why = small enough to fit any window, so the run reviews whole and reaches the meet
 */
const setOneRepo = (input: { slug: string }): string => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  fs.mkdirSync(path.join(cwd, 'rules'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, 'rules/rule.name-the-actor.md'),
    '# rule.name-the-actor\n\nname the actor, then the act.\n',
  );
  fs.writeFileSync(
    path.join(cwd, 'src/paddleOut.ts'),
    'export const paddleOut = 1;\n',
  );
  return cwd;
};

/**
 * .what = a render with its per-run parts masked: the temp dir, the log-dir stamp, and the
 *         wait a deadline read off the wall
 * .why = the rest of the render is a contract with the driver who reads it, so it is
 *        pinned whole; only the parts that vary per run are masked
 */
const asRenderStable = (input: { text: string; cwd: string }): string =>
  input.text
    .split(input.cwd)
    .join('$CWD')
    .replace(/\d{4}-\d{2}-\d{2}T[0-9-]+Z[.\w-]*/g, '$STAMP')
    .replace(/\d+ms\b/g, '<N>ms');

/**
 * .what = runs one review over the fixture, with the env set for the run alone, stderr
 *         captured, and stdout muted
 * .why = the meet reads the review's clock, and a stale env would leak into every later case
 *
 * .note = deliberate mutation, in a scoped zone: `lines` accumulates via push; the env and
 *         the console spies restore in a `finally`, so no other case inherits them
 */
const runOneReview = async (input: {
  cwd: string;
  output: string;
  meet: 'join' | 'skip' | undefined;
  env: Record<string, string>;
}): Promise<{
  result: StepReviewResult | null;
  error: unknown;
  stderr: string;
  ms: number;
}> => {
  const lines: string[] = [];
  const prior = Object.fromEntries(
    Object.keys(input.env).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, input.env);
  const spyErr = jest
    .spyOn(console, 'error')
    .mockImplementation(
      (...args: unknown[]) => void lines.push(args.join(' ')),
    );
  const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const before = Date.now();
  try {
    const result = await stepReview(
      {
        rules: 'rules/*.md',
        pathsWith: ['src/**'],
        output: path.join(input.cwd, input.output),
        focus: 'push',
        goal: 'representative',
        cwd: input.cwd,
        meet: input.meet,
      },
      { brain: genBrainFixedVerdict() },
    );
    return {
      result,
      error: null,
      stderr: lines.join('\n'),
      ms: Date.now() - before,
    };
  } catch (error) {
    return {
      result: null,
      error,
      stderr: lines.join('\n'),
      ms: Date.now() - before,
    };
  } finally {
    spyErr.mockRestore();
    spyLog.mockRestore();
    Object.entries(prior).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      if (value !== undefined) process.env[key] = value;
    });
  }
};

/**
 * .what = the watermark a run's head meets its peers on
 * .why = the key is derived from the brain and the static head the run wrote to its log dir,
 *        exactly as the meet derives it
 */
const asWatermarkOfRun = (input: {
  cwd: string;
  result: StepReviewResult;
}): { cwd: string; key: string } => {
  const head = fs.readFileSync(
    asRunArtifactPath({ dir: input.result.log.dir, artifact: 'head' }),
    'utf-8',
  );
  return {
    cwd: input.cwd,
    key: asReviewWatermarkKey({
      kind: 'prime',
      of: [
        asReviewPrefixPrimeKey({
          brain: genBrainAtom({ slug: DEFAULT_TEST_BRAIN }).slug,
          head,
        }),
      ],
    }),
  };
};

/**
 * .what = the review's meet with its pour's peers is declared by its caller, and bounded by
 *         its own deadline
 * .why = 🔴 CLAMP, two of them:
 *        - the meet was once decided by a hidden read of `process.env` deep in the review, so
 *          any process that carried the subprocess marker met peers it never declared. the
 *          contract now reads the marker once and passes `meet`
 *        - the meet's waits once ignored the lane's deadline, so a peer that waited on a
 *          wedged claim spent the whole bound, and the brain call that followed timed out.
 *          every wait now stops at half the bound, so the review still lands inside it
 */
describe('stepReview — the prime meet', () => {
  given(
    '[case1] a run under the subprocess marker, whose caller declared no meet',
    () => {
      when('[t0] the review runs', () => {
        const scene = useThen('it reviews', async () => {
          const cwd = setOneRepo({ slug: 'review-prime-meet-undeclared' });
          const run = await runOneReview({
            cwd,
            output: 'review.md',
            meet: undefined,
            env: { [ENV_OF_REVIEW_SUBPROCESS]: '1' },
          });
          const raw = run.result
            ? await getOneReviewWatermarkRaw(
                asWatermarkOfRun({ cwd, result: run.result }),
              )
            : 'unreached';
          return { run, raw };
        });

        then('it reviews', () => {
          expect(scene.run.error).toEqual(null);
          expect(scene.run.result?.outcome).toEqual('reviewed');
        });

        then(
          '🔴 it meets no peer — the env marker alone does not join the meet',
          () => {
            expect(scene.raw).toEqual(null);
          },
        );
      });
    },
  );

  given(
    '[case2] a lane that joins the meet, where a peer holds a claim it never releases',
    () => {
      when('[t0] the lane runs under a short bound', () => {
        const scene = useThen('it reviews', async () => {
          const cwd = setOneRepo({ slug: 'review-prime-meet-wedged' });

          // a first run, which skips the meet, writes the head the watermark is keyed on
          const first = await runOneReview({
            cwd,
            output: 'review.first.md',
            meet: 'skip',
            env: {},
          });
          if (!first.result) throw first.error;
          const watermark = asWatermarkOfRun({ cwd, result: first.result });

          // a claim, fresh and never released — a wedged peer
          await setOneReviewWatermarkRaw({
            ...watermark,
            raw: JSON.stringify({
              claimedBy: 'pid1.wedged',
              claimedAt: Date.now(),
              primedBy: null,
              primedAt: null,
              warm: false,
              sent: false,
              peers: [],
            }),
          });

          // the lane joins the meet, under a bound short enough to grade
          // .why scaled to the first run = the meet stops at half the bound, counted from the
          //      review's start, so the setup ahead of the meet spends that half. a loaded
          //      host once spent all of a fixed 3s on setup, the meet lapsed before it ever
          //      met the wedged claim, and the case graded naught. the first run's whole cost
          //      measures that setup on this host now, so the half keeps 2x headroom past it
          const msOfBound = Math.max(6_000, first.ms * 4);
          const run = await runOneReview({
            cwd,
            output: 'review.second.md',
            meet: 'join',
            env: { [ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS]: String(msOfBound) },
          });
          return { run, cwd, msOfBound };
        });

        then(
          '🔴 it reviews, inside its bound — the meet never starved the brain call',
          () => {
            expect(scene.run.error).toEqual(null);
            expect(scene.run.result?.outcome).toEqual('reviewed');
            expect(scene.run.ms).toBeLessThan(scene.msOfBound);
          },
        );

        then('the meet gave up its wait, and said so on stderr', () => {
          expect(scene.run.stderr).toContain(
            'the prime of the shared head was not released within',
          );
        });

        then('the assembled stderr matches the snapshot', () => {
          expect(
            asRenderStable({ text: scene.run.stderr, cwd: scene.cwd }),
          ).toMatchSnapshot();
        });
      });
    },
  );
});
