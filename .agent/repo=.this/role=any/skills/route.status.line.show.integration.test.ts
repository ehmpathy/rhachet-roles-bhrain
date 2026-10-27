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
const ROOT = path.join(__dirname, '../../../..');
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

describe('route.status.line.show.integration', () => {
  given('[case1] a human who asks the skill to explain itself', () => {
    when('[t0] --help is passed', () => {
      const ran = useBeforeAll(async () =>
        runSkill({ args: ['--help'], cwd: null }),
      );

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
      when(`[t0] the skill runs with ${refusal.args.join(' ')}`, () => {
        const ran = useBeforeAll(async () =>
          runSkill({ args: refusal.args, cwd: null }),
        );

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
    when('[t0] the cold repaint runs with the cache dropped', () => {
      const cold = useBeforeAll(async () =>
        runSkill({ args: ['--unbound', '--drop'], cwd: ROOT }),
      );

      then('it exits 0, with no stderr, and reads as a miss', () => {
        expect(cold.exitCode).toEqual(0);
        expect(cold.stderr).toEqual('');
        expect(cold.stdout).toContain('├─ cache = miss');
        expect(cold.stdout).toContain('└─ stderr = (none)');
      });

      then('it prints the line an unbound seat owes: a blank one', () => {
        expect(cold.stdout).toContain('├─ stdout = (blank line)');
        expect(asLineRows({ stdout: cold.stdout })).toEqual([]);
      });

      then('the repaint renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: cold.stdout })).toMatchSnapshot();
      });
    });

    // t1 runs after t0 in collection order, so the warm repaint reads what the cold one wrote
    when('[t1] the warm repaint runs over the cache the cold one wrote', () => {
      const warm = useBeforeAll(async () =>
        runSkill({ args: ['--unbound'], cwd: ROOT }),
      );

      then('it exits 0 and reads as a hit', () => {
        expect(warm.exitCode).toEqual(0);
        expect(warm.stdout).toContain('├─ cache = hit');
      });

      then('it prints the blank line an unbound seat owes, as the cold one did', () => {
        expect(warm.stdout).toContain('├─ stdout = (blank line)');
        expect(asLineRows({ stdout: warm.stdout })).toEqual([]);
      });

      then('the warm repaint renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: warm.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case10] a seat whose cache dir holds a bash reader pointer', () => {
    // the dir is shared: the node records (`branch=*.json`) and the bash reader's
    // pointers (`branch=*.route`). a cold start must drop the first and keep the second.
    // the repaint itself is the node entry's own (an instrument run, the seat unbound), so
    // its blank line is the unbound line; the pointer is the subject, not the line
    const scene = useBeforeAll(async () => {
      runSkill({ args: ['--unbound'], cwd: ROOT });
      const cacheDir = path.join(
        ROOT,
        '.scratch/route.status.line.show/unbound-seat/.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      const pointerPath = path.join(cacheDir, 'branch=walk.unbound-seat.route');
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(pointerPath, 'some/route\n');
      return { pointerPath };
    });

    // the planted pointer is removed on every path, so a faulted run leaves no residue
    afterAll(() => fs.rmSync(scene.pointerPath, { force: true }));

    when('[t0] the repaint runs with the cache dropped', () => {
      const ran = useBeforeAll(async () => {
        const cold = runSkill({ args: ['--unbound', '--drop'], cwd: ROOT });
        const pointerAfter = fs.existsSync(scene.pointerPath)
          ? fs.readFileSync(scene.pointerPath, 'utf-8')
          : null;
        return { cold, pointerAfter };
      });

      then('it drops the node record: the repaint reads as a miss', () => {
        expect(ran.cold.exitCode).toEqual(0);
        expect(ran.cold.stderr).toEqual('');
        expect(ran.cold.stdout).toContain('├─ cache = miss');
      });

      then('the bash reader pointer survives the drop', () => {
        expect(ran.pointerAfter).toEqual('some/route\n');
      });

      then('the repaint renders as its snapshot, volatile bytes masked', () => {
        expect(asMaskedRepaint({ stdout: ran.cold.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case9] an unmigrated seat, repainted through the legacy export', () => {
    // the legacy cli/route forwards to the cached entry, so a cold call writes the cache
    when('[t0] the cold legacy repaint runs with the cache dropped', () => {
      const cold = useBeforeAll(async () =>
        runSkill({
          args: ['--unbound', '--drop', '--via', 'legacy'],
          cwd: ROOT,
        }),
      );

      then('it names the legacy export, exits 0, and reads as a miss', () => {
        expect(cold.exitCode).toEqual(0);
        expect(cold.stderr).toEqual('');
        expect(cold.stdout).toContain(
          '├─ via = rhachet-roles-bhrain/cli/route\n',
        );
        expect(cold.stdout).toContain('├─ cache = miss');
        expect(cold.stdout).toContain('└─ stderr = (none)');
      });

      then('the legacy repaint renders as its snapshot', () => {
        expect(asMaskedRepaint({ stdout: cold.stdout })).toMatchSnapshot();
      });
    });

    // t1 runs after t0 in collection order, so the warm repaint reads the cache t0 wrote
    when('[t1] the warm legacy repaint runs over the cache it wrote', () => {
      const warm = useBeforeAll(async () =>
        runSkill({
          args: ['--unbound', '--via', 'legacy'],
          cwd: ROOT,
        }),
      );

      then('it reads as a hit, the same as the subpath', () => {
        expect(warm.exitCode).toEqual(0);
        expect(warm.stderr).toEqual('');
        expect(warm.stdout).toContain('├─ cache = hit');
      });

      then('the warm legacy repaint renders as its snapshot', () => {
        expect(asMaskedRepaint({ stdout: warm.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case8] an arg passed through to the status line itself', () => {
    when('[t0] the repaint runs with --line-arg --help', () => {
      const ran = useBeforeAll(async () =>
        runSkill({ args: ['--unbound', '--line-arg', '--help'], cwd: ROOT }),
      );

      then('it names the arg it passed, and claims no hit', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stderr).toEqual('');
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
    when('[t0] the repaint runs', () => {
      const ran = useBeforeAll(async () => runSkill({ args: [], cwd: null }));

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
