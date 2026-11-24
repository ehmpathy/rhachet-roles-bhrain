import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = coverage for the `audit.test.intentions` skill, through the entrypoint a human types
 * .why = its verdict decides whether a branch weakened a test; a false clean is the costly fault
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no resolution rides the cwd. each case runs in its own temp git
 *         repo, so the refs it reads are hermetic
 */
const ROOT = path.join(__dirname, '../../../..');
const SKILL = path.join(ROOT, '.agent/repo=.this/role=any/skills/audit.test.intentions.sh');

const SUITE_BEFORE = [
  "import { given, then } from 'test-fns';",
  '',
  "given('a wave', () => {",
  "  then('it breaks', () => {",
  '    expect(breaks({ height: 3 })).toEqual(true);',
  '  });',
  "  then('it rolls', () => {",
  '    expect(rolls({ height: 3 })).toEqual(false);',
  '  });',
  '});',
  '',
].join('\n');

const runSkill = (input: { cwd: string }): { stdout: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, '--base', 'base'], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { stdout: result.stdout ?? '', exitCode: result.status ?? 1 };
};

/**
 * .what = a temp git repo with one suite on a `base` branch, then the given edit on HEAD
 * .note = `after: null` leaves the suite as is, for a case that moves or removes it instead
 */
const genRepoWithEdit = (input: { slug: string; after: string | null }): { tempDir: string } => {
  const tempDir = fs.realpathSync(genTempDir({ slug: input.slug, git: true }));
  const suitePath = path.join(tempDir, 'wave.test.ts');
  fs.writeFileSync(suitePath, SUITE_BEFORE);
  execSync('git add wave.test.ts && git commit -m before --no-verify && git branch base', {
    cwd: tempDir,
  });
  if (input.after === null) return { tempDir };

  // commit the edit on HEAD
  fs.writeFileSync(suitePath, input.after);
  execSync('git commit -am after --no-verify', { cwd: tempDir });
  return { tempDir };
};

