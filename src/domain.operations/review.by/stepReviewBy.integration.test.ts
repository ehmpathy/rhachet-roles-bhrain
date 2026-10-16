import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from '../route/__test_assets__/genContextReviewBrainSupplyDemo';
import { stepReviewBy } from './stepReviewBy';

/**
 * .what = a per-slug canned verdict the stub `rhx` emits
 * .why = lets each case declare a deterministic outcome per rubric — without an LLM and without
 *        injecting a same-repo op. `malfunction: true` makes the stub emit output with no numeric
 *        count, so runOneReview promotes it to a malfunction (its failhide-safe path).
 */
interface StubVerdict {
  blockers?: number;
  nitpicks?: number;
  malfunction?: boolean;
}

/**
 * .what = a node stub for `rhx` that stands in for a real review subprocess
 * .why = stepReviewBy composes runOneReview DIRECTLY (rule.forbid.inject-same-repo-domain-ops —
 *        a same-repo op is imported, never injected). so the deterministic test seam is the
 *        EXTERNAL boundary runOneReview actually crosses: the subprocess. this stub, placed on
 *        the fixture's node_modules/.bin, is what runOneReview execs — the same shape the route
 *        guard's own runner hits. it reads a per-slug verdict map, records call order, and emits
 *        the reviewer-output contract (`N blockers` / `N nitpicks`) so the regex tally reads it
 *        with no brain. this is a shell stub of the boundary, not a fake of our own domain op.
 */
const STUB_RHX_SOURCE = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--output');
const outPath = outIdx >= 0 ? args[outIdx + 1] : '';
const match = outPath.match(/rubric=([^.]+)\\.md/);
const slug = match ? match[1] : 'unknown';
// record when each review starts and ends, so the test can see whether two overlapped
const logPath = path.join(process.cwd(), '.stub-order.log');
fs.appendFileSync(logPath, 'start:' + slug + '\\n');
let verdicts = {};
try {
  verdicts = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '.stub-verdicts.json'), 'utf8'),
  );
} catch (error) {
  verdicts = {};
}
const verdict = verdicts[slug] || {};
// hold the review open a moment, as a real one would, so a concurrent pour overlaps
setTimeout(() => {
  fs.appendFileSync(logPath, 'end:' + slug + '\\n');
  if (verdict.malfunction) {
    // emit a review that exits 0 but states NO numeric count → runOneReview promotes to malfunction
    process.stdout.write('the review ran but stated no verdict\\n');
    process.exit(0);
  }
  const blockers = verdict.blockers || 0;
  const nitpicks = verdict.nitpicks || 0;
  process.stdout.write(blockers + ' blockers\\n' + nitpicks + ' nitpicks\\n');
  process.exit(blockers > 0 ? 2 : 0);
}, 300);
`;

/**
 * .what = builds a temp role dir with rubrics.yml + a stub `rhx` on its node_modules/.bin
 * .why = the hermetic fixture stepReviewBy runs against. runOneReview prepends
 *        `${cwd}/node_modules/.bin` to PATH, so the stub `rhx` is what its `rhx review …` cmd
 *        resolves to — a real subprocess, no LLM, deterministic per the verdict map.
 */
const genTempRoleDir = async (input: {
  role: string;
  rubricsYml: string;
  verdictBySlug: Record<string, StubVerdict>;
}): Promise<string> => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'review-by-step-'));
  const reviewsDir = path.join(
    root,
    '.agent',
    'repo=ehmpathy',
    `role=${input.role}`,
    'briefs',
    'reviews',
  );
  await fs.mkdir(reviewsDir, { recursive: true });
  await fs.writeFile(path.join(reviewsDir, 'rubrics.yml'), input.rubricsYml);

  // write the stub `rhx` on the fixture's node_modules/.bin (what runOneReview execs)
  const binDir = path.join(root, 'node_modules', '.bin');
  await fs.mkdir(binDir, { recursive: true });
  await fs.writeFile(path.join(binDir, 'rhx'), STUB_RHX_SOURCE, {
    mode: 0o755,
  });

  // the per-slug verdict map the stub reads
  await fs.writeFile(
    path.join(root, '.stub-verdicts.json'),
    JSON.stringify(input.verdictBySlug),
  );
  return root;
};

/**
 * .what = reads the start and end events the stub `rhx` logged, in the order they landed
 * .why = an overlap between two reviews is visible only in the interleave of these events
 */
const getStubEvents = async (input: { cwd: string }): Promise<string[]> => {
  const raw = await fs
    .readFile(path.join(input.cwd, '.stub-order.log'), 'utf8')
    .catch(() => '');
  return raw.split('\n').filter((line) => line !== '');
};

/**
 * .what = the slugs the stub reviewed, sorted
 * .why = a pour starts its reviews in no fixed order; what holds is that each ran once
 */
const getStubSlugsReviewed = (input: { events: string[] }): string[] =>
  input.events
    .filter((event) => event.startsWith('start:'))
    .map((event) => event.slice('start:'.length))
    .sort();

/**
 * .what = the most reviews the stub held open at one time
 * .why = proves the rubrics poured: a serial loop never exceeds one
 */
const getStubPeakConcurrency = (input: { events: string[] }): number =>
  input.events.reduce(
    (acc, event) => {
      const open = acc.open + (event.startsWith('start:') ? 1 : -1);
      return { open, peak: Math.max(acc.peak, open) };
    },
    { open: 0, peak: 0 },
  ).peak;

const THREE_RUBRIC_YML = `
rubrics:
  - slug: r-alpha
    rules: [.agent/a.md]
  - slug: r-beta
    rules: [.agent/b.md]
  - slug: r-gamma
    rules: [.agent/c.md]
