import * as fs from 'fs';
import * as path from 'path';
import type { BrainChoice, BrainOutputMetrics, ContextBrain } from 'rhachet';
import { genBrainAtom } from 'rhachet-brains-openrouter';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';

import type { StepReviewResult } from './StepReviewResult';
import { stepReview } from './stepReview';

/**
 * .what = the verdict the fake brain returns, the same on every ask
 */
const VERDICT = { done: true, blockers: [], nitpicks: [] };

/**
 * .what = the metrics the fake brain reports, the same on every ask
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
 * .what = the marker each version of the narrow target `src/b/wave.ts` carries
 * .why = the clamp asks which version every partition prompt sent — the bytes the lane
 *        settled, or the bytes on disk after the first ask
 */
const MARKER_SETTLED = 'MARKER_OF_SETTLED_BYTES';
const MARKER_DRIFTED = 'MARKER_OF_DRIFTED_BYTES';

/**
 * .what = the context window the fake brain declares, in tokens
 * .why = sized so the whole lane (two ~20k-token dirs) overflows its 75% bound and splits,
 *        while each partition (one dir, plus the shared file) fits
 */
const WINDOW_TOKENS = 40_000;

/**
 * .what = a target body of about `chars` chars, which opens on a marker line
 */
const asTargetBody = (input: { marker: string; chars: number }): string =>
  [
    `// ${input.marker}`,
    ...Array.from(
      { length: Math.ceil(input.chars / 32) },
      (_, index) => `export const swell_${index} = ${index};`,
    ),
  ].join('\n');

/**
 * .what = writes a file, parents and all
 */
const setOneFile = (input: { at: string; text: string }): void => {
  fs.mkdirSync(path.dirname(input.at), { recursive: true });
  fs.writeFileSync(input.at, input.text, 'utf-8');
};

/**
 * .what = a temp repo whose two target dirs overflow the window together and fit apart,
 *         plus one small file both partitions share
 * .why = the shared file makes the split's `common` nonempty, so the prime runs FIRST —
 *        which gives the fake brain one ask, ahead of the pour, at which to drift the disk
 */
const setOneRepoThatSplits = (input: { slug: string }): string => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  setOneFile({
    at: path.join(cwd, 'rules/rule.name-the-actor.md'),
    text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
  });
  setOneFile({
    at: path.join(cwd, 'src/a/paddle.ts'),
    text: asTargetBody({ marker: 'MARKER_OF_A', chars: 80_000 }),
  });
  setOneFile({
    at: path.join(cwd, 'src/b/wave.ts'),
    text: asTargetBody({ marker: MARKER_SETTLED, chars: 80_000 }),
  });
  setOneFile({
    at: path.join(cwd, 'shared/tide.md'),
    text: '# tide\n\nthe tide turns twice a day.\n',
  });
  return cwd;
};

/**
 * .what = a brain context that records every ask, and drifts the disk on the first one
 *
 * .mock = the brain's `ask`, alone
 * .why = this suite asserts WHICH bytes each partition sends — a decision made before the
 *        brain is reached, over the scope the lane settled. the first ask is the prime, which
 *        completes before the pour; to rewrite a narrow target there is exactly the drift a
 *        per-partition re-walk would read and a settled scope must not. a live provider would
 *        add cost and settle naught here. the spec is the REAL test brain's, with only its
 *        window narrowed, so the lane splits
 * .real = the live brain contract is exercised by `stepReview.integration.test.ts`
 *
 * .note = deliberate mutation, in a scoped zone: `asks` accumulates via push
 */
const genBrainThatDrifts = (input: {
  cwd: string;
  asks: { role: string; prompt: string }[];
}): ContextBrain<BrainChoice> => {
  const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
  const spec = {
    ...atom.spec,
    gain: {
      ...atom.spec.gain,
      size: {
        ...atom.spec.gain.size,
        context: { ...atom.spec.gain.size.context, tokens: WINDOW_TOKENS },
      },
    },
  };
  const choice = {
    slug: atom.slug,
    spec,
    ask: async (ask: { role: unknown; prompt: string }) => {
      // drift the narrow target on the first ask — the prime, ahead of the pour
      if (input.asks.length === 0)
        setOneFile({
          at: path.join(input.cwd, 'src/b/wave.ts'),
          text: asTargetBody({ marker: MARKER_DRIFTED, chars: 80_000 }),
        });
      input.asks.push({ role: JSON.stringify(ask.role), prompt: ask.prompt });
      return { output: VERDICT, metrics: METRICS };
    },
  };
  return { brain: { choice } } as unknown as ContextBrain<BrainChoice>; // a fake reads only slug, spec, and ask
};

/**
 * .what = the scope a split lane walks ONCE, whose bytes every partition then sends
 * .why = 🔴 CLAMP. each partition run once re-ran the whole scope walk and file read, so a
 *        file that changed after the split was planned — between the prime and the pour —
 *        reached a partition's prompt as bytes no plan was made over, and the prime and the
 *        partitions sent different `common` bytes. the scope now settles once per lane and
 *        every partition (and the prime) narrows that one settled scope
 */
