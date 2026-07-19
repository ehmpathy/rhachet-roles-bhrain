import { execFileSync } from 'child_process';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = integration tests for the driver status-line installer init
 * .why = verifies the bash + jq merge writes statusLine into .claude/settings.json,
 *        preserves other keys, and is idempotent — against the real filesystem
 *
 * .note = the init derives the target via `git rev-parse --show-toplevel`, so it
 *         runs from a git-backed temp dir (genTempDir({ git: true })) and the
 *         .claude/settings.json is created under that root
 */
const INIT_PATH = path.join(__dirname, 'init.claude.status-line.sh');

/**
 * .what = runs the installer init from a given working directory
 * .why = the init anchors on the cwd's git root, so cwd selects the target repo
 */
const runInit = (input: { cwd: string }): string => {
  return execFileSync('/bin/bash', [INIT_PATH], {
    cwd: input.cwd,
    encoding: 'utf-8',
  });
};

/**
 * .what = replaces the volatile backup filename (timestamp + pid) with a token
 * .why = the installer stdout names an ISO-dated, pid-tagged backup file; the
 *        snapshot must capture the owl-vibed message shape, not the volatile name
 */
const asStableInstallerStdout = (input: { stdout: string }): string => {
  return input.stdout.replace(
    /settings\.[0-9TZ-]+\.\d+\.bak\.json/g,
    'settings.<timestamp>.<pid>.bak.json',
  );
};

/**
 * .what = runs a copy of the installer from a dir that lacks its peer .jsonc
 * .why = the config-not-found path (exit 2) is a genuine caller-visible fault; to
 *        reach it, run a bare copy of the .sh where the .jsonc is absent, and
 *        capture stdout/stderr/exit like the harness would observe them
 */
