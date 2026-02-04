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
});