describe('audit.test.intentions.integration', () => {
  given('[case1] a branch that only rewraps and requotes a suite', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithEdit({
        slug: 'audit-intent-rewrap',
        after: SUITE_BEFORE.replace("'test-fns'", '"test-fns"').replace(
          'expect(breaks({ height: 3 })).toEqual(true);',
          'expect(\n      breaks({ height: 3 }),\n    ).toEqual(true);',
        ),
      }),
    );

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('the suite reads token-identical', () => {
        expect(out.stdout).toContain('identical: 1');
        expect(out.stdout).toContain('changed: 0');
      });
      then('the output matches the snapshot', () => {
        expect(out.stdout.replace(/@ [a-f0-9]{8}/, '@ [SHA]')).toMatchSnapshot();
      });
    });
  });

  given('[case2] a branch that changes an expected value', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithEdit({
        slug: 'audit-intent-value',
        after: SUITE_BEFORE.replace('toEqual(false)', 'toEqual(true)'),
      }),
    );

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0, since no block or assertion was lost', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('it names the suite as token-changed, with the swapped value', () => {
        expect(out.stdout).toContain('changed: 1');
        expect(out.stdout).toContain('wave.test.ts');
        expect(out.stdout).toContain('removed: false');
        expect(out.stdout).toContain('added: true');
      });
    });
  });

  given('[case4] a branch that retires a suite byte for byte', () => {
    const scene = useBeforeAll(async () => {
      const { tempDir } = genRepoWithEdit({ slug: 'audit-intent-retire', after: null });
      execSync('git mv wave.test.ts wave.test.ts.retired && git commit -m retire --no-verify', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0, since the retired twin holds every block', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('it counts the suite as retired, not deleted', () => {
        expect(out.stdout).toContain('retired: 1');
        expect(out.stdout).toContain('deleted: 0');
        expect(out.stdout).toContain('blocks: 3 → 3');
      });
    });
  });

  given('[case5] a branch that deletes a suite', () => {
    const scene = useBeforeAll(async () => {
      const { tempDir } = genRepoWithEdit({ slug: 'audit-intent-delete', after: null });
      execSync('git rm -q wave.test.ts && git commit -m drop --no-verify', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 2', () => {
        expect(out.exitCode).toEqual(2);
      });
      then('it names the deleted suite and the blocks it took', () => {
        expect(out.stdout).toContain(
          'suite deleted, no twin: wave.test.ts (3 blocks, 2 assertions)',
        );
      });
    });
  });

  given('[case7] a branch that moves a suite to another dir', () => {
    const scene = useBeforeAll(async () => {
      const { tempDir } = genRepoWithEdit({ slug: 'audit-intent-move', after: null });
      execSync('mkdir sea && git mv wave.test.ts sea/wave.test.ts && git commit -m move --no-verify', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('it counts the suite as moved, its blocks intact', () => {
        expect(out.stdout).toContain('moved: 1');
        expect(out.stdout).toContain('deleted: 0');
        expect(out.stdout).toContain('blocks: 3 → 3');
      });
    });
  });

  given('[case8] a branch whose report outruns the pipe buffer', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.realpathSync(genTempDir({ slug: 'audit-intent-large', git: true }));
      const names = Array.from({ length: 600 }, (_, i) => `wave.of.a.long.swell.at.the.reef.${i}.test.ts`);
      names.forEach((name) => fs.writeFileSync(path.join(tempDir, name), SUITE_BEFORE));
      execSync('git add . && git commit -qm before --no-verify && git branch base', { cwd: tempDir });
      names.forEach((name) =>
        fs.writeFileSync(path.join(tempDir, name), SUITE_BEFORE.replace('height: 3', 'height: 4')),
      );
      execSync('git commit -qam after --no-verify', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] the audit runs into a reader that waits a second before it drains the pipe', () => {
      const out = useBeforeAll(async () => {
        const result = spawnSync(
          'bash',
          ['-c', 'set -o pipefail; bash "$0" --base base | { sleep 1; cat; }', SKILL],
          { cwd: scene.tempDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
        );
        return { stdout: result.stdout ?? '', exitCode: result.status ?? 1 };
      });

      then('the report is past the 64KB pipe buffer', () => {
        expect(Buffer.byteLength(out.stdout)).toBeGreaterThan(64 * 1024);
      });
      then('the verdict, the last line, still arrives', () => {
        expect(out.stdout.trim().split('\n').at(-1)).toContain('no skip added, no block or assertion lost');
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case9] a branch that adds a test whose string literal names a skip', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithEdit({
        slug: 'audit-intent-skip-in-string',
        after: SUITE_BEFORE.replace(
          "  then('it rolls', () => {",
          "  then('its fixture text holds then.skip(', () => {\n    expect(\"then.skip('a wave'\").toContain('skip');\n  });\n  then('it rolls', () => {",
        ),
      }),
    );

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0, since no code skips a test', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('it counts no skip added', () => {
        expect(out.stdout).toContain('skips added: 0');
      });
    });
  });

  given('[case6] a branch that only moves tokens, as an import hoist does', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithEdit({
        slug: 'audit-intent-reorder',
        after: SUITE_BEFORE.replace(
          "  then('it breaks', () => {\n    expect(breaks({ height: 3 })).toEqual(true);\n  });\n  then('it rolls', () => {\n    expect(rolls({ height: 3 })).toEqual(false);\n  });",
          "  then('it rolls', () => {\n    expect(rolls({ height: 3 })).toEqual(false);\n  });\n  then('it breaks', () => {\n    expect(breaks({ height: 3 })).toEqual(true);\n  });",
        ),
      }),
    );

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
      then('the suite reads reordered, not changed', () => {
        expect(out.stdout).toContain('reordered, none added or removed: 1');
        expect(out.stdout).toContain('changed: 0');
      });
    });
  });

  given('[case3] a branch that skips a test and drops an assertion', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithEdit({
        slug: 'audit-intent-skip',
        after: SUITE_BEFORE.replace("then('it breaks'", "then.skip('it breaks'").replace(
          '    expect(rolls({ height: 3 })).toEqual(false);\n',
          '',
        ),
      }),
    );

    when('[t0] the audit runs', () => {
      const out = useBeforeAll(async () => runSkill({ cwd: scene.tempDir }));

      then('it exits 2', () => {
        expect(out.exitCode).toEqual(2);
      });
      then('it names the skip and the lost assertion', () => {
        expect(out.stdout).toContain('skips added: 1');
        expect(out.stdout).toContain('assertions lost in wave.test.ts: 1');
      });
      then('the output matches the snapshot', () => {
        expect(out.stdout.replace(/@ [a-f0-9]{8}/, '@ [SHA]')).toMatchSnapshot();
      });
    });
  });
});