describe('stepReview — a lane that splits into partitions', () => {
  given('[case1] a narrow target that changes on disk after the prime', () => {
    const scene = useBeforeAll(async () => {
      const cwd = setOneRepoThatSplits({ slug: 'review-partition-settled' });
      const asks: { role: string; prompt: string }[] = [];
      const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      try {
        const result: StepReviewResult = await stepReview(
          {
            rules: 'rules/*.md',
            pathsWith: ['src/**', 'shared/**'],
            partitions: ['a=src/a/**,shared/**', 'b=src/b/**,shared/**'],
            mode: 'apply',
            output: path.join(cwd, 'review.md'),
            focus: 'push',
            goal: 'representative',
            cwd,
          },
          { brain: genBrainThatDrifts({ cwd, asks }) },
        );
        return { result, asks };
      } finally {
        spyErr.mockRestore();
        spyLog.mockRestore();
      }
    });

    when('[t0] the lane overflows and splits', () => {
      then('the prime and both partitions ask the brain', () => {
        expect(scene.result.outcome).toEqual('reviewed');
        expect(scene.asks.length).toEqual(3);
      });

      then(
        '🔴 the partition that grades the drifted file sends the bytes the lane settled',
        () => {
          const asksOfB = scene.asks.filter((ask) =>
            `${ask.role}${ask.prompt}`.includes('src/b/wave.ts'),
          );
          expect(asksOfB.length).toEqual(1);
          expect(`${asksOfB[0]!.role}${asksOfB[0]!.prompt}`).toContain(
            MARKER_SETTLED,
          );
        },
      );

      then('no ask sends the bytes written after the scope settled', () => {
        const asksDrifted = scene.asks.filter((ask) =>
          `${ask.role}${ask.prompt}`.includes(MARKER_DRIFTED),
        );
        expect(asksDrifted).toEqual([]);
      });
    });
  });

  /**
   * .what = a split lane whose prime spends part of the bound, and whose partition `b` never
   *         answers
   * .why = 🔴 CLAMP. each partition run once minted a fresh `msOfReviewStart`, so partition
   *        `b` got the WHOLE brain call bound again, counted from its own start — after the
   *        prime had already spent part of it. all partitions share one process under one
   *        subprocess bound, so a split lane could outlive the outer kill, which drops the
   *        merged report, the tally, and every verdict already paid for. the partitions now
   *        read the lane's one clock, so `b` times out inside the lane's bound
   */
  given(
    '[case2] a split lane whose prime spends part of the bound, and one partition that never answers',
    () => {
      const BOUND_MS = 4_000;
      const PRIME_MS = 2_500;

      const scene = useBeforeAll(async () => {
        const cwd = setOneRepoThatSplits({
          slug: 'review-partition-lane-clock',
        });
        const output = path.join(cwd, 'review.md');
        const asks: { role: string; prompt: string }[] = [];
        const atom = genBrainAtom({ slug: DEFAULT_TEST_BRAIN });
        const choice = {
          slug: atom.slug,
          spec: {
            ...atom.spec,
            gain: {
              ...atom.spec.gain,
              size: {
                ...atom.spec.gain.size,
                context: {
                  ...atom.spec.gain.size.context,
                  tokens: WINDOW_TOKENS,
                },
              },
            },
          },
          ask: async (ask: { role: unknown; prompt: string }) => {
            const text = `${JSON.stringify(ask.role)}${ask.prompt}`;
            const isPrime = asks.length === 0;
            asks.push({ role: JSON.stringify(ask.role), prompt: ask.prompt });

            // the prime spends part of the lane's bound
            if (isPrime)
              await new Promise((settle) => setTimeout(settle, PRIME_MS));

            // partition b never answers within the test; its timer is unref'd so it holds
            // no handle open past the suite
            if (!isPrime && text.includes('src/b/wave.ts'))
              await new Promise((settle) => setTimeout(settle, 60_000).unref());

            return { output: VERDICT, metrics: METRICS };
          },
        };
        const context = {
          brain: { choice },
        } as unknown as ContextBrain<BrainChoice>; // a fake reads only slug, spec, and ask

        const envPrior = process.env.RHACHET_REVIEW_TIMEOUT_MS;
        process.env.RHACHET_REVIEW_TIMEOUT_MS = String(BOUND_MS);
        const spyErr = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        const msOfStart = Date.now();
        try {
          const result: StepReviewResult = await stepReview(
            {
              rules: 'rules/*.md',
              pathsWith: ['src/**', 'shared/**'],
              partitions: ['a=src/a/**,shared/**', 'b=src/b/**,shared/**'],
              mode: 'apply',
              output,
              focus: 'push',
              goal: 'representative',
              cwd,
            },
            { brain: context },
          );
          return {
            result,
            asks,
            msElapsed: Date.now() - msOfStart,
            report: fs.existsSync(output)
              ? fs.readFileSync(output, 'utf-8')
              : null,
          };
        } finally {
          spyErr.mockRestore();
          spyLog.mockRestore();
          if (envPrior === undefined)
            delete process.env.RHACHET_REVIEW_TIMEOUT_MS;
          if (envPrior !== undefined)
            process.env.RHACHET_REVIEW_TIMEOUT_MS = envPrior;
        }
      });

      when('[t0] the lane overflows, splits, and partition b stalls', () => {
        then(
          '🔴 the lane settles inside its own bound, never a fresh bound per partition',
          () => {
            // a fresh clock for b would run PRIME_MS + BOUND_MS ≈ 6.5s
            expect(scene.msElapsed).toBeLessThan(BOUND_MS + 1_500);
          },
        );

        then(
          'the merged report is written, with the stalled partition named a timeout',
          () => {
            expect(scene.report).not.toBeNull();
            expect(scene.report).toContain('timed out');
          },
        );
      });
    },
  );
});