`;

describe('stepReviewBy', () => {
  given('[case1] a role with three rubrics, all clean', () => {
    const scene = useThen('the temp role exists', async () => {
      const cwd = await genTempRoleDir({
        role: 'mechanic',
        rubricsYml: THREE_RUBRIC_YML,
        verdictBySlug: {},
      });
      return { cwd };
    });

    when('[t0] review.by runs all rubrics', () => {
      const result = useThen('it resolves a result', async () =>
        stepReviewBy(
          {
            role: 'mechanic',
            cwd: scene.cwd,
            for: null,
            paths: null,
            diffs: null,
            mode: null,
            brain: null,
            output: null,
          },
          genContextReviewBrainSupplyDemo(),
        ),
      );

      // .retired = this case once asserted `it runs the three rubrics one at a time, in order`
      //            via an order-preserved call log. serial order is retired on purpose: independent
      //            rubrics now pour (rule.forbid.serial-reviews-that-could-pour), so the order of
      //            completion is no longer a contract. coverage moves to "each exactly once" plus
      //            the concurrency clamp below
      const stub = useThen('the stub events are read', async () => ({
        events: await getStubEvents({ cwd: scene.cwd }),
      }));

      then('it reviews each of the three rubrics exactly once', () => {
        expect(getStubSlugsReviewed({ events: stub.events })).toEqual([
          'r-alpha',
          'r-beta',
          'r-gamma',
        ]);
      });

      then('🔴 the rubrics pour — more than one review is open at once', () => {
        expect(getStubPeakConcurrency({ events: stub.events })).toBeGreaterThan(
          1,
        );
      });

      then('it returns a result per rubric, in declared order', () => {
        expect(result.results.map((r) => r.slug)).toEqual([
          'r-alpha',
          'r-beta',
          'r-gamma',
        ]);
      });

      then('all rubrics pass, totals are zero', () => {
        expect(result.blockersTotal).toEqual(0);
        expect(result.nitpicksTotal).toEqual(0);
        expect(
          result.results.every((r) => r.verdict.outcome === 'passed'),
        ).toBe(true);
      });
    });
  });

  given('[case2] a role where one rubric has blockers', () => {
    const scene = useThen('the temp role exists', async () => {
      const cwd = await genTempRoleDir({
        role: 'mechanic',
        rubricsYml: THREE_RUBRIC_YML,
        verdictBySlug: { 'r-beta': { blockers: 2, nitpicks: 1 } },
      });
      return { cwd };
    });

    when('[t0] review.by runs, r-beta finds blockers', () => {
      const result = useThen('it resolves a result', async () =>
        stepReviewBy(
          {
            role: 'mechanic',
            cwd: scene.cwd,
            for: null,
            paths: null,
            diffs: null,
            mode: null,
            brain: null,
            output: null,
          },
          genContextReviewBrainSupplyDemo(),
        ),
      );

      then('it collects the counts across rubrics', () => {
        expect(result.blockersTotal).toEqual(2);
        expect(result.nitpicksTotal).toEqual(1);
      });

      then('the rubric with blockers is marked rejected', () => {
        const beta = result.results.find((r) => r.slug === 'r-beta');
        expect(beta?.verdict.outcome).toEqual('rejected');
      });

      then('the clean rubrics still pass', () => {
        const alpha = result.results.find((r) => r.slug === 'r-alpha');
        expect(alpha?.verdict.outcome).toEqual('passed');
      });
    });
  });

  given('[case3] a --for filter', () => {
    const scene = useThen('the temp role exists', async () => {
      const cwd = await genTempRoleDir({
        role: 'mechanic',
        rubricsYml: THREE_RUBRIC_YML,
        verdictBySlug: {},
      });
      return { cwd };
    });

    when('[t0] review.by --for r-beta runs', () => {
      const result = useThen('it resolves a result', async () =>
        stepReviewBy(
          {
            role: 'mechanic',
            cwd: scene.cwd,
            for: 'r-beta',
            paths: null,
            diffs: null,
            mode: null,
            brain: null,
            output: null,
          },
          genContextReviewBrainSupplyDemo(),
        ),
      );

      then('only that one rubric runs', async () => {
        expect(
          getStubSlugsReviewed({
            events: await getStubEvents({ cwd: scene.cwd }),
          }),
        ).toEqual(['r-beta']);
        expect(result.results.map((r) => r.slug)).toEqual(['r-beta']);
      });

      then('the result echoes --for', () => {
        expect(result.for).toEqual('r-beta');
      });
    });
  });

  given('[case4] a --for slug that does not exist', () => {
    const scene = useThen('the temp role exists', async () => {
      const cwd = await genTempRoleDir({
        role: 'mechanic',
        rubricsYml: THREE_RUBRIC_YML,
        verdictBySlug: {},
      });
      return { cwd };
    });

    when('[t0] review.by --for nonexistent runs', () => {
      then('it throws rubric-not-found', async () => {
        let message = '';
        try {
          await stepReviewBy(
            {
              role: 'mechanic',
              cwd: scene.cwd,
              for: 'nonexistent',
              paths: null,
              diffs: null,
              mode: null,
              brain: null,
              output: null,
            },
            genContextReviewBrainSupplyDemo(),
          );
        } catch (error) {
          message = error instanceof Error ? error.message : String(error);
        }
        expect(message).toContain('rubric not found: nonexistent');
      });
    });
  });

  given('[case5] a rubric that malfunctions (no verdict)', () => {
    const scene = useThen('the temp role exists', async () => {
      const cwd = await genTempRoleDir({
        role: 'mechanic',
        rubricsYml: THREE_RUBRIC_YML,
        verdictBySlug: { 'r-gamma': { malfunction: true } },
      });
      return { cwd };
    });

    when('[t0] review.by runs, r-gamma has no verdict', () => {
      const result = useThen('it resolves a result', async () =>
        stepReviewBy(
          {
            role: 'mechanic',
            cwd: scene.cwd,
            for: null,
            paths: null,
            diffs: null,
            mode: null,
            brain: null,
            output: null,
          },
          genContextReviewBrainSupplyDemo(),
        ),
      );

      then('the rubric is marked malfunctioned, not a clean 0/0', () => {
        const gamma = result.results.find((r) => r.slug === 'r-gamma');
        expect(gamma?.verdict.outcome).toEqual('malfunctioned');
        // the reason still names a malfunction (the prior intent); it now states the cause
        // the runner wrote, behind its error class header, rather than a generic phrase
        expect(gamma?.verdict.reason).toMatch(/malfunction/i);
        expect(gamma?.verdict.reason).toContain('💥 MalfunctionError:');
      });

      then('the other rubrics still run', async () => {
        expect(
          getStubSlugsReviewed({
            events: await getStubEvents({ cwd: scene.cwd }),
          }),
        ).toEqual(['r-alpha', 'r-beta', 'r-gamma']);
      });
    });
  });
});
