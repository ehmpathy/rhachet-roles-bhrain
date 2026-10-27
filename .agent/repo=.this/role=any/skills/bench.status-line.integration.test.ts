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

/**
 * .what = runs the skill in a cwd and captures its streams and exit code
 * .why = each path drives the same entrypoint a human types
 *
 * .note = a spawn that never ran, or ended on a signal, throws with the command, cwd, and
 *         cause, so it can never read as the skill's own `exit 1 = an arm failed`
 */
const runSkill = (input: {
  args: string[];
  cwd: string | null;
}): { stdout: string; stderr: string; exitCode: number } => {
  const cwd =
    input.cwd ?? fs.realpathSync(genTempDir({ slug: 'bench-status-line' }));
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status === null)
    throw Object.assign(
      new Error(
        `bench spawn did not complete: bash ${SKILL} ${input.args.join(' ')} in ${cwd}; signal=${result.signal}`,
      ),
      { cause: result.error },
    );
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
};

/**
 * .what = a temp dir that holds a stub bash reader where the package would install it
 * .why = the bench refuses before any arm where no reader is installed, so a case that must
 *        reach an arm needs the reader path present
 */
const genTempDirWithReader = (input: { slug: string }): string => {
  const tempDir = fs.realpathSync(genTempDir({ slug: input.slug }));
  const readerPath = path.join(tempDir, PATH_OF_READER);
  fs.mkdirSync(path.dirname(readerPath), { recursive: true });
  fs.writeFileSync(readerPath, ':\n');
  return tempDir;
};
const PATH_OF_READER =
  'node_modules/rhachet-roles-bhrain/dist/domain.roles/driver/skills/route.status.line.sh';

/**
 * .what = how many arms the measure output reports a figure for
 */
const countRepaintFigures = (input: { stdout: string }): number =>
  input.stdout.match(/s cpu per repaint/g)?.length ?? 0;

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
 * .why = each is a contract surface a human meets; its text and exit code must not drift
 *        unseen. each runs in an empty temp dir, which holds no installed reader
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
  {
    slug: 'no-reader-installed',
    args: ['--runs', '1'],
    stderr: `✋ ConstraintError: no bash reader at ${PATH_OF_READER}; run bench.status-line from a repo whose installed rhachet-roles-bhrain ships route.status.line.sh`,
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

      then('it lists all twelve arms and the exit contract', () => {
        expect(ran.stdout).toContain('a legacy miss');
        expect(ran.stdout).toContain('a legacy warm');
        expect(ran.stdout).toContain('· a miss via that subpath');
        expect(ran.stdout).toContain('· the unbound glob');
        expect(ran.stdout).toContain('· bare bash');
        expect(ran.stdout).toContain('· the bash reader');
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

  given('[case7] a bench run from the gitroot, where the package resolves', () => {
    // the cache dir is shared: the node records (`branch=*.json`) and the bash reader's
    // pointers (`branch=*.route`). the miss arms must drop the first and keep the second,
    // or a bench blanks the live line of every seat in this repo
    when('[t0] the bench measures one repaint per arm', () => {
      const ran = useBeforeAll(async () => {
        const cacheDir = path.join(
          ROOT,
          '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
        );
        const pointerPath = path.join(
          cacheDir,
          'branch=bench.pointer-probe.route',
        );
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(pointerPath, 'some/route\n');

        // the planted pointer is removed on every path, so a faulted run leaves no residue
        try {
          const result = runSkill({ args: ['--runs', '1'], cwd: ROOT });
          const pointerAfter = fs.existsSync(pointerPath)
            ? fs.readFileSync(pointerPath, 'utf-8')
            : null;
          return { ...result, pointerAfter };
        } finally {
          fs.rmSync(pointerPath, { force: true });
        }
      });

      then('it exits 0, with no stderr', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stderr).toEqual('');
      });

      then('its miss arms keep the bash reader pointer the cache dir holds', () => {
        expect(ran.pointerAfter).toEqual('some/route\n');
      });

      then('it reports a figure for each of the twelve arms', () => {
        expect(countRepaintFigures({ stdout: ran.stdout })).toEqual(12);
      });

      then('the measure renders as its snapshot, figures masked', () => {
        expect(asMaskedMeasure({ stdout: ran.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case8] a bench run where an arm cannot run', () => {
    // a temp dir is no git repo, so the git spawn arm fails on its probe; a stub reader
    // passes the up-front reader check so the run reaches the arms
    when('[t0] the bench reaches the git spawn arm', () => {
      const ran = useBeforeAll(async () =>
        runSkill({
          args: ['--runs', '1'],
          cwd: genTempDirWithReader({ slug: 'bench-status-line-arm-fault' }),
        }),
      );

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
