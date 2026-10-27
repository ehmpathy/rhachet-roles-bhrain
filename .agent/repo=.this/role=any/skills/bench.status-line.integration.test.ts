import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `bench.status-line` skill's hermetic paths, through
 *         the entrypoint a human types
 * .why = its help and each refusal are contract surfaces a human meets; each is clamped and
 *        snapped so drift in the text or the exit code is visible in review
 *
 * .note = the measure path runs once per arm (`--runs 1`) from the gitroot, where the
 *         package resolves by its own name. its cpu figures are noise on a shared box, so
 *         they are masked; the arm set, the order, and the tree are snapped
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no resolution rides the cwd. the refusals and the arm fault run
 *         in a temp dir, which holds no git repo and no package
 */
const ROOT = path.join(__dirname, '../../../..');
const SKILL = path.join(
  ROOT,
  '.agent/repo=.this/role=any/skills/bench.status-line.sh',
);

const runSkill = (input: {
  args: string[];
  cwd: string | null;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd:
      input.cwd ?? fs.realpathSync(genTempDir({ slug: 'bench-status-line' })),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = the measure output with its volatile bytes masked
 * .why = cpu seconds vary per box and per run; the cwd is a per-host path
 */
const asMaskedMeasure = (input: { stdout: string }): string =>
  input.stdout
    .replace(/\d+\.\d{3}s cpu/g, '<cpu>s cpu')
    .replace(/cwd = \S+/g, 'cwd = <gitroot>');

/**
 * .what = the refusals the skill owes before any arm runs, one per row
 */
const REFUSALS: { slug: string; args: string[]; stderr: string }[] = [
  {
    slug: 'unknown-arg',
    args: ['--bogus'],
    stderr: "✋ ConstraintError: unknown arg '--bogus'",
  },
  {
    slug: 'runs-without-value',
    args: ['--runs'],
    stderr: '✋ ConstraintError: --runs needs a value',
  },
  {
    slug: 'runs-not-an-integer',
    args: ['--runs', 'many'],
    stderr: '✋ ConstraintError: --runs must be a positive integer',
  },
  {
    slug: 'runs-zero',
    args: ['--runs', '0'],
    stderr: '✋ ConstraintError: --runs must be a positive integer',
  },
];

describe('bench.status-line.integration', () => {
  given('[case1] a human who asks the bench to explain itself', () => {
    const ran = useBeforeAll(async () => runSkill({ args: ['--help'], cwd: null }));

    when('[t0] --help is passed', () => {
      then('it exits 0 and names the usage', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('rhx bench.status-line --runs');
      });

      then('it lists all ten arms and the exit contract', () => {
        expect(ran.stdout).toContain('a legacy miss');
        expect(ran.stdout).toContain('a legacy warm');
        expect(ran.stdout).toContain('· a miss via that subpath');
        expect(ran.stdout).toContain('· the unbound glob');
        expect(ran.stdout).toContain('exit 0 = measured, exit 1 = an arm failed, exit 2 = bad input');
      });

      then('the usage renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  REFUSALS.map((refusal, index) =>
    given(`[case${index + 2}] a call refused for ${refusal.slug}`, () => {
      const ran = useBeforeAll(async () => runSkill({ args: refusal.args, cwd: null }));

      when(`[t0] the bench runs with ${refusal.args.join(' ')}`, () => {
        then('it exits 2 with the constraint, and writes no stdout', () => {
          expect(ran.exitCode).toEqual(2);
          expect(ran.stderr.trim()).toEqual(refusal.stderr);
          expect(ran.stdout).toEqual('');
        });

        then('the refusal matches its snapshot', () => {
          expect(ran.stderr).toMatchSnapshot();
        });
      });
    }),
  );

  given('[case6] a bench run from the gitroot, where the package resolves', () => {
    const ran = useBeforeAll(async () =>
      runSkill({ args: ['--runs', '1'], cwd: ROOT }),
    );

    when('[t0] the bench measures one repaint per arm', () => {
      then('it exits 0, with no stderr', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stderr).toEqual('');
      });

      then('it reports a figure for each of the ten arms', () => {
        expect(ran.stdout.match(/s cpu per repaint/g)?.length).toEqual(10);
      });

      then('the measure renders as its snapshot, figures masked', () => {
        expect(asMaskedMeasure({ stdout: ran.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a bench run where an arm cannot run', () => {
    // a temp dir is no git repo, so the git spawn arm fails on its probe
    const ran = useBeforeAll(async () => runSkill({ args: ['--runs', '1'], cwd: null }),
    );

    when('[t0] the bench reaches the git spawn arm', () => {
      then('it exits 1 with the qualified arm fault', () => {
        expect(ran.exitCode).toEqual(1);
        expect(ran.stderr).toContain(
          "💥 MalfunctionError: the 'git spawn' arm failed; its stderr is above",
        );
      });

      then('the fault row matches its snapshot', () => {
        // node's own stack precedes the row, with a pid and a node version; the row is the
        // contract this skill owns
        expect(
          ran.stderr
            .split('\n')
            .filter((line) => line.startsWith('💥'))
            .join('\n'),
        ).toMatchSnapshot();
      });
    });
  });
});
