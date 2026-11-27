import * as path from 'path';

/**
 * .what = the absolute path of the rhachet cli this package runs against: its peer's `bin/run`
 * .why = `npx rhachet` looks up from the cwd, and a cwd with no `node_modules` (a temp repo, a
 *        fresh clone) finds no rhachet; npx then falls back to the registry or a host cache. the
 *        peer this package finds from its own path is the one it was built against, on every host
 * .note = the node lookup api is named `require.resolve`; no other name exists for it
 */
export const getOneRhachetBinPath = (): string =>
  path.join(
    path.dirname(require.resolve('rhachet/package.json')),
    'bin',
    'run',
  );
