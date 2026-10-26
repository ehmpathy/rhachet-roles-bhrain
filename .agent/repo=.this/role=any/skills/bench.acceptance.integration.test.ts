import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `bench.acceptance` skill's hermetic paths, through
 *         the entrypoint a human types
 * .why = its help, its refusals, and its compare verdict are contract surfaces a human
 *        meets; the compare verdict's exit 2 is the one gate the skill declares
 *        (rule.require.contract-snapshot-exhaustiveness)
 *
 * .note = 🔴 `run` and `gate` are out of this suite by design: each spawns the WHOLE
 *         acceptance suite (this suite among them), so a case for either would recurse and
 *         spend the suite's full wall clock per run. every case here reads only seeded json
 *         under the temp cwd, so the suite is free, fast, and needs no build
 *
 * .how = spawns the skill's own shell entrypoint in a fresh temp cwd, so the skill's
 *        cwd-relative `.log/bench.acceptance/` holds only what a case seeds
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no resolution rides the cwd. the temp cwd exists only to isolate the artifact dir
 */
const SKILL = path.join(
  __dirname,
  '../../../..',
  '.agent/repo=.this/role=any/skills/bench.acceptance.sh',
);

const genBenchCwd = (input: {
  slug: string;
  runs: Array<{ label: string; wallMs: number; cases: Record<string, string> }>;
}): string => {
  const cwd = fs.realpathSync(genTempDir({ slug: input.slug }));
  const dir = path.join(cwd, '.log', 'bench.acceptance');
  fs.mkdirSync(dir, { recursive: true });
  input.runs.map((run) =>
    fs.writeFileSync(
      path.join(dir, `${run.label}.json`),
      JSON.stringify(run, null, 2),
    ),
  );
  return cwd;
};

const runBench = (input: {
  cwd: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const mask = (text: string): string => text.split(input.cwd).join('$CWD');
  return {
    stdout: mask(result.stdout ?? ''),
    stderr: mask(result.stderr ?? ''),
    exitCode: result.status ?? 1,
  };
};

describe('bench.acceptance.integration', () => {
  given('[case1] a human who asks the bench to explain itself', () => {
    const ran = useBeforeAll(async () =>
      runBench({
        cwd: genBenchCwd({ slug: 'bench-help', runs: [] }),
        args: ['--help'],
      }),
    );

    when('[t0] --help is passed', () => {
      then('it exits 0 and names each command', () => {
        expect(ran.exitCode).toEqual(0);
        ['run', 'gate', 'report', 'compare'].map((cmd) =>
          expect(ran.stdout).toContain(`bench.acceptance.js ${cmd}`),
        );
      });

      then('the usage renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a command the bench does not know', () => {
    const ran = useBeforeAll(async () =>
      runBench({
        cwd: genBenchCwd({ slug: 'bench-unknown', runs: [] }),
        args: ['bogus'],
      }),
    );

    when('[t0] the bench is run', () => {
      then('it refuses with exit 1 and names the command', () => {
        expect(ran.exitCode).toEqual(1);
        expect(ran.stderr).toContain('unknown command "bogus"');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] a report of a label never recorded', () => {
    const ran = useBeforeAll(async () =>
      runBench({
        cwd: genBenchCwd({ slug: 'bench-report-absent', runs: [] }),
        args: ['report', '--label', 'never'],
      }),
    );

    when('[t0] the bench is run', () => {
      then('it refuses with exit 1 and names the fix', () => {
        expect(ran.exitCode).toEqual(1);
        expect(ran.stderr).toContain('no run recorded at');
        expect(ran.stderr).toContain('run --label never');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] two recorded runs where every case still passes', () => {
    const ran = useBeforeAll(async () =>
      runBench({
        cwd: genBenchCwd({
          slug: 'bench-compare-clean',
          runs: [
            { label: 'before', wallMs: 300_000, cases: { 'a > b': 'passed' } },
            { label: 'after', wallMs: 200_000, cases: { 'a > b': 'passed' } },
          ],
        }),
        args: ['compare', '--before', 'before', '--after', 'after'],
      }),
    );

    when('[t0] the runs are compared', () => {
      then('it exits 0 and reports no regression', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('no regression');
      });

      then('the verdict renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] two recorded runs where a case that passed no longer does', () => {
    const ran = useBeforeAll(async () =>
      runBench({
        cwd: genBenchCwd({
          slug: 'bench-compare-regress',
          runs: [
            {
              label: 'before',
              wallMs: 300_000,
              cases: { 'a > b': 'passed', 'a > c': 'passed' },
            },
            {
              label: 'after',
              wallMs: 200_000,
              cases: { 'a > b': 'failed' },
            },
          ],
        }),
        args: ['compare', '--before', 'before', '--after', 'after'],
      }),
    );

    when('[t0] the runs are compared', () => {
      then('🔴 it exits 2 — the one gate the bench declares', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stdout).toContain('REGRESSION');
      });

      then('the regression renders whole, lost and weaker cases named', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });
});
