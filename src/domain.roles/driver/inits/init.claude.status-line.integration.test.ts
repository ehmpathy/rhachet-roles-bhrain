import { spawnSync } from 'child_process';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = integration tests for the driver status-line installer init
 * .why = verifies the bash + jq merge writes statusLine into the layer rhachet keeps —
 *        settings.of.repo.json in the split layout, settings.json in the old one —
 *        preserves other keys, is idempotent, and never fails `rhx init` on a state a
 *        human must fix
 *
 * .note = the init derives the target via `git rev-parse --show-toplevel`, so it
 *         runs from a git-backed temp dir (genTempDir({ git: true })). HOME points at a
 *         temp dir too, since the init reads the grove at $HOME/.claude/settings.json
 */
const INIT_PATH = path.join(__dirname, 'init.claude.status-line.sh');

const RENDERER_COMMAND =
  "BASH_ENV= bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh || printf '%s\\n' '🗿 status line reader not found, rhx init --roles driver'";

/**
 * .what = the command a release before the bash reader wrote
 * .why = it boots node on every repaint; the init must rewrite it to the bash reader
 */
const RENDERER_COMMAND_VIA_NODE =
  'node -e "import(\'rhachet-roles-bhrain/cli/route.status.line\').then(m => m.routeStatusLine())"';

/**
 * .what = the command a release before the isolated subpath wrote
 * .why = it loads the whole `cli/route` barrel on every repaint; the init must rewrite it
 */
const RENDERER_COMMAND_VIA_BARREL =
  'node -e "import(\'rhachet-roles-bhrain/cli/route\').then(m => m.routeStatusLine())"';

/**
 * .what = runs the installer init from a given cwd, with a hermetic HOME
 * .why = the init anchors on the cwd's git root and reads the grove under HOME; the
 *        harness observes stdout, stderr, and exit, so the test does too
 */
