import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `settings.permissions.diff` skill, through the
 *         entrypoint a human types
 * .why = its help, each refusal, and its set diff are contract surfaces a reviewer reads to
 *        decide whether a regenerated settings file widened its permissions
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no resolution rides the cwd. each case runs in its own temp git
 *         repo, so the revs it reads are hermetic
 */
const ROOT = path.join(__dirname, '..');
const SKILL = path.join(
  ROOT,
  '.agent/repo=.this/role=any/skills/settings.permissions.diff.sh',
);

const runSkill = (input: {
  args: string[];
  cwd: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd: input.cwd,
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
 * .what = a temp git repo whose one settings file is committed, then reordered and narrowed
 * .why = the shape a `roles link` regen leaves: many lines moved, one entry changed
 */
const genRepoWithRegen = (): { tempDir: string } => {
  const tempDir = fs.realpathSync(
    genTempDir({ slug: 'settings-permissions-diff', git: true }),
  );
  const settingsPath = path.join(tempDir, 'settings.json');
  fs.writeFileSync(
    settingsPath,
    JSON.stringify({
      permissions: {
        allow: ['Bash(ls:*)', 'Bash(cat:*)', 'Write(.route/**)'],
        deny: ['Bash(rm:*)'],
      },
      hooks: { a: 1 },
    }),
  );
  execSync('git add settings.json && git commit -m before --no-verify', {
    cwd: tempDir,
  });
  fs.writeFileSync(
    settingsPath,
    JSON.stringify({
      permissions: {
        allow: ['Bash(cat:*)', 'Bash(ls:*)'],
        deny: ['Edit(.route/**)', 'Bash(rm:*)'],
      },
      hooks: { a: 1 },
    }),
  );
  return { tempDir };
};

describe('settings.permissions.diff.acceptance', () => {
  given('[case1] the help is asked for', () => {
    const scene = useBeforeAll(async () => genRepoWithRegen());

    when('[t0] --help runs', () => {
      const out = useBeforeAll(async () =>
        runSkill({ args: ['--help'], cwd: scene.tempDir }),
      );

      then('it prints the usage and exits 0', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('rhx settings.permissions.diff --of');
      });

      then('the help matches its snapshot', () => {
        expect(out.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a required input is absent or unknown', () => {
    const scene = useBeforeAll(async () => genRepoWithRegen());
    const REFUSALS: { slug: string; args: string[]; stderr: string }[] = [
      {
        slug: 'no --of',
        args: ['--from', 'HEAD'],
        stderr: '✋ ConstraintError: --of <path> is required',
      },
      {
        slug: 'no --from',
        args: ['--of', 'settings.json'],
        stderr: '✋ ConstraintError: --from <rev> is required',
      },
      {
        slug: 'an unknown arg',
        args: ['--bogus'],
        stderr: "✋ ConstraintError: unknown arg '--bogus'",
      },
      {
        slug: '--of with no value',
        args: ['--from', 'HEAD', '--of'],
        stderr: '✋ ConstraintError: --of needs a value',
      },
      {
        slug: '--from with no value',
        args: ['--of', 'settings.json', '--from'],
        stderr: '✋ ConstraintError: --from needs a value',
      },
      {
        slug: '--into with no value',
        args: ['--of', 'settings.json', '--from', 'HEAD', '--into'],
        stderr: '✋ ConstraintError: --into needs a value',
      },
    ];

    REFUSALS.map((refusal, index) =>
      when(`[t${index}] it runs with ${refusal.slug}`, () => {
        const out = useBeforeAll(async () =>
          runSkill({ args: refusal.args, cwd: scene.tempDir }),
        );

        then('it refuses on stderr and exits 2', () => {
          expect(out.exitCode).toEqual(2);
          expect(out.stderr.trim()).toEqual(refusal.stderr);
        });

        then('the refusal matches its snapshot', () => {
          expect(out.stderr).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case3] a regen that reorders every list and narrows one entry', () => {
    const scene = useBeforeAll(async () => genRepoWithRegen());

    when('[t0] the committed rev is compared with the work tree', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('the reorder alone reports naught; the changed entries are named', () => {
        expect(out.stdout).toContain('- Write(.route/**)');
        expect(out.stdout).toContain('+ Edit(.route/**)');
        expect(out.stdout).not.toContain('Bash(ls:*)');
        expect(out.stdout).toContain('all else equal = true');
      });

      then('the report matches its snapshot', () => {
        expect(out.stdout).toMatchSnapshot();
      });
    });

    when('[t1] a rev that lacks the file is named', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'absent.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it fails loud and exits 1', () => {
        expect(out.exitCode).toEqual(1);
        expect(out.stderr).toContain(
          '💥 MalfunctionError: cannot read absent.json at HEAD',
        );
      });

      then('the fault matches its snapshot', () => {
        expect(out.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] a regen that widens one entry and changes a hook', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithRegen();
      fs.writeFileSync(
        path.join(repo.tempDir, 'settings.json'),
        JSON.stringify({
          permissions: {
            allow: [
              'Bash(cat:*)',
              'Bash(ls:*)',
              'Write(.route/**)',
              'Bash(rm:*)',
              'Bash(curl:*)',
            ],
            deny: [],
          },
          hooks: { a: 2 },
        }),
      );
      return repo;
    });

    when('[t0] the committed rev is compared with the work tree', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it exits 0 and names the widened grant', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('├─ + Bash(rm:*)');
        expect(out.stdout).toContain('└─ + Bash(curl:*)');
        expect(out.stdout).toContain('- Bash(rm:*)');
        expect(out.stdout).toContain('all else equal = false');
      });

      then('it names the key outside permissions that moved', () => {
        expect(out.stdout).toContain('   └─ all else equal = false\n      └─ ~ hooks');
      });

      then('the report matches its snapshot', () => {
        expect(out.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] a regen that only reorders', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithRegen();
      fs.writeFileSync(
        path.join(repo.tempDir, 'settings.json'),
        JSON.stringify({
          hooks: { a: 1 },
          permissions: {
            deny: ['Bash(rm:*)'],
            allow: ['Write(.route/**)', 'Bash(cat:*)', 'Bash(ls:*)'],
          },
        }),
      );
      return repo;
    });

    when('[t0] the committed rev is compared with the work tree', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it exits 0 and reports no change', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).not.toMatch(/^\s*│?\s*[└├]─ [+-] /m);
        expect(out.stdout).toContain('all else equal = true');
      });

      then('the report matches its snapshot', () => {
        expect(out.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] a regen already committed, so two revs are compared', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithRegen();
      execSync('git add settings.json && git commit -m after --no-verify', {
        cwd: repo.tempDir,
      });
      return repo;
    });

    when('[t0] --into names the later rev', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD~1', '--into', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it exits 0, names the into rev, and names the changed entries', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('into = HEAD');
        expect(out.stdout).not.toContain('(work tree)');
        expect(out.stdout).toContain('- Write(.route/**)');
        expect(out.stdout).toContain('+ Edit(.route/**)');
      });

      then('the report matches its snapshot', () => {
        expect(out.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] a work tree file left with a merge-conflict marker', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithRegen();
      fs.writeFileSync(
        path.join(repo.tempDir, 'settings.json'),
        ['<<<<<<< HEAD', '{ "permissions": {} }', '=======', '{}', '>>>>>>> regen', ''].join(
          '\n',
        ),
      );
      return repo;
    });

    when('[t0] the committed rev is compared with the work tree', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it refuses as bad input, names the version, and exits 2', () => {
        expect(out.exitCode).toEqual(2);
        expect(out.stderr).toContain(
          '✋ ConstraintError: settings.json in the work tree is not a json object',
        );
        expect(out.stderr).toContain('   └─ cause: ');
        expect(out.stdout).toEqual('');
      });

      then('the refusal matches its snapshot', () => {
        expect(out.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case8] a work tree that no longer holds the file', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoWithRegen();
      fs.rmSync(path.join(repo.tempDir, 'settings.json'));
      return repo;
    });

    when('[t0] the committed rev is compared with the work tree', () => {
      const out = useBeforeAll(async () =>
        runSkill({
          args: ['--of', 'settings.json', '--from', 'HEAD'],
          cwd: scene.tempDir,
        }),
      );

      then('it fails loud and exits 1', () => {
        expect(out.exitCode).toEqual(1);
        expect(out.stderr).toContain(
          '💥 MalfunctionError: cannot read settings.json in the work tree',
        );
        expect(out.stdout).toEqual('');
      });

      then('the fault matches its snapshot', () => {
        expect(out.stderr).toMatchSnapshot();
      });
    });
  });
});
