import { given, then, when } from 'test-fns';

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

    when('[t2] unbounded glob from repo root', () => {
      then('excludes node_modules from traversal', async () => {
        // unbounded glob would OOM without node_modules exclusion
        const files = await enumFilesFromGlob({
          glob: '**/*.json',
        });
        // should find package.json at minimum
        expect(files).toContain('package.json');
        // must not contain any node_modules paths
        expect(files.some((f) => f.includes('node_modules'))).toBe(false);
      });
    });
  });
});
