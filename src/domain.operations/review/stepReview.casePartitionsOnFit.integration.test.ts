import * as fs from 'fs';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';

import { asReviewLogsDir } from './asReviewLogsDir';
import type { StepReviewResult } from './StepReviewResult';
import { stepReview } from './stepReview';

/**
 * .what = the verdict the fake brain returns, the same on every ask
 * .why = the two runs of a case must differ ONLY in the partition declaration, so the
 *        brain's answer is held fixed — then any delta between the two results is the
 *        declaration's own fault
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
 * .what = the metrics the fake brain reports, the same on every ask
 * .why = fixed, so the realized figures of the two runs compare equal
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
 * .why = this suite asserts how `stepReview` treats a partition DECLARATION on a run that
 *        fits — a decision made before the brain is reached. a live provider would add cost
 *        and variance and settle naught here; the verdict is held fixed so the two runs of a
 *        case are comparable. the spec is the REAL test brain's, so the window the fit is
 *        measured against is the window production measures against
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
 * .what = writes a file, parents and all
 * .why = the fixture nests its targets one dir deep
 */
const setOneFile = (input: { at: string; text: string }): void => {
  fs.mkdirSync(path.dirname(input.at), { recursive: true });
  fs.writeFileSync(input.at, input.text, 'utf-8');
};

/**
 * .what = a temp repo with one rule and two small targets in two dirs
 * .why = small enough to fit any window, so a declaration can never be needed
 */
const setOneRepoThatFits = (input: { slug: string }): string => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  setOneFile({
    at: path.join(cwd, 'rules/rule.name-the-actor.md'),
    text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
  });
  setOneFile({
    at: path.join(cwd, 'src/paddleOut.ts'),
    text: 'export const paddleOut = 1;\n',
  });
  setOneFile({
    at: path.join(cwd, 'docs/waves.md'),
    text: '# waves\n\nthe surfer catches the wave.\n',
  });
  return cwd;
};

/**
 * .what = runs one review over the fixture, with stderr captured and stdout muted
 * .why = the clamp reads stderr for a partition refusal or warn; stdout carries the
 *        render, which the two runs share and this suite does not grade
 *
 * .note = deliberate mutation, in a scoped zone: `lines` accumulates via push, and the
 *         console spies restore in a `finally` so no other case inherits them
 */
const runOneReview = async (input: {
  cwd: string;
  output: string;
  partitions: string[] | undefined;
  /** the run's mode; apply where the case does not say */
  mode?: 'apply' | 'plan';
}): Promise<{
  result: StepReviewResult | null;
  error: unknown;
  stderr: string;
}> => {
  const lines: string[] = [];
  const spyErr = jest
    .spyOn(console, 'error')
    .mockImplementation(
      (...args: unknown[]) => void lines.push(args.join(' ')),
    );
  const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    const result = await stepReview(
      {
        rules: 'rules/*.md',
        pathsWith: ['src/**', 'docs/**'],
        partitions: input.partitions,
        mode: input.mode ?? 'apply',
        output: path.join(input.cwd, input.output),
        focus: 'push',
        goal: 'representative',
        cwd: input.cwd,
      },
      { brain: genBrainFixedVerdict() },
    );
    return { result, error: null, stderr: lines.join('\n') };
  } catch (error) {
    // a refusal is the outcome the clamp guards against; it is returned for the assertion
    return { result: null, error, stderr: lines.join('\n') };
  } finally {
    spyErr.mockRestore();
    spyLog.mockRestore();
  }
};

/**
 * .what = the parts of a result that a partition declaration must not change
 * .why = the log dir and output path differ per run by construction; all else must match
 */
const asResultComparable = (result: StepReviewResult | null) =>
  result
    ? {
        outcome: result.outcome,
        summary: result.summary,
        formatted: result.review.formatted,
        files: result.metrics.files,
        expected: result.metrics.expected,
        realized: result.metrics.realized,
      }
    : null;

