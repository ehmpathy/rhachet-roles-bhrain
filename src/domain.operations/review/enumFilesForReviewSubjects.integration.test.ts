import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumFilesForReviewSubjects } from './enumFilesForReviewSubjects';

describe('enumFilesForReviewSubjects', () => {
  const GITIGNORED_PATH =
    'src/domain.operations/review/.test/assets/example.gitignored';

  given('[case1] gitignored directory inside the repo', () => {
    // .note = committed fixture; secret.ts is untracked + gitignored, so git
    //         never lists it and the scan excludes it
    //
    // fixture: example.gitignored/
    //   ├── .gitignore (contains: restricted/)
    //   ├── allowed.ts
    //   └── restricted/
    //       └── secret.ts

    when('[t0] enumFilesForReviewSubjects scans **/*', () => {
      then('excludes the gitignored directory', async () => {
        const files = await enumFilesForReviewSubjects({
          glob: `${GITIGNORED_PATH}/**/*`,
        });

        // should find the non-ignored file
        expect(files).toContain(`${GITIGNORED_PATH}/allowed.ts`);

        // should NOT find files in the gitignored directory
        expect(files.some((f) => f.includes('restricted'))).toBe(false);
        expect(files.some((f) => f.includes('secret.ts'))).toBe(false);

        // snapshot the exact subject set for visible regression diffs in prs
        expect(files).toMatchSnapshot();
      });
    });
  });
});

describe('enumFilesForReviewSubjects — restricted permission crash vector', () => {
  // .note = regression for the EACCES crash on directories with no read permission
  //         reached directly (gitignored) or via a symlink from a non-ignored path.
  //         see: .behavior/v2026_06_23.fix-reviewer-scans/1.vision.yield.md
  //
  // fixture (a real git repo, built at runtime so the 000-mode dir never lands
  // in the repo):
  //   tmp/  (git init)
  //     ├── .gitignore           (contains: restricted/)
  //     ├── allowed.ts
  //     ├── restricted/          (mode 000)
  //     │     └── secret.ts
  //     └── open/                (NOT gitignored)
  //           └── link → ../restricted   (symlink into the restricted dir)

  let tmpDir: string;
  let restrictedDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'review-restricted-'));

    // a real git repo: subjects ask git which files are not ignored
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });

    await fs.writeFile(path.join(tmpDir, '.gitignore'), 'restricted/\n');
    await fs.writeFile(
      path.join(tmpDir, 'allowed.ts'),
      'export const allowed = 1;\n',
    );

    restrictedDir = path.join(tmpDir, 'restricted');
    await fs.mkdir(restrictedDir);
    await fs.writeFile(
      path.join(restrictedDir, 'secret.ts'),
      'export const secret = 1;\n',
    );

    // a symlink from a NON-gitignored path into the restricted dir
    // .note = git lists the symlink itself, never files through it, so the
    //         restricted target stays excluded even via this vector
    const openDir = path.join(tmpDir, 'open');
    await fs.mkdir(openDir);
    await fs.symlink('../restricted', path.join(openDir, 'link'));

    // drop all permissions to reproduce the EACCES on scandir
    await fs.chmod(restrictedDir, 0o000);
  });

  afterAll(async () => {
    // restore permissions so cleanup can recurse, then remove the fixture
    await fs.chmod(restrictedDir, 0o755).catch(() => undefined);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  given(
    '[case1] a gitignored restricted directory and a symlink into it',
    () => {
      when('[t0] subjects scan **/*', () => {
        then('does not throw and excludes the restricted dir', async () => {
          const files = await enumFilesForReviewSubjects({
            glob: '**/*',
            cwd: tmpDir,
          });

          // the readable, non-ignored file is present
          expect(files).toContain('allowed.ts');

          // the gitignored restricted dir and its contents are absent
          expect(files.some((f) => f.includes('restricted'))).toBe(false);
          expect(files.some((f) => f.includes('secret.ts'))).toBe(false);

          // no file leaks through the symlink into the restricted target
          expect(files.some((f) => f.startsWith('open/link/'))).toBe(false);
        });
      });
    },
  );
});

describe('enumFilesForReviewSubjects — vision edgecases via git', () => {
  // .note = proves the vision edgecases that git ls-files handles natively for
  //         subjects: nested .gitignore, negated patterns, untracked-not-ignored
  //         see: .behavior/v2026_06_23.fix-reviewer-scans/1.vision.yield.md edgecases
  //
  // fixture (a real git repo):
  //   tmp/  (git init)
  //     ├── .gitignore        (*.log)
  //     ├── tracked.ts        (untracked, not ignored → included)
  //     ├── app.log           (*.log gitignored → excluded)
  //     └── nested/
  //           ├── .gitignore  (secret.ts  and  !keep.secret.ts)
  //           ├── keep.secret.ts   (negated → re-included)
  //           ├── drop.secret.ts   (matches secret.ts? no — but secret.ts is exact)
  //           ├── secret.ts        (nested-ignored → excluded)
  //           └── code.ts          (not ignored → included)

  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'review-edgecases-'));
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });

    // root gitignore excludes *.log
    await fs.writeFile(path.join(tmpDir, '.gitignore'), '*.log\n');
    await fs.writeFile(
      path.join(tmpDir, 'tracked.ts'),
      'export const t = 1;\n',
    );
    await fs.writeFile(path.join(tmpDir, 'app.log'), 'log\n');

    // nested gitignore with a negated pattern
    const nestedDir = path.join(tmpDir, 'nested');
    await fs.mkdir(nestedDir);
    await fs.writeFile(
      path.join(nestedDir, '.gitignore'),
      'secret.ts\n!keep.secret.ts\n',
    );
    await fs.writeFile(
      path.join(nestedDir, 'secret.ts'),
      'export const s = 1;\n',
    );
    await fs.writeFile(
      path.join(nestedDir, 'keep.secret.ts'),
      'export const k = 1;\n',
    );
    await fs.writeFile(
      path.join(nestedDir, 'code.ts'),
      'export const c = 1;\n',
    );
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  given('[case1] untracked-but-not-ignored files', () => {
    when('[t0] subjects scan **/*.ts', () => {
      then('includes the untracked, non-ignored file', async () => {
        const files = await enumFilesForReviewSubjects({
          glob: '**/*.ts',
          cwd: tmpDir,
        });
        expect(files).toContain('tracked.ts');
      });
    });
  });

  given('[case2] a nested .gitignore', () => {
    when('[t0] subjects scan **/*.ts', () => {
      const res = useBeforeAll(async () => ({
        files: await enumFilesForReviewSubjects({
          glob: '**/*.ts',
          cwd: tmpDir,
        }),
      }));

      then('excludes a file ignored by the nested .gitignore', () => {
        expect(res.files).not.toContain('nested/secret.ts');
      });

      then('includes a non-ignored file beside it', () => {
        expect(res.files).toContain('nested/code.ts');
      });

      then('re-includes a file matched by a negated pattern', () => {
        // !keep.secret.ts negates the secret.ts ignore for this one file
        expect(res.files).toContain('nested/keep.secret.ts');
      });
    });
  });
});
