import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumFilesForReviewSupplies } from './enumFilesForReviewSupplies';

/**
 * .what = boundary coverage for the supplies usecase (rules/refs discovery)
 * .why = this is the most critical review usecase: supplies are EXPLICITLY
 *        pointed at via --rules / --refs, and they live in the gitignored
 *        .agent/repo=* dirs (often behind symlinks into node_modules)
 *
 * .contract = a supply file loads iff it matches the caller's glob. gitignore
 *        is NOT applied to supplies (that is a subjects concern); the glob walk
 *        excludes only node_modules/.git and uses suppressErrors so a restricted
 *        dir cannot crash the scan. supplies never inject files the glob did not
 *        match.
 */
describe('enumFilesForReviewSupplies — glob-driven discovery boundaries', () => {
  // shared git repo fixture:
  //   tmp/  (git init)
  //     ├── .gitignore        (.agent/  build/  shared/)
  //     ├── .agent/
  //     │     └── repo=x/
  //     │           ├── rule.md                          (gitignored → loads)
  //     │           ├── notes.txt                        (.agent but wrong ext)
  //     │           ├── role=mechanic/briefs/rule.deep.md (deep ** match)
  //     │           └── briefs → ../../shared/briefs      (symlink into gitignored shared/)
  //     ├── shared/
  //     │     └── briefs/rule.linked.md   (gitignored; loads via .agent symlink)
  //     ├── build/
  //     │     └── junk.md                 (gitignored non-.agent → loads for supplies)
  //     ├── node_modules/pkg/readme.md    (never loads)
  //     └── src/
  //           └── ref.md                  (not ignored → loads)

  const scene = useBeforeAll(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'supplies-bound-'));
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });

    await fs.writeFile(
      path.join(tmpDir, '.gitignore'),
      '.agent/\nbuild/\nshared/\n',
    );

    // .agent supplies (all gitignored via .agent/)
    const agentRepo = path.join(tmpDir, '.agent', 'repo=x');
    await fs.mkdir(path.join(agentRepo, 'role=mechanic', 'briefs'), {
      recursive: true,
    });
    await fs.writeFile(path.join(agentRepo, 'rule.md'), '# rule\n');
    await fs.writeFile(path.join(agentRepo, 'notes.txt'), 'notes\n');
    await fs.writeFile(
      path.join(agentRepo, 'role=mechanic', 'briefs', 'rule.deep.md'),
      '# deep\n',
    );

    // symlinked supply: .agent/repo=x/briefs -> ../../shared/briefs
    // .note = mirrors production where .agent dirs symlink into node_modules
    const sharedBriefs = path.join(tmpDir, 'shared', 'briefs');
    await fs.mkdir(sharedBriefs, { recursive: true });
    await fs.writeFile(path.join(sharedBriefs, 'rule.linked.md'), '# linked\n');
    await fs.symlink(
      path.join('..', '..', 'shared', 'briefs'),
      path.join(agentRepo, 'briefs'),
    );

    // a gitignored non-.agent file: supplies load it when the glob matches
    const buildDir = path.join(tmpDir, 'build');
    await fs.mkdir(buildDir);
    await fs.writeFile(path.join(buildDir, 'junk.md'), '# junk\n');

    // node_modules must never load even if the glob would match
    const pkgDir = path.join(tmpDir, 'node_modules', 'pkg');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'readme.md'), '# pkg\n');

    // non-ignored source supply
    const srcDir = path.join(tmpDir, 'src');
    await fs.mkdir(srcDir);
    await fs.writeFile(path.join(srcDir, 'ref.md'), '# ref\n');

    return { tmpDir };
  });

  afterAll(async () => {
    await fs.rm(scene.tmpDir, { recursive: true, force: true });
  });

  given('[case1] glob reaches the gitignored .agent supplies', () => {
    when('[t0] supplies scan .agent/**/*.md', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSupplies({
          glob: '.agent/**/*.md',
          cwd: scene.tmpDir,
        }),
      }));

      then('loads the top-level gitignored .agent rule', () => {
        expect(res.files).toContain('.agent/repo=x/rule.md');
      });

      then('loads a deeply nested .agent rule (** match)', () => {
        expect(res.files).toContain(
          '.agent/repo=x/role=mechanic/briefs/rule.deep.md',
        );
      });

      then('loads a supply reached via a symlink under .agent', () => {
        expect(res.files).toContain('.agent/repo=x/briefs/rule.linked.md');
      });

      then('honors the caller glob ext (.md not .txt)', () => {
        expect(res.files.some((f) => f.endsWith('notes.txt'))).toBe(false);
      });
    });
  });

  given('[case2] glob spans the whole repo', () => {
    when('[t0] supplies scan **/*.md', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSupplies({
          glob: '**/*.md',
          cwd: scene.tmpDir,
        }),
      }));

      then('loads non-ignored source supplies', () => {
        expect(res.files).toContain('src/ref.md');
      });

      then('loads gitignored .agent supplies', () => {
        expect(res.files).toContain('.agent/repo=x/rule.md');
      });

      then(
        'loads a gitignored non-.agent supply (gitignore not applied)',
        () => {
          // supplies are explicitly pointed; the broad glob matched it, so it loads
          expect(res.files).toContain('build/junk.md');
        },
      );

      then('never loads node_modules', () => {
        expect(res.files.some((f) => f.includes('node_modules'))).toBe(false);
      });
    });
  });

  given('[case3] glob is scoped to src and never reaches .agent', () => {
    // .note = the central guarantee: supplies never inject files the caller's
    //         glob did not match
    when('[t0] supplies scan src/**/*.md', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSupplies({
          glob: 'src/**/*.md',
          cwd: scene.tmpDir,
        }),
      }));

      then('loads the in-scope source supply', () => {
        expect(res.files).toContain('src/ref.md');
      });

      then('injects no .agent files', () => {
        expect(res.files.some((f) => f.startsWith('.agent/'))).toBe(false);
      });

      then('injects no out-of-scope files', () => {
        expect(res.files.every((f) => f.startsWith('src/'))).toBe(true);
      });
    });
  });

  given('[case4] glob matches no files', () => {
    when('[t0] supplies scan a pattern with zero matches', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSupplies({
          glob: 'src/**/*.xyz',
          cwd: scene.tmpDir,
        }),
      }));

      then('returns an empty array', () => {
        expect(res.files).toEqual([]);
      });
    });
  });
});