/**
 * .what = a partition declaration is a progressive enhancement: a lane that fits runs
 *         exactly as if none were declared
 * .why = 🔴 CLAMP. the split was once checked on every run that declared partitions, fit or
 *        not, so one stale glob refused (or warned on) a lane that never needed to split.
 *        the check now runs only where a split is read — a `--mode plan` preview, or an
 *        overflow that splits
 */
describe('stepReview — partitions declared on a run that fits', () => {
  given('[case1] a declaration that leaves a target unclaimed', () => {
    const scene = useBeforeAll(async () => {
      const cwd = setOneRepoThatFits({
        slug: 'review-partition-fit-unclaimed',
      });
      const declared = await runOneReview({
        cwd,
        output: 'review.declared.md',
        partitions: ['src=src/**'], // docs/waves.md sits in no partition
      });
      const undeclared = await runOneReview({
        cwd,
        output: 'review.undeclared.md',
        partitions: undefined,
      });
      return { declared, undeclared };
    });

    when('[t0] the review runs in apply mode', () => {
      then('it does not refuse', () => {
        expect(scene.declared.error).toEqual(null);
        expect(scene.declared.result?.outcome).toEqual('reviewed');
      });

      then('it emits no partition refusal or warn line', () => {
        expect(scene.declared.stderr).not.toContain('in no partition');
        expect(scene.declared.stderr).not.toContain('--partition');
        expect(scene.declared.stderr).not.toContain('no file is common');
      });

      then('its result equals the run with no partitions declared', () => {
        expect(asResultComparable(scene.declared.result)).toEqual(
          asResultComparable(scene.undeclared.result),
        );
        expect(scene.declared.stderr).toEqual(scene.undeclared.stderr);
      });
    });
  });

  given('[case2] a declaration of two partitions that share no file', () => {
    const scene = useBeforeAll(async () => {
      const cwd = setOneRepoThatFits({
        slug: 'review-partition-fit-disjoint',
      });
      const declared = await runOneReview({
        cwd,
        output: 'review.declared.md',
        partitions: ['src=src/**', 'docs=docs/**'], // a sound split that earns a warn
      });
      const undeclared = await runOneReview({
        cwd,
        output: 'review.undeclared.md',
        partitions: undefined,
      });
      return { declared, undeclared };
    });

    when('[t0] the review runs in apply mode', () => {
      then('it emits no partition warn line', () => {
        expect(scene.declared.error).toEqual(null);
        expect(scene.declared.stderr).not.toContain('no file is common');
      });

      then('its result equals the run with no partitions declared', () => {
        expect(asResultComparable(scene.declared.result)).toEqual(
          asResultComparable(scene.undeclared.result),
        );
        expect(scene.declared.stderr).toEqual(scene.undeclared.stderr);
      });
    });
  });

  given('[case3] a --mode plan run with no partition declared', () => {
    const scene = useBeforeAll(async () => {
      const cwd = setOneRepoThatFits({
        slug: 'review-partition-plan-undeclared',
      });
      const planned = await runOneReview({
        cwd,
        output: 'review.planned.md',
        partitions: undefined,
        mode: 'plan',
      });
      return { cwd, planned };
    });

    when('[t0] the review runs', () => {
      then('it refuses, and names the flag that would give it a split', () => {
        expect(scene.planned.result).toEqual(null);
        expect(scene.planned.stderr).toContain(
          '--mode plan previews a partition split, and none is declared',
        );
        expect(scene.planned.stderr).toContain('--partition');
      });

      then('the refusal renders whole', () => {
        expect(
          scene.planned.stderr.split(scene.cwd).join('$CWD'),
        ).toMatchSnapshot();
      });

      then(
        '🔴 it leaves no review log dir behind — the refusal is a gate on the flags',
        () => {
          expect(fs.existsSync(asReviewLogsDir({ cwd: scene.cwd }))).toEqual(
            false,
          );
        },
      );
    });
  });
});
