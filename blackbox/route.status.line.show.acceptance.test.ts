import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `route.status.line.show` skill, through the entrypoint a
 *         human types
 * .why = it is the instrument a verification pastes to prove a repaint hit or missed; a hit it
 *        misreports would prove a false claim, so its hit/miss verdict is clamped and snapped
 *
 * .note = the repaint cases run `--unbound` from the gitroot, where node finds the package by
 *         its own name. the skill builds its own unbound seat under `.scratch/` (gitignored), so
 *         no live seat's cache is touched. the cpu figure and the cwd are masked
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no lookup rides the cwd. the refusals and the repaint fault run in a
 *         temp dir, which holds no package
 */
const ROOT = path.join(__dirname, '..');
const SKILL = path.join(
  ROOT,
  '.agent/repo=.this/role=any/skills/route.status.line.show.sh',
);

const runSkill = (input: {
  args: string[];
  cwd: string | null;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd:
      input.cwd ??
      fs.realpathSync(genTempDir({ slug: 'route-status-line-show' })),
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
 * .what = the repaint output with its volatile bytes masked
 * .why = cpu seconds vary per box and per run; the cwd is a per-host path
 */
const asMaskedRepaint = (input: { stdout: string }): string =>
  input.stdout
    .replace(/cpu = \d+\.\d{3}s/g, 'cpu = <cpu>s')
    .replace(/^ {3}├─ cwd = \S+$/gm, '   ├─ cwd = <seat>');

/**
 * .what = a faulted repaint with its host bytes masked, its stderr cut to the error row
 * .why = node's stack names host paths and its own version; the tree and the error code are
 *        the contract
 */
const asMaskedFault = (input: { stdout: string }): string => {
  const rows = asMaskedRepaint(input).split('\n');
  const stderrAt = rows.findIndex((row) => row.startsWith('   └─ stderr'));
  const errorRow = rows
    .slice(stderrAt + 1)
    .find((row) => row.includes('Error [ERR_MODULE_NOT_FOUND]'));
  return [
    ...rows.slice(0, stderrAt + 3),
    (errorRow ?? '')
      .replace(/'[^']*'/g, "'<path>'")
      .replace(/imported from \S+/, 'imported from <seat>'),
    '      │',
    '      └─',
  ].join('\n');
};

/**
 * .what = the line rows of a repaint, the part a seat would show
 */
const asLineRows = (input: { stdout: string }): string[] =>
  input.stdout
    .split('\n')
    .filter((row) => row.startsWith('   │  │  '))
    .map((row) => row.slice('   │  │  '.length));

/**
 * .what = the refusals the skill owes before any repaint runs, one per row
 */
const REFUSALS: { slug: string; args: string[]; stderr: string }[] = [
  {
    slug: 'unknown-arg',
    args: ['--bogus'],
    stderr: "✋ ConstraintError: unknown arg '--bogus'",
  },
  {
    slug: 'via-without-value',
    args: ['--via'],
    stderr: '✋ ConstraintError: --via must be subpath or legacy',
  },
  {
    slug: 'via-unknown',
    args: ['--via', 'barrel'],
    stderr: '✋ ConstraintError: --via must be subpath or legacy',
  },
  {
    slug: 'line-arg-without-value',
    args: ['--line-arg'],
    stderr: '✋ ConstraintError: --line-arg needs a value',
  },
];

describe('route.status.line.show.acceptance', () => {
  given('[case1] a human who asks the skill to explain itself', () => {
    const ran = useBeforeAll(async () =>
      runSkill({ args: ['--help'], cwd: null }),
    );

    when('[t0] --help is passed', () => {
      then('it exits 0 and names each usage', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('rhx route.status.line.show --drop');
        expect(ran.stdout).toContain('rhx route.status.line.show --via legacy');
        expect(ran.stdout).toContain('rhx route.status.line.show --unbound');
      });

      then('it ends at the exit contract, with no code below it', () => {
        expect(ran.stdout).toContain(
          'exit 0 = shown, exit 1 = the repaint itself failed, exit 2 = bad input',
        );
        expect(ran.stdout).not.toContain('set -euo pipefail');
      });

      then('the usage renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  REFUSALS.map((refusal, index) =>
    given(`[case${index + 2}] a call refused for ${refusal.slug}`, () => {
      const ran = useBeforeAll(async () =>
        runSkill({ args: refusal.args, cwd: null }),
      );

      when(`[t0] the skill runs with ${refusal.args.join(' ')}`, () => {
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

  given('[case6] an unbound seat, repainted cold and then warm', () => {
    // one useBeforeAll runs both, in order: the warm repaint reads what the cold one wrote
    const ran = useBeforeAll(async () => {
      const cold = runSkill({ args: ['--unbound', '--drop'], cwd: ROOT });
      const warm = runSkill({ args: ['--unbound'], cwd: ROOT });
      return { cold, warm };
    });

    when('[t0] the cold repaint runs with the cache dropped', () => {
      then('it exits 0, with no stderr, and reads as a miss', () => {
        expect(ran.cold.exitCode).toEqual(0);
        expect(ran.cold.stderr).toEqual('');
        expect(ran.cold.stdout).toContain('├─ cache = miss');
        expect(ran.cold.stdout).toContain('└─ stderr = (none)');
      });

      then('the repaint renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: ran.cold.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] the warm repaint runs over the cache the cold one wrote', () => {
      then('it exits 0 and reads as a hit', () => {
        expect(ran.warm.exitCode).toEqual(0);
        expect(ran.warm.stdout).toContain('├─ cache = hit');
      });

      then('it prints the same line the cold repaint printed', () => {
        expect(ran.warm.stdout).toContain('├─ stdout = (blank line)');
        expect(asLineRows({ stdout: ran.warm.stdout })).toEqual(
          asLineRows({ stdout: ran.cold.stdout }),
        );
      });

      then('the warm repaint renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: ran.warm.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case9] an unmigrated seat, repainted through the legacy export', () => {
    // the legacy cli/route forwards to the cached entry, so a cold call writes the cache
    const ran = useBeforeAll(async () => {
      const cold = runSkill({
        args: ['--unbound', '--drop', '--via', 'legacy'],
        cwd: ROOT,
      });
      const warm = runSkill({
        args: ['--unbound', '--via', 'legacy'],
        cwd: ROOT,
      });
      return { cold, warm };
    });

    when('[t0] the cold legacy repaint runs with the cache dropped', () => {
      then('it names the legacy export, exits 0, and reads as a miss', () => {
        expect(ran.cold.exitCode).toEqual(0);
        expect(ran.cold.stdout).toContain(
          '├─ via = rhachet-roles-bhrain/cli/route\n',
        );
        expect(ran.cold.stdout).toContain('├─ cache = miss');
        expect(ran.cold.stdout).toContain('└─ stderr = (none)');
      });

      then('the legacy repaint renders as its snapshot', () => {
        expect(asMaskedRepaint({ stdout: ran.cold.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] the warm legacy repaint runs over the cache it wrote', () => {
      then('it reads as a hit, the same as the subpath', () => {
        expect(ran.warm.exitCode).toEqual(0);
        expect(ran.warm.stdout).toContain('├─ cache = hit');
      });

      then('the warm legacy repaint renders as its snapshot', () => {
        expect(asMaskedRepaint({ stdout: ran.warm.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case8] an arg passed through to the status line itself', () => {
    const ran = useBeforeAll(async () =>
      runSkill({ args: ['--unbound', '--line-arg', '--help'], cwd: ROOT }),
    );

    when('[t0] the repaint runs with --line-arg --help', () => {
      then('it names the arg it passed, and claims no hit', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('├─ line args = --help');
        expect(ran.stdout).toContain('├─ cache = untouched');
      });

      then('the status line prints its own help, cache section included', () => {
        expect(ran.stdout).toContain('\n   │  │  cache:');
        expect(ran.stdout).toContain('cli/route.status.line');
      });

      then('the pass-through run renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: ran.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a repaint where node cannot find the package', () => {
    // a temp dir holds no node_modules, so the import faults
    const ran = useBeforeAll(async () => runSkill({ args: [], cwd: null }));

    when('[t0] the repaint runs', () => {
      then('it exits 1 and shows the fault on its stderr branch', () => {
        expect(ran.exitCode).toEqual(1);
        expect(ran.stdout).toContain('├─ exit = 1');
        expect(ran.stdout).toContain('└─ stderr');
        expect(ran.stdout).toContain('ERR_MODULE_NOT_FOUND');
      });

      then('it claims no hit or miss, since the cache was never reached', () => {
        expect(ran.stdout).toContain('├─ cache = (not reached)');
        expect(ran.stdout).not.toContain('├─ cache = miss');
      });

      then('it ends with a qualified malfunction row and the fix', () => {
        expect(ran.stderr).toContain('💥 MalfunctionError: the repaint exited 1');
        expect(ran.stderr).toContain('npm run build, or pnpm install');
      });

      then('the fault renders as its snapshot, host bytes masked', () => {
        expect(asMaskedFault({ stdout: ran.stdout })).toMatchSnapshot();
      });

      then('the malfunction row renders as its snapshot', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });
});
