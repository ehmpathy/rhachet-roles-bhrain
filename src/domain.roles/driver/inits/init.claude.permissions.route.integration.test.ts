import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { spawnSync } from 'node:child_process';
import * as fsSync from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * .what = integration tests for the driver's route-permissions heal init
 * .why = verifies the bash + jq heal strips the owned denies, findserts the owned allows,
 *        and reports a heal with no false fault on stderr — against the real filesystem
 *
 * .note = the init anchors on `git rev-parse --show-toplevel`, so it runs from a
 *         git-backed temp dir (genTempDir({ git: true }))
 */
const INIT_PATH: string = path.join(
  __dirname,
  'init.claude.permissions.route.sh',
);

/**
 * .what = runs the heal init from a cwd, with both streams captured
 * .why = the stderr is half the contract: a heal must print no fault line
 */
const runInit = (input: {
  cwd: string;
  initPath?: string;
  pathPrefix?: string;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (input.pathPrefix) env.PATH = `${input.pathPrefix}:${process.env.PATH}`;
  const result = spawnSync('/bin/bash', [input.initPath ?? INIT_PATH], {
    cwd: input.cwd,
    encoding: 'utf-8',
    env,
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
};

/**
 * .what = tokenizes the volatile parts of the init's output: a backup name, a link target
 * .why = a snapshot must pin the tree a human reads, never a timestamp, a pid, or a temp path
 */
const asStableOutput = (input: { text: string }): string =>
  input.text
    .replace(
      /settings(\.of\.repo)?\.[0-9TZ-]+\.\d+\.bak\.json/g,
      'settings$1.<timestamp>.<pid>.bak.json',
    )
    .replace(/(a link to ).*?(, so)/, '$1<path>$2')
    .replace(
      /(owned-permissions config not found: ).*(init\.claude\.permissions\.route\.jsonc)/,
      '$1<path>/$2',
    );

describe('init.claude.permissions.route.integration', () => {
  given('[case1] a settings.json that denies the route workspace', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'perms-route-case1', git: true });
      await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify(
          {
            permissions: {
              allow: ['Bash(echo:*)'],
              deny: ['Write(**/.route/**)', 'Bash(rm:*)'],
            },
          },
          null,
          2,
        ),
      );
      return { tempDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const run = runInit({ cwd: scene.tempDir });
        const raw = await fs.readFile(
          path.join(scene.tempDir, '.claude', 'settings.json'),
          'utf-8',
        );
        return { ...run, settings: JSON.parse(raw) };
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('it reports the heal', () => {
        expect(out.stdout).toContain('status = healed');
      });

      then('it strips only the owned deny', () => {
        expect(out.settings.permissions.deny).toEqual(['Bash(rm:*)']);
      });

      then('it findserts the owned allows beside the prior one', () => {
        expect([...out.settings.permissions.allow].sort()).toEqual(
          ['Bash(echo:*)', 'Edit(.route/**)', 'Write(.route/**)'].sort(),
        );
      });

      then('it prints no fault line, since a heal is no fault', () => {
        // the compare exits 1 on every change; an ERR trap read that as a fault
        expect(out.stderr).not.toContain('failed at line');
      });

      then('its stdout matches the snapshot', () => {
        expect(asStableOutput({ text: out.stdout })).toMatchSnapshot(
          'init.claude.permissions.route - healed',
        );
      });
    });

    when('[t1] the init runs a second time', () => {
      const out = useBeforeAll(async () => runInit({ cwd: scene.tempDir }));

      then('it reports already healed', () => {
        expect(out.stdout).toContain('status = already healed');
      });

      then('it prints no fault line', () => {
        expect(out.stderr).not.toContain('failed at line');
      });

      then('its stdout matches the snapshot', () => {
        expect(asStableOutput({ text: out.stdout })).toMatchSnapshot(
          'init.claude.permissions.route - already healed',
        );
      });
    });
  });

  given(
    '[case2] a split layout (rhachet 1.49) whose grove is absent, so the arrows dangle',
    () => {
      const scene = useBeforeAll(async () => {
        const repo = genTempDir({ slug: 'perms-route-case2', git: true });
        const home = genTempDir({ slug: 'perms-route-case2-home' });
        const brainRel = path.join(
          '.agent',
          '.actors',
          'actor.via.repo=ambient',
          'brain',
          '.claude',
        );
        const brain = path.join(repo, brainRel);
        await fs.mkdir(brain, { recursive: true });
        await fs.symlink(brainRel, path.join(repo, '.claude'));
        await fs.symlink(
          path.join(home, '.claude', 'settings.json'),
          path.join(brain, 'settings.of.grove.json'),
        );
        await fs.symlink(
          'settings.of.grove.json',
          path.join(brain, 'settings.json'),
        );
        await fs.writeFile(
          path.join(brain, 'settings.of.repo.json'),
          JSON.stringify({ permissions: { deny: ['Write(**/.route/**)'] } }),
        );
        return { repo, home, brain };
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = spawnSync('/bin/bash', [INIT_PATH], {
            cwd: scene.repo,
            encoding: 'utf-8',
            env: { ...process.env, HOME: scene.home },
          });
          const repoSettings = JSON.parse(
            await fs.readFile(
              path.join(scene.brain, 'settings.of.repo.json'),
              'utf-8',
            ),
          );
          const arrowStat = await fs.lstat(
            path.join(scene.brain, 'settings.json'),
          );
          return {
            exitCode: result.status,
            stdout: result.stdout,
            repoSettings,
            arrowStat,
          };
        });

        then('it exits 0, so rhx init and rhx upgrade carry on', () => {
          expect(out.exitCode).toEqual(0);
        });

        then('it heals settings.of.repo.json, the file rhachet keeps', () => {
          expect(out.repoSettings.permissions.deny).toEqual([]);
          expect(out.repoSettings.permissions.allow).toContain(
            'Write(.route/**)',
          );
        });

        then('it leaves settings.json an arrow', () => {
          expect(out.arrowStat.isSymbolicLink()).toEqual(true);
        });

        then('its healed tree matches the snapshot', () => {
          expect(asStableOutput({ text: out.stdout })).toMatchSnapshot(
            'init.claude.permissions.route - healed (split layout)',
          );
        });
      });

      when('[t1] the init runs a second time', () => {
        const rerun = useBeforeAll(async () => runInit({ cwd: scene.repo }));

        then('it exits 0 and reports already healed', () => {
          expect(rerun.exitCode).toEqual(0);
          expect(rerun.stdout).toContain('status = already healed');
        });

        then('its tree matches the snapshot', () => {
          expect(asStableOutput({ text: rerun.stdout })).toMatchSnapshot(
            'init.claude.permissions.route - already healed (split layout)',
          );
        });
      });
    },
  );

  given('[case7] a split layout with no settings.of.repo.json yet', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case7', git: true });
      const brainRel = path.join(
        '.agent',
        '.actors',
        'actor.via.repo=ambient',
        'brain',
        '.claude',
      );
      const brain = path.join(repo, brainRel);
      await fs.mkdir(brain, { recursive: true });
      await fs.symlink(brainRel, path.join(repo, '.claude'));
      await fs.symlink(
        'settings.of.grove.json',
        path.join(brain, 'settings.json'),
      );
      return { repo, brain };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const result = runInit({ cwd: scene.repo });
        const repoSettings = JSON.parse(
          await fs.readFile(
            path.join(scene.brain, 'settings.of.repo.json'),
            'utf-8',
          ),
        );
        return { ...result, repoSettings };
      });

      then('it seeds and heals settings.of.repo.json, with no backup', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('status = healed');
        expect(out.stdout).toContain('backup = none');
        expect(out.repoSettings.permissions.allow).toContain(
          'Write(.route/**)',
        );
      });

      then('its tree matches the snapshot', () => {
        expect(asStableOutput({ text: out.stdout })).toMatchSnapshot(
          'init.claude.permissions.route - healed (split layout, seeded)',
        );
      });
    });
  });

  given('[case8] an old layout with no .claude at all', () => {
    const scene = useBeforeAll(async () => ({
      repo: genTempDir({ slug: 'perms-route-case8', git: true }),
    }));

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const result = runInit({ cwd: scene.repo });
        const settings = JSON.parse(
          await fs.readFile(
            path.join(scene.repo, '.claude', 'settings.json'),
            'utf-8',
          ),
        );
        return { ...result, settings };
      });

      then('it seeds and heals settings.json, with no backup', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stdout).toContain('backup = none');
        expect(out.settings.permissions.allow).toContain('Write(.route/**)');
      });

      then('its tree matches the snapshot', () => {
        expect(asStableOutput({ text: out.stdout })).toMatchSnapshot(
          'init.claude.permissions.route - healed (old layout, seeded)',
        );
      });
    });
  });

  given(
    '[case3] a split layout whose arrow a prior init replaced with a real settings.json',
    () => {
      // a real settings.json beside settings.of.repo.json: rhachet replaces it on the
      // next enroll, so a heal written there would vanish
      const scene = useBeforeAll(async () => {
        const repo = genTempDir({ slug: 'perms-route-case3', git: true });
        const brain = path.join(repo, '.claude');
        await fs.mkdir(brain, { recursive: true });
        await fs.writeFile(
          path.join(brain, 'settings.json'),
          JSON.stringify({ theme: 'dark' }),
        );
        await fs.writeFile(
          path.join(brain, 'settings.of.repo.json'),
          JSON.stringify({ permissions: { deny: ['Write(**/.route/**)'] } }),
        );
        return { repo, brain };
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = spawnSync('/bin/bash', [INIT_PATH], {
            cwd: scene.repo,
            encoding: 'utf-8',
          });
          const repoSettings = JSON.parse(
            await fs.readFile(
              path.join(scene.brain, 'settings.of.repo.json'),
              'utf-8',
            ),
          );
          const clobbered = JSON.parse(
            await fs.readFile(path.join(scene.brain, 'settings.json'), 'utf-8'),
          );
          return { exitCode: result.status, repoSettings, clobbered };
        });

        then('it heals settings.of.repo.json, the file rhachet keeps', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.repoSettings.permissions.deny).toEqual([]);
        });

        then(
          'it never writes the real settings.json rhachet will replace',
          () => {
            expect(out.clobbered).toEqual({ theme: 'dark' });
          },
        );
      });
    },
  );

  given('[case4] a settings target that is not valid json', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case4', git: true });
      await fs.mkdir(path.join(repo, '.claude'), { recursive: true });
      await fs.writeFile(
        path.join(repo, '.claude', 'settings.json'),
        '{ "permissions": ',
      );
      return { repo };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const run = runInit({ cwd: scene.repo });
        const raw = await fs.readFile(
          path.join(scene.repo, '.claude', 'settings.json'),
          'utf-8',
        );
        return { ...run, raw };
      });

      then('it exits 0, so rhx init and rhx upgrade carry on', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('it warns on stderr, with the cause and the fix', () => {
        expect(out.stderr).toContain('status = not healed');
        expect(out.stderr).toContain('is not valid json');
      });

      then('it leaves the file untouched', () => {
        expect(out.raw).toEqual('{ "permissions": ');
      });

      then('its raw warn stderr matches the snapshot', () => {
        expect(out.stderr).toMatchSnapshot(
          'init.claude.permissions.route - warn (malformed json)',
        );
      });
    });
  });

  given('[case4b] a settings target that is valid json, but an array', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case4b', git: true });
      await fs.mkdir(path.join(repo, '.claude'), { recursive: true });
      await fs.writeFile(path.join(repo, '.claude', 'settings.json'), '[]');
      return { repo };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const run = runInit({ cwd: scene.repo });
        const raw = await fs.readFile(
          path.join(scene.repo, '.claude', 'settings.json'),
          'utf-8',
        );
        return { ...run, raw };
      });

      then('it exits 0, so rhx init and rhx upgrade carry on', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('it warns that the target is not a json object', () => {
        expect(out.stderr).toContain('status = not healed');
        expect(out.stderr).toContain('valid json, but not an object');
      });

      then('it leaves the file untouched', () => {
        expect(out.raw).toEqual('[]');
      });

      then('its raw warn stderr matches the snapshot', () => {
        expect(asStableOutput({ text: out.stderr })).toMatchSnapshot(
          'init.claude.permissions.route - warn (not a json object)',
        );
      });
    });
  });

  given('[case9] a jq that faults on the compare', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case9', git: true });
      await fs.mkdir(path.join(repo, '.claude'), { recursive: true });
      await fs.writeFile(
        path.join(repo, '.claude', 'settings.json'),
        JSON.stringify({ permissions: { deny: ['Write(**/.route/**)'] } }),
      );
      // a shim that passes every call through, except the before/after compare. the shim
      // dir leads PATH, so the real jq is what PATH holds once that first entry is dropped
      const shimDir = path.join(repo, '.scratch-jq');
      await fs.mkdir(shimDir, { recursive: true });
      await fs.writeFile(
        path.join(shimDir, 'jq'),
        [
          '#!/usr/bin/env bash',
          'for arg in "$@"; do',
          '  if [[ "$arg" == "--slurpfile" ]]; then exit 5; fi',
          'done',
          'PATH="${PATH#*:}" exec jq "$@"',
          '',
        ].join('\n'),
      );
      await fs.chmod(path.join(shimDir, 'jq'), 0o755);
      return { repo, shimDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () =>
        runInit({ cwd: scene.repo, pathPrefix: scene.shimDir }),
      );

      then('it exits 1, loud, as a malfunction', () => {
        expect(out.exitCode).toEqual(1);
        expect(out.stderr).toContain(
          '💥 MalfunctionError: jq failed to compare settings (exit 5)',
        );
        expect(out.stderr).toContain('status = malfunction');
      });

      then('its stderr matches the snapshot', () => {
        expect(out.stderr).toMatchSnapshot(
          'init.claude.permissions.route - malfunction (jq faults on the compare)',
        );
      });
    });
  });

  given('[case5] a split layout whose settings.of.repo.json is a link', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case5', git: true });
      const brain = path.join(repo, '.claude');
      await fs.mkdir(brain, { recursive: true });
      const elsewhere = path.join(repo, 'elsewhere.json');
      await fs.writeFile(elsewhere, '{}');
      await fs.symlink(elsewhere, path.join(brain, 'settings.of.repo.json'));
      return { repo, elsewhere };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const run = runInit({ cwd: scene.repo });
        const elsewhere = await fs.readFile(scene.elsewhere, 'utf-8');
        return { ...run, elsewhere };
      });

      then('it exits 0 and warns that the target is a link', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toContain('is a link');
      });

      then('it never writes through the link', () => {
        expect(out.elsewhere).toEqual('{}');
      });

      then(
        'the snapshot tokenizes the temp link target, and no other byte',
        () => {
          expect(asStableOutput({ text: out.stderr })).toEqual(
            out.stderr.replace(scene.elsewhere, '<path>'),
          );
        },
      );

      then('its warn stderr matches the snapshot', () => {
        expect(asStableOutput({ text: out.stderr })).toMatchSnapshot(
          'init.claude.permissions.route - warn (linked target)',
        );
      });
    });
  });

  given('[case6] a run where the owned-permissions config is absent', () => {
    const scene = useBeforeAll(async () => {
      const repo = genTempDir({ slug: 'perms-route-case6', git: true });
      const copyDir = path.join(repo, '.scratch-init');
      await fs.mkdir(copyDir, { recursive: true });
      const initCopy = path.join(copyDir, 'init.claude.permissions.route.sh');
      await fs.copyFile(INIT_PATH, initCopy);
      return { repo, initCopy };
    });

    when('[t0] the init runs with no config beside it', () => {
      const out = useBeforeAll(async () =>
        runInit({ cwd: scene.repo, initPath: scene.initCopy }),
      );

      then('it exits 0, so rhx init and rhx upgrade carry on', () => {
        expect(out.exitCode).toEqual(0);
      });

      then(
        'it warns that the target was not healed, with the cause and the fix',
        () => {
          expect(out.stderr).toContain('status = not healed');
          expect(out.stderr).toContain('owned-permissions config not found');
          expect(out.stderr).toContain('fix: reinstall rhachet-roles-bhrain');
        },
      );

      then('it writes no settings file', () => {
        expect(fsSync.existsSync(path.join(scene.repo, '.claude'))).toEqual(
          false,
        );
      });

      then('the snapshot tokenizes the temp dir, and no other byte', () => {
        expect(asStableOutput({ text: out.stderr })).toEqual(
          out.stderr.replace(path.dirname(scene.initCopy), '<path>'),
        );
      });

      then('its warn stderr matches the snapshot', () => {
        expect(asStableOutput({ text: out.stderr })).toMatchSnapshot(
          'init.claude.permissions.route - warn (owned config absent)',
        );
      });
    });
  });
});