const runInit = (input: {
  cwd: string;
  home: string;
  initPath?: string;
  configDir?: string;
  pathPrefix?: string;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: input.home };
  delete env.CLAUDE_CONFIG_DIR;
  if (input.configDir) env.CLAUDE_CONFIG_DIR = input.configDir;
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
 * .what = replaces the volatile backup filename (timestamp + pid) with a token
 * .why = the installer stdout names an ISO-dated, pid-tagged backup file; the
 *        snapshot must capture the owl-vibed message shape, not the volatile name
 */
const asStableInstallerStdout = (input: { stdout: string }): string => {
  return input.stdout.replace(
    /settings(\.of\.repo)?\.[0-9TZ-]+\.\d+\.bak\.json/g,
    'settings$1.<timestamp>.<pid>.bak.json',
  );
};

/**
 * .what = tokenizes the renderer command in a merged settings object
 * .why = jest's object printer renders the command's embedded shell double-quotes as a
 *        raw quote pileup (a visual blemish); the command is asserted verbatim in case1
 */
const asStableMergedSettings = (input: {
  settings: Record<string, unknown>;
}): Record<string, unknown> => {
  const parsed = JSON.parse(JSON.stringify(input.settings));
  return {
    ...parsed,
    statusLine: { ...parsed.statusLine, command: '<renderer command>' },
  };
};

/**
 * .what = tokenizes the volatile absolute paths in a warn stderr
 * .why = the snapshot must derive from the ACTUAL captured stderr, so only the
 *        environment-volatile paths are replaced; every other byte is the real output
 */
const asStableWarnStderr = (input: { stderr: string }): string => {
  return input.stderr
    .replace(
      /(status-line config not found: ).*(init\.claude\.status-line\.jsonc)/,
      '$1<path>/$2',
    )
    .replace(
      /(holds no statusLine object: ).*(init\.claude\.status-line\.jsonc)/,
      '$1<path>/$2',
    )
    .replace(/(a link to ).*?(, so)/, '$1<path>$2');
};

/**
 * .what = builds the rhachet 1.49 split layout in a git-backed temp repo
 * .why = `.claude` links to the repo actor's brain dir; settings.json there is an arrow
 *        to settings.of.grove.json, which points at the grove under HOME; and
 *        settings.of.repo.json is the one real file. the grove may be present, an empty
 *        dir, or absent, so the arrows may dangle. `roles` are linked as role dirs, the
 *        source of the ambient roles; `record` writes the actor's actor.json verbatim
 */
const genSplitLayout = async (input: {
  slug: string;
  roles: string[];
  record?: string;
  grove: 'present' | 'nodir';
  groveSettings?: Record<string, unknown>;
  repoSettings?: string | null;
}): Promise<{ repo: string; home: string; brain: string }> => {
  const repo = genTempDir({ slug: input.slug, git: true });
  const home = genTempDir({ slug: `${input.slug}-home` });
  const actorDir = path.join(
    repo,
    '.agent',
    '.actors',
    'actor.via.repo=ambient',
  );
  const brain = path.join(actorDir, 'brain', '.claude');
  await fs.mkdir(brain, { recursive: true });
  await fs.symlink(
    path.join(
      '.agent',
      '.actors',
      'actor.via.repo=ambient',
      'brain',
      '.claude',
    ),
    path.join(repo, '.claude'),
  );
  await fs.symlink(
    path.join(home, '.claude', 'settings.json'),
    path.join(brain, 'settings.of.grove.json'),
  );
  await fs.symlink('settings.of.grove.json', path.join(brain, 'settings.json'));
  if (input.repoSettings !== null)
    await fs.writeFile(
      path.join(brain, 'settings.of.repo.json'),
      input.repoSettings ?? '{}',
    );
  // the ambient roles are the linked role dirs: rhachet derives the repo actor from them
  for (const role of input.roles)
    await fs.mkdir(
      path.join(
        repo,
        '.agent',
        role === 'driver' ? 'repo=bhrain' : 'repo=ehmpathy',
        `role=${role}`,
      ),
      { recursive: true },
    );
  // the actor's record is a cache rhachet writes only at a clone enroll, so it may lag
  if (input.record !== undefined)
    await fs.writeFile(path.join(actorDir, 'actor.json'), input.record);
  if (input.grove === 'present') {
    await fs.mkdir(path.join(home, '.claude'), { recursive: true });
    await fs.writeFile(
      path.join(home, '.claude', 'settings.json'),
      JSON.stringify(input.groveSettings ?? {}, null, 2),
    );
  }
  return { repo, home, brain };
};

const readJson = async (file: string): Promise<Record<string, any>> =>
  JSON.parse(await fs.readFile(file, 'utf-8'));

describe('init.claude.status-line.integration', () => {
  given('[case1] an old-layout repo with no .claude/settings.json', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genTempDir({ slug: 'statusline-init-case1', git: true }),
      home: genTempDir({ slug: 'statusline-init-case1-home' }),
    }));

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const result = runInit({ cwd: scene.tempDir, home: scene.home });
        const settings = await readJson(
          path.join(scene.tempDir, '.claude', 'settings.json'),
        );
        return { ...result, settings };
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('it creates settings.json with the statusLine block', () => {
        expect(out.settings.statusLine).toEqual({
          type: 'command',
          command: RENDERER_COMMAND,
          padding: 0,
          refreshInterval: 60,
        });
      });

      then('it reports the status line was configured', () => {
        expect(out.stdout).toContain('status = configured');
      });

      then('it prints no fault line, since a change is no fault', () => {
        expect(out.stderr).not.toContain('failed at line');
      });

      then('its owl-vibed stdout matches the configured snapshot', () => {
        expect(asStableInstallerStdout({ stdout: out.stdout })).toMatchSnapshot(
          'init.claude.status-line - configured',
        );
      });
    });
  });

  given(
    '[case2] an old-layout repo with a settings.json that holds other keys',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-init-case2',
          git: true,
        });
        await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.claude', 'settings.json'),
          JSON.stringify(
            {
              hooks: { SessionStart: [{ matcher: '*', hooks: [] }] },
              permissions: { allow: ['Bash(echo:*)'], deny: [], ask: [] },
            },
            null,
            2,
          ),
        );
        return {
          tempDir,
          home: genTempDir({ slug: 'statusline-init-case2-home' }),
        };
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.tempDir, home: scene.home });
          const settings = await readJson(
            path.join(scene.tempDir, '.claude', 'settings.json'),
          );
          return { ...result, settings };
        });

        then('it adds the statusLine key', () => {
          expect(out.settings.statusLine?.type).toEqual('command');
        });

        then('it preserves the prior hooks and permissions keys', () => {
          expect(out.settings.hooks).toEqual({
            SessionStart: [{ matcher: '*', hooks: [] }],
          });
          expect(out.settings.permissions).toEqual({
            allow: ['Bash(echo:*)'],
            deny: [],
            ask: [],
          });
        });

        then('its merged settings.json matches the merge snapshot', () => {
          expect(
            asStableMergedSettings({ settings: out.settings }),
          ).toMatchSnapshot(
            'init.claude.status-line - merged into prior settings',
          );
        });

        then(
          'its stdout, with a backup of the prior file, matches the snapshot',
          () => {
            expect(out.stdout).toContain('status = configured');
            expect(
              asStableInstallerStdout({ stdout: out.stdout }),
            ).toMatchSnapshot(
              'init.claude.status-line - configured (old layout, prior file backed up)',
            );
          },
        );
      });
    },
  );

  given('[case3] an old-layout repo where the init already ran', () => {
    const listBackups = async (dir: string): Promise<string[]> =>
      (await fs.readdir(path.join(dir, '.claude'))).filter((f) =>
        f.endsWith('.bak.json'),
      );

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case3', git: true });
      const home = genTempDir({ slug: 'statusline-init-case3-home' });
      runInit({ cwd: tempDir, home });
      const backupsAfterFirst = await listBackups(tempDir);
      return { tempDir, home, backupCountAfterFirst: backupsAfterFirst.length };
    });

    when('[t0] the init runs a second time', () => {
      const out = useBeforeAll(async () => {
        const result = runInit({ cwd: scene.tempDir, home: scene.home });
        const backupsAfterSecond = await listBackups(scene.tempDir);
        return { ...result, backupCountAfterSecond: backupsAfterSecond.length };
      });

      then('it reports already configured (idempotent no-op)', () => {
        expect(out.stdout).toContain('already configured');
      });

      then('the no-op run adds no new backup', () => {
        expect(out.backupCountAfterSecond).toEqual(scene.backupCountAfterFirst);
      });

      then('its owl-vibed no-op stdout matches the snapshot', () => {
        expect(asStableInstallerStdout({ stdout: out.stdout })).toMatchSnapshot(
          'init.claude.status-line - already-configured no-op',
        );
      });
    });
  });

  given(
    '[case4] an old-layout repo where a human set their own statusLine',
    () => {
      const humanStatusLine = {
        type: 'command',
        command: './my-own-status.sh',
        padding: 1,
      };

      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-init-case4',
          git: true,
        });
        await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.claude', 'settings.json'),
          JSON.stringify({ statusLine: humanStatusLine }, null, 2),
        );
        return {
          tempDir,
          home: genTempDir({ slug: 'statusline-init-case4-home' }),
        };
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.tempDir, home: scene.home });
          const settings = await readJson(
            path.join(scene.tempDir, '.claude', 'settings.json'),
          );
          return { ...result, settings };
        });

        then('it leaves the human statusLine intact (skip-and-warn)', () => {
          expect(out.settings.statusLine).toEqual(humanStatusLine);
        });

        then('it reports that it left the human config intact', () => {
          expect(out.stdout).toContain('left intact');
        });

        then('its owl-vibed skip-and-warn stdout matches the snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot('init.claude.status-line - skip-and-warn');
        });
      });
    },
  );

  // .why exit 0 = an absent config is a state a human must fix (reinstall the package), and
  //      `rhx init` and `rhx upgrade` never fail on this init: the wisher ruled that a failed
  //      run on a human-fixable state hides the rest of the run's output behind a red exit.
  //      this case once pinned exit 2 and `status = blocked`; the loud signal now lives in the
  //      warn tree (reason, settings, fix), asserted below and snapped
  given('[case5] a run where the .jsonc config is absent', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case5', git: true });
      const copyDir = path.join(tempDir, '.scratch-init');
      await fs.mkdir(copyDir, { recursive: true });
      const initCopy = path.join(copyDir, 'init.claude.status-line.sh');
      await fs.copyFile(INIT_PATH, initCopy);
      return {
        tempDir,
        initCopy,
        home: genTempDir({ slug: 'statusline-init-case5-home' }),
      };
    });

    when('[t0] the init runs with no config beside it', () => {
      const out = useBeforeAll(async () =>
        runInit({
          cwd: scene.tempDir,
          home: scene.home,
          initPath: scene.initCopy,
        }),
      );

      then('it exits 0, so rhx init and rhx upgrade carry on', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('it warns on stderr, with the fix', () => {
        expect(out.stderr).toContain('status = not configured');
        expect(out.stderr).toContain('status-line config not found');
      });

      then('it writes no settings.json', () => {
        expect(
          fsSync.existsSync(
            path.join(scene.tempDir, '.claude', 'settings.json'),
          ),
        ).toEqual(false);
      });

      then('the snapshot tokenizes the temp dir, and no other byte', () => {
        expect(asStableWarnStderr({ stderr: out.stderr })).toEqual(
          out.stderr.replace(path.dirname(scene.initCopy), '<path>'),
        );
      });

      then('its warn stderr matches the snapshot', () => {
        expect(asStableWarnStderr({ stderr: out.stderr })).toMatchSnapshot(
          'init.claude.status-line - warn (config absent)',
        );
      });
    });
  });

  given('[case5b] a run whose .jsonc config holds no statusLine', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case5b', git: true });
      const copyDir = path.join(tempDir, '.scratch-init');
      await fs.mkdir(copyDir, { recursive: true });
      const initCopy = path.join(copyDir, 'init.claude.status-line.sh');
      await fs.copyFile(INIT_PATH, initCopy);
      await fs.writeFile(
        path.join(copyDir, 'init.claude.status-line.jsonc'),
        '// no statusLine here\n{ "other": true }\n',
      );
      return {
        tempDir,
        initCopy,
        home: genTempDir({ slug: 'statusline-init-case5b-home' }),
      };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () =>
        runInit({
          cwd: scene.tempDir,
          home: scene.home,
          initPath: scene.initCopy,
        }),
      );

      then('it exits 0 and warns, with the fix', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toContain('status = not configured');
        expect(out.stderr).toContain('holds no statusLine object');
      });

      then('it writes no settings.json, so no null statusLine lands', () => {
        expect(
          fsSync.existsSync(
            path.join(scene.tempDir, '.claude', 'settings.json'),
          ),
        ).toEqual(false);
      });

      then('the snapshot tokenizes the temp dir, and no other byte', () => {
        expect(asStableWarnStderr({ stderr: out.stderr })).toEqual(
          out.stderr.replace(path.dirname(scene.initCopy), '<path>'),
        );
      });

      then('its warn stderr matches the snapshot', () => {
        expect(asStableWarnStderr({ stderr: out.stderr })).toMatchSnapshot(
          'init.claude.status-line - warn (config holds no statusLine)',
        );
      });
    });
  });

  given(
    '[case6] a split-layout repo whose actor is enrolled with driver',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case6',
          roles: ['any', 'driver', 'mechanic'],
          grove: 'present',
          groveSettings: { theme: 'dark' },
          repoSettings: JSON.stringify({ hooks: { Stop: [] } }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          const grove = await readJson(
            path.join(scene.home, '.claude', 'settings.json'),
          );
          const arrowStat = await fs.lstat(
            path.join(scene.brain, 'settings.json'),
          );
          return { ...result, repoSettings, grove, arrowStat };
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });

        then('it writes statusLine into settings.of.repo.json', () => {
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });

        then('it keeps the prior keys of settings.of.repo.json', () => {
          expect(out.repoSettings.hooks).toEqual({ Stop: [] });
        });

        then('it leaves settings.json an arrow', () => {
          expect(out.arrowStat.isSymbolicLink()).toEqual(true);
        });

        then('it never writes the grove', () => {
          expect(out.grove).toEqual({ theme: 'dark' });
        });

        then('from a bare shell, it names when peer actors pick it up', () => {
          expect(out.stdout).toContain(
            "   └─ peer actors = derived at each one's next rhx enroll, or the next rhx init --hooks",
          );
        });

        then('its stdout matches the split-layout snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (split layout)',
          );
        });
      });

      when('[t1] the init runs a second time', () => {
        const rerun = useBeforeAll(async () => {
          runInit({ cwd: scene.repo, home: scene.home });
          return runInit({ cwd: scene.repo, home: scene.home });
        });

        then('it exits 0 and reports already configured', () => {
          expect(rerun.exitCode).toEqual(0);
          expect(rerun.stdout).toContain('status = already configured');
        });

        then(
          'it still says when peer actors pick it up, for a human who reruns to find why a clone shows no line',
          () => {
            expect(rerun.stdout).toContain(
              "   └─ peer actors = derived at each one's next rhx enroll, or the next rhx init --hooks",
            );
          },
        );

        then('its stdout matches the already-configured snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: rerun.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - already configured (split layout)',
          );
        });
      });
    },
  );

  given(
    '[case6b] a split-layout repo, run from a session of a peer actor',
    () => {
      const scene = useBeforeAll(async () => {
        const layout = await genSplitLayout({
          slug: 'statusline-init-case6b',
          roles: ['driver'],
          grove: 'present',
        });
        const peerBrain = path.join(
          layout.repo,
          '.agent',
          '.actors',
          'actor.via.slug=peer',
          'brain',
          '.claude',
        );
        await fs.mkdir(peerBrain, { recursive: true });
        return { ...layout, peerBrain };
      });

      when('[t0] the init runs with CLAUDE_CONFIG_DIR at the peer', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({
            cwd: scene.repo,
            home: scene.home,
            configDir: scene.peerBrain,
          });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it binds the repo actor, never the peer', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
          expect(
            fsSync.existsSync(path.join(scene.peerBrain, 'settings.json')),
          ).toEqual(false);
        });

        then('it names when the peer session picks the bind up', () => {
          expect(out.stdout).toContain('   └─ reach');
          expect(out.stdout).toContain(
            'this session = .agent/.actors/actor.via.slug=peer/brain/.claude',
          );
          expect(out.stdout).toContain(
            '   ├─ takes effect = at each rhx enroll session',
          );
        });

        then('its stdout matches the reach snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (from a peer session)',
          );
        });
      });

      when('[t1] the init runs again from the same peer session', () => {
        const rerun = useBeforeAll(async () =>
          runInit({
            cwd: scene.repo,
            home: scene.home,
            configDir: scene.peerBrain,
          }),
        );

        then('it reports already configured, and still names the reach', () => {
          expect(rerun.exitCode).toEqual(0);
          expect(rerun.stdout).toContain('status = already configured');
          expect(rerun.stdout).toContain('   └─ reach');
        });

        then('its stdout matches the reach snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: rerun.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - already configured (from a peer session)',
          );
        });
      });
    },
  );

  given(
    '[case6d] a split-layout repo, run from a session of the repo actor itself',
    () => {
      // the commonest real caller: a driver clone of the repo actor. its config dir is the
      // brain dir behind `.claude`, reached by its real path, so no peer reach note is owed
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case6d',
          roles: ['driver'],
          grove: 'present',
        }),
      );

      when(
        '[t0] the init runs with CLAUDE_CONFIG_DIR at the repo actor',
        () => {
          const out = useBeforeAll(async () =>
            runInit({
              cwd: scene.repo,
              home: scene.home,
              configDir: fsSync.realpathSync(scene.brain),
            }),
          );

          then('it binds, and prints no peer reach note', () => {
            expect(out.exitCode).toEqual(0);
            expect(out.stdout).toContain('status = configured');
            expect(out.stdout).not.toContain('reach');
            expect(out.stdout).not.toContain('this session =');
          });
        },
      );
    },
  );

  given(
    '[case7] a split-layout repo whose grove is absent, so the arrows dangle',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case7',
          roles: ['driver'],
          grove: 'nodir',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });

        then('it binds settings.of.repo.json', () => {
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });

        then('it creates no grove under HOME', () => {
          expect(fsSync.existsSync(path.join(scene.home, '.claude'))).toEqual(
            false,
          );
        });
      });
    },
  );

  given(
    '[case6c] a split-layout repo that holds an older statusLine of ours',
    () => {
      // the skill-slug form a prior release wrote; ownership names it ours, so it updates
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case6c',
          roles: ['driver'],
          grove: 'present',
          repoSettings: JSON.stringify({
            statusLine: { type: 'command', command: 'rhx route.status.line' },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then(
          'it updates our line in place, never skips it as a human own',
          () => {
            expect(out.exitCode).toEqual(0);
            expect(out.stdout).toContain('status = configured');
            expect(out.repoSettings.statusLine?.command).toEqual(
              RENDERER_COMMAND,
            );
          },
        );
      });
    },
  );

  given(
    '[case6e] a split-layout repo that holds the cli/route barrel command of ours',
    () => {
      // the command every repo held before the isolated subpath: it loads the whole
      // `cli/route` barrel per repaint. ownership names it ours, so `rhx upgrade` moves it
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case6e',
          roles: ['driver'],
          grove: 'present',
          repoSettings: JSON.stringify({
            statusLine: {
              type: 'command',
              command: RENDERER_COMMAND_VIA_BARREL,
              padding: 0,
            },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it rewrites our line to the isolated subpath', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = configured');
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });

        then('its stdout matches the barrel-migration snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (barrel migrated)',
          );
        });
      });

      when('[t1] the init runs a second time', () => {
        const rerun = useBeforeAll(async () =>
          runInit({ cwd: scene.repo, home: scene.home }),
        );

        then(
          'it reports already configured: the migration is idempotent',
          () => {
            expect(rerun.stdout).toContain('status = already configured');
          },
        );

        then('its stdout matches the barrel-migration rerun snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: rerun.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - already configured (barrel migrated)',
          );
        });
      });
    },
  );

  given(
    '[case6f] a split-layout repo that holds the node subpath command of ours',
    () => {
      // the command every repo held before the bash reader: it boots node per repaint.
      // ownership names it ours, so `rhx upgrade` moves it to the bash reader
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case6f',
          roles: ['driver'],
          grove: 'present',
          repoSettings: JSON.stringify({
            statusLine: {
              type: 'command',
              command: RENDERER_COMMAND_VIA_NODE,
              padding: 0,
            },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then(
          'it rewrites our line to the bash reader, read once a minute',
          () => {
            expect(out.exitCode).toEqual(0);
            expect(out.stdout).toContain('status = configured');
            expect(out.repoSettings.statusLine).toEqual({
              type: 'command',
              command: RENDERER_COMMAND,
              padding: 0,
              refreshInterval: 60,
            });
          },
        );

        then('its stdout matches the node-migration snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (node subpath migrated)',
          );
        });
      });

      when('[t1] the init runs a second time', () => {
        const rerun = useBeforeAll(async () =>
          runInit({ cwd: scene.repo, home: scene.home }),
        );

        then(
          'it reports already configured: the migration is idempotent',
          () => {
            expect(rerun.stdout).toContain('status = already configured');
          },
        );

        then('its stdout matches the node-migration rerun snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: rerun.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - already configured (node subpath migrated)',
          );
        });
      });
    },
  );

  given(
    '[case7b] a split-layout repo whose grove settings are not valid json',
    () => {
      const scene = useBeforeAll(async () => {
        const layout = await genSplitLayout({
          slug: 'statusline-init-case7b',
          roles: ['driver'],
          grove: 'present',
        });
        await fs.writeFile(
          path.join(layout.home, '.claude', 'settings.json'),
          '{ "theme": ',
        );
        return layout;
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          const grove = await fs.readFile(
            path.join(scene.home, '.claude', 'settings.json'),
            'utf-8',
          );
          return { ...result, repoSettings, grove };
        });

        then(
          'it binds: the grove is the human file to repair, never a fault of the init',
          () => {
            expect(out.exitCode).toEqual(0);
            expect(out.repoSettings.statusLine?.command).toEqual(
              RENDERER_COMMAND,
            );
          },
        );

        then('it leaves the grove untouched', () => {
          expect(out.grove).toEqual('{ "theme": ');
        });
      });
    },
  );

  given('[case8] a split-layout repo with no settings.of.repo.json yet', () => {
    const scene = useBeforeAll(async () =>
      genSplitLayout({
        slug: 'statusline-init-case8',
        roles: ['driver'],
        grove: 'present',
        repoSettings: null,
      }),
    );

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const result = runInit({ cwd: scene.repo, home: scene.home });
        const repoSettings = await readJson(
          path.join(scene.brain, 'settings.of.repo.json'),
        );
        return { ...result, repoSettings };
      });

      then('it seeds and binds settings.of.repo.json, not the arrow', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.repoSettings.statusLine?.command).toEqual(RENDERER_COMMAND);
      });

      then(
        'its stdout, with a seeded target and no backup, matches the snapshot',
        () => {
          expect(out.stdout).toContain('backup = none');
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (split layout, seeded)',
          );
        },
      );
    });
  });

  given(
    '[case9] a split-layout repo whose actor is NOT enrolled with driver',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case9',
          roles: ['any', 'mechanic'],
          grove: 'present',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it exits 0 and skips', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('driver is not linked');
        });

        then('its skip names the next move', () => {
          expect(out.stdout).toContain(
            '└─ fix: to bind the route status line, link driver: rhx init --roles driver',
          );
        });

        then('it writes no statusLine', () => {
          expect(out.repoSettings.statusLine).toBeUndefined();
        });

        then('its skip stdout matches the snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'init.claude.status-line - skipped (actor lacks driver)',
          );
        });
      });
    },
  );

  given(
    '[case10] a split-layout repo whose grove holds a human statusLine',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case10',
          roles: ['driver'],
          grove: 'present',
          groveSettings: {
            statusLine: { type: 'command', command: '~/bin/my-line' },
          },
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it skips, to never hide the human statusLine', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('layer = grove');
          expect(out.repoSettings.statusLine).toBeUndefined();
        });

        then('its skip stdout matches the snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'init.claude.status-line - skipped (human line in the grove)',
          );
        });
      });
    },
  );

  given(
    '[case11] a split-layout repo whose settings.of.repo.json is malformed',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case11',
          roles: ['driver'],
          grove: 'present',
          repoSettings: '{ "hooks": ',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const raw = await fs.readFile(
            path.join(scene.brain, 'settings.of.repo.json'),
            'utf-8',
          );
          return { ...result, raw };
        });

        then('it exits 0, so rhx init and rhx upgrade carry on', () => {
          expect(out.exitCode).toEqual(0);
        });

        then('it warns on stderr, with the fix', () => {
          expect(out.stderr).toContain('is not valid json');
        });

        then('it leaves the file untouched', () => {
          expect(out.raw).toEqual('{ "hooks": ');
        });

        then('its warn is a tree: header, status, reason, target, fix', () => {
          expect(out.stderr.split('\n').slice(2, 7)).toEqual([
            '🗿 init.claude.status-line',
            '   ├─ status = not configured',
            '   ├─ reason = the settings target is not valid json',
            '   ├─ settings = .claude/settings.of.repo.json',
            '   └─ fix: repair the json in that file, then rerun the init',
          ]);
        });

        then('its raw warn stderr matches the snapshot', () => {
          expect(out.stderr).toMatchSnapshot(
            'init.claude.status-line - warn (malformed json)',
          );
        });
      });
    },
  );

  given(
    '[case11b] a split-layout repo whose settings.of.repo.json is valid json, but an array',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case11b',
          roles: ['driver'],
          grove: 'present',
          repoSettings: '[]',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const raw = await fs.readFile(
            path.join(scene.brain, 'settings.of.repo.json'),
            'utf-8',
          );
          return { ...result, raw };
        });

        then('it exits 0, so rhx init and rhx upgrade carry on', () => {
          expect(out.exitCode).toEqual(0);
        });

        then('it warns that the target is not a json object', () => {
          expect(out.stderr).toContain('status = not configured');
          expect(out.stderr).toContain('valid json, but not an object');
        });

        then('it leaves the file untouched', () => {
          expect(out.raw).toEqual('[]');
        });

        then('its raw warn stderr matches the snapshot', () => {
          expect(asStableWarnStderr({ stderr: out.stderr })).toMatchSnapshot(
            'init.claude.status-line - warn (not a json object)',
          );
        });
      });
    },
  );

  given(
    '[case17] a split-layout repo with driver linked, whose settings.of.repo.json holds a human statusLine',
    () => {
      const humanStatusLine = {
        type: 'command',
        command: './my-own-status.sh',
      };
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case17',
          roles: ['driver'],
          grove: 'present',
          repoSettings: JSON.stringify({ statusLine: humanStatusLine }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it exits 0 and leaves the human statusLine intact', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.repoSettings.statusLine).toEqual(humanStatusLine);
        });

        then(
          'it skips, names the repo layer, and names the human command',
          () => {
            expect(out.stdout).toContain('status = skipped');
            expect(out.stdout).toContain('layer = repo');
            expect(out.stdout).toContain(
              'settings = .claude/settings.of.repo.json',
            );
            expect(out.stdout).toContain('yours = ./my-own-status.sh');
          },
        );

        then('its skip stdout matches the snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - skipped (human line in the repo layer, split)',
          );
        });
      });
    },
  );

  given('[case18] a jq that faults on the compare', () => {
    const scene = useBeforeAll(async () => {
      const layout = await genSplitLayout({
        slug: 'statusline-init-case18',
        roles: ['driver'],
        grove: 'present',
      });
      // a shim that passes every call through, except the before/after compare. the shim
      // dir leads PATH, so the real jq is what PATH holds once that first entry is dropped
      const shimDir = path.join(layout.repo, '.scratch-jq');
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
      return { ...layout, shimDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () =>
        runInit({
          cwd: scene.repo,
          home: scene.home,
          pathPrefix: scene.shimDir,
        }),
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
          'init.claude.status-line - malfunction (jq faults on the compare)',
        );
      });
    });
  });

  given(
    '[case12] a split-layout repo whose settings.of.repo.json is a link',
    () => {
      const scene = useBeforeAll(async () => {
        const layout = await genSplitLayout({
          slug: 'statusline-init-case12',
          roles: ['driver'],
          grove: 'present',
          repoSettings: null,
        });
        const elsewhere = path.join(layout.home, 'elsewhere.json');
        await fs.writeFile(elsewhere, '{}');
        await fs.symlink(
          elsewhere,
          path.join(layout.brain, 'settings.of.repo.json'),
        );
        return { ...layout, elsewhere };
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const elsewhere = await fs.readFile(scene.elsewhere, 'utf-8');
          return { ...result, elsewhere };
        });

        then('it exits 0 and warns, with the fix', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toContain('is a link');
        });

        then('it never writes through the link', () => {
          expect(out.elsewhere).toEqual('{}');
        });

        then('the snapshot tokenizes the link path, and no other byte', () => {
          expect(asStableWarnStderr({ stderr: out.stderr })).toEqual(
            out.stderr.replace(scene.elsewhere, '<path>'),
          );
        });

        then('its warn stderr matches the snapshot', () => {
          expect(asStableWarnStderr({ stderr: out.stderr })).toMatchSnapshot(
            'init.claude.status-line - warn (linked target)',
          );
        });
      });
    },
  );

  given(
    '[case13] a split-layout repo whose settings.json link was replaced with a real file by the published init',
    () => {
      // the wish's own state: the prior init's temp + mv put a real settings.json
      // where the arrow belongs, beside settings.of.repo.json, until the next enroll
      const scene = useBeforeAll(async () => {
        const layout = await genSplitLayout({
          slug: 'statusline-init-case13',
          roles: ['driver'],
          grove: 'present',
          repoSettings: JSON.stringify({ hooks: { Stop: [] } }),
        });
        await fs.unlink(path.join(layout.brain, 'settings.json'));
        // the stray holds the line the published init wrote there: our older statusLine
        await fs.writeFile(
          path.join(layout.brain, 'settings.json'),
          JSON.stringify({
            theme: 'dark',
            statusLine: { type: 'command', command: RENDERER_COMMAND },
          }),
        );
        return layout;
      });

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          const clobbered = await readJson(
            path.join(scene.brain, 'settings.json'),
          );
          return { ...result, repoSettings, clobbered };
        });

        then('it binds settings.of.repo.json, the file rhachet keeps', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = configured');
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });

        then('its stdout matches the snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (a stray real settings.json beside)',
          );
        });

        then(
          'it never writes the real settings.json rhachet will replace',
          () => {
            expect(out.clobbered).toEqual({
              theme: 'dark',
              statusLine: { type: 'command', command: RENDERER_COMMAND },
            });
          },
        );
      });
    },
  );

  given(
    '[case14] a repo that just linked driver, whose actor record predates the link',
    () => {
      // rhachet rewrites the repo actor's actor.json only at a clone enroll, so at
      // `rhx init --roles driver` in an extant repo the record still lists the old roles
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case14',
          roles: ['any', 'mechanic', 'driver'],
          record: JSON.stringify({
            schemaVersion: 1,
            brain: 'claude',
            roles: ['any', 'mechanic'],
            rolesDelta: null,
          }),
          grove: 'present',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it binds, from the linked roles, never the stale record', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = configured');
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });

        then('it never reports a false skip', () => {
          expect(out.stdout).not.toContain('driver is not linked');
        });

        then('its stdout matches the snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - configured (the record lags the link)',
          );
        });
      });
    },
  );

  given(
    '[case14b] a repo with driver linked, whose actor record is not valid json',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case14b',
          roles: ['driver'],
          record: '{ "roles": ',
          grove: 'present',
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it binds: the gate never reads the record', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toEqual('');
          expect(out.repoSettings.statusLine?.command).toEqual(
            RENDERER_COMMAND,
          );
        });
      });
    },
  );

  given(
    '[case14c] a repo whose driver link is gone, while its actor record still lists driver',
    () => {
      // the converse of case14: a record that lags an unlink must not keep the line alive
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case14c',
          roles: ['any', 'mechanic'],
          record: JSON.stringify({
            schemaVersion: 1,
            brain: 'claude',
            roles: ['any', 'mechanic', 'driver'],
            rolesDelta: null,
          }),
          grove: 'present',
          repoSettings: JSON.stringify({
            statusLine: { type: 'command', command: RENDERER_COMMAND },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it takes our line back, from the linked roles', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = removed');
          expect(out.repoSettings.statusLine).toBeUndefined();
        });
      });
    },
  );

  given(
    '[case15] a split-layout repo whose actor dropped driver after the bind',
    () => {
      // the line was written while the actor carried driver; left in place, rhachet
      // derives it to every peer actor, which the driver-only gate forbids
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case15',
          roles: ['any', 'mechanic'],
          grove: 'present',
          repoSettings: JSON.stringify({
            hooks: { Stop: [] },
            statusLine: { type: 'command', command: RENDERER_COMMAND },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          const backups = (await fs.readdir(scene.brain)).filter((f) =>
            f.endsWith('.bak.json'),
          );
          return { ...result, repoSettings, backups };
        });

        then('it exits 0 and reports the removal', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('status = removed');
        });

        then('it removes our statusLine', () => {
          expect(out.repoSettings.statusLine).toBeUndefined();
        });

        then('it keeps every other key', () => {
          expect(out.repoSettings.hooks).toEqual({ Stop: [] });
        });

        then('it backs up the prior file', () => {
          expect(out.backups).toHaveLength(1);
        });

        then('its stdout matches the snapshot', () => {
          expect(
            asStableInstallerStdout({ stdout: out.stdout }),
          ).toMatchSnapshot(
            'init.claude.status-line - removed (actor dropped driver)',
          );
        });
      });
    },
  );

  given(
    '[case16] a split-layout repo, actor without driver, whose statusLine belongs to the human',
    () => {
      const scene = useBeforeAll(async () =>
        genSplitLayout({
          slug: 'statusline-init-case16',
          roles: ['any'],
          grove: 'present',
          repoSettings: JSON.stringify({
            statusLine: { type: 'command', command: '~/bin/my-line' },
          }),
        }),
      );

      when('[t0] the init runs', () => {
        const out = useBeforeAll(async () => {
          const result = runInit({ cwd: scene.repo, home: scene.home });
          const repoSettings = await readJson(
            path.join(scene.brain, 'settings.of.repo.json'),
          );
          return { ...result, repoSettings };
        });

        then('it skips, and never removes a statusLine it does not own', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stdout).toContain('driver is not linked');
          expect(out.repoSettings.statusLine?.command).toEqual('~/bin/my-line');
        });

        then('its skip stdout matches the snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'init.claude.status-line - skipped (human line kept, actor lacks driver)',
          );
        });
      });
    },
  );
});
