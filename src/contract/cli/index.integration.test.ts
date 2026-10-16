import { execFileSync } from 'child_process';
import path from 'path';
import { given, then, useThen, when } from 'test-fns';

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

/**
 * .what = the cli modules a fresh process loads when it imports the aggregate
 * .why = a jest registry cannot report a lazy load, so a real node process (via tsx) is asked
 *        which `src/contract/cli/` files sit in its require cache after the import
 */
const getAllCliModulesLoadedByAggregateImport = (): string[] => {
  const probe = [
    `require('./src/contract/cli/index.ts');`,
    `const all = Object.keys(require.cache);`,
    `const cli = all.filter((key) => key.includes('/src/contract/cli/'));`,
    `process.stdout.write(JSON.stringify(cli.map((key) => key.split('/src/contract/cli/')[1])));`,
  ].join(' ');
  const stdout = execFileSync(
    path.join(REPO_ROOT, 'node_modules', '.bin', 'tsx'),
    ['-e', probe],
    { cwd: REPO_ROOT, encoding: 'utf-8' },
  );
  return JSON.parse(stdout);
};

/**
 * .what = the cli modules a fresh process holds after it CALLS each lazy member with `--help`
 * .why = the negative probe proves the import loads no brain module; this proves the other
 *        half — that each lazy member resolves its dynamic import and runs. a typo in a
 *        specifier, or a member renamed in its source module, leaves the negative probe green
 *        and breaks every consumer that calls `cli.review()`
 *
 * .note = `--help` returns from each command before any brain call, and `console.log` is
 *         muted so the help text cannot corrupt the JSON on stdout
 */
const getAllCliModulesLoadedByLazyMemberCalls = (): string[] =>
  JSON.parse(
    execFileSync(
      path.join(REPO_ROOT, 'node_modules', '.bin', 'tsx'),
      [
        '-e',
        [
          `const { cli } = require('./src/contract/cli/index.ts');`,
          `process.argv = [process.argv[0], 'cli', '--help'];`,
          `console.log = () => undefined;`,
          `(async () => {`,
          `  await cli.review();`,
          `  await cli.reviewBy();`,
          `  await cli.reflect();`,
          `  const all = Object.keys(require.cache);`,
          `  const mods = all.filter((key) => key.includes('/src/contract/cli/'));`,
          `  process.stdout.write(JSON.stringify(mods.map((key) => key.split('/src/contract/cli/')[1])));`,
          `})();`,
        ].join(' '),
      ],
      { cwd: REPO_ROOT },
    ).toString(),
  );

describe('index.integration', () => {
  given('[case1] each lazy member of the aggregate, called with --help', () => {
    when('[t0] a fresh process calls review, reviewBy, and reflect', () => {
      const loaded = useThen('every call returns', async () => ({
        modules: getAllCliModulesLoadedByLazyMemberCalls(),
      }));

      then(
        '🔴 each brain-bound command module is loaded by its own call',
        () => {
          expect(loaded.modules).toContain('review.ts');
          expect(loaded.modules).toContain('review.by.ts');
          expect(loaded.modules).toContain('reflect.ts');
        },
      );
    });
  });

  given('[case2] the aggregate cli module', () => {
    when('[t0] a fresh process imports it', () => {
      const loaded = useThen('the import succeeds', async () => ({
        modules: getAllCliModulesLoadedByAggregateImport(),
      }));

      then('the aggregate itself is loaded', () => {
        expect(loaded.modules).toContain('index.ts');
      });

      then('no brain-bound command module is loaded by the import', () => {
        expect(loaded.modules).not.toContain('review.ts');
        expect(loaded.modules).not.toContain('review.by.ts');
        expect(loaded.modules).not.toContain('reflect.ts');
      });
    });
  });
});
