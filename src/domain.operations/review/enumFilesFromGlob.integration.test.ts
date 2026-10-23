import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { enumFilesFromGlob } from './enumFilesFromGlob';

const ASSETS_PATH = 'src/domain.operations/review/.test/assets/example.globs';

describe('enumFilesFromGlob', () => {
  given('[case1] a positive glob pattern', () => {
    when('[t0] glob matches multiple files', () => {
      then('returns all matched files sorted', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/**/*.ts`,
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/foo.ts`,
          `${ASSETS_PATH}/nested/qux.ts`,
        ]);
      });
    });

    when('[t1] glob matches zero files', () => {
      then('returns empty array', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/**/*.xyz`,
        });
        expect(files).toEqual([]);
      });
    });

    when('[t2] glob matches js files', () => {
      then('returns only js files', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/**/*.js`,
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/baz.js`,
          `${ASSETS_PATH}/nested/quux.js`,
        ]);
      });
    });
  });

  given('[case2] a negative glob pattern with ! prefix', () => {
    when('[t0] negative pattern excludes files', () => {
      then('returns files minus excluded', async () => {
        const files = await enumFilesFromGlob({
          glob: [`${ASSETS_PATH}/**/*.ts`, `!${ASSETS_PATH}/nested/**`],
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/foo.ts`,
        ]);
      });
    });
  });

  given('[case3] multiple glob patterns', () => {
    when('[t0] patterns are unioned', () => {
      then('returns deduplicated union', async () => {
        const files = await enumFilesFromGlob({
          glob: [`${ASSETS_PATH}/*.ts`, `${ASSETS_PATH}/*.js`],
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/baz.js`,
          `${ASSETS_PATH}/foo.ts`,
        ]);
      });
    });
  });

  given('[case4] a directory path instead of glob', () => {
    when('[t0] pattern is a directory without glob chars', () => {
      then('infers **/* and returns all files recursively', async () => {
        const files = await enumFilesFromGlob({
          glob: ASSETS_PATH,
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/baz.js`,
          `${ASSETS_PATH}/foo.ts`,
          `${ASSETS_PATH}/nested/quux.js`,
          `${ASSETS_PATH}/nested/qux.ts`,
        ]);
      });
    });

    when('[t1] pattern is a directory with slash suffix', () => {
      then('infers **/* and returns all files recursively', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/`,
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/baz.js`,
          `${ASSETS_PATH}/foo.ts`,
          `${ASSETS_PATH}/nested/quux.js`,
          `${ASSETS_PATH}/nested/qux.ts`,
        ]);
      });
    });

    when('[t2] pattern is a nested directory', () => {
      then('infers **/* for nested dir only', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/nested`,
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/nested/quux.js`,
          `${ASSETS_PATH}/nested/qux.ts`,
        ]);
      });
    });

    when('[t3] pattern has glob chars (not a plain dir)', () => {
      then('does not modify the pattern', async () => {
        const files = await enumFilesFromGlob({
          glob: `${ASSETS_PATH}/*.ts`,
        });
        // only root level ts files, not recursive
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/foo.ts`,
        ]);
      });
    });
  });

  given('[case5] symlink traversal to node_modules', () => {
    const SYMLINK_PATH =
      'src/domain.operations/review/.test/assets/example.symlink';

    when('[t0] glob pattern traverses symlink to node_modules', () => {
      then(
        'returns files through symlink (symlink paths not filtered)',
        async () => {
          // symlink path: via-symlink -> node_modules/test-fns/dist
          // the ignore pattern applies to the PATTERN path, not the resolved path
          // so symlinks to node_modules work correctly
          const files = await enumFilesFromGlob({
            glob: `${SYMLINK_PATH}/via-symlink/**/*.d.ts`,
          });
          // files through symlink are found
          expect(files.length).toBeGreaterThan(0);
          // all paths use the symlink path, not the resolved node_modules path
          expect(files.every((f) => f.startsWith(SYMLINK_PATH))).toBe(true);
          // no paths contain node_modules directly
          expect(files.every((f) => !f.includes('node_modules'))).toBe(true);
        },
      );
    });

    when('[t1] direct node_modules path in glob', () => {
      then('excludes files (node_modules filtered)', async () => {
        // direct node_modules paths are filtered by the ignore pattern
        const files = await enumFilesFromGlob({
          glob: 'node_modules/test-fns/**/*.d.ts',
        });
        // direct node_modules paths are always excluded
        expect(files).toEqual([]);
      });
    });

    when('[t2] glob pattern traverses symlink to regular directory', () => {
      then('returns files through symlink', async () => {
        // symlink path: via-symlink-rules -> ../example.repo/rules
        // .note = this tests that symlinks to non-node_modules directories work
        const files = await enumFilesFromGlob({
          glob: `${SYMLINK_PATH}/via-symlink-rules/**/*.md`,
        });
        // files through symlink are found
        expect(files.length).toBeGreaterThan(0);
        // all paths use the symlink path
        expect(files.every((f) => f.startsWith(SYMLINK_PATH))).toBe(true);
        // should find the rule files
        expect(files).toContain(
          `${SYMLINK_PATH}/via-symlink-rules/rule.no-any.md`,
        );
        expect(files).toContain(
          `${SYMLINK_PATH}/via-symlink-rules/rule.no-console.md`,
        );
      });
    });

    when('[t3] explicit file path through symlink to node_modules', () => {
      then(
        'returns the file (not filtered by node_modules ignore)',
        async () => {
          // .note = this tests explicit file paths through symlinks, not globs
          //         this is the pattern used when guards pass specific rule paths
          const files = await enumFilesFromGlob({
            glob: `${SYMLINK_PATH}/via-symlink/index.d.ts`,
          });
          // explicit file through symlink should be found
          expect(files).toContain(`${SYMLINK_PATH}/via-symlink/index.d.ts`);
        },
      );
    });
  });

  given('[case6] node_modules exclusion', () => {
    when('[t0] glob pattern scoped outside node_modules', () => {
      then('node_modules is excluded by default', async () => {
        // enumerate all .ts files from repo root
        // this should NOT traverse node_modules even though pattern is unbounded
        const files = await enumFilesFromGlob({
          glob: 'src/domain.operations/review/enumFilesFromGlob.ts',
        });
        // should find the source file
        expect(files).toContain(
          'src/domain.operations/review/enumFilesFromGlob.ts',
        );
        // should not contain any node_modules paths
        const nodeModulesFiles = files.filter((f) =>
          f.includes('node_modules'),
        );
        expect(nodeModulesFiles).toEqual([]);
      });
    });

    when('[t1] recursive glob from repo root', () => {
      then('excludes node_modules from traversal', async () => {
        // enumerate files with broad pattern
        const files = await enumFilesFromGlob({
          glob: 'src/domain.operations/review/*.ts',
        });
        // should find source files
        expect(files.length).toBeGreaterThan(0);
        // should not contain any node_modules paths
        const nodeModulesFiles = files.filter((f) =>
          f.includes('node_modules'),
        );
        expect(nodeModulesFiles).toEqual([]);
      });
    });

    when('[t2] unbounded glob, default shape (no gitignore)', () => {
      // .note = hermetic, never the repo root: the default shape prunes no gitignored
      //         dir, so from this repo's root it walks every ignored tree (a measured
      //         95s over ~1M files, per enumFilesFromGlob.ts). what the default DOES
      //         guarantee is the hardcoded node_modules + .git exclusion, so that is
      //         what this pins, on a tree small enough to walk in milliseconds
      const cwd = genTempDir({ slug: 'enum-glob-default-shape', git: true });
      fs.writeFileSync(path.join(cwd, '.gitignore'), 'ignored/\n');
      fs.writeFileSync(path.join(cwd, 'keep.json'), '{}\n');
      ['node_modules/pkg', '.git', 'ignored'].forEach((dir) => {
        fs.mkdirSync(path.join(cwd, dir), { recursive: true });
        fs.writeFileSync(path.join(cwd, dir, 'junk.json'), '{}\n');
      });

      // .note = wrapped in an object, since useThen's proxy does not forward array methods
      const walk = useThen('the walk returns', async () => ({
        files: await enumFilesFromGlob({ glob: '**/*.json', cwd }),
      }));

      then('excludes node_modules and .git from traversal', () => {
        expect(walk.files).not.toContain('node_modules/pkg/junk.json');
        expect(walk.files).not.toContain('.git/junk.json');
        expect(walk.files).toContain('keep.json');
      });

      then('keeps gitignored files (no gitignore filter by default)', () => {
        expect(walk.files).toContain('ignored/junk.json');
      });
    });

    when('[t3] unbounded root glob, subject shape (gitignore: true)', () => {
      then('excludes node_modules from traversal', async () => {
        // unbounded glob would OOM without node_modules exclusion
        // .note = gitignore: true, since an unbounded root glob is the SUBJECT shape
        //         (enumFilesForReviewSubjects); supplies are explicitly pointed
        //         at their dirs (enumFilesForReviewSupplies) and never unbounded
        const files = await enumFilesFromGlob({
          glob: '**/*.json',
          gitignore: true,
        });
        // should find package.json at minimum
        expect(files).toContain('package.json');
        // must not contain any node_modules paths
        expect(files.some((f) => f.includes('node_modules'))).toBe(false);
      });
    });
  });

  given('[case7] git-ignored dirs whose walk would never end', () => {
    // two self-links fan the walk out 2^depth until ELOOP (~40 levels), so any walk
    // that descends either ignored dir hangs; only a walk that prunes both returns
    // .note = the second ignored dir carries glob metacharacters in its name, so its
    //         prune pattern only holds if the name is escaped
    const cwd = genTempDir({ slug: 'enum-glob-prune-ignored', git: true });
    // .note = gitignore reads `[y]` as a char class, so the brackets are escaped there too
    fs.writeFileSync(
      path.join(cwd, '.gitignore'),
      'heavy/\nodd (x)\\[y\\]{z}/\n',
    );
    fs.writeFileSync(path.join(cwd, 'keep.json'), '{}\n');
    ['heavy', 'odd (x)[y]{z}'].forEach((dir) => {
      fs.mkdirSync(path.join(cwd, dir), { recursive: true });
      fs.writeFileSync(path.join(cwd, dir, 'junk.json'), '{}\n');
      fs.symlinkSync('.', path.join(cwd, dir, 'loop-a'));
      fs.symlinkSync('.', path.join(cwd, dir, 'loop-b'));
    });

    when('[t0] an unbounded subject glob runs from the repo root', () => {
      then(
        'it prunes the ignored dir and returns only kept files',
        async () => {
          // race the walk against a deadline, so a descent fails fast, not at the suite timeout
          const deadline = new Promise<'deadline'>((settle) =>
            setTimeout(() => settle('deadline'), 15_000).unref(),
          );
          const outcome = await Promise.race([
            enumFilesFromGlob({ glob: '**/*.json', cwd, gitignore: true }),
            deadline,
          ]);
          expect(outcome).toEqual(['keep.json']);
        },
      );
    });
  });

  given('[case8] a mode-000 git-ignored dir inside the scope', () => {
    // 🔴 the prune pattern `junk/**` must never be stat'd. globby's own directory
    //    expansion ran dir-glob over every ignore entry, which stats the literal pattern
    //    text, and a path under a mode-000 dir cannot be stat'd — so the walk crashed
    //    with EACCES on the very dir it was told to skip
    // .note = the same shape the review.gitignore-subjects acceptance drives
    const cwd = genTempDir({ slug: 'enum-glob-restricted-ignored', git: true });
    fs.writeFileSync(path.join(cwd, '.gitignore'), 'junk/\n');
    fs.mkdirSync(path.join(cwd, 'src', 'junk'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'src', 'keep.ts'), 'export {};\n');
    fs.writeFileSync(path.join(cwd, 'src', 'junk', 'secret.ts'), 'x\n');
    fs.chmodSync(path.join(cwd, 'src', 'junk'), 0o000);

    // restore the mode so the temp dir can be cleaned
    afterAll(() => fs.chmodSync(path.join(cwd, 'src', 'junk'), 0o755));

    when('[t0] a subject glob walks the scope', () => {
      then(
        'git names the restricted dir as ignored (the prune list holds it)',
        () => {
          // precondition: without this, the clamp below would never reach the stat
          const ignored = execSync(
            'git ls-files -z --others --ignored --exclude-standard --directory',
            { cwd, encoding: 'utf-8' },
          ).split('\0');
          expect(ignored).toContain('src/junk/');
        },
      );

      then('the restricted dir is in fact unreadable to this process', () => {
        // precondition: a process that bypasses mode bits never meets EACCES at all
        expect(() => fs.readdirSync(path.join(cwd, 'src', 'junk'))).toThrow(
          /EACCES/,
        );
      });

      then(
        'it skips the restricted dir and returns the readable file',
        async () => {
          // 🔴 the process cwd must be the scanned repo, as it is for the cli. globby's
          //    ignore expansion stats each entry against PROCESS cwd, never the glob cwd,
          //    so from the jest root the stat met ENOENT and the defect hid. the temp dir
          //    is its own git root; the chdir is restored before the assertion
          const cwdPrior = process.cwd();
          process.chdir(cwd);
          const files = await enumFilesFromGlob({
            glob: 'src/**/*.ts',
            cwd,
            gitignore: true,
          }).finally(() => process.chdir(cwdPrior));
          expect(files).toEqual(['src/keep.ts']);
        },
      );
    });
  });

  given('[case9] a negative pattern that names a bare directory', () => {
    // the exclude side expands a bare dir itself (globby's expansion is off), so
    // `!dir` still prunes every file under dir
    when('[t0] the dir is excluded by name, with no glob chars', () => {
      then('no file under it is returned', async () => {
        const files = await enumFilesFromGlob({
          glob: [`${ASSETS_PATH}/**/*.ts`, `!${ASSETS_PATH}/nested`],
        });
        expect(files).toEqual([
          `${ASSETS_PATH}/bar.ts`,
          `${ASSETS_PATH}/foo.ts`,
        ]);
      });
    });
  });
});