const runInitFaultConfigAbsent = (input: {
  cwd: string;
  scriptCopy: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  try {
    const stdout = execFileSync('/bin/bash', [input.scriptCopy], {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status: number }).status
        : 1;
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String((error as { stderr: unknown }).stderr)
        : '';
    return { stdout: '', stderr, exitCode: status };
  }
};

/**
 * .what = tokenizes the renderer command in a merged settings object
 * .why = the merge-structure snapshot's signal is "statusLine added, prior keys kept";
 *        the command string itself is asserted verbatim in case1. jest's object printer
 *        renders the command's embedded shell double-quotes as a raw quote pileup (a
 *        visual blemish per rule.forbid.snapshot-visual-blemishes), so we tokenize just
 *        the command — the same tactic used for backups/timestamps/stacks elsewhere here
 */
const asStableMergedSettings = (input: {
  settings: Record<string, unknown>;
}): Record<string, unknown> => {
  const parsed = JSON.parse(JSON.stringify(input.settings));
  return {
    ...parsed,
    statusLine: { ...parsed.statusLine, command: '<renderer node -e command>' },
  };
};

/**
 * .what = tokenizes only the volatile config path in the real fault stderr
 * .why = the snapshot must derive from the ACTUAL captured stderr (not a
 *        hand-authored literal), so it catches genuine drift — a wrong emoji, a
 *        dropped branch, indentation shift. only the absolute path to the absent
 *        .jsonc is environment-volatile, so we `.replace()` just that (the same
 *        tactic asStableInstallerStdout uses for the backup filename); every other
 *        byte — the 🦉 header, the 🗿 tree, the bullets — is the real output
 */
const asStableInstallerFaultStderr = (input: { stderr: string }): string => {
  if (!input.stderr.includes('status-line config not found:'))
    return '<unexpected fault stderr shape>';
  return input.stderr.replace(
    /(status-line config not found: ).*(init\.claude\.status-line\.jsonc)/,
    '$1<path>/$2',
  );
};

describe('init.claude.status-line.integration', () => {
  given('[case1] a repo with no .claude/settings.json', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case1', git: true });
      return { tempDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const stdout = runInit({ cwd: scene.tempDir });
        const raw = await fs.readFile(
          path.join(scene.tempDir, '.claude', 'settings.json'),
          'utf-8',
        );
        return { stdout, settings: JSON.parse(raw) };
      });

      then('it creates settings.json with the statusLine block', () => {
        expect(out.settings.statusLine).toEqual({
          type: 'command',
          command:
            'node -e "import(\'rhachet-roles-bhrain/cli/route\').then(m => m.routeStatusLine())"',
          padding: 0,
        });
      });

      then('it reports the status line was configured', () => {
        expect(out.stdout).toContain('status = configured');
      });

      then('its owl-vibed stdout matches the configured snapshot', () => {
        expect(asStableInstallerStdout({ stdout: out.stdout })).toMatchSnapshot(
          'init.claude.status-line - configured',
        );
      });
    });
  });

  given('[case2] a repo with a prior settings.json holding other keys', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case2', git: true });
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
      return { tempDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const stdout = runInit({ cwd: scene.tempDir });
        const raw = await fs.readFile(
          path.join(scene.tempDir, '.claude', 'settings.json'),
          'utf-8',
        );
        return { stdout, settings: JSON.parse(raw) };
      });

      then('it adds the statusLine key', () => {
        expect(out.settings.statusLine?.type).toEqual('command');
      });

      then('it preserves the prior hooks key', () => {
        expect(out.settings.hooks).toEqual({
          SessionStart: [{ matcher: '*', hooks: [] }],
        });
      });

      then('it preserves the prior permissions key', () => {
        expect(out.settings.permissions).toEqual({
          allow: ['Bash(echo:*)'],
          deny: [],
          ask: [],
        });
      });

      then('its merged settings.json matches the merge snapshot', () => {
        // the merge outcome is this case's distinct caller-visible variant: the
        // statusLine key is added while prior keys survive. snap the merged file
        // (command tokenized — asserted verbatim in case1) so a reviewer sees the
        // merge (not just the create-fresh of case1) without a quote-pileup blemish
        expect(
          asStableMergedSettings({ settings: out.settings }),
        ).toMatchSnapshot(
          'init.claude.status-line - merged into prior settings',
        );
      });
    });
  });

  given('[case3] a repo where the init already ran', () => {
    const listBackups = async (dir: string): Promise<string[]> =>
      (await fs.readdir(path.join(dir, '.claude'))).filter((f) =>
        f.endsWith('.bak.json'),
      );

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case3', git: true });
      // first run configures it, then note the backup count it left
      runInit({ cwd: tempDir });
      const backupsAfterFirst = await listBackups(tempDir);
      return { tempDir, backupCountAfterFirst: backupsAfterFirst.length };
    });

    when('[t0] the init runs a second time', () => {
      const out = useBeforeAll(async () => {
        const stdout = runInit({ cwd: scene.tempDir });
        const backupsAfterSecond = await listBackups(scene.tempDir);
        return { stdout, backupCountAfterSecond: backupsAfterSecond.length };
      });

      then('it reports already configured (idempotent no-op)', () => {
        expect(out.stdout).toContain('already configured');
      });

      then('the no-op run adds no new backup', () => {
        // the second run is a semantic no-op, so it must not create an
        // additional backup beyond whatever the first run left behind
        expect(out.backupCountAfterSecond).toEqual(scene.backupCountAfterFirst);
      });

      then('its owl-vibed no-op stdout matches the snapshot', () => {
        // the idempotent no-op is a distinct caller-visible variant; snap it so a
        // reviewer sees the "already configured" message and drift is caught
        expect(asStableInstallerStdout({ stdout: out.stdout })).toMatchSnapshot(
          'init.claude.status-line - already-configured no-op',
        );
      });
    });
  });

  given('[case4] a repo where a human set their own statusLine', () => {
    const humanStatusLine = {
      type: 'command',
      command: './my-own-status.sh',
      padding: 1,
    };

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-init-case4', git: true });
      await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ statusLine: humanStatusLine }, null, 2),
      );
      return { tempDir };
    });

    when('[t0] the init runs', () => {
      const out = useBeforeAll(async () => {
        const stdout = runInit({ cwd: scene.tempDir });
        const raw = await fs.readFile(
          path.join(scene.tempDir, '.claude', 'settings.json'),
          'utf-8',
        );
        return { stdout, settings: JSON.parse(raw) };
      });

      then('it leaves the human statusLine intact (skip-and-warn)', () => {
        // vision Q2: never clobber a human's own config
        expect(out.settings.statusLine).toEqual(humanStatusLine);
      });

      then('it reports that it left the human config intact', () => {
        expect(out.stdout).toContain('left intact');
      });

      then('its owl-vibed skip-and-warn stdout matches the snapshot', () => {
        expect(asStableInstallerStdout({ stdout: out.stdout })).toMatchSnapshot(
          'init.claude.status-line - skip-and-warn',
        );
      });
    });
  });

  given(
    '[case5] a run where the .jsonc config is absent (a genuine fault)',
    () => {
      const scene = useBeforeAll(async () => {
        // a git-backed repo to anchor on, plus a bare copy of the .sh placed in a
        // dir WITHOUT its peer .jsonc → the config-not-found guard fires (exit 2)
        const tempDir = genTempDir({
          slug: 'statusline-init-case5',
          git: true,
        });
        const scriptCopyDir = path.join(tempDir, '.scratch-init');
        await fs.mkdir(scriptCopyDir, { recursive: true });
        const scriptCopy = path.join(
          scriptCopyDir,
          'init.claude.status-line.sh',
        );
        await fs.copyFile(INIT_PATH, scriptCopy);
        return { tempDir, scriptCopy };
      });

      when('[t0] the init runs with no config beside it', () => {
        const out = useBeforeAll(async () =>
          runInitFaultConfigAbsent({
            cwd: scene.tempDir,
            scriptCopy: scene.scriptCopy,
          }),
        );

        then('it logs the config-not-found fault to stderr (fail-loud)', () => {
          expect(out.stderr).toContain('status-line config not found');
        });

        then('it exits 2 (a caller-must-fix constraint fault)', () => {
          expect(out.exitCode).toEqual(2);
        });

        then(
          'it writes no settings.json (the fault halts before any merge)',
          () => {
            // the guard fires before the settings target is touched, so no file is left
            const settingsPath = path.join(
              scene.tempDir,
              '.claude',
              'settings.json',
            );
            expect(fsSync.existsSync(settingsPath)).toEqual(false);
          },
        );

        then(
          'its stable fault stderr matches the error-variant snapshot',
          () => {
            expect(
              asStableInstallerFaultStderr({ stderr: out.stderr }),
            ).toMatchSnapshot(
              'init.claude.status-line - fault (config absent)',
            );
          },
        );
      });
    },
  );
});
