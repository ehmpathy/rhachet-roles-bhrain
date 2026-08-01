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
// record call order so the test can assert the serial sequence
fs.appendFileSync(path.join(process.cwd(), '.stub-order.log'), slug + '\\n');
let verdicts = {};
try {
  verdicts = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '.stub-verdicts.json'), 'utf8'),
  );
} catch (error) {
  verdicts = {};
}
const verdict = verdicts[slug] || {};
if (verdict.malfunction) {
  // emit a review that exits 0 but states NO numeric count → runOneReview promotes to malfunction
  process.stdout.write('the review ran but stated no verdict\\n');
  process.exit(0);
}
const blockers = verdict.blockers || 0;
const nitpicks = verdict.nitpicks || 0;
process.stdout.write(blockers + ' blockers\\n' + nitpicks + ' nitpicks\\n');
process.exit(blockers > 0 ? 2 : 0);
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
 * .what = reads the order the stub `rhx` was called in
 * .why = proves stepReviewBy ran the rubrics one at a time, in declared order (serial).
 */
const getStubCallOrder = async (input: { cwd: string }): Promise<string[]> => {
  const raw = await fs
    .readFile(path.join(input.cwd, '.stub-order.log'), 'utf8')
    .catch(() => '');
  return raw.split('\n').filter((line) => line !== '');
};

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

      then('it runs the three rubrics one at a time, in order', async () => {
        expect(await getStubCallOrder({ cwd: scene.cwd })).toEqual([
          'r-alpha',
          'r-beta',
          'r-gamma',
        ]);
      });

      then('it returns a result per rubric', () => {
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
        expect(await getStubCallOrder({ cwd: scene.cwd })).toEqual(['r-beta']);
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
        expect(gamma?.verdict.reason).toContain('malfunction');
      });

      then('the other rubrics still run', async () => {
        expect(await getStubCallOrder({ cwd: scene.cwd })).toEqual([
          'r-alpha',
          'r-beta',
          'r-gamma',
        ]);
      });
    });
  });
});
