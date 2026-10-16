import * as path from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';
import { asRedactedOutput } from './.test/asRedactedOutput';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = a brain slug no provider registers, so a boot of it refuses
 * .why = a flag refusal that must fire before boot is proven by a brain that cannot boot
 */
const BRAIN_UNBOOTABLE = 'nonesuch/nonesuch/tier';

/**
 * .what = a temp repo cloned from the mechanic fixture, with the reviewer role linked
 */
const genRepoLinked = async (input: { slug: string }): Promise<string> => {
  const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
  await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });
  return tempDir;
};

/**
 * .what = acceptance tests for `rhx review --partition`, via the shell entrypoint
 * .why = a partition is declared by the caller and checked before any brain is called
 *        (seed S44). what only the spawned skill can show is that a driver can PREVIEW a
 *        split (`--mode plan`), and that a declaration which would review less than asked —
 *        a target in no partition, a value that does not parse — refuses loud, exit 2
 *
 * .note = zero brain calls. plan mode returns before compile, and each refusal fires
 *         ahead of it; the bound-route refusal is clamped at the unit grain
 *         (`asReviewPartitionRefusal`), since a bound route needs a full route fixture
 */
describe('review.partition.acceptance', () => {
  given('[case1] two partitions that share the behavior spec', () => {
    when('[t0] the split is previewed with --mode plan', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({ slug: 'review-partition-plan' });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: '{src,behavior}/**',
          output: path.join(tempDir, 'review.md'),
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          partition: [
            'clean={src/clean.ts,behavior/**}',
            'dirty={src/dirty.ts,behavior/**}',
          ],
          mode: 'plan',
          cwd: tempDir,
        });
      });

      then('it exits 0 — a plan spends naught', () => {
        expect(res.code).toEqual(0);
      });

      then('the plan names common and narrow as peer branches', () => {
        expect(res.stdout).toContain('split into 2 partitions (plan)');
        expect(res.stdout).toContain('├─ common');
        expect(res.stdout).toContain('├─ narrow');
      });

      then('the shared glob is shown under common, verbatim', () => {
        expect(res.stdout).toContain('behavior/**');
      });

      then('each slug shows its globs and its cost', () => {
        expect(res.stdout).toContain('clean');
        expect(res.stdout).toContain('src/dirty.ts');
        expect(res.stdout).toContain('total:');
        expect(res.stdout).toContain('unclaimed: 0');
      });

      then('no blockers/nitpicks tally is printed — no review ran', () => {
        expect(res.stdout).not.toMatch(/\d+ blockers?/);
      });

      then('the plan renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a target that sits in no partition', () => {
    when('[t0] the review is invoked', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({
          slug: 'review-partition-unclaimed',
        });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/**/*.ts',
          output: path.join(tempDir, 'review.md'),
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          partition: ['clean=src/clean.ts'],
          mode: 'plan',
          cwd: tempDir,
        });
      });

      then('🔴 it refuses as a constraint, exit 2, before any brain call', () => {
        expect(res.code).toEqual(2);
      });

      then('the refusal names the target and the fix', () => {
        expect(res.stderr).toContain('1 target sits in no partition');
        expect(res.stderr).toContain('src/dirty.ts');
        // the repair proposes the narrowest glob that covers the file, never a bare
        // top-level `src/**`, which would sweep a whole layer into one partition
        // ...and the snapshot arm, so the snapshot a test of that stem writes rides along
        expect(res.stderr).toContain(
          'src/dirty.ts → clean (+ src/{,__snapshots__/}dirty.*)',
        );
        // the repair hands only the flag to append — flags of one slug merge, so the
        // caller adds one line rather than re-types the brace
        expect(res.stderr).toContain(
          "--partition 'clean=src/{,__snapshots__/}dirty.*'",
        );
        expect(res.stderr).not.toContain('clean={src/clean.ts,src/dirty.*}');
      });

      then('the refusal renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case3] a declaration that does not parse', () => {
    when('[t0] the review is invoked', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({
          slug: 'review-partition-malformed',
        });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/**/*.ts',
          output: path.join(tempDir, 'review.md'),
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          partition: ['src/**'],
          cwd: tempDir,
        });
      });

      then('🔴 it refuses as a constraint, exit 2', () => {
        expect(res.code).toEqual(2);
      });

      then('the refusal names the form that would parse', () => {
        expect(res.stderr).toContain("'<slug>=<globs>'");
      });

      then('the refusal renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] a driver reads --help for the lever', () => {
    when('[t0] help is printed', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({ slug: 'review-partition-help' });
        const skillPath = path.join(
          tempDir,
          '.agent/repo=bhrain/role=reviewer/skills/review.sh',
        );
        return execAsync(`bash "${skillPath}" --help`, { cwd: tempDir });
      });

      then('🔴 the flag and the plan mode are named, so the lever can be found', () => {
        expect(res.stdout).toContain("--partition '<slug>=<globs>'");
        expect(res.stdout).toContain('--mode plan');
      });

      // .note = execAsync rejects on a nonzero exit, so a resolved `res` IS exit 0
      then('the help renders whole', () => {
        expect(asRedactedOutput(res.stdout)).toMatchSnapshot('help');
      });
    });
  });

  /**
   * .note = cases 5 and 6 name a brain that cannot boot. a refusal that fires before boot
   *         reads as its own; one that fires after reads as the brain's, so the order is
   *         observable — and a regression to the old order spends naught to show itself
   */
  given('[case5] --mode plan with no partition declared', () => {
    when('[t0] the review is invoked', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({
          slug: 'review-partition-plan-none',
        });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/**/*.ts',
          output: path.join(tempDir, 'review.md'),
          brain: BRAIN_UNBOOTABLE,
          mode: 'plan',
          cwd: tempDir,
        });
      });

      then('🔴 it refuses as a constraint, exit 2', () => {
        expect(res.code).toEqual(2);
      });

      then('🔴 the refusal fires before any brain boot', () => {
        expect(res.stderr).toContain(
          '✋ ConstraintError: --mode plan previews a partition split, and none is declared',
        );
        expect(res.stderr).not.toContain('--brain');
      });

      then('the refusal names the flag that declares one', () => {
        expect(res.stderr).toContain(
          "declare one or more with --partition '<slug>=<globs>'",
        );
      });

      then('the refusal renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] a typo of --mode plan', () => {
    when('[t0] the review is invoked', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({
          slug: 'review-partition-mode-typo',
        });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/**/*.ts',
          output: path.join(tempDir, 'review.md'),
          brain: BRAIN_UNBOOTABLE,
          partition: ['clean=src/**'],
          mode: 'plna',
          cwd: tempDir,
        });
      });

      then('🔴 it refuses as a constraint, exit 2, never a paid review', () => {
        expect(res.code).toEqual(2);
        expect(res.stdout).not.toMatch(/\d+ blockers?/);
      });

      then('🔴 the refusal names the typo and the values accepted', () => {
        expect(res.stderr).toContain(
          '✋ ConstraintError: --mode must be plan, hard, or soft (received: plna)',
        );
        expect(res.stderr).not.toContain('--brain');
      });

      then('the hint points at the --mode row, which explains every value', () => {
        expect(res.stderr).toContain('run with --help for --mode');
        expect(res.stderr).not.toContain('run with --help for --mode plan');
      });

      then('the refusal renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case7] --mode plan beside a second, paid --mode', () => {
    when('[t0] the review is invoked', () => {
      const res = useBeforeAll(async () => {
        const tempDir = await genRepoLinked({
          slug: 'review-partition-mode-repeat',
        });
        return invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/**/*.ts',
          output: path.join(tempDir, 'review.md'),
          brain: BRAIN_UNBOOTABLE,
          partition: ['clean=src/**'],
          // .note = the helper spells `--mode ${mode}` unquoted, so one value types two
          //         flags: argv reads `--mode plan --mode hard`
          mode: 'plan --mode hard',
          cwd: tempDir,
        });
      });

      then('🔴 it refuses as a constraint, exit 2, never a paid review', () => {
        expect(res.code).toEqual(2);
        expect(res.stdout).not.toMatch(/\d+ blockers?/);
      });

      then('🔴 the refusal names both values, before any brain boot', () => {
        expect(res.stderr).toContain(
          '✋ ConstraintError: --mode given more than once with different values: plan, hard',
        );
        expect(res.stderr).not.toContain('--brain');
      });

      then('the refusal renders as the driver reads it', () => {
        expect(asRedactedOutput(res.stderr)).toMatchSnapshot();
      });
    });
  });
});