describe('enumFilesForReviewSupplies — restricted permission robustness', () => {
  // .note = supplies must survive a mode-000 dir inside the scan scope without
  //         a crash; the glob walk uses suppressErrors
  //
  // fixture (own dir so the chmod never bleeds into other cases):
  //   tmp/
  //     ├── .agent/repo=x/rule.md   (supply → loads)
  //     ├── locked/  (mode 000)     (unreadable → skipped, must not crash)
  //     │     └── secret.md
  //     └── src/ref.md              (loads)

  let tmpDir: string;
  let lockedDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'supplies-locked-'));

    const agentRepo = path.join(tmpDir, '.agent', 'repo=x');
    await fs.mkdir(agentRepo, { recursive: true });
    await fs.writeFile(path.join(agentRepo, 'rule.md'), '# rule\n');

    const srcDir = path.join(tmpDir, 'src');
    await fs.mkdir(srcDir);
    await fs.writeFile(path.join(srcDir, 'ref.md'), '# ref\n');

    lockedDir = path.join(tmpDir, 'locked');
    await fs.mkdir(lockedDir);
    await fs.writeFile(path.join(lockedDir, 'secret.md'), '# secret\n');
    await fs.chmod(lockedDir, 0o000);
  });

  afterAll(async () => {
    await fs.chmod(lockedDir, 0o755).catch(() => undefined);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  given('[case1] a mode-000 dir sits inside the scan scope', () => {
    when('[t0] supplies scan **/*.md', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSupplies({
          glob: '**/*.md',
          cwd: tmpDir,
        }),
      }));

      then('loads the .agent supply without a crash', () => {
        expect(res.files).toContain('.agent/repo=x/rule.md');
      });

      then('loads the source supply', () => {
        expect(res.files).toContain('src/ref.md');
      });

      then('skips the restricted dir', () => {
        expect(res.files.some((f) => f.includes('locked'))).toBe(false);
        expect(res.files.some((f) => f.includes('secret.md'))).toBe(false);
      });
    });
  });
});
