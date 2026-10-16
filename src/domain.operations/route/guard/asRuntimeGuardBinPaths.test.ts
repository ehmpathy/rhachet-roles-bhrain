import { given, then, when } from 'test-fns';

import { asRuntimeGuardBinPaths } from './asRuntimeGuardBinPaths';

describe('asRuntimeGuardBinPaths', () => {
  given('[case1] a repo root', () => {
    when('[t0] the bin paths are cast', () => {
      const paths = asRuntimeGuardBinPaths({ repoRoot: '/repo' });

      then('$rhx expands to the repo-local rhx bin', () => {
        expect(paths.rhx).toEqual('/repo/node_modules/.bin/rhx');
      });

      then('$rhachet expands to the repo-local rhachet bin', () => {
        expect(paths.rhachet).toEqual('/repo/node_modules/.bin/rhachet');
      });
    });
  });
});
