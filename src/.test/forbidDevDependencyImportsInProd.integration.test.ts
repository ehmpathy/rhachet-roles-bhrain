import { builtinModules } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = clamp: every package a shipped `src/` file imports at runtime is a `dependencies` or a
 *         `peerDependencies` entry, never a `devDependencies` entry alone
 * .why = a consumer installs this package's dependencies and peers, never its dev deps. a
 *        runtime import of a dev-only package works here (the dev tree is installed) and fails at
 *        the consumer with `Cannot find module`. an upgrade once moved `rhachet-artifact-git` to
 *        dev while route and review code imported it; this case turns that move red
 *
 * .note = "shipped" mirrors `tsconfig.build.json`: every `src/**\/*.ts` but tests, `.test/`,
 *         `.scratch/`, and `__test*__/`
 * .note = an `import type` is erased at compile, so it needs no runtime install
 * .note = a filesystem read, so it is an integration test (rule.forbid.unit.remote-boundaries)
 */
const ROOT_OF_REPO = path.join(__dirname, '../..');

/**
 * .what = packages a shipped file may load though no consumer is made to install them
 * .why = each is loaded by a dynamic `import()` whose absent-module fault is caught and read as
 *        an empty answer, so a consumer without it runs on. named here, narrowly, with the file
 */
const PACKAGES_OPTIONAL: Record<string, string> = {
  // getAllTokenRatesByModel: absent → no versioned anthropic stubs; its models render unpriced
  'rhachet-brains-anthropic':
    'src/domain.operations/reflect/tokens/getAllTokenRatesByModel.ts',
};

/** .what = dir names never walked: dev-only trees and build output */
const DIRS_SKIPPED = new Set([
  'node_modules',
  'dist',
  '.test',
  '.scratch',
  '.temp',
  '.log',
]);

/**
 * .what = whether a file is one the build ships
 */
const isFileShipped = (input: { name: string }): boolean =>
  input.name.endsWith('.ts') &&
  !input.name.endsWith('.d.ts') &&
  !input.name.endsWith('.test.ts');

/**
 * .what = every shipped `.ts` file under a dir, recursively
 */
const getAllFilesShippedUnder = (input: { dir: string }): string[] =>
  fs
    .readdirSync(input.dir, { withFileTypes: true })
    .filter((entry) => !DIRS_SKIPPED.has(entry.name))
    .filter((entry) => !entry.name.startsWith('__test'))
    .flatMap((entry) => {
      const at = path.join(input.dir, entry.name);
      if (entry.isDirectory()) return getAllFilesShippedUnder({ dir: at });
      return entry.isFile() && isFileShipped({ name: entry.name }) ? [at] : [];
    });

/**
 * .what = every module specifier a source imports at runtime
 * .why = static `import … from`, a side-effect `import '…'`, `export … from`, `require(…)`, and
 *        `import(…)`; an `import type` / `export type` is erased, so it is left out
 */
const asAllRuntimeSpecifiers = (input: { source: string }): string[] => {
  const statics = [
    ...input.source.matchAll(
      /^\s*(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/gm,
    ),
  ].map((match) => match[1] ?? '');
  const calls = [
    ...input.source.matchAll(/(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((match) => match[1] ?? '');
  return [...statics, ...calls].filter((specifier) => specifier.length > 0);
};

/**
 * .what = the package a bare specifier resolves to, or null for a local or builtin one
 * .why = `@scope/pkg/sub` → `@scope/pkg`; `pkg/sub` → `pkg`; `./x`, `@src/x`, `node:fs`, `fs` → null
 */
const asPackageOfSpecifier = (input: { specifier: string }): string | null => {
  const { specifier } = input;
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('@src/')) return null;
  if (specifier.startsWith('node:')) return null;
  const [head, next] = specifier.split('/');
  const name = head?.startsWith('@') ? `${head}/${next}` : (head ?? '');
  if (builtinModules.includes(name)) return null;
  return name;
};

describe('forbidDevDependencyImportsInProd', () => {
  given('[case1] the shipped src tree and package.json', () => {
    when('[t0] every runtime import is read', () => {
      const scene = useThen('the tree is read', () => {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(ROOT_OF_REPO, 'package.json'), 'utf-8'),
        ) as {
          name: string;
          dependencies?: Record<string, string>;
          peerDependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const installed = new Set([
          manifest.name,
          ...Object.keys(manifest.dependencies ?? {}),
          ...Object.keys(manifest.peerDependencies ?? {}),
        ]);
        const files = getAllFilesShippedUnder({
          dir: path.join(ROOT_OF_REPO, 'src'),
        });
        const offenders = files.flatMap((file) =>
          asAllRuntimeSpecifiers({ source: fs.readFileSync(file, 'utf-8') })
            .map((specifier) => asPackageOfSpecifier({ specifier }))
            .filter((name): name is string => name !== null)
            .filter((name) => !installed.has(name))
            .map((name) => ({
              file: path.relative(ROOT_OF_REPO, file),
              package: name,
              devOnly: name in (manifest.devDependencies ?? {}),
            }))
            .filter((row) => PACKAGES_OPTIONAL[row.package] !== row.file),
        );
        return { files, offenders };
      });

      then('the scan reads the shipped tree', () => {
        // an empty walk would pass every row below
        expect(scene.files.length).toBeGreaterThan(100);
      });

      then('no shipped file imports a package a consumer would not install', () => {
        // each row names the file and the package: move the package to `dependencies`
        // (or `peerDependencies`), or make the import `import type` if it is a type alone
        expect(scene.offenders).toEqual([]);
      });
    });
  });
});
