import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { spawnSync } from 'node:child_process';
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
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const result = spawnSync('/bin/bash', [INIT_PATH], {
    cwd: input.cwd,
    encoding: 'utf-8',
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status,
  };
};

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
    });

    when('[t1] the init runs a second time', () => {
      const out = useBeforeAll(async () => runInit({ cwd: scene.tempDir }));

      then('it reports already healed', () => {
        expect(out.stdout).toContain('status = already healed');
      });

      then('it prints no fault line', () => {
        expect(out.stderr).not.toContain('failed at line');
      });
    });
  });
});
